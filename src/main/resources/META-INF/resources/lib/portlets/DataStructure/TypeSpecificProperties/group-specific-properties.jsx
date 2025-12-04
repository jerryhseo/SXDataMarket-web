import React from "react";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../../stationx/station-x";
import { Util } from "../../../stationx/util";
import DataStructure from "../data-structure";
import SXGroupBuilder from "../group-builder";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../../Parameter/parameters.jsx";

class SXGroupTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "SXGroupTypeOptionForm";

		this.availableMemberTypes = Object.keys(ParamType).map((key) => ParamType[key]);

		this.fieldViewType = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.SELECT,
			properties: {
				paramCode: ParamProperty.VIEW_TYPE,
				viewType: ParameterConstants.SelectViewTypes.RADIO,
				displayName: Util.getTranslationObject(this.languageId, "view-type"),
				options: [
					{
						label: Util.getTranslationObject(this.languageId, "Arrangement"),
						value: ParameterConstants.GroupViewTypes.ARRANGEMENT
					},
					{
						label: Util.getTranslationObject(this.languageId, "Fieldset"),
						value: ParameterConstants.GroupViewTypes.FIELDSET
					},
					{
						label: Util.getTranslationObject(this.languageId, "Panel"),
						value: ParameterConstants.GroupViewTypes.PANEL
					},
					{
						label: Util.getTranslationObject(this.languageId, "Table"),
						value: ParameterConstants.GroupViewTypes.TABLE
					}
				],
				optionsPerRow: 2,
				tooltip: Util.getTranslationObject(this.languageId, "view-type-tooltip"),
				defaultValue: ParameterConstants.GroupViewTypes.PANEL,
				value: this.workingParam.viewType
			}
		});

		this.fieldMembersPerRow = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.NUMERIC,
			properties: {
				paramCode: ParamProperty.MEMBERS_PER_ROW,
				isInteger: true,
				displayName: Util.getTranslationObject(this.languageId, "members-per-row"),
				tooltip: Util.getTranslationObject(this.languageId, "members-per-row-tooltip"),
				defaultValue: 1,
				validation: {
					min: {
						value: 0,
						message: Util.getTranslationObject(
							this.languageId,
							"members-per-row-must-be-larger-than-or-equal-to",
							0
						),
						errorClass: ErrorClass.ERROR
					},
					max: {
						value: 10,
						message: Util.getTranslationObject(
							this.languageId,
							"members-per-row-must-be-smaller-than-or-equal-to",
							10
						),
						errorClass: ErrorClass.ERROR
					}
				},
				value: this.workingParam.membersPerRow
			}
		});

		this.fieldExpanded = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.BOOLEAN,
			properties: {
				paramCode: ParamProperty.EXPANDED,
				viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
				displayName: Util.getTranslationObject(this.languageId, "expanded"),
				tooltip: Util.getTranslationObject(this.languageId, "expanded-tooltip"),
				value: this.workingParam.showDefinition
			}
		});
	}

	listenerFieldValueChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			return;
		}

		/*
        console.log(
            "SXGroupTypeOptionForm SX_FIELD_VALUE_CHANGED: ",
            dataPacket,
            this.workingParam,
            this.fieldMembersPerRow.getValue()
        );
        */
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.error = dataPacket.parameter.error;
			return;
		}

		switch (dataPacket.paramCode) {
			case ParamProperty.VIEW_TYPE: {
				this.workingParam.viewType = this.fieldViewType.getValue();
				break;
			}
			case ParamProperty.MEMBERS_PER_ROW: {
				this.workingParam.membersPerRow = this.fieldMembersPerRow.getValue();
				break;
			}
			case ParamProperty.EXPANDED: {
				this.workingParam.expanded = this.fieldExpanded.getValue();
				break;
			}
		}

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.isRendered()) {
			this.workingParam.fireRefresh();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	checkError() {
		const error = DataStructure.checkError([this.fieldMembersPerRow]);

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
		}

		return error;
	}

	render() {
		let memberDisplayType = ParameterConstants.DisplayTypes.FORM_FIELD;

		if (this.workingParam.viewType == ParameterConstants.GroupViewTypes.TABLE) {
			memberDisplayType = ParameterConstants.DisplayTypes.TABLE_ROW;
		}

		return (
			<>
				{this.fieldViewType.renderField({ spritemap: this.spritemap })}
				{this.workingParam.showMembersPerRow &&
					this.fieldMembersPerRow.renderField({ spritemap: this.spritemap })}
				{this.fieldExpanded.renderField({ spritemap: this.spritemap })}
				<SXGroupBuilder
					namespace={this.namespace}
					dataStructure={this.dataStructure}
					groupParam={this.workingParam}
					spritemap={this.spritemap}
					availableParamTypes={this.availableMemberTypes}
					memberDisplayType={memberDisplayType}
				/>
			</>
		);
	}
}

export default SXGroupTypeOptionForm;
