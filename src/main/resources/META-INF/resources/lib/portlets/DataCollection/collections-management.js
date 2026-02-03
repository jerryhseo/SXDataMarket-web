import React, { createRef } from "react";
import { Event, PortletKeys, PortletState, RequestIDs } from "../../stationx/station-x";
import { SXPortlet, Workbench } from "../DataWorkbench/workbench";
import { Rnd } from "react-rnd";
import SXDataCollectionNavigationBar from "./datacollection-navigationbar";
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
		DATA: "data",
		DATACOLLECTION_EXPLORER: "dataCollectionExplorer",
		DATASET_EXPLORER: "dataSetExplorer",
		DATATYPE_EXPLORER: "dataTypeExplorer",
		DATASTRUCTURE_EXPLORER: "dataStructureExplorer"
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
			workingPortletInstance: this.initializeWorkingPortletInstance(),
			openVerticalNav: this.params.verticalNav ?? true,
			navExpandedKeys: null,
			refreshNav: Util.randomKey(),
			infoDialog: false,
			confirmDeleteDataCollectionDialog: false,
			confirmDeleteDataSetDialog: false,
			addDataCollectionWarning: false,
			dataCollectionIdsToBeDeleted: []
		};

		this.contentRef = createRef();
		this.navRef = createRef();
		this.navbarId = this.namespace + "dataCollectionNavbar";

		this.boundingRect = null;

		this.navItems = [];
		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.applicationTitle = this.buildApplicationTitle();
		this.selectedNavItem = null;

		this.applicationBarButtons = [];

		this.dialogHeader = <></>;
		this.dialogBody = <></>;
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
			requestId: RequestIDs.searchDataCollections,
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

		//this.applicationTitle = applicationTitle;

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
		const { targetPortlet, portletName, params = {}, portletState = PortletState.NORMAL } = event.dataPacket;

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
		const { targetPortlet, targetFormId, item } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[CollectionManagement listenerNavItemSelected rejected] ", params, this.formId);
			return;
		}

		//console.log("[CollectionManagement listenerNavItemSelected] ", params.item, this.state);
		//this.applicationTitle = "";

		let portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
		let requestId;
		let requestParams;
		switch (item.type) {
			case CollectionsManagement.ItemTypes.COLLECTION: {
				const { dataCollectionId, id, items } = item;

				this.setState({
					dataCollectionId: Number(dataCollectionId),
					dataSetId: 0
				});

				if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
					portletName = PortletKeys.DATACOLLECTION_VIEWER;
				}

				if (Util.isEmpty(items)) {
					requestId = RequestIDs.loadAssociatedDataSets;
					requestParams = {
						dataCollectionId: dataCollectionId
					};
				}

				break;
			}
			case CollectionsManagement.ItemTypes.DATASET: {
				const { dataSetId, id, items } = item;

				console.log("NavItem Selected: ", item);

				let dataCollectionId = this.state.dataCollectionId;
				if (!this.state.dataCollectionId) {
					const dataCollectionItem = this.findParentItem(this.navItems, item);
					dataCollectionId = Number(dataCollectionItem.dataCollectionId);
				}

				this.setState({
					dataCollectionId: dataCollectionId,
					dataSetId: Number(dataSetId)
				});

				if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
					portletName = PortletKeys.DATASET_VIEWER;
				}

				if (Util.isEmpty(items)) {
					requestId = RequestIDs.loadAssociatedDataTypes;
					requestParams = {
						dataCollectionId: dataCollectionId,
						dataSetId: dataSetId
					};
				}

				break;
			}
			case CollectionsManagement.ItemTypes.DATATYPE: {
				const { dataTypeId, id } = item;
				this.setState({
					dataTypeId: Number(dataTypeId)
				});
				if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
					portletName = PortletKeys.DATATYPE_VIEWER;
				}

				break;
			}
		}

		if (this.selectedNavItem === item && portletName === this.state.workingPortletInstance.portletName) {
			return;
		} else if (portletName === this.state.workingPortletInstance.portletName) {
			//Event.fire()
		}

		if (requestId) {
			this.workbench.processRequest({
				requestPortlet: this.namespace,
				requestId: requestId,
				params: requestParams
			});
		}

		if (this.selectedNavItem) {
			this.selectedNavItem.dirty = false;
			this.selectedNavItem.active = false;
		}

		this.selectedNavItem = item;
		this.selectedNavItem.active = true;

		this.applicationTitle = "";

		const portletParams = this.getDeployPortletParams();
		this.deployPortlet({
			portletName: portletName,
			params: portletParams
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, sourcePortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[CollectionsManagement] listenerResponce rejected: ", dataPacket);
			return;
		}

		console.log("[CollectionsManagement] listenerResponse: ", requestId, params, data);
		switch (requestId) {
			case RequestIDs.searchDataCollections: {
				this.searchedCollections = data;

				this.navItems = this.searchedCollections.map((dataCollection) => {
					const collectionItem = {
						id: dataCollection.dataCollectionId,
						dataCollectionId: dataCollection.dataCollectionId,
						label: dataCollection.displayName,
						type: CollectionsManagement.ItemTypes.COLLECTION
					};

					const dataSets = dataCollection.dataSets;
					if (dataCollection.dataSets) {
						collectionItem.items = dataCollection.dataSets.map((dataSet) => {
							const setItem = {
								id: dataSet.linkId,
								dataSetId: dataSet.dataSetId,
								label: dataSet.displayName,
								type: CollectionsManagement.ItemTypes.DATASET
							};

							if (dataSet.dataTypes) {
								setItem.items = dataSet.dataTypes.map((dataType) => {
									return {
										id: dataType.setTypelinkId,
										dataTypeId: dataType.dataTypeId,
										label: dataType.displayName,
										type: CollectionsManagement.ItemTypes.DATATYPE
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

			case RequestIDs.searchStructuredData: {
				this.searchedCollections = data;

				break;
			}
			case RequestIDs.loadAssociatedDataSets: {
				//console.log("[CollectionsManagement] listenerResponse ", this.selectedNavItem, data);

				this.fireNavRefresh(this.selectedNavItem.id);

				break;
			}
			case RequestIDs.loadAssociatedDataTypes: {
				//console.log("[CollectionsManagement] listenerResponse ", this.selectedNavItem, data);

				this.selectedNavItem.items = data.map((dataType) => ({
					id: dataType.setTypeLinkId,
					dataTypeId: dataType.dataTypeId,
					dataTypeVersion: dataType.dataTypeVersion,
					dataTypeCode: dataType.dataTypeCode,
					label: dataType.displayName,
					type: CollectionsManagement.ItemTypes.DATATYPE
				}));

				this.fireNavRefresh(this.selectedNavItem.id);

				break;
			}
			case RequestIDs.deleteDataCollections: {
				this.navItems = this.navItems.filter((navItem) => navItem !== this.selectedNavItem);

				this.selectedNavItem = null;
				this.applicationTitle = "";

				this.setState({
					refreshNav: Util.randomKey(),
					workingPortletInstance: this.initializeWorkingPortletInstance()
				});

				this.fireNavRefresh();

				break;
			}
			case RequestIDs.saveDataCollection: {
				const { dataCollection, associatedDataSets, error } = data;

				if (Util.isNotEmpty(error)) {
					this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("saving-datacollection-failed", error);
				} else {
					this.dialogHeader = SXModalUtil.successDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("datacollection-saved-as", dataCollection.dataCollectionId);

					this.workbench.fireResponse({
						targetPortlet: this.state.workingPortletInstance.namespace,
						requestId: requestId,
						params: params,
						data: data
					});

					console.log("this.selectedNavItem: ", JSON.stringify(this.selectedNavItem, null, 4));
					if (!this.selectedNavItem.id) {
						this.selectedNavItem = {
							type: CollectionsManagement.ItemTypes.COLLECTION
						};

						this.navItems.push(this.selectedNavItem);
					}

					this.applySelectedNavItemChanged({
						id: dataCollection.dataCollectionId,
						modelId: dataCollection.dataCollectionId,
						label: dataCollection.displayName,
						items: associatedDataSets.map((dataSet) => ({
							id: dataSet.linkId,
							modelId: dataSet.dataSetId,
							label: dataSet.displayName,
							type: CollectionsManagement.ItemTypes.DATASET
						})),
						dirty: false
					});
				}

				this.setState({
					infoDialog: true
				});

				break;
			}
			case RequestIDs.deleteDataSets: {
				let itemDataCollection;

				this.navItems.every((navItem) => {
					if (navItem.dataCollectionId === this.state.dataCollectionId.toString()) {
						itemDataCollection = navItem;
						navItem.items = navItem.items.filter((dataSetItem) => dataSetItem !== this.selectedNavItem);
					}
				});

				this.selectedNavItem = null;

				this.setState({
					refreshNav: Util.randomKey(),
					workingPortletInstance: this.initializeWorkingPortletInstance()
				});

				this.fireNavRefresh();

				break;
			}
			case RequestIDs.saveDataSet: {
				const { dataSet, associatedDataTypes = [], error } = data;

				if (Util.isNotEmpty(error)) {
					this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("saving-datacollection-failed", error);
				} else {
					this.dialogHeader = SXModalUtil.successDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("dataset-saved-as", dataSet.dataSetId);

					this.workbench.fireResponse({
						targetPortlet: this.state.workingPortletInstance.namespace,
						requestId: requestId,
						params: params,
						data: data
					});

					console.log("this.selectedNavItem: ", dataSet, JSON.stringify(this.selectedNavItem, null, 4));
					if (this.selectedNavItem.type === CollectionsManagement.ItemTypes.COLLECTION) {
						const dataSetNavItem = {
							type: CollectionsManagement.ItemTypes.DATASET
						};

						this.selectedNavItem.items.push(dataSetNavItem);

						this.selectedNavItem = dataSetNavItem;
					}

					this.applySelectedNavItemChanged({
						id: dataSet.dataSetId,
						modelId: dataSet.dataSetId,
						label: dataSet.displayName,
						items: associatedDataTypes.map((dataType) => ({
							id: dataType.linkId,
							modelId: dataType.dataTypeId,
							label: dataType.displayName,
							type: CollectionsManagement.ItemTypes.DATATYPE
						})),
						dirty: false
					});
				}

				this.setState({
					infoDialog: true
				});

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
		const { targetPortlet, viewMode, explorerName } = event.dataPacket;
		console.log("[CollectionsManagement viewMode] ", viewMode, explorerName);

		if (targetPortlet !== this.namespace) {
			return;
		}

		console.log("[CollectionsManagement viewMode] ", viewMode);

		this.setState({ viewMode: viewMode });

		let portletName;
		switch (viewMode) {
			case CollectionsManagement.ViewMode.FORM: {
				if (this.state.dataTypeId > 0) {
					portletName = PortletKeys.DATATYPE_VIEWER;
				} else if (this.state.dataSetId > 0) {
					portletName = PortletKeys.DATASET_VIEWER;
				} else if (this.state.dataCollectionId > 0) {
					portletName = PortletKeys.DATACOLLECTION_VIEWER;
				}

				break;
			}
			case CollectionsManagement.ViewMode.DATA: {
				portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;

				break;
			}
			case CollectionsManagement.ViewMode.DATACOLLECTION_EXPLORER: {
				portletName = PortletKeys.DATACOLLECTION_EXPLORER;

				break;
			}
			case CollectionsManagement.ViewMode.DATASET_EXPLORER: {
				portletName = PortletKeys.DATASET_EXPLORER;

				break;
			}
			case CollectionsManagement.ViewMode.DATATYPE_EXPLORER: {
				portletName = PortletKeys.DATATYPE_EXPLORER;

				break;
			}
			case CollectionsManagement.ViewMode.DATASTRUCTURE_EXPLORER: {
				portletName = PortletKeys.DATASTRUCTURE_EXPLORER;

				break;
			}
		}

		const portletParams = this.getDeployPortletParams(viewMode);

		if (portletName && portletParams) {
			this.deployPortlet({
				portletName: portletName,
				params: portletParams
			});
		} else {
			this.setState({
				workingPortletInstance: this.initializeWorkingPortletInstance()
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
			case "moveUp": {
				console.log("moveUp: ", this.selectedNavItem);
				return;
			}
			case "moveDown": {
				return;
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

	listenerDataCollectionChanged = (event) => {
		const { targetPortlet, dataCollection } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[CollectionsManagement listenerDataCollectionChanged REJECTED] ", event.dataPacket);
			return;
		}

		//console.log("[CollectionsManagement listenerDataCollectionChanged] ", this.selectedNavItem, dataCollection);

		const { dataCollectionId, displayName, dataSets } = dataCollection;

		if (!this.selectedNavItem) {
			this.selectedNavItem = {
				type: CollectionsManagement.ItemTypes.COLLECTION,
				dirty: true
			};
		} else {
			this.selectedNavItem.dirty = true;
			this.fireNavRefresh();
		}
	};

	listenerDataSetChanged = (event) => {
		const { targetPortlet, dataSet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[CollectionsManagement listenerDataSetChanged REJECTED] ", event.dataPacket);
			return;
		}

		console.log("[CollectionsManagement listenerDataSetChanged] ", this.selectedNavItem, dataSet);
		const { dataSetId, displayName, dataTypes } = dataSet;

		if (!this.selectedNavItem) {
			this.selectedNavItem = {
				type: CollectionsManagement.ItemTypes.DATASET,
				dirty: true
			};
		} else {
			this.selectedNavItem.dirty = true;
			this.fireNavRefresh();
		}
	};

	listenerDeleteDataCollection = (event) => {
		const { targetPortlet, dataCollectionId } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[CollectionsManagement listenerDeleteDataCollection REJECTED] ", event.dataPacket);
			return;
		}
		console.log(
			"[CollectionsManagement listenerDeleteDataCollection] ",
			this.selectedNavItem,
			this.state.dataCollectionId,
			dataCollectionId
		);

		if (this.state.dataCollectionId !== dataCollectionId.toString()) {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate(
				"current-selected-datacollection-should-be-same-with-the-datacollection-to-be-deleted"
			);

			this.setState({
				infoDialog: true
			});
		} else {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate(
				"will-delete-all-related-data-and-is-not-recoverable-are-you-sure-to-proceed"
			);

			this.setState({
				confirmDeleteDataCollectionDialog: true
			});
		}
	};

	listenerSaveDataCollection = (event) => {
		const { targetPortlet, dataCollection } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[CollectionsManagement listenerSaveDataCollection REJECTED] ", event.dataPacket);
			return;
		}
		console.log(
			"[CollectionsManagement listenerSaveDataCollection] ",
			this.selectedNavItem,
			this.state.dataCollectionId,
			dataCollection
		);

		this.workbench.processRequest({
			requestPortlet: this.namespace,
			requestId: RequestIDs.saveDataCollection,
			params: dataCollection
		});

		//this.fireNavRefresh();
	};

	listenerSaveDataSet = (event) => {
		const { targetPortlet, dataSet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[CollectionsManagement listenerSaveDataSet REJECTED] ", event.dataPacket);
			return;
		}
		console.log(
			"[CollectionsManagement listenerSaveDataSet] ",
			this.selectedNavItem,
			this.state.dataSetId,
			dataSet
		);

		this.workbench.processRequest({
			requestPortlet: this.namespace,
			requestId: RequestIDs.saveDataSet,
			params: dataSet
		});

		//this.fireNavRefresh();
	};

	listenerDeleteDataSet = (event) => {
		const { targetPortlet, dataCollectionId, dataSetId } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[CollectionsManagement listenerDeleteDataSet REJECTED] ", event.dataPacket);
			return;
		}
		console.log(
			"[CollectionsManagement listenerDeleteDataSet] ",
			this.selectedNavItem,
			this.state.dataCollectionId,
			dataCollectionId,
			this.state.dataSetId,
			dataSetId
		);

		if (
			this.state.dataCollectionId !== dataCollectionId ||
			this.selectedNavItem.dataSetId !== dataSetId.toString()
		) {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate(
				"current-selected-datacollection-should-be-same-with-the-dataset-to-be-deleted"
			);

			this.setState({
				infoDialog: true
			});
		} else {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate(
				"will-delete-all-related-data-and-is-not-recoverable-are-you-sure-to-proceed"
			);

			this.setState({
				confirmDeleteDataSetDialog: true
			});
		}
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
		Event.on(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
		Event.on(Event.SX_DELETE_DATACOLLECTION, this.listenerDeleteDataCollection);
		Event.on(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
		Event.on(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
		Event.on(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
		Event.on(Event.SX_DELETE_DATASET, this.listenerDeleteDataSet);

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
		Event.off(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
		Event.off(Event.SX_DELETE_DATACOLLECTION, this.listenerDeleteDataCollection);
		Event.off(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
		Event.off(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
		//Event.off(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
		Event.off(Event.SX_DELETE_DATASET, this.listenerDeleteDataSet);

		window.removeEventListener("resize", this.listenerWindowResize);
	}

	fireNavRefresh(additionalExpandedKeys = []) {
		Event.fire(Event.SX_REFRESH_NAVBAR, this.namespace, this.namespace, {
			targetFormId: this.navbarId,
			additionalExpandedKeys: additionalExpandedKeys
		});
	}

	getDataCollectionNavItem() {
		return this.navItems.filter(
			(navItem) => navItem.dataCollectionId === this.state.dataCollectionId.toString()
		)[0];
	}

	initializeWorkingPortletInstance() {
		return {
			portletName: "",
			portletId: "",
			namespace: "",
			displayName: "",
			title: "",
			content: <></>,
			portlet: null
		};
	}

	deleteDataCollection = () => {
		this.workbench.processRequest({
			requestPortlet: this.namespace,
			requestId: RequestIDs.deleteDataCollections,
			params: {
				dataCollectionIds: [this.state.dataCollectionId]
			}
		});
	};

	deleteDataSet = () => {
		this.workbench.processRequest({
			requestPortlet: this.namespace,
			requestId: RequestIDs.deleteDataSets,
			params: {
				dataCollectionId: this.state.dataCollectionId,
				dataSetIds: [this.state.dataSetId]
			}
		});
	};

	findParentItem = (items, child, parent = null) => {
		for (const item of items) {
			if (item === child) {
				return parent;
			}

			if (Util.isNotEmpty(item.items)) {
				const found = this.findParentItem(item.items, child, item);
				if (found) {
					return found;
				}
			}
		}

		return null;
	};

	applySelectedNavItemChanged({ id, modelId, label, items, active = true, dirty = true }) {
		this.selectedNavItem.id = id;
		this.selectedNavItem.modelId = modelId;
		this.selectedNavItem.label = label;
		this.selectedNavItem.items = items;

		this.selectedNavItem.active = active;
		this.selectedNavItem.dirty = dirty;

		this.applicationTitle = "";
	}

	findNavItem(items, id) {
		for (const item of items) {
			if (item.id == id) {
				return item;
			}

			if (Util.isNotEmpty(item.items)) {
				const found = this.findNavItem(item.items, id);
				if (found) {
					return found;
				}
			}
		}

		return null;
	}

	removeUnsavedItems(items) {
		for (const item of items) {
			if (item.id == 0) {
			}
		}
	}

	buildApplicationTitle() {
		if (!this.applicationTitle) {
			let applicationTitle = Util.isEmpty(this.dataCollectionDisplayName) ? "" : this.dataCollectionDisplayName;
			if (this.dataSetDisplayName) {
				applicationTitle += Util.isEmpty(this.dataSetDisplayName) ? "" : " > " + this.dataSetDisplayName;
			}
			if (this.dataTypeDisplayName) {
				applicationTitle += Util.isEmpty(this.dataTypeDisplayName) ? "" : " > " + this.dataTypeDisplayName;
			}

			this.applicationTitle = applicationTitle ? applicationTitle : Util.translate("select-datacollection");
		}
	}

	searchDataTypes = async (params, targetPortlet) => {
		const result = await this.workbench.searchDataTypes(params);

		this.workbench.fireLoadData(targetPortlet, result);
	};

	initializeApplicationBar() {
		this.dataCollectionDisplayName = "";
		this.dataSetDisplayName = "";
		this.dataTypeDisplayName = "";
		this.applicationBarButtons = [];
	}

	getDeployPortletParams(viewMode = this.state.viewMode) {
		//console.log("[CollectionManagement getDeployPortletParams] ", JSON.stringify(this.selectedNavItem, null, 4));
		if (Util.isEmpty(this.selectedNavItem)) {
			this.initializeApplicationBar();
			return {};
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

				const dataCollectionItem = this.findParentItem(this.navItems, this.selectedNavItem);
				this.dataCollectionDisplayName = dataCollectionItem.label;
				portletParams = {
					dataCollectionId: dataCollectionItem.dataCollectionId,
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

				const dataSetItem = this.findParentItem(this.navItems, this.selectedNavItem);
				const dataCollectionItem = this.findParentItem(this.navItems, dataSetItem);
				//console.log("getDeployPortletParams: ", dataSetItem, dataCollectionItem, dataTypeId);

				portletParams = {
					dataCollectionId: dataCollectionItem.dataCollectionId,
					dataSetId: dataSetItem.dataSetId,
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

	deployPortlet = async ({ portletName, params = {}, title = "", portletState = PortletState.NORMAL }) => {
		const portletInstance = await this.workbench.loadPortlet({
			portletName: portletName,
			params: params
		});

		portletInstance.portletState = portletState;

		this.setState({
			workingPortletInstance: portletInstance
		});
	};

	openDataCollectionEditor() {
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
			portletState: PortletState.NORMAL
		});

		if (this.selectedNavItem) {
			this.selectedNavItem.active = false;
			this.selectedNavItem.dirty = false;
			this.selectedNavItem = null;
		}

		this.fireNavRefresh();
	}

	handleAddDataCollection = (event) => {
		event.stopPropagation();

		if (this.selectedNavItem && this.selectedNavItem.dirty) {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate("current-item-is-changed-and-not-saved-are-you-sure-to-proceed");

			this.setState({
				addDataCollectionWarning: true
			});

			return;
		}

		this.applicationTitle = Util.translate("add-datacollection");
		this.openDataCollectionEditor();
	};

	render() {
		if (
			this.state.viewMode === CollectionsManagement.ViewMode.DATACOLLECTION_EXPLORER ||
			this.state.viewMode === CollectionsManagement.ViewMode.DATASET_EXPLORER ||
			this.state.viewMode === CollectionsManagement.ViewMode.DATATYPE_EXPLORER ||
			this.state.viewMode === CollectionsManagement.ViewMode.DATASTRUCTURE_EXPLORER
		) {
			return (
				<div
					ref={this.contentRef}
					style={{ overflowX: "hidden", overflowY: "auto", padding: "0 10px" }}
				>
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
		} else {
			let height = window.innerHeight;

			if (this.boundingRect) {
				height = window.innerHeight - this.boundingRect.top;
			}

			this.buildApplicationTitle();

			/*
			console.log(
				"CollectionManagement render: ",
				this.state.viewMode,
				this.applicationTitle,
				this.selectedNavItem,
				this.applicationBarButtons
			); */

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
									<SXDataCollectionNavigationBar
										key={this.state.refreshNav}
										namespace={this.namespace}
										formId={this.formId}
										componentId={this.navbarId}
										navItems={this.navItems}
										navExpandedKeys={this.state.navExpandedKeys}
										orderable={this.state.viewMode === CollectionsManagement.ViewMode.FORM}
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
								key={this.applicationTitle + this.state.viewMode}
								namespace={this.namespace}
								formId={this.namespace}
								applicationTitle={this.applicationTitle}
								verticalNavOpened={this.state.openVerticalNav}
								buttons={this.applicationBarButtons}
								spritemap={this.spritemap}
							/>
							<div
								ref={this.contentRef}
								style={{ overflowX: "hidden", overflowY: "auto", padding: "0 10px" }}
							>
								{this.state.workingPortletInstance.portletState === PortletState.NORMAL && (
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
					{this.state.confirmDeleteDataCollectionDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataCollection();
										this.setState({ confirmDeleteDataCollectionDialog: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ confirmDeleteDataCollectionDialog: false });
									}
								}
							]}
						/>
					)}
					{this.state.confirmDeleteDataSetDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataSet();
										this.setState({ confirmDeleteDataSetDialog: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ confirmDeleteDataSetDialog: false });
									}
								}
							]}
						/>
					)}
					{this.state.addDataCollectionWarning && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.openDataCollectionEditor();
										this.setState({ addDataCollectionWarning: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ addDataCollectionWarning: false });
									}
								}
							]}
						/>
					)}
				</div>
			);
		}
	}
}

export default CollectionsManagement;
