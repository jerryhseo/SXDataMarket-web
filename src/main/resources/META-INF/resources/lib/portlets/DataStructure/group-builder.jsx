import React from "react";
import { SXModalUtil } from "../../stationx/modal";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamType, ValidationRule } from "../../stationx/station-x";
import DataStructure from "./data-structure";
import { SXLabel } from "../Form/form";
import Form, { ClaySelectWithOption } from "@clayui/form";
import { Table, Head, Body, Cell, Row } from "@clayui/core";
import Icon from "@clayui/icon";
import { ParameterUtil } from "../Parameter/parameters";
import SXBasePropertiesPanelComponent from "./base-properties-panel-component";
import SXActionDropdown from "../../stationx/dropdown";

class SXGroupBuilder extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.groupParam = props.groupParam;
		console.log("[SXGroupBuilder] constructor: ", this.dataStructure);

		this.availableParamTypes = props.availableParamTypes;
		this.memberDisplayType = props.memberDisplayType;

		this.componentId = this.namespace + "SXGroupBuilder";

		this.state = {
			selectedMember: this.groupParam.getMember(0),
			confirmDlgState: false,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: <></>
		};

		this.memberReadyTypes = [
			{
				label: Util.translate("select-to-add-member"),
				value: ""
			},
			...this.availableParamTypes.map((paramType) => ({
				label: paramType,
				value: paramType
			}))
		];

		this.fieldMemberCode = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "memberCode",
				displayName: Util.getTranslationObject(this.languageId, "member-code"),
				tooltip: Util.getTranslationObject(this.languageId, "member-code-tooltip"),
				placeholder: Util.getTranslationObject(this.languageId, "code-name-for-member"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VARIABLE,
						message: Util.getTranslationObject(this.languageId, "invalid-code"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 3,
						message: Util.getTranslationObject(this.languageId, "shorter-than", 3),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than", 32),
						errorClass: ErrorClass.ERROR
					}
				},
				value: this.state.selectedMember ? this.state.selectedMember.paramCode : ""
			}
		});
		this.fieldMemberDisplayName = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "memberDisplayName",
				displayName: Util.getTranslationObject(this.languageId, "display-name"),
				tooltip: Util.getTranslationObject(this.languageId, "display-name-tooltip"),
				placeholder: Util.getTranslationObject(this.languageId, "translation-for-display-name"),
				localized: true,
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 6,
						message: Util.getTranslationObject(this.languageId, "shorter-than", 6),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "longer-than", 64),
						errorClass: ErrorClass.ERROR
					}
				},
				value: this.state.selectedMember ? this.state.selectedMember.displayName : {}
			}
		});

		this.copyMember = this.copyMember.bind(this);
	}

	listenerFieldValueChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		} else {
			if (dataPacket.targetFormId == this.componentId) {
				console.log(
					"SXGroupBuilder SX_FIELD_VALUE_CHANGED: ",
					dataPacket,
					this.state.selectedMember,
					this.fieldMemberCode,
					this.fieldMemberDisplayName
				);

				if (dataPacket.parameter.hasError()) {
					this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
					return;
				}

				switch (dataPacket.paramCode) {
					case "memberCode": {
						let duplicated = false;

						this.state.selectedMember.paramCode = this.fieldMemberCode.getValue();
						duplicated = this.dataStructure.checkDuplicateParam(this.state.selectedMember);

						if (duplicated) {
							this.fieldMemberCode.setError(
								ErrorClass.ERROR,
								Util.translate("parameter-code-must-be-unique")
							);
							this.fieldMemberCode.fireRefresh();

							this.dataStructure.setError(
								ErrorClass.ERROR,
								Util.translate("parameter-code-must-be-unique")
							);

							return;
						}
						this.state.selectedMember.refreshKey();
						break;
					}
					case "memberDisplayName": {
						this.state.selectedMember.displayName = this.fieldMemberDisplayName.getValue();
						this.state.selectedMember.refreshKey();
						break;
					}
				}
			}
		}

		const error = this.checkError();
		if (Util.isEmpty(error)) {
			this.dataStructure.clearError();
		} else {
			this.dataStructure.setError(error.errorClass, error.errorMessage);

			return;
		}

		if (this.groupParam.isRendered()) {
			this.groupParam.fireRefreshPreview();
		}

		this.forceUpdate();
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			console.log("listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}
		console.log("listenerPopActionClicked: ", dataPacket);
		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));
			return;
		}

		switch (dataPacket.action) {
			case "copy": {
				this.copyMember(dataPacket.data);

				break;
			}
			case "delete": {
				this.removeMember(dataPacket.data);

				break;
			}
			case "up": {
				this.moveMemberUp(dataPacket.data);

				break;
			}
			case "down": {
				this.moveMemberDown(dataPacket.data);

				break;
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	checkError() {
		const error = DataStructure.checkError([this.fieldMemberCode, this.fieldMemberDisplayName]);

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
		}

		return error;
	}

	openErrorDlg(message) {
		this.setState({
			confirmDlgState: true,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: message
		});
	}

	moveMemberUp = (index) => {
		this.groupParam.moveMemberUp(index);

		this.groupParam.fireRefreshPreview();

		this.forceUpdate();
	};

	moveMemberDown = (index) => {
		this.groupParam.moveMemberDown(index);

		this.groupParam.fireRefreshPreview();

		this.forceUpdate();
	};

	removeMember = (index) => {
		let memberCount = this.groupParam.removeMember({ memOrder: index });

		const firstMember = memberCount > 0 ? this.groupParam.members[0] : null;

		this.setState({ selectedMember: firstMember });

		this.groupParam.fireRefreshPreview();

		this.forceUpdate();
	};

	copyMember(index) {
		let copied = this.groupParam.copyMember({ memOrder: index });
		this.groupParam.fireRefreshPreview();

		this.setState({ selectedMember: copied });
	}

	setMemberPropertyFields(member) {
		this.fieldMemberCode.setValue({ value: member.paramCode });
		this.fieldMemberCode.refreshKey();
		this.fieldMemberDisplayName.setValue({ value: member.displayName });
		this.fieldMemberDisplayName.refreshKey();
	}

	handleMemberSelected = (member) => {
		if (member == this.state.selectedMember) {
			return;
		}

		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));
			return;
		}

		this.setMemberPropertyFields(member);

		this.setState({ selectedMember: member });
	};

	handleMemberTypeSelect(memberType) {
		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));
			return;
		}

		const member = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.groupParam.componentId,
			paramType: memberType,
			properties: {
				paramCode: "member_" + Util.randomKey(8),
				displayType: this.memberDisplayType
			}
		});

		this.groupParam.addMember(member);
		member.displayName = Util.getTranslationObject(
			this.languageId,
			"member_" + member.order.toString().padStart(2, "0")
		);

		this.setMemberPropertyFields(member);

		this.groupParam.fireRefreshPreview();

		this.setState({ selectedMember: member });
	}

	render() {
		return (
			<>
				<div className="sx-option-builder-title">{Util.translate("group-builder")}</div>
				<Form.Group className="form-group-sm">
					<SXLabel
						label={Util.translate("add-member")}
						forHtml={this.namespace + "memberType"}
						tooltip={Util.translate("add-member-tooltip")}
						spritemap={this.spritemap}
					/>
					<div style={{ paddingLeft: "10px" }}>
						<ClaySelectWithOption
							aria-label={Util.translate("member-type")}
							id={this.namespace + "memberType"}
							options={this.memberReadyTypes}
							value={this.state.selectedMember ? this.state.selectedMember.paramType : ""}
							onChange={(e) => {
								this.handleMemberTypeSelect(e.target.value);
							}}
							style={{ paddingLeft: "10px" }}
							spritemap={this.spritemap}
						/>
					</div>
				</Form.Group>
				{this.groupParam.memberCount > 0 && (
					<>
						{this.fieldMemberCode.renderField({ spritemap: this.spritemap })}
						{this.fieldMemberDisplayName.renderField({ spritemap: this.spritemap })}
					</>
				)}
				<div className="sx-option-builder-label">
					<SXLabel
						label={Util.translate("group-members")}
						forHtml=""
						required={true}
						style={{
							fontWeight: "600",
							fontSize: "0.875rem"
						}}
						spritemap={this.spritemap}
					/>
				</div>
				<Table
					columnsVisibility={false}
					borderedColumns={false}
					size="sm"
					hover={false}
					striped={false}
					className="sx-option-table"
				>
					<Head
						items={[
							{ id: "label", name: Util.translate("display-name"), width: "auto" },
							{ id: "type", name: Util.translate("type"), width: "7rem" },
							{ id: "actions", name: "actions", width: "3.5rem" }
						]}
					>
						{(column) => {
							if (column.id == "actions") {
								return (
									<Cell
										key={column.id}
										textValue="actions"
										textAlign="center"
										width={column.width}
									>
										<Icon
											symbol="ellipsis-v"
											spritemap={this.spritemap}
										/>
									</Cell>
								);
							} else {
								return (
									<Cell
										key={column.id}
										textAlign="center"
										width={column.width}
									>
										{column.name}
									</Cell>
								);
							}
						}}
					</Head>
					<Body defaultItems={this.groupParam.members}>
						{(member, index) => {
							let actionItems = [
								{ id: "copy", name: Util.translate("copy"), symbol: "copy" },
								{
									id: "delete",
									name: Util.translate("delete"),
									symbol: "times"
								}
							];
							if (member.order > 1) {
								actionItems.push({
									id: "up",
									name: Util.translate("move-up"),
									symbol: "caret-top"
								});
							}
							if (member.order < this.groupParam.memberCount) {
								actionItems.push({
									id: "down",
									name: Util.translate("move-down"),
									symbol: "caret-bottom"
								});
							}

							const selected = member == this.state.selectedMember;
							const selectedColor = "#fae6ecff";

							return (
								<Row
									key={member.paramCode}
									onClick={(e) => this.handleMemberSelected(member)}
								>
									<Cell textAlign="center">
										<div
											style={{
												backgroundColor: selected ? selectedColor : "inherit",
												width: "100%"
											}}
										>
											{member.label}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div
											style={{
												backgroundColor: selected ? selectedColor : "inherit",
												width: "100%"
											}}
										>
											{member.paramType}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div
											style={{
												backgroundColor: selected ? selectedColor : "inherit",
												width: "100%"
											}}
										>
											<SXActionDropdown
												key={this.groupParam.members.length - index}
												namespace={this.namespace}
												formId={this.componentId}
												actionItems={actionItems}
												triggerType="icon"
												dataKey={index}
												symbol="ellipsis-v"
												spritemap={this.spritemap}
											/>
										</div>
									</Cell>
								</Row>
							);
						}}
					</Body>
				</Table>
				{this.state.confirmDlgState && (
					<SXModalDialog
						header={this.state.confirmDlgHeader}
						body={this.state.confirmDlgBody}
						buttons={[
							{
								onClick: () => {
									this.setState({ confirmDlgState: false });
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="info"
						spritemap={this.spritemap}
					/>
				)}
			</>
		);
	}
}

export default SXGroupBuilder;
