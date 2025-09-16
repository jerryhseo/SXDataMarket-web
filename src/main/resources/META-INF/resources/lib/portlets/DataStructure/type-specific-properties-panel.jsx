import React from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamProperty, ParamType, ValidationRule } from "../../stationx/station-x";
import SXFormField, { SXDualListBox, SXInput, SXLabel } from "../../stationx/form";
import {
	AddressParameter,
	BooleanParameter,
	GroupParameter,
	Parameter,
	SelectParameter
} from "../../stationx/parameter";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { Table, Head, Body, Cell, Icon, Row } from "@clayui/core";
import Form, { ClayInput, ClaySelectWithOption } from "@clayui/form";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXActionDropdown from "../../stationx/dropdown";

class SXGroupBuilder extends React.Component {
	constructor(props) {
		super(props);

		this.dataStructure = props.dataStructure;
		this.groupParam = props.groupParam;
		console.log("SXGroupBuilder constructor: ", this.dataStructure);

		this.namespace = this.groupParam.namespace;
		this.languageId = this.groupParam.languageId;
		this.availableLanguageIds = this.groupParam.availableLanguageIds;
		this.spritemap = props.spritemap;
		this.availableParamTypes = props.availableParamTypes;
		this.memberDisplayType = props.memberDisplayType;

		this.formId = this.namespace + "groupBuilder";

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

		this.fieldMemberCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);
		this.fieldMemberDisplayName = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);

		this.copyMember = this.copyMember.bind(this);
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		} else {
			if (dataPacket.targetFormId == this.formId) {
				console.log(
					"SXGroupBuilder SX_FIELD_VALUE_CHANGED: ",
					dataPacket,
					this.state.selectedMember,
					this.fieldMemberCode,
					this.fieldMemberDisplayName
				);

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
							this.fieldMemberCode.refreshKey();

							this.groupParam.setError(ErrorClass.ERROR, Util.translate("parameter-code-must-be-unique"));
						} else {
							this.fieldMemberCode.clearError();
							this.groupParam.clearError();
						}
						this.state.selectedMember.refreshKey();

						this.forceUpdate();
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

		if (this.groupParam.isRendered()) {
			this.groupParam.fireRefreshPreview();
		}

		this.forceUpdate();
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}
		console.log("listenerPopActionClicked: ", dataPacket);

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
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
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

		if (this.groupParam.hasError()) {
			this.setState({
				confirmDlgState: true,
				confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
				confirmDlgBody: Util.translate("fix-the-error-first", this.groupParam.errorMessage)
			});

			return;
		}

		this.setMemberPropertyFields(member);
		/*
		this.fieldMemberCode.setValue({ value: member.paramCode });
		this.fieldMemberCode.refreshKey();
		this.fieldMemberDisplayName.setValue({ value: member.displayName });
		this.fieldMemberDisplayName.refreshKey();
		*/

		this.setState({ selectedMember: member });
	};

	handleMemberTypeSelect(memberType) {
		if (this.groupParam.hasError()) {
			this.setState({
				confirmDlgState: true,
				confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
				confirmDlgBody: Util.translate("fix-the-error-first", this.workingParam.errorMessage)
			});

			return;
		}

		const member = Parameter.createParameter(
			this.namespace,
			this.groupParam.tagName,
			this.languageId,
			this.availableLanguageIds,
			memberType,
			{
				paramCode: "member_" + Util.randomKey(8),
				displayType: this.memberDisplayType
			}
		);

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
												formId={this.formId}
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

class SXSelectOptionBuilder extends React.Component {
	constructor(props) {
		super(props);

		this.workingParam = props.workingParam;

		this.namespace = this.workingParam.namespace;
		this.formIds = props.formIds;
		this.languageId = this.workingParam.languageId;
		this.availableLanguageIds = this.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.selectedOption = this.workingParam.getOption(0) ?? {};
		this.setWorkingOption();

		this.state = {
			optionValueDuplicated: false
		};

		this.formId = this.namespace + "selectOptionBuilder";

		this.fieldOptionLabel = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "optionLabel",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "option-label"),
				placeholder: Util.getTranslationObject(this.languageId, "option-label"),
				value: this.selectedOption.label ?? {}
			}
		);

		this.fieldOptionValue = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "optionValue",
				displayName: Util.getTranslationObject(this.languageId, "option-value"),
				placeholder: Util.getTranslationObject(this.languageId, "option-value"),
				value: this.selectedOption.value ?? ""
			}
		);
	}

	listenerFieldValueChanged = (event) => {
		console.log(
			"SXSelectOptionBuilder SX_FIELD_VALUE_CHANGED before: ",
			event.dataPacket.parameter,
			event.dataPacket.parameter.getValue(),
			this.selectedOption
		);

		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			return;
		}

		console.log(
			"SXSelectOptionBuilder SX_FIELD_VALUE_CHANGED: ",
			dataPacket.parameter,
			dataPacket.parameter.getValue(),
			this.selectedOption
		);

		if (dataPacket.paramCode == "optionLabel") {
			this.workingOption.label = this.fieldOptionLabel.getValue();
		} else {
			const value = this.fieldOptionValue.getValue();

			const duplicated = this.workingParam.checkDuplicatedOptionValue(value);
			if (duplicated) {
				this.fieldOptionValue.setError(
					ErrorClass.ERROR,
					Util.translate("the-option-value-exists-already-try-another-value")
				);
				this.setState({
					optionValueDuplicated: true
				});
			} else {
				this.workingOption.value = this.fieldOptionValue.getValue();
			}
		}

		this.forceUpdate();
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			return;
		}

		console.log("SXSelectOptionBuilder listenerPopActionClicked: ", dataPacket);
		switch (dataPacket.action) {
			case "copy": {
				this.copyOption(dataPacket.data);

				break;
			}
			case "delete": {
				this.removeOption(dataPacket.data);

				break;
			}
			case "up": {
				this.moveOptionUp(dataPacket.data);

				break;
			}
			case "down": {
				this.moveOptionDown(dataPacket.data);

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

	setWorkingOption = () => {
		this.workingOption = Util.isEmpty(this.selectedOption) ? {} : this.selectedOption;
	};

	handleNewOption() {
		this.workingOption = {};
		this.selectedOption = {};

		this.fieldOptionLabel.setValue({ value: {} });
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.setValue({ value: "" });
		this.fieldOptionValue.refreshKey();

		this.forceUpdate();
	}

	handleAddOption() {
		console.log("handleAddOption: ", this.workingOption);
		const optionLength = this.workingParam.addOption(this.workingOption);
		this.selectedOption = this.workingOption;
		if (optionLength.length == 0) {
			return;
		}

		this.workingParam.fireRefreshPreview();

		this.forceUpdate();
	}

	copyOption = (index) => {
		this.workingOption = this.selectedOption = this.workingParam.copyOption(index);

		this.workingParam.fireRefreshPreview();
		this.forceUpdate();
	};

	moveOptionUp = (index) => {
		this.workingParam.moveOptionUp(index);

		this.workingParam.fireRefreshPreview();

		this.forceUpdate();
	};

	moveOptionDown = (index) => {
		this.workingParam.moveOptionDown(index);

		this.workingParam.fireRefreshPreview();

		this.forceUpdate();
	};

	removeOption = (index) => {
		this.workingParam.removeOption(index);
		this.fieldOptionLabel.setValue({ value: {} });
		this.fieldOptionValue.setValue({ value: "" });
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.refreshKey();

		this.workingParam.fireRefreshPreview();

		this.selectedOption = {};
		this.workingOption = {};

		this.forceUpdate();
	};

	handleOptionSelected(option) {
		this.fieldOptionLabel.setValue({ value: option.label });
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.setValue({ value: option.value });
		this.fieldOptionValue.refreshKey();

		this.workingOption = this.selectedOption = option;

		this.forceUpdate();
	}

	render() {
		console.log(
			"SXSelectOptionBuilder render: ",
			this.selectedOption,
			Util.isNotEmpty(this.selectedOption),
			!(this.fieldOptionLabel.hasValue() && this.fieldOptionValue.hasValue())
		);

		return (
			<>
				<div className="sx-option-builder-title">{Util.translate("option-builder")}</div>
				<div className="sx-option-builder-label">
					<SXLabel
						label={Util.translate("options")}
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
							{ id: "label", name: Util.translate("label"), width: "auto" },
							{ id: "value", name: Util.translate("value"), width: "6rem" },
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
					<Body defaultItems={this.workingParam.options}>
						{(option, index) => {
							let actionItems = [
								{
									id: "copy", //
									name: Util.translate("copy"),
									symbol: "copy",
									action: this.copyOption
								},
								{
									id: "delete", //
									name: Util.translate("delete"),
									symbol: "times",
									action: this.removeOption
								}
							];
							if (index > 0) {
								actionItems.push({
									id: "up",
									name: Util.translate("moveUp"),
									symbol: "order-arrow-up",
									action: this.moveOptionUp
								});
							}
							if (index < this.workingParam.options.length - 1) {
								actionItems.push({
									id: "down",
									name: Util.translate("moveDown"),
									symbol: "order-arrow-down",
									action: this.moveOptionDown
								});
							}

							const selected = option == this.selectedOption;
							const selectedColor = "#fae6ecff";
							return (
								<Row
									key={option.value}
									onClick={(e) => {
										this.handleOptionSelected(option);
									}}
								>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											{option.label[this.languageId]}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											{option.value}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											<SXActionDropdown
												key={this.workingParam.options.length - index}
												namespace={this.namespace}
												formId={this.formId}
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
				<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
					<div className="autofit-col autofit-col-expand">
						<div style={{ textAlign: "center" }}>
							<Button
								aria-label={Util.translate("add-option")}
								displayType="secondary"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									this.handleAddOption();
								}}
								title={Util.translate("add-option")}
								disabled={
									Util.isNotEmpty(this.selectedOption) ||
									!(this.fieldOptionLabel.hasValue() && this.fieldOptionValue.hasValue())
								}
							>
								<Icon
									symbol="caret-top"
									spritemap={this.props.spritemap}
								/>
							</Button>
						</div>
					</div>
					<div className="autofit-col">
						<ClayButtonWithIcon
							aria-label={Util.translate("new-option")}
							size="sm"
							symbol="plus"
							title={Util.translate("new-option")}
							onClick={(e) => {
								e.stopPropagation();
								this.handleNewOption();
							}}
							spritemap={this.props.spritemap}
							style={{ leftMargin: "auto" }}
						/>
					</div>
				</div>

				{this.fieldOptionLabel.renderField({
					spritemap: this.spritemap
				})}

				{this.fieldOptionValue.renderField({
					spritemap: this.spritemap
				})}
				{this.state.optionValueDuplicated && (
					<SXModalDialog
						header={Util.translate("error")}
						body={Util.translate("the-option-value-exists-already-try-another-value")}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: (e) => {
									this.setState({ optionValueDuplicated: false });
								},
								displayType: "secondary"
							}
						]}
					/>
				)}
			</>
		);
	}
}

class SXStringTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.workingParam = props.workingParam;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "stringTypeOptionForm";

		this.fields = {
			placeholder: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.PLACEHOLDER,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "placeholder"),
					tooltip: Util.getTranslationObject(this.languageId, "placeholder-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "placeholder"),
					value: this.workingParam.placeholder
				}
			),

			multipleLine: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.MULTIPLE_LINE,
					viewType: BooleanParameter.ViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "multiple-line"),
					tooltip: Util.getTranslationObject(this.languageId, "multiple-line-tooltip"),
					defalutValue: false,
					value: this.workingParam.multipleLine
				}
			),

			localized: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.LOCALIZED,
					viewType: BooleanParameter.ViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "localized"),
					tooltip: Util.getTranslationObject(this.languageId, "localized-tooltip"),
					defalutValue: false,
					value: this.workingParam.localized
				}
			),
			prefix: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.PREFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "prefix"),
					tooltip: Util.getTranslationObject(this.languageId, "prefix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "prefix"),
					value: this.workingParam.prefix
				}
			),
			postfix: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.POSTFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "postfix"),
					tooltip: Util.getTranslationObject(this.languageId, "postfix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "postfix"),
					value: this.workingParam.postfix
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		console.log("SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ", dataPacket, this.workingParam);

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (this.workingParam.isRendered()) {
			if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
			} else {
				this.workingParam.fireRefreshPreview();
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		const fields = Object.values(this.fields);

		return <>{fields.map((field) => field.renderField({ spritemap: this.spritemap }))}</>;
	}
}

class SXNumericTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.state = {
			isInteger: this.workingParam.isInteger
		};

		this.formId = this.workingParam.namespace + "numericTypeOptionForm";

		this.fields = {
			isInteger: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.IS_INTEGER,
					viewType: BooleanParameter.ViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "integer"),
					tooltip: Util.getTranslationObject(this.languageId, "integer-tooltip"),
					value: this.workingParam.isInteger
				}
			),

			uncertainty: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.UNCERTAINTY,
					viewType: BooleanParameter.ViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "uncertainty"),
					tooltip: Util.getTranslationObject(this.languageId, "uncertainty-tooltip"),
					value: this.workingParam.uncertainty
				}
			),

			decimalPlaces: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.NUMERIC,
				{
					paramCode: ParamProperty.DECIMAL_PLACES,
					isInteger: true,
					displayName: Util.getTranslationObject(this.languageId, "decimal-places"),
					tooltip: Util.getTranslationObject(this.languageId, "decimal-places-tooltip"),
					defaultValue: this.workingParam.isInteger ? 0 : 1,
					validation: {
						min: {
							value: 0,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-larger-than-or-equal-to",
								0
							),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: 10,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-smaller-than-or-equal-to",
								10
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.decimalPlaces
				}
			),

			unit: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.UNIT,
					displayName: Util.getTranslationObject(this.languageId, "unit"),
					tooltip: Util.getTranslationObject(this.languageId, "unit-tooltip"),
					value: this.workingParam.unit
				}
			),
			prefix: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.PREFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "prefix"),
					tooltip: Util.getTranslationObject(this.languageId, "prefix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "prefix"),
					value: this.workingParam.prefix
				}
			),
			postfix: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.POSTFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "postfix"),
					tooltip: Util.getTranslationObject(this.languageId, "postfix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "postfix"),
					value: this.workingParam.postfix
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		//console.log("SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ", dataPacket, this.workingParam);

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (dataPacket.paramCode == ParamProperty.IS_INTEGER) {
			this.workingParam.decimalPlaces = this.workingParam.isInteger ? 0 : 1;
			this.setState({ isInteger: this.workingParam.isInteger });
		}

		if (this.workingParam.isRendered()) {
			if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
			} else {
				this.workingParam.fireRefreshPreview();
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		const fields = Object.values(this.fields);

		return (
			<>
				{fields.map((field) => {
					if (field.paramCode == ParamProperty.DECIMAL_PLACES && !this.state.isInteger) {
						return field.renderField({ spritemap: this.spritemap });
					} else if (field.paramCode !== ParamProperty.DECIMAL_PLACES) {
						return field.renderField({ spritemap: this.spritemap });
					}
				})}
			</>
		);
	}
}

class SXSelectTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "selectTypeOptionForm";

		const viewTypes = [
			{
				label: Util.getTranslationObject(this.languageId, "Dropdown"),
				value: SelectParameter.ViewTypes.DROPDOWN
			},
			{
				label: Util.getTranslationObject(this.languageId, "Radio"),
				value: SelectParameter.ViewTypes.RADIO
			},
			{
				label: Util.getTranslationObject(this.languageId, "Checkbox"),
				value: SelectParameter.ViewTypes.CHECKBOX
			}
		];

		if (this.workingParam.displayType !== Parameter.DisplayTypes.GRID_CELL) {
			viewTypes.push({
				label: Util.getTranslationObject(this.languageId, "Listbox"),
				value: SelectParameter.ViewTypes.LISTBOX
			});
		}

		this.fields = {
			viewType: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.SELECT,
				{
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: SelectParameter.ViewTypes.RADIO,
					options: viewTypes,
					optionsPerRow: 2,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					tooltip: Util.getTranslationObject(this.languageId, "select-view-type-tooltip"),
					value: this.workingParam.viewType ?? SelectParameter.ViewTypes.DROPDOWN,
					validation: {
						required: {
							value: true,
							message: Util.getTranslationObject(this.languageId, "this-field-is-required")
						}
					}
				}
			),
			optionsPerRow: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.NUMERIC,
				{
					paramCode: ParamProperty.OPTIONS_PER_ROW,
					isInteger: true,
					displayName: Util.getTranslationObject(this.languageId, "options-per-row"),
					tooltip: Util.getTranslationObject(this.languageId, "options-per-row-tooltip"),
					defaultValue: 0,
					validation: {
						min: {
							value: 0,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-larger-than-or-equal-to",
								0
							),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: 10,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-smaller-than-or-equal-to",
								10
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.optionsPerRow
				}
			),
			listboxSize: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.NUMERIC,
				{
					paramCode: ParamProperty.LISTBOX_SIZE,
					isInteger: true,
					displayName: Util.getTranslationObject(this.languageId, "listbox-size"),
					tooltip: Util.getTranslationObject(this.languageId, "listbox-size-tooltip"),
					validation: {
						min: {
							value: 2,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"listbox-size-must-be-larger-than-or-equal-to",
								2
							),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: 10,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"listbox-size-must-be-smaller-than-or-equal-to",
								10
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.listboxSize
				}
			),
			placeholder: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.PLACEHOLDER,
					displayName: Util.getTranslationObject(this.languageId, "placeholder"),
					localized: true,
					tooltip: Util.getTranslationObject(this.languageId, "placeholder-tooltip"),
					validation: {
						minLength: {
							value: 5,
							message: Util.getTranslationObject(this.languageId, "placeholder-should-be-longer-than", 4),
							errorClass: ErrorClass.ERROR
						},
						maxLength: {
							value: 16,
							message: Util.getTranslationObject(
								this.languageId,
								"placeholder-should-be-shorter-than",
								16
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.placeholder
				}
			)
		};
	}

	displayOptionsPerRow() {
		return (
			this.workingParam.viewType == BooleanParameter.ViewTypes.CHECKBOX ||
			this.workingParam.viewType == BooleanParameter.ViewTypes.RADIO
		);
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		/*
		console.log(
			"SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fields[dataPacket.paramCode],
			this.fields[dataPacket.paramCode].getValue()
		);
		*/

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();
		//this.workingParam.initValue();

		this.forceUpdate();

		if (this.workingParam.isRendered()) {
			if (dataPacket.paramCode == "viewType") {
				if (SelectParameter.ViewTypes.DROPDOWN || SelectParameter.ViewTypes.RADIO) {
					this.workingParam.setValue({ value: "" });
				} else {
					this.workingParam.setValue({ value: [] });
				}
			}

			if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
			} else {
				this.workingParam.fireRefreshPreview();
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return (
			<>
				{this.fields.viewType.renderField({ spritemap: this.spritemap })}
				{this.displayOptionsPerRow() &&
					this.fields.optionsPerRow.renderField({
						spritemap: this.spritemap
					})}
				{(this.workingParam.viewType == SelectParameter.ViewTypes.DROPDOWN ||
					this.workingParam.viewType == SelectParameter.ViewTypes.LISTBOX) &&
					this.fields.placeholder.renderField({ spritemap: this.spritemap })}
				{this.workingParam.viewType == SelectParameter.ViewTypes.LISTBOX &&
					this.fields.listboxSize.renderField({ spritemap: this.spritemap })}
				<SXSelectOptionBuilder
					namespace={this.namespace}
					formIds={this.formIds}
					workingParam={this.workingParam}
					spritemap={this.spritemap}
				/>
			</>
		);
	}
}

class SXBooleanTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "booleanTypeOptionForm";

		this.fields = {
			viewType: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.SELECT,
				{
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: SelectParameter.ViewTypes.RADIO,
					options: [
						{
							label: Util.getTranslationObject(this.languageId, "Checkbox"),
							value: BooleanParameter.ViewTypes.CHECKBOX
						},
						{
							label: Util.getTranslationObject(this.languageId, "Toggle"),
							value: BooleanParameter.ViewTypes.TOGGLE
						},
						{
							label: Util.getTranslationObject(this.languageId, "Dropdown"),
							value: BooleanParameter.ViewTypes.DROPDOWN
						},
						{
							label: Util.getTranslationObject(this.languageId, "Radio"),
							value: BooleanParameter.ViewTypes.RADIO
						}
					],
					optionsPerRow: 2,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					tooltip: Util.getTranslationObject(this.languageId, "select-view-type-tooltip"),
					value: this.workingParam.viewType ?? SelectParameter.ViewTypes.CHECKBOX,
					validation: {
						required: {
							value: true,
							message: Util.getTranslationObject(this.languageId, "this-field-is-required")
						}
					}
				}
			),
			trueLabel: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.TRUE_LABEL,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "true-label"),
					placeholder: Util.getTranslationObject(this.languageId, "label-for-true-option"),
					tooltip: Util.getTranslationObject(this.languageId, "label-for-true-option-tooltip"),
					value: this.workingParam.trueLabel
				}
			),

			falseLabel: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.FALSE_LABEL,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "false-label"),
					placeholder: Util.getTranslationObject(this.languageId, "label-for-false-option"),
					tooltip: Util.getTranslationObject(this.languageId, "label-for-false-option-tooltip"),
					value: this.workingParam.falseLabel
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		/*
		console.log(
			"SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fields[dataPacket.paramCode].getValue()
		);
		*/

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (this.workingParam.isRendered()) {
			if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
				Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
			}

			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return (
			<>
				{this.fields.viewType.renderField({ spritemap: this.spritemap })}
				{this.fields.trueLabel.renderField({ spritemap: this.spritemap })}
				{this.fields.falseLabel.renderField({ spritemap: this.spritemap })}
			</>
		);
	}
}

class SXPhoneTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "phoneTypeOptionForm";

		this.fields = {
			enableCountryNo: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.ENABLE_COUNTRY_NO,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "enable-country-no"),
					tooltip: Util.getTranslationObject(this.languageId, "enable-country-no-tooltip"),
					defaultValue: false,
					value: this.workingParam.enableCountryNo
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		/*
		console.log(
			"SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fields[dataPacket.paramCode].getValue()
		);
		*/

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (this.workingParam.isRendered()) {
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return <>{this.fields.enableCountryNo.renderField({ spritemap: this.spritemap })}</>;
	}
}

class SXAddressTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "addressTypeOptionForm";

		this.fields = {
			viewType: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.SELECT,
				{
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: SelectParameter.ViewTypes.RADIO,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					options: [
						{
							label: Util.getTranslationObject(this.languageId, "Block"),
							value: AddressParameter.ViewTypes.BLOCK
						},
						{
							label: Util.getTranslationObject(this.languageId, "In Line"),
							value: AddressParameter.ViewTypes.INLINE
						},
						{
							label: Util.getTranslationObject(this.languageId, "One Line"),
							value: AddressParameter.ViewTypes.ONE_LINE
						}
					],
					tooltip: Util.getTranslationObject(this.languageId, "view-type-tooltip"),
					defaultValue: AddressParameter.ViewTypes.BLOCK,
					value: this.workingParam.viewType
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		/*
		console.log(
			"SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fields[dataPacket.paramCode].getValue()
		);
		*/

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (this.workingParam.isRendered()) {
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return <>{this.fields.viewType.renderField({ spritemap: this.spritemap })}</>;
	}
}

class SXDateTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "dateTypeOptionForm";

		this.fields = {
			enableTime: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.ENABLE_TIME,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "enable-time"),
					tooltip: Util.getTranslationObject(this.languageId, "enable-time-tooltip"),
					defaultValue: false,
					value: this.workingParam.enableTime
				}
			),
			startYear: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.NUMERIC,
				{
					paramCode: ParamProperty.START_YEAR,
					displayName: Util.getTranslationObject(this.languageId, "start-year"),
					isInteger: true,
					tooltip: Util.getTranslationObject(this.languageId, "start-year-tooltip"),
					defaultValue: "1970",
					value: this.workingParam.startYear,
					validation: {
						min: {
							value: 1900,
							message: Util.getTranslationObject(this.languageId, "start-year-must-be-larger-than", 1900),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: new Date().getFullYear(),
							message: Util.getTranslationObject(
								this.languageId,
								"start-year-must-be-smaller-than",
								new Date().getFullYear()
							),
							errorClass: ErrorClass.ERROR
						}
					}
				}
			),
			endYear: Parameter.createParameter(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.NUMERIC,
				{
					paramCode: ParamProperty.END_YEAR,
					displayName: Util.getTranslationObject(this.languageId, "end-year"),
					isInteger: true,
					tooltip: Util.getTranslationObject(this.languageId, "end-year-tooltip"),
					value: this.workingParam.endYear,
					validation: {
						min: {
							value: 1900,
							message: Util.getTranslationObject(this.languageId, "end-year-must-be-larger-than", 1900),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: new Date().getFullYear() + 100,
							message: Util.getTranslationObject(
								this.languageId,
								"end-year-must-be-smaller-than",
								new Date().getFullYear() + 100
							),
							errorClass: ErrorClass.ERROR
						}
					}
				}
			)
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		console.log(
			"SXDateTypeOptionForm SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fields[dataPacket.paramCode].getValue()
		);

		switch (dataPacket.paramCode) {
			case "startYear": {
				const endYear = Number(this.fields.endYear.getValue());
				const startYear = Number(this.fields.startYear.getValue());

				if (endYear && endYear < startYear) {
					dataPacket.parameter.setError(
						ErrorClass.ERROR,
						Util.translate("start-year-must-be-smaller-than-end-year")
					);

					Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
						targetFormId: this.formId,
						paramCode: dataPacket.paramCode,
						paramVersion: dataPacket.paramVersion
					});

					this.workingParam.setError(
						ErrorClass.ERROR,
						Util.translate("start-year-must-be-smaller-than-end-year")
					);
				}
				break;
			}
			case "endYear": {
				const endYear = Number(this.fields.endYear.getValue());
				const startYear = Number(this.fields.startYear.getValue());

				if (startYear && endYear < startYear) {
					dataPacket.parameter.setError(
						ErrorClass.ERROR,
						Util.translate("end-year-must-be-larger-than-start-year")
					);

					Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
						targetFormId: this.formId,
						paramCode: dataPacket.paramCode,
						paramVersion: dataPacket.paramVersion
					});

					this.workingParam.setError(
						ErrorClass.ERROR,
						Util.translate("end-year-must-be-larger-than-start-year")
					);
				}
				break;
			}
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (this.workingParam.isRendered()) {
			this.workingParam.initValue();
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return (
			<>
				{this.fields.enableTime.renderField({ spritemap: this.spritemap })}
				{this.fields.startYear.renderField({ spritemap: this.spritemap })}
				{this.fields.endYear.renderField({ spritemap: this.spritemap })}
			</>
		);
	}
}

class SXGroupTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.dataStructure = props.dataStructure;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "groupTypeOptionForm";

		this.availableMemberTypes = Object.keys(ParamType).map((key) => ParamType[key]);

		this.fieldViewType = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.SELECT,
			{
				paramCode: ParamProperty.VIEW_TYPE,
				viewType: SelectParameter.ViewTypes.RADIO,
				displayName: Util.getTranslationObject(this.languageId, "view-type"),
				options: [
					{
						label: Util.getTranslationObject(this.languageId, "Arrangement"),
						value: GroupParameter.ViewTypes.ARRANGEMENT
					},
					{
						label: Util.getTranslationObject(this.languageId, "Fieldset"),
						value: GroupParameter.ViewTypes.FIELDSET
					},
					{
						label: Util.getTranslationObject(this.languageId, "Panel"),
						value: GroupParameter.ViewTypes.PANEL
					},
					{
						label: Util.getTranslationObject(this.languageId, "Table"),
						value: GroupParameter.ViewTypes.TABLE
					}
				],
				optionsPerRow: 2,
				tooltip: Util.getTranslationObject(this.languageId, "view-type-tooltip"),
				defaultValue: AddressParameter.ViewTypes.PANEL,
				value: this.workingParam.viewType
			}
		);

		this.fieldMembersPerRow = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.NUMERIC,
			{
				paramCode: ParamProperty.MEMBERS_PER_ROW,
				isInteger: true,
				displayName: Util.getTranslationObject(this.languageId, "members-per-row"),
				tooltip: Util.getTranslationObject(this.languageId, "members-per-row-tooltip"),
				defaultValue: 1,
				validation: {
					min: {
						value: 0,
						message: Util.getTranslationObject(
							this.languageId,
							"members-per-row-must-be-larger-than-or-equal-to",
							0
						),
						errorClass: ErrorClass.ERROR
					},
					max: {
						value: 10,
						message: Util.getTranslationObject(
							this.languageId,
							"members-per-row-must-be-smaller-than-or-equal-to",
							10
						),
						errorClass: ErrorClass.ERROR
					}
				},
				value: this.workingParam.membersPerRow
			}
		);

		this.fieldExpanded = Parameter.createParameter(
			this.namespace,
			this.formIds.basicPropertiesFormId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: ParamProperty.EXPANDED,
				viewType: BooleanParameter.ViewTypes.CHECKBOX,
				displayName: Util.getTranslationObject(this.languageId, "expanded"),
				tooltip: Util.getTranslationObject(this.languageId, "expanded-tooltip"),
				value: this.workingParam.showDefinition
			}
		);
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			return;
		}

		/*
		console.log(
			"SXGroupTypeOptionForm SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.workingParam,
			this.fieldMembersPerRow.getValue()
		);
		*/

		switch (dataPacket.paramCode) {
			case ParamProperty.VIEW_TYPE: {
				this.workingParam.viewType = this.fieldViewType.getValue();
				break;
			}
			case ParamProperty.MEMBERS_PER_ROW: {
				this.workingParam.membersPerRow = this.fieldMembersPerRow.getValue();
				break;
			}
			case ParamProperty.EXPANDED: {
				this.workingParam.expanded = this.fieldExpanded.getValue();
				break;
			}
		}

		if (this.workingParam.isRendered()) {
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		let memberDisplayType = Parameter.DisplayTypes.FORM_FIELD;

		if (this.workingParam.viewType == GroupParameter.ViewTypes.TABLE) {
			memberDisplayType = Parameter.DisplayTypes.TABLE_ROW;
		}

		return (
			<>
				{this.fieldViewType.renderField({ spritemap: this.spritemap })}
				{this.workingParam.showMembersPerRow &&
					this.fieldMembersPerRow.renderField({ spritemap: this.spritemap })}
				{this.fieldExpanded.renderField({ spritemap: this.spritemap })}
				<SXGroupBuilder
					dataStructure={this.dataStructure}
					groupParam={this.workingParam}
					spritemap={this.spritemap}
					availableParamTypes={this.availableMemberTypes}
					memberDisplayType={memberDisplayType}
				/>
			</>
		);
	}
}

class SXGridTypeOptionForm extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.dataStructure = props.dataStructure;
		this.workingParam = props.workingParam;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.formId = this.workingParam.namespace + "gridTypeOptionForm";

		this.availableColumnTypes = [
			ParamType.STRING,
			ParamType.NUMERIC,
			ParamType.BOOLEAN,
			ParamType.SELECT,
			ParamType.ADDRESS,
			ParamType.FILE,
			ParamType.DATE,
			ParamType.EMAIL
		];
	}

	render() {
		return (
			<SXGroupBuilder
				dataStructure={this.dataStructure}
				groupParam={this.workingParam}
				spritemap={this.spritemap}
				availableParamTypes={this.availableColumnTypes}
				memberDisplayType={Parameter.DisplayTypes.GRID_CELL}
			/>
		);
	}
}

class SXDSBuilderTypeSpecificPanel extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;
	}

	componentDidMount() {}

	render() {
		switch (this.workingParam.paramType) {
			case ParamType.LOCALIZED_STRING:
			case ParamType.STRING: {
				return (
					<SXStringTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.NUMERIC: {
				return (
					<SXNumericTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.SELECT: {
				return (
					<SXSelectTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.BOOLEAN: {
				return (
					<SXBooleanTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.PHONE: {
				return (
					<SXPhoneTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.ADDRESS: {
				return (
					<SXAddressTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.DATE: {
				return (
					<SXDateTypeOptionForm
						formIds={this.formIds}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.GROUP: {
				return (
					<SXGroupTypeOptionForm
						formIds={this.formIds}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.GRID: {
				return (
					<SXGridTypeOptionForm
						formIds={this.formIds}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
		}

		return <div>{"No specified properties for this parameter type."}</div>;
	}
}

export default SXDSBuilderTypeSpecificPanel;
