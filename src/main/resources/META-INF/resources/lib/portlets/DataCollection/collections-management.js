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
    this.applicationBarRefreshKey = Util.nowTime();

    this.idsToBeDeleted = [];
  }

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[collectionManagement] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log('[collectionManagement] listenerWorkbenchReady received: ', event.dataPacket);
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
    const { targetPortlet, targetFormId, prevItem, item } = event.dataPacket;
    if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
      //console.log("[CollectionManagement listenerNavItemSelected rejected] ", params, this.formId);
      return;
    }

    //console.log('[CollectionManagement listenerNavItemSelected] ', prevItem, item);

    let portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
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

          this.applicationBarButtons = [
            {
              id: 'addDataSet',
              label: Util.translate('add-dataset'),
              symbol: 'plus'
            }
          ];
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

          this.applicationBarButtons = [
            {
              id: 'addDataType',
              label: Util.translate('add-datatype'),
              symbol: 'plus'
            }
          ];
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

        //console.log('DataType NavItemSelected: ', parent.parent.modelId, parent.modelId, Number(modelId));

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          portletName = PortletKeys.DATATYPE_VIEWER;

          this.applicationBarButtons = [
            {
              id: 'editDataStructure',
              label: Util.translate('edit-datastructure'),
              symbol: 'pencil'
            }
          ];
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
    }

    this.setState({ selectedNavItem: item });
    this.applicationBarRefreshKey = Util.nowTime();

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
      //console.log('[CollectionsManagement] listenerResponce rejected: ', targetPortlet);
      return;
    }

    console.log('[CollectionsManagement] listenerResponse: ', requestId, params, data);

    const { error, message } = data;
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
            id: dataCollection.key,
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
                id: dataSet.key,
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
                    id: dataType.key,
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

        this.fireNavRefresh({
          navItems: this.navItems
        });

        break;
      }
      case RequestIDs.deleteDataCollections: {
        const { deletedDataCollections, failedDataCollections } = data;

        deletedDataCollections.forEach((collectionId) => console.log(typeof collectionId, collectionId));

        const removedNavItems = [];
        this.navItems = this.navItems.filter((navItem) => {
          if (deletedDataCollections.includes(navItem.modelId)) {
            removedNavItems.push(navItem.id);

            return false;
          } else {
            return true;
          }
        });

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
        this.applicationTitle = '';

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        this.setState({
          selectedNavItem: null
          //refreshNav: Util.nowTime()
        });

        this.fireNavRefresh({
          navItems: this.navItems
        });

        this.applicationBarRefreshKey = Util.nowTime();
        break;
      }
      case RequestIDs.addDataCollection: {
        const { dataCollection, associatedDataSets } = data;

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        if (this.state.selectedNavItem) {
          this.state.selectedNavItem.dirty = false;
          this.state.selectedNavItem.active = false;
        }

        let dataCollectionNavItem = {
          id: dataCollection.dataCollectionId,
          modelId: dataCollection.dataCollectionId,
          label: dataCollection.displayName,
          verified: dataCollection.verified,
          freezed: dataCollection.freezed,
          dirty: false,
          active: true,
          type: CollectionsManagement.ItemTypes.COLLECTION
        };

        dataCollectionNavItem = this.buildDataCollectionNavItem(dataCollectionNavItem, associatedDataSets);
        this.navItems.unshift(dataCollectionNavItem);

        this.setState({
          selectedNavItem: dataCollectionNavItem
        });
        //this.applicationTitle = '';

        this.fireNavRefresh({
          navItems: this.navItems,
          selectedNavItem: dataCollectionNavItem
        });

        break;
      }
      case RequestIDs.saveDataCollection: {
        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.COLLECTION) {
          const { dataCollection, associatedDataSets } = data;

          let dataCollectionNavItem = this.state.selectedNavItem;

          dataCollectionNavItem.id = dataCollection.dataCollectionId;
          dataCollectionNavItem.modelId = dataCollection.dataCollectionId;
          dataCollectionNavItem.label = dataCollection.displayName;
          dataCollectionNavItem.verified = dataCollection.verified;
          dataCollectionNavItem.freezed = dataCollection.freezed;
          dataCollectionNavItem.dirty = false;
          dataCollectionNavItem.active = true;

          dataCollectionNavItem = this.buildDataCollectionNavItem(dataCollectionNavItem, associatedDataSets);

          this.setState({
            selectedNavItem: dataCollectionNavItem
          });

          this.fireNavRefresh({});
        }

        break;
      }
      case RequestIDs.deleteDataSets: {
        const { deletedDataSets, failedDataSets } = data;
        console.log('CollectionManagement.response deleteDataSets: ', deletedDataSets);
        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
          requestId: RequestIDs.searchDataCollections
        });
        /*
        this.navItems.forEach((navItem) => {
          navItem.items = navItem.items.filter((dataSetItem) => !deletedDataSets.includes(dataSetItem.modelId));
        });

        console.log('navItems: ', this.navItems);

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        this.setState({
          selectedNavItem: this.state.selectedNavItem.parent,
          refreshNav: Util.nowTime()
        });

        this.fireNavRefresh({
          additionalExpandedKeys: [this.state.selectedNavItem.parent.id],
          removedExpandedKeys: deletedDataSets
        });
        */

        break;
      }
      case RequestIDs.addDataSet: {
        const { dataSet, associatedDataTypeList } = data;

        //console.log('[DataSetEditor.listenerResponse.addDataSet]: ', dataSet, associatedDataTypeList);

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        //console.log('this.state.selectedNavItem: ', dataSet, this.state.selectedNavItem);

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          let dataCollectionNavItem;

          if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.COLLECTION) {
            dataCollectionNavItem = this.state.selectedNavItem;
            dataCollectionNavItem.dirty = false;
            dataCollectionNavItem.active = false;

            dataCollectionNavItem.id = Util.randomKey(16);

            let dataSetNavItem = {
              id: dataSet.key,
              parent: dataCollectionNavItem,
              modelId: dataSet.dataSetId,
              label: dataSet.displayName,
              verified: dataSet.verified,
              freezed: dataSet.freezed,
              dirty: false,
              active: true,
              type: CollectionsManagement.ItemTypes.DATASET
            };

            dataSetNavItem = this.buildDataSetNavItem(dataSetNavItem, associatedDataTypeList);

            if (dataCollectionNavItem) {
              if (!dataCollectionNavItem.items) {
                dataCollectionNavItem.items = [];
              }
              dataCollectionNavItem.items.unshift(dataSetNavItem);

              this.setState({
                selectedNavItem: dataSetNavItem
              });
            }

            this.fireNavRefresh({
              navItems: this.navItems,
              selectedNavItem: dataSetNavItem
            });
          } else {
            console.log('DataSet should be added under DataCollection when the ViewMode is FORM.');
          }
        }

        break;
      }
      case RequestIDs.saveDataSet: {
        //console.log('[DataSetEditor.listenerResponse.saveDataSet]: ', dataSet, associatedDataTypeList);

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        //console.log('this.state.selectedNavItem: ', dataSet, this.state.selectedNavItem);

        if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATASET) {
          const { dataSet, associatedDataTypeList } = data;

          let dataSetNavItem = this.state.selectedNavItem;
          dataSetNavItem.dirty = false;
          dataSetNavItem.active = true;

          dataSetNavItem.id = dataSet.dataSetId;
          dataSetNavItem.modelId = dataSet.dataSetId;
          dataSetNavItem.label = dataSet.displayName;
          dataSetNavItem.verified = dataSet.verified;
          dataSetNavItem.freezed = dataSet.freezed;
          dataSetNavItem.dirty = false;
          dataSetNavItem.active = true;

          dataSetNavItem = this.buildDataSetNavItem(dataSetNavItem, associatedDataTypeList);

          this.setState({
            selectedNavItem: dataSetNavItem,
            refreshNav: Util.nowTime()
          });
        }

        break;
      }
      case RequestIDs.addDataType: {
        const { dataType, associatedDataTypes = [] } = data;

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        if (this.state.viewMode === CollectionsManagement.ViewMode.FORM) {
          if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATASET) {
            const dataSetNavItem = this.state.selectedNavItem;

            dataSetNavItem.dirty = false;
            dataSetNavItem.active = false;
            dataSetNavItem.id = Util.randomKey(16);
            dataSetNavItem.parent.id = Util.randomKey(16);

            let dataTypeNavItem = {
              id: dataType.dataTypeId,
              parent: dataSetNavItem,
              modelId: dataType.dataTypeId,
              label: dataType.displayName,
              verified: dataType.verified,
              freezed: dataType.freezed,
              hasDataStructure: dataType.hasDataStructure,
              dirty: false,
              active: true,
              type: CollectionsManagement.ItemTypes.DATATYPE
            };

            dataSetNavItem.items.unshift(dataTypeNavItem);

            this.setState({
              selectedNavItem: dataTypeNavItem
            });

            this.fireNavRefresh({
              navItems: this.navItems,
              selectedNavItem: dataTypeNavItem
            });
          } else {
            console.log('DataType should be added under DataSet when the ViewMode is FORM.');
          }
        }

        break;
      }
      case RequestIDs.saveDataType: {
        const { dataType, associatedDataTypes = [] } = data;

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });

        //console.log("this.state.selectedNavItem: ", dataSet, JSON.stringify(this.state.selectedNavItem, null, 4));
        if (this.state.selectedNavItem?.type === CollectionsManagement.ItemTypes.DATATYPE) {
          let dataTypeNavItem = this.state.selectedNavItem;

          dataTypeNavItem.id = dataType.dataTypeId;
          dataTypeNavItem.modelId = dataType.dataTypeId;
          dataTypeNavItem.label = dataType.displayName;
          dataTypeNavItem.verified = dataType.verified;
          dataTypeNavItem.freezed = dataType.freezed;
          dataTypeNavItem.hasDataStructure = dataType.hasDataStructure;
          dataTypeNavItem.dirty = false;
          dataTypeNavItem.active = true;

          this.setState({
            selectedNavItem: dataTypeNavItem,
            refreshNav: Util.nowTime()
          });
        }

        break;
      }
      case RequestIDs.deleteDataTypes: {
        const { deletedDataTypes, failedDataTypes } = data;
        console.log('CollectionManagement.response deleteDataTypes: ', deletedDataTypes);

        Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
          requestId: RequestIDs.searchDataCollections
        });

        this.workbench.fireResponse({
          targetPortlet: this.state.workingPortletInstance.namespace,
          requestId: requestId,
          params: params,
          data: data
        });
        /*
        this.navItems.forEach((navItem) => {
          navItem.items = navItem.items.filter((dataTypeItem) => !deletedDataTypes.includes(dataTypeItem.modelId));
        });

        console.log('navItems: ', this.navItems);

        
        this.setState({
          selectedNavItem: this.state.selectedNavItem?.parent,
          refreshNav: Util.nowTime()
        });

        this.fireNavRefresh({
          additionalExpandedKeys: [this.state.selectedNavItem?.parent?.id],
          removedExpandedKeys: deletedDataSets
        });
        */

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

  /**
   * Listens requests of child portlets.
   *
   * @param {*} event
   * @returns
   */
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

    //console.log('[CollectionsManagement listenerChangeViewMode] ', viewMode, this.state.selectedNavItem);

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
          this.setState({
            infoDialog: true,
            dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
            dialogBody: Util.translate('datatype-has-no-data-structure')
          });
        } else {
          portletName = PortletKeys.STRUCTURED_DATA_EXPLORER;
        }

        break;
      }
      case CollectionsManagement.ViewMode.DATACOLLECTION_EXPLORER: {
        portletName = PortletKeys.DATACOLLECTION_EXPLORER;
        this.setState({ selectedNavItem: null });

        break;
      }
      case CollectionsManagement.ViewMode.DATASET_EXPLORER: {
        portletName = PortletKeys.DATASET_EXPLORER;
        this.setState({ selectedNavItem: null });

        break;
      }
      case CollectionsManagement.ViewMode.DATATYPE_EXPLORER: {
        portletName = PortletKeys.DATATYPE_EXPLORER;
        this.setState({ selectedNavItem: null });

        break;
      }
      case CollectionsManagement.ViewMode.DATASTRUCTURE_EXPLORER: {
        portletName = PortletKeys.DATASTRUCTURE_EXPLORER;
        this.setState({ selectedNavItem: null });

        break;
      }
    }

    const portletParams = this.getDeployPortletParams(viewMode);
    this.applicationBarRefreshKey = Util.nowTime();

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
        if (this.state.selectedNavItem?.dirty) {
          this.state.selectedNavItem.dirty = false;
        }

        portletName = PortletKeys.DATASET_EDITOR;

        break;
      }
      case 'addDataType': {
        if (this.state.selectedNavItem?.dirty) {
          this.state.selectedNavItem.dirty = false;
        }

        portletName = PortletKeys.DATATYPE_EDITOR;
        //console.log("dataCollectionId: ", this.state.selectedNavItem, this.state);

        break;
      }
      case 'editDataStructure': {
        if (this.state.selectedNavItem?.dirty) {
          this.state.selectedNavItem.dirty = false;
        }

        portletName = PortletKeys.DATASTRUCTURE_BUILDER;
        //console.log("dataCollectionId: ", this.state.selectedNavItem, this.state);

        break;
      }
    }

    if (this.state.workingPortletInstance.portletName === portletName) {
      return;
    }

    let params = this.getDeployPortletParams();
    this.applicationBarRefreshKey = Util.nowTime();

    this.deployPortlet({
      portletName: portletName,
      params: {
        ...params
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

    if (this.state.selectedNavItem) {
      this.state.selectedNavItem.dirty = true;
      this.fireNavRefresh({ additionalExpandedKeys: [this.state.selectedNavItem.id] });
    }
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

  listenerAddDataCollection = (event) => {
    const { targetPortlet, dataCollection } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerAddDataCollection REJECTED] ", event.dataPacket);
      return;
    }
    /*
		console.log(
			"[CollectionsManagement listenerAddDataCollection] ",
			this.state.selectedNavItem,
			dataCollection
		); */

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.addDataCollection,
      params: dataCollection
    });
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

  listenerAddDataSet = (event) => {
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
      //console.log("[CollectionsManagement listenerAddDataSet REJECTED] ", event.dataPacket);
      return;
    }

    console.log(
      '[CollectionsManagement listenerAddDataSet] ',
      dataCollectionId,
      dataSetId,
      dataSetCode,
      dataSetVersion,
      displayName,
      description,
      associatedDataTypes
    );

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
      requestId: RequestIDs.addDataSet,
      params: params
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
      '[CollectionsManagement listenerSaveDataSet] ',
      dataCollectionId,
      dataSetId,
      dataSetCode,
      dataSetVersion,
      displayName,
      description,
      associatedDataTypes
    );
    */

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
    this.applicationBarRefreshKey = Util.nowTime();

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.deleteDataSets,
      params: {
        dataCollectionId: dataCollectionId ?? params.dataCollectionId,
        dataSetIds: dataSetIds
      }
    });
  };

  listenerAddDataType = (event) => {
    const {
      targetPortlet,
      dataCollectionId,
      dataSetId,
      dataTypeCode,
      dataTypeVersion,
      extension,
      displayName,
      description,
      visualizers,
      dataStructureId
    } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[CollectionsManagement listenerAddDataType REJECTED] ", event.dataPacket);
      return;
    }

    console.log(
      '[CollectionsManagement listenerAddDataType] ',
      dataCollectionId,
      dataSetId,
      dataTypeCode,
      dataTypeVersion,
      extension,
      visualizers,
      dataStructureId
    );

    this.workbench.processRequest({
      requestPortlet: this.namespace,
      requestId: RequestIDs.addDataType,
      params: {
        dataCollectionId: dataCollectionId,
        dataSetId: dataSetId,
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

    console.log(
      '[CollectionsManagement listenerSaveDataType] ',
      dataCollectionId,
      dataSetId,
      dataTypeId,
      dataTypeCode,
      dataTypeVersion,
      extension,
      visualizers,
      dataStructureId
    );

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
    this.applicationBarRefreshKey = Util.nowTime();

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
    Event.on(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
    Event.on(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
    Event.on(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
    Event.on(Event.SX_REDIRECT_TO, this.listenerRedirectTo);
    Event.on(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
    Event.on(Event.SX_DELETE_DATACOLLECTIONS, this.listenerDeleteDataCollections);
    Event.on(Event.SX_ADD_DATACOLLECTION, this.listenerAddDataCollection);
    Event.on(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
    Event.on(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
    Event.on(Event.SX_ADD_DATASET, this.listenerAddDataSet);
    Event.on(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
    Event.on(Event.SX_DELETE_DATASETS, this.listenerDeleteDataSets);
    Event.on(Event.SX_ADD_DATATYPE, this.listenerAddDataType);
    Event.on(Event.SX_DATATYPE_CHANGED, this.listenerDataTypeChanged);
    Event.on(Event.SX_SAVE_DATATYPE, this.listenerSaveDataType);
    Event.on(Event.SX_DELETE_DATATYPES, this.listenerDeleteDataTypes);

    window.addEventListener('resize', this.listenerWindowResize);

    this.boundingRect = this.navRef.current.getBoundingClientRect();

    this.fireHandshake();

    this.buildApplicationTitle();

    Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
      requestId: RequestIDs.searchDataCollections
    });
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
    Event.off(Event.SX_NAVITEM_SELECTED, this.listenerNavItemSelected);
    Event.off(Event.SX_CHANGE_VIEWMODE, this.listenerChangeViewMode);
    Event.off(Event.SX_APPLICATION_BAR_BTN_CLICKED, this.listenerApplicationBarBtnClicked);
    Event.off(Event.SX_REDIRECT_TO, this.listenerRedirectTo);
    Event.off(Event.SX_DATACOLLECTION_CHANGED, this.listenerDataCollectionChanged);
    Event.off(Event.SX_DELETE_DATACOLLECTIONS, this.listenerDeleteDataCollections);
    Event.off(Event.SX_ADD_DATACOLLECTION, this.listenerAddDataCollection);
    Event.off(Event.SX_SAVE_DATACOLLECTION, this.listenerSaveDataCollection);
    Event.off(Event.SX_DATASET_CHANGED, this.listenerDataSetChanged);
    Event.off(Event.SX_ADD_DATASET, this.listenerAddDataSet);
    Event.off(Event.SX_SAVE_DATASET, this.listenerSaveDataSet);
    Event.off(Event.SX_DELETE_DATASETS, this.listenerDeleteDataSets);
    Event.off(Event.SX_ADD_DATATYPE, this.listenerAddDataType);
    Event.off(Event.SX_SAVE_DATATYPE, this.listenerSaveDataType);
    Event.off(Event.SX_DELETE_DATATYPES, this.listenerDeleteDataTypes);
    Event.off(Event.SX_DATATYPE_CHANGED, this.listenerDataTypeChanged);

    window.removeEventListener('resize', this.listenerWindowResize);
  };

  fireNavRefresh({ navItems, selectedNavItem, additionalExpandedKeys = [], removedExpandedKeys = [] }) {
    //console.log('fireNavRefresh: ', additionalExpandedKeys, removedExpandedKeys);
    this.applicationTitle = '';
    this.applicationBarRefreshKey = Util.nowTime();

    Event.fire(Event.SX_REFRESH_NAVBAR, this.namespace, this.namespace, {
      targetFormId: this.navbarId,
      navItems,
      selectedNavItem,
      additionalExpandedKeys,
      removedExpandedKeys
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

  buildDataCollectionNavItem(collectionNavItem, dataSetList) {
    const dataSetNavItems = dataSetList.map((dataSet) => ({
      id: dataSet.dataSetId,
      parent: collectionNavItem,
      modelId: dataSet.dataSetId,
      label: dataSet.displayName,
      items: dataSet.dataTypeList,
      verified: dataSet.verified ?? { verified: false },
      freezed: dataSet.freezed ?? { freezed: false },
      type: CollectionsManagement.ItemTypes.DATASET
    }));

    dataSetNavItems.items = dataSetNavItems.forEach((dataSetNavItem) =>
      this.buildDataSetNavItem(dataSetNavItem, dataSetNavItem.items)
    );

    collectionNavItem.items = dataSetNavItems;

    return collectionNavItem;
  }

  buildDataSetNavItem(dataSetNavItem, dataTypeList) {
    const dataTypeNavItems = dataTypeList.map((dataType) => ({
      id: dataType.dataTypeId,
      parent: dataSetNavItem,
      modelId: dataType.dataTypeId,
      label: dataType.displayName,
      items: dataType.dataTypeList,
      verified: dataType.verified ?? { verified: false },
      freezed: dataType.freezed ?? { freezed: false },
      type: CollectionsManagement.ItemTypes.DATATYPE
    }));

    dataSetNavItem.items = dataTypeNavItems;

    return dataSetNavItem;
  }

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

  applySelectedNavItemChanged = ({
    id,
    parent,
    modelId,
    label,
    verified = { verified: false },
    freezed = { freezed: false },
    items,
    active = true,
    dirty = true
  }) => {
    this.setState({
      selectedNavItem: {
        id: id,
        parent: parent,
        modelId: modelId,
        label: label,
        verified: verified,
        freezed: freezed,
        items: items,
        active: active,
        dirty: dirty
      }
    });
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
          this.applicationBarButtons = [
            {
              id: 'editDataStructure',
              label: Util.translate('edit-datastructure'),
              symbol: 'pencil'
            }
          ];
        }
        break;
      }
    }

    const portletParams = {
      dataCollectionId: dataCollectionId,
      dataSetId: dataSetId,
      dataTypeId: dataTypeId
    };

    this.applicationBarRefreshKey = Util.nowTime();

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
    //console.log('[CollectionManagement openDataCollectionEditor] ', this.state.selectedNavItem);
    if (!this.state.selectedNavItem) {
      this.applicationBarButtons = [];
    }

    this.applicationTitle = Util.translate('add-datacollection');

    this.deployPortlet({
      portletName: PortletKeys.DATACOLLECTION_EDITOR,
      portletState: PortletState.NORMAL
    });

    this.applicationBarRefreshKey = Util.nowTime();

    if (this.state.selectedNavItem) {
      this.state.selectedNavItem.active = false;
      this.state.selectedNavItem.dirty = false;

      this.fireNavRefresh();
    }
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
        applicationTitle =
          this.state.viewMode === CollectionsManagement.ViewMode.FORM
            ? Util.translate('select-datacollection')
            : this.state.viewMode === CollectionsManagement.ViewMode.DATA
              ? Util.translate('data-management')
              : '';
      }

      /*
      console.log(
        'CollectionManagement render: ',
        this.state.viewMode,
        applicationTitle,
        this.state.selectedNavItem,
        this.applicationBarButtons
      );
      */
      /*
      let maxHeight = '100%';
      if (this.navRef.current) {
        const navHeight = this.navRef.current.getBoundingClientRect().height;
        maxHeight = `calc(100vh - ${navHeight}px)`;
        console.log('navHeight: ', navHeight, maxHeight);
      }
      */

      return (
        <>
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
                key={this.applicationBarRefreshKey}
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
        </>
      );
    }
  }
}

export default CollectionsManagement;
