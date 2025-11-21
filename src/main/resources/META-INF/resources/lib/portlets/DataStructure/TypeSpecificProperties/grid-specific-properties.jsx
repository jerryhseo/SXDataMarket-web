import React from "react";
import { ParamType } from "../../../stationx/station-x";
import SXGroupBuilder from "../group-builder";
import SXBasePropertiesPanelComponent from "../base-properties-panel-component.jsx";
import ParameterConstants from "../../Parameter/parameter-constants.jsx";

class SXGridTypeOptionForm extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.workingParam.namespace + "gridTypeOptionForm";

		this.availableColumnTypes = [
			ParamType.STRING,
			ParamType.NUMERIC,
			ParamType.BOOLEAN,
			ParamType.SELECT,
			ParamType.ADDRESS,
			ParamType.FILE,
			ParamType.DATE,
			ParamType.EMAIL
		];
	}

	render() {
		return (
			<SXGroupBuilder
				dataStructure={this.dataStructure}
				groupParam={this.workingParam}
				spritemap={this.spritemap}
				availableParamTypes={this.availableColumnTypes}
				memberDisplayType={ParameterConstants.DisplayTypes.GRID_CELL}
			/>
		);
	}
}

export default SXGridTypeOptionForm;
