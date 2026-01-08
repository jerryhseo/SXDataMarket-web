import React, { createRef } from "react";
import { Event, PortletKeys } from "../../stationx/station-x";
import { SXPortlet, Workbench } from "../DataWorkbench/workbench";
import { Rnd } from "react-rnd";
import SXDataCollectionNavigator from "./datacollection-navigationbar";
import { Util } from "../../stationx/util";
import Sticker from "@clayui/sticker";
import SXApplicationBar from "../../stationx/application-bar";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Text } from "@clayui/core";
import { ClayButtonWithIcon } from "@clayui/button";

class CollectionsManagement extends SXBaseVisualizer {
	static ViewMode = {
		FORM: "form",
		DATA: "data"
	};

	static ItemTypes = {
		COLLECTION: "collection",
		DATASET: "set",
		DATATYPE: "type"
	};

	constructor(props) {
		super(props);

		//console.log("[CollectionsManagement props]", props);

		this.workbench = new Workbench({
			namespace: this.namespace, //namespace of the CollectionManagement portlet
			workbenchId: this.portletId,
			baseRenderURL: this.baseRenderURL,
			baseResourceURL: this.baseResourceURL,
			spritemap: this.spritemap
		});

		this.searchedCollections = [];

		this.state = {
			viewMode: this.params.viewMode ?? CollectionsManagement.ViewMode.FORM,
			dataCollectionId: this.params.dataCollectionId ?? 0,
			dataSetId: this.params.dataSetId ?? 0,
			dataTypeId: this.params.dataTypeId ?? 0,
			workingPortletInstance: {
				portletName: "",
				portletId: "",
				namespace: "",
				displayName: "",
				title: "",
				content: "",
				portlet: null
			},
			openVerticalNav: this.params.verticalNav ?? true,
			refreshNav: Util.randomKey(),
			infoDialog: false
		};

		this.contentRef = createRef();
		this.navRef = createRef();

		this.boundingRect = null;

		this.navItems = [];
		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.applicationTitle = this.buildApplicationTitle();
		this.selectedNavItem = null;

		this.applicationBarButtons = [];
	}

	listenerWorkbenchReady = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[collectionManagement] listenerWorkbenchReady event rejected: ", event.dataPacket);
			return;
		}

		//console.log("[collectionManagement] listenerWorkbenchReady received: ", event.dataPacket);

		this.workbench.processRequest({
			requestPortlet: this.namespace,
			sourceFormId: this.portletId,
			requestId: Workbench.RequestIDs.searchDataCollections,
			params: {
				dataCollectionId: this.state.dataCollectionId,
				dataSetId: this.state.dataSetId,
				dataTypeId: this.state.dataTypeId
			}
		});
	};

	listenerLoadPortlet = (event) => {
		const { targetPortlet, portletName, applicationTitle = "", params, portletState } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("SX_LOAD_PORTLET received: ", this.state, event.dataPacket);
		let { dataCollectionId = 0, dataSetId = 0, dataTypeId = 0 } = params;

		if (
			this.state.dataCollectionId === dataCollectionId &&
			this.state.dataSetId === dataSetId &&
			this.state.dataTypeId === dataTypeId &&
			this.state.workingPortletInstance.portletName === portletName
		) {
			return;
		}

		this.setState({
			dataCollectionId: dataCollectionId,
			dataSetId: dataSetId,
			dataTypeId: dataTypeId
		});

		this.applicationTitle = applicationTitle;

		this.deployPortlet({
			portletName: portletName,
			params: params,
			portletState: portletState
		});
	};

	listenerOpenPortletWindow = (event) => {
		const { targetPortlet, portletName, windowTitle, params } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("SX_OPEN_PORTLET_WINDOW received: ", event.dataPacket);

		this.workbench
			.openPortletWindow({
				portletName: portletName,
				windowTitle: windowTitle,
				params: params
			})
			.then(() => {
				//console.log("Portlet Window Created: ", this.workbench.windows);
				this.forceUpdate();
			});
	};

	listenerRedirectTo = (event) => {
		const {
			targetPortlet,
			portletName,
			params = {},
			portletState = Workbench.PortletState.NORMAL
		} = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[CollectionManagement listenerRedirectTo REJECTED] ", event.dataPacket);
			return;
		}

		//console.log("[CollectionManagement listenerRedirectTo] ", event.dataPacket);
		this.deployPortlet({
			portletName: portletName,
			params: params,
			portletState: portletState
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

		//console.log("Workbench HANDSHAKE received: ", dataPacket);

		Event.fire(Event.SX_WORKBENCH_READY, this.namespace, sourcePortlet, {});
	};

	listenerWindowResize = () => {
		this.boundingRect = this.navRef.current.getBoundingClientRect();

		this.forceUpdate();
	};

	listenerNavItemSelected = (event) => {
		const { targetPortlet, targetFormId, params } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[CollectionManagement listenerNavItemSelected rejected] ", params, this.formId);
			return;
		}

		const { item } = params;

		//console.log("[CollectionManagement listenerNavItemSelected] ", params.item);
		this.applicationTitle = "";

		let portletName;

		if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
			switch (item.type) {
				case CollectionsManagement.ItemTypes.COLLECTION: {
					portletName = PortletKeys.DATACOLLECTION_VIEWER;
					break;
				}
				case CollectionsManagement.ItemTypes.DATASET: {
					portletName = PortletKeys.DATASET_VIEWER;
					break;
				}
				case CollectionsManagement.ItemTypes.DATATYPE: {
					portletName = PortletKeys.DATATYPE_VIEWER;
					break;
				}
			}
		} else {
			portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
		}

		if (this.selectedNavItem === item && this.state.workingPortletInstance.portletName === portletName) {
			return;
		}

		this.selectedNavItem = params.item;

		const portletParams = this.getDeployPortletParams();
		this.deployPortlet({
			portletName: portletName,
			params: portletParams
		});

		/*
		let portletParams;
		let { dataCollectionId, dataSetId, dataTypeId } = this.state;

		if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
			switch (item.type) {
				case CollectionsManagement.ItemTypes.COLLECTION: {
					dataCollectionId = item.dataCollectionId;
					dataSetId = 0;
					dataTypeId = 0;
					this.dataCollectionDisplayName = item.label;
					this.dataSetDisplayName = "";
					this.dataTypeDisplayName = "";

					portletParams = {
						dataCollectionId: dataCollectionId
					};

					this.applicationBarButtons = [
						{
							id: "addDataSet",
							label: Util.translate("add-dataset"),
							symbol: "plus"
						}
					];
					break;
				}
				case CollectionsManagement.ItemTypes.DATASET: {
					dataSetId = item.dataSetId;
					dataTypeId = 0;
					this.dataSetDisplayName = item.label;
					this.dataTypeDisplayName = "";

					portletParams = {
						dataCollectionId: dataCollectionId,
						dataSetId: dataSetId
					};

					this.applicationBarButtons = [
						{
							id: "addDataType",
							label: Util.translate("add-datatype"),
							symbol: "plus"
						}
					];
					break;
				}
				case CollectionsManagement.ItemTypes.DATATYPE: {
					dataTypeId = item.dataTypeId;
					this.dataTypeDisplayName = item.label;

					portletParams = {
						dataCollectionId: dataCollectionId,
						dataSetId: dataSetId,
						dataTypeId: dataTypeId
					};

					this.applicationBarButtons = [
						{
							id: "editDataStructure",
							label: Util.translate("edit-datastructure"),
							symbol: "pencil"
						},
						{
							id: "addDataStructure",
							label: Util.translate("add-datastructure"),
							symbol: "plus"
						}
					];
					break;
				}
			}

			this.setState({
				dataCollectionId: dataCollectionId,
				dataSetId: dataSetId,
				dataTypeId: dataTypeId
			});
		} else {
			portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
			portletParams = {
				dataCollectionId: dataCollectionId,
				dataSetId: dataSetId,
				dataTypeId: dataTypeId
			};
		} 

		this.deployPortlet({
			portletName: portletName,
			params: portletParams
		});
		*/
	};

	listenerResponse = (event) => {
		const { targetPortlet, sourcePortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[CollectionsManagement] listenerResponce rejected: ", dataPacket);
			return;
		}

		//console.log("[CollectionsManagement] listenerResponse: ", event.dataPacket);
		switch (requestId) {
			case Workbench.RequestIDs.searchDataCollections: {
				this.searchedCollections = data;

				this.navItems = this.searchedCollections.map((dataCollection) => {
					const collectionItem = {
						id: dataCollection.dataCollectionId,
						dataCollectionId: dataCollection.dataCollectionId,
						label: dataCollection.displayName,
						type: "collection"
					};

					const dataSets = dataCollection.dataSets;
					if (dataCollection.dataSets) {
						collectionItem.items = dataCollection.dataSets.map((dataSet) => {
							const setItem = {
								id: dataSet.linkId,
								dataSetId: dataSet.dataSetId,
								label: dataSet.displayName,
								type: "set"
							};

							if (dataSet.dataTypes) {
								setItem.items = dataSet.dataTypes.map((dataType) => {
									return {
										id: dataType.linkId,
										dataTypeId: dataType.dataTypeId,
										label: dataType.displayName,
										type: "type"
									};
								});
							}

							return setItem;
						});
					}

					return collectionItem;
				});

				//console.log("navItems: ", this.navItems);
				//this.setState({ dataCollectionId: this.dataCollection.dataCollectionId });
				this.setState({ refreshNav: Util.randomKey() });
				break;
			}

			case Workbench.RequestIDs.searchStructuredData: {
				this.searchedCollections = data;

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

		//console.log("[CollectionsManagement] SX_REQUEST received: ", event.dataPacket);
		this.workbench.processRequest({
			requestPortlet: sourcePortlet,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});
	};

	listenerChangeViewMode = (event) => {
		const { targetPortlet, viewMode } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("[CollectionsManagement viewMode] ", viewMode);

		this.setState({ viewMode: viewMode });

		const portletParams = this.getDeployPortletParams(viewMode);

		if (portletParams) {
			this.deployPortlet({
				portletName: PortletKeys.STRUCTURED_DATA_EXPLORER,
				params: portletParams
			});
		}
	};

	listenerApplicationBarBtnClicked = (event) => {
		const { targetPortlet, button } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			return;
		}

		//console.log("[CollectionsManagement viewMode] ", button);

		let portletName;
		let params;

		switch (button.id) {
			case "addDataSet": {
				portletName = PortletKeys.DATASET_EDITOR;

				params = {
					dataCollectionId: this.state.dataCollectionId
				};
				break;
			}
			case "addDataType": {
				portletName = PortletKeys.DATATYPE_EDITOR;

				params = {
					dataCollectionId: this.state.dataCollectionId,
					dataSetId: this.state.dataSetId
				};
				break;
			}
			case "editDataStructure": {
				portletName = PortletKeys.DATASTRUCTURE_BUILDER;

				params = {
					dataCollectionId: this.state.dataCollectionId,
					dataSetId: this.state.dataSetId,
					dataTypeId: this.state.dataTypeId
				};

				break;
			}
			case "addDataStructure": {
				portletName = PortletKeys.DATASTRUCTURE_BUILDER;

				params = {
					dataCollectionId: this.state.dataCollectionId,
					dataSetId: this.state.dataSetId
				};
				break;
			}
		}

		if (this.state.workingPortletInstance.portletName === portletName) {
			return;
		}

		this.deployPortlet({
			portletName: portletName,
			params: params
		});
	};

	componentDidMount() {
		Event.on(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
		Event.on(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.on(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
		Event.on(Event.SX_REQUEST, this.listenerRequest);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
		//Event.on(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);
		Event.on(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
		Event.on(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
		Event.on(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
		Event.on(Event.SX_REDIRECT_TO, this.listenerRedirectTo);

		window.addEventListener("resize", this.listenerWindowResize);

		this.boundingRect = this.navRef.current.getBoundingClientRect();

		/*
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
			*/

		this.fireHandshake();
	}

	componentWillUnmount() {
		Event.off(Event.SX_HANDSHAKE, this.listenerHandshake);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
		Event.off(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
		Event.off(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
		Event.off(Event.SX_REQUEST, this.listenerRequest);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
		//Event.off(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);
		Event.off(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
		Event.off(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
		Event.off(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
		Event.off(Event.SX_REDIRECT_TO, this.listenerRedirectTo);

		window.removeEventListener("resize", this.listenerWindowResize);
	}

	buildApplicationTitle() {
		let applicationTitle = Util.isEmpty(this.dataCollectionDisplayName) ? "" : this.dataCollectionDisplayName;
		if (this.dataSetDisplayName) {
			applicationTitle += Util.isEmpty(this.dataSetDisplayName) ? "" : " > " + this.dataSetDisplayName;
		}
		if (this.dataTypeDisplayName) {
			applicationTitle += Util.isEmpty(this.dataTypeDisplayName) ? "" : " > " + this.dataTypeDisplayName;
		}

		return applicationTitle ? applicationTitle : Util.translate("select-datacollection");
	}

	searchDataTypes = async (params, targetPortlet) => {
		const result = await this.workbench.searchDataTypes(params);

		this.workbench.fireLoadData(targetPortlet, result);
	};

	getDeployPortletParams(viewMode = this.state.viewMode) {
		//console.log("[CollectionManagement getDeployPortletParams] ", JSON.stringify(this.selectedNavItem, null, 4));
		if (Util.isEmpty(this.selectedNavItem)) {
			return;
		}

		let portletParams;
		let { dataCollectionId, dataSetId, dataTypeId } = this.state;

		switch (this.selectedNavItem.type) {
			case CollectionsManagement.ItemTypes.COLLECTION: {
				dataCollectionId = this.selectedNavItem.dataCollectionId;
				dataSetId = 0;
				dataTypeId = 0;
				this.dataCollectionDisplayName = this.selectedNavItem.label;
				this.dataSetDisplayName = "";
				this.dataTypeDisplayName = "";

				portletParams = {
					dataCollectionId: dataCollectionId
				};

				if (viewMode === CollectionsManagement.ViewMode.FORM) {
					this.applicationBarButtons = [
						{
							id: "addDataSet",
							label: Util.translate("add-dataset"),
							symbol: "plus"
						}
					];
				}
				break;
			}
			case CollectionsManagement.ItemTypes.DATASET: {
				dataSetId = this.selectedNavItem.dataSetId;
				dataTypeId = 0;
				this.dataSetDisplayName = this.selectedNavItem.label;
				this.dataTypeDisplayName = "";

				portletParams = {
					dataCollectionId: dataCollectionId,
					dataSetId: dataSetId
				};

				if (viewMode === CollectionsManagement.ViewMode.FORM) {
					this.applicationBarButtons = [
						{
							id: "addDataType",
							label: Util.translate("add-datatype"),
							symbol: "plus"
						}
					];
				}
				break;
			}
			case CollectionsManagement.ItemTypes.DATATYPE: {
				dataTypeId = this.selectedNavItem.dataTypeId;
				this.dataTypeDisplayName = this.selectedNavItem.label;

				portletParams = {
					dataCollectionId: dataCollectionId,
					dataSetId: dataSetId,
					dataTypeId: dataTypeId
				};

				if (viewMode === CollectionsManagement.ViewMode.FORM) {
					this.applicationBarButtons = [
						{
							id: "editDataStructure",
							label: Util.translate("edit-datastructure"),
							symbol: "pencil"
						},
						{
							id: "addDataStructure",
							label: Util.translate("add-datastructure"),
							symbol: "plus"
						}
					];
				}
				break;
			}
		}

		this.setState({
			dataCollectionId: dataCollectionId,
			dataSetId: dataSetId,
			dataTypeId: dataTypeId
		});

		if (viewMode === CollectionsManagement.ViewMode.DATA) {
			this.applicationBarButtons = [];

			portletParams = {
				...portletParams,
				checkbox: true,
				breadcrumb: false,
				addButton: true
			};
		}

		return portletParams;
	}

	deployPortlet = async ({ portletName, params = {}, title = "", portletState = Workbench.PortletState.NORMAL }) => {
		const portletInstance = await this.workbench.loadPortlet({
			portletName: portletName,
			params: params
		});

		portletInstance.portletState = portletState;

		this.setState({
			workingPortletInstance: portletInstance
		});
	};

	handleAddDataCollection = (event) => {
		event.stopPropagation();

		this.dataCollectionDisplayName = "";
		this.dataSetDisplayName = "";
		this.dataTypeDisplayName = "";

		this.setState({
			dataCollectionId: 0,
			dataSetId: 0,
			dataTypeId: 0,
			refreshNav: Util.randomKey()
		});

		this.applicationTitle = Util.translate("add-datacollection");
		this.applicationBarButtons = [];

		this.deployPortlet({
			portletName: PortletKeys.DATACOLLECTION_EDITOR,
			portletState: Workbench.PortletState.NORMAL
		});
	};

	render() {
		let height = window.innerHeight;

		if (this.boundingRect) {
			height = window.innerHeight - this.boundingRect.top;
		}

		const applicationTitle = this.applicationTitle ? this.applicationTitle : this.buildApplicationTitle();

		/*
		console.log(
			"CollectionManagement render: ",
			this.state.viewMode,
			applicationTitle,
			this.selectedNavItem,
			this.applicationBarButtons
		);
		*/

		return (
			<div>
				<div
					className="autofit-row"
					style={{ paddingTop: "5px", alignItems: "stretch" }}
					ref={this.navRef}
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
									width: 200,
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
								<div
									className="autofit-row"
									style={{
										backgroundColor: "khaki",
										margin: "5px 0",
										height: "40px",
										width: "100%"
									}}
								>
									{this.state.viewMode === CollectionsManagement.ViewMode.FORM && (
										<>
											<div className="autofit-col autofit-col-expand">
												<div style={{ display: "inline", textAlign: "center" }}>
													<Icon
														symbol="forms"
														spritemap={this.spritemap}
														style={{ marginRight: "5px" }}
													/>
													<Text
														size={4}
														weight="bold"
													>
														{Util.translate("datacollection-management")}
													</Text>
												</div>
											</div>
											<div className="autofit-col">
												<ClayButtonWithIcon
													aria-label={Util.translate("add-datacollection")}
													title={Util.translate("add-datacollection")}
													displayType="unstyled"
													symbol="plus"
													style={{ marginRight: "10px" }}
													onClick={this.handleAddDataCollection}
													spritemap={this.spritemap}
												/>
											</div>
										</>
									)}
									{this.state.viewMode === CollectionsManagement.ViewMode.DATA && (
										<div className="autofit-col autofit-col-expand">
											<div style={{ display: "inline", textAlign: "center" }}>
												<Icon
													symbol="analytics"
													spritemap={this.spritemap}
													style={{ marginRight: "5px" }}
												/>
												<Text
													size={4}
													weight="bold"
												>
													{Util.translate("data-management")}
												</Text>
											</div>
										</div>
									)}
								</div>
								<SXDataCollectionNavigator
									key={this.state.refreshNav}
									namespace={this.namespace}
									formId={this.formId}
									navItems={this.navItems}
									style={{
										maxWidth: "100%"
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
							key={applicationTitle + this.state.viewMode}
							namespace={this.namespace}
							formId={this.namespace}
							applicationTitle={applicationTitle}
							verticalNavOpened={this.state.openVerticalNav}
							buttons={this.applicationBarButtons}
							spritemap={this.spritemap}
						/>
						<div
							ref={this.contentRef}
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

export default CollectionsManagement;
