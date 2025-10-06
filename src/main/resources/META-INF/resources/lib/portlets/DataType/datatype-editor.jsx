import React from "react";
import { Text } from "@clayui/core";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { SXAutoComplete, SXButtonWithIcon, SXLabeledText } from "../../stationx/form";
import { Util } from "../../stationx/util";
import {
	EditStatus,
	LoadingStatus,
	Event,
	DataTypeProperty,
	ValidationRule,
	ResourceIds,
	PortletKeys,
	WindowState,
	Constant,
	ErrorClass,
	ParamType
} from "../../stationx/station-x";
import {
	BooleanParameter,
	DualListParameter,
	GroupParameter,
	Parameter,
	StringParameter
} from "../../stationx/parameter";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { ClaySelect } from "@clayui/form";
import { DataType, DataTypeStructureLink, SXDataTypeStructureLink } from "./datatype";
import { Autocomplete } from "@clayui/autocomplete";
import { DataStructure } from "../DataStructure/data-structure";
import { SXBroomIcon, SXEditIcon, SXUpgradeIcon } from "../../stationx/icon";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";

export const DataTypeInfo = ({ title, abstract, items, colsPerRow = 1 }) => {
	let sectionContent;

	if (colsPerRow == 1) {
		sectionContent = items.map((item, index) => (
			<div
				class="form-group-item"
				key={index}
			>
				<SXLabeledText
					label={item.label}
					text={item.text}
				/>
			</div>
		));
	} else if (colsPerRow > 1) {
		let rows = Util.convertArrayToRows(items, colsPerRow);

		sectionContent = rows.map((row, rowIndex) => (
			<div
				key={rowIndex}
				className="form-group-autofit"
				style={{ marginBottom: "5px" }}
			>
				{row.map((col, colIndex) => (
					<div
						key={(rowIndex + 1) * (colIndex + 1)}
						className="form-group-item"
						style={{ marginBottom: "0" }}
					>
						<SXLabeledText
							label={col.label}
							text={col.text}
							viewType="INLINE_ATTACH"
						/>
					</div>
				))}
			</div>
		));
	}

	return (
		<div className="form-group sheet">
			<div
				className="sheet-header"
				style={{ marginBottom: "20px" }}
			>
				<h3
					className="sheet-title"
					style={{ marginBottom: "10px" }}
				>
					{title}
				</h3>
				<div
					className="sheet-text"
					style={{ marginBottom: "5px" }}
				>
					{abstract}
				</div>
			</div>
			<div
				className="sheet-section"
				style={{ marginBottom: "1rem" }}
			>
				{sectionContent}
			</div>
		</div>
	);
};

class DataTypeEditor extends SXBaseVisualizer {
	dataTypeAutoCompleteItems = [];
	dataStructureAutoCompleteItems = [];

	constructor(props) {
		super(props);

		//console.log("DataTypeEditor props: ", props);
		console.log("LanguageID: ", Liferay.ThemeDisplay.getLanguageId(), SXSystem.getLanguageId(), this.languageId);
		this.dirty = false;

		this.dataType = new DataType(this.languageId, this.availableLanguageIds);
		this.dataType.dataTypeId = this.params.dataTypeId ?? 0;
		this.structureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
		this.dataStructure = new DataStructure(this.namespace, this.formId, this.languageId, this.availableLanguageIds);

		this.loadingFailMessage = "";
		this.prevVersion = "";

		this.dataTypeCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.CODE,
				displayName: Util.getTranslationObject(this.languageId, "datatype-code"),
				required: true,
				placeholder: Util.getTranslationObject(this.languageId, "datatype-code"),
				tooltip: Util.getTranslationObject(this.languageId, "code-tooltip"),
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
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", ", 3"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", ", 32"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		const versionPlaceholder = {};
		versionPlaceholder[this.languageId] = "1.0.0";
		this.dataTypeVersion = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.VERSION,
				displayName: Util.getTranslationObject(this.languageId, "version"),
				required: true,
				placeholder: versionPlaceholder,
				tooltip: Util.getTranslationObject(this.languageId, "version-tooltip"),
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
					}
				},
				defaultValue: "1.0.0"
			}
		);

		const versionExt = {};
		versionExt[this.languageId] = "ext";
		this.extension = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.EXTENSION,
				displayName: Util.getTranslationObject(this.languageId, "extension"),
				required: true,
				placeholder: versionExt,
				tooltip: Util.getTranslationObject(this.languageId, "extension-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.EXTENSION,
						message: Util.getTranslationObject(this.languageId, "invalid-extension"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 2,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", ", 2"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 8,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", ", 8"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		this.displayName = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.DISPLAY_NAME,
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "display-name"),
				required: true,
				placeholder: Util.getTranslationObject(this.languageId, "display-name"),
				tooltip: Util.getTranslationObject(this.languageId, "display-name-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 6,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", ", 6"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", ", 64"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		this.description = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.DESCRIPTION,
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "description-tooltip"),
				multipleLine: true
			}
		);

		this.tooltip = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.TOOLTIP,
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "tooltip"),
				placeholder: Util.getTranslationObject(this.languageId, "tooltip"),
				tooltip: Util.getTranslationObject(this.languageId, "tooltip-tooltip"),
				validation: {
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", ", 32"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		this.visualizers = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			"DualList",
			{
				paramCode: DataTypeProperty.VISUALIZERS,
				displayName: Util.getTranslationObject(this.languageId, "associated-visualizers"),
				required: true,
				tooltip: Util.getTranslationObject(this.languageId, "associated-visualizers-tooltip"),
				viewType: DualListParameter.ViewTypes.HORIZONTAL,
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					}
				},
				options: []
			}
		);

		this.groupParameter = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramCode: "basicProps",
				paramVersion: "1.0.0",
				viewType: GroupParameter.ViewTypes.ARRANGEMENT,
				members: [this.dataTypeCode, this.dataTypeVersion, this.extension],
				membersPerRow: 3
			}
		);

		this.fields = [this.groupParameter, this.displayName, this.description, this.tooltip, this.visualizers];

		this.state = {
			loadingStatus: LoadingStatus.PENDING,
			autoCompleteField: "label",
			deleteSuccessDlgStatus: false,
			infoDialog: false,
			dataTypeCodeDuplicated: false,
			dataTypeDuplicated: false,
			dlgWarningDeleteDataType: false,
			dlgDeleteLinkInfoAndImportDataStructure: false,
			dlgSaveLinkInfoAndRedirectToBuilder: false,
			dlgWarningRemoveLinkInfo: false,
			dlgWarningRemoveLinkInfoAndRedirectToBuilder: false,
			underConstruction: false
		};

		this.dlgBody = <></>;
		this.dlgHeader = <></>;
		this.dataTypeImportId = this.namespace + "dataTypeImport";
		this.dataStructureImportId = this.namespace + "dataStructureImport";
		this.editStatus = props.params.dataTypeId > 0 ? EditStatus.UPDATE : EditStatus.ADD;
	}

	/**********************
	 *  Event Listers from other components.
	 ***********************/
	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);
		//console.log("SX_FIELD_VALUE_CHANGED Before: ", dataPacket);

		if (!dataPacket) {
			return;
		}

		//console.log("SX_FIELD_VALUE_CHANGED After: ", dataPacket);

		this.setDataTypeValue(dataPacket.paramCode);
	};

	listenerAutocompleteSelected = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);
		//console.log("SX_AUTOCOMPLETE_SELECTED: ", event.dataPacket);

		if (!dataPacket) {
			return;
		}

		//console.log("SX_AUTOCOMPLETE_SELECTED: ", dataPacket);

		if (dataPacket.id == this.dataTypeImportId) {
			this.importDataType(dataPacket.item.dataTypeId);
		} else if (dataPacket.id == this.dataStructureImportId) {
			console.log("Import dataStructure: ", dataPacket);
			this.importDataStructureId = dataPacket.item.dataStructureId;

			if (this.structureLink.dataTypeId > 0) {
				this.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.dlgBody = Util.translate("current-link-will-be-delete-and-unrecoverable-are-you-sure-to-proceed");

				this.setState({
					dlgDeleteLinkInfoAndImportDataStructure: true
				});
			} else {
				this.fireRequest({
					requestId: Workbench.RequestIDs.importDataStructure,
					params: {
						dataStructureId: this.importDataStructureId
					},
					refresh: true
				});

				this.setState({ loadingStatus: LoadingStatus.PENDING });
			}
		}
	};

	listenerTypeStructureLinkInfoChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);
		//console.log("SX_AUTOCOMPLETE_SELECTED: ", event.dataPacket);

		if (!dataPacket) {
			return;
		}

		this.forceUpdate();
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataTypeEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[dataTypeEditor] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.loadDataType,
			params: {
				dataTypeId: this.dataType.dataTypeId,
				loadStructure: true,
				loadVisualizers: true,
				loadAvailableVisualizers: true,
				loadDataTypeAutoCompleteItems: true,
				loadDataStructureAutoCompleteItems: true
			},
			refresh: true
		});

		this.setState({ loadingStatus: LoadingStatus.PENDING });
	};

	listenerResponce = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeEditor] listenerResponce rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeEditor] listenerResonse: ", dataPacket);

		const state = {};
		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.checkDataTypeUnique: {
				const result = dataPacket.data;
				const { validationCode, dataTypeCode, dataTypeVersion } = dataPacket.params;

				if (!result) {
					const errorMessage =
						validationCode == "code"
							? Util.translate("datatype-code-duplicated")
							: Util.translate("datatype-duplicated");

					this.dataTypeCode.setError(ErrorClass.ERROR, errorMessage);

					state.dataTypeDuplicated = true;
				} else {
					this.dataType.dataTypeCode = dataTypeCode;
					this.dataType.dataTypeVersion = dataTypeVersion;

					//If code is unique return here to prevent refresh.
					return;
				}

				break;
			}
			case Workbench.RequestIDs.addDataType:
			case Workbench.RequestIDs.updateDataType: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					if (!this.dataType.dataTypeId) {
						this.dataType.dataTypeId = dataPacket.data.dataTypeId;
					}

					this.dlgHeader = SXModalUtil.successDlgHeader(this.spritemap);
					this.dlgBody = Util.translate("datatype-is-saved-successfully-as", this.dataType.dataTypeId);
					state.infoDialog = true;

					this.editStatus = EditStatus.UPDATE;
				}

				break;
			}
			case Workbench.RequestIDs.deleteTypeStructureLinkAndImportDataStructure: {
				this.structureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
				this.dataStructure = new DataStructure(
					this.namespace,
					this.formId,
					this.languageId,
					this.availableLanguageIds
				);

				this.importDataStructure();

				break;
			}
			case Workbench.RequestIDs.removeLinkInfoAndRedirectToBuilder: {
				this.redirectToStructureBuilder();

				break;
			}
			case Workbench.RequestIDs.deleteTypeStructureLink: {
				this.structureLink.dirty = false;

				this.dlgHeader = SXModalUtil.successDlgHeader(this.spritemap);
				this.dlgBody = Util.translate("datatype-structure-link-info-deleted", this.structureLink.dataTypeId);
				this.setState({ infoDialog: true });

				break;
			}
			case Workbench.RequestIDs.loadDataType: {
				this.loadDataType(dataPacket.data);

				break;
			}
			case Workbench.RequestIDs.deleteDataTypes: {
				this.redirectTo({
					portletName: PortletKeys.DATATYPE_EXPLORER
				});

				break;
			}
			case Workbench.RequestIDs.importDataType: {
				this.setImportedDataType(dataPacket.data);

				break;
			}
			case Workbench.RequestIDs.importDataStructure: {
				this.importDataStructure(dataPacket.data);

				break;
			}
			case Workbench.RequestIDs.saveLinkInfoAndRedirectToBuilder: {
				this.structureLink.dirty = false;

				this.redirectToStructureBuilder();
				break;
			}
			case Workbench.RequestIDs.saveTypeStructureLink: {
				this.structureLink.dirty = false;
				this.structureLink.fromDB = true;

				this.dlgHeader = SXModalUtil.successDlgHeader(this.spritemap);
				this.dlgBody = Util.translate(
					"datatype-structure-link-info-saved",
					this.structureLink.dataTypeId,
					this.structureLink.dataStructureId
				);

				state.infoDialog = true;

				break;
			}
		}

		this.setState({
			...state,
			loadingStatus: dataPacket.status
		});
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//Loading dataType
		//this.loadDataType();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_AUTOCOMPLETE_SELECTED, this.listenerAutocompleteSelected);
		Event.on(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerTypeStructureLinkInfoChanged);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataTypeEditor] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_AUTOCOMPLETE_SELECTED, this.listenerAutocompleteSelected);
		Event.off(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.listenerTypeStructureLinkInfoChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	loadDataType = (data) => {
		console.log("data type loaded: ", data, this.dataType);

		this.dataType.parse(data.dataType ?? {});

		// Set dataType values to fields and initialize fields
		this.setFormValues();

		this.structureLink.parse(data.structureLink ?? {});
		if (this.structureLink.dataTypeId > 0) {
			this.structureLink.fromDB = true;
		}

		this.dataStructure.parse(data.dataStructure ?? {});
		/*
		console.log(
			"In Loading: ",
			JSON.stringify(this.structureLink, null, 4),
			this.structureLink,
			this.dataStructure
		);
		*/

		this.visualizers.options = data.availableVisualizers.map((item) => ({
			label: item.displayName,
			value: item.id + "",
			typeVisualizerLinkId: item.typeVisualizerLinkId ?? 0
		}));

		if (Util.isNotEmpty(data.visualizers)) {
			//console.log("data.visualizers: ", data.visualizers);
			this.visualizers.setValue({
				value: data.visualizers.map((v) => ({
					value: v.id + "",
					label: v.displayName,
					typeVisualizerLinkId: v.typeVisualizerLinkId
				}))
			});
			this.visualizers.dirty = false;
		}
		//this.visualizers.disabled = !this.dataType.validate();

		this.dataTypeAutoCompleteItems = data.dataTypeAutoCompleteItems;
		this.dataStructureAutoCompleteItems = data.dataStructureAutoCompleteItems;

		//console.log("AutoCompleItes: ", this.dataTypeAutoCompleteItems, this.dataStructureAutoCompleteItems);

		if (this.editStatus == EditStatus.IMPORT) {
			this.dataTypeCode.setError(ErrorClass.ERROR, Util.translate("change-datatype-code-or-version"));
		}

		//Change edit status
		if (this.editStatus == EditStatus.ADD) {
			this.editStatus = Util.isEmpty(data.dataType) ? EditStatus.ADD : EditStatus.UPDATE;
		}
	};

	setImportedDataType = (data) => {
		this.dataType.parse(data.dataType ?? {});
		this.dataType.dataTypeId = 0;
		this.dataType.dataTypeCode = "";
		this.dataType.dataTypeVersion = "1.0.0";
		this.dataType.dirty = true;

		console.log("imported data type loaded: ", data, this.dataType);

		// Set dataType values to fields and initialize fields
		this.setFormValues();

		this.structureLink.parse(data.structureLink ?? {});
		this.structureLink.dataTypeId = 0;
		this.structureLink.dirty = true;
		this.structureLink.fromDB = true;

		this.dataStructure.parse(data.dataStructure ?? {});
		console.log(
			"In Loading imported data type: ",
			JSON.stringify(this.structureLink, null, 4),
			this.structureLink,
			this.dataStructure
		);

		if (Util.isNotEmpty(data.visualizers)) {
			//console.log("data.visualizers: ", data.visualizers);
			this.visualizers.setValue({
				value: data.visualizers.map((v) => ({
					value: v.id,
					label: v.displayName,
					typeVisualizerLinkId: v.typeVisualizerLinkId
				}))
			});
			this.visualizers.dirty = false;
			//this.visualizers.disabled = false;
		}

		this.dataTypeAutoCompleteItems = data.dataTypeAutoCompleteItems;
		this.dataStructureAutoCompleteItems = data.dataStructureAutoCompleteItems;

		console.log(
			"imported data type AutoCompleItes: ",
			this.dataTypeAutoCompleteItems,
			this.dataStructureAutoCompleteItems
		);
	};

	importDataType = (dataTypeId) => {
		//console.log("loadDataType: ", this.dataType, this.dataType.dataTypeId);
		this.setState({ loadingStatus: LoadingStatus.PENDING });

		this.fireRequest({
			requestId: Workbench.RequestIDs.importDataType,
			params: {
				dataTypeId: dataTypeId,
				loadStructure: true,
				loadVisualizers: true,
				loadAvailableVisualizers: false,
				loadDataTypeAutoCompleteItems: true,
				loadDataStructureAutoCompleteItems: true
			},
			refresh: true
		});
	};

	setFormValues = () => {
		console.log("setFormValues: ", this.dataType);
		for (const prop in this.dataType) {
			switch (prop) {
				case "dataTypeCode": {
					this.dataTypeCode.setValue({ value: this.dataType.dataTypeCode });
					this.dataTypeCode.dirty = false;
					break;
				}
				case "dataTypeVersion": {
					this.dataTypeVersion.setValue({ value: this.dataType.dataTypeVersion });
					this.dataTypeVersion.dirty = false;
					break;
				}
				case "extension": {
					this.extension.setValue({ value: this.dataType.extension });
					this.extension.dirty = false;
					break;
				}
				case "displayName": {
					this.displayName.setValue({ value: this.dataType.displayName });
					this.displayName.dirty = false;
					break;
				}
				case "description": {
					this.description.setValue({ value: this.dataType.description });
					this.description.dirty = false;
					break;
				}
				case "tooltip": {
					this.tooltip.setValue({ value: this.dataType.tooltip });
					this.tooltip.dirty = false;
					break;
				}
			}
		}
	};

	clearForm = (forceUpdate = true) => {
		this.dataTypeCode.clearValue();
		this.dataTypeVersion.clearValue();
		this.extension.clearValue();
		this.displayName.clearValue();
		this.description.clearValue();
		this.tooltip.clearValue();

		this.visualizers.clearValue();

		if (forceUpdate) {
			this.forceUpdate();
		}
	};

	deleteDataType = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataTypes,
			params: {
				dataTypeIds: [this.dataType.dataTypeId]
			},
			refresh: true
		});
	};

	importDataStructure = (data) => {
		this.dataStructure.parse(data.dataStructure);
		this.structureLink.dataTypeId = this.dataType.dataTypeId;
		this.structureLink.dataStructureId = this.dataStructure.dataStructureId;
		this.structureLink.dirty = true;
		this.structureLink.fromDB = false;
		this.dataStructure.setTitleBarInfos(this.structureLink.toJSON());

		console.log(
			"importDataStructure: ",
			data.dataStructure,
			this.dataTypeId,
			this.structureLink,
			this.dataStructure
		);

		this.setState({ loadingStatus: LoadingStatus.COMPLETE });
	};

	setDataTypeValue = (fieldCode, value) => {
		switch (fieldCode) {
			case DataTypeProperty.CODE: {
				const dataTypeCode = value ?? this.dataTypeCode.getValue();

				if (Util.isNotEmpty(dataTypeCode)) {
					this.checkDataTypeUnique(dataTypeCode, this.dataTypeVersion.getValue(), "code");
				} else {
					this.forceUpdate();
				}

				break;
			}
			case DataTypeProperty.VERSION: {
				const version = value ?? this.dataTypeVersion.getValue();

				if (Util.isNotEmpty(version)) {
					this.checkDataTypeUnique(this.dataTypeCode.getValue(), version, "type");
				} else {
					this.forceUpdate();
				}

				break;
			}
			case DataTypeProperty.EXTENSION: {
				const extension = value ?? this.extension.getValue();

				this.dataType.extension = extension;

				this.forceUpdate();

				break;
			}
			case DataTypeProperty.DISPLAY_NAME: {
				const displayName = value ?? this.displayName.getValue();

				this.dataType.displayName = displayName;

				this.forceUpdate();

				break;
			}
			case DataTypeProperty.DESCRIPTION: {
				const description = value ?? this.description.getValue();

				this.dataType.description = description;

				break;
			}
			case DataTypeProperty.TOOLTIP: {
				const tooltip = value ?? this.tooltip.getValue();

				this.dataType.tooltip = tooltip;

				break;
			}
		}

		//console.log("Changed data type: ", this.dataType, this.dataType.validate());
	};

	checkDataTypeUnique = (dataTypeCode, dataTypeVersion, validationCode) => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.checkDataTypeUnique,
			params: {
				dataTypeId: this.dataType.dataTypeId,
				dataTypeCode: dataTypeCode,
				dataTypeVersion: dataTypeVersion,
				validationCode: validationCode
			},
			refresh: false
		});
	};

	getField(fields, fieldCode) {
		let found = null;

		fields.every((field) => {
			if (field.isGroup) {
				found = this.getField(field.members, fieldCode);

				if (found) {
					return Constant.STOP_EVERY;
				}
			} else if (field.paramCode == fieldCode) {
				found = field;
				return Constant.STOP_EVERY;
			}

			return Constant.CONTINUE_EVERY;
		});

		return found;
	}

	removeLinkInfo = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteTypeStructureLink,
			params: this.structureLink.toJSON(),
			refresh: true
		});
	};

	removeLinkInfoAndRedirectToBuilder = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.removeLinkInfoAndRedirectToBuilder,
			params: this.structureLink.toJSON(),
			refresh: false
		});
	};

	redirectToStructureBuilder = () => {
		this.redirectTo({
			portletName: PortletKeys.DATASTRUCTURE_BUILDER,
			params: {
				dataTypeId: this.dataType.dataTypeId
			}
		});
	};

	collectFormValues() {
		let formValues = {};

		this.fields.forEach((field) => {
			const data = field.toData();

			//console.log("toData: ", data);
			if (Util.isNotEmpty(data)) {
				formValues = { ...formValues, ...data };
			}
		});

		let dataTypeValues = {};
		for (const fieldCode in formValues) {
			dataTypeValues[fieldCode] = formValues[fieldCode].value;
		}

		//console.log("DataTypeEditor.dataTypeValues: ", dataTypeValues);
		return dataTypeValues;
	}

	validateFormValues = (fields) => {
		let error;
		fields.every((field) => {
			//console.log("validate field: ", field);

			if (field.hasError()) {
				error = field.error;
			} else {
				if (field.isGroup) {
					error = this.validateFormValues(field.members);
				} else {
					field.validate();

					if (field.hasError()) {
						field.setDirty();
						error = field;
					}
				}
			}

			return Util.isNotEmpty(error) ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return error;
	};

	deleteLinkInfoAndImportDataStructure = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteTypeStructureLinkAndImportDataStructure,
			params: {
				dataTypeId: this.structureLink.dataTypeId
			},
			refresh: true
		});
	};

	handleMoveToExplorer(e) {
		this.redirectTo({
			portletName: PortletKeys.DATATYPE_EXPLORER
		});
	}

	handleBtnSaveClick(e) {
		const error = this.validateFormValues(this.fields);

		if (error) {
			this.dlgHeader = SXModalUtil.errorDlgHeader(this.spritemap);
			this.dlgBody = Util.translate("fix-the-error-first", error.message);

			this.setState({ infoDialog: true });
			return;
		}

		const formValues = {
			dataType: this.dataType.toJSON()
		};

		if (this.structureLink.dataTypeId > 0) {
			formValues.structureLink = this.structureLink.toJSON();
		}

		if (Util.isNotEmpty(this.visualizers.getValue())) {
			formValues.visualizers = this.visualizers.getValue();
		}

		const requestId =
			this.editStatus == EditStatus.UPDATE
				? Workbench.RequestIDs.updateDataType
				: Workbench.RequestIDs.addDataType;
		//console.log("handleBtnSaveClick: ", JSON.stringify(formValues, null, 4), this.fields);

		this.fireRequest({
			requestId: requestId,
			params: {
				dataTypeId: this.dataType.dataTypeId,
				formData: JSON.stringify(formValues)
			},
			refresh: true
		});
	}

	handleBtnUpgradeDataTypeClick() {
		this.prevVersion = this.dataTypeVersion.getValue();

		this.dataTypeCode.disabled = true;
		this.dataTypeCode.refreshKey();

		this.dataType.dataTypeId = 0;
		this.structureLink.dataTypeId = 0;

		this.editStatus = EditStatus.UPGRADE;

		this.forceUpdate();
	}

	handleBtnCopyDataTypeClick() {
		this.dataType = this.dataType.copy();
		this.structureLink.dataTypeId = 0;

		this.dataTypeCode.value = "";
		this.dataTypeVersion.value = "1.0.0";
		this.extension.value = "";

		this.dataType.dataTypeId = 0;
		this.editStatus = EditStatus.ADD;

		this.forceUpdate();
	}

	handleNewDataStructureBtnClick = () => {
		//console.log("redirectTo: ", this.workbench.portletId, this.state);
		if (this.structureLink.dataTypeId > 0) {
			this.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dlgBody = Util.translate("current-link-will-be-delete-and-unrecoverable-are-you-sure-to-proceed");

			this.setState({ dlgWarningRemoveLinkInfoAndRedirectToBuilder: true });
		} else {
			this.redirectToStructureBuilder();
		}
	};

	handleDeleteDataTypeBtnClick(e) {
		this.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dlgBody = Util.translate("this-is-not-recoverable-are-you-sure-delete-the-datatype");

		this.setState({ dlgWarningDeleteDataType: true });
	}

	handleClearButtonClick = () => {
		this.dataTypeCode.setValue({ value: "" });
		this.dataTypeVersion.setValue({ value: "" });
	};

	handleUpdateStructure = () => {
		if (this.structureLink.dirty) {
			this.setState({ dlgSaveLinkInfoAndRedirectToBuilder: true });
		} else {
			this.redirectToStructureBuilder();
		}
	};

	handleSaveLinkInfoBtnClick = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.saveTypeStructureLink,
			params: this.structureLink.toJSON(),
			refresh: true
		});
	};

	handleSaveLinkInfoAndRedirectToBuilder = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.saveLinkInfoAndRedirectToBuilder,
			params: this.structureLink.toJSON(),
			refresh: false
		});
	};

	handleRemoveLinkInfoBtnClick = () => {
		this.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dlgBody = Util.translate("this-is-not-recoverable-are-you-sure-delete-the-link-info");

		console.log("handleRemoveLinkInfoBtnClick: ", this.structureLink);
		if (this.structureLink.fromDB) {
			this.setState({ dlgWarningRemoveLinkInfo: true });
		} else {
			this.structureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
			this.dataStructure = new DataStructure(
				this.namespace,
				this.formId,
				this.languageId,
				this.availableLanguageIds
			);

			this.forceUpdate();
		}
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <h1>Loading......</h1>;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <h1>Data Loading Failed......</h1>;
		} else if (this.state.loadingStatus == LoadingStatus.COMPLETE) {
			//console.log("Render: ", this.dataType, this.dataType.validate());
			return (
				<>
					<div
						className="autofit-float-end-sm-down autofit-padded-no-gutters-x autofit-row"
						style={{ borderBottom: "3px solid #e7e7ed", marginBottom: "1.5rem" }}
					>
						<div className="autofit-col autofit-col-expand">
							<Text
								size={6}
								weight="bold"
							>
								{this.editStatus == EditStatus.UPDATE
									? Util.translate("edit-datatype")
									: Util.translate("add-datatype")}
							</Text>
						</div>
						{this.editStatus == EditStatus.ADD && (
							<div className="autofit-col">
								<SXAutoComplete
									id={this.dataTypeImportId}
									namespace={this.namespace}
									formId={this.formId}
									label={Util.translate("import-datatype")}
									items={this.dataTypeAutoCompleteItems}
									itemLabelKey="displayName"
									itemFilterKey="displayName"
									itemValueKey="dataTypeId"
									symbol="import"
									spritemap={this.spritemap}
								/>
							</div>
						)}
						<div className="autofit-col">
							<Button.Group spaced>
								{this.editStatus !== EditStatus.IMPORT && (
									<SXButtonWithIcon
										label={Util.translate("save")}
										symbol={"disk"}
										disabled={!this.dataType.validate()}
										onClick={(e) => this.handleBtnSaveClick(e)}
										spritemap={this.spritemap}
									/>
								)}
								{(this.editStatus == EditStatus.UPDATE || this.editStatus == EditStatus.IMPORT) && (
									<>
										<SXButtonWithIcon
											label={Util.translate("upgrade")}
											symbol={"file-template"}
											displayType={"secondary"}
											onClick={(e) => this.handleBtnUpgradeDataTypeClick(e)}
											spritemap={this.spritemap}
										/>
										<SXButtonWithIcon
											label={Util.translate("copy")}
											symbol={"file-template"}
											displayType={"secondary"}
											onClick={() => this.handleBtnCopyDataTypeClick()}
											spritemap={this.spritemap}
										/>
										{this.editStatus == EditStatus.UPDATE && (
											<SXButtonWithIcon
												label={Util.translate("delete")}
												symbol={"trash"}
												displayType={"warning"}
												onClick={(e) => this.handleDeleteDataTypeBtnClick(e)}
												spritemap={this.spritemap}
											/>
										)}
										{this.editStatus == EditStatus.IMPORT && (
											<Button
												title={Util.translate("clear")}
												displayType="secondary"
												onClick={this.handleClearButtonClick}
											>
												<span className="inline-item inline-item-before">
													<SXBroomIcon />
												</span>
												{Util.translate("clear")}
											</Button>
										)}
									</>
								)}
							</Button.Group>
						</div>
						<div className="autofit-col">
							<SXButtonWithIcon
								id={this.namespace + "btnMoveToExplorer"}
								label={Util.translate("datatype-list")}
								symbol="list"
								displayType="link"
								style={{ float: "right" }}
								size="md"
								onClick={(e) => this.handleMoveToExplorer(e)}
								spritemap={this.spritemap}
							/>
						</div>
					</div>
					{this.dataType.dataTypeId > 0 && (
						<SXLabeledText
							label={Util.translate("datatype-id")}
							text={this.dataType.dataTypeId}
							align="left"
							viewType="INLINE_ATTACH"
							style={{ marginBottom: "1rem" }}
						/>
					)}
					{this.fields.map((field) =>
						field.renderField({
							spritemap: this.spritemap
						})
					)}

					{this.editStatus !== EditStatus.ADD && (
						<>
							<div
								className="autofit-float autofit-padded-no-gutters-x autofit-row form-group"
								style={{ borderBottom: "3px solid rgb(231,231,237)", marginBottom: "2.0rem" }}
							>
								<div className="autofit-col autofit-col-expand">
									<h3>{Util.translate("linked-datastructure-info")}</h3>
								</div>
								<div className="autofit-col">
									<SXAutoComplete
										key={!this.dataType.validate()}
										id={this.dataStructureImportId}
										namespace={this.namespace}
										formId={this.formId}
										label={Util.translate("import-datastructure")}
										items={this.dataStructureAutoCompleteItems}
										itemLabelKey="displayName"
										itemFilterKey="displayName"
										itemValueKey="dataStructureId"
										disabled={!this.dataType.validate()}
										symbol="import"
										spritemap={this.spritemap}
									/>
								</div>
								<div className="autofit-col">
									<Button.Group spaced>
										{this.editStatus !== EditStatus.ADD && this.structureLink.dataTypeId > 0 && (
											<>
												<Button
													title={Util.translate("save-link-info")}
													onClick={this.handleSaveLinkInfoBtnClick}
													disabled={!this.structureLink.dirty}
													displayType="secondary"
												>
													<span className="inline-item inline-item-before">
														<Icon
															symbol="disk"
															spritemap={this.spritemap}
														/>
													</span>
													{Util.translate("save-link-info")}
												</Button>
												<Button
													title={Util.translate("remove-link-info")}
													displayType={"warning"}
													onClick={this.handleRemoveLinkInfoBtnClick}
													disabled={this.structureLink.dataTypeId == 0}
												>
													<span className="inline-item inline-item-before">
														<Icon
															symbol="times-circle"
															spritemap={this.spritemap}
														/>
													</span>
													{Util.translate("remove-link-info")}
												</Button>
											</>
										)}
										{this.editStatus !== EditStatus.ADD &&
											this.structureLink.dataStructureId > 0 && (
												<Button
													title={Util.translate("datastructure-edit")}
													onClick={() => this.handleUpdateStructure()}
													displayType="secondary"
												>
													<span className="inline-item inline-item-before">
														<SXEditIcon />
													</span>
													{Util.translate("edit-datastructure")}
												</Button>
											)}
										<Button
											title={Util.translate("new-datastructure")}
											onClick={this.handleNewDataStructureBtnClick}
											disabled={
												this.editStatus == EditStatus.IMPORT || this.dataType.dataTypeId < 1
											}
										>
											<span className="inline-item inline-item-before">
												<Icon
													symbol="plus"
													spritemap={this.spritemap}
												/>
											</span>
											{Util.translate("new-datastructure")}
										</Button>
									</Button.Group>
								</div>
							</div>
							{this.structureLink.dataTypeId > 0 && (
								<SXDataTypeStructureLink
									namespace={this.namespace}
									formId={this.formId}
									languageId={this.languageId}
									availableLanguageIds={this.availableLanguageIds}
									typeStructureLink={this.structureLink}
									typeStructureLinkViewMode={DataTypeStructureLink.ViewTypes.EDIT}
									dataStructure={this.dataStructure}
									dataStructureViewMode={DataTypeStructureLink.ViewTypes.VIEW}
									spritemap={this.spritemap}
								/>
							)}
						</>
					)}
					{this.state.infoDialog && (
						<SXModalDialog
							header={this.dlgHeader}
							body={this.dlgBody}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: () => {
										this.setState({ infoDialog: false });
									}
								}
							]}
						/>
					)}
					{this.state.dlgWarningDeleteDataType && (
						<SXModalDialog
							header={this.dlgHeader}
							body={this.dlgBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataType();
										this.setState({ dlgWarningDeleteDataType: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ dlgWarningDeleteDataType: false });
									}
								}
							]}
						/>
					)}
					{this.state.dataTypeCodeDuplicated && (
						<SXModalDialog
							header={SXModalUtil.errorDlgHeader(this.spritemap)}
							body={Util.translate("datatype-name-duplicated") + ": " + this.dataTypeCode.getValue()}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: (e) => {
										this.setState({
											dataTypeCodeDuplicated: false
										});
									}
								}
							]}
						/>
					)}
					{this.structureLink.dataTypeId > 0 && this.state.dlgDeleteLinkInfoAndImportDataStructure && (
						<SXModalDialog
							header={this.dlgHeader}
							body={this.dlgBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteLinkInfoAndImportDataStructure();
										this.setState({ dlgDeleteLinkInfoAndImportDataStructure: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ dlgDeleteLinkInfoAndImportDataStructure: false });
									}
								}
							]}
						/>
					)}
					{this.state.dlgSaveLinkInfoAndRedirectToBuilder && (
						<SXModalDialog
							header={this.dlgHeader}
							body={Util.translate("link-info-is-not-saved-do-you-save-the-info")}
							buttons={[
								{
									label: Util.translate("save"),
									onClick: (e) => {
										this.handleSaveLinkInfoAndRedirectToBuilder();
										this.setState({ dlgSaveLinkInfoAndRedirectToBuilder: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ dlgSaveLinkInfoAndRedirectToBuilder: false });
										this.redirectToStructureBuilder();
									}
								}
							]}
						/>
					)}
					{this.state.dlgWarningRemoveLinkInfo && (
						<SXModalDialog
							header={SXModalUtil.warningDlgHeader(this.spritemap)}
							body={this.dlgBody}
							buttons={[
								{
									label: Util.translate("delete"),
									onClick: (e) => {
										this.removeLinkInfo();
										this.setState({ dlgWarningRemoveLinkInfo: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ dlgWarningRemoveLinkInfo: false });
									}
								}
							]}
						/>
					)}
					{this.state.dlgWarningRemoveLinkInfoAndRedirectToBuilder && (
						<SXModalDialog
							header={SXModalUtil.warningDlgHeader(this.spritemap)}
							body={Util.translate(
								"current-link-will-be-delete-and-unrecoverable-are-you-sure-to-proceed"
							)}
							buttons={[
								{
									label: Util.translate("just-do-it"),
									onClick: (e) => {
										this.removeLinkInfoAndRedirectToBuilder();
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ dlgWarningRemoveLinkInfoAndRedirectToBuilder: false });
									}
								}
							]}
						/>
					)}
				</>
			);
		}
	}
}

export default DataTypeEditor;
