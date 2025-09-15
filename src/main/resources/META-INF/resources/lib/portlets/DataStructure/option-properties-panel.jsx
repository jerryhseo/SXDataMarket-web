import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Util } from "../../stationx/util";
import { Event, ParamProperty, ParamType, ValidationRule } from "../../stationx/station-x";
import SXFormField from "../../stationx/form";
import {
	BooleanParameter,
	GroupParameter,
	Parameter,
	SelectParameter,
	StringParameter
} from "../../stationx/parameter";

class SXDSBuilderOptionPropertiesPanel extends React.Component {
	constructor(props) {
		super(props);

		this.formIds = props.formIds;
		this.namespace = props.workingParam.namespace;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.spritemap = props.spritemap;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;

		this.toggleFields = {
			abstractKey: Parameter.createParameter(
				this.namespace,
				this.formIds.optionsFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.ABSTRACT_KEY,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "abstract-key"),
					tooltip: Util.getTranslationObject(this.languageId, "abstract-key-tooltip"),
					value: this.workingParam.abstractKey
				}
			),
			downloadable: Parameter.createParameter(
				this.namespace,
				this.formIds.optionsFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.DOWNLOADABLE,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "downloadable"),
					tooltip: Util.getTranslationObject(this.languageId, "downloadable-tooltip"),
					value: this.workingParam.downloadable
				}
			),
			searchable: Parameter.createParameter(
				this.namespace,
				this.formIds.optionsFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.SEARCHABLE,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "searchable"),
					tooltip: Util.getTranslationObject(this.languageId, "searchable-tooltip"),
					value: this.workingParam.searchable
				}
			),
			disabled: Parameter.createParameter(
				this.namespace,
				this.formIds.optionsFormId,
				this.languageId,
				this.availableLanguageIds,
				ParamType.BOOLEAN,
				{
					paramCode: ParamProperty.DISABLED,
					viewType: BooleanParameter.ViewTypes.TOGGLE,
					displayName: Util.getTranslationObject(this.languageId, "disabled"),
					tooltip: Util.getTranslationObject(this.languageId, "disabled-tooltip"),
					value: this.workingParam.disabled
				}
			)
		};

		this.fieldToggleGroup = Parameter.createParameter(
			this.namespace,
			this.formIds.optionsFormId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramCode: "toggleGroup",
				viewType: GroupParameter.ViewTypes.ARRANGEMENT,
				membersPerRow: 1,
				members: Object.values(this.toggleFields)
			}
		);

		this.fieldCssWidth = Parameter.createParameter(
			this.namespace,
			this.formIds.optionsFormId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: ParamProperty.CSS_WIDTH,
				displayName: Util.getTranslationObject(this.languageId, "width"),
				placeholder: Util.getTranslationObject(this.languageId, "20.rem or 100px"),
				tooltip: Util.getTranslationObject(this.languageId, "width-of-the-parameter-tooltip"),
				value: this.workingParam.cssWidth
			}
		);
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.optionsFormId)
			return;

		/*
		console.log(
			"DataStructureBuilder SX_FIELD_VALUE_CHANGED RECEIVED: ",
			dataPacket,
			this.dataStructure,
			this.workingParam
		);
		*/

		if (dataPacket.paramCode == ParamProperty.CSS_WIDTH) {
			this.workingParam.cssWidth = this.fieldCssWidth.getValue();
		} else if (dataPacket.paramCode == "disabled") {
			this.workingParam.setDisabled(this.toggleFields[dataPacket.paramCode].getValue());
		} else {
			this.workingParam[dataPacket.paramCode] = this.toggleFields[dataPacket.paramCode].getValue();
		}

		if (this.workingParam.displayType == Parameter.DisplayTypes.GRID_CELL) {
			console.log("Refresh Grid from cell: ", this.workingParam);

			const gridParam = this.dataStructure.findParameter({
				paramCode: this.workingParam.parent.code,
				paramVersion: this.workingParam.parent.version,
				descendant: true
			});

			gridParam.fireRefreshPreview();
		} else {
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
	}

	render() {
		return (
			<>
				{this.fieldToggleGroup.renderField({
					spritemap: this.spritemap
				})}
				{this.fieldCssWidth.renderField({
					spritemap: this.spritemap
				})}
			</>
		);
	}
}

export default SXDSBuilderOptionPropertiesPanel;
