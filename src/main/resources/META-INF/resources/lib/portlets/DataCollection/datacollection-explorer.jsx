import React from 'react';
import { Util } from '../../stationx/util';
import { ActionKeys, Event, FilterOptions, PortletKeys, PortletState, RequestIDs } from '../../stationx/station-x';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import SXBaseVisualizer from '../../stationx/visualizer';
import { SXManagementToolbar, SXSearchResultConainer } from '../../stationx/search-container';
import { SXFreezeIcon } from '../../stationx/icon';

class DataCollectionExplorer extends SXBaseVisualizer {
  constructor(props) {
    super(props);

    //console.log("DataCollectionExplorer props: ", props, this.params);

    this.checkboxEnabled = this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE);

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
      keywords: this.params.keywords ?? '',
      searchContainerKey: Util.nowTime(),
      filterBy: this.params.filterBy ?? FilterOptions.GROUP_ID,
      infoDialog: false,
      confirmDeleteDialog: false,

      dialogHeader: <></>,
      dialogBody: <></>
    };

    this.searchedData = [];
    this.actionMenus = [];
    this.searchResults = [];

    this.dataCollectionIdsToBeDeleted = [];

    this.tableColumns = [
      { id: 'index', name: Util.translate('index'), width: '3.5rem' },
      {
        id: 'id',
        name: Util.translate('id'),
        width: '5rem'
      },
      {
        id: 'displayName',
        name: Util.translate('display-name'),
        width: 'auto'
      },
      {
        id: 'version',
        name: Util.translate('version'),
        width: '5rem'
      },
      {
        id: 'dataCollectionCode',
        name: Util.translate('code'),
        width: '10rem'
      },
      {
        id: 'status',
        name: Util.translate('status'),
        width: '6rem'
      }
    ];
    if (this.permissions.includes(ActionKeys.UPDATE)) {
      if (this.enableCheckbox) {
        this.tableColumns.unshift({ id: 'checkbox', name: '', width: '2.5rem' });
        this.tableColumns.push({
          id: 'actions',
          name: 'actions',
          width: '3.5rem'
        });
      }
    }
  }

  listenerSelectAll = (event) => {
    const { targetPortlet, targetFormId, selectAll } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataCollectionExplorer] listenerSelectAll event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataCollectionExplorer] listenerSelectAll: ", event.dataPacket);

    this.searchResults.forEach((result) => {
      result.checked = selectAll;
      return result;
    });

    this.forceUpdate();
  };

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (!(targetPortlet === this.namespace && targetFormId === this.formId)) {
      //console.log("[DataCollectionExplorer] listenerFieldValueChanged rejected: ", dataPacket);

      return;
    }

    //console.log("[DataCollectionExplorer] listenerFieldValueChanged received: ", dataPacket);
    this.forceUpdate();
  };

  listenerAddButtonClicked = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
      //console.log("[DataCollectionExplorer] listenerAddButtonClicked event rejected: ", dataPacket);
      return;
    }
    //console.log("[DataCollectionExplorer] listenerAddButtonClicked: ", dataPacket);

    this.fireLoadPortlet({
      portletName: PortletKeys.DATACOLLECTION_EDITOR,
      portletState: PortletState.NORMAL,
      title: Util.translate('create-datacollection')
    });
  };

  listenerPopActionClicked = (event) => {
    const { targetPortlet, targetFormId, action, data } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataCollectionExplorer] listenerPopActionClicked event rejected: ", targetPortlet, targetFormId);
      return;
    }

    //console.log("[DataCollectionExplorer] listenerPopActionClicked: ", action, data);

    const dataCollectionId = Number(this.searchResults[data].id);
    switch (action) {
      case 'update': {
        this.fireLoadPortlet({
          portletName: PortletKeys.DATACOLLECTION_EDITOR,
          params: {
            dataCollectionId: dataCollectionId
          }
        });

        break;
      }
      case 'delete': {
        this.dataCollectionIdsToBeDeleted = [dataCollectionId];

        this.setState({
          dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
          dialogBody: Util.translate(
            'datacollection-will-be-deleted-with-its-link-info-and-unrecoverable-are-you-sure-to-proceed'
          ),
          confirmDeleteDialog: true
        });

        break;
      }
    }
  };

  listenerSelectedResultsChanged = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataCollectionExplorer] listenerSelectedResultsChanged event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[DataCollectionExplorer] listenerSelectedResultsChanged: ", event.dataPacket);

    this.forceUpdate();
  };

  listenerDeleteSelected = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataCollectionExplorer] listenerDeleteSelected rejected: ",targetPortlet, targetFormId);
      return;
    }
    //console.log("[DataCollectionExplorer] listenerDeleteSelected: ");

    const selectedDataCollectionIds = this.selectedDataCollectionIds();
    if (Util.isEmpty(selectedDataCollectionIds)) {
      return;
    }

    this.setState({
      confirmDeleteDialog: true,
      dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
      dialogBody: Util.translate('this-is-not-recoverable-are-you-sure-to-proceed')
    });
  };

  listenerTableColumnClicked = (event) => {
    const { targetPortlet, row, column } = event.dataPacket;
    if (targetPortlet !== this.namespace) {
      return;
    }

    //console.log("[DataCollectionExplorer] SX_TABLE_COLUMN_CLICKED: ", event.dataPacket);

    if (row.id > 0) {
      Event.fire(Event.SX_DATACOLLECTION_SELECTED, this.namespace, this.workbenchNamespace, {
        dataCollectionId: row.id
      });
    }
  };

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataCollectionExplorer] listenerWorkbenchReady event rejected: ", targetPortlet);
      return;
    }

    //console.log("[DataCollectionExplorer] listenerWorkbenchReady received: ");

    this.fireRequest({
      requestId: RequestIDs.searchDataCollections,
      params: {
        filterBy: this.state.filterBy,
        groupId: this.groupId,
        userId: this.userId,
        status: 'all',
        start: this.state.start,
        delta: this.state.delta,
        keywords: this.state.keywords
      }
    });
  };

  listenerResponse = (event) => {
    const { targetPortlet, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataCollectionExplorer] listenerResponse event rejected: ", dataPacket);
      return;
    }

    console.log('[DataCollectionExplorer] listenerResponse received: ', requestId, params, data);

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
      case RequestIDs.searchDataCollections: {
        this.convertSearchResultsToContent(data);

        this.setState({
          searchContainerKey: Util.nowTime()
        });

        break;
      }
      case RequestIDs.deleteDataCollections: {
        const { deletedDataSetIds, failedDataSetIds, message } = data;

        this.fireRequest({
          requestId: RequestIDs.searchDataCollections,
          params: this.params
        });

        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
          dialogBody: message
        });

        break;
      }
    }
  };

  listenerLoadData = (event) => {
    const { targetPortlet, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataCollectionExplorer] listenerLoadData event rejected: ", targetPortlet);
      return;
    }

    console.log('[DataCollectionExplorer] listenerLoadData received: ', requestId, params, data);

    this.fireRequest({
      requestId: RequestIDs.searchDataCollections,
      params: params
    });
  };

  listenerComponentWillUnmount = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      //console.log("[DataCollectionExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
      return;
    }

    //console.log("[DataCollectionExplorer] listenerComponentWillUnmount received: ", dataPacket);
    this.componentWillUnmount();
  };

  componentDidMount() {
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.on(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnClicked);
    Event.on(Event.SX_SELECT_ALL, this.listenerSelectAll);
    Event.on(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
    Event.on(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
    Event.on(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
    Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);

    this.fireHandshake();
  }

  componentWillUnmount() {
    //console.log("[DataCollectionExplorer] componentWillUnmount");
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.off(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnClicked);
    Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
    Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
    Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
    Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
    Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
  }

  checkAllResultsSelected = () => {
    const selectedDataCollectionIds = this.selectedDataCollectionIds();

    return selectedDataCollectionIds.length == this.searchResults.length;
  };

  selectedDataCollectionIds = () => {
    return this.searchResults
      .filter((result) => result.checked)
      .map((result) => {
        return result.id;
      });
  };

  convertSearchResultsToContent(results) {
    this.searchedData = results;

    this.searchResults = results.map((dataCollection, index) => {
      const { dataCollectionId, dataCollectionCode, dataCollectionVersion, displayName } = dataCollection;

      const contentActionMenus = [];

      if (this.permissions.includes(ActionKeys.UPDATE)) {
        contentActionMenus.push({
          id: 'update',
          name: Util.translate('update'),
          symbol: 'pencil'
        });
        contentActionMenus.push({
          id: 'delete',
          name: Util.translate('delete'),
          symbol: 'trash'
        });
      }

      contentActionMenus.push({
        id: 'data',
        name: Util.translate('data'),
        symbol: 'polls'
      });

      let row = {
        id: dataCollectionId,
        index: index,
        checked: false,
        columns: [
          {
            id: 'dataCollectionId',
            value: dataCollectionId
          },
          {
            id: 'displayName',
            value: displayName
          },
          {
            id: 'dataCollectionVersion',
            value: dataCollectionVersion
          },
          {
            id: 'dataCollectionCode',
            value: dataCollectionCode
          },
          {
            id: 'status',
            value: <SXFreezeIcon freezed={true} />
          },
          {
            id: 'actions',
            value: contentActionMenus
          }
        ]
      };

      return row;
    });
  }

  deleteDataCollections = () => {
    const selectedDataCollectionIds = Util.isEmpty(this.dataCollectionIdsToBeDeleted)
      ? this.selectedDataCollectionIds()
      : this.dataCollectionIdsToBeDeleted;

    console.log(
      'Selected DataCollections: ',
      this.dataCollectionIdsToBeDeleted,
      this.selectedDataCollectionIds(),
      selectedDataCollectionIds
    );

    if (Util.isEmpty(selectedDataCollectionIds)) {
      return;
    }

    Event.fire(Event.SX_DELETE_DATACOLLECTIONS, this.namespace, this.workbenchNamespace, {
      dataCollectionIds: selectedDataCollectionIds
    });
  };

  handleProceedDeleting = (e) => {
    this.deleteDataCollections();
    this.setState({ confirmDeleteDialog: false });
  };

  handleCancelDeleting = (e) => {
    this.dataCollectionIdsToBeDeleted = [];
    this.setState({ confirmDeleteDialog: false });
  };

  handleCloseDialog = (e) => {
    this.setState({ infoDialog: false });
  };

  render() {
    console.log('DataCollectionExplorer render: ', this.state.loadingStatus);
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
            checkbox={this.enableCheckbox}
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
          checkbox={this.enableCheckbox}
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
                label: Util.translate('ok'),
                onClick: this.handleCloseDialog
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
                label: Util.translate('confirm'),
                onClick: this.handleProceedDeleting,
                displayType: 'secondary'
              },
              {
                label: Util.translate('cancel'),
                onClick: this.handleCancelDeleting
              }
            ]}
          />
        )}
      </div>
    );
  }
}

export default DataCollectionExplorer;
