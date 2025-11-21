import React from "react";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXDateTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "dateTypeOptionForm";

		this.fields = {
			enableTime: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.ENABLE_TIME,
					viewType: ParameterConstants.BooleanViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "enable-time"),
					tooltip: Util.getTranslationObject(this.languageId, "enable-time-tooltip"),
					defaultValue: false,
					value: this.workingParam.enableTime
				}
			}),
			startYear: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.NUMERIC,
				properties: {
					paramCode: ParamProperty.START_YEAR,
					displayName: Util.getTranslationObject(this.languageId, "start-year"),
					isInteger: true,
					tooltip: Util.getTranslationObject(this.languageId, "start-year-tooltip"),
					defaultValue: "1970",
					value: this.workingParam.startYear,
					validation: {
						min: {
							value: 1900,
							message: Util.getTranslationObject(this.languageId, "start-year-must-be-larger-than", 1900),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: new Date().getFullYear(),
							message: Util.getTranslationObject(
								this.languageId,
								"start-year-must-be-smaller-than",
								new Date().getFullYear()
							),
							errorClass: ErrorClass.ERROR
						}
					}
				}
			}),
			endYear: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.NUMERIC,
				properties: {
					paramCode: ParamProperty.END_YEAR,
					displayName: Util.getTranslationObject(this.languageId, "end-year"),
					isInteger: true,
					tooltip: Util.getTranslationObject(this.languageId, "end-year-tooltip"),
					value: this.workingParam.endYear,
					validation: {
						min: {
							value: 1900,
							message: Util.getTranslationObject(this.languageId, "end-year-must-be-larger-than", 1900),
							errorClass: ErrorClass.ERROR
						},
						max: {
							value: new Date().getFullYear() + 100,
							message: Util.getTranslationObject(
								this.languageId,
								"end-year-must-be-smaller-than",
								new Date().getFullYear() + 100
							),
							errorClass: ErrorClass.ERROR
						}
					}
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
            "SXDateTypeOptionForm SX_FIELD_VALUE_CHANGED: ",
            dataPacket,
            this.workingParam,
            this.fields[dataPacket.paramCode].getValue()
        );
        */
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		switch (dataPacket.paramCode) {
			case "startYear": {
				const endYear = Number(this.fields.endYear.getValue());
				const startYear = Number(this.fields.startYear.getValue());

				if (endYear && endYear < startYear) {
					dataPacket.parameter.setError(
						ErrorClass.ERROR,
						Util.translate("start-year-must-be-smaller-than-end-year")
					);
					this.dataStructure.setError(
						ErrorClass.ERROR,
						Util.translate("start-year-must-be-smaller-than-end-year")
					);

					Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
						targetFormId: this.componentId,
						paramCode: dataPacket.paramCode,
						paramVersion: dataPacket.paramVersion
					});

					/*
                    this.workingParam.setError(
                        ErrorClass.ERROR,
                        Util.translate("start-year-must-be-smaller-than-end-year")
                    );
                    */
				} else {
					dataPacket.parameter.clearError();
					this.dataStructure.clearError();
				}
				break;
			}
			case "endYear": {
				const endYear = Number(this.fields.endYear.getValue());
				const startYear = Number(this.fields.startYear.getValue());

				if (startYear && endYear < startYear) {
					dataPacket.parameter.setError(
						ErrorClass.ERROR,
						Util.translate("end-year-must-be-larger-than-start-year")
					);
					this.dataStructure.setError(
						ErrorClass.ERROR,
						Util.translate("end-year-must-be-larger-than-start-year")
					);

					Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
						targetFormId: this.componentId,
						paramCode: dataPacket.paramCode,
						paramVersion: dataPacket.paramVersion
					});

					/*
                    this.workingParam.setError(
                        ErrorClass.ERROR,
                        Util.translate("end-year-must-be-larger-than-start-year")
                    );
                    */
				} else {
					dataPacket.parameter.clearError();
					this.dataStructure.clearError();
				}
				break;
			}
		}

		this.workingParam[dataPacket.paramCode] = this.fields[dataPacket.paramCode].getValue();

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.isRendered()) {
			if (this.workingParam.isGridCell()) {
				this.workingParam.fireRefreshParent(true);

				/*
				const gridParam = this.dataStructure.findParameter({
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version,
					descendant: true
				});

				gridParam.fireRefresh();
                */
			} else {
				this.workingParam.fireRefresh();
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
				{this.fields.enableTime.renderField({ spritemap: this.spritemap })}
				{this.fields.startYear.renderField({ spritemap: this.spritemap })}
				{this.fields.endYear.renderField({ spritemap: this.spritemap })}
			</>
		);
	}
}

export default SXDateTypeOptionForm;
