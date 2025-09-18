import React from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamProperty, ParamType, ValidationRule } from "../../stationx/station-x";
import { SXBoolean, SXInput, SXLocalizedInput } from "../../stationx/form";
import LocalizedInput from "@clayui/localized-input";
import { BooleanParameter, Parameter, StringParameter } from "../../stationx/parameter";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";

class SXDSBuilderBasicPropertiesPanel extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.workingParam.namespace;
		this.formIds = props.formIds;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;
		this.spritemap = props.spritemap;

		this.state = {
			confirmDlgState: false,
			confirmDlgBody: <></>,
			confirmDlgHeader: <></>
		};

		this.fields = {
			paramCode: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
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
			),
			paramVersion: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
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
			),
			displayName: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
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
			),
			definition: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
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
			),
			showDefinition: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.SHOW_DEFINITION,
					viewType: BooleanParameter.ViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "show-definition"),
					tooltip: Util.getTranslationObject(this.languageId, "show-description-tooltip"),
					value: this.workingParam.showDefinition,
					disabled:
						this.workingParam.paramType == ParamType.BOOLEAN &&
						(this.workingParam.viewType == BooleanParameter.ViewTypes.CHECKBOX ||
							this.workingParam.viewType == BooleanParameter.ViewTypes.TOGGLE)
				}
			),
			tooltip: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.TOOLTIP,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "tooltip"),
					tooltip: Util.getTranslationObject(this.languageId, "tooltip-tooltip"),
					value: this.workingParam.tooltip
				}
			),
			synonyms: Parameter.createParameter(
				this.namespace,
				this.formIds.basicPropertiesFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.STRING,
				{
					paramCode: ParamProperty.SYNONYMS,
					displayName: Util.getTranslationObject(this.languageId, "synonyms"),
					placeholder: Util.getTranslationObject(this.languageId, "code1, code2"),
					tooltip: Util.getTranslationObject(this.languageId, "synonyms-tooltip"),
					value: this.workingParam.synonyms
				}
			)
		};

		//console.log("SXDSBuilderBasicPropertiesPanel: ", props);
	}

	valueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;

		if (
			dataPacket.targetPortlet !== this.namespace ||
			dataPacket.targetFormId !== this.formIds.basicPropertiesFormId
		) {
			return;
		}

		/*
		console.log(
			"RECEIVED - SXDSBuilderBasicPropertiesPanel SX_FIELD_VALUE_CHANGED: ",
			dataPacket,
			this.dataStructure,
			this.workingParam,
			dataPacket.parameter,
			dataPacket.parameter.getValue()
		);
		*/

		/*
		if (dataPacket.parameter.hasError()) {
			this.workingParam.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
		} else {
			this.workingParam.clearError();
		}
			*/

		this.workingParam[dataPacket.paramCode] = dataPacket.parameter.getValue();

		if (dataPacket.paramCode == ParamProperty.PARAM_CODE) {
			if (this.dataStructure.checkDuplicateParam(this.workingParam)) {
				this.fields.paramCode.setError(ErrorClass.ERROR, Util.translate("parameter-code-must-be-unique"));
				this.fields.paramCode.setDirty(true);

				this.setState({
					confirmDlgState: true,
					confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
					confirmDlgBody: Util.translate("parameter-code-must-be-unique")
				});
				return;
			}
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

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.valueChangedHandler);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.valueChangedHandler);
	}

	render() {
		//console.log("SXDSBuilderBasicPropertiesPanel: ", this.workingParam, this.formIds);
		const fields = Object.values(this.fields);

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
