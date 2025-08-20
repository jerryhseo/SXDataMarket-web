import React from "react";
import { ClayToggle } from "@clayui/form";
import {
	DataTypeProperty,
	ErrorClass,
	Event,
	LoadingStatus,
	ParamProperty,
	ParamType,
	ResourceIds,
	ValidationRule
} from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { DataStructure } from "./data-structure";
import { DataTypeInfo } from "../DataType/datatype-editor";
import { BooleanParameter, GroupParameter, Parameter } from "../../stationx/parameter";
import { Button, Icon } from "@clayui/core";
import { ClayButtonWithIcon } from "@clayui/button";
import SXDSBuilderPropertiesPanel from "./properties-panel";
import SXDataStructurePreviewer from "./preview-panel";
import { SXModalDialog } from "../../stationx/modal";
import { UnderConstruction } from "../../stationx/common";
import DataType, { DataTypeStructureLink } from "../DataType/datatype";
import { SXAutoComplete } from "../../stationx/form";

export class SXDataTypeStructureLink extends React.Component {
	constructor(props) {
		super(props);
		this.namespace = this.props.namespace;
		this.formId = props.formId;
		this.languageId = this.props.languageId;
		this.availableLanguageIds = this.props.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.dataType =
			props.dataType ?? new DataType(this.namespace, this.formId, this.languageId, this.availableLanguageIds);
		this.structureLink =
			props.dataTypeStructureLink ??
			new DataTypeStructureLink(this.namespace, this.formId, this.languageId, this.availableLanguageIds);
		this.dataStructure =
			props.dataStructure ??
			new DataStructure(this.namespace, this.formId, this.languageId, this.availableLanguageIds);

		if (Util.isNotEmpty(this.dataType.dataTypeName) && Util.isEmpty(this.dataStructure.dataStructureName)) {
			this.dataStructure.dataStructureName = this.dataType.dataTypeName;
		}
		if (Util.isNotEmpty(this.dataType.displayName) && Util.isEmpty(this.dataStructure.displayName)) {
			this.dataStructure.displayName = this.dataType.displayName;
		}
		if (Util.isNotEmpty(this.dataType.description) && Util.isEmpty(this.dataStructure.description)) {
			this.dataStructure.description = this.dataType.description;
		}

		this.structureSelector = props.structureSelector;
		this.structureItems = props.structureItems;

		this.componentId = this.namespace + "dataTypeStructureLink";

		this.structureCode = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramName: "structureCode",
				displayName: Util.getTranslationObject(this.languageId, "datastructure-code"),
				placeholder: Util.getTranslationObject(this.languageId, "datastructure-code"),
				tooltip: Util.getTranslationObject(this.languageId, "datastructure-code-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VARIABLE,
						message: Util.getTranslationObject(this.languageId, "invalid-data-type-name"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 3,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length" + ", 3"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length" + ", 32"),
						errorClass: ErrorClass.ERROR
					}
				},
				defaultValue: this.dataStructure.dataStructureName
			}
		);

		this.structureVersion = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramName: "structureVersion",
				displayName: Util.getTranslationObject(this.languageId, "datastructure-version"),
				placeholder: Util.getTranslationObject(this.languageId, "ex) 1.0.0"),
				tooltip: Util.getTranslationObject(this.languageId, "datastructure-version-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VERSION,
						message: Util.getTranslationObject(this.languageId, "invalid-version-format"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 5,
						message: Util.getTranslationObject(this.languageId, "should-be-at-least-5"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 12,
						message: Util.getTranslationObject(this.languageId, "should-be-up-to-12"),
						errorClass: ErrorClass.ERROR
					}
				},
				defaultValue: this.dataStructure.paramVersion
			}
		);

		this.displayName = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramName: DataTypeProperty.DISPLAY_NAME,
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "display-name"),
				placeholder: Util.getTranslationObject(this.languageId, "display-name"),
				tooltip: Util.getTranslationObject(this.languageId, "display-name-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 3,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length") + ", 3",
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "long-than-max-length") + ", 64",
						errorClass: ErrorClass.ERROR
					}
				},
				defaultValue: this.dataStructure.displayName
			}
		);

		this.basicStructureInfoGroup = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramName: "basicProps",
				paramVersion: "1.0.0",
				viewType: GroupParameter.ViewTypes.ARRANGEMENT,
				members: [this.structureCode.toJSON(), this.structureVersion.toJSON(), this.displayName.toJSON()],
				membersPerRow: 3
			}
		);

		this.description = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramName: DataTypeProperty.DESCRIPTION,
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "description-tooltip"),
				multipleLine: true,
				defaultValue: this.dataStructure.definition
			}
		);

		this.commentable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramName: "commentable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "commentable"),
				tooltip: Util.getTranslationObject(this.languageId, "commentable-tooltip"),
				defaultValue: this.structureLink.commentable
			}
		);

		this.verifiable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramName: "verifiable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "verifiable"),
				tooltip: Util.getTranslationObject(this.languageId, "verifiable-tooltip"),
				defaultValue: this.structureLink.verifiable
			}
		);

		this.freezable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramName: "freezable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "freezable"),
				tooltip: Util.getTranslationObject(this.languageId, "freezable-tooltip"),
				defaultValue: this.structureLink.freezable
			}
		);

		this.verified = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramName: "verified",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "verified"),
				tooltip: Util.getTranslationObject(this.languageId, "verified-tooltip"),
				defaultValue: this.structureLink.verified
			}
		);

		this.freezed = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramName: "freezed",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "freezed"),
				tooltip: Util.getTranslationObject(this.languageId, "freezed-tooltip"),
				defaultValue: this.structureLink.freezed
			}
		);

		this.optionGroup = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramName: "optionGroup",
				displayName: Util.getTranslationObject(this.languageId, "link-options"),
				viewType: GroupParameter.ViewTypes.FIELDSET,
				members: [this.commentable, this.verifiable, this.freezable],
				membersPerRow: 3
			}
		);

		this.verificationGroup = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramName: "optionGroup",
				displayName: Util.getTranslationObject(this.languageId, "link-options"),
				viewType: GroupParameter.ViewTypes.FIELDSET,
				members: [this.verified, this.freezed],
				membersPerRow: 3
			}
		);
	}

	componentDidMount() {}

	componentWillUnmount() {}

	render() {
		return (
			<>
				{(this.dataType.dataTypeId > 0 || this.dataStructure.dataStructureId) && (
					<>
						{this.dataType.dataTypeId > 0 && (
							<>
								<div className="autofit-float autofit-padded-no-gutters-x autofit-row sx-fieldset">
									<div className="sx-legend">{Util.translate("datatype-info")}</div>
									<div className="autofit-col">
										<SXLabeledText
											label={Util.translate("datatype-id")}
											text={this.dataType.dataTypeId}
											align="left"
											viewType="INLINE_ATTACH"
										/>
									</div>
									<div className="autofit-col">
										<SXLabeledText
											label={Util.translate("datatype-name")}
											text={this.dataType.dataTypeName}
											align="left"
											viewType="INLINE_ATTACH"
										/>
									</div>
									<div className="autofit-col">
										<SXLabeledText
											label={Util.translate("display-name")}
											text={this.dataType.getDisplayName()}
											align="left"
											viewType="INLINE_ATTACH"
										/>
									</div>
								</div>

								{this.optionGroup.renderField({ spritemap: this.spritemap })}
								{this.structureLink.typeStructureLinkId > 0 &&
									this.verificationGroup.renderField({ spritemap: this.spritemap })}
							</>
						)}
					</>
				)}
				<div className="sx-fieldset">
					<div className="sx-legend">{Util.translate("datastructure-info")}</div>
					<div>{this.basicStructureInfoGroup.renderField({ spritemap: this.spritemap })}</div>
					<div>{this.description.render({ spritemap: this.spritemap })}</div>
				</div>
			</>
		);
	}
}

class DataStructureBuilder extends React.Component {
	rerenderProperties = [
		ParamProperty.DEFINITION,
		ParamProperty.DISABLED,
		ParamProperty.DISPLAY_NAME,
		ParamProperty.ENABLE_COUNTRY_NO,
		ParamProperty.ENABLE_TIME,
		ParamProperty.END_YEAR,
		ParamProperty.FALSE_LABEL,
		ParamProperty.LABEL_POSITION,
		ParamProperty.MULTIPLE_LINE,
		ParamProperty.OPTIONS,
		ParamProperty.OPTIONS_PER_ROW,
		ParamProperty.PLACEHOLDER,
		ParamProperty.READ_ONLY,
		ParamProperty.REQUIRED,
		ParamProperty.SHOW_DEFINITION,
		ParamProperty.START_YEAR,
		ParamProperty.TOOLTIP,
		ParamProperty.TRUE_LABEL,
		ParamProperty.UNCERTAINTY,
		ParamProperty.UNIT,
		ParamProperty.VALIDATION,
		ParamProperty.VALUE,
		ParamProperty.VIEW_TYPE
	];

	propertyPanelStyles = {
		display: "block",
		backgroundColor: "#FFFFFF",
		border: "2px solid #CDCED9",
		padding: ".75rem 5px",
		width: "35%"
	};
	buttonPanelStyles = {
		display: "grid",
		backgroundColor: "#f2f7c6",
		borderTop: "2px solid #CDCED9",
		borderBottom: "2px solid #CDCED9",
		borderLeft: "none",
		borderRight: "none",
		padding: ".75rem 5px",
		justifyContent: "center",
		width: "60px"
	};
	previewPanelStyles = {
		backgroundColor: "#FFFFFF",
		border: "2px solid #CDCED9",
		padding: ".75rem 5px",
		width: "60%"
	};

	constructor(props) {
		super(props);

		console.log("DataStructureBuilder: ", props);
		this.namespace = props.namespace;
		this.baseRenderURL = props.baseRenderURL;
		this.baseResourceURL = props.baseResourceURL;
		this.languageId = props.languageId;
		this.availableLanguageIds = props.availableLanguageIds;
		this.permissions = props.permissions;
		this.spritemap = props.spritemapPath;

		this.permissions = props.permissions;

		this.redirectURLs = props.redirectURLs;
		this.workbench = props.workbench;
		this.params = props.params;

		this.dataTypeId = props.params.dataTypeId;
		this.dataTypeStructureLinkId = props.params.dataTypeStructureLinkId;
		this.dataStructureId = props.params.dataStructureId;
		this.editPhase = this.dataTypeId > 0 ? "update" : "create";
		this.dataStructure = null;

		this.formIds = {
			dsbuilderId: this.namespace + "dataStructureBuilder",
			propertyPanelId: this.namespace + "propertyPanel",
			basicPropertiesFormId: this.namespace + "basicPropertiesForm",
			typeOptionsFormId: this.namespace + "typeOptionsForm",
			optionsFormId: this.namespace + "optionsForm",
			validationFormId: this.namespace + "validationForm",
			previewCanvasId: this.namespace + "previewCanvas"
		};

		this.saveResult = "";

		this.loadingFailMessage = "";
		(this.workingParam = null),
			(this.state = {
				paramType: ParamType.STRING,
				loadingStatus: LoadingStatus.PENDING,
				confirmDlgState: false,
				confirmParamDeleteDlg: false,
				confirmDlgBody: "",
				underConstruction: false
			});
	}

	parameterSelectedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) {
			console.log("SX_PARAMETER_SELECTED rejected: ", dataPacket);
			return;
		}

		const selectedParam = dataPacket.parameter;
		console.log("SX_PARAMETER_SELECTED: ", dataPacket, selectedParam, this.workingParam);
		if (selectedParam === this.workingParam) {
			return;
		}

		selectedParam.focused = true;
		this.workingParam.focused = false;
		this.workingParam.fireRefreshPreview();

		this.workingParam = selectedParam;

		if (selectedParam.displayType === Parameter.DisplayTypes.GRID_CELL) {
			const gridParam = this.dataStructure.findParameter({
				paramName: this.workingParam.parent.name,
				paramVersion: this.workingParam.parent.version,
				descendant: true
			});

			gridParam.fireRefreshPreview();
		}

		this.fireRefreshPropertyPanel();
	};

	parameterTypeChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		console.log("SX_PARAM_TYPE_CHANGED: ", dataPacket);
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

		if (
			dataPacket.paramType === ParamType.MATRIX ||
			dataPacket.paramType === ParamType.DUALLIST ||
			dataPacket.paramType === ParamType.TABLE ||
			dataPacket.paramType === ParamType.CALCULATOR ||
			dataPacket.paramType === ParamType.IMAGE ||
			dataPacket.paramType === ParamType.LINKER ||
			dataPacket.paramType === ParamType.REFERENCE
		) {
			this.setState({ underConstruction: true });
			return;
		}

		this.workingParam = Parameter.createParameter(
			this.namespace,
			this.formIds.previewCanvasId,
			this.languageId,
			this.availableLanguageIds,
			dataPacket.paramType
		);

		this.fireRefreshPropertyPanel();
	};

	copyParameterHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

		const copied = this.workingParam.copy();
		this.workingParam.focused = false;
		this.workingParam.refreshKey();
		copied.focused = true;
		copied.refreshKey();

		const group = this.dataStructure.findParameter({
			paramName: copied.parentName,
			paramVersion: copied.paramVersion,
			descendant: true
		});

		console.log("SX_COPY_PARAMETER group: ", group, this.workingParam, copied);
		group.insertMember(copied, this.workingParam.order);

		this.workingParam = copied;

		this.fireRefreshPropertyPanel();
		this.forceUpdate();
	};

	deleteParameterHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

		this.setState({
			confirmParamDeleteDlg: true,
			confirmDlgBody: (
				<div>
					{Util.translate("are-you-sure-delete-the-parameter") + ': "' + this.workingParam.paramName + '"?'}
				</div>
			)
		});
	};

	componentDidMount() {
		this.loadDataStructure();

		Event.on(Event.SX_PARAMETER_SELECTED, this.parameterSelectedHandler);
		Event.on(Event.SX_PARAM_TYPE_CHANGED, this.parameterTypeChangedHandler);
		Event.on(Event.SX_COPY_PARAMETER, this.copyParameterHandler);
		Event.on(Event.SX_DELETE_PARAMETER, this.deleteParameterHandler);
	}

	componentWillUnmount() {
		Event.off(Event.SX_PARAMETER_SELECTED, this.parameterSelectedHandler);
		Event.off(Event.SX_PARAM_TYPE_CHANGED, this.parameterTypeChangedHandler);
		Event.off(Event.SX_COPY_PARAMETER, this.copyParameterHandler);
		Event.off(Event.SX_DELETE_PARAMETER, this.deleteParameterHandler);
	}

	loadDataStructure() {
		if (this.dataStructureId > 0) {
			Util.ajax({
				namespace: this.namespace,
				baseResourceURL: this.baseResourceURL,
				resourceId: ResourceIds.LOAD_DATA_STRUCTURE,
				params: {
					dataTypeId: this.dataTypeId,
					dataTypeStructureLinkId: this.dataTypeStructureLinkId,
					dataStructureId: this.dataStructureId
				},
				successFunc: (result) => {
					this.dataStructure = new DataStructure(
						this.namespace,
						this.formIds.previewCanvasId,
						this.languageId,
						this.availableLanguageIds
					);

					if (Util.isNotEmpty(result?.dataStructure || {})) {
						this.dataStructure.initProperties(result);
						this.editPhase = "update";
					} else {
						this.editPhase = "create";
					}

					const workingParam = this.dataStructure.hasMembers()
						? this.dataStructure.members[0]
						: Parameter.createParameter(
								this.namespace,
								this.formIds.previewCanvasId,
								this.languageId,
								this.availableLanguageIds,
								ParamType.STRING
						  );

					if (workingParam.isRendered()) {
						workingParam.focused = true;
					}

					this.workingParam = workingParam;
					this.setState({
						loadingStatus: LoadingStatus.COMPLETE
					});
				},
				errorFunc: (err) => {
					this.loadingFailMessage =
						"Failed to load data structure: " + this.dataTypeId + ": " + this.dataStructureId;
					this.setState({ loadingStatus: LoadingStatus.FAIL });
				}
			});
		} else {
			this.dataStructure = new DataStructure(
				this.namespace,
				this.formIds.previewCanvasId,
				this.languageId,
				this.availableLanguageIds
			);

			this.workingParam = Parameter.createParameter(
				this.namespace,
				this.formIds.previewCanvasId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING
			);

			this.setState({
				loadingStatus: LoadingStatus.COMPLETE
			});
		}
	}

	fireRefreshPropertyPanel() {
		Event.fire(Event.SX_REFRESH_PROPERTY_PANEL, this.namespace, this.namespace, {
			targetFormId: this.formIds.propertyPanelId,
			workingParam: this.workingParam
		});
	}

	handleEnableInputStatusChange(val) {
		this.dataStructure.enableInputStatus = val;

		this.forceUpdate();
	}

	handleEnableGotoChange(val) {
		this.dataStructure.enableGoTo = val;

		this.forceUpdate();
	}

	handleNewParameter() {
		this.workingParam = Parameter.createParameter(
			this.namespace,
			this.formIds.previewCanvasId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING
		);

		this.dataStructure.focus();

		this.forceUpdate();
	}

	handleSaveDataStructure = () => {
		console.log(JSON.stringify(this.dataStructure.toJSON(), null, 4));

		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.UPDATE_DATA_STRUCTURE,
			params: {
				dataTypeId: this.dataTypeId,
				dataStructure: JSON.stringify(this.dataStructure.toJSON())
			},
			successFunc: (result) => {
				this.setState({
					confirmDlgState: true,
					confirmDlgBody: <h4>{"Data structure is saved successfully as " + result.dataTypeId}</h4>
				});

				this.dataStructure.dirty = false;
			},
			errorFunc: (err) => {
				this.setState({ loadingStatus: LoadingStatus.FAIL });
			}
		});
	};

	handleAddParameter() {
		if (this.workingParam.checkIntegrity()) {
			this.dataStructure.addMember(this.workingParam);
			this.dataStructure.focus(this.workingParam.paramName, this.workingParam.paramVersion);
		} else {
			console.log("checkIntegrity fail: ", this.workingParam);
		}

		this.forceUpdate();
	}

	render() {
		if (this.state.loadingStatus === LoadingStatus.PENDING) {
			return <h3>Loading....</h3>;
		} else if (this.state.loadingStatus === LoadingStatus.FAIL) {
			return <h3>{this.loadingFailMessage}</h3>;
		}

		console.log("DataStructureBuilder render: ", this.dataStructure, this.workingParam);

		return (
			<>
				{this.dataStructure.dataStructureId > 0 && (
					<SXDataTypeStructureLink dataStructure={this.dataStructure} />
				)}
				<div style={{ display: "inline-flex", width: "100%" }}>
					<div className="autofit-col autofit-col-expand">
						<ClayToggle
							label={Util.translate("enable-input-status")}
							toggled={this.dataStructure.enableInputStatus}
							onToggle={(val) => this.handleEnableInputStatusChange(val)}
							sizing="md"
							style={{ width: "30%" }}
						/>
					</div>
					<div className="autofit-col autofit-col-expand">
						<ClayToggle
							label={Util.translate("enable-goto")}
							toggled={this.dataStructure.enableGoTo}
							onToggle={(val) => this.handleEnableGotoChange(val)}
							sizing="md"
							style={{ width: "30%" }}
						/>
					</div>
				</div>

				<div
					style={{
						display: "flex",
						paddingLeft: "0",
						paddingRight: "0",
						width: "100%",
						marginBottom: "20px"
					}}
				>
					<div style={this.propertyPanelStyles}>
						<Button.Group
							spaced
							style={{
								background: "rgba(247, 237, 171, 0.8)",
								padding: "10px 5px",
								justifyContent: "center",
								marginBottom: "20px",
								width: "100%"
							}}
						>
							<ClayButtonWithIcon
								aria-label={Util.translate("new")}
								symbol="plus"
								title={Util.translate("new")}
								spritemap={this.spritemap}
								size="sm"
								onClick={() => {
									this.handleNewParameter();
								}}
							/>
							<ClayButtonWithIcon
								aria-label={Util.translate("duplicate")}
								symbol="copy"
								title={Util.translate("duplicate")}
								spritemap={this.spritemap}
								displayType="secondary"
								size="sm"
							/>
							<ClayButtonWithIcon
								aria-label={Util.translate("delete")}
								symbol="trash"
								title={Util.translate("delete")}
								spritemap={this.spritemap}
								displayType="danger"
								size="sm"
							/>
							<ClayButtonWithIcon
								aria-label={Util.translate("import")}
								symbol="import"
								title={Util.translate("import")}
								spritemap={this.spritemap}
								displayType="secondary"
								size="sm"
								className="float-right"
							/>
						</Button.Group>
						<SXDSBuilderPropertiesPanel
							key={this.workingParam.key}
							formIds={this.formIds}
							workingParam={this.workingParam}
							dataStructure={this.dataStructure}
							spritemap={this.spritemap}
						/>
					</div>
					<div style={this.buttonPanelStyles}>
						<div
							style={{
								backgroundColor: "#f7edab",
								background: "rgba(247, 237, 171, 0.8)",
								padding: "10px 5px",
								justifyContent: "center",
								justifySelf: "center",
								alignItems: "center",
								alignSelf: "center",
								marginBottom: "20px",
								flexDirection: "column",
								columnGap: "1rem",
								flexWrap: "wrap",
								position: "relative"
							}}
						>
							<ClayButtonWithIcon
								aria-label="Move up"
								title="Move up"
								symbol="caret-top"
								onClick={() => {}}
								borderless
								size="md"
								disabled={this.workingParam.isRendered()}
								spritemap={this.spritemap}
							></ClayButtonWithIcon>
							<ClayButtonWithIcon
								aria-label="Add"
								title="Add"
								symbol="caret-right"
								onClick={() => {
									this.handleAddParameter();
								}}
								displayType="secondary"
								size="md"
								disabled={this.workingParam.isRendered()}
								spritemap={this.spritemap}
							></ClayButtonWithIcon>
							<ClayButtonWithIcon
								aria-label="Move down"
								title="Move down"
								symbol="caret-bottom"
								onClick={() => {}}
								borderless
								size="md"
								disabled={this.workingParam.isRendered()}
								spritemap={this.spritemap}
							></ClayButtonWithIcon>
						</div>
					</div>
					<div style={this.previewPanelStyles}>
						<SXDataStructurePreviewer
							formIds={this.formIds}
							dataStructure={this.dataStructure}
							spritemap={this.spritemap}
						/>
					</div>
				</div>
				<Button.Group spaced>
					<Button
						displayType="primary"
						onClick={this.handleSaveDataStructure}
						title={Util.translate("save-data-structure")}
					>
						<Icon
							symbol="disk"
							spritemap={this.spritemap}
							style={{ marginRight: "5px" }}
						/>
						{Util.translate("save")}
					</Button>
					{this.editPhase === "update" && (
						<Button
							displayType="warning"
							onClick={() => {}}
							title={Util.translate("delete-data-structure")}
						>
							<Icon
								symbol="trash"
								spritemap={this.spritemap}
								style={{ marginRight: "5px" }}
							/>
							{Util.translate("delete")}
						</Button>
					)}
				</Button.Group>
				{this.state.confirmDlgState && (
					<SXModalDialog
						header="Success"
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
				{this.state.confirmParamDeleteDlg && (
					<SXModalDialog
						header={Util.translate("delete-parameter")}
						body={this.state.confirmDlgBody}
						buttons={[
							{
								onClick: () => {
									const group = this.dataStructure.findParameter({
										paramName: this.workingParam.parentName,
										paramVersion: this.workingParam.parentVersion,
										descendant: true
									});

									group.removeMember({
										paramName: this.workingParam.paramName,
										paramVersion: this.workingParam.paramVersion
									});

									const workingParam =
										group.firstMember ??
										(group.paramName === GroupParameter.ROOT_GROUP
											? Parameter.createParameter(
													this.namespace,
													this.formIds.dsbuilderId,
													this.languageId,
													this.availableLanguageIds,
													ParamType.STRING
											  )
											: group);
									workingParam.focused = workingParam.isRendered() ? true : false;

									this.workingParam = workingParam;
									this.setState({ confirmParamDeleteDlg: false });
								},
								label: Util.translate("ok"),
								displayType: "primary"
							},
							{
								onClick: () => {
									this.setState({ confirmParamDeleteDlg: false });
								},
								label: Util.translate("cancel"),
								displayType: "primary"
							}
						]}
						status="info"
						spritemap={this.spritemap}
					/>
				)}
				{this.state.underConstruction && (
					<SXModalDialog
						header={Util.translate("sorry")}
						body={<UnderConstruction />}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ underConstruction: false });
								}
							}
						]}
					/>
				)}
			</>
		);
	}
}

export default DataStructureBuilder;
