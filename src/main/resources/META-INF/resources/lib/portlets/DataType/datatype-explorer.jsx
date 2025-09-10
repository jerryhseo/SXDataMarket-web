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

class DataTypeExplorer extends React.Component {
	constructor(props) {
		super(props);

		console.log("DataTypeExplorer constructor: ", props);
		this.namespace = props.namespace;
		this.baseRenderURL = props.baseRenderURL;
		this.baseResourceURL = props.baseResourceURL;
		this.permissions = props.permissions;
		this.spritemap = props.spritemapPath;
		this.imagePath = props.imagePath;
		this.groupId = props.groupId;
		this.userId = props.userId;

		this.redirectURLs = props.redirectURLs;
		this.workbench = props.workbench;
		this.params = props.params;

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

		this.confirmDialogHeader = <></>;
		this.confirmDialogBody = <></>;
		this.state = {
			displayStyle: this.params.displayStyle ?? this.displayStyles[0].value, //table
			filterBy: this.params.filterBy ?? this.filterOptions[0], //groupId
			loadingStatus: LoadingStatus.PENDING,
			confirmDeleteDialog: false,
			errorMessage: "",
			progressDialog: false,
			start: this.params.start ?? 0,
			delta: this.params.delta ?? 10,
			keywords: this.params.keywords ?? "",
			searchContainerKey: Util.randomKey(),
			underConstruction: false
		};

		this.formId = this.namespace + "dataTypeExplorer";

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
			{ id: "index", name: Util.translate("index"), width: "5rem" },
			{
				id: "id",
				name: Util.translate("id"),
				width: "8rem"
			},
			{
				id: "datatype",
				name: Util.translate("datatype"),
				width: "auto"
			},
			{
				id: "version",
				name: Util.translate("version"),
				width: "8rem"
			},
			{
				id: "datatype-code",
				name: Util.translate("datatype-code"),
				width: "15rem"
			},
			{
				id: "datastructure",
				name: Util.translate("datastructure"),
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
				Util.redirectTo(
					this.workbench.url,
					{
						namespace: this.workbench.namespace,
						portletId: this.workbench.portletId,
						windowState: WindowState.NORMAL
					},
					{
						workingPortletName: PortletKeys.DATATYPE_EDITOR,
						workingPortletParams: JSON.stringify({
							dataTypeId: selectedDataTypeId
						})
					}
				);

				break;
			}
			case "editStructure": {
				Util.redirectTo(
					this.workbench.url,
					{
						namespace: this.workbench.namespace,
						portletId: this.workbench.portletId,
						windowState: WindowState.NORMAL
					},
					{
						workingPortletName: PortletKeys.DATASTRUCTURE_BUILDER,
						workingPortletParams: JSON.stringify({
							dataTypeId: selectedDataTypeId
						})
					}
				);

				break;
			}
			case "delete": {
				this.confirmDialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.confirmDialogBody = Util.translate(
					"selected-datatype-will-be-delete-with-datastructure-link-info-and-unrecoverable-are-you-sure-to-proceed"
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

		Util.redirectTo(
			this.workbench.url,
			{
				namespace: this.workbench.namespace,
				portletId: this.workbench.portletId,
				windowState: WindowState.NORMAL
			},
			{
				workingPortletName: PortletKeys.DATATYPE_EDITOR
			}
		);
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		//console.log("listenerAddButtonClicked: ", dataPacket);

		this.confirmDialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.confirmDialogBody = Util.translate(
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

	componentDidMount() {
		Event.on(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.on(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.on(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.on(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.on(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.on(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.on(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);

		this.search();
	}

	componentWillUnmount() {
		Event.off(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
		Event.off(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
		Event.off(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
		Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
		Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
		Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
		Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
	}

	search() {
		this.state.loadingStatus = LoadingStatus.PENDING;

		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.SEARCH_DATATYPES,
			params: {
				filterBy: this.state.filterBy,
				keywords: this.state.keywords,
				start: this.state.start,
				delta: this.state.delta
			},
			successFunc: (result) => {
				this.convertSearchResultsToContent(result);

				//console.log("search results: ", result);

				this.setState({
					loadingStatus: LoadingStatus.COMPLETE,
					searchContainerKey: Util.randomKey()
				});
			},
			errorFunc: (e) => {
				this.setState({
					errorMessage: "Something wrong while searching data types",
					loadingStatus: LoadingStatus.FAIL
				});
			}
		});
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
						id: "editStructure",
						name: Util.translate("edit-datastructure"),
						symbol: "edit-layout"
					});
				}
			}

			contentActionMenus.push({
				name: Util.translate("advanced-search"),
				id: "advancedSearch",
				symbol: "search-experiences"
			});

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

		Util.ajax({
			namespace: this.namespace,
			baseResourceURL: this.baseResourceURL,
			resourceId: ResourceIds.DELETE_DATATYPES,
			params: {
				dataTypeIds: JSON.stringify(this.selectedResultsToDataTypeIds())
			},
			successFunc: (result) => {
				this.search();
			},
			errorFunc: (err) => {
				this.setState({ loadingStatus: LoadingStatus.FAIL });
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
							header={this.confirmDialogHeader}
							body={this.confirmDialogBody}
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
