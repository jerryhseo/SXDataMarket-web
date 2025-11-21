import React from "react";
import { ParamType } from "../../stationx/station-x";

const ParameterConstants = {
	ColumnReadyTypes: [
		ParamType.STRING,
		ParamType.NUMERIC,
		ParamType.BOOLEAN,
		ParamType.SELECT,
		ParamType.EMAIL,
		ParamType.ADDRESS,
		ParamType.DATE,
		ParamType.FILE
	],

	DisplayTypes: {
		FORM_FIELD: "formField",
		INLINE: "inline",
		SHARED_OPTION_TABLE_ROW: "sharedOptionTableRow",
		SHARED_LABEL_CELL: "sharedLabelCell",
		GRID_CELL: "gridCell",
		TABLE_ROW: "tableRow"
	},

	AddressViewTypes: {
		INLINE: "inline",
		BLOCK: "block",
		ONE_LINE: "oneLine"
	},

	BooleanViewTypes: {
		CHECKBOX: "checkbox",
		TOGGLE: "toggle",
		RADIO: "radio",
		DROPDOWN: "dropdown"
	},

	DualListViewTypes: {
		HORIZONTAL: "horizontal",
		VERTICAL: "vertical",
		ORDERED: "ordered"
	},

	GroupViewTypes: {
		ARRANGEMENT: "arrangement", // Just for arrangement for all members
		FIELDSET: "fieldset",
		PANEL: "panel",
		TABLE: "table",
		SHARED_LABLE_TABLE: "sharedLabelTable",
		SHARED_OPTION_TABLE: "sharedOptionTable"
	},

	SelectViewTypes: {
		DROPDOWN: "dropdown",
		RADIO: "radio",
		CHECKBOX: "checkbox",
		LISTBOX: "listbox"
	},

	DEFAULT_VERSION: "1.0.0",
	ROOT_GROUP: "__root__"
};

export default ParameterConstants;
