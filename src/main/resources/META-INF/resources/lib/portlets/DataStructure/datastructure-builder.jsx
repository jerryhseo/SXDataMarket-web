import React from "react";
import {
	EditStatus,
	ErrorClass,
	Event,
	LoadingStatus,
	ParamProperty,
	ParamType,
	ValidationRule
} from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import DataStructure from "./data-structure";
import { Button, Icon } from "@clayui/core";
import { ClayButtonWithIcon } from "@clayui/button";
import SXDSBuilderPropertiesPanel from "./properties-panel";
import SXDataStructurePreviewer from "./preview-panel";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { UnderConstruction } from "../../stationx/common";
import { DataType, DataTypeStructureLink, SXDataTypeStructureLink } from "../DataType/datatype";
import { SXLabeledText } from "../Form/form";
import { Workbench } from "../DataWorkbench/workbench";
import SXBaseVisualizer from "../../stationx/visualizer";
import ParameterConstants from "../Parameter/parameter-constants";
import { ParameterUtil } from "../Parameter/parameters";
import SXGroupSelector from "./group-selector";

class DataStructureBuilder extends SXBaseVisualizer {
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

		//console.log("DataStructureBuilder props: ", props);

		this.typeStructureLink = null;
		this.dataType = null;
		this.dataStructure = null;

		this.dataTypeId = this.params.dataTypeId ?? 0;
		this.dataStructureId = this.params.dataStructureId ?? 0;

		this.editPhase = this.params.editPhase ?? EditStatus.ADD;
		this.componentId = this.namespace + "DataStructureBuilder";
		this.previewerId = this.namespace + "SXDataStructurePreviewer";

		this.saveResult = "";

		this.loadingFailMessage = "";
		this.workingParam = null;

		this.state = {
			paramType: ParamType.STRING,
			dataTypeStructureLinkReloadKey: Util.randomKey(),
			dataStructurePreviewerReloadKey: Util.randomKey(),
			loadingStatus: LoadingStatus.PENDING,
			confirmDlgState: false,
			confirmParamDeleteDlg: false,
			confirmDlgBody: <></>,
			confirmDlgHeader: <></>,
			manifestSDE: false,
			openSelectGroupModal: false,
			underConstruction: false
		};

		this.structureCode = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "structureCode",
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
						message: Util.getTranslationObject(this.languageId, "invalid-data-type-code"),
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
				}
			}
		});

		this.structureVersion = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "structureVersion",
				displayName: Util.getTranslationObject(this.languageId, "datastructure-version"),
				placeholder: Util.getTranslationObject(this.languageId, "ex) 1.0.0"),
				tooltip: Util.getTranslationObject(this.languageId, "datastructure-version-tooltip"),
				style: { width: "10rem" },
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
				defaultValue: "1.0.0"
			}
		});

		this.structureDisplayName = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "structureDisplayName",
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
				}
			}
		});

		this.structureDescription = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "structureDescription",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "datastructure-description-tooltip"),
				validation: {
					maxLength: {
						value: 256,
						message: Util.getTranslationObject(this.languageId, "long-than-max-length") + ", 256",
						errorClass: ErrorClass.ERROR
					}
				}
			}
		});
	}

	listenerParameterSelected = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("SX_PARAMETER_SELECTED rejected: ", dataPacket);
			return;
		}

		const selectedParam = parameter;
		if (selectedParam == this.workingParam) {
			return;
		}

		console.log("[DataStructureBuilder] SX_PARAMETER_SELECTED received: ", parameter);

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		selectedParam.focused = true;

		this.workingParam.focused = false;

		this.workingParam = selectedParam;

		this.forceUpdate();
	};

	listenerParameterTypeChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) return;

		if (
			dataPacket.paramType == ParamType.MATRIX ||
			dataPacket.paramType == ParamType.DUALLIST ||
			dataPacket.paramType == ParamType.TABLE ||
			dataPacket.paramType == ParamType.CALCULATOR ||
			dataPacket.paramType == ParamType.IMAGE ||
			dataPacket.paramType == ParamType.LINKER ||
			dataPacket.paramType == ParamType.REFERENCE
		) {
			this.setState({ underConstruction: true });
			return;
		}

		this.workingParam = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.previewerId,
			paramType: dataPacket.paramType
		});

		this.forceUpdate();
	};

	listenerCopyParameter = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			return;
		}

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		const copied = this.workingParam.copy();
		this.workingParam.focused = false;
		this.workingParam.fireRefresh();

		copied.focused = true;
		copied.refreshKey();

		const group =
			this.dataStructure.findParameter({
				paramCode: copied.parentCode,
				paramVersion: copied.paramVersion,
				descendant: true
			}) ?? this.dataStructure;

		group.insertMember(copied, this.workingParam.order);

		this.workingParam = copied;

		this.forceUpdate();
	};

	listenerDeleteParameter = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		this.setState({
			confirmParamDeleteDlg: true,
			confirmDlgBody: <div>{Util.translate("are-you-sure-delete", this.workingParam.label)}</div>
		});
	};

	listenerSelectGroup = (event) => {
		const { dataPacket } = event;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			//console.log("[DataStructureBuilder] listenerSelectGroup rejected:", dataPacket);
			return;
		}

		//console.log("[DataStructureBuilder] listenerSelectGroup:", dataPacket);

		this.setState({ openSelectGroupModal: true });
	};

	listenerGroupChanged = (event) => {
		const { dataPacket } = event;
		const { targetPortlet, targetFormId, parameter } = dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[DataStructureBuilder] listenerGroupChanged rejected:", dataPacket);
			return;
		}

		//console.log("[DataStructureBuilder] listenerGroupChanged:", parameter);

		this.setState({ openSelectGroupModal: false });
	};

	listenerFieldValueChanged = (event) => {
		const { dataPacket } = event;
		const { targetPortlet, targetFormId, parameter, paramCode } = dataPacket;

		if (!(targetPortlet == this.namespace && targetFormId == this.componentId)) {
			return;
		}

		switch (paramCode) {
			case "structureCode": {
				if (this.structureCode.hasError()) {
					return;
				}

				this.dataStructure.paramCode = this.structureCode.getValue();

				this.fireRequest({
					requestId: Workbench.RequestIDs.checkDataStructureCodeUnique,
					params: {
						dataStructureCode: this.dataStructure.paramCode,
						dataStructureVersion: this.dataStructure.paramVersion
					}
				});

				break;
			}
			case "structureVersion": {
				if (this.structureVersion.hasError()) {
					return;
				}

				this.dataStructure.paramVersion = this.structureVersion.getValue();
				this.fireRequest({
					requestId: Workbench.RequestIDs.checkDataStructureUnique,
					params: {
						dataStructureCode: this.dataStructure.paramCode,
						dataStructureVersion: this.dataStructure.paramVersion
					}
				});
				break;
			}
			case "structureDisplayName": {
				this.dataStructure.displayName = this.structureDisplayName.getValue();
				break;
			}
			case "structureDescription": {
				this.dataStructure.description = this.structureDescription.getValue();
				break;
			}
			default: {
				console.log("listenerFieldValueChanged: ", parameter);
			}
		}
	};

	listenerLinkInfoChanged = (event) => {
		const { targetPortlet, targetFormId } = event.dataPacket;

		if (!(targetPortlet == this.namespace && targetFormId == this.componentId)) {
			return;
		}

		//console.log("[DataStructureBuilder] listenerLinkInfoChanged: ", event.dataPacket);
		this.dataStructure.setTitleBarInfos(this.typeStructureLink.inputStatus);

		this.forceUpdate();
	};

	listenerRequest = (event) => {
		const { targetPortlet, targetFormId, sourceFormId, requestId, params } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[DataStructureBuilder] listenerRequest rejected:", event.dataPacket);
			return;
		}

		//console.log("[DataStructureBuilder] listenerRequest:", event.dataPacket);
		this.fireRequest({
			targetFormId: this.formId,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params,
			refresh: false
		});
	};

	listenerLoadPortlet = async (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.componentId)) {
			return;
		}

		//console.log("listenerLoadPortlet: ", dataPacket, this.workbench);
		if (this.state.manifestSDE) {
			return;
		}

		this.fireOpenPortletWindow({
			portletName: dataPacket.portletName,
			windowTitle: this.dataStructure.label + " " + Util.translate("preview"),
			params: {
				dataStructureId: this.dataStructure.dataStructureId
			}
		});
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataStructureBuilder] listenerWorkbenchReady rejected: ", dataPacket);
			return;
		}
		//console.log("[DataStructureBuilder] listenerWorkbenchReady received: ", dataPacket);

		this.loadDataStructure();
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataStructureBuilder] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		//console.log("[DataStructureBuilder] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	listenerResponce = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataStructureBuilder] listenerResponce rejected: ", dataPacket);
			return;
		}

		//console.log("[DataStructureBuilder] listenerResonse: ", dataPacket);
		const state = {};
		const result = dataPacket.data;

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.loadDataStructure: {
				this.dataType = new DataType(this.languageId, this.availableLanguageIds, result.dataType ?? {});
				this.typeStructureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
				this.typeStructureLink.parse(result.typeStructureLink ?? {});
				if (this.dataType.dataTypeId > 0) {
					this.typeStructureLink.dataTypeId = this.dataType.dataTypeId;
				}

				this.dataStructure = new DataStructure({
					namespace: this.namespace,
					formId: this.componentId,
					properties: result.dataStructure ?? {
						dataStructureCode: this.dataType.dataTypeCode,
						dataStructureVersion: "1.0.0",
						displayName: { ...this.dataType.displayName },
						description: { ...this.dataType.description }
					}
				});

				//set type-structure link info to dataStructure.
				this.dataStructure.setTitleBarInfos(this.typeStructureLink.toJSON());

				//console.log("TypeStructureLink: ", JSON.stringify(this.typeStructureLink, null, 4));
				this.structureCode.setValue({ value: this.dataStructure.dataStructureCode });
				this.structureVersion.setValue({ value: this.dataStructure.dataStructureVersion });
				this.structureDisplayName.setValue({ value: this.dataStructure.displayName });
				this.structureDescription.setValue({ value: this.dataStructure.description });

				this.editPhase = Util.isEmpty(result.dataStructure) ? EditStatus.ADD : EditStatus.UPDATE;

				this.workingParam = this.dataStructure.hasMembers()
					? this.dataStructure.members[0]
					: ParameterUtil.createParameter({
							namespace: this.namespace,
							formId: this.componentId,
							paramType: ParamType.STRING
					  });

				if (this.workingParam.isRendered()) {
					this.workingParam.focused = true;
				}

				break;
			}
			case Workbench.RequestIDs.checkDataStructureUnique: {
				if (Util.isEmpty(result) || this.dataStructure.dataStructureId == result.dataStructureId) {
					this.dataStructure.updateMemberParents();
					this.dataStructure.clearError();
					this.structureVersion.clearError();
				} else {
					this.structureCode.setError(ErrorClass.ERROR, Util.translate("datastructure-is-duplicated"));
					this.dataStructure.setError(ErrorClass.ERROR, Util.translate("ddatastructure-is-duplicated"));
				}

				break;
			}
			case Workbench.RequestIDs.checkDataStructureCodeUnique: {
				if (Util.isEmpty(result) || this.dataStructure.dataStructureId == result.dataStructureId) {
					this.dataStructure.updateMemberParents();
					this.dataStructure.clearError();
					this.structureCode.clearError();
				} else {
					this.structureCode.setError(ErrorClass.ERROR, Util.translate("datastructure-code-is-duplicated"));
					this.dataStructure.setError(ErrorClass.ERROR, Util.translate("datastructure-code-is-duplicated"));
				}

				break;
			}
			case Workbench.RequestIDs.saveDataStructure: {
				this.dataStructure.dataStructureId = result.dataStructureId;
				this.dataStructure.setDirty(false);

				state.confirmDlgState = true;
				state.confirmDlgHeader = SXModalUtil.successDlgHeader(this.spritemap);
				state.confirmDlgBody = (
					<h4>
						{Util.translate(
							"datastructure-is-saved-successfully-as-which-is-linked-to",
							result.dataStructureId,
							result.dataTypeId
						)}
					</h4>
				);

				break;
			}
		}

		this.setState({ ...state, loadingStatus: dataPacket.status });
	};

	componentDidMount() {
		//this.loadDataStructure();

		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.on(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.on(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_GROUP_CHANGED, this.listenerGroupChanged);
		Event.on(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.on(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.on(Event.SX_PARAM_TYPE_CHANGED, this.listenerParameterTypeChanged);
		Event.on(Event.SX_REQUEST, this.listenerRequest);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
		Event.on(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerLinkInfoChanged);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);

		this.fireHandshake();
	}

	componentWillUnmount() {
		//console.log("[DataStructureBuilder] componentWillUnmount");
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.off(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_GROUP_CHANGED, this.listenerGroupChanged);
		Event.off(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.off(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.off(Event.SX_PARAM_TYPE_CHANGED, this.listenerParameterTypeChanged);
		Event.off(Event.SX_REQUEST, this.listenerRequest);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
		Event.off(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerLinkInfoChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
	}

	loadDataStructure() {
		//console.log("dataTypeId: " + this.dataTypeId);
		//console.log("dataStructureId: " + this.dataStructureId);

		if (this.dataTypeId == 0 && this.dataStructureId == 0) {
			this.dataType = new DataType();
			this.typeStructureLink = new DataTypeStructureLink();
			this.dataStructure = new DataStructure({
				namespace: this.namespace,
				formId: this.componentId,
				properties: {}
			});
			this.workingParam = ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING
			});
			this.editPhase = EditStatus.ADD;

			this.setState({ loadingStatus: LoadingStatus.COMPLETE });
		} else {
			this.fireRequest({
				requestId: Workbench.RequestIDs.loadDataStructure,
				params: {
					dataTypeId: this.dataTypeId,
					dataStructureId: this.dataStructureId
				}
			});
		}
	}

	checkError() {
		const error = DataStructure.checkError([
			this.structureCode,
			this.structureVersion,
			this.structureDisplayName,
			this.structureDescription
		]);

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

	handleEnableInputStatusChange(val) {
		this.dataStructure.enableInputStatus = val;

		this.forceUpdate();
	}

	handleEnableGotoChange(val) {
		this.dataStructure.enableGoTo = val;

		this.forceUpdate();
	}

	handleNewParameter = () => {
		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		this.workingParam.focused = false;
		this.workingParam.fireRefreshPreview();

		this.workingParam = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING
		});

		//this.dataStructure.focus();

		this.forceUpdate();
	};

	handleSaveDataStructure = () => {
		//console.log(JSON.stringify(this.dataStructure.toJSON(), null, 4));
		//console.log(JSON.stringify(this.typeStructureLink.toJSON(), null, 4));

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		this.fireRequest({
			requestId: Workbench.RequestIDs.saveDataStructure,
			params: {
				typeStructureLink: JSON.stringify(this.typeStructureLink.toJSON()),
				dataStructure: JSON.stringify(this.dataStructure.toJSON())
			}
		});
	};

	handleAddParameter = () => {
		if (this.workingParam.checkIntegrity()) {
			this.dataStructure.addMember(this.workingParam);
			this.dataStructure.focus(this.workingParam.paramCode, this.workingParam.paramVersion);
			this.forceUpdate();
		} else {
			//console.log("checkIntegrity fail: ", this.workingParam);
			this.openErrorDlg(<h4>{Util.translate(this.workingParam.errorMessage)}</h4>);
		}
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <h3>Loading....</h3>;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <h3>{this.loadingFailMessage}</h3>;
		}

		//console.log("DataStructureBuilder render: ", this.dataStructure, this.workingParam);

		return (
			<>
				{this.editPhase !== EditStatus.ADD && (
					<SXDataTypeStructureLink
						key={this.state.dataTypeStructureLinkReloadKey}
						namespace={this.namespace}
						formId={this.componentId}
						dataType={this.dataType}
						dataTypeViewMode={DataTypeStructureLink.ViewTypes.VIEW}
						typeStructureLink={this.typeStructureLink}
						typeStructureLinkViewMode={DataTypeStructureLink.ViewTypes.EDIT}
						dataStructure={this.dataStructure}
						dataStructureViewMode={DataTypeStructureLink.ViewTypes.EDIT}
						spritemap={this.spritemap}
					/>
				)}
				{/*Header*/}
				<div
					className="autofit-float autofit-padded-no-gutters-x autofit-row"
					style={{ marginBottom: "2.5rem", borderBottom: "3px solid #c7c7ce" }}
				>
					<div className="autofit-col autofit-col-expand">
						<h3>{Util.translate("datastructure-builder")}</h3>
					</div>
					<div className="autofit-col">
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
							{this.editPhase == "update" && (
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
					</div>
				</div>
				<div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
					<div className="form-group sx-fieldset">
						<div className="sx-legend">{Util.translate("datastructure-info")}</div>
						<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
							<div className="autofit-col">
								<SXLabeledText
									key={Util.randomKey()}
									label={Util.translate("id")}
									text={this.dataStructure.dataStructureId}
									align="left"
									viewType="FORM_FIELD"
									className="sx-form-field"
								/>
							</div>
							<div className="autofit-col">
								{this.structureCode.render({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.structureVersion.render({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.structureDisplayName.render({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col autofit-col-expand">
								{this.structureDescription.render({ spritemap: this.spritemap })}
							</div>
						</div>
					</div>
				</div>
				<div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
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
							</Button.Group>
							<SXDSBuilderPropertiesPanel
								key={this.workingParam.key}
								namespace={this.namespace}
								formId={this.componentId}
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
								{/*<ClayButtonWithIcon
									aria-label="Move up"
									title="Move up"
									symbol="caret-top"
									onClick={() => {}}
									borderless
									size="md"
									disabled={this.workingParam.isRendered()}
									spritemap={this.spritemap}
								></ClayButtonWithIcon>*/}
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
								{/*
								<ClayButtonWithIcon
									aria-label="Move down"
									title="Move down"
									symbol="caret-bottom"
									onClick={() => {}}
									borderless
									size="md"
									disabled={this.workingParam.isRendered()}
									spritemap={this.spritemap}
								></ClayButtonWithIcon> */}
							</div>
						</div>
						<div style={this.previewPanelStyles}>
							<SXDataStructurePreviewer
								key={this.state.dataStructurePreviewerReloadKey}
								namespace={this.namespace}
								formId={this.componentId}
								dataStructure={this.dataStructure}
								typeStructureLink={this.typeStructureLink}
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
						{this.editPhase == "update" && (
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
					{this.state.openSelectGroupModal && (
						<SXGroupSelector
							title={Util.translate("select-group")}
							formId={this.componentId}
							dataStructure={this.dataStructure}
							workingParam={this.workingParam}
							spritemap={this.spritemap}
						/>
					)}
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
					{this.state.confirmParamDeleteDlg && (
						<SXModalDialog
							header={SXModalUtil.warningDlgHeader(this.spritemap)}
							body={this.state.confirmDlgBody}
							buttons={[
								{
									onClick: () => {
										const group = this.dataStructure.findParameter({
											paramCode: this.workingParam.parentCode,
											paramVersion: this.workingParam.parentVersion,
											descendant: true
										});

										group.removeMember({
											paramCode: this.workingParam.paramCode,
											paramVersion: this.workingParam.paramVersion
										});

										const workingParam =
											group.firstMember ??
											(group.paramCode == ParameterConstants.ROOT_GROUP
												? ParameterUtil.createParameter({
														namespace: this.namespace,
														formId: this.previewerId,
														paramType: ParamType.STRING
												  })
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
				</div>
			</>
		);
	}
}

export default DataStructureBuilder;
