import React from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import { ActionKeys, DisplayStyles, Event, LoadingStatus, PortletKeys } from "../../stationx/station-x";
import { SXManagementToolbar, SXSearchResultConainer } from "../../stationx/search-container";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { Util } from "../../stationx/util";
import { Workbench } from "../DataWorkbench/workbench";
import { SXCommentIcon, SXFreezeIcon, SXLinkIcon, SXVerifyIcon } from "../../stationx/icon";

class DataSetExplorer extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataSetExplorer props: ", props);
		this.dataCollectionId = props.dataCollectionId ?? 0;
		this.dataSetId = props.dataSetId ?? 0;

		this.dataSetList = [];

		this.availableDataTypeList = [];

		this.selectedDataSets = [];
		this.searchedDataSets = [];
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
				id: "dataset",
				name: Util.translate("dataset"),
				width: "auto"
			},
			{
				id: "version",
				name: Util.translate("version"),
				width: "5rem"
			},
			{
				id: "dataset-code",
				name: Util.translate("dataset-code"),
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

		this.infoDlgHeader = <></>;
		this.infoDlgBody = <></>;

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
	}

	listenerSelectAll = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataSetExplorer] listenerSelectAll event rejected: ", dataPacket);
			return;
		}

		console.log("[DataSetExplorer] listenerSelectAll: ", dataPacket);

		this.selectedDataSets = dataPacket.selectAll ? [...this.searchedDataSets] : [];

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			console.log("[DataSetExplorer] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		console.log("[DataSetExplorer] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerAddButtonClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataSetExplorer] listenerAddButtonClicked event rejected: ", dataPacket);
			return;
		}
		console.log("[DataSetExplorer] listenerAddButtonClicked: ", dataPacket);

		this.fireLoadPortlet({
			portletName: PortletKeys.DATASET_EDITOR,
			portletState: Workbench.PortletState.NORMAL,
			title: Util.translate("create-dataset"),
			params: {
				dataCollectionId: this.dataCollectionId
			}
		});
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			console.log("[DataSetExplorer] listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}

		const selectedDataSetId = this.searchedDataSets[dataPacket.data][0].value;
		console.log(
			"[DataSetExplorer] listenerPopActionClicked: ",
			dataPacket,
			this.searchedDataSets,
			selectedDataSetId
		);

		switch (dataPacket.action) {
			case "update": {
				this.fireLoadPortlet({
					portletName: PortletKeys.DATASET_EDITOR,
					params: {
						dataCollectionId: this.dataCollectionId,
						dataSetId: selectedDataSetId
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
			console.log("[DataSetExplorer] listenerSelectedResultsChanged event rejected: ", dataPacket);
			return;
		}
		console.log("[DataSetExplorer] listenerSelectedResultsChanged: ", dataPacket);
		this.selectedDataSets = dataPacket.selectedResults;

		this.setState({ searchContainerKey: Util.randomKey() });
	};

	listenerDeleteSelected = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
			//console.log("[DataSetExplorer] listenerDeleteSelected rejected: ", dataPacket);
			return;
		}
		console.log("[DataSetExplorer] listenerDeleteSelected: ", dataPacket);

		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataSetExplorer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[DataSetExplorer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.searchDataSets,
			params: {
				dataCollectionId: this.dataCollectionId,
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
			console.log("[DataSetExplorer] listenerResponse rejected: ", dataPacket);
			return;
		}

		console.log("[DataSetExplorer] listenerResponse received: ", dataPacket);

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.searchDataSets: {
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
			console.log("[DataSetExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataSetExplorer] listenerComponentWillUnmount received: ", dataPacket);
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
		console.log("[DataSetExplorer] componentWillUnmount");
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

	checkAllDataSetsSelected = () => {
		return this.selectedDataSets.length > 0 && this.searchedDataSets.length == this.selectedDataSets.length;
	};

	convertSearchResultsToContent(results) {
		this.searchedDataSets = results.map((dataSet, index) => {
			const {
				dataCollectionId = 0,
				dataSetId,
				dataSetCode,
				dataSetVersion,
				displayName,
				verified = false,
				freezed = false,
				commentCount
			} = dataSet;

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
					id: "dataSetId",
					value: dataSetId
				},
				{
					id: "displayName",
					value: displayName[this.languageId]
				},
				{
					id: "dataSetVersion",
					value: dataSetVersion
				},
				{
					id: "dataSetCode",
					value: dataSetCode
				},
				{
					id: "status",
					value: (
						<>
							<span style={{ marginRight: "5px" }}>
								<SXCommentIcon commentCount={dataSet.commentCount}></SXCommentIcon>
							</span>
							<span style={{ marginRight: "5px" }}>
								<SXVerifyIcon verified={verified} />
							</span>
							<span style={{ marginRight: "5px" }}>
								<SXFreezeIcon freezed={freezed} />
							</span>
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

		this.selectedDataSets = [];
	}

	deleteDataSets = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataSets,
			params: {
				dataSetIds: this.selectedDataSets
			}
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
					key={this.checkAllDataSetsSelected()}
					namespace={this.namespace}
					formId={this.formId}
					searchBar={true}
					addButton={true}
					actionButtons={this.actionButtons}
					actionMenus={this.actionMenus}
					checkbox={this.checkboxEnabled}
					checkboxChecked={this.checkAllDataSetsSelected()}
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
					checkAll={this.checkAllDataSetsSelected()}
					index={true}
					columns={this.tableColumns}
					searchResults={this.searchedDataSets}
					selectedResults={this.selectedDataSets}
					spritemap={this.spritemap}
				/>
				{this.state.infoDialog && (
					<SXModalDialog
						header={this.infoDlgHeader}
						body={this.infoDlgBody}
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
									this.deleteDataSets();
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

export default DataSetExplorer;
