import React from "react";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXSelectOptionBuilder from "../select-option-builder";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXDualListTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.namespace + "SXDualListTypeOptionForm";

		this.fields = {
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
					value: this.workingParam.listboxSize ?? 4
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
            this.fields[dataPacket.paramCode],
            this.fields[dataPacket.paramCode].getValue()
        );
        */
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();
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
				{this.fields.listboxSize.renderField({ spritemap: this.spritemap })}
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

export default SXDualListTypeOptionForm;
