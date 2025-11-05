import React, { useContext, useState, useEffect, useRef } from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import { ActionKeys, DisplayStyles, Event, LoadingStatus, PortletKeys } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { Workbench } from "../DataWorkbench/workbench";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { SXFreezeIcon } from "../../stationx/icon";

class DataStructureExplorer extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataStructureExplorer props: ", props);
		this.dataStructureList = [];

		this.selectedDataStructures = [];
		this.searchedDataStructures = [];
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
				id: "staus",
				name: Util.translate("status"),
				width: "6rem"
			},
			//{
			//	id: "dataStaus",
			//	name: Util.translate("data-status"),
			//	width: "6rem"
			//},
			{
				id: "actions",
				name: "actions",
				width: "3.5rem"
			}
		];
		if (this.permissions.includes(ActionKeys.UPDATE)) {
			this.tableColumns.unshift({ id: "checkbox", name: "", width: "2.5rem" });
		}

		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.state = {
			displayStyle: DisplayStyles.TABLE,
			start: this.params.start ?? 0,
			delta: this.params.delta ?? 10,
			keywords: this.params.keywords ?? "",
			searchContainerKey: Util.randomKey(),
			infoDialog: false,
			confirmDeleteDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.searchContainerId = this.namespace + "dataStructureSeachContainer";
		this.lastSelectedRow = null;
	}

	listenerSelectAll = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerSelectAll event rejected: ", dataPacket);
			return;
		}

		console.log("[DataStructureExplorer] listenerSelectAll: ", dataPacket);

		this.selectedDataStructures = dataPacket.selectAll ? [...this.searchedDataStructures] : [];

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			console.log("[DataStructureExplorer] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		console.log("[DataStructureExplorer] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerAddButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		console.log("[DataStructureExplorer] listenerAddButtonClicked: ", dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.DATASTRUCTURE_BUILDER,
			portletState: Workbench.PortletState.NORMAL,
			title: Util.translate("create-datastructure")
		});
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}

		const selectedDataStructureId = this.searchedDataStructures[dataPacket.data][0].value;
		console.log(
			"[DataStructureExplorer] listenerPopActionClicked: ",
			dataPacket,
			this.searchedDataStructures,
			selectedDataStructureId
		);

		switch (dataPacket.action) {
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
				this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

				this.setState({
					confirmDeleteDialog: true
				});
				break;
			}
		}
	};

	listenerSelectedResultsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerSelectedResultsChanged event rejected: ", dataPacket);
			return;
		}
		console.log("[DataStructureExplorer] listenerSelectedResultsChanged: ", dataPacket);
		this.selectedDataStructures = dataPacket.selectedResults;

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerDeleteSelected rejected: ", dataPacket);
			return;
		}
		console.log("[DataStructureExplorer] listenerDeleteSelected: ", dataPacket);

		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	listenerTableRowSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerTableRowSelected rejected: ", dataPacket);
			return;
		}
		console.log("[DataStructureExplorer] listenerTableRowSelected: ", dataPacket);
	};

	listenerTableColumnSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataStructureExplorer] listenerTableColumnSelected rejected: ", dataPacket);
			return;
		}
		console.log("[DataStructureExplorer] listenerTableColumnSelected: ", dataPacket);

		this.lastSelectedDataStructureId = this.getDataStructureIdFromRow(dataPacket.row);
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataStructureExplorer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[DataStructureExplorer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.searchDataStructures,
			params: {
				keywords: this.state.keywords,
				start: this.state.start,
				delta: this.state.delta,
				filterBy: this.state.filterBy
			}
		});
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataStructureExplorer] listenerResponse rejected: ", dataPacket);
			return;
		}

		console.log("[DataStructureExplorer] listenerResponse received: ", dataPacket);

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.searchDataStructures: {
				this.convertSearchResultsToContent(dataPacket.data);
				break;
			}
		}

		this.setState({
			searchContainerKey: Util.randomKey(),
			loadingStatus: LoadingStatus.COMPLETE
		});
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataStructureExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataStructureExplorer] listenerComponentWillUnmount received: ", dataPacket);
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
		Event.on(Event.SX_TABLE_ROW_CLICKED, this.listenerTableRowSelected);
		Event.on(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnSelected);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataStructureExplorer] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.off(Event.SX_TABLE_ROW_CLICKED, this.listenerTableRowSelected);
		Event.off(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnSelected);
	}

	getDataStructureIdFromRow(row) {
		const column = row.filter((column) => column.id === "dataStructureId")[0];
		console.log("getDataStructureIdFromRow: ", column);
		return column.value;
	}

	checkAllDataStructuresSelected = () => {
		return (
			this.selectedDataStructures.length > 0 &&
			this.searchedDataStructures.length == this.selectedDataStructures.length
		);
	};

	convertSearchResultsToContent(results) {
		this.searchedDataStructures = results.map((dataStructure, index) => {
			const {
				dataCollectionId = 0,
				dataStructureId,
				dataStructureCode,
				dataStructureVersion,
				displayName,
				status
			} = dataStructure;

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
					id: "dataStructureId",
					value: dataStructureId
				},
				{
					id: "displayName",
					value: displayName[this.languageId]
				},
				{
					id: "dataStructureVersion",
					value: dataStructureVersion
				},
				{
					id: "dataStructureCode",
					value: dataStructureCode
				},
				{
					id: "status",
					value: <SXFreezeIcon freezed={status === Workbench.WorkflowStatus.APPROVED} />
				},
				{
					id: "actions",
					value: contentActionMenus
				}
			];

			return row;
		});

		this.selectedDataStructures = [];
	}

	deleteDataStructures = () => {
		console.log("deleteDataStructures: ", this.selectedDataStructures);

		/*
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataStructures,
			params: {
				dataStructureIds: this.selectedDataStructures
			}
		});
		*/
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
					key={this.checkAllDataStructuresSelected()}
					namespace={this.namespace}
					formId={this.formId}
					searchBar={true}
					addButton={true}
					actionButtons={this.actionButtons}
					actionMenus={this.actionMenus}
					checkbox={this.checkboxEnabled}
					checkboxChecked={this.checkAllDataStructuresSelected()}
					start={this.state.start}
					delta={this.state.delta}
					keywords={this.state.keywords}
					spritemap={this.spritemap}
				/>
				<SXSearchResultConainer
					key={this.state.searchContainerKey}
					namespace={this.namespace}
					formId={this.formId}
					searchContainerId={this.searchContainerId}
					checkbox={this.checkboxEnabled}
					checkAll={this.checkAllDataStructuresSelected()}
					index={true}
					columns={this.tableColumns}
					searchResults={this.searchedDataStructures}
					selectedResults={this.selectedDataStructures}
					spritemap={this.spritemap}
				/>
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
						header={this.dialogHeader}
						body={this.dialogBody}
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
