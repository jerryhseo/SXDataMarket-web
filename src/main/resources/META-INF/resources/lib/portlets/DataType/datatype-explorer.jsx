import React, { useState, useLayoutEffect, useContext, useRef, useCallback } from "react";
import {
	ActionKeys,
	LoadingStatus,
	PortletKeys,
	ResourceIds,
	WindowState,
	DisplayType,
	DisplayStyles,
	Event,
	Constant
} from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { Context } from "@clayui/modal";
import { openConfirmModal, SXErrorModal, SXLoadingModal, SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { Body, Cell, Head, Row, Table } from "@clayui/core";
import { ClayCheckbox, ClayInput } from "@clayui/form";
import { ClayDropDownWithItems } from "@clayui/drop-down";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { NotFound, UnderConstruction } from "../../stationx/common";
import Toolbar from "@clayui/toolbar";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { FilterOptions } from "../../stationx/search-container";
import SXActionDropdown from "../../stationx/dropdown";
import { SXFreezeIcon, SXLinkIcon, SXVerifyIcon } from "../../stationx/icon";
import SXBaseVisualizer, { Visualizer } from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";

class DataTypeExplorer extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataTypeExplorer constructor: ", props);

		this.dataCollectionId = this.params.dataCollectionId;
		this.dataSetId = this.params.dataSetId;

		this.checkboxEnabled =
			this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE);

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
		if (this.checkboxEnabled) {
			this.actionButtons.push({
				id: "deleteSelected",
				name: Util.translate("delete-selected"),
				symbol: "trash"
			});
		}

		this.actionMenus = [];

		this.searchResults = [];
		this.selectedResults = [];

		this.state = {
			displayStyle: this.params.displayStyle ?? this.displayStyles[0].value, //table
			filterBy: this.params.filterBy ?? this.filterOptions[0], //groupId
			loadingStatus: LoadingStatus.PENDING,
			confirmDeleteDialog: false,
			infoDialog: false,
			dlgHeader: <></>,
			dlgBody: <></>,
			errorMessage: "",
			start: this.params.start ?? 0,
			delta: this.params.delta ?? 10,
			keywords: this.params.keywords ?? "",
			searchContainerKey: Util.randomKey(),
			underConstruction: false
		};

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
			this.contentActionMenus.push({
				id: "editStructure",
				name: Util.translate("edit-datastructure"),
				symbol: "edit-layout"
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
				id: "datatype",
				name: Util.translate("datatype"),
				width: "auto"
			},
			{
				id: "version",
				name: Util.translate("version"),
				width: "5rem"
			},
			{
				id: "datatype-code",
				name: Util.translate("datatype-code"),
				width: "10rem"
			},
			{
				id: "datastructure",
				name: Util.translate("datastructure"),
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

	/***************************************************
	 * Listeners for events from ManagementToolbar and SearchResultsContainer.
	 ****************************************************/
	listenerSelectAll = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerSelectAll event rejected: ", dataPacket);
			return;
		}

		//console.log("listenerSelectAll: ", dataPacket);

		this.selectedResults = dataPacket.selectAll ? [...this.searchResults] : [];

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerSearchKeywordsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerSearchKeywordsChanged event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerSearchKeywordsChanged: ", dataPacket);

		this.setState({ keywords: dataPacket.keywords, underConstruction: true });

		// perform search here with ajax
	};

	listenerFilterMenuClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerFilterMenuClicked event rejected: ", dataPacket);
			return;
		}
		console.log("listenerFilterMenuClicked: ", dataPacket);

		const isFilterMenu = this.filterOptions.map((option) => option.value).includes(dataPacket.menuItem.value);

		this.setState({ filterBy: dataPacket.menuItem.value, underConstruction: true });
	};

	listenerAdvancedSearchButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerAdvancedSearchButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerAdvancedSearchButtonClicked: ", dataPacket);
		this.setState({ underConstruction: true });
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerPopActionClicked: ", dataPacket);

		const selectedDataTypeId = this.searchResults[dataPacket.data][0].value;

		switch (dataPacket.action) {
			case "update": {
				this.fireLoadPortlet({
					portletName: PortletKeys.DATATYPE_EDITOR,
					params: {
						dataTypeId: selectedDataTypeId
					}
				});

				break;
			}
			case "editStructure": {
				this.fireLoadPortlet({
					portletName: PortletKeys.DATASTRUCTURE_BUILDER,
					params: {
						dataTypeId: selectedDataTypeId
					}
				});

				break;
			}
			case "manageData": {
				this.fireLoadPortlet({
					portletName: PortletKeys.STRUCTURED_DATA_EXPLORER,
					params: {
						dataTypeId: selectedDataTypeId
					}
				});

				break;
			}
			case "delete": {
				this.state.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.state.dlgBody = Util.translate(
					"selected-datatypes-will-be-delete-with-datastructure-link-info-and-unrecoverable-are-you-sure-to-proceed"
				);

				this.selectedResults = [this.searchResults[dataPacket.data]];
				this.setState({ confirmDeleteDialog: true });
				break;
			}
		}
	};

	listenerAddButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerAddButtonClicked: ", dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.DATATYPE_EDITOR,
			portletState: Workbench.PortletState.NORMAL
		});
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataTypeExplorer] listenerDeleteSelected rejected: ", dataPacket);
			return;
		}
		//console.log("[DataTypeExplorer] listenerDeleteSelected: ", dataPacket);

		this.state.dlgHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.state.dlgBody = Util.translate(
			"selected-datatypes-will-be-delete-with-datastructure-link-info-and-unrecoverable-are-you-sure-to-proceed"
		);

		this.setState({ confirmDeleteDialog: true });
	};

	listenerSelectedResultsChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerSelectedResultsChanged event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerSelectedResultsChanged: ", dataPacket);
		this.selectedResults = dataPacket.selectedResults;

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeExplorer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeExplorer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: "searchDataTypes",
			params: this.params
		});
	};

	listenerLoadData = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeExplorer] listenerLoadData event rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeExplorer] listenerLoadData received: ", dataPacket);
		/*
		this.setState({
			loadingStatus: dataPacket.status,
			searchContainerKey: Util.randomKey()
		});
		*/
	};

	listenerResponce = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("listenerResponce event rejected: ", dataPacket);
			return;
		}

		console.log("listenerResponce received: ", dataPacket);
		let state = {};

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.searchDataTypes: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					this.convertSearchResultsToContent(dataPacket.data);
				}

				break;
			}
			case Workbench.RequestIDs.deleteDataTypes: {
				if (dataPacket.status === LoadingStatus.COMPLETE) {
					state.infoDialog = true;
					state.dlgHeader = SXModalUtil.successDlgHeader(this.spritemap);
					state.dlgBody = Util.translate("datatypes-deleted-successfully");

					this.fireRequest({
						requestId: Workbench.RequestIDs.searchDataTypes,
						params: this.params
					});

					this.setState(state);

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
			console.log("[DataTypeExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeExplorer] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.on(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.on(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.on(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.on(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.on(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.on(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_LOAD_DATA, this.listenerLoadData);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
		//this.search();
	}

	componentWillUnmount() {
		console.log("[DataTypeExplorer] componentWillUnmount");
		Event.off(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.off(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.off(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_LOAD_DATA, this.listenerLoadData);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	convertSearchResultsToContent(results) {
		this.searchResults = results.map((result, index) => {
			const { dataType, typeStructureLink } = result;

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

				if (Util.isNotEmpty(typeStructureLink)) {
					contentActionMenus.push({
						id: "manageData",
						name: Util.translate("manage-data"),
						symbol: "order-form-pencil"
					});
					contentActionMenus.push({
						name: Util.translate("advanced-search"),
						id: "advancedSearch",
						symbol: "search-experiences"
					});
					contentActionMenus.push({
						id: "editStructure",
						name: Util.translate("edit-datastructure"),
						symbol: "edit-layout"
					});
				}
			}

			let row = [
				{
					id: "dataTypeId",
					value: dataType.dataTypeId
				},
				{
					id: "displayName",
					value: dataType.displayName
				},
				{
					id: "dataTypeVersion",
					value: dataType.dataTypeVersion
				},
				{
					id: "dataTypeCode",
					value: dataType.dataTypeCode
				},
				{
					id: "structureStatus",
					value: (
						<>
							<span style={{ marginRight: "5px" }}>
								<SXLinkIcon linked={Util.isNotEmpty(typeStructureLink)} />
							</span>
							{Util.isNotEmpty(typeStructureLink) && (
								<span style={{ marginRight: "5px" }}>
									<SXVerifyIcon verified={typeStructureLink.verified} />
								</span>
							)}
							{Util.isNotEmpty(typeStructureLink) && (
								<span style={{ marginRight: "5px" }}>
									<SXFreezeIcon freezed={typeStructureLink.freezed} />
								</span>
							)}
						</>
					)
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

	selectedResultsToDataTypeIds = () => {
		return this.selectedResults.map((result) => result[0].value);
	};

	checkAllResultsSelected = () => {
		return this.searchResults.length == this.selectedResults.length;
	};

	deleteDataTypes = () => {
		this.state.loadingStatus = LoadingStatus.PENDING;

		console.log("Selected DataTypes: ", this.selectedResults, this.selectedResultsToDataTypeIds());
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataTypes,
			params: {
				dataTypeIds: JSON.stringify(this.selectedResultsToDataTypeIds())
			}
		});
	};

	render() {
		//console.log("DataTypeExplorer render: " + this.state.loadingStatus, this.state.keywords);
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <SXLoadingModal imageURL={this.imagePath + "/searching.gif"} />;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <SXErrorModal imageURL={this.imagePath + "/ajax-error.gif"} />;
		} else {
			return (
				<div>
					<SXManagementToolbar
						key={this.checkAllResultsSelected()}
						namespace={this.namespace}
						formId={this.formId}
						searchBar={true}
						addButton={true}
						displayStyleOptions={this.displayStyles}
						displayStyle={this.state.displayStyle}
						filterOptions={this.filterOptions}
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
							header={this.state.dlgHeader}
							body={this.state.dlgBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.deleteDataTypes();
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
					{this.state.infoDialog && (
						<SXModalDialog
							header={this.state.dlgHeader}
							body={this.state.dlgBody}
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

export default DataTypeExplorer;
