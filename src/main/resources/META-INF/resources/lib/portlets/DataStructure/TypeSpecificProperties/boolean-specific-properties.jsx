import React from "react";
import { Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXBooleanTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "booleanTypeOptionForm";

		this.fields = {
			viewType: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.SELECT,
				properties: {
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: ParameterConstants.SelectViewTypes.RADIO,
					options: [
						{
							label: Util.getTranslationObject(this.languageId, "Checkbox"),
							value: ParameterConstants.BooleanViewTypes.CHECKBOX
						},
						{
							label: Util.getTranslationObject(this.languageId, "Toggle"),
							value: ParameterConstants.BooleanViewTypes.TOGGLE
						},
						{
							label: Util.getTranslationObject(this.languageId, "Dropdown"),
							value: ParameterConstants.BooleanViewTypes.DROPDOWN
						},
						{
							label: Util.getTranslationObject(this.languageId, "Radio"),
							value: ParameterConstants.BooleanViewTypes.RADIO
						}
					],
					optionsPerRow: 2,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					tooltip: Util.getTranslationObject(this.languageId, "select-view-type-tooltip"),
					value: this.workingParam.viewType ?? ParameterConstants.SelectViewTypes.CHECKBOX,
					validation: {
						required: {
							value: true,
							message: Util.getTranslationObject(this.languageId, "this-field-is-required")
						}
					}
				}
			}),
			trueLabel: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.TRUE_LABEL,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "true-label"),
					placeholder: Util.getTranslationObject(this.languageId, "label-for-true-option"),
					tooltip: Util.getTranslationObject(this.languageId, "label-for-true-option-tooltip"),
					value: this.workingParam.trueLabel
				}
			}),

			falseLabel: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.FALSE_LABEL,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "false-label"),
					placeholder: Util.getTranslationObject(this.languageId, "label-for-false-option"),
					tooltip: Util.getTranslationObject(this.languageId, "label-for-false-option-tooltip"),
					value: this.workingParam.falseLabel
				}
			})
		};
	}

	listenerFieldValueChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
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
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

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
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
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
		return (
			<>
				{this.fields.viewType.renderField({ spritemap: this.spritemap })}
				{this.fields.trueLabel.renderField({ spritemap: this.spritemap })}
				{this.fields.falseLabel.renderField({ spritemap: this.spritemap })}
			</>
		);
	}
}

export default SXBooleanTypeOptionForm;
