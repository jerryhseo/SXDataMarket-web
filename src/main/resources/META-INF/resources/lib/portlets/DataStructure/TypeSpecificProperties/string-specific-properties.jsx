import React from "react";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import { Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXStringTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "SXStringTypeOptionForm";

		this.fields = {
			placeholder: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.STRING,
				properties: {
					paramCode: ParamProperty.PLACEHOLDER,
					localized: true,
					displayName: Util.getTranslationObject(this.languageId, "placeholder"),
					tooltip: Util.getTranslationObject(this.languageId, "placeholder-tooltip"),
					placeholder: Util.getTranslationObject(this.languageId, "placeholder"),
					value: this.workingParam.placeholder
				}
			}),

			multipleLine: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.MULTIPLE_LINE,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "multiple-line"),
					tooltip: Util.getTranslationObject(this.languageId, "multiple-line-tooltip"),
					defalutValue: false,
					value: this.workingParam.multipleLine
				}
			}),

			localized: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.LOCALIZED,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "localized"),
					tooltip: Util.getTranslationObject(this.languageId, "localized-tooltip"),
					defalutValue: false,
					value: this.workingParam.localized
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

		console.log("SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ", dataPacket, this.workingParam);

		if (dataPacket.parameter.hasError()) {
			this.dataStructure.error = dataPacket.parameter.error;

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
					targetFormId: this.workingParam.componentId,
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

		return <>{fields.map((field) => field.renderField({ spritemap: this.spritemap }))}</>;
	}
}

export default SXStringTypeOptionForm;
