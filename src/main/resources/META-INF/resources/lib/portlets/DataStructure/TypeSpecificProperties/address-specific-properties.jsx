import React from "react";
import { Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXAddressTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "addressTypeOptionForm";

		this.fields = {
			viewType: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.SELECT,
				properties: {
					paramCode: ParamProperty.VIEW_TYPE,
					viewType: ParameterConstants.SelectViewTypes.RADIO,
					displayName: Util.getTranslationObject(this.languageId, "view-type"),
					options: [
						{
							label: Util.getTranslationObject(this.languageId, "Block"),
							value: ParameterConstants.AddressViewTypes.BLOCK
						},
						{
							label: Util.getTranslationObject(this.languageId, "In Line"),
							value: ParameterConstants.AddressViewTypes.INLINE
						}
					],
					tooltip: Util.getTranslationObject(this.languageId, "view-type-tooltip"),
					defaultValue: ParameterConstants.AddressViewTypes.BLOCK,
					value: this.workingParam.viewType
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
		return <>{this.fields.viewType.renderField({ spritemap: this.spritemap })}</>;
	}
}

export default SXAddressTypeOptionForm;
