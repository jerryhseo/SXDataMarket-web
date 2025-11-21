import React from "react";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXNumericTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.namespace + "SXNumericTypeOptionForm";

		this.fields = {
			isInteger: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.IS_INTEGER,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "integer"),
					tooltip: Util.getTranslationObject(this.languageId, "integer-tooltip"),
					value: this.workingParam.isInteger
				}
			}),

			uncertainty: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.UNCERTAINTY,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "uncertainty"),
					tooltip: Util.getTranslationObject(this.languageId, "uncertainty-tooltip"),
					value: this.workingParam.uncertainty
				}
			}),

			decimalPlaces: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.NUMERIC,
				properties: {
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
			}),

			unit: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.UNIT,
					displayName: Util.getTranslationObject(this.languageId, "unit"),
					tooltip: Util.getTranslationObject(this.languageId, "unit-tooltip"),
					value: this.workingParam.unit
				}
			}),
			prefix: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.PREFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "prefix"),
					tooltip: Util.getTranslationObject(this.languageId, "prefix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "prefix"),
					value: this.workingParam.prefix
				}
			}),
			postfix: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.POSTFIX,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "postfix"),
					tooltip: Util.getTranslationObject(this.languageId, "postfix-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "postfix"),
					value: this.workingParam.postfix
				}
			})
		};
	}

	listenerFieldValueChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			return;
		}

		//console.log("SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ", dataPacket, this.workingParam);
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (dataPacket.paramCode == ParamProperty.IS_INTEGER) {
			this.workingParam.decimalPlaces = this.workingParam.isInteger ? 0 : 1;
		}

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.isRendered()) {
			if (this.workingParam.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
				this.workingParam.fireRefreshParent(true);
				/*
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
                */
			} else {
				this.workingParam.fireRefreshPreview();
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	checkError() {
		const error = DataStructure.checkError(Object.values(this.fields));

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
		}

		return error;
	}

	render() {
		const fields = Object.values(this.fields);

		return (
			<>
				{fields.map((field) => {
					if (field.paramCode == ParamProperty.DECIMAL_PLACES && !this.workingParam.isInteger) {
						return field.renderField({ spritemap: this.spritemap });
					} else if (field.paramCode !== ParamProperty.DECIMAL_PLACES) {
						return field.renderField({ spritemap: this.spritemap });
					}
				})}
			</>
		);
	}
}

export default SXNumericTypeOptionForm;
