import React, { useState, useLayoutEffect, useContext, useRef, useCallback } from 'react';
import { ActionKeys, LoadingStatus, PortletKeys, Event, RequestIDs, PortletState } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import { SXErrorModal, SXLoadingModal, SXModalDialog, SXModalUtil } from '../../stationx/modal';
import { UnderConstruction } from '../../stationx/common';
import { SXManagementToolbar, SXSearchResultConainer } from '../../stationx/search-container';
import { SXCommentIcon, SXFreezeIcon, SXLinkIcon, SXVerifyIcon } from '../../stationx/icon';
import SXBaseVisualizer from '../../stationx/visualizer';

class DataTypeExplorer extends SXBaseVisualizer {
  constructor(props) {
    super(props);

    //console.log("DataTypeExplorer constructor: ", props);

    this.dataCollectionId = this.params.dataCollectionId;
    this.dataSetId = this.params.dataSetId;

    this.checkboxEnabled = this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE);

    this.displayStyles = [
      {
        name: 'Table',
        id: 'table',
        symbol: 'table'
      },
      {
        name: 'List',
        id: 'list',
        symbol: 'list'
      },
      {
        name: 'Card',
        id: 'card',
        symbol: 'cards2'
      }
    ];

    this.filterOptions = [
      {
        name: Util.translate('group'),
        id: 'groupId'
      },
      {
        name: Util.translate('user'),
        id: 'userId'
      },
      {
        name: Util.translate('mine'),
        id: 'mine'
      },
      {
        name: Util.translate('status'),
        id: 'status'
      }
    ];

    this.actionButtons = [];
    if (this.checkboxEnabled) {
      this.actionButtons.push({
        id: 'deleteSelected',
        name: Util.translate('delete-selected'),
        symbol: 'trash'
      });
    }

    this.actionMenus = [];

    this.searchResults = [];

    this.state = {
      displayStyle: this.params.displayStyle ?? this.displayStyles[0].value, //table
      filterBy: this.params.filterBy ?? this.filterOptions[0], //groupId
      loadingStatus: LoadingStatus.PENDING,
      confirmDeleteDialog: false,
      dataTypeIdsToBeDeleted: [],
      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      errorMessage: '',
      start: this.params.start ?? 0,
      delta: this.params.delta ?? 10,
      keywords: this.params.keywords ?? '',
      searchContainerKey: Util.nowTime(),
      underConstruction: false
    };

    this.contentActionMenus = [];

    if (this.permissions.includes(ActionKeys.UPDATE)) {
      this.contentActionMenus.push({
        id: 'update',
        name: Util.translate('update'),
        symbol: 'pencil'
      });
      this.contentActionMenus.push({
        id: 'delete',
        name: Util.translate('delete'),
        symbol: 'trash'
      });
      this.contentActionMenus.push({
        id: 'editStructure',
        name: Util.translate('edit-datastructure'),
        symbol: 'edit-layout'
      });
    }

    this.contentActionMenus.push({
      name: Util.translate('advanced-search'),
      id: 'advancedSearch',
      symbol: 'search-experiences'
    });

    this.tableColumns = [
      { id: 'index', name: Util.translate('index'), width: '3.5rem' },
      {
        id: 'id',
        name: Util.translate('id'),
        width: '5rem'
      },
      {
        id: 'datatype',
        name: Util.translate('datatype'),
        width: 'auto'
      },
      {
        id: 'version',
        name: Util.translate('version'),
        width: '5rem'
      },
      {
        id: 'datatype-code',
        name: Util.translate('datatype-code'),
        width: '10rem'
      },
      {
        id: 'datastructure',
        name: Util.translate('datastructure'),
        width: '3rem'
      },
      {
        id: 'staus',
        name: Util.translate('status'),
        width: '6rem'
      },
      {
        id: 'actions',
        name: 'actions',
        width: '3.5rem'
      }
    ];
    if (this.permissions.includes(ActionKeys.UPDATE)) {
      this.tableColumns.unshift({ id: 'checkbox', name: '', width: '2.5rem' });
    }
  }

  /***************************************************
   * Listeners for events from ManagementToolbar and SearchResultsContainer.
   ****************************************************/
  listenerSelectAll = (event) => {
    const { targetPortlet, targetFormId, selectAll } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerSelectAll event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataTypeExplorer] listenerSelectAll: ", event.dataPacket);

    this.searchResults.forEach((result) => {
      result.checked = selectAll;
      return result;
    });

    this.forceUpdate();
  };

  listenerSearchKeywordsChanged = (event) => {
    const { targetPortlet, targetFormId, keywords } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerSearchKeywordsChanged event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[DataTypeExplorer] listenerSearchKeywordsChanged: ", event.dataPacket);

    this.setState({ keywords: keywords, underConstruction: true });

    // perform search here with ajax
  };

  listenerFilterMenuClicked = (event) => {
    const { targetPortlet, targetFormId, menuItem } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerFilterMenuClicked event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[DataTypeExplorer] listenerFilterMenuClicked: ", event.dataPacket);

    const isFilterMenu = this.filterOptions.map((option) => option.value).includes(menuItem.value);

    this.setState({ filterBy: menuItem.value, underConstruction: true });
  };

  listenerAdvancedSearchButtonClicked = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerAdvancedSearchButtonClicked event rejected: ", dataPacket);
      return;
    }
    //console.log("[DataTypeExplorer] listenerAdvancedSearchButtonClicked: ", dataPacket);
    this.setState({ underConstruction: true });
  };

  listenerPopActionClicked = (event) => {
    const { targetPortlet, targetFormId, action, data } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerPopActionClicked event rejected: ", targetPortlet, targetFormId);
      return;
    }
    //console.log("[DataTypeExplorer] listenerPopActionClicked: ", action, data);

    const selectedDataTypeId = this.searchResults[data].id;

    switch (action) {
      case 'update': {
        this.fireLoadPortlet({
          portletName: PortletKeys.DATATYPE_EDITOR,
          params: {
            dataTypeId: selectedDataTypeId
          }
        });

        break;
      }
      case 'editStructure': {
        this.fireLoadPortlet({
          portletName: PortletKeys.DATASTRUCTURE_BUILDER,
          params: {
            dataTypeId: selectedDataTypeId
          }
        });

        break;
      }
      case 'manageData': {
        this.fireLoadPortlet({
          portletName: PortletKeys.STRUCTURED_DATA_EXPLORER,
          params: {
            dataTypeId: selectedDataTypeId
          }
        });

        break;
      }
      case 'delete': {
        this.setState({
          dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
          dialogBody: Util.translate('datatype-will-be-deleted-and-unrecoverable-are-you-sure-to-proceed'),
          dataTypeIdsToBeDeleted: [selectedDataTypeId],
          confirmDeleteDialog: true
        });
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
    //console.log("listenerAddButtonClicked: ", event.dataPacket);

    this.fireLoadPortlet({
      portletName: PortletKeys.DATATYPE_EDITOR,
      portletState: PortletState.NORMAL
    });
  };

  listenerDeleteSelected = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerDeleteSelected rejected: ", event.dataPacket);
      return;
    }
    //console.log("[DataTypeExplorer] listenerDeleteSelected: ", event.dataPacket);

    this.setState({
      confirmDeleteDialog: true,
      dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
      dialogBody: Util.translate(
        'selected-datatypes-will-be-delete-with-datastructure-link-info-and-unrecoverable-are-you-sure-to-proceed'
      )
    });
  };

  listenerSelectedResultsChanged = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerSelectedResultsChanged event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[DataTypeExplorer] listenerSelectedResultsChanged: ", event.dataPacket);
    this.forceUpdate();
  };

  listenerTableColumnClicked = (event) => {
    const { targetPortlet, targetFormId, rowIndex, row, column } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[DataTypeExplorer] listenerTableColumnClicked event rejected: ", targetPortlet, targetFormId);
      return;
    }
    //console.log("[DataTypeExplorer] listenerTableColumnClicked: ", rowIndex, row, column);

    const clickedResult = this.searchResults[rowIndex];

    //console.log("Selected search result: ", clickedResult);

    if (!clickedResult.checked) {
      clickedResult.checked = true;
      this.forceUpdate();
    }
  };

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataTypeExplorer] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataTypeExplorer] listenerWorkbenchReady received: ", event.dataPacket);

    this.fireRequest({
      requestId: 'searchDataTypes',
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        start: this.state.start,
        delta: this.state.delta,
        filterBy: this.state.filterBy
      }
    });
  };

  listenerResponse = (event) => {
    const { targetPortlet, targetFormId, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataTypeExplorer] listenerResponse event rejected: ", dataPacket);
      return;
    }

    //console.log("[DataTypeExplorer] listenerResponse received: ", requestId, params, data);

    if (data.error) {
      const dialogBody = data.errorObject ? data.error + ': ' + JSON.stringify(data.errorObject) : data.error;

      this.setState({
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: dialogBody,
        infoDialog: true
      });

      return;
    }

    switch (requestId) {
      case RequestIDs.searchDataTypes: {
        const { dataTypeList } = data;

        this.convertSearchResultsToContent(dataTypeList);

        break;
      }
      case RequestIDs.deleteDataTypes: {
        const { dataTypeList } = data;

        this.setState({
          dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
          dialogBody: Util.translate('datatypes-deleted-successfully', JSON.stringify(dataTypeList)),
          infoDialog: true
        });

        this.searchResults = [];

        this.fireRequest({
          requestId: RequestIDs.searchDataTypes,
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
      //console.log("[DataTypeExplorer] listenerComponentWillUnmount rejected: ", dataPacket);
      return;
    }

    //console.log("[DataTypeExplorer] listenerComponentWillUnmount received: ", dataPacket);
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
    Event.on(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnClicked);
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_LOAD_DATA, this.listenerLoadData);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

    this.fireHandshake();
    //this.search();
  }

  componentWillUnmount() {
    //console.log("[DataTypeExplorer] componentWillUnmount");
    Event.off(Event.SX_SEARCH_KEYWORDS_CHANGED, this.listenerSearchKeywordsChanged);
    Event.off(Event.SX_FILTER_MENU_CLICKED, this.listenerFilterMenuClicked);
    Event.off(Event.SX_ADVANCED_SEARCH_BUTTON_CLICKED, this.listenerAdvancedSearchButtonClicked);
    Event.off(Event.SX_SELECT_ALL, this.listenerSelectAll);
    Event.off(Event.SX_DELETE_SELECTED, this.listenerDeleteSelected);
    Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
    Event.off(Event.SX_SELECTED_RESULTS_CHANGED, this.listenerSelectedResultsChanged);
    Event.off(Event.SX_ADD_BUTTON_CLICKED, this.listenerAddButtonClicked);
    Event.off(Event.SX_TABLE_COLUMN_CLICKED, this.listenerTableColumnClicked);
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_LOAD_DATA, this.listenerLoadData);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
  }

  convertSearchResultsToContent(results) {
    this.searchResults = results.map((dataType, index) => {
      const {
        dataTypeId,
        dataTypeCode,
        dataTypeVersion,
        displayName,
        verified = false,
        freezed = false,
        commentCount = 0,
        hasStructure
      } = dataType;

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

      let row = {
        id: dataTypeId,
        index: index,
        checked: false,
        columns: [
          {
            id: 'dataTypeId',
            value: dataTypeId
          },
          {
            id: 'displayName',
            value: displayName
          },
          {
            id: 'dataTypeVersion',
            value: dataTypeVersion
          },
          {
            id: 'dataTypeCode',
            value: dataTypeCode
          },
          {
            id: 'dataStructure',
            value: hasStructure ? String.fromCharCode('9675') : String.fromCharCode('9932')
          },
          {
            id: 'status',
            value: (
              <>
                <span style={{ marginRight: '5px' }}>
                  <SXCommentIcon commentCount={commentCount}></SXCommentIcon>
                </span>
                <span style={{ marginRight: '5px' }}>
                  <SXVerifyIcon verified={verified} />
                </span>
                <span style={{ marginRight: '5px' }}>
                  <SXFreezeIcon freezed={freezed} />
                </span>
              </>
            )
          },
          {
            id: 'actions',
            value: contentActionMenus
          }
        ]
      };

      return row;
    });

    //console.log("[DataTypeExplorer convertSearchResultsToContent] ", results, this.searchResults);
    this.setState({
      searchContainerKey: Util.nowTime()
    });
  }

  selectedDataTypeIds = () => {
    return this.searchResults
      .filter((result) => result.checked)
      .map((result) => {
        return result.id;
      });
  };

  checkAllResultsSelected = () => {
    const selectedDataTypeIds = this.selectedDataTypeIds();

    return selectedDataTypeIds.length == this.searchResults.length;
  };

  deleteDataTypes = () => {
    //console.log("Selected DataTypes: ", this.sele);
    const dataTypeIds =
      this.state.dataTypeIdsToBeDeleted.length > 0 ? this.state.dataTypeIdsToBeDeleted : this.selectedDataTypeIds();

    if (dataTypeIds.length == 0) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
        dialogBody: SXModalUtil.warningDlgBody(
          this.spritemap,
          Util.translate('nothing-to-delete-please-select-at-least-one-datatype')
        )
      });

      return;
    }

    this.fireRequest({
      requestId: RequestIDs.deleteDataTypes,
      params: {
        dataTypeIds: dataTypeIds
      }
    });
  };

  render() {
    //console.log("DataTypeExplorer render: " + this.state.loadingStatus, this.state.keywords);
    if (this.state.loadingStatus == LoadingStatus.PENDING) {
      return <SXLoadingModal imageURL={this.imagePath + '/searching.gif'} />;
    } else if (this.state.loadingStatus == LoadingStatus.FAIL) {
      return <SXErrorModal imageURL={this.imagePath + '/ajax-error.gif'} />;
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
            spritemap={this.spritemap}
          />
          {this.state.confirmDeleteDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('confirm'),
                  onClick: (e) => {
                    this.deleteDataTypes();
                    this.setState({ confirmDeleteDialog: false, dataTypeIdsToBeDeleted: [] });
                  },
                  displayType: 'secondary'
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ confirmDeleteDialog: false, dataTypeIdsToBeDeleted: [] });
                  }
                }
              ]}
            />
          )}
          {this.state.infoDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('ok'),
                  onClick: () => {
                    this.setState({ infoDialog: false });
                  }
                }
              ]}
            />
          )}
          {this.state.underConstruction && (
            <SXModalDialog
              header={Util.translate('underconstruction')}
              body={<UnderConstruction />}
              buttons={[
                {
                  label: Util.translate('ok'),
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
