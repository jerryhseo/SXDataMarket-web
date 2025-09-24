import React from "react";
import {
	EditStatus,
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
import { GroupParameter, Parameter } from "../../stationx/parameter";
import { Button, Icon } from "@clayui/core";
import { ClayButtonWithIcon } from "@clayui/button";
import SXDSBuilderPropertiesPanel from "./properties-panel";
import SXDataStructurePreviewer from "./preview-panel";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { UnderConstruction } from "../../stationx/common";
import { DataType, DataTypeStructureLink, SXDataTypeStructureLink } from "../DataType/datatype";
import { SXLabeledText } from "../../stationx/form";
import { SXPortletWindow, Workbench } from "../DataWorkbench/workbench";

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

		//console.log("DataStructureBuilder props: ", props);
		this.namespace = props.namespace;
		this.baseRenderURL = props.baseRenderURL;
		this.baseResourceURL = props.baseResourceURL;
		this.languageId = props.languageId;
		this.availableLanguageIds = props.availableLanguageIds;
		this.permissions = props.permissions;
		this.spritemap = props.spritemapPath;
		this.portletId = props.portletId;

		this.permissions = props.permissions;

		this.redirectURLs = props.redirectURLs;
		//this.workbench = props.workbench;
		this.params = props.params;

		this.typeStructureLink = null;
		this.dataType = null;
		this.dataStructure = null;

		this.dataTypeId = this.params.dataTypeId ?? 0;
		this.dataStructureId = this.params.dataStructureId ?? 0;

		this.editPhase = props.params.editPhase ?? EditStatus.ADD;

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
		this.workingParam = null;

		this.state = {
			paramType: ParamType.STRING,
			loadingStatus: LoadingStatus.PENDING,
			confirmDlgState: false,
			confirmParamDeleteDlg: false,
			confirmDlgBody: <></>,
			confirmDlgHeader: <></>,
			manifestSDE: false,
			underConstruction: false
		};

		this.workbench = new Workbench({
			namespace: this.namespace,
			workbenchId: this.portletId,
			baseRenderUrl: this.baseRenderUrl,
			baseResourceURL: this.baseResourceURL,
			spritemap: this.spritemap
		});

		this.portletWindow = null;

		this.structureCode = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);

		this.structureVersion = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);

		this.structureDisplayName = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);

		this.structureDescription = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
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
		);
	}

	parameterSelectedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) {
			console.log("SX_PARAMETER_SELECTED rejected: ", dataPacket);
			return;
		}

		const selectedParam = dataPacket.parameter;
		if (selectedParam == this.workingParam) {
			return;
		}

		console.log("SX_PARAMETER_SELECTED received: ", dataPacket);

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		selectedParam.focused = true;

		this.workingParam.focused = false;

		if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
			const gridParam = this.dataStructure.findParameter({
				paramCode: this.workingParam.parent.code,
				paramVersion: this.workingParam.parent.version,
				descendant: true
			});

			gridParam.fireRefreshPreview();
		} else {
			this.workingParam.fireRefreshPreview();
		}

		if (selectedParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
			const gridParam = this.dataStructure.findParameter({
				paramCode: selectedParam.parent.code,
				paramVersion: selectedParam.parent.version,
				descendant: true
			});

			gridParam.fireRefreshPreview();
		} else {
			selectedParam.fireRefreshPreview();
		}

		this.workingParam = selectedParam;
		//this.fireRefreshPropertyPanel();
		this.forceUpdate();
	};

	parameterTypeChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

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

		this.workingParam = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			dataPacket.paramType
		);

		//this.fireRefreshPropertyPanel();

		this.forceUpdate();
	};

	copyParameterHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

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

	deleteParameterHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.dsbuilderId) return;

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		this.setState({
			confirmParamDeleteDlg: true,
			confirmDlgBody: <div>{Util.translate("are-you-sure-delete", this.workingParam.label)}</div>
		});
	};

	listenerFieldValueChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.formIds.dsbuilderId)) {
			return;
		}

		switch (dataPacket.paramCode) {
			case "structureCode": {
				if (this.structureCode.hasError()) {
					return;
				}

				const newCode = this.structureCode.getValue();

				Util.ajax({
					namespace: this.namespace,
					baseResourceURL: this.baseResourceURL,
					resourceId: ResourceIds.CHECK_DATASTRUCTURE_UNIQUE,
					params: {
						dataStructureCode: newCode,
						dataStructureVersion: this.dataStructure.paramVersion
					},
					successFunc: (result) => {
						if (Util.isEmpty(result) || this.dataStructure.dataStructureId == result.dataStructureId) {
							this.dataStructure.paramCode = newCode;
							this.dataStructure.updateMemberParents();
							this.dataStructure.clearError();
							this.structureCode.clearError();
						} else {
							this.structureCode.setError(
								ErrorClass.ERROR,
								Util.translate("datastructure-code-is-duplicated")
							);
							this.dataStructure.setError(
								ErrorClass.ERROR,
								Util.translate("datastructure-code-is-duplicated")
							);
						}
					},
					errorFunc: (err) => {
						console.log("[ERROR] While checking DataStructure unique: ", err);
					}
				});
				break;
			}
			case "structureVersion": {
				if (this.structureVersion.hasError()) {
					return;
				}

				this.dataStructure.paramVersion = this.structureVersion.getValue();

				Util.ajax({
					namespace: this.namespace,
					baseResourceURL: this.baseResourceURL,
					resourceId: ResourceIds.CHECK_DATASTRUCTURE_UNIQUE,
					params: {
						dataStructureCode: this.dataStructure.paramCode,
						dataStructureVersion: this.dataStructure.paramVersion
					},
					successFunc: (result) => {
						if (Util.isEmpty(result) || this.dataStructure.dataStructureId == result.dataStructureId) {
							this.dataStructure.updateMemberParents();
							this.structureVersion.clearError();
						} else {
							this.structureCode.setError(
								ErrorClass.ERROR,
								Util.translate("datastructure-is-duplicated")
							);
							this.dataStructure.setError(
								ErrorClass.ERROR,
								Util.translate("ddatastructure-is-duplicated")
							);
						}
					},
					errorFunc: (err) => {
						console.log("[ERROR] While checking DataStructure unique: ", err);
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
				console.log("listenerFieldValueChanged: ", dataPacket);
			}
		}
	};

	listenerLinkInfoChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.formIds.dsbuilderId)) {
			return;
		}

		console.log("listenerLinkInfoChanged: ", dataPacket);
		this.dataStructure.setTitleBarInfos(this.typeStructureLink.inputStatus);

		this.forceUpdate();
	};

	listenerLoadPortlet = async (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.formIds.dsbuilderId)) {
			return;
		}

		//console.log("listenerLoadPortlet: ", dataPacket, this.workbench);
		if (this.state.manifestSDE) {
			return;
		}

		this.portletWindow = await this.workbench.openPortletWindow({
			portletName: dataPacket.portletName,
			title: this.dataStructure.label + " " + Util.translate("preview"),
			params: {
				dataTypeId: this.dataTypeId,
				dataStructureId: this.dataStructure.dataStructureId,
				editStatus: EditStatus.PREVIEW
			}
		});

		this.forceUpdate();
		//this.setState({ manifestSDE: true });
	};

	listenerClosePreviewWindow = (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.portletId)) {
			return;
		}

		this.workbench.removeWindow(dataPacket.portletId);
		console.log("listenerClosePreviewWindow: ", dataPacket, this.workbench);

		//this.setState({ manifestSDE: false });
		this.forceUpdate();
	};

	listenerHandshake = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		Event.fire(Event.SX_LOAD_DATA, this.namespace, dataPacket.sourcePortlet, {
			data: {
				subject: this.dataStructure.label,
				dataType: {
					dataTypeId: this.dataType.dataTypeId,
					dataTypeCode: this.dataType.dataTypeCode,
					dataTypeVersion: this.dataType.dataTypeVersion,
					displayName: this.dataType.getDisplayName()
				},
				typeStrtuctureLink: this.typeStructureLink.toJSON(),
				dataStructure: this.dataStructure.toJSON()
			}
		});
	};

	componentDidMount() {
		this.loadDataStructure();

		Event.on(Event.SX_PARAMETER_SELECTED, this.parameterSelectedHandler);
		Event.on(Event.SX_PARAM_TYPE_CHANGED, this.parameterTypeChangedHandler);
		Event.on(Event.SX_COPY_PARAMETER, this.copyParameterHandler);
		Event.on(Event.SX_DELETE_PARAMETER, this.deleteParameterHandler);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerLinkInfoChanged);
		Event.on(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.on(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.on(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
	}

	componentWillUnmount() {
		Event.off(Event.SX_PARAMETER_SELECTED, this.parameterSelectedHandler);
		Event.off(Event.SX_PARAM_TYPE_CHANGED, this.parameterTypeChangedHandler);
		Event.off(Event.SX_COPY_PARAMETER, this.copyParameterHandler);
		Event.off(Event.SX_DELETE_PARAMETER, this.deleteParameterHandler);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerLinkInfoChanged);
		Event.off(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.off(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.off(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
	}

	loadDataStructure() {
		//console.log("dataTypeId: " + this.dataTypeId);
		//console.log("dataStructureId: " + this.dataStructureId);

		if (this.dataTypeId == 0 && this.dataStructureId == 0) {
			this.dataType = new DataType(this.languageId, this.availableLanguageIds);
			this.typeStructureLink = new DataTypeStructureLink(
				this.languageId,
				this.availableLanguageIds,
				result.typeStructureLink
			);
			this.dataStructure = new DataStructure(
				this.namespace,
				this.formIds.dsbuilderId,
				this.languageId,
				this.availableLanguageIds,
				{}
			);
		} else {
			Util.ajax({
				namespace: this.namespace,
				baseResourceURL: this.baseResourceURL,
				resourceId: ResourceIds.LOAD_DATASTRUCTURE,
				params: {
					dataTypeId: this.dataTypeId,
					dataStructureId: this.dataStructureId
				},
				successFunc: (result) => {
					console.log("loadDataStructure completed: ", result, result.typeStructureLink);

					this.dataType = new DataType(this.languageId, this.availableLanguageIds, result.dataType ?? {});
					this.typeStructureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
					this.typeStructureLink.parse(result.typeStructureLink ?? {});
					if (this.dataType.dataTypeId > 0) {
						this.typeStructureLink.dataTypeId = this.dataType.dataTypeId;
					}

					this.dataStructure = new DataStructure(
						this.namespace,
						this.formIds.dsbuilderId,
						this.languageId,
						this.availableLanguageIds,
						result.dataStructure ?? {
							dataStructureCode: this.dataType.dataTypeCode,
							dataStructureVersion: "1.0.0",
							displayName: { ...this.dataType.displayName },
							description: { ...this.dataType.description }
						}
					);

					//set type-structure link info to dataStructure.
					this.dataStructure.setTitleBarInfos(this.typeStructureLink.toJSON());

					console.log("TypeStructureLink: ", JSON.stringify(this.typeStructureLink, null, 4));
					this.structureCode.setValue({ value: this.dataStructure.dataStructureCode });
					this.structureVersion.setValue({ value: this.dataStructure.dataStructureVersion });
					this.structureDisplayName.setValue({ value: this.dataStructure.displayName });
					this.structureDescription.setValue({ value: this.dataStructure.description });

					this.editPhase = Util.isEmpty(result.dataStructure) ? EditStatus.ADD : EditStatus.UPDATE;

					this.workingParam = this.dataStructure.hasMembers()
						? this.dataStructure.members[0]
						: Parameter.createParameter(
								this.namespace,
								this.formIds.dsbuilderId,
								this.languageId,
								this.availableLanguageIds,
								ParamType.STRING
						  );

					if (this.workingParam.isRendered()) {
						this.workingParam.focused = true;
					}

					this.setState({
						loadingStatus: LoadingStatus.COMPLETE
					});
				},
				errorFunc: (err) => {
					console.log("ajax error: ", err);
					this.loadingFailMessage = "Failed to load data structure: " + this.dataTypeId;
					this.setState({ loadingStatus: LoadingStatus.FAIL });
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

	handleNewParameter = () => {
		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		this.workingParam.focused = false;
		this.workingParam.fireRefreshPreview();

		this.workingParam = Parameter.createParameter(
			this.namespace,
			this.formIds.dsbuilderId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING
		);

		//this.dataStructure.focus();

		//this.fireRefreshPropertyPanel();

		this.forceUpdate();
	};

	handleSaveDataStructure = () => {
		console.log(JSON.stringify(this.dataStructure.toJSON(), null, 4));
		console.log(JSON.stringify(this.typeStructureLink.toJSON(), null, 4));

		if (this.dataStructure.hasError() || Util.isNotEmpty(this.checkError())) {
			this.openErrorDlg(Util.translate("fix-the-error-first", this.dataStructure.errorMessage));
			return;
		}

		/*
		const formData = new FormData();
		formData.append(this.namespace + "typeStructureLink", this.typeStructureLink.toJSON());
		formData.append(this.namespace + "dataStructure", this.dataStructure.toJSON());
		*/

		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.SAVE_DATASTRUCTURE,
			params: {
				typeStructureLink: JSON.stringify(this.typeStructureLink.toJSON()),
				dataStructure: JSON.stringify(this.dataStructure.toJSON())
			},
			successFunc: (result) => {
				console.log("Saved dataStructure result: ", result);
				this.dataStructure.dataStructureId = result.dataStructureId;
				this.dataStructure.setDirty(false);

				this.setState({
					confirmDlgState: true,
					confirmDlgHeader: SXModalUtil.successDlgHeader(this.spritemap),
					confirmDlgBody: (
						<h4>
							{Util.translate(
								"datastructure-is-saved-successfully-as-which-is-linked-to",
								result.dataStructureId,
								result.dataTypeId
							)}
						</h4>
					)
				});
			},
			errorFunc: (err) => {
				this.setState({ loadingStatus: LoadingStatus.FAIL });
			}
		});
	};

	handleAddParameter = () => {
		if (this.workingParam.checkIntegrity()) {
			this.dataStructure.addMember(this.workingParam);
			this.dataStructure.focus(this.workingParam.paramCode, this.workingParam.paramVersion);
			this.forceUpdate();
		} else {
			console.log("checkIntegrity fail: ", this.workingParam);
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
				<SXDataTypeStructureLink
					namespace={this.namespace}
					formId={this.formIds.dsbuilderId}
					languageId={this.languageId}
					availableLanguageIds={this.availableLanguageIds}
					dataType={this.dataType}
					dataTypeViewMode={DataTypeStructureLink.ViewTypes.VIEW}
					typeStructureLink={this.typeStructureLink}
					typeStructureLinkViewMode={DataTypeStructureLink.ViewTypes.EDIT}
					dataStructure={this.dataStructure}
					dataStructureViewMode={DataTypeStructureLink.ViewTypes.EDIT}
					spritemap={this.spritemap}
				/>
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
								formIds={this.formIds}
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
											(group.paramCode == GroupParameter.ROOT_GROUP
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
				</div>
				{this.workbench.windowCount > 0 && this.workbench.windowContentArray}
			</>
		);
	}
}

export default DataStructureBuilder;
