import React from "react";
import { Util } from "../../stationx/util";
import {
	ActionKeys,
	ErrorClass,
	Event,
	FilterOptions,
	LoadingStatus,
	ParamType,
	PortletKeys,
	ValidationRule
} from "../../stationx/station-x";
import { GroupParameter, Parameter } from "../../stationx/parameter";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { SXErrorModal, SXLoadingModal, SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBaseVisualizer from "../../stationx/visualizer";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { UnderConstruction } from "../../stationx/common";
import { Workbench } from "../DataWorkbench/workbench";

class DataCollectionExplorer extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataCollectionExplorer props: ", props);

		this.checkboxEnabled =
			this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE);

		this.managementBar = this.params.managementBar ?? true;
		this.enableFilter = this.params.filter ?? true;
		this.enableSearchBar = this.params.searchBar ?? true;
		this.enableAddButton = this.params.addButton ?? true;
		this.enableCheckbox = this.params.checkbox ?? true;
		this.enableActionButtons = this.params.actionButtons ?? true;
		this.enableActionMenus = this.params.actionMenus ?? true;
		this.enableDisplayStyles = this.params.displayStyles ?? true;

		this.state = {
			start: this.params.start ?? 0,
			delta: this.params.delta ?? 10,
			keywords: this.params.keywords ?? "",
			searchContainerKey: Util.randomKey(),
			filterBy: this.params.filterBy ?? FilterOptions.GROUP_ID,
			loadingStatus: false,
			infoDialog: false,
			confirmDeleteDialog: false,
			underConstruction: false
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		if (this.state.enableActionButtons) {
			this.actionButtons = [];
			if (this.checkboxEnabled) {
				this.actionButtons.push({
					id: "deleteSelected",
					name: Util.translate("delete-selected"),
					symbol: "trash"
				});
			}
		}

		this.actionMenus = [];
		this.searchResults = [];
		this.selectedResults = [];

		this.contentActionMenus = [];

		if (this.permissions.includes(ActionKeys.UPDATE)) {
			this.contentActionMenus.push({
				id: "update",
				name: Util.translate("update"),
				symbol: "pencil"
			});
			this.contentActionMenus.push({
				id: "delete",
				name: Util.translate("delete"),
				symbol: "trash"
			});
		}

		this.contentActionMenus.push({
			name: Util.translate("advanced-search"),
			id: "advancedSearch",
			symbol: "search-experiences"
		});

		this.tableColumns = [
			{ id: "index", name: Util.translate("index"), width: "3.5rem" },
			{
				id: "id",
				name: Util.translate("id"),
				width: "5rem"
			},
			{
				id: "displayName",
				name: Util.translate("display-name"),
				width: "auto"
			},
			{
				id: "version",
				name: Util.translate("version"),
				width: "5rem"
			},
			{
				id: "dataCollectionCode",
				name: Util.translate("code"),
				width: "10rem"
			},
			{
				id: "status",
				name: Util.translate("status"),
				width: "6rem"
			},
			{
				id: "actions",
				name: "actions",
				width: "3.5rem"
			}
		];
		if (this.permissions.includes(ActionKeys.UPDATE)) {
			this.tableColumns.unshift({ id: "checkbox", name: "", width: "2.5rem" });
		}
	}

	listenerSelectAll = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataCollectionExplorer] listenerSelectAll event rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionExplorer] listenerSelectAll: ", dataPacket);

		this.selectedResults = dataPacket.selectAll ? [...this.searchedResults] : [];

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			console.log("[DataCollectionExplorer] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		console.log("[DataCollectionExplorer] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerAddButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataCollectionExplorer] listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		console.log("[DataCollectionExplorer] listenerAddButtonClicked: ", dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.DATACOLLECTION_EDITOR,
			portletState: Workbench.PortletState.NORMAL,
			title: Util.translate("create-datacollection")
		});
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataCollectionExplorer] listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}

		const selectedResultId = this.searchedResults[dataPacket.data][0].value;
		console.log(
			"[DataCollectionExplorer] listenerPopActionClicked: ",
			dataPacket,
			this.searchedResults,
			selectedResultId
		);

		switch (dataPacket.action) {
			case "update": {
				this.fireLoadPortlet({
					portletName: PortletKeys.DATACOLLECTION_EDITOR,
					params: {
						dataCollectionId: this.dataCollectionId
					}
				});

				break;
			}
			case "delete": {
				break;
			}
		}
	};

	listenerSelectedResultsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataCollectionExplorer] listenerSelectedResultsChanged event rejected: ", dataPacket);
			return;
		}
		console.log("[DataCollectionExplorer] listenerSelectedResultsChanged: ", dataPacket);
		this.selectedResults = dataPacket.selectedResults;

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataCollectionExplorer] listenerDeleteSelected rejected: ", dataPacket);
			return;
		}
		console.log("[DataCollectionExplorer] listenerDeleteSelected: ", dataPacket);

		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataCollectionExplorer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionExplorer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.searchDataCollections,
			params: {
				filterBy: this.state.filterBy,
				groupId: this.groupId,
				userId: this.userId,
				status: "all",
				start: this.state.start,
				delta: this.state.delta,
				keywords: this.state.keywords
			}
		});
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataCollectionExplorer] listenerResponse event rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionExplorer] listenerResponse received: ", dataPacket);
		let state = {};

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.searchDataCollections: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					this.convertSearchResultsToContent(dataPacket.data);
				}

				break;
			}
			case Workbench.RequestIDs.loadDataCollection: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					this.convertSearchResultsToContent(dataPacket.data);
				}

				break;
			}
			case Workbench.RequestIDs.deleteDataCollections: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					state.infoDialog = true;
					this.dialogHeader = SXModalUtil.successDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("datacollections-deleted-successfully");

					this.fireRequest({
						requestId: Workbench.RequestIDs.searchDataCollections,
						params: this.params
					});

					this.setState({
						infoDialog: true
					});

					return;
				}

				break;
			}
		}

		this.setState({
			...state,
			loadingStatus: dataPacket.status
		});
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataCollectionExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionExplorer] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.on(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.on(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.on(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.on(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataCollectionExplorer] componentWillUnmount");
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	checkAllResultsSelected = () => {
		return this.selectedResults.length > 0 && this.searchResults.length == this.selectedResults.length;
	};

	selectedResultsToDataCollectionIds = () => {
		return this.selectedResults.map((result) => result[0].value);
	};

	convertSearchResultsToContent(results) {
		this.searchResults = results.map((result, index) => {
			const { dataCollectionId, dataCollectionCode, dataCollectionVersion, displayName } = result;

			//console.log("convertSearchResultsToContent: ", result, dataType, Util.isNotEmpty(typeStructureLink));
			const contentActionMenus = [];

			if (this.permissions.includes(ActionKeys.UPDATE)) {
				contentActionMenus.push({
					id: "update",
					name: Util.translate("update"),
					symbol: "pencil"
				});
				contentActionMenus.push({
					id: "delete",
					name: Util.translate("delete"),
					symbol: "trash"
				});
			}

			let row = [
				{
					id: "dataCollectionId",
					value: dataCollectionId
				},
				{
					id: "displayName",
					value: displayName
				},
				{
					id: "dataCollectionVersion",
					value: dataCollectionVersion
				},
				{
					id: "dataCollectionCode",
					value: dataCollectionCode
				},
				{
					id: "actions",
					value: contentActionMenus
				}
			];

			return row;
		});

		this.selectedResults = [];
	}

	deleteDataCollections = () => {
		console.log("Selected DataTypes: ", this.selectedResults, this.selectedResultsToDataCollectionIds());
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataCollections,
			params: {
				dataCollectionIds: JSON.stringify(this.selectedResultsToDataCollectionIds())
			}
		});
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <SXLoadingModal imageURL={this.imagePath + "/searching.gif"} />;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <SXErrorModal imageURL={this.imagePath + "/ajax-error.gif"} />;
		} else {
			return (
				<div>
					{this.managementBar && (
						<SXManagementToolbar
							key={this.checkAllResultsSelected()}
							namespace={this.namespace}
							formId={this.formId}
							searchBar={true}
							addButton={true}
							filterBy={this.state.filterBy}
							actionButtons={this.actionButtons}
							actionMenus={this.actionMenus}
							checkbox={this.checkboxEnabled}
							checkboxChecked={this.checkAllResultsSelected()}
							start={this.state.start}
							delta={this.state.delta}
							keywords={this.state.keywords}
							spritemap={this.spritemap}
						/>
					)}
					<SXSearchResultConainer
						key={this.state.searchContainerKey}
						namespace={this.namespace}
						formId={this.formId}
						checkbox={this.checkboxEnabled}
						checkAll={this.checkAllResultsSelected()}
						index={true}
						columns={this.tableColumns}
						searchResults={this.searchResults}
						selectedResults={this.selectedResults}
						spritemap={this.spritemap}
					/>
					{this.state.confirmDeleteDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataTypes();
										this.setState({ confirmDeleteDialog: false });
									}
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ confirmDeleteDialog: false });
									}
								}
							]}
						/>
					)}
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
					{this.state.confirmDeleteDialog && (
						<SXModalDialog
							header={this.state.dlgHeader}
							body={this.state.dlgBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataCollections();
										this.setState({ confirmDeleteDialog: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ confirmDeleteDialog: false });
									}
								}
							]}
						/>
					)}
					{this.state.underConstruction && (
						<SXModalDialog
							header={Util.translate("underconstruction")}
							body={<UnderConstruction />}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: () => {
										this.setState({ underConstruction: false });
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

export default DataCollectionExplorer;
