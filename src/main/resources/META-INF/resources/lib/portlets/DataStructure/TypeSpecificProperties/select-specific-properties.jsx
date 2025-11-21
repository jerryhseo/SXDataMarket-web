import React from "react";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXSelectOptionBuilder from "../select-option-builder";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXSelectTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "SXSelectTypeOptionForm";

		const viewTypes = [
			{
				label: Util.getTranslationObject(this.languageId, "Dropdown"),
				value: ParameterConstants.SelectViewTypes.DROPDOWN
			},
			{
				label: Util.getTranslationObject(this.languageId, "Radio"),
				value: ParameterConstants.SelectViewTypes.RADIO
			},
			{
				label: Util.getTranslationObject(this.languageId, "Checkbox"),
				value: ParameterConstants.SelectViewTypes.CHECKBOX
			}
		];

		if (this.workingParam.displayType !== ParameterConstants.DisplayTypes.GRID_CELL) {
			viewTypes.push({
				label: Util.getTranslationObject(this.languageId, "Listbox"),
				value: ParameterConstants.SelectViewTypes.LISTBOX
			});
		}

		this.fields = {
			viewType: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.SELECT,
				properties: {
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: ParameterConstants.SelectViewTypes.RADIO,
					options: viewTypes,
					optionsPerRow: 2,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					tooltip: Util.getTranslationObject(this.languageId, "select-view-type-tooltip"),
					value: this.workingParam.viewType ?? ParameterConstants.SelectViewTypes.DROPDOWN,
					validation: {
						required: {
							value: true,
							message: Util.getTranslationObject(this.languageId, "this-field-is-required")
						}
					}
				}
			}),
			optionsPerRow: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.NUMERIC,
				properties: {
					paramCode: ParamProperty.OPTIONS_PER_ROW,
					isInteger: true,
					displayName: Util.getTranslationObject(this.languageId, "options-per-row"),
					tooltip: Util.getTranslationObject(this.languageId, "options-per-row-tooltip"),
					defaultValue: 0,
					validation: {
						min: {
							value: 0,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-larger-than-or-equal-to",
								0
							),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: 10,
							message: Util.getTranslationObject(
								this.languageId,
								"options-per-row-must-be-smaller-than-or-equal-to",
								10
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.optionsPerRow
				}
			}),
			listboxSize: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.NUMERIC,
				properties: {
					paramCode: ParamProperty.LISTBOX_SIZE,
					isInteger: true,
					displayName: Util.getTranslationObject(this.languageId, "listbox-size"),
					tooltip: Util.getTranslationObject(this.languageId, "listbox-size-tooltip"),
					validation: {
						min: {
							value: 2,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"listbox-size-must-be-larger-than-or-equal-to",
								2
							),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: 10,
							boundary: true,
							message: Util.getTranslationObject(
								this.languageId,
								"listbox-size-must-be-smaller-than-or-equal-to",
								10
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.listboxSize
				}
			}),
			placeholder: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.PLACEHOLDER,
					displayName: Util.getTranslationObject(this.languageId, "placeholder"),
					localized: true,
					tooltip: Util.getTranslationObject(this.languageId, "placeholder-tooltip"),
					validation: {
						minLength: {
							value: 5,
							message: Util.getTranslationObject(this.languageId, "placeholder-should-be-longer-than", 4),
							errorClass: ErrorClass.ERROR
						},
						maxLength: {
							value: 16,
							message: Util.getTranslationObject(
								this.languageId,
								"placeholder-should-be-shorter-than",
								16
							),
							errorClass: ErrorClass.ERROR
						}
					},
					value: this.workingParam.placeholder
				}
			})
		};
	}

	displayOptionsPerRow() {
		return (
			this.workingParam.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX ||
			this.workingParam.viewType == ParameterConstants.BooleanViewTypes.RADIO
		);
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
            this.fields[dataPacket.paramCode],
            this.fields[dataPacket.paramCode].getValue()
        );
        */
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (dataPacket.paramCode == "viewType") {
			this.forceUpdate();
		}

		//this.workingParam.initValue();
		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		//this.forceUpdate();

		if (this.workingParam.isRendered()) {
			if (dataPacket.paramCode == "viewType") {
				if (ParameterConstants.SelectViewTypes.DROPDOWN || ParameterConstants.SelectViewTypes.RADIO) {
					this.workingParam.setValue({ value: "" });
				} else {
					this.workingParam.setValue({ value: [] });
				}
			}

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
		return (
			<>
				{this.fields.viewType.renderField({ spritemap: this.spritemap })}
				{this.displayOptionsPerRow() &&
					this.fields.optionsPerRow.renderField({
						spritemap: this.spritemap
					})}
				{(this.workingParam.viewType == ParameterConstants.SelectViewTypes.DROPDOWN ||
					this.workingParam.viewType == ParameterConstants.SelectViewTypes.LISTBOX) &&
					this.fields.placeholder.renderField({ spritemap: this.spritemap })}
				{this.workingParam.viewType == ParameterConstants.SelectViewTypes.LISTBOX &&
					this.fields.listboxSize.renderField({ spritemap: this.spritemap })}
				<SXSelectOptionBuilder
					namespace={this.namespace}
					formId={this.componentId}
					dataStructure={this.dataStructure}
					workingParam={this.workingParam}
					spritemap={this.spritemap}
				/>
			</>
		);
	}
}

export default SXSelectTypeOptionForm;
