import React from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import {
	ActionKeys,
	DisplayStyles,
	Event,
	LoadingStatus,
	PortletKeys,
	PortletState,
	RequestIDs,
	WorkflowStatus
} from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { SXFreezeIcon } from "../../stationx/icon";

class DataStructureExplorer extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		//console.log("DataStructureExplorer props: ", props);
		this.searchResults = [];
		this.checkboxEnabled = true;

		this.actionButtons = [];
		if (this.checkboxEnabled) {
			this.actionButtons.push({
				id: "deleteSelected",
				name: Util.translate("delete-selected"),
				symbol: "trash"
			});
		}

		this.tableColumns = [
			{ id: "index", name: Util.translate("index"), width: "3.5rem" },
			{
				id: "id",
				name: Util.translate("id"),
				width: "5rem"
			},
			{
				id: "datastructure",
				name: Util.translate("datastructure"),
				width: "auto"
			},
			{
				id: "version",
				name: Util.translate("version"),
				width: "5rem"
			},
			{
				id: "datastructure-code",
				name: Util.translate("datastructure-code"),
				width: "10rem"
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

		this.state = {
			displayStyle: DisplayStyles.TABLE,
			start: this.params.start ?? 0,
			delta: this.params.delta ?? 10,
			keywords: this.params.keywords ?? "",
			searchContainerKey: Util.nowTime(),
			infoDialog: false,
			dialogHeader: <></>,
			dialogBody: <></>,
			confirmDeleteDialog: false,
			dataStructureIdToBeDeleted: 0,
			loadingStatus: LoadingStatus.PENDING
		};

		this.searchContainerId = this.namespace + "dataStructureSeachContainer";
	}

	listenerSelectAll = (event) => {
		const { targetPortlet, targetFormId, selectAll } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[DataStructureExplorer] listenerSelectAll event rejected: ", targetPortlet, targetFormId);
			return;
		}

		//console.log("[DataStructureExplorer] listenerSelectAll: ", dataPacket);

		this.searchResults.forEach((result) => {
			result.checked = selectAll;
			return result;
		});

		this.forceUpdate();
	};

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			//console.log("[DataStructureExplorer] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		//console.log("[DataStructureExplorer] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerAddButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataStructureExplorer] listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("[DataStructureExplorer] listenerAddButtonClicked: ", dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.DATASTRUCTURE_BUILDER,
			portletState: PortletState.NORMAL,
			title: Util.translate("create-datastructure")
		});
	};

	listenerPopActionClicked = (event) => {
		const { targetPortlet, targetFormId, action, data } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[DataStructureExplorer] listenerPopActionClicked event rejected: ", targetPortlet, targetFormId);
			return;
		}

		const selectedDataStructureId = this.searchResults[data].id;
		//console.log("[DataStructureExplorer] listenerPopActionClicked: ", this.searchResults[data], action, data);

		switch (action) {
			case "update": {
				this.fireLoadPortlet({
					portletName: PortletKeys.DATASTRUCTURE_BUILDER,
					params: {
						dataStructureId: selectedDataStructureId
					}
				});

				break;
			}
			case "delete": {
				this.setState({
					confirmDeleteDialog: true,
					dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
					dialogBody: Util.translate("this-is-not-recoverable-are-you-sure-to-proceed"),
					dataStructureIdToBeDeleted: selectedDataStructureId
				});
				break;
			}
		}
	};

	listenerSelectedResultsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataStructureExplorer] listenerSelectedResultsChanged event rejected: ", dataPacket);
			return;
		}
		//console.log("[DataStructureExplorer] listenerSelectedResultsChanged: ", dataPacket);

		this.forceUpdate();
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataStructureExplorer] listenerDeleteSelected rejected: ", dataPacket);
			return;
		}
		//console.log("[DataStructureExplorer] listenerDeleteSelected: ", dataPacket);

		this.setState({
			confirmDeleteDialog: true,
			dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
			dialogBody: Util.translate("this-is-not-recoverable-are-you-sure-to-proceed")
		});
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataStructureExplorer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		//console.log("[DataStructureExplorer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: RequestIDs.searchDataStructures,
			params: {
				keywords: this.state.keywords,
				start: this.state.start,
				delta: this.state.delta,
				filterBy: this.state.filterBy
			}
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, targetFormId, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[DataStructureExplorer] listenerResponse rejected: ", dataPacket);
			return;
		}

		//console.log("[DataStructureExplorer] listenerResponse received: ", requestId, params, data);

		const { error } = data;
		if (error) {
			this.setState({
				infoDialog: true,
				dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
				dialogBody: error
			});

			return;
		}

		switch (requestId) {
			case RequestIDs.searchDataStructures: {
				const { dataStructureList } = data;

				this.convertSearchResultsToContent(dataStructureList);
				break;
			}
			case RequestIDs.deleteDataStructures: {
				const { dataStructureList } = data;

				this.setState({
					dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
					dialogBody: Util.translate("datastructures-deleted-successfully", dataStructureList),
					infoDialog: true
				});

				this.searchResults = [];

				this.fireRequest({
					requestId: RequestIDs.searchDataStructures,
					params: this.params
				});

				break;
			}
		}

		this.setState({
			loadingStatus: LoadingStatus.COMPLETE
		});
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataStructureExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		//console.log("[DataStructureExplorer] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//Loading dataType
		//this.loadDataType();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
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
		//console.log("[DataStructureExplorer] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	selectedDataStructureIds = () => {
		return this.searchResults
			.filter((result) => result.checked)
			.map((result) => {
				return result.id;
			});
	};

	checkAllResultsSelected = () => {
		const dataStructureIds = this.selectedDataStructureIds();

		return dataStructureIds.length == this.searchResults.length;
	};

	getDataStructureIdFromRow(row) {
		const column = row.filter((column) => column.id === "dataStructureId")[0];
		//console.log("getDataStructureIdFromRow: ", column);
		return column.value;
	}

	convertSearchResultsToContent(results) {
		//console.log("seachec dataStructureList: ", results);
		this.searchResults = results.map((dataStructure, index) => {
			const { dataStructureId, paramCode, paramVersion, displayName } = dataStructure;

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

			let row = {
				id: dataStructureId,
				index: index,
				checked: false,
				columns: [
					{
						id: "dataStructureId",
						value: dataStructureId
					},
					{
						id: "displayName",
						value: displayName
					},
					{
						id: "dataStructureVersion",
						value: paramVersion
					},
					{
						id: "dataStructureCode",
						value: paramCode
					},
					{
						id: "actions",
						value: contentActionMenus
					}
				]
			};

			return row;
		});

		this.setState({
			searchContainerKey: Util.nowTime()
		});
	}

	deleteDataStructures = () => {
		const dataStructureIds =
			this.state.dataStructureIdToBeDeleted > 0
				? [this.state.dataStructureIdToBeDeleted]
				: this.selectedDataStructureIds();

		//console.log("deleteDataStructures: ", dataStructureIds);

		this.fireRequest({
			requestId: RequestIDs.deleteDataStructures,
			params: {
				dataStructureIds: dataStructureIds
			}
		});

		this.setState({
			loadingStatus: LoadingStatus.PENDING
		});
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <h3>Loading....</h3>;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <h3>Loading failed</h3>;
		}

		return (
			<div>
				<SXManagementToolbar
					key={this.checkAllResultsSelected()}
					namespace={this.namespace}
					formId={this.formId}
					searchBar={true}
					addButton={true}
					actionButtons={this.actionButtons}
					actionMenus={this.actionMenus}
					checkbox={this.checkboxEnabled}
					checkboxChecked={this.checkAllResultsSelected()}
					start={this.state.start}
					delta={this.state.delta}
					keywords={this.state.keywords}
					spritemap={this.spritemap}
				/>
				<SXSearchResultConainer
					key={this.state.searchContainerKey}
					namespace={this.namespace}
					formId={this.formId}
					checkbox={this.checkboxEnabled}
					checkAll={this.checkAllResultsSelected()}
					index={true}
					columns={this.tableColumns}
					searchResults={this.searchResults}
					spritemap={this.spritemap}
				/>
				{this.state.infoDialog && (
					<SXModalDialog
						header={this.state.dialogHeader}
						body={this.state.dialogBody}
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
						header={this.state.dialogHeader}
						body={this.state.dialogBody}
						buttons={[
							{
								label: Util.translate("confirm"),
								onClick: (e) => {
									this.deleteDataStructures();
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
			</div>
		);
	}
}

export default DataStructureExplorer;
