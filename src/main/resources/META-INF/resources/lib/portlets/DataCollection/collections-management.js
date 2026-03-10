import React, { createRef } from 'react';
import { Event, PortletKeys, PortletState, RequestIDs } from '../../stationx/station-x';
import { SXPortlet, Workbench } from '../DataWorkbench/workbench';
import { Rnd } from 'react-rnd';
import SXDataCollectionNavigationBar from './datacollection-navigationbar';
import { Util } from '../../stationx/util';
import SXApplicationBar from '../../stationx/application-bar';
import Icon from '@clayui/icon';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import SXBaseVisualizer from '../../stationx/visualizer';
import { Text } from '@clayui/core';
import { ClayButtonWithIcon } from '@clayui/button';

class CollectionsManagement extends SXBaseVisualizer {
  static ViewMode = {
    FORM: 'form',
    DATA: 'data',
    DATACOLLECTION_EXPLORER: 'dataCollectionExplorer',
    DATASET_EXPLORER: 'dataSetExplorer',
    DATATYPE_EXPLORER: 'dataTypeExplorer',
    DATASTRUCTURE_EXPLORER: 'dataStructureExplorer'
  };

  static ItemTypes = {
    COLLECTION: 'collection',
    DATASET: 'set',
    DATATYPE: 'type'
  };

  constructor(props) {
    super(props);

    //console.log("[CollectionsManagement props]", props);

    this.workbench = new Workbench({
      namespace: this.namespace, //namespace of the CollectionManagement portlet
      workbenchId: this.portletId,
      baseRenderURL: this.baseRenderURL,
      baseResourceURL: this.baseResourceURL,
      spritemap: this.spritemap
    });

    this.searchedCollections = [];

    this.state = {
      viewMode: this.params.viewMode ?? CollectionsManagement.ViewMode.FORM,
      workingPortletInstance: this.initializeWorkingPortletInstance(),
      openVerticalNav: this.params.verticalNav ?? true,
      refreshNav: Util.nowTime(),
      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      confirmDeleteDataCollectionDialog: false,
      confirmDeleteDataSetDialog: false,
      confirmDeleteDataTypeDialog: false,
      addDataCollectionWarning: false,
      selectedNavItem: null
    };

    this.contentRef = createRef();
    this.navRef = createRef();
    this.navbarId = this.namespace + 'dataCollectionNavbar';

    this.boundingRect = null;

    this.navItems = [];

    this.applicationTitle = '';

    this.applicationBarButtons = [];

    this.idsToBeDeleted = [];
  }

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[collectionManagement] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[collectionManagement] listenerWorkbenchReady received: ", event.dataPacket);

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      sourceFormId: this.portletId,
      requestId: RequestIDs.searchDataCollections
    });
  };

  listenerLoadPortlet = (event) => {
    const { targetPortlet, portletName, params, portletState } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      return;
    }

    //console.log('SX_LOAD_PORTLET received: ', this.state, event.dataPacket);
    let { dataCollectionId = 0, dataSetId = 0, dataTypeId = 0 } = params;

    if (this.state.workingPortletInstance.portletName === portletName) {
      Event.fire(Event.SX_LOAD_DATA, this.namespace, this.state.workingPortletInstance.namespace, {
        dataCollectionId: dataCollectionId,
        dataSetId: dataSetId,
        dataTypeId: dataTypeId
      });
    } else {
      this.deployPortlet({
        portletName: portletName,
        params: params,
        portletState: portletState
      });
    }
  };

  listenerOpenPortletWindow = (event) => {
    const { targetPortlet, portletName, windowTitle, params } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionManagement SX_OPEN_PORTLET_WINDOW REJECTED] ", targetPortlet);
      return;
    }

    //console.log("[CollectionManagement SX_OPEN_PORTLET_WINDOW Received] ", portletName, windowTitle, params);

    this.workbench
      .openPortletWindow({
        portletName: portletName,
        windowTitle: windowTitle,
        params: params
      })
      .then(() => {
        //console.log("Portlet Window Created: ", this.workbench.windows);
        this.forceUpdate();
      });
  };

  listenerRedirectTo = (event) => {
    const { targetPortlet, portletName, params = {}, portletState = PortletState.NORMAL } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionManagement listenerRedirectTo REJECTED] ", event.dataPacket);
      return;
    }

    //console.log("[CollectionManagement listenerRedirectTo] ", event.dataPacket);
    this.deployPortlet({
      portletName: portletName,
      params: params,
      portletState: portletState
    });
  };

  listenerSearchDataTypes = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      return;
    }

    this.searchDataTypes(dataPacket.params);
  };

  listenerHandshake = (event) => {
    const { targetPortlet, sourcePortlet } = event.dataPacket;
    if (targetPortlet !== this.namespace) {
      return;
    }

    //console.log("Workbench HANDSHAKE received: ", dataPacket);

    Event.fire(Event.SX_WORKBENCH_READY, this.namespace, sourcePortlet, {});
  };

  listenerWindowResize = () => {
    this.boundingRect = this.navRef.current.getBoundingClientRect();

    this.forceUpdate();
  };

  listenerNavItemSelected = (event) => {
    const { targetPortlet, targetFormId, item } = event.dataPacket;
    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[CollectionManagement listenerNavItemSelected rejected] ", params, this.formId);
      return;
    }

    console.log('[CollectionManagement listenerNavItemSelected] ', item, this.state);

    let portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
    let requestId;
    let requestParams;
    let addButton = true;

    let dataCollectionId = 0;
    let dataSetId = 0;
    let dataTypeId = 0;

    const { id, modelId, parent, label, type, items, hasDataStructure } = item;

    switch (item.type) {
      case CollectionsManagement.ItemTypes.COLLECTION: {
        dataCollectionId = modelId;

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          portletName = PortletKeys.DATACOLLECTION_VIEWER;
        }

        /*
				if (Util.isEmpty(items)) {
					requestId = RequestIDs.loadAssociatedDataSets;
					requestParams = {
						dataCollectionId: modelId
					};
				}
					*/

        break;
      }
      case CollectionsManagement.ItemTypes.DATASET: {
        dataCollectionId = parent.modelId;
        dataSetId = modelId;
        //console.log("NaveItemSelected: ", dataSetId, modelId);

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          portletName = PortletKeys.DATASET_VIEWER;
        }

        /*
				if (Util.isEmpty(items)) {
					requestId = RequestIDs.loadAssociatedDataTypes;
					requestParams = {
						dataCollectionId: dataCollectionId,
						dataSetId: dataSetId
					};
				}
					*/

        break;
      }
      case CollectionsManagement.ItemTypes.DATATYPE: {
        //console.log("[CollectionManagement DataType NavItemSelected] ", item);

        dataCollectionId = parent.parent.modelId;
        dataSetId = parent.modelId;
        dataTypeId = modelId;

        console.log('DataType NavItemSelected: ', parent.parent.modelId, parent.modelId, Number(modelId));

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          portletName = PortletKeys.DATATYPE_VIEWER;
        } else if (this.state.viewMode === CollectionsManagement.ViewMode.DATA && hasDataStructure === false) {
          this.setState({
            infoDialog: true,
            dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
            dialogBody: Util.translate('datatype-has-no-data-structure')
          });

          addButton = false;
          /*
          this.state.selectedNavItem.active = true;
          item.active = false;
          */
        }

        break;
      }
    }

    if (this.state.selectedNavItem === item && portletName === this.state.workingPortletInstance.portletName) {
      return;
    } else if (portletName === this.state.workingPortletInstance.portletName) {
      //Event.fire()
    }

    if (requestId) {
      this.workbench.processRequest({
        requestPortlet: this.namespace,
        requestId: requestId,
        params: requestParams
      });
    }

    this.setState({ selectedNavItem: item });

    this.applicationTitle = '';

    const portletParams = {
      dataCollectionId: dataCollectionId,
      dataSetId: dataSetId,
      dataTypeId: dataTypeId,
      addButton: addButton
    };

    /*
		console.log(
			"[CollectionManagement NaveItemSelected] ",
			dataCollectionId,
			dataSetId,
			dataTypeId,
			portletParams,
			this.state
		); */
    this.deployPortlet({
      portletName: portletName,
      params: portletParams
    });
  };

  listenerResponse = (event) => {
    const { targetPortlet, sourcePortlet, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement] listenerResponce rejected: ", dataPacket);
      return;
    }

    //console.log('[CollectionsManagement] listenerResponse: ', requestId, params, data);

    const { error } = data;
    if (Util.isNotEmpty(error)) {
      if (Util.isEmpty(this.state.workingPortletInstance.namespace)) {
        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
          dialogBody: error
        });
      } else {
        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });
      }

      return;
    }

    switch (requestId) {
      case RequestIDs.searchDataCollections: {
        this.searchedCollections = data;

        this.navItems = this.searchedCollections.map((dataCollection) => {
          const collectionItem = {
            id: dataCollection.dataCollectionId,
            modelId: dataCollection.dataCollectionId,
            label: dataCollection.displayName,
            verified: dataCollection.verified ?? { verified: false },
            freezed: dataCollection.freezed ?? { freezed: false },
            type: CollectionsManagement.ItemTypes.COLLECTION
          };

          const dataSets = dataCollection.dataSets;
          if (dataCollection.dataSetList) {
            collectionItem.items = dataCollection.dataSetList.map((dataSet) => {
              const setItem = {
                id: dataSet.linkId,
                modelId: dataSet.dataSetId,
                parent: collectionItem,
                label: dataSet.displayName,
                verified: dataSet.verified ?? { verified: false },
                freezed: dataSet.freezed ?? { freezed: false },
                type: CollectionsManagement.ItemTypes.DATASET
              };

              if (dataSet.dataTypeList) {
                setItem.items = dataSet.dataTypeList.map((dataType) => {
                  return {
                    id: dataType.setTypelinkId,
                    modelId: dataType.dataTypeId,
                    parent: setItem,
                    hasDataStructure: dataType.hasDataStructure ?? false,
                    label: dataType.displayName,
                    verified: dataType.verified ?? { verified: false },
                    freezed: dataType.freezed ?? { freezed: false },
                    type: CollectionsManagement.ItemTypes.DATATYPE
                  };
                });
              }

              return setItem;
            });
          }

          return collectionItem;
        });

        console.log('navItems: ', this.navItems, this.state.selectedNavItem);

        this.setState({ refreshNav: Util.nowTime() });
        break;
      }

      case RequestIDs.searchStructuredData: {
        this.searchedCollections = data;

        break;
      }
      case RequestIDs.loadAssociatedDataSets: {
        //console.log("[CollectionsManagement] listenerResponse ", this.state.selectedNavItem, data);

        this.fireNavRefresh(this.state.selectedNavItem.id);

        break;
      }
      case RequestIDs.loadAssociatedDataTypes: {
        //console.log("[CollectionsManagement] listenerResponse ", this.state.selectedNavItem, data);

        this.state.selectedNavItem.items = data.map((dataType) => ({
          id: dataType.setTypeLinkId,
          dataTypeId: dataType.dataTypeId,
          dataTypeVersion: dataType.dataTypeVersion,
          dataTypeCode: dataType.dataTypeCode,
          label: dataType.displayName,
          type: CollectionsManagement.ItemTypes.DATATYPE
        }));

        this.fireNavRefresh(this.state.selectedNavItem.id);

        break;
      }
      case RequestIDs.deleteDataCollections: {
        const { deletedDataCollections, failedDataCollections } = data;

        this.navItems = this.navItems.filter((navItem) => !deletedDataCollections.includes(navItem.id));

        /*
        console.log(
          '[CollectionManagement response] deleteDataCollections: ---- ',
          deletedDataCollections,
          failedDataCollections,
          this.navItems,
          this.state.selectedNavItem
        );
        */

        this.state.selectedNavItem = null;
        this.buildApplicationTitle();

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        /*
        this.setState({
          //refreshNav: Util.nowTime(),
          workingPortletInstance: this.initializeWorkingPortletInstance(),
        });
        */

        this.fireNavRefresh();

        break;
      }
      case RequestIDs.saveDataCollection: {
        const { dataCollection, associatedDataSets } = data;

        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
          dialogBody: Util.translate('datacollection-saved-as', dataCollection.dataCollectionId)
        });

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        if (!this.state.selectedNavItem) {
          this.state.selectedNavItem = {
            type: CollectionsManagement.ItemTypes.COLLECTION
          };

          this.navItems.unshift(this.state.selectedNavItem);
        }

        this.applySelectedNavItemChanged({
          id: dataCollection.dataCollectionId,
          modelId: dataCollection.dataCollectionId,
          label: dataCollection.displayName,
          items: associatedDataSets.map((dataSet) => ({
            id: dataSet.linkId,
            modelId: dataSet.dataSetId,
            label: dataSet.displayName,
            type: CollectionsManagement.ItemTypes.DATASET
          })),
          dirty: false
        });

        break;
      }
      case RequestIDs.deleteDataSets: {
        const { deletedDataSets, failedDataSets } = data;

        this.navItems.forEach((navItem) => {
          navItem.items = navItem.items.filter((dataSetItem) => !deletedDataSets.includes(dataSetItem.id));
        });

        this.state.selectedNavItem = null;
        this.buildApplicationTitle();

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        /*
        this.setState({
          refreshNav: Util.nowTime(),
          workingPortletInstance: this.initializeWorkingPortletInstance(),
        });
        */

        this.fireNavRefresh({
          removedExpandedKeys: deletedDataSets
        });

        break;
      }
      case RequestIDs.saveDataSet: {
        const { dataSet, deletedDataTypeList, associatedDataTypeList, message } = data;
        /*
        console.log(
          '[DataSetEditor.listenerResponse.saveDataSet]: ',
          dataSet,
          deletedDataTypeList,
          associatedDataTypeList,
          message
        ); */

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        console.log('this.state.selectedNavItem: ', dataSet, JSON.stringify(this.state.selectedNavItem, null, 4));
        this.state.selectedNavItem.active = false;
        if (this.state.selectedNavItem.type === CollectionsManagement.ItemTypes.COLLECTION) {
          const dataSetNavItem = {
            type: CollectionsManagement.ItemTypes.DATASET
          };

          this.state.selectedNavItem.items.push(dataSetNavItem);

          this.fireNavRefresh({ additionalExpandedKeys: [this.state.selectedNavItem.id, dataSet.dataSetId] });

          this.state.selectedNavItem = dataSetNavItem;
        }

        this.applySelectedNavItemChanged({
          id: dataSet.dataSetId,
          modelId: dataSet.dataSetId,
          label: dataSet.displayName,
          items: associatedDataTypeList.map((dataType) => ({
            id: dataType.linkId,
            modelId: dataType.dataTypeId,
            label: dataType.displayName,
            type: CollectionsManagement.ItemTypes.DATATYPE
          })),
          dirty: false
        });

        this.fireNavRefresh({
          additionalExpandedKeys: [dataSet.dataSetId]
        });

        break;
      }
      case RequestIDs.saveDataType: {
        const { dataType, associatedDataTypes = [] } = data;

        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
          dialogBody: Util.translate('datatype-saved-as', dataType.dataTypeId)
        });

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        //console.log("this.state.selectedNavItem: ", dataSet, JSON.stringify(this.state.selectedNavItem, null, 4));
        if (this.state.selectedNavItem.type === CollectionsManagement.ItemTypes.DATASET) {
          const dataTypeNavItem = {
            type: CollectionsManagement.ItemTypes.DATATYPE
          };

          this.state.selectedNavItem.items.push(dataTypeNavItem);

          this.state.selectedNavItem = dataTypeNavItem;
        }

        this.applySelectedNavItemChanged({
          id: dataType.dataTypeId,
          modelId: dataType.dataTypeId,
          label: dataType.displayName,
          dirty: false
        });

        this.setState({
          dataTypeId: dataType.dataTypeId
        });

        break;
      }
    }
  };

  listenerCloseVerticalNav = (event) => {
    const dataPacket = event.dataPacket;
    if (dataPacket.targetPortlet !== this.namespace) {
      return;
    }

    this.setState({ openVerticalNav: dataPacket.open });
  };

  listenerClosePreviewWindow = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      return;
    }

    this.workbench.removeWindow(dataPacket.portletId);

    this.forceUpdate();
  };

  listenerRequest = async (event) => {
    const { targetPortlet, sourcePortlet, targetFormId, sourceFormId, requestId, params } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      return;
    }

    //console.log('[CollectionsManagement] SX_REQUEST received: ', event.dataPacket);
    this.workbench.processRequest({
      requestPortlet: sourcePortlet,
      sourceFormId: sourceFormId,
      requestId: requestId,
      params: params
    });
  };

  listenerChangeViewMode = (event) => {
    const { targetPortlet, viewMode } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      return;
    }

    console.log('[CollectionsManagement listenerChangeViewMode] ', viewMode, this.state.selectedNavItem);

    this.setState({ viewMode: viewMode });

    let portletName;
    switch (viewMode) {
      case CollectionsManagement.ViewMode.FORM: {
        if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATATYPE) {
          portletName = PortletKeys.DATATYPE_VIEWER;
        } else if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATASET) {
          portletName = PortletKeys.DATASET_VIEWER;
        } else if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.COLLECTION) {
          portletName = PortletKeys.DATACOLLECTION_VIEWER;
        }

        break;
      }
      case CollectionsManagement.ViewMode.DATA: {
        if (
          this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATATYPE &&
          this.state.selectedNavItem.hasDataStructure === false
        ) {
          console.log('-------------------------');
          this.setState({
            infoDialog: true,
            dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
            dialogBody: Util.translate('datatype-has-no-data-structure')
          });
        } else {
          console.log('++++++++++++++++++++');
          portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
        }

        break;
      }
      case CollectionsManagement.ViewMode.DATACOLLECTION_EXPLORER: {
        portletName = PortletKeys.DATACOLLECTION_EXPLORER;

        break;
      }
      case CollectionsManagement.ViewMode.DATASET_EXPLORER: {
        portletName = PortletKeys.DATASET_EXPLORER;

        break;
      }
      case CollectionsManagement.ViewMode.DATATYPE_EXPLORER: {
        portletName = PortletKeys.DATATYPE_EXPLORER;

        break;
      }
      case CollectionsManagement.ViewMode.DATASTRUCTURE_EXPLORER: {
        portletName = PortletKeys.DATASTRUCTURE_EXPLORER;

        break;
      }
    }

    const portletParams = this.getDeployPortletParams(viewMode);

    if (portletName && portletParams) {
      this.deployPortlet({
        portletName: portletName,
        params: portletParams
      });
    } else {
      this.setState({
        workingPortletInstance: this.initializeWorkingPortletInstance()
      });
    }
  };

  listenerApplicationBarBtnClicked = (event) => {
    const { targetPortlet, button } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      return;
    }

    //console.log("[CollectionsManagement viewMode] ", button);

    let portletName;

    switch (button.id) {
      case 'addDataSet': {
        portletName = PortletKeys.DATASET_EDITOR;

        break;
      }
      case 'addDataType': {
        portletName = PortletKeys.DATATYPE_EDITOR;
        //console.log("dataCollectionId: ", this.state.selectedNavItem, this.state);

        break;
      }
    }

    if (this.state.workingPortletInstance.portletName === portletName) {
      return;
    }

    let params = this.getDeployPortletParams();

    this.deployPortlet({
      portletName: portletName,
      params: {
        ...params,
        titleBar: true
      }
    });
  };

  listenerDataCollectionChanged = (event) => {
    const { targetPortlet, dataCollection } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerDataCollectionChanged REJECTED] ", event.dataPacket);
      return;
    }

    //console.log("[CollectionsManagement listenerDataCollectionChanged] ", this.state.selectedNavItem, dataCollection);

    this.state.selectedNavItem.dirty = true;
    this.fireNavRefresh({ additionalExpandedKeys: [this.state.selectedNavItem.id] });
  };

  listenerDataSetChanged = (event) => {
    const { targetPortlet, dataSet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log('[CollectionsManagement listenerDataSetChanged REJECTED] ', targetPortlet);
      return;
    }

    //console.log('[CollectionsManagement listenerDataSetChanged] ', this.state.selectedNavItem, dataSet);

    this.state.selectedNavItem.dirty = true;
    this.fireNavRefresh({ additionalExpandedKeys: [this.state.selectedNavItem.id] });
  };

  listenerDataTypeChanged = (event) => {
    const { targetPortlet, dataType } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log('[CollectionsManagement listenerDataTypeChanged REJECTED] ', targetPortlet);
      return;
    }

    //console.log('[CollectionsManagement listenerDataTypeChanged] ', this.state.selectedNavItem, dataType);

    this.state.selectedNavItem.dirty = true;
    this.fireNavRefresh({ additionalExpandedKeys: [this.state.selectedNavItem.id] });
  };

  listenerDeleteDataCollections = (event) => {
    const { targetPortlet, dataCollectionIds } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log('[CollectionsManagement listenerDeleteDataCollections REJECTED] ', targetPortlet);
      return;
    }

    /*
    console.log(
      '[CollectionsManagement listenerDeleteDataCollections] ',
      this.state.selectedNavItem,
      dataCollectionIds
    ); */

    this.deleteDataCollections(dataCollectionIds);
  };

  listenerSaveDataCollection = (event) => {
    const { targetPortlet, dataCollection } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerSaveDataCollection REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerSaveDataCollection] ",
			this.state.selectedNavItem,
			dataCollection
		); */

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.saveDataCollection,
      params: dataCollection
    });
  };

  listenerSaveDataSet = (event) => {
    const {
      targetPortlet,
      dataCollectionId,
      dataSetId,
      dataSetCode,
      dataSetVersion,
      displayName,
      description,
      associatedDataTypes
    } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerSaveDataSet REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerSaveDataSet] ",
			dataCollectionId,
      dataSetId,
      dataSetCode,
      dataSetVersion,
      displayName,
      description,
      associatedDataTypes
		); */

    const params = {
      dataCollectionId: dataCollectionId ?? 0,
      dataSetId: dataSetId,
      dataSetCode: dataSetCode ?? '',
      dataSetVersion: dataSetVersion ?? '',
      associatedDataTypes: associatedDataTypes ?? []
    };

    if (displayName) {
      params.displayName = displayName;
    }

    if (description) {
      params.description = description;
    }

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.saveDataSet,
      params: params
    });
  };

  listenerDeleteDataSets = (event) => {
    const { targetPortlet, dataCollectionId, dataSetIds } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerDeleteDataSets REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerDeleteDataSet] ",
			this.state.selectedNavItem,
			dataCollectionId,
			dataSetId
		); */

    const params = this.getDeployPortletParams();

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.deleteDataSets,
      params: {
        dataCollectionId: dataCollectionId ?? params.dataCollectionId,
        dataSetIds: dataSetIds
      }
    });
  };

  listenerSaveDataType = (event) => {
    const {
      targetPortlet,
      dataCollectionId,
      dataSetId,
      dataTypeId,
      dataTypeCode,
      dataTypeVersion,
      extension,
      displayName,
      description,
      visualizers,
      dataStructureId
    } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerSaveDataType REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerSaveDataType] ",
			dataCollectionId,
			dataSetId,
			dataTypeId,
			dataTypeCode,
			dataTypeVersion,
			extension,
			visualizers,
			dataStructureId
		); */

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.saveDataType,
      params: {
        dataCollectionId: dataCollectionId,
        dataSetId: dataSetId,
        dataTypeId: dataTypeId,
        dataTypeCode: dataTypeCode,
        dataTypeVersion: dataTypeVersion,
        extension: extension,
        displayName: displayName,
        description: description,
        visualizers: visualizers,
        dataStructureId: dataStructureId
      }
    });
  };

  listenerDeleteDataTypes = (event) => {
    const { targetPortlet, dataCollectionId, dataSetId, dataTypeIds } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerDeleteDataTypes REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerDeleteDataTypes] ",
			this.state.selectedNavItem,
			dataCollectionId,
			dataSetId,
			dataTypeId
		); */

    const params = this.getDeployPortletParams();

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.deleteDataTypes,
      params: {
        dataCollectionId: params.dataCollectionId,
        dataSetId: params.dataSetId,
        dataTypeIds: dataTypeIds
      }
    });
  };

  componentDidMount = () => {
    Event.on(Event.SX_HANDSHAKE, this.listenerHandshake);
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
    Event.on(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
    Event.on(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
    Event.on(Event.SX_REQUEST, this.listenerRequest);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);
    Event.on(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
    //Event.on(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);
    Event.on(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
    Event.on(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
    Event.on(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
    Event.on(Event.SX_REDIRECT_TO, this.listenerRedirectTo);
    Event.on(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
    Event.on(Event.SX_DELETE_DATACOLLECTIONS, this.listenerDeleteDataCollections);
    Event.on(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
    Event.on(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
    Event.on(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
    Event.on(Event.SX_DELETE_DATASETS, this.listenerDeleteDataSets);
    Event.on(Event.SX_DATATYPE_CHANGED, this.listenerDataTypeChanged);
    Event.on(Event.SX_SAVE_DATATYPE, this.listenerSaveDataType);
    Event.on(Event.SX_DELETE_DATATYPE, this.listenerDeleteDataTypes);

    window.addEventListener('resize', this.listenerWindowResize);

    this.boundingRect = this.navRef.current.getBoundingClientRect();

    this.fireHandshake();

    this.buildApplicationTitle();
  };

  componentWillUnmount = () => {
    Event.off(Event.SX_HANDSHAKE, this.listenerHandshake);
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_CLOSE_VERTICAL_NAV, this.listenerCloseVerticalNav);
    Event.off(Event.SX_LOAD_PORTLET, this.listenerLoadPortlet);
    Event.off(Event.SX_OPEN_PORTLET_WINDOW, this.listenerOpenPortletWindow);
    Event.off(Event.SX_REQUEST, this.listenerRequest);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
    Event.off(Event.SX_REMOVE_WINDOW, this.listenerClosePreviewWindow);
    //Event.off(Event.SX_DATACOLLECTION_SELECTED, this.listenerDataCollectionSelected);
    Event.off(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
    Event.off(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
    Event.off(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
    Event.off(Event.SX_REDIRECT_TO, this.listenerRedirectTo);
    Event.off(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
    Event.off(Event.SX_DELETE_DATACOLLECTIONS, this.listenerDeleteDataCollections);
    Event.off(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
    Event.off(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
    Event.off(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
    Event.off(Event.SX_DELETE_DATASETS, this.listenerDeleteDataSets);
    Event.off(Event.SX_SAVE_DATATYPE, this.listenerSaveDataType);
    Event.off(Event.SX_DELETE_DATATYPES, this.listenerDeleteDataTypes);
    Event.off(Event.SX_DATATYPE_CHANGED, this.listenerDataTypeChanged);

    window.removeEventListener('resize', this.listenerWindowResize);
  };

  fireNavRefresh({ additionalExpandedKeys = [], removedExpandedKeys = [] }) {
    //console.log('fireNavRefresh: ', additionalExpandedKeys, removedExpandedKeys);

    Event.fire(Event.SX_REFRESH_NAVBAR, this.namespace, this.namespace, {
      targetFormId: this.navbarId,
      additionalExpandedKeys: additionalExpandedKeys,
      removedExpandedKeys: removedExpandedKeys
    });
  }

  initializeWorkingPortletInstance = () => {
    return {
      portletName: '',
      portletId: '',
      namespace: '',
      displayName: '',
      title: '',
      content: <></>,
      portlet: null
    };
  };

  deleteDataCollections = (dataCollectionIds) => {
    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.deleteDataCollections,
      params: {
        dataCollectionIds: dataCollectionIds
      }
    });
  };

  deleteDataTypes = () => {};

  findParentItem = (items, child, parent = null) => {
    for (const item of items) {
      if (item === child) {
        return parent;
      }

      if (Util.isNotEmpty(item.items)) {
        const found = this.findParentItem(item.items, child, item);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  applySelectedNavItemChanged = ({ id, modelId, label, items, active = true, dirty = true }) => {
    this.state.selectedNavItem.id = id;
    this.state.selectedNavItem.modelId = modelId;
    this.state.selectedNavItem.label = label;
    if (items) {
      this.state.selectedNavItem.items = items;
    }

    this.state.selectedNavItem.active = active;
    this.state.selectedNavItem.dirty = dirty;

    this.buildApplicationTitle();
  };

  findNavItem = (items, id) => {
    for (const item of items) {
      if (item.id == id) {
        return item;
      }

      if (Util.isNotEmpty(item.items)) {
        const found = this.findNavItem(item.items, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  removeUnsavedItems = (items) => {
    for (const item of items) {
      if (item.id == 0) {
      }
    }
  };

  buildApplicationTitle = () => {
    if (!this.state.selectedNavItem) {
      return '';
    } else {
      let dataCollectionlabel;
      let dataSetlabel;
      let dataTypelabel;

      if (this.state.selectedNavItem.type === CollectionsManagement.ItemTypes.COLLECTION) {
        dataCollectionlabel = this.state.selectedNavItem.label;
      } else if (this.state.selectedNavItem.type === CollectionsManagement.ItemTypes.DATASET) {
        dataSetlabel = this.state.selectedNavItem.label;
        dataCollectionlabel = this.state.selectedNavItem.parent.label;
      } else if (this.state.selectedNavItem.type === CollectionsManagement.ItemTypes.DATATYPE) {
        dataTypelabel = this.state.selectedNavItem.label;
        dataSetlabel = this.state.selectedNavItem.parent.label;
        dataCollectionlabel = this.state.selectedNavItem.parent.parent.label;
      }

      this.applicationTitle = Util.isEmpty(dataCollectionlabel) ? '' : dataCollectionlabel;
      this.applicationTitle += Util.isEmpty(dataSetlabel) ? '' : ' > ' + dataSetlabel;
      this.applicationTitle += Util.isEmpty(dataTypelabel) ? '' : ' > ' + dataTypelabel;

      this.applicationTitle = this.applicationTitle ? this.applicationTitle : Util.translate('select-datacollection');

      return this.applicationTitle;
    }
  };

  searchDataTypes = async (params, targetPortlet) => {
    const result = await this.workbench.searchDataTypes(params);

    this.workbench.fireLoadData(targetPortlet, result);
  };

  getDeployPortletParams = (viewMode = this.state.viewMode) => {
    //console.log("[CollectionManagement getDeployPortletParams] ", JSON.stringify(this.state.selectedNavItem, null, 4));
    if (Util.isEmpty(this.state.selectedNavItem)) {
      this.applicationBarButtons = [];
      return {};
    }

    let dataCollectionId = 0;
    let dataSetId = 0;
    let dataTypeId = 0;

    switch (this.state.selectedNavItem.type) {
      case CollectionsManagement.ItemTypes.COLLECTION: {
        dataCollectionId = this.state.selectedNavItem.modelId;

        if (viewMode === CollectionsManagement.ViewMode.FORM) {
          this.applicationBarButtons = [
            {
              id: 'addDataSet',
              label: Util.translate('add-dataset'),
              symbol: 'plus'
            }
          ];
        }
        break;
      }
      case CollectionsManagement.ItemTypes.DATASET: {
        dataCollectionId = this.state.selectedNavItem.parent.modelId;
        dataSetId = this.state.selectedNavItem.modelId;

        if (viewMode === CollectionsManagement.ViewMode.FORM) {
          this.applicationBarButtons = [
            {
              id: 'addDataType',
              label: Util.translate('add-datatype'),
              symbol: 'plus'
            }
          ];
        }
        break;
      }
      case CollectionsManagement.ItemTypes.DATATYPE: {
        dataCollectionId = this.state.selectedNavItem.parent.parent.modelId;
        dataSetId = this.state.selectedNavItem.parent.modelId;
        dataTypeId = this.state.selectedNavItem.modelId;

        //console.log("getDeployPortletParams: ", dataSetItem, dataCollectionItem, dataTypeId);

        if (viewMode === CollectionsManagement.ViewMode.FORM) {
          this.applicationBarButtons = [];
        }
        break;
      }
    }

    const portletParams = {
      dataCollectionId: dataCollectionId,
      dataSetId: dataSetId,
      dataTypeId: dataTypeId
    };

    if (viewMode === CollectionsManagement.ViewMode.DATA) {
      this.applicationBarButtons = [];

      return {
        ...portletParams,
        checkbox: true,
        breadcrumb: false,
        addButton: true
      };
    } else {
      return portletParams;
    }
  };

  deployPortlet = async ({ portletName, params = {}, title = '', portletState = PortletState.NORMAL }) => {
    const portletInstance = await this.workbench.loadPortlet({
      portletName: portletName,
      params: params
    });

    portletInstance.portletState = portletState;

    this.setState({
      workingPortletInstance: portletInstance
    });
  };

  openDataCollectionEditor = () => {
    if (!this.state.selectedNavItem) {
      this.applicationTitle = Util.translate('new-datacollection');
    }

    this.deployPortlet({
      portletName: PortletKeys.DATACOLLECTION_EDITOR,
      portletState: PortletState.NORMAL
    });

    if (this.state.selectedNavItem) {
      this.state.selectedNavItem.active = false;
      this.state.selectedNavItem.dirty = false;
    }

    this.fireNavRefresh();
  };

  handleAddDataCollection = (event) => {
    event.stopPropagation();

    this.openDataCollectionEditor();
  };

  render() {
    //console.log('[CollectionManagement render] ', this.state.selectedNavItem);
    if (
      this.state.viewMode === CollectionsManagement.ViewMode.DATACOLLECTION_EXPLORER ||
      this.state.viewMode === CollectionsManagement.ViewMode.DATASET_EXPLORER ||
      this.state.viewMode === CollectionsManagement.ViewMode.DATATYPE_EXPLORER ||
      this.state.viewMode === CollectionsManagement.ViewMode.DATASTRUCTURE_EXPLORER
    ) {
      return (
        <div ref={this.contentRef} style={{ overflowX: 'hidden', overflowY: 'auto', padding: '0 10px' }}>
          {this.state.workingPortletInstance.portletState === PortletState.NORMAL && (
            <SXPortlet
              key={this.state.workingPortletInstance.namespace}
              namespace={this.namespace}
              portletNamespace={this.state.workingPortletInstance.namespace}
              portletContent={this.state.workingPortletInstance.content}
            />
          )}
        </div>
      );
    } else {
      let height = window.innerHeight;

      if (this.boundingRect) {
        height = window.innerHeight - this.boundingRect.top;
      }

      let applicationTitle = Util.isEmpty(this.applicationTitle) ? this.buildApplicationTitle() : this.applicationTitle;

      if (Util.isEmpty(applicationTitle)) {
        applicationTitle = Util.translate('select-datacollection');
      }

      /*
      console.log(
        'CollectionManagement render: ',
        this.state.viewMode,
        applicationTitle,
        this.state.selectedNavItem,
        this.applicationBarButtons
      ); */

      return (
        <div>
          <div className="autofit-row" style={{ paddingTop: '5px', alignItems: 'stretch' }} ref={this.navRef}>
            {this.state.openVerticalNav && (
              <div
                className="autofit-col shrink"
                style={{
                  borderRight: '3px inset #e0dddd',
                  minWidth: '10%',
                  maxWidth: '50%',
                  padding: '5px 0 5px 5px'
                }}
              >
                <Rnd
                  default={{
                    x: 0,
                    y: 0,
                    width: 200,
                    height: '100%'
                  }}
                  minWidth={120}
                  maxWidth={500}
                  maxHeight="100%"
                  disableDragging={true}
                  enableResizing={{
                    top: false,
                    right: true,
                    bottom: false,
                    left: false,
                    topRight: false,
                    bottomRight: false,
                    bottomLeft: false,
                    topLeft: false
                  }}
                  style={{ paddingLeft: '5px', position: 'relative', width: '100%', height: '100%' }}
                >
                  <div
                    className="autofit-row"
                    style={{
                      backgroundColor: 'khaki',
                      margin: '5px 0',
                      height: '40px',
                      width: '100%'
                    }}
                  >
                    {this.state.viewMode === CollectionsManagement.ViewMode.FORM && (
                      <>
                        <div className="autofit-col autofit-col-expand">
                          <div style={{ display: 'inline', textAlign: 'center' }}>
                            <Icon symbol="forms" spritemap={this.spritemap} style={{ marginRight: '5px' }} />
                            <Text size={4} weight="bold">
                              {Util.translate('datacollection-management')}
                            </Text>
                          </div>
                        </div>
                        <div className="autofit-col">
                          <ClayButtonWithIcon
                            aria-label={Util.translate('add-datacollection')}
                            title={Util.translate('add-datacollection')}
                            displayType="unstyled"
                            symbol="plus"
                            style={{ marginRight: '10px' }}
                            onClick={this.handleAddDataCollection}
                            spritemap={this.spritemap}
                          />
                        </div>
                      </>
                    )}
                    {this.state.viewMode === CollectionsManagement.ViewMode.DATA && (
                      <div className="autofit-col autofit-col-expand">
                        <div style={{ display: 'inline', textAlign: 'center' }}>
                          <Icon symbol="analytics" spritemap={this.spritemap} style={{ marginRight: '5px' }} />
                          <Text size={4} weight="bold">
                            {Util.translate('data-management')}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                  <SXDataCollectionNavigationBar
                    key={this.state.refreshNav}
                    namespace={this.namespace}
                    formId={this.formId}
                    componentId={this.navbarId}
                    navItems={this.navItems}
                    orderable={this.state.viewMode === CollectionsManagement.ViewMode.FORM}
                    expandAll={true}
                    style={{
                      maxWidth: '100%'
                    }}
                    spritemap={this.spritemap}
                  />
                </Rnd>
              </div>
            )}
            <div className="autofit-col autofit-col-expand" style={{ height: '100%', padding: '5px' }}>
              <SXApplicationBar
                key={applicationTitle + this.state.viewMode}
                namespace={this.namespace}
                formId={this.namespace}
                applicationTitle={applicationTitle}
                verticalNavOpened={this.state.openVerticalNav}
                buttons={this.applicationBarButtons}
                spritemap={this.spritemap}
              />
              <div ref={this.contentRef} style={{ overflowX: 'hidden', overflowY: 'auto', padding: '0 10px' }}>
                {this.state.workingPortletInstance.portletState === PortletState.NORMAL && (
                  <SXPortlet
                    key={this.state.workingPortletInstance.namespace}
                    namespace={this.namespace}
                    portletNamespace={this.state.workingPortletInstance.namespace}
                    portletContent={this.state.workingPortletInstance.content}
                  />
                )}
              </div>
            </div>
          </div>
          {this.workbench.windowCount > 0 && <>{this.workbench.getWindowMap()}</>}
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
          {this.state.addDataCollectionWarning && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('confirm'),
                  onClick: (e) => {
                    this.openDataCollectionEditor();
                    this.setState({ addDataCollectionWarning: false });
                  },
                  displayType: 'secondary'
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ addDataCollectionWarning: false });
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

export default CollectionsManagement;
