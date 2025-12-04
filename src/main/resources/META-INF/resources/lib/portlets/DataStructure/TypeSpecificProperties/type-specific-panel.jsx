import React from "react";
import { ParamType } from "../../../stationx/station-x";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import SXStringTypeOptionForm from "./string-specific-properties";
import SXNumericTypeOptionForm from "./numeric-specific-properties";
import SXPhoneTypeOptionForm from "./phone-specific-properties";
import SXAddressTypeOptionForm from "./address-specific-properties";
import SXDateTypeOptionForm from "./date-specific-properties";
import SXGroupTypeOptionForm from "./group-specific-properties";
import SXGridTypeOptionForm from "./grid-specific-properties";
import SXSelectTypeOptionForm from "./select-specific-properties";
import SXDualListTypeOptionForm from "./duallist-specific-properties";
import SXBooleanTypeOptionForm from "./boolean-specific-properties";

class SXDSBuilderTypeSpecificPanel extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);
	}

	render() {
		switch (this.workingParam.paramType) {
			case ParamType.LOCALIZED_STRING:
			case ParamType.STRING: {
				return (
					<SXStringTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.NUMERIC: {
				return (
					<SXNumericTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.SELECT: {
				return (
					<SXSelectTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.DUALLIST: {
				return (
					<SXDualListTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.BOOLEAN: {
				return (
					<SXBooleanTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.PHONE: {
				return (
					<SXPhoneTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.ADDRESS: {
				return (
					<SXAddressTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.DATE: {
				return (
					<SXDateTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.GROUP: {
				return (
					<SXGroupTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case ParamType.GRID: {
				return (
					<SXGridTypeOptionForm
						namespace={this.namespace}
						formId={this.formId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
		}

		return <div>{"No specified properties for this parameter type."}</div>;
	}
}

export default SXDSBuilderTypeSpecificPanel;
