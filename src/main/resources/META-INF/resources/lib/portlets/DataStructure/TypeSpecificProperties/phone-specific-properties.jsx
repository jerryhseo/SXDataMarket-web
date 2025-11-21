import React from "react";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import { Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXPhoneTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "phoneTypeOptionForm";

		this.fields = {
			enableCountryNo: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.ENABLE_COUNTRY_NO,
					viewType: ParameterConstants.BooleanViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "enable-country-no"),
					tooltip: Util.getTranslationObject(this.languageId, "enable-country-no-tooltip"),
					defaultValue: false,
					value: this.workingParam.enableCountryNo
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
			if (this.workingParam.isGridCell()) {
				this.workingParam.fireRefreshParant(true);
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

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	render() {
		return <>{this.fields.enableCountryNo.renderField({ spritemap: this.spritemap })}</>;
	}
}

export default SXPhoneTypeOptionForm;
