import React, { createRef } from "react";
import { Event, PortletKeys } from "../../stationx/station-x";
import { SXPortlet, Workbench } from "./workbench";
import { Rnd } from "react-rnd";
import SXWorkbenchMenu from "./workbench-menu";
import SXDataCollectionNavigator from "../DataCollection/datacollection-navigationbar";
import { Util } from "../../stationx/util";
import Sticker from "@clayui/sticker";
import SXApplicationBar from "../../stationx/application-bar";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";

class DataWorkbench extends React.Component {
	static ViewMode = {
		FORM: "form",
		DATA: "data"
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

		this.dataCollection = null;
		this.viewMode = DataWorkbench.ViewMode.FORM;

		this.state = {
			dataCollectionId: props.dataCollectionId ?? 0,
			dataCollectionSelector: true,
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
			infoDialog: false
		};

		this.workingPortletRef = createRef();
		this.canvasRef = createRef();

		//this.boundingRect = null;

		this.topMenuItems = [
			{
				id: "dataCollectionManagement",
				label: Util.translate("datacollection-management")
			},
			{
				id: "dataManagement",
				label: Util.translate("data-management")
			}
			/*
			{
				id: "collectionManagement",
				label: Util.translate("collection-management"),
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
					},
					{
						id: "structuredDataExplorer",
						label: Util.translate("structured-data-explorer")
					}
				]
			},
			{
				id: "dataExplorer",
				label: Util.translate("data-explorer")
			}
				*/
		];

		this.navItems = [];
		this.dialogHeader = <></>;
		this.dialogBody = <></>;
	}

	listenerLoadPortlet = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		//console.log("SX_LOAD_PORTLET received: ", dataPacket);

		this.deployPortlet({
			portletName: dataPacket.portletName,
			params: dataPacket.params,
			portletState: dataPacket.portletState
		});
	};

	listenerOpenPortletWindow = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		//console.log("SX_OPEN_PORTLET_WINDOW received: ", dataPacket);

		this.workbench
			.openPortletWindow({
				portletName: dataPacket.portletName,
				windowTitle: dataPacket.windowTitle,
				params: dataPacket.params
			})
			.then(() => {
				//console.log("Portlet Window Created: ", this.workbench.windows);
				this.forceUpdate();
			});
	};

	listenerSearchDataTypes = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		this.searchDataTypes(dataPacket.params);
	};

	listenerHandshake = (event) => {
		const { targetPortlet, sourcePortlet } = event.dataPacket;
		if (targetPortlet !== this.namespace) {
			return;
		}

		console.log("Workbench HANDSHAKE received: ", event.dataPacket);
		this.workingPortletNamespace = sourcePortlet;

		Event.fire(Event.SX_WORKBENCH_READY, this.namespace, sourcePortlet, {});
	};

	listenerWindowResize = () => {
		//this.boundingRect = this.canvasRef.current.getBoundingClientRect();

		this.forceUpdate();
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
		}

		if (this.viewMode === viewMode) {
			return;
		}

		Event.fire(Event.SX_CHANGE_VIEWMODE, this.namespace, this.workingPortletNamespace, {
			viewMode: viewMode
		});

		this.viewMode = viewMode;
	};

	listenerDataCollectionSelected = (event) => {
		const { targetPortlet, sourcePortlet, targetFormId, sourceFormId, dataCollectionId } = event.dataPacket;
		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("[DataWorkbench] dataCollectionSelected: ", dataPacket);
		this.dataCollectionId = dataCollectionId;

		let requestId;
		let params;

		if (this.viewMode === DataWorkbench.ViewMode.FORM) {
			requestId = Workbench.RequestIDs.loadDataCollection;
			params = {
				dataCollectionId: dataCollectionId,
				loadAvailableDataSets: false
			};
		} else {
			requestId = Workbench.RequestIDs.loadStructuredData;
			params = {
				dataCollectionId: dataCollectionId,
				loadAvailableDataSets: false
			};
		}

		this.workbench.processRequest({
			sourceFormId: sourceFormId,
			requestId: requestId,
			requestPortlet: this.namespace,
			params: params
		});
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataWorkbench] listenerResponce rejected: ", dataPacket);
			return;
		}

		//console.log("[DataWorkbench] listenerResonse: ", dataPacket);
		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.loadDataCollection: {
				this.dataCollection = dataPacket.data;

				this.navItems = this.dataCollection.associatedDataSetList.map((dataSet) => ({
					id: dataSet.dataSetId,
					label: dataSet.displayName,
					type: "dataSet"
				}));

				//console.log("navItems: ", this.navItems);
				this.setState({ dataCollectionId: this.dataCollection.dataCollectionId });
				break;
			}
		}

		//this.forceUpdate();
	};

	listenerCloseVerticalNav = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		this.setState({ openVerticalNav: dataPacket.open });
	};

	listenerClosePreviewWindow = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		this.workbench.removeWindow(dataPacket.portletId);

		this.forceUpdate();
	};

	listenerRequest = async (event) => {
		const { targetPortlet, sourcePortlet, targetFormId, sourceFormId, requestId, params } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("[DataWorkbench] SX_REQUEST received: ", event.dataPacket);
		this.workbench.processRequest({
			requestPortlet: sourcePortlet,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});
	};

	componentDidMount() {
		Event.on(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.on(Event.SX_MENU_SELECTED, this.listenerMenuItemClick);
		Event.on(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
		Event.on(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.on(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
		Event.on(Event.SX_REQUEST, this.listenerRequest);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
		Event.on(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);

		window.addEventListener("resize", this.listenerWindowResize);

		//this.boundingRect = this.canvasRef.current.getBoundingClientRect();

		if (this.state.dataCollectionId === 0) {
			this.deployPortlet({
				portletName: PortletKeys.COLLECTION_MANAGEMENT,
				title: Util.translate("collection-management"),
				params: {
					viewMode: this.viewMode
				},
				portletState: Workbench.PortletState.NORMAL
			});
		}
	}
	componentWillUnmount() {
		Event.off(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.off(Event.SX_MENU_SELECTED, this.listenerMenuItemClick);
		Event.off(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
		Event.off(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.off(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
		Event.off(Event.SX_REQUEST, this.listenerRequest);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
		Event.off(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);

		window.removeEventListener("resize", this.listenerWindowResize);
	}

	searchDataTypes = async (params, targetPortlet) => {
		const result = await this.workbench.searchDataTypes(params);

		this.workbench.fireLoadData(targetPortlet, result);
	};

	deployPortlet = async ({ portletName, params = {}, title = "", portletState = Workbench.PortletState.NORMAL }) => {
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

	handleDataCollection = (event) => {
		event.stopPropagation();
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
			<div style={{ border: "3px groove #ccc" }}>
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
				{this.state.workingPortletInstance.portletState === Workbench.PortletState.NORMAL && (
					<SXPortlet
						key={this.state.workingPortletInstance.namespace}
						namespace={this.namespace}
						portletNamespace={this.state.workingPortletInstance.namespace}
						portletContent={this.state.workingPortletInstance.content}
					/>
				)}

				{this.workbench.windowCount > 0 && <>{this.workbench.getWindowMap()}</>}
				{this.state.infoDialog && (
					<SXModalDialog
						header={this.dialogHeader}
						body={this.dialogBody}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ infoDialog: false });
								}
							}
						]}
					/>
				)}
			</div>
		);
	}
}

export default DataWorkbench;
