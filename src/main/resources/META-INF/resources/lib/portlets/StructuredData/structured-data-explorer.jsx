import React from "react";
import { ActionKeys, Event, LoadingStatus, PortletKeys, ResourceIds, WindowState } from "../../stationx/station-x";
import { SXErrorModal, SXLoadingModal, SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { Util } from "../../stationx/util";
import Breadcrumb from "@clayui/breadcrumb";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";
import { Text } from "@clayui/core";
import { SXFreezeIcon, SXVerifyIcon } from "../../stationx/icon";
import StructuredDataEditor from "./structured-data-editor";

class StructuredDataExplorer extends SXBaseVisualizer {
	dataCollection = {};
	dataSet = {};
	dataType = {};

	constructor(props) {
		super(props);

		//console.log("StructuredDataExplorer props: ", props);

		this.checkbox =
			this.params.checkbox ??
			(this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE));
		this.addButton = this.params.enableAddButton ?? true;
		this.breadcrumb = this.params.breadcrumb ?? false;

		this.displayStyles = [
			{
				name: "Table",
				id: "table",
				symbol: "table"
			},
			{
				name: "List",
				id: "list",
				symbol: "list"
			},
			{
				name: "Card",
				id: "card",
				symbol: "cards2"
			}
		];

		this.filterOptions = [
			{
				name: Util.translate("group"),
				id: "groupId"
			},
			{
				name: Util.translate("user"),
				id: "userId"
			},
			{
				name: Util.translate("mine"),
				id: "mine"
			},
			{
				name: Util.translate("status"),
				id: "status"
			}
		];

		this.actionButtons = [];
		if (this.checkbox) {
			this.actionButtons.push({
				id: "deleteSelected",
				name: Util.translate("delete-selected"),
				symbol: "trash"
			});
		}

		this.actionButtons.push({
			id: "advancedSearch",
			name: Util.translate("advanced-search"),
			symbol: "search-experiences"
		});

		this.actionMenus = [];

		this.searchedResults = [];
		this.tableRows = [];
		this.selectedRows = [];

		this.dialogHeader = <></>;
		this.dialogBody = <></>;
		this.state = {
			dataCollectionId: this.params.dataCollectionId,
			dataSetId: this.params.dataSetId,
			dataTypeId: this.params.dataTypeId,
			displayStyle: props.displayStyle ?? this.displayStyles[0].value, //table
			filterBy: props.filterBy ?? this.filterOptions[0], //groupId
			viewMode: "table",
			loadingStatus: LoadingStatus.PENDING,
			confirmDeleteDialog: false,
			noticeDialog: false,
			errorMessage: "",
			progressDialog: false,
			start: props.start ?? 0,
			delta: props.delta ?? 10,
			keywords: props.keywords ?? "",
			searchContainerKey: Util.randomKey(),
			underConstruction: false
		};

		if (this.state.dataTypeId > 0) {
			this.scope = "dataType";
		} else if (this.state.dataSetId > 0) {
			this.scope = "dataSet";
		} else if (this.state.dataCollectionId > 0) {
			this.scope = "dataCollection";
		}

		this.contentActionMenus = [];

		if (this.permissions.includes(ActionKeys.UPDATE)) {
			this.contentActionMenus = [
				{
					id: "update",
					name: Util.translate("update"),
					symbol: "pencil"
				},
				{
					id: "delete",
					name: Util.translate("delete"),
					symbol: "trash"
				}
			];
		}

		this.contentActionMenus.push({
			id: "dataStatus",
			name: Util.translate("data-status"),
			symbol: "polls"
		});

		this.dataTableColumns = [
			{ id: "index", name: Util.translate("index"), width: "4rem" },
			{
				id: "id",
				name: Util.translate("id"),
				width: "5.5rem"
			}
		];

		if (this.scope === "dataSet") {
			this.dataTableColumns.push({
				id: "dataTypeId",
				name: Util.translate("datatype"),
				width: "8rem"
			});
		} else if (this.scope === "dataCollection") {
			this.dataTableColumns.push({
				id: "dataSetId",
				name: Util.translate("dataset"),
				width: "8rem"
			});
			this.dataTableColumns.push({
				id: "dataTypeId",
				name: Util.translate("datatype"),
				width: "8rem"
			});
		}

		this.dataTableColumns.push({
			id: "content",
			name: Util.translate("content"),
			width: "auto"
		});

		this.dataTableColumns.push({
			id: "status",
			name: Util.translate("status"),
			width: "4.5rem"
		});

		this.dataTableColumns.push({
			id: "actions",
			name: "actions",
			width: "3.0rem"
		});

		this.scopeTableColumns = [];

		if (this.permissions.includes(ActionKeys.UPDATE)) {
			this.dataTableColumns.unshift({ id: "checkbox", name: "", width: "2.5rem" });
		}
	}

	/***************************************************
	 * Listeners for events from ManagementToolbar and SearchResultsContainer.
	 ****************************************************/
	listenerSelectAll = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("listenerSelectAll event rejected: ", dataPacket);
			return;
		}

		//console.log("listenerSelectAll: ", dataPacket);

		this.selectedRows = dataPacket.selectAll ? [...this.tableRows] : [];

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerSearchKeywordsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("listenerSearchKeywordsChanged event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerSearchKeywordsChanged: ", dataPacket);

		this.setState({ keywords: dataPacket.keywords, underConstruction: true });

		// perform search here with ajax
	};

	listenerFilterMenuClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("listenerFilterMenuClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerFilterMenuClicked: ", dataPacket);

		const isFilterMenu = this.filterOptions.map((option) => option.value).includes(dataPacket.menuItem.value);

		this.setState({ filterBy: dataPacket.menuItem.value, underConstruction: true });
	};

	listenerAdvancedSearchButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("listenerAdvancedSearchButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerAdvancedSearchButtonClicked: ", dataPacket);
		this.setState({ underConstruction: true });
	};

	listenerPopActionClicked = (event) => {
		const { targetPortlet, targetFormId, action, data } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("listenerPopActionClicked event rejected: ", this.formId, event.dataPacket);
			return;
		}
		//console.log("listenerPopActionClicked: ", event.dataPacket);

		//console.log("selectedData: ", action, data, this.selectedRows);

		switch (action) {
			case "update": {
				const selectedData = this.searchResults.structuredDataList[data];

				this.redirectTo({
					portletName: PortletKeys.STRUCTURED_DATA_EDITOR,
					params: {
						editState: StructuredDataEditor.EditState.UPDATE,
						structuredDataId: selectedData.structuredDataId,
						titleBar: true,
						buttons: true
					}
				});

				break;
			}
			case "delete": {
				this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.dialogBody = Util.translate(
					"selected-data-will-be-deleted-and-unrecoverable-are-you-sure-to-proceed"
				);

				this.selectedRows = [this.tableRows[data]];
				this.setState({ confirmDeleteDialog: true });
				break;
			}
			case "dataStatus": {
				break;
			}
		}
	};

	listenerAddButtonClicked = (event) => {
		const { targetPortlet, targetFormId } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("listenerAddButtonClicked event rejected: ", event.dataPacket);
			return;
		}
		//console.log("[StructuredDataExplorer listenerAddButtonClicked]: ", event.dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.STRUCTURED_DATA_EDITOR,
			params: {
				editState: StructuredDataEditor.EditState.ADD,
				dataCollectionId: this.state.dataCollectionId,
				dataSetId: this.state.dataSetId,
				dataTypeId: this.state.dataTypeId,
				titleBar: true,
				buttons: true
			}
		});
		/*
		Util.redirectTo(
			this.workbenchURL,
			{
				namespace: this.workbenchNamespace,
				portletId: this.workbenchId,
				windowState: WindowState.NORMAL
			},
			{
				workingPortletName: PortletKeys.STRUCTURED_DATA_EDITOR,
				workingPortletParams: JSON.stringify({
					dataCollectionId: this.state.dataCollectionId,
					dataSetId: this.state.dataSetId,
					dataTypeId: this.state.dataTypeId
				})
			}
		);
		*/
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerAddButtonClicked: ", dataPacket);

		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("selected-data-will-be-deleted-and-unrecoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	listenerSelectedResultsChanged = (event) => {
		const { targetPortlet, targetFormId, selectedResults } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[StructuredDataExplorer] listenerSelectedResultsChanged event rejected: ", event.dataPacket);
			return;
		}
		//console.log("[StructuredDataExplorer] listenerSelectedResultsChanged: ", event.dataPacket);
		this.selectedRows = selectedResults;

		this.forceUpdate();
		//this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerTableColumnSelected = (event) => {
		const { targetPortlet, targetFormId, column, row } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			//console.log("[StructuredDataExplorer] listenerTableColumnSelected event rejected: ", event.dataPacket);
			return;
		}
		//console.log("[StructuredDataExplorer] listenerTableColumnSelected: ", event.dataPacket, row, column);

		switch (column.id) {
			case "checkbox": {
				break;
			}
			case "structuredDataId": {
				break;
			}
			case "dataSetId": {
				break;
			}
			case "dataTypeId": {
				break;
			}
			case "content": {
				break;
			}
			case "status": {
				break;
			}
			default: {
				break;
			}
		}
	};

	listenerResponse = (event) => {
		const { targetPortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataExplorer] listenerResponse event rejected: ", targetPortlet, requestId);
			return;
		}

		//console.log("[StructuredDataExplorer] listenerResponse received: ", targetPortlet, requestId, params, data);

		switch (requestId) {
			case Workbench.RequestIDs.searchStructuredData: {
				this.searchResults = data;

				this.convertSearchResultsToContent(data);

				this.dataCollection = data.dataCollection;
				this.dataSet = data.dataSet ?? {};
				this.dataType = data.dataSet ?? {};

				break;
			}
			case Workbench.RequestIDs.deleteStructuredData: {
				this.dialogHeader = SXModalUtil.successDlgHeader();
				this.dialogBody = Util.translate("data-is-deleted-successfully");

				this.setState({ noticeDialog: true });

				this.resetSearchResults();

				break;
			}
		}

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerWorkbenchReady = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataExplorer] listenerWorkbenchReady event rejected: ", event.dataPacket);
			return;
		}

		//console.log("[StructuredDataExplorer] listenerWorkbenchReady received: ", event.dataPacket);

		if (this.state.dataCollectionId > 0) {
			this.fireRequest({
				requestId: Workbench.RequestIDs.searchStructuredData,
				params: {
					dataCollectionId: this.state.dataCollectionId,
					dataSetId: this.state.dataSetId,
					dataTypeId: this.state.dataTypeId
				}
			});
		} else {
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
		}

		this.setState({ loadingStatus: LoadingStatus.COMPLETE });
	};

	listenerComponentWillUnmount = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataExplorer] listenerComponentWillUnmount rejected: ", event.dataPacket);
			return;
		}

		//console.log("[StructuredDataExplorer] listenerComponentWillUnmount received: ", event.dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.on(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.on(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.on(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.on(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.on(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.on(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnSelected);
		Event.on(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);

		this.fireHandshake();
	}

	componentWillUnmount() {
		//console.log("[StructuredDataExplorer] componentWillUnmount");
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.off(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.off(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnSelected);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
	}

	convertSearchResultsToContent(results) {
		const { dataCollection, dataSet, dataType, structuredDataList } = results;

		//console.log("[StructuredDataExplorer convertSearchResultsToContent] ", this.scope, results, structuredDataList);

		this.tableRows = structuredDataList.map((result, index) => {
			const { data, verified, freezed, modifiedDate } = result;

			let row = [
				{
					id: "structuredDataId",
					value: result.structuredDataId
				}
			];

			if (this.scope === "dataCollection") {
				row.push({
					id: "dataSet",
					value: (
						<Text
							size={3}
							truncate
						>
							{result.dataSetLabel}
						</Text>
					)
				});
				row.push({
					id: "dataType",
					value: (
						<Text
							size={3}
							truncate
						>
							{result.dataTypeLabel}
						</Text>
					)
				});
			} else if (this.scope === "dataSet") {
				row.push({
					id: "dataType",
					value: (
						<Text
							size={3}
							truncate
						>
							{result.dataTypeLabel}
						</Text>
					)
				});
			}

			row.push({
				id: "content",
				value: (
					<Text
						size={3}
						truncate
					>
						{JSON.stringify(data)}
					</Text>
				)
			});
			row.push({
				id: "status",
				value: (
					<>
						<span style={{ marginRight: "5px" }}>
							<SXVerifyIcon verified={result.verified} />
						</span>
						<span style={{ marginRight: "5px" }}>
							<SXFreezeIcon freezed={result.freezed} />
						</span>
					</>
				)
			});
			row.push({
				id: "actions",
				value: this.contentActionMenus
			});

			return row;
		});

		this.selectedRows = [];
	}

	removeSearchResults(structuredDataId) {
		this.searchedResults = this.searchedResults.filter((result) => result.structuredDataId !== structuredDataId);
	}

	selectedRowsToDataIds = () => {
		return this.selectedRows.map((result) => result[0].value);
	};

	checkAllResultsSelected = () => {
		return this.tableRows.length == this.selectedRows.length;
	};

	resetSearchResults() {
		this.tableRows = this.tableRows.filter((result) => !this.selectedRows.includes(result));
		this.selectedRows = [];
	}

	handleDeleteSelectedData = () => {
		const dataIds = this.selectedRowsToDataIds();

		Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
			requestId: Workbench.RequestIDs.deleteStructuredData,
			params: {
				structuredDataIdList: dataIds
			}
		});
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <SXLoadingModal imageURL={this.imagePath + "/searching.gif"} />;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <SXErrorModal imageURL={this.imagePath + "/ajax-error.gif"} />;
		} else {
			//console.log("SXInstanceInfo.render: ", this.dataType);
			return (
				<div>
					{(this.state.dataCollectionId > 0 || this.state.dataSetId > 0 || this.state.dataTypeId > 0) && (
						<>
							{this.breadcrumb && (
								<Breadcrumb
									items={[]}
									style={{ display: "flex" }}
									spritemap={this.spritemap}
								/>
							)}
							<SXManagementToolbar
								key={this.checkAllResultsSelected()}
								namespace={this.namespace}
								formId={this.formId}
								searchBar={true}
								addButton={this.state.dataTypeId > 0}
								displayStyleOptions={this.displayStyles}
								displayStyle={this.state.displayStyle}
								filterOptions={this.filterOptions}
								filterBy={this.state.filterBy}
								actionButtons={this.actionButtons}
								actionMenus={this.actionMenus}
								checkbox={this.checkbox}
								checkboxChecked={this.checkAllResultsSelected()}
								start={this.state.start}
								delta={this.state.delta}
								keywords={this.state.keywords}
								spritemap={this.spritemap}
							/>
						</>
					)}
					<SXSearchResultConainer
						key={this.state.searchContainerKey}
						namespace={this.namespace}
						formId={this.formId}
						checkbox={this.checkbox}
						checkAll={this.checkAllResultsSelected()}
						index={true}
						columns={this.dataTableColumns}
						searchResults={this.tableRows}
						selectedResults={this.selectedRows}
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
										this.handleDeleteSelectedData();
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
					{this.state.noticeDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: (e) => {
										this.setState({ noticeDialog: false });
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

export default StructuredDataExplorer;
