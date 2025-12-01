import React from "react";
import { ErrorClass, Event, ParamType, PortletKeys } from "../../stationx/station-x";
import Toolbar from "@clayui/toolbar";
import { ClayInput } from "@clayui/form";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import Autocomplete from "@clayui/autocomplete";
import { Util } from "../../stationx/util";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBasePropertiesPanelComponent from "./base-properties-panel-component";
import { ParameterUtil } from "../Parameter/parameters";
import { SXLabeledText } from "../Form/form";
import { Icon, Text, TreeView } from "@clayui/core";

class SXDataStructurePreviewer extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);
		//console.log("Previewer props: ", props);

		this.typeStructureLink = props.typeStructureLink;

		this.componentId = this.namespace + "SXDataStructurePreviewer";

		this.state = {
			confirmDlgState: false,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: <></>,
			childRefreshKey: Util.randomKey(),
			addCommentModal: false
		};

		this.commentField = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "comment",
				displayName: Util.getTranslationObject(this.languageId, "comment"),
				tooltip: Util.getTranslationObject(this.languageId, "member-code-tooltip"),
				multipleLine: true
			}
		});

		this.addCommentDlgHeader = Util.translate("add-comment");
		this.commentParam = null;
	}

	listenerFieldValueChanged = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) return;

		console.log(
			"[SXDataStructurePreviewer] SX_FIELD_VALUE_CHANGED RECEIVED: ",
			dataPacket,
			this.dataStructure,
			this.dataStructure.members
		);

		if (this.typeStructureLink.inputStatus) {
			this.forceUpdate();
		}
	};

	listenerMoveParameterUp = (event) => {
		if (event.dataPacket.targetPortlet !== this.namespace || event.dataPacket.targetFormId !== this.componentId) {
			return;
		}

		const parameter = event.dataPacket.parameter;
		const group =
			this.dataStructure.findParameter({
				paramCode: parameter.parentCode,
				paramVersion: parameter.parentVersion,
				descendant: true
			}) ?? this.dataStructure;

		group.moveMemberUp(parameter.order - 1);

		this.forceUpdate();
	};

	listenerMoveParameterDown = (event) => {
		const { dataPacket } = event;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			return;
		}
		//console.log("[SXDataStructurePreviewer] listenerMoveParameterDown: ", dataPacket);

		const parameter = event.dataPacket.parameter;

		const group =
			this.dataStructure.findParameter({
				paramCode: parameter.parentCode,
				paramVersion: parameter.parentVersion,
				descendant: true
			}) ?? this.dataStructure;

		group.moveMemberDown(parameter.order - 1);

		this.forceUpdate();
	};

	listenerCopyParameter = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		//console.log("[SXDataStructurePreviewer] listenerCopyParameter: ", parameter);

		Event.fire(Event.SX_COPY_PARAMETER, this.namespace, this.namespace, {
			targetFormId: this.formId,
			parameter: parameter
		});
	};

	listenerRefeshForm = (e) => {
		if (e.dataPacket.targetPortlet !== this.namespace || e.dataPacket.targetFormId !== this.componentId) {
			return;
		}

		this.setState({
			childRefreshKey: Util.randomKey()
		});
	};

	listenerParameterSelected = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[DataStructurePreviewer] SX_PARAMETER_SELECTED Rejected: ", parameter);
			return;
		}

		//console.log("[DataStructurePreviewer] SX_PARAMETER_SELECTED: ", parameter);

		if (!parameter.focused) {
			Event.fire(Event.SX_PARAMETER_SELECTED, this.namespace, this.namespace, {
				targetFormId: this.formId,
				parameter: parameter
			});
		}
	};

	listenerDeleteParameter = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			return;
		}

		//console.log("[DataStructurePreviewer] SX_DELETE_PARAMETER received: ", dataPacket);

		Event.fire(Event.SX_DELETE_PARAMETER, this.namespace, this.namespace, {
			targetFormId: this.formId,
			parameter: dataPacket.parameter
		});
	};

	listenerSelectGroup = (event) => {
		const { targetPortlet, sourcePortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXDataStructurePreviewer] listenerSelectGroup rejected:", event.dataPacket);
			return;
		}

		//console.log("[SXDataStructurePreviewer] listenerSelectGroup:", event.dataPacket);

		Event.fire(Event.SX_SELECT_GROUP, sourcePortlet, this.namespace, {
			targetFormId: this.formId,
			parameter: parameter
		});
	};

	/**
	 * @deprecated
	 * @param {JSON} event
	 * @returns
	 */
	listenerUpdateParameterComments = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			console.log("[SXDataStructurePreviewer] listenerUpdateParameterComments rejected:", event.dataPacket);
			return;
		}

		console.log("[SXDataStructurePreviewer] listenerUpdateParameterComments:", event.dataPacket);
		if (parameter.hasComments()) {
			this.comments = (
				<div>
					<TreeView
						defaultItems={parameter.comments}
						nestedKey="replies"
					>
						{(item) => {
							<TreeView.item>
								<TreeView.ItemStack>
									<Icon
										symbol="reply"
										spritemap={this.spritemap}
									/>
									{item.name}
								</TreeView.ItemStack>
							</TreeView.item>;
						}}
					</TreeView>
				</div>
			);
		}

		this.commentParam = parameter;

		let value = this.commentParam.getValue();
		let error = this.commentParam.error;

		this.addCommentDlgBody = (
			<div>
				<Text
					size={6}
					style={{ marginBottom: "1.5rem" }}
				>
					{this.commentParam.label}
				</Text>
				{error.errorClass !== ErrorClass.SUCCESS && (
					<div style={{ color: "red", marginBottom: "1.0rem" }}>{this.commentParam.errorMessage}</div>
				)}
				{this.commentParam.hasValue() && (
					<pre style={{ marginBottom: "1.5rem" }}>
						{JSON.stringify(this.commentParam.getValue(), null, 4)}
					</pre>
				)}
				{this.commentField.renderField({
					spritemap: this.spritemap
				})}
			</div>
		);

		this.setState({ addCommentModal: true });
	};

	listenerRequest = (event) => {
		const { targetPortlet, targetFormId, sourceFormId, requestId, params } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			console.log("[SXDataStructurePreviewer] listenerRequest rejected:", event.dataPacket);
			return;
		}

		console.log("[SXDataStructurePreviewer] listenerRequest:", event.dataPacket);
		Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
			targetFormId: this.formId,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});
	};

	componentDidMount() {
		Event.on(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.on(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_MOVE_PARAMETER_DOWN, this.listenerMoveParameterDown);
		Event.on(Event.SX_MOVE_PARAMETER_UP, this.listenerMoveParameterUp);
		Event.on(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.on(Event.SX_REFRESH_FORM, this.listenerRefeshForm);
		Event.on(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
		Event.on(Event.SX_REQUEST, this.listenerRequest);
	}

	componentWillUnmount() {
		Event.off(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.off(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_MOVE_PARAMETER_DOWN, this.listenerMoveParameterDown);
		Event.off(Event.SX_MOVE_PARAMETER_UP, this.listenerMoveParameterUp);
		Event.off(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.off(Event.SX_REFRESH_FORM, this.listenerRefeshForm);
		Event.off(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
		Event.off(Event.SX_REQUEST, this.listenerRequest);
	}

	openErrorDlg(message) {
		this.setState({
			confirmDlgState: true,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: message
		});
	}

	handleManifestSDE = async () => {
		Event.fire(Event.SX_LOAD_PORTLET, this.namespace, this.namespace, {
			targetFormId: this.formId,
			portletName: PortletKeys.STRUCTURED_DATA_EDITOR
		});

		/*
		try {
			this.sde = await Workbench.loadPortlet({
				windowState: WindowState.EXCLUSIVE,
				portletId: PortletKeys.STRUCTURED_DATA_EDITOR,
				workbenchNamespace: this.formId
			});

			this.setState({ manifestSDE: true });
		} catch (err) {
			console.log("error whilw manifesting SDE: ", err);
		}
			*/
	};

	render() {
		//console.log("[SXDataStructurePreviewer] render(): ", this.dataStructure);
		return (
			<>
				<Toolbar
					style={{ paddingLeft: "10px", paddingRight: "10px", background: "#d8f2df", marginBottom: "15px" }}
				>
					<Toolbar.Nav>
						<Toolbar.Item expand>
							{this.typeStructureLink.jumpTo && (
								<Toolbar.Section>
									<ClayInput.Group>
										<ClayInput.GroupItem shrink>
											<label className="component-title">{Util.translate("jump-to")}</label>
										</ClayInput.GroupItem>
										<ClayInput.GroupItem
											shrink
											prepend
										>
											<ClayButtonWithIcon
												aria-labelledby={Util.translate("jump-to")}
												symbol="search"
												spritemap={this.spritemap}
												displayType="secondary"
												onClick={(e) => this.jumpTo()}
											/>
										</ClayInput.GroupItem>
										<ClayInput.GroupItem
											append
											expand="true"
										>
											<Autocomplete
												aria-labelledby={Util.translate("find-parameter")}
												id=""
												defaultItems={this.dataStructure
													.getJumpToItems()
													.map((item) => item.name)}
												messages={{
													notFound: "No results found"
												}}
												placeholder={Util.translate("enter-keyword")}
											>
												{(item) => <Autocomplete.Item key={item}>{item}</Autocomplete.Item>}
											</Autocomplete>
										</ClayInput.GroupItem>
									</ClayInput.Group>
								</Toolbar.Section>
							)}
						</Toolbar.Item>
						{this.typeStructureLink.inputStatus && (
							<Toolbar.Item>
								<Toolbar.Section>
									<ClayInput.Group>
										<ClayInput.GroupItem shrink>
											<ClayInput.GroupText
												style={{ backgroundColor: "#f3ded7", borderRadius: "1.0rem" }}
											>
												{this.dataStructure.valuedFieldsCount +
													"/" +
													this.dataStructure.totalFieldsCount +
													"(" +
													(
														(this.dataStructure.valuedFieldsCount /
															this.dataStructure.totalFieldsCount) *
														100
													).toFixed(1) +
													"%)"}
											</ClayInput.GroupText>
										</ClayInput.GroupItem>
									</ClayInput.Group>
								</Toolbar.Section>
							</Toolbar.Item>
						)}
						<Toolbar.Item>
							<Toolbar.Section>
								<Button.Group spaced>
									<ClayButtonWithIcon
										title={Util.translate("pdf")}
										aria-labelledby={Util.translate("pdf")}
										displayType="secondary"
										symbol="document-pdf"
										spritemap={this.spritemap}
									/>
									<ClayButtonWithIcon
										title={Util.translate("structured-data-editor")}
										aria-labelledby={Util.translate("structured-data-editor")}
										displayType="secondary"
										symbol="order-form-pencil"
										spritemap={this.spritemap}
										onClick={this.handleManifestSDE}
									/>
								</Button.Group>
							</Toolbar.Section>
						</Toolbar.Item>
					</Toolbar.Nav>
				</Toolbar>
				<div style={{ maxHeight: "1000px", overflowY: "auto", overflowX: "hidden" }}>
					{this.dataStructure.renderPreview({
						formId: this.componentId,
						spritemap: this.spritemap
					})}
				</div>
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
				{this.state.addCommentModal && (
					<SXModalDialog
						header={this.addCommentDlgHeader}
						body={this.addCommentDlgBody}
						buttons={[
							{
								onClick: (event) => {
									this.setState({ addCommentModal: false });

									Event.fire(Event.SX_SAVE_COMMENT, this.namespace, this.formId, {
										modelType: "parameter",
										paramCode: this.commentParam.paramCode,
										paramVersion: this.commentParam.paramVersion,
										comment: this.commentField.getValue()
									});
								},
								label: Util.translate("save"),
								displayType: "primary"
							},
							{
								onClick: (event) => {
									this.setState({ addCommentModal: false });
								},
								label: Util.translate("cancel"),
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

export default SXDataStructurePreviewer;
