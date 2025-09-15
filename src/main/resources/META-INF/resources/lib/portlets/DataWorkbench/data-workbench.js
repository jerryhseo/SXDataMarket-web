import React from "react";
import { WindowState } from "../../stationx/station-x";
import { Workbench } from "./workbench";

class DataWorkbench extends React.Component {
	workbench = null;

	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.redirectURLs = props.redirectURLs;
		this.workbenchInfo = props.workbench;
		this.workingPortlet = props.workingPortlet;
		this.params = props.params;

		this.workingPortletSectionId = this.namespace + "workingPortletSection";

		console.log("DataWorkbench......", props);
	}

	componentDidMount() {
		this.workbech = new Workbench({ workbenchId: this.workbenchInfo.portletId });

		Workbench.loadWorkingPortlet({
			portletSectionId: this.workingPortletSectionId,
			WindowState: WindowState.EXCLUSIVE,
			workingPortlet: this.workingPortlet,
			workbench: this.workbenchInfo
		});
	}

	render() {
		return <div id={this.workingPortletSectionId}></div>;
	}
}

export default DataWorkbench;
