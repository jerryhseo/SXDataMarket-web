import React, { createRef } from "react";
import { Event, PortletKeys, PortletState, RequestIDs } from "../../stationx/station-x";
import { SXPortlet, Workbench } from "./workbench";
import SXWorkbenchMenu from "./workbench-menu";
import { Util } from "../../stationx/util";
import { SXModalDialog } from "../../stationx/modal";

class DataWorkbench extends React.Component {
	static ViewMode = {
		FORM: "form",
		DATA: "data",
		DATACOLLECTION_EXPLORER: "dataCollectionExplorer",
		DATASET_EXPLORER: "dataSetExplorer",
		DATATYPE_EXPLORER: "dataTypeExplorer",
		DATASTRUCTURE_EXPLORER: "dataStructureExplorer"
	};

	workbench = null;

	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.redirectURLs = props.redirectURLs;
		this.baseRenderURL = props.baseRenderURL;
		this.baseResourceURL = props.baseResourceURL;
		this.workbenchInfo = props.workbench;
		this.workingPortlet = props.workingPortlet;
		this.params = props.params;
		this.spritemap = props.spritemapPath;

		this.languageId = SXSystem.getLanguageId();

		this.workingPortletSectionId = this.namespace + "workingPortletSection";
		this.workingPortletNamespace = "";

		//console.log("DataWorkbench......", props);

		this.workbench = new Workbench({
			namespace: this.namespace,
			workbenchId: this.workbenchInfo.portletId,
			baseRenderURL: this.baseRenderURL,
			baseResourceURL: this.baseResourceURL,
			spritemap: this.spritemap
		});

		this.viewMode = DataWorkbench.ViewMode.FORM;

		this.state = {
			workingPortletInstance: {
				portletName: "",
				portletId: "",
				namespace: "",
				displayName: "",
				title: "",
				content: "",
				portlet: null
			},
			openVerticalNav: true,
		};

		this.topMenuItems = [
			{
				id: "dataCollectionManagement",
				label: Util.translate("datacollection-management")
			},
			{
				id: "dataManagement",
				label: Util.translate("data-management")
			},
			{
				id: "explorers",
				label: Util.translate("explorers"),
				children: [
					{
						id: "dataCollectionExplorer",
						label: Util.translate("datacollection-explorer")
					},
					{
						id: "dataSetExplorer",
						label: Util.translate("dataset-explorer")
					},
					{
						id: "dataTypeExplorer",
						label: Util.translate("datatype-explorer")
					},
					{
						id: "dataStructureExplorer",
						label: Util.translate("datastructure-explorer")
					}
				]
			}
			/*
			{
				id: "dataExplorer",
				label: Util.translate("data-explorer")
			}
				*/
		];
	}

	listenerHandshake = (event) => {
		const { targetPortlet, sourcePortlet } = event.dataPacket;
		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("Workbench HANDSHAKE received: ", event.dataPacket);
		this.workingPortletNamespace = sourcePortlet;

		Event.fire(Event.SX_WORKBENCH_READY, this.namespace, sourcePortlet, {});
	};

	listenerMenuItemClick = (event) => {
		const { targetPortlet, menuId } = event.dataPacket;
		if (targetPortlet !== this.namespace) {
			return;
		}

		console.log("Workbench SX_MENU_SELECTED received: ", event.dataPacket);

		let viewMode = DataWorkbench.ViewMode.FORM;

		switch (menuId) {
			case "dataCollectionManagement": {
				viewMode = DataWorkbench.ViewMode.FORM;

				break;
			}
			case "dataManagement": {
				viewMode = DataWorkbench.ViewMode.DATA;

				break;
			}
			case "dataCollectionExplorer": {
				viewMode = DataWorkbench.ViewMode.DATACOLLECTION_EXPLORER;
				break;
			}
			case "dataSetExplorer": {
				viewMode = DataWorkbench.ViewMode.DATASET_EXPLORER;
				break;
			}
			case "dataTypeExplorer": {
				viewMode = DataWorkbench.ViewMode.DATATYPE_EXPLORER;
				break;
			}
			case "dataStructureExplorer": {
				viewMode = DataWorkbench.ViewMode.DATASTRUCTURE_EXPLORER;
				break;
			}
		}

		if (this.viewMode === viewMode) {
			return;
		}

		Event.fire(Event.SX_CHANGE_VIEWMODE, this.namespace, this.workingPortletNamespace, {
			viewMode: viewMode
		});

		this.viewMode = viewMode;
	};

	componentDidMount() {
		Event.on(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.on(Event.SX_MENU_SELECTED, this.listenerMenuItemClick);

		this.deployPortlet({
				portletName: PortletKeys.COLLECTION_MANAGEMENT,
				title: Util.translate("collection-management"),
				params: {
					viewMode: this.viewMode
				},
				portletState: PortletState.NORMAL
		});
	}
	componentWillUnmount() {
		Event.off(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.off(Event.SX_MENU_SELECTED, this.listenerMenuItemClick);
	}

	deployPortlet = async ({ portletName, params = {}, title = "", portletState = PortletState.NORMAL }) => {
		const portletInstance = await this.workbench.loadPortlet({
			portletName: portletName,
			params: params,
			title: title
		});

		portletInstance.portletState = portletState;

		this.setState({
			workingPortletInstance: portletInstance
		});
	};

	render() {
		let height = window.innerHeight;

		/*
		if (this.boundingRect) {
			height = window.innerHeight - this.boundingRect.top;
		}
			*/

		//console.log("Workbench render: ", this.state);
		return (
			<div className="sx-portlet" style={{ border: "3px groove #ccc" }}>
				<div className="autofit-row">
					<div className="autofit-col autofit-col-expand">
						<SXWorkbenchMenu
							namespace={this.namespace}
							menuItems={this.topMenuItems}
							style={{ backgroundColor: "#e1f0ff", padding: "0px 20px" }}
							spritemap={this.spritemap}
						/>
					</div>
				</div>
				{this.state.workingPortletInstance.portletState === PortletState.NORMAL && (
					<SXPortlet
						key={this.state.workingPortletInstance.namespace}
						namespace={this.namespace}
						portletNamespace={this.state.workingPortletInstance.namespace}
						portletContent={this.state.workingPortletInstance.content}
					/>
				)}

			</div>
		);
	}
}

export default DataWorkbench;
