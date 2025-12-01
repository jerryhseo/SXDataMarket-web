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

class DataWorkbench extends React.Component {
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

		//console.log("DataWorkbench......", props);

		this.workbench = new Workbench({
			namespace: this.namespace,
			workbenchId: this.workbenchInfo.portletId,
			baseRenderURL: this.baseRenderURL,
			baseResourceURL: this.baseResourceURL,
			spritemap: this.spritemap
		});

		this.dataCollection = null;

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
			openVerticalNav: true
		};

		this.workingPortletRef = createRef();
		this.canvasRef = createRef();

		this.boundingRect = null;

		this.topMenuItems = [
			{
				id: "dataCollection",
				label: Util.translate("datacollection"),
				children: [
					{
						id: "newDataCollection",
						label: Util.translate("new-datacollection")
					},
					{
						id: "newDataSet",
						label: Util.translate("new-dataset")
					},
					{
						id: "newDataType",
						label: Util.translate("new-datatype")
					},
					{
						id: "newDataStructure",
						label: Util.translate("new-datastructure")
					},
					{
						id: "openDataCollection",
						label: Util.translate("open-datacollection")
					}
				]
			},
			{
				id: "dataExplorer",
				label: Util.translate("data-explorer"),
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
			}
		];

		this.navItems = [];
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
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		//console.log("Workbench HANDSHAKE received: ", dataPacket);

		Event.fire(Event.SX_WORKBENCH_READY, this.namespace, dataPacket.sourcePortlet, {});
	};

	listenerWindowResize = () => {
		this.boundingRect = this.canvasRef.current.getBoundingClientRect();

		this.forceUpdate();
	};

	listenerMenuItemClick = (event) => {
		const dataPacket = event.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		//console.log("Workbench SX_MENU_SELECTED received: ", dataPacket);
		const menuId = dataPacket.menuId;
		switch (menuId) {
			case "newDataCollection": {
				this.deployPortlet({
					portletName: PortletKeys.DATACOLLECTION_EDITOR,
					title: Util.translate("new-datacollection")
				});
				break;
			}
			case "openDataCollection": {
				this.deployPortlet({
					portletName: PortletKeys.DATACOLLECTION_EXPLORER,
					params: {
						managementBar: false,
						checkbox: false
					},
					title: Util.translate("open-datacollection")
				});
				break;
			}
			case "dataCollectionExplorer": {
				this.deployPortlet({
					portletName: PortletKeys.DATACOLLECTION_EXPLORER,
					title: Util.translate("datacollection-explorer")
				});
				break;
			}
			case "dataSetExplorer": {
				this.deployPortlet({
					portletName: PortletKeys.DATASET_EXPLORER,
					title: Util.translate("dataset-explorer")
				});
				break;
			}
			case "dataTypeExplorer": {
				this.deployPortlet({
					portletName: PortletKeys.DATATYPE_EXPLORER,
					title: Util.translate("datatype-explorer")
				});
				break;
			}
			case "dataStructureExplorer": {
				this.deployPortlet({
					portletName: PortletKeys.DATASTRUCTURE_EXPLORER,
					title: Util.translate("datastructure-explorer")
				});
				break;
			}
			case "structureDataExplorer": {
				this.deployPortlet({
					portletName: PortletKeys.STRUCTURED_DATA_EXPLORER,
					title: Util.translate("structured-data-explorer")
				});
				break;
			}
		}
	};

	listenerDataCollectionSelected = (event) => {
		const { targetPortlet, sourcePortlet, targetFormId, sourceFormId, dataCollectionId } = event.dataPacket;
		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("[DataWorkbench] dataCollectionSelected: ", dataPacket);
		this.workbench.processRequest({
			sourceFormId: sourceFormId,
			requestId: Workbench.RequestIDs.loadDataCollection,
			requestPortlet: sourcePortlet,
			params: {
				dataCollectionId: dataCollectionId,
				loadAvailableDataSets: false
			}
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

		this.boundingRect = this.canvasRef.current.getBoundingClientRect();

		if (this.state.dataCollectionId === 0) {
			this.deployPortlet({
				portletName: PortletKeys.DATACOLLECTION_EXPLORER,
				title: Util.translate("datacollection-selector"),
				params: {
					managementBar: false,
					checkbox: false
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

	render() {
		let height = window.innerHeight;

		if (this.boundingRect) {
			height = window.innerHeight - this.boundingRect.top;
		}

		//console.log("Workbench render: ", this.workbench);
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
				<div
					className="autofit-row"
					style={{ paddingTop: "5px", alignItems: "stretch" }}
					ref={this.canvasRef}
				>
					{this.state.openVerticalNav && (
						<div
							className="autofit-col shrink"
							style={{
								borderRight: "3px inset #e0dddd",
								minWidth: "10%",
								maxWidth: "50%",
								padding: "5px 0 5px 5px"
							}}
						>
							<Rnd
								default={{
									x: 0,
									y: 0,
									width: 100,
									height: "100%"
								}}
								minWidth={120}
								maxWidth={500}
								maxHeight="100%"
								disableDragging={true}
								enableResizing={{
									top: false,
									right: true,
									bottom: false,
									left: false,
									topRight: false,
									bottomRight: false,
									bottomLeft: false,
									topLeft: false
								}}
								style={{ paddingLeft: "5px", position: "relative", width: "100%", height: "100%" }}
							>
								<Sticker
									displayType={this.dataCollection ? "sx-label-outline-3" : "sx-label-outline-4"}
									style={{
										margin: "5px 0",
										height: "40px",
										width: "100%"
									}}
								>
									<Icon
										symbol="home-full"
										spritemap={this.spritemap}
										style={{ marginRight: "5px" }}
									/>
									{this.dataCollection
										? this.dataCollection.displayName[this.languageId]
										: Util.translate("no-datacollection")}
								</Sticker>
								<SXDataCollectionNavigator
									key={this.state.dataCollectionId}
									namespace={this.namespace}
									navItems={this.navItems}
									style={{
										width: "100%"
									}}
									spritemap={this.spritemap}
								/>
							</Rnd>
						</div>
					)}
					<div
						className="autofit-col autofit-col-expand"
						style={{ height: "100%", padding: "5px" }}
					>
						<SXApplicationBar
							key={this.state.workingPortletInstance.title + this.state.openVerticalNav}
							namespace={this.namespace}
							formId={this.workbenchId}
							applicationTitle={
								Util.isEmpty(this.state.workingPortletInstance.title)
									? Util.translate(this.state.workingPortletInstance.displayName)
									: this.state.workingPortletInstance.title
							}
							verticalNavOpened={this.state.openVerticalNav}
							spritemap={this.spritemap}
						/>
						<div
							ref={this.workingPortletRef}
							style={{ overflowX: "hidden", overflowY: "auto", padding: "0 10px" }}
						>
							{this.state.workingPortletInstance.portletState === Workbench.PortletState.NORMAL && (
								<SXPortlet
									key={this.state.workingPortletInstance.namespace}
									namespace={this.namespace}
									portletNamespace={this.state.workingPortletInstance.namespace}
									portletContent={this.state.workingPortletInstance.content}
								/>
							)}
						</div>
					</div>
				</div>
				{this.workbench.windowCount > 0 && <>{this.workbench.getWindowMap()}</>}
			</div>
		);
	}
}

export default DataWorkbench;
