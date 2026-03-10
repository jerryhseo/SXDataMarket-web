import React from 'react';
import { ActionKeys, EditStatus, Event, LoadingStatus, PortletKeys, RequestIDs } from '../../stationx/station-x';
import { SXErrorModal, SXLoadingModal, SXModalDialog, SXModalUtil } from '../../stationx/modal';
import { SXManagementToolbar, SXSearchResultConainer } from '../../stationx/search-container';
import { Util } from '../../stationx/util';
import Breadcrumb from '@clayui/breadcrumb';
import SXBaseVisualizer from '../../stationx/visualizer';
import { Text } from '@clayui/core';
import { SXFreezeIcon, SXVerifyIcon } from '../../stationx/icon';
import StructuredDataEditor from './structured-data-editor';

class StructuredDataExplorer extends SXBaseVisualizer {
  dataCollection = {};
  dataSet = {};
  dataType = {};

  constructor(props) {
    super(props);

    console.log('[StructuredDataExplorer props] ', props);
    this.checkbox =
      this.params.checkbox ??
      (this.permissions.includes(ActionKeys.UPDATE) || this.permissions.includes(ActionKeys.DELETE));
    this.addButton = this.params.addButton ?? true;
    this.breadcrumb = this.params.breadcrumb ?? false;

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
    if (this.checkbox) {
      this.actionButtons.push({
        id: 'deleteSelected',
        name: Util.translate('delete-selected'),
        symbol: 'trash'
      });
    }

    this.actionButtons.push({
      id: 'advancedSearch',
      name: Util.translate('advanced-search'),
      symbol: 'search-experiences'
    });

    this.actionMenus = [];

    this.searchedResults = [];
    this.searchResults = [];

    this.dialogBody = <></>;
    this.state = {
      dataCollectionId: this.params.dataCollectionId,
      dataSetId: this.params.dataSetId,
      dataTypeId: this.params.dataTypeId,
      displayStyle: props.displayStyle ?? this.displayStyles[0].value, //table
      filterBy: props.filterBy ?? this.filterOptions[0], //groupId
      loadingStatus: LoadingStatus.PENDING,
      confirmDeleteDialog: false,

      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      start: props.start ?? 0,
      delta: props.delta ?? 10,
      keywords: props.keywords ?? '',
      searchContainerKey: Util.nowTime(),
      underConstruction: false
    };

    if (this.state.dataTypeId > 0) {
      this.scope = 'dataType';
    } else if (this.state.dataSetId > 0) {
      this.scope = 'dataSet';
    } else if (this.state.dataCollectionId > 0) {
      this.scope = 'dataCollection';
    }

    this.contentActionMenus = [];

    if (this.permissions.includes(ActionKeys.UPDATE)) {
      this.contentActionMenus = [
        {
          id: 'update',
          name: Util.translate('update'),
          symbol: 'pencil'
        },
        {
          id: 'delete',
          name: Util.translate('delete'),
          symbol: 'trash'
        }
      ];
    }

    this.contentActionMenus.push({
      id: 'dataStatus',
      name: Util.translate('data-status'),
      symbol: 'polls'
    });

    this.dataTableColumns = [
      { id: 'index', name: Util.translate('index'), width: '4rem' },
      {
        id: 'id',
        name: Util.translate('id'),
        width: '5.5rem'
      }
    ];

    if (this.scope === 'dataSet') {
      this.dataTableColumns.push({
        id: 'dataTypeId',
        name: Util.translate('datatype'),
        width: '8rem'
      });
    } else if (this.scope === 'dataCollection') {
      this.dataTableColumns = this.dataTableColumns.concat([
        {
          id: 'dataSetId',
          name: Util.translate('dataset'),
          width: '8rem'
        },
        {
          id: 'dataTypeId',
          name: Util.translate('datatype'),
          width: '8rem'
        }
      ]);
    }

    this.dataTableColumns = this.dataTableColumns.concat([
      {
        id: 'content',
        name: Util.translate('content'),
        width: 'auto'
      },
      {
        id: 'status',
        name: Util.translate('status'),
        width: '4.5rem'
      },
      {
        id: 'actions',
        name: 'actions',
        width: '3.0rem'
      }
    ]);

    if (this.permissions.includes(ActionKeys.UPDATE)) {
      this.dataTableColumns.unshift({ id: 'checkbox', name: '', width: '2.5rem' });
    }

    this.dataIdsToBeDeleted = [];
    //console.log('[StructuredDataExplorer dataTableColumns] ', this.dataTableColumns);
  }

  /***************************************************
   * Listeners for events from ManagementToolbar and SearchResultsContainer.
   ****************************************************/
  listenerSelectAll = (event) => {
    const { targetPortlet, targetFormId, selectAll } = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formId) {
      //console.log("listenerSelectAll event rejected: ", dataPacket);
      return;
    }

    //console.log("listenerSelectAll: ", dataPacket);

    this.searchResults.forEach((result) => {
      result.checked = selectAll;
      return result;
    });

    this.forceUpdate();
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

    const { id, dataCollectionId, dataSetId, dataTypeId } = this.searchResults[data];
    console.log(
      '[StructuredDataExplorer listenerPopActionClicked] ',
      this.searchResults[data],
      id,
      dataCollectionId,
      dataSetId,
      dataTypeId
    );

    switch (action) {
      case 'update': {
        this.redirectTo({
          portletName: PortletKeys.STRUCTURED_DATA_EDITOR,
          params: {
            editStatus: EditStatus.UPDATE,
            structuredDataId: id,
            dataCollectionId: dataCollectionId,
            dataSetId: dataSetId,
            dataTypeId: dataTypeId,
            titleBar: true,
            buttons: true
          }
        });

        break;
      }
      case 'delete': {
        this.dataIdsToBeDeleted = [selectedDataId];

        this.setState({
          confirmDeleteDialog: true,
          dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
          dialogBody: Util.translate('selected-data-will-be-deleted-and-unrecoverable-are-you-sure-to-proceed')
        });
        break;
      }
      case 'dataStatus': {
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
        editState: EditStatus.ADD,
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

    this.setState({
      confirmDeleteDialog: true,
      dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
      dialogBody: Util.translate('selected-data-will-be-deleted-and-unrecoverable-are-you-sure-to-proceed')
    });
  };

  listenerSelectedResultsChanged = (event) => {
    const { targetPortlet, targetFormId } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[StructuredDataExplorer] listenerSelectedResultsChanged event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[StructuredDataExplorer] listenerSelectedResultsChanged: ", event.dataPacket);

    this.forceUpdate();
  };

  listenerTableColumnSelected = (event) => {
    const { targetPortlet, targetFormId, column, row } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[StructuredDataExplorer] listenerTableColumnSelected event rejected: ", event.dataPacket);
      return;
    }
    //console.log("[StructuredDataExplorer] listenerTableColumnSelected: ", event.dataPacket, row, column);

    switch (column.id) {
      case 'checkbox': {
        break;
      }
      case 'structuredDataId': {
        break;
      }
      case 'dataSetId': {
        break;
      }
      case 'dataTypeId': {
        break;
      }
      case 'content': {
        break;
      }
      case 'status': {
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

    console.log('[StructuredDataExplorer] listenerResponse received: ', targetPortlet, requestId, params, data);
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
      case RequestIDs.searchStructuredData: {
        const { structuredDataList } = data;

        this.convertSearchResultsToContent(structuredDataList);

        this.dataCollection = data.dataCollection;
        this.dataSet = data.dataSet ?? {};
        this.dataType = data.dataSet ?? {};

        break;
      }
      case RequestIDs.deleteStructuredData: {
        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.successDlgHeader(),
          dialogBody: Util.translate('data-is-deleted-successfully')
        });

        this.fireRequest({
          requestId: RequestIDs.searchStructuredData,
          params: {
            dataCollectionId: this.state.dataCollectionId,
            dataSetId: this.state.dataSetId,
            dataTypeId: this.state.dataTypeId,
            filterBy: this.state.filterBy,
            groupId: this.groupId,
            userId: this.userId,
            status: 'all',
            start: this.state.start,
            delta: this.state.delta,
            keywords: this.state.keywords
          }
        });

        break;
      }
    }

    this.setState({ searchContainerKey: Util.nowTime() });
  };

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[StructuredDataExplorer] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[StructuredDataExplorer] listenerWorkbenchReady received: ", event.dataPacket);

    this.fireRequest({
      requestId: RequestIDs.searchStructuredData,
      params: {
        dataCollectionId: this.state.dataCollectionId,
        dataSetId: this.state.dataSetId,
        dataTypeId: this.state.dataTypeId,
        filterBy: this.state.filterBy,
        groupId: this.groupId,
        userId: this.userId,
        status: 'all',
        start: this.state.start,
        delta: this.state.delta,
        keywords: this.state.keywords
      }
    });

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
    console.log('[StructuredDataExplorer convertSearchResultsToContent] ', this.scope, results);

    this.searchResults = results.map((result, index) => {
      const {
        structuredDataId, //
        dataCollectionId,
        dataSet,
        dataSetId,
        dataType,
        dataTypeId,
        data,
        verified,
        freezed,
        modifiedDate
      } = result;

      console.log('convertSearchResultsToContent: ', result);

      let row = {
        id: structuredDataId,
        index: index,
        checked: false,
        dataCollectionId: dataCollectionId,
        dataSetId: dataSetId,
        dataTypeId: dataTypeId,
        columns: [
          {
            id: 'structuredDataId',
            value: structuredDataId
          }
        ]
      };

      if (this.scope === 'dataCollection') {
        row.columns = row.columns.concat([
          {
            id: 'dataSet',
            value: (
              <Text size={3} truncate>
                {dataSet.displayName}
              </Text>
            )
          },
          {
            id: 'dataType',
            value: (
              <Text size={3} truncate>
                {dataType.displayName}
              </Text>
            )
          }
        ]);
      } else if (this.scope === 'dataSet') {
        row.columns.push({
          id: 'dataType',
          value: (
            <Text size={3} truncate>
              {dataType.displayName}
            </Text>
          )
        });
      }

      row.columns = row.columns.concat([
        {
          id: 'content',
          value: (
            <Text size={3} truncate>
              {JSON.stringify(data)}
            </Text>
          )
        },
        {
          id: 'status',
          value: (
            <>
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
          value: this.contentActionMenus
        }
      ]);

      return row;
    });
  }

  removeSearchResults(structuredDataId) {
    this.searchedResults = this.searchedResults.filter((result) => result.structuredDataId !== structuredDataId);
  }

  selectedDataIds = () => {
    return this.searchResults
      .filter((result) => result.checked)
      .map((result) => {
        return result.id;
      });
  };

  checkAllResultsSelected = () => {
    const selectedDataIds = this.selectedDataIds();

    return selectedDataIds.length == this.searchResults.length;
  };

  deleteData = () => {
    const dataIds = Util.isNotEmpty(this.dataIdsToBeDeleted) ? this.dataIdsToBeDeleted : this.selectedDataIds();

    Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
      requestId: RequestIDs.deleteStructuredData,
      params: {
        structuredDataIdList: dataIds
      }
    });
  };

  render() {
    if (this.state.loadingStatus == LoadingStatus.PENDING) {
      return <SXLoadingModal imageURL={this.imagePath + '/searching.gif'} />;
    } else if (this.state.loadingStatus == LoadingStatus.FAIL) {
      return <SXErrorModal imageURL={this.imagePath + '/ajax-error.gif'} />;
    } else {
      //console.log("SXInstanceInfo.render: ", this.dataType);
      return (
        <div>
          {(this.state.dataCollectionId > 0 || this.state.dataSetId > 0 || this.state.dataTypeId > 0) && (
            <>
              {this.breadcrumb && <Breadcrumb items={[]} style={{ display: 'flex' }} spritemap={this.spritemap} />}
              <SXManagementToolbar
                key={this.checkAllResultsSelected()}
                namespace={this.namespace}
                formId={this.formId}
                searchBar={true}
                addButton={this.addButton}
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
                    this.deleteData();
                    this.setState({ confirmDeleteDialog: false });
                  },
                  displayType: 'secondary'
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ confirmDeleteDialog: false });
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
                  onClick: (e) => {
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

export default StructuredDataExplorer;
