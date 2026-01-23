import React from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamProperty, ParamType, ValidationRule } from "../../stationx/station-x";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import DataStructure from "./data-structure";
import ParameterConstants from "../Parameter/parameter-constants";
import { ParameterUtil } from "../Parameter/parameters";

class SXDSBuilderBasicPropertiesPanel extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.workingParam.namespace;
		this.formId = props.formId;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;
		this.spritemap = props.spritemap;

		this.componentId = this.namespace + "SXDSBuilderBasicPropertiesPanel";

		this.state = {
			confirmDlgState: false,
			confirmDlgBody: <></>,
			confirmDlgHeader: <></>
		};

		this.fields = {
			paramCode: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.PARAM_CODE,
					displayName: Util.getTranslationObject(this.languageId, "parameter-code"),
					placeholder: Util.getTranslationObject(this.languageId, "code-of-the-parameter"),
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
							message: Util.getTranslationObject(this.languageId, "shorter-than", 3),
							errorClass: ErrorClass.ERROR
						},
						maxLength: {
							value: 32,
							message: Util.getTranslationObject(this.languageId, "longer-than", 32),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.paramCode
				}
			}),
			paramVersion: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.PARAM_VERSION,
					displayName: Util.getTranslationObject(this.languageId, "version"),
					placeholder: Util.getTranslationObject(this.languageId, "version-of-the-parameter"),
					tooltip: Util.getTranslationObject(this.languageId, "version-tooltip"),
					defaultValue: "1.0.0",
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
					value: this.workingParam.paramVersion
				}
			}),
			displayName: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.DISPLAY_NAME,
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
					value: this.workingParam.displayName ?? {}
				}
			}),
			definition: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.DEFINITION,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "definition"),
					multipleLine: true,
					placeholder: Util.getTranslationObject(this.languageId, "definition-of-the-parameter"),
					tooltip: Util.getTranslationObject(this.languageId, "parameter-definition-tooltip", 512),
					validation: {
						max: {
							value: 512,
							message: Util.getTranslationObject(this.languageId, "longer-than", 512),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.definition
				}
			}),
			showDefinition: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.SHOW_DEFINITION,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "show-definition"),
					tooltip: Util.getTranslationObject(this.languageId, "show-description-tooltip"),
					value: this.workingParam.showDefinition,
					disabled:
						this.workingParam.paramType == ParamType.BOOLEAN &&
						(this.workingParam.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX ||
							this.workingParam.viewType == ParameterConstants.BooleanViewTypes.TOGGLE)
				}
			}),
			tooltip: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.TOOLTIP,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "tooltip"),
					tooltip: Util.getTranslationObject(this.languageId, "tooltip-tooltip"),
					value: this.workingParam.tooltip
				}
			}),
			synonyms: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.SYNONYMS,
					displayName: Util.getTranslationObject(this.languageId, "synonyms"),
					placeholder: Util.getTranslationObject(this.languageId, "code1, code2"),
					tooltip: Util.getTranslationObject(this.languageId, "synonyms-tooltip"),
					value: this.workingParam.synonyms
				}
			}),
			referenceFile: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.FILE,
				properties: {
					paramCode: ParamProperty.REFERENCE_FILE,
					displayName: Util.getTranslationObject(this.languageId, "reference-file"),
					tooltip: Util.getTranslationObject(this.languageId, "reference-file-tooltip"),
					multipleFiles: false,
					fileManager: true,
					accepts: "image/*,application/pdf",
					value: this.workingParam.referenceFile ? [this.workingParam.referenceFile] : []
				}
			})
		};

		//console.log("[SXDSBuilderBasicPropertiesPanel constructor] ", props, this.workingParam.referenceFile);
	}

	listenerValueChanged = (event) => {
		const { targetPortlet, targetFormId, parameter, paramCode, paramVersion } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		/*
		console.log(
			"RECEIVED - SXDSBuilderBasicPropertiesPanel SX_FIELD_VALUE_CHANGED: ",
			event.dataPacket,
			this.dataStructure,
			this.workingParam,
			parameter,
			parameter.getValue()
		);
		*/

		if (parameter.hasError()) {
			this.dataStructure.setError(parameter.errorClass, parameter.errorMessage);
			return;
		}

		const value = parameter.getValue();

		switch (paramCode) {
			case ParamProperty.PARAM_CODE: {
				this.workingParam[paramCode] = value;

				const duplicated = this.dataStructure.checkDuplicateParamCode(this.workingParam);
				if (duplicated) {
					this.fields.paramCode.setError(ErrorClass.ERROR, Util.translate("parameter-code-must-be-unique"));
					this.dataStructure.setError(ErrorClass.ERROR, Util.translate("parameter-code-must-be-unique"));
					this.fields.paramCode.setDirty(true);
					this.fields.paramCode.fireRefresh();

					return;
				}

				break;
			}
			case ParamProperty.PARAM_VERSION: {
				this.workingParam[paramCode] = value;

				if (Util.isEmpty(this.workingParam.paramCode) || this.fields.paramCode.hasError()) {
					this.dataStructure.setError(ErrorClass.ERROR, Util.translate("parameter-code-is-missing"));
					this.openErrorDlg(Util.translate("input-parameter-code-first"));
					return;
				}

				if (this.dataStructure.checkDuplicateParam(this.workingParam)) {
					this.fields.paramVersion.setError(
						ErrorClass.ERROR,
						Util.translate("parameter-version-is-duplicated")
					);
					this.dataStructure.setError(ErrorClass.ERROR, Util.translate("parameter-version-is-duplicated"));
					this.fields.paramVersion.setDirty(true);
					this.fields.paramVersion.fireRefresh();

					return;
				}

				break;
			}
			case "referenceFile": {
				const fileItem = value[0];

				this.workingParam.referenceFile = {
					name: fileItem.name,
					lastModified: fileItem.lastModified,
					type: fileItem.type,
					file: fileItem.file
				};

				console.log(
					"[SXDSBuilderBasicPropertiesPanel referenceFile]: ",
					value,
					fileItem,
					this.workingParam.referenceFile
				);

				break;
			}
			default: {
				this.workingParam[paramCode] = value;
			}
		}

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.isRendered()) {
			if (this.workingParam.isGridCell()) {
				const gridParam = this.dataStructure.findParameter({
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version,
					descendant: true
				});

				gridParam.fireRefresh();
			} else {
				this.workingParam.fireRefresh();
			}
		}
	};

	listenerDeleteFiles = (event) => {
		const { targetPortlet, targetFormId, parameter, paramCode, paramVersion } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		/*
		console.log(
			"RECEIVED - SXDSBuilderBasicPropertiesPanel SX_FIELD_VALUE_CHANGED: ",
			event.dataPacket,
			this.dataStructure,
			this.workingParam,
			parameter,
			parameter.getValue()
		);
		*/
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerValueChanged);
		Event.on(Event.SX_DELETE_FILES, this.listenerDeleteFiles);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerValueChanged);
		Event.off(Event.SX_DELETE_FILES, this.listenerDeleteFiles);
	}

	checkError() {
		const error = DataStructure.checkError(Object.values(this.fields));

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			this.workingParam.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
			this.workingParam.clearError();
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

	setPropertiesValue() {
		this.fields.paramCode.setValue({ value: this.workingParam.paramCode });
		this.fields.paramVersion.setValue({ value: this.workingParam.paramVersion });
		this.fields.displayName.setValue({ value: this.workingParam.displayName });
		this.fields.definition.setValue({ value: this.workingParam.definition });
		this.fields.showDefinition.setValue({ value: this.workingParam.showDefinition });
		this.fields.tooltip.setValue({ value: this.workingParam.tooltip });
		this.fields.synonyms.setValue({ value: this.workingParam.synonyms });
	}

	render() {
		//console.log("SXDSBuilderBasicPropertiesPanel render: ", this.workingParam.referenceFile);
		const fields = Object.values(this.fields);

		//this.setPropertiesValue();

		return (
			<>
				{fields.map((field) =>
					field.renderField({
						spritemap: this.spritemap
					})
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
			</>
		);
	}
}

export default SXDSBuilderBasicPropertiesPanel;
