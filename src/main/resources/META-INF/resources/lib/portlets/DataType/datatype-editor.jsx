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
import { SXModalDialog } from "../../stationx/modal";
import { ClaySelect } from "@clayui/form";
import { DataType, DataTypeStructureLink, SXDataTypeStructureLink } from "./datatype";
import { Autocomplete } from "@clayui/autocomplete";
import { DataStructure } from "../DataStructure/data-structure";
import { SXBroomIcon, SXEditIcon, SXUpgradeIcon } from "../../stationx/icon";

export const DataTypeInfo = ({ title, abstract, items, colsPerRow = 1 }) => {
	let sectionContent;

	if (colsPerRow === 1) {
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

class DataTypeEditor extends React.Component {
	dataTypeAutoCompleteItems = [];
	dataStructureAutoCompleteItems = [];

	constructor(props) {
		super(props);

		//console.log("DataTypeEditor props: ", props);
		this.namespace = props.namespace;
		this.baseResourceURL = props.baseResourceURL;
		this.spritemap = props.spritemapPath;
		this.languageId = props.languageId;
		this.availableLanguageIds = props.availableLanguageIds;
		this.permissions = props.permissions;

		this.redirectURLs = props.redirectURLs;
		this.workbench = props.workbench;
		this.params = props.params;

		this.formId = this.namespace + "dataTypeEditor";

		this.dirty = false;

		this.dataType = new DataType(this.languageId, this.availableLanguageIds);
		this.dataType.dataTypeId = this.params.dataTypeId;
		this.structureLink = new DataTypeStructureLink(this.languageId, this.availableLanguageIds);
		this.dataStructure = new DataStructure(this.namespace, this.formId, this.languageId, this.availableLanguageIds);

		this.loadingFailMessage = "";

		this.fields = [];

		this.dataTypeCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: DataTypeProperty.NAME,
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
			ParamType.DUALLIST,
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

		this.fields.push(this.groupParameter);
		this.fields.push(this.displayName);
		this.fields.push(this.description);
		this.fields.push(this.tooltip);
		this.fields.push(this.visualizers);

		this.state = {
			loadingStatus: LoadingStatus.PENDING,
			autoCompleteField: "label",
			deleteConfirmDlgStatus: false,
			deleteErrorDlgStatus: false,
			deleteSuccessDlgStatus: false,
			saveSuccessDlgStatus: false,
			dataTypeCodeDuplicated: false,
			dataTypeDuplicated: false
		};

		this.dataTypeImportId = this.namespace + "dataTypeImport";
		this.dataStructureImportId = this.namespace + "dataStructureImport";
		this.editStatus = props.params.dataTypeId > 0 ? EditStatus.UPDATE : EditStatus.ADD;
	}

	/**********************
	 *  Event Listers from other components.
	 ***********************/
	listernerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);
		//console.log("SX_FIELD_VALUE_CHANGED Before: ", dataPacket);

		if (!dataPacket) {
			return;
		}

		//console.log("SX_FIELD_VALUE_CHANGED After: ", dataPacket);

		this.setDataTypeValue(dataPacket.paramCode);
	};

	listernerAutocompleteSelected = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);
		//console.log("SX_AUTOCOMPLETE_SELECTED: ", event.dataPacket);

		if (!dataPacket) {
			return;
		}

		//console.log("SX_AUTOCOMPLETE_SELECTED: ", dataPacket);

		this.setState({ loadingStatus: LoadingStatus.PENDING });
		if (dataPacket.id === this.dataTypeImportId) {
			this.dataType.dataTypeId = dataPacket.item.dataTypeId;

			this.editStatus = EditStatus.IMPORT;
			this.loadDataType();
		} else if (dataPacket.id === this.dataStructureImportId) {
			console.log("Import dataStructure: ", dataPacket);
		}
	};

	componentDidMount() {
		//Loading dataType
		this.loadDataType();
		//if (this.dataType.dataTypeId > 0) {

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listernerFieldValueChanged);
		Event.on(Event.SX_AUTOCOMPLETE_SELECTED, this.listernerAutocompleteSelected);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listernerFieldValueChanged);
		Event.off(Event.SX_AUTOCOMPLETE_SELECTED, this.listernerAutocompleteSelected);
	}

	constructTypeStructureLink({ typeVisualizerLinkId = 0, dataTypeId = 0, dataStructureId = 0 }) {
		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.LOAD_DATASTRUCTURE,
			type: "post",
			dataType: "json",
			params: {
				dataStructureId: dataStructureId
			},
			successFunc: (result) => {
				this.setState({ loadingStatus: LoadingStatus.COMPLETE });
			},
			errorFunc: (err) => {
				this.loadingFailMessage = "Error while loading data structure info: " + ResourceIds.LOAD_DATASTRUCTURE;
				this.setState({ loadingStatus: LoadingStatus.FAIL });
			}
		});
	}

	loadDataType() {
		//console.log("loadDataType: ", this.dataType, this.dataType.dataTypeId);
		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.LOAD_DATATYPE,
			type: "post",
			dataType: "json",
			params: {
				dataTypeId: this.dataType.dataTypeId,
				loadStructure: true,
				loadVisualizers: true,
				loadAvailableVisualizers: true,
				loadDataTypeAutoCompleteItems: true,
				loadDataStructureAutoCompleteItems: true
			},
			successFunc: (result) => {
				console.log("data type loaded: ", result, this.dataType);

				this.dataType.parse(result.dataType ?? {});

				// Set dataType values to fields and initialize fields
				for (const prop in this.dataType) {
					switch (prop) {
						case "dataTypeCode": {
							this.dataTypeCode.setValue({ value: this.dataType.dataTypeCode });
							this.dataTypeCode.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.dataTypeCode.disabled = true;
							}
							break;
						}
						case "dataTypeVersion": {
							this.dataTypeVersion.setValue({ value: this.dataType.dataTypeVersion });
							this.dataTypeVersion.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.dataTypeVersion.disabled = true;
							}
							break;
						}
						case "extension": {
							this.extension.setValue({ value: this.dataType.extension });
							this.extension.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.extension.disabled = true;
							}
							break;
						}
						case "displayName": {
							this.displayName.setValue({ value: this.dataType.displayName });
							this.displayName.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.displayName.disabled = true;
							}
							break;
						}
						case "description": {
							this.description.setValue({ value: this.dataType.description });
							this.description.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.description.disabled = true;
							}
							break;
						}
						case "tooltip": {
							this.tooltip.setValue({ value: this.dataType.tooltip });
							this.tooltip.dirty = false;
							if (this.editStatus === EditStatus.IMPORT) {
								this.tooltip.disabled = true;
							}
							break;
						}
					}
				}

				this.structureLink.parse(result.structureLink ?? {});
				this.dataStructure.parse(result.dataStructure ?? {});
				console.log(
					"In Loading: ",
					JSON.stringify(this.structureLink, null, 4),
					this.structureLink,
					this.dataStructure
				);

				this.visualizers.options = result.availableVisualizers.map((item) => ({
					label: item.displayName,
					value: item.id,
					typeVisualizerLinkId: item.typeVisualizerLinkId ?? 0
				}));

				if (Util.isNotEmpty(result.visualizers)) {
					//console.log("result.visualizers: ", result.visualizers);
					this.visualizers.setValue({
						value: result.visualizers.map((v) => ({
							value: v.id,
							label: v.displayName,
							typeVisualizerLinkId: v.typeVisualizerLinkId
						}))
					});
					this.visualizers.dirty = false;
				}
				this.visualizers.disabled = !this.dataType.validate();

				this.dataTypeAutoCompleteItems = result.dataTypeAutoCompleteItems;
				this.dataStructureAutoCompleteItems = result.dataStructureAutoCompleteItems;

				console.log("AutoCompleItes: ", this.dataTypeAutoCompleteItems, this.dataStructureAutoCompleteItems);

				if (this.editStatus === EditStatus.IMPORT) {
					this.dataTypeCode.setError(ErrorClass.ERROR, Util.translate("change-datatype-code-or-version"));
				}

				//Change edit status
				if (this.editStatus === EditStatus.ADD) {
					this.editStatus = Util.isEmpty(result.dataType) ? EditStatus.ADD : EditStatus.UPDATE;
				}

				// Change loding state
				this.setState({
					loadingStatus: LoadingStatus.COMPLETE
				});
			},
			errorFunc: (err) => {
				this.loadingFailMessage = "Error while loading data type: " + this.dataType.dataTypeId;
				this.setState({ loadingStatus: LoadingStatus.FAIL });
			}
		});
	}

	setDataTypeValue = (fieldCode, value) => {
		switch (fieldCode) {
			case DataTypeProperty.NAME: {
				const dataTypeCode = value ?? this.dataTypeCode.getValue();

				if (Util.isNotEmpty(dataTypeCode)) {
					this.checkDataTypeUnique(dataTypeCode, this.dataTypeVersion.getValue(), "code");
				}

				this.forceUpdate();

				break;
			}
			case DataTypeProperty.VERSION: {
				const version = value ?? this.dataTypeVersion.getValue();

				if (Util.isNotEmpty(version)) {
					this.checkDataTypeUnique(this.dataTypeCode.getValue(), version, "type");
				}

				this.forceUpdate();

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

		if (this.visualizers.disabled === this.dataType.validate()) {
			this.visualizers.disabled = !this.dataType.validate();
		}
		//console.log("Changed data type: ", this.dataType, this.dataType.validate());
	};

	checkDataTypeUnique = (dataTypeCode, dataTypeVersion, validationCode) => {
		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.CHECK_DATATYPE_UNIQUE,
			type: "post",
			dataType: "json",
			params: {
				dataTypeId: this.dataType.dataTypeId,
				dataTypeCode: dataTypeCode,
				dataTypeVersion: dataTypeVersion,
				validationCode: validationCode
			},
			successFunc: (result) => {
				if (!result) {
					const errorMessage =
						validationCode === "code"
							? Util.translate("datatype-code-duplicated")
							: Util.translate("datatype-duplicated");

					this.dataTypeCode.setError(ErrorClass.ERROR, errorMessage);

					this.setState({ dataTypeDuplicated: true });
				} else {
					this.dataType.dataTypeCode = dataTypeCode;
					this.dataType.dataTypeVersion = dataTypeVersion;
				}
			},
			errorFunc: (err) => {
				this.loadingFailMessage = "Error while loading visualizers: ";
				this.setState({ loadingStatus: LoadingStatus.FAIL });
			}
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
			} else if (field.paramCode === fieldCode) {
				found = field;
				return Constant.STOP_EVERY;
			}

			return Constant.CONTINUE_EVERY;
		});

		return found;
	}

	handleMoveToExplorer(e) {
		Util.redirectTo(
			this.workbench.url,
			{
				namespace: this.workbench.namespace,
				portletId: this.workbench.portletId,
				windowState: WindowState.NORMAL
			},
			{
				workingPortletName: PortletKeys.DATATYPE_EXPLORER
			}
		);
	}

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

	validateFormValues(fields) {
		let errorParam;
		fields.every((field) => {
			//console.log("validate field: ", field);

			if (field.isGroup) {
				errorParam = this.validateFormValues(field.members);
			} else {
				field.validate();

				if (field.hasError()) {
					field.setDirty();
					errorParam = field;
				}
			}

			return errorParam ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return errorParam;
	}

	handleBtnSaveClick(e) {
		const errorParam = this.validateFormValues(this.fields);

		if (errorParam) {
			this.forceUpdate();

			return;
		}

		const saveResourceId =
			this.editStatus === EditStatus.UPDATE ? ResourceIds.UPDATE_DATATYPE : ResourceIds.ADD_DATATYPE;

		const formValues = {
			dataType: this.dataType.toJSON()
		};

		if (Util.isNotEmpty(this.structureLink.toJSON())) {
			formValues.structureLink = this.structureLink.toJSON();
		}

		if (Util.isNotEmpty(this.visualizers.getValue())) {
			formValues.visualizers = this.visualizers.getValue();
		}

		//console.log("handleBtnSaveClick: ", JSON.stringify(formValues, null, 4), this.fields);

		const params = {
			dataTypeId: this.dataType.dataTypeId,
			formData: JSON.stringify(formValues)
		};

		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: saveResourceId,
			type: "post",
			dataType: "json",
			params: params,
			successFunc: (result) => {
				//console.log("data: ", result);

				if (!this.dataType.dataTypeId) {
					this.dataType.dataTypeId = result.dataTypeId;
				}

				this.setState({
					saveSuccessDlgStatus: true
				});
				this.editStatus = EditStatus.UPDATE;
			},
			errorFunc: (a, b, c, d) => {
				console.log("ERROR: ", a, b, c, d);
			}
		});
	}

	handleBtnUpgradeDataTypeClick() {
		this.dataTypeVersion.value = "";
		this.dataTypeVersion.disabled = false;

		this.dataTypeCode.disabled = true;
		this.extension.disabled = true;
		this.displayName.disabled = false;
		this.description.disabled = false;
		this.tooltip.disabled = false;
		this.visualizers.disabled = false;

		this.dataType.dataTypeId = 0;
		this.structureLink.dataTypeId = 0;

		this.editStatus = EditStatus.UPGRADE;

		this.forceUpdate();
	}

	handleBtnCopyDataTypeClick() {
		this.dataTypeCode.value = "";
		this.dataTypeVersion.value = "1.0.0";
		this.extension.value = "";

		this.dataType.dataTypeId = 0;
		this.editStatus = EditStatus.ADD;

		this.forceUpdate();
	}

	handleBtnEditDataStructureClick() {
		//console.log("redirectTo: ", this.workbench.portletId, this.state);

		Util.redirectTo(
			this.workbench.url,
			{
				namespace: this.workbench.namespace,
				portletId: this.workbench.portletId,
				windowState: WindowState.NORMAL
			},
			{
				workingPortletName: PortletKeys.DATASTRUCTURE_BUILDER,
				workingPortletParams: JSON.stringify({
					dataTypeId: this.dataType.dataTypeId
				})
			}
		);
	}

	handleBtnDeleteClick(e) {
		this.setState({ deleteConfirmDlgStatus: true });
	}

	handleClearButtonClick = () => {
		this.dataTypeCode.setValue({ value: "" });
		this.dataTypeVersion.setValue({ value: "" });
	};

	handleRedirectToStructureBuilder = () => {
		Util.redirectTo(
			this.workbench.url,
			{
				namespace: this.workbench.namespace,
				portletId: this.workbench.portletId,
				windowState: WindowState.NORMAL
			},
			{
				workingPortletName: PortletKeys.DATASTRUCTURE_BUILDER,
				workingPortletParams: JSON.stringify({
					dataTypeId: this.dataType.dataTypeId
				})
			}
		);
	};

	handleSaveLinkInfo = () => {
		console.log("handleSaveLinkInfo: ", this.structureLink.toJSON());

		/*
		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.SAVE_TYPE_STRUCTURE_LINK,
			type: "post",
			dataType: "json",
			params: this.structureLink.toJSON(),
			successFunc: (result) => {
				console.log("SAVE_TYPE_STRUCTURE_LINK result: ", result);

				this.setState({
					saveSuccessDlgStatus: true
				});
			},
			errorFunc: (a, b, c, d) => {
				console.log("ERROR: ", a, b, c, d);
			}
		});
		*/
	};

	handleRemoveTypeStructureLink = () => {};

	clearForm() {
		this.dataTypeCode.clearValue();
		this.dataTypeVersion.clearValue();
		this.extension.clearValue();
		this.displayName.clearValue();
		this.description.clearValue();
		this.tooltip.clearValue();

		this.visualizers.clearValue();

		this.forceUpdate();
	}

	proceedDelete() {
		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.DELETE_DATATYPE,
			params: {
				dataTypeId: this.dataType.dataTypeId
			},
			successFunc: (result) => {
				this.clearForm();

				this.setState({ deleteSuccessDlgStatus: true });
			},
			errorFunc: (err) => {
				console.log("error: ", err);
				this.setState({ deleteErrorDlgStatus: true });
			}
		});
	}

	render() {
		if (this.state.loadingStatus === LoadingStatus.PENDING) {
			return <h1>Loading......</h1>;
		} else if (this.state.loadingStatus === LoadingStatus.FAIL) {
			return <h1>Data Loading Failed......</h1>;
		} else if (this.state.loadingStatus === LoadingStatus.COMPLETE) {
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
								{this.editStatus === EditStatus.UPDATE
									? Util.translate("edit-datatype")
									: Util.translate("add-datatype")}
							</Text>
						</div>
						{this.editStatus === EditStatus.ADD && (
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
								{(this.editStatus === EditStatus.UPDATE || this.editStatus === EditStatus.IMPORT) && (
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
										{this.editStatus === EditStatus.UPDATE && (
											<SXButtonWithIcon
												label={Util.translate("delete")}
												symbol={"trash"}
												displayType={"warning"}
												onClick={(e) => this.handleBtnDeleteClick(e)}
												spritemap={this.spritemap}
											/>
										)}
										{this.editStatus === EditStatus.IMPORT && (
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
									<h3>{Util.translate("linked-data-structure-info")}</h3>
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
													onClick={this.handleSaveLinkInfo}
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
													onClick={this.handleRemoveTypeStructureLink}
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
													onClick={() =>
														this.handleRedirectToStructureBuilder(EditStatus.UPDATE)
													}
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
											onClick={() => this.handleRedirectToStructureBuilder(EditStatus.ADD)}
											disabled={
												this.editStatus === EditStatus.IMPORT || this.dataType.dataTypeId < 1
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
					{this.state.saveSuccessDlgStatus && (
						<SXModalDialog
							header={<div>{Util.translate("processing-success")}</div>}
							body={Util.translate("datatype-saved") + ": " + this.dataType.dataTypeId}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: () => {
										this.setState({ saveSuccessDlgStatus: false });
									}
								}
							]}
						/>
					)}
					{this.state.deleteConfirmDlgStatus && (
						<SXModalDialog
							header={Util.translate("warning")}
							body={Util.translate("this-is-not-recoverable-are-you-sure-delete-the-data-type")}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.proceedDelete();
										this.setState({ deleteConfirmDlgStatus: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ deleteConfirmDlgStatus: false });
									}
								}
							]}
						/>
					)}
					{this.state.deleteSuccessDlgStatus && (
						<SXModalDialog
							header={Util.translate("delete-success")}
							body={Util.translate("delete-success") + ": " + this.dataType.dataTypeId}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: (e) => {
										this.dataType.dataTypeId = 0;
										this.setState({
											deleteSuccessDlgStatus: false
										});
									}
								}
							]}
						/>
					)}
					{this.state.dataTypeCodeDuplicated && (
						<SXModalDialog
							header={Util.translate("error")}
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
					{this.state.deleteErrorDlgStatus && (
						<SXModalDialog
							header={Util.translate("delete-failed")}
							body={Util.translate("delete-failed") + ": " + this.dataType.dataTypeId}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: (e) => {
										this.setState({
											deleteErrorDlgStatus: false
										});
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
