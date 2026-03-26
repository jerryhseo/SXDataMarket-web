import React from 'react';
import { ClayVerticalNav } from '@clayui/nav';
import { Constant, Event } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import Icon from '@clayui/icon';
import CollectionsManagement from './collections-management';
import { Provider } from '@clayui/core';

class SXDataCollectionNavigationBar extends React.Component {
  static NavTypes = {
    DATACOLLECTION: 'dataCollection',
    DATASET: 'dataSet',
    DATATYPE: 'dataType'
  };

  constructor(props) {
    super(props);

    console.log('SXDataCollectionNavigationBar: ', props);
    this.namespace = props.namespace;
    this.formId = props.formId;
    this.componentId = props.componentId;
    this.navType = props.navType ?? SXDataCollectionNavigationBar.NavTypes.DATACOLLECTION;
    this.spritemap = props.spritemap;
    this.expandAll = props.expandAll ?? false;
    this.orderable = props.orderable;
    this.style = props.style;

    const navItems = props.navItems ?? [];
    this.state = {
      navItems: navItems,
      expandedKeys: this.expandAll ? this.getAllExpandKeys(navItems) : new Set(),
      confirmItemSelectDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      toBeSelectedItem: null,
      selectedItem: null
    };
  }

  listenerRefreshNaveBar = (event) => {
    const {
      targetPortlet,
      targetFormId,
      navItems,
      selectedNavItem,
      additionalExpandedKeys = [],
      removedExpandedKeys = []
    } = event.dataPacket;

    if (!(this.namespace === targetPortlet && this.componentId === targetFormId)) {
      //console.log('[SXDataCollectionNavigationBar] REFRESH rejectred: ', targetPortlet);
      return;
    }

    console.log(
      '[SXDataCollectionNavigationBar] REFRESH: ',
      navItems,
      selectedNavItem,
      additionalExpandedKeys,
      removedExpandedKeys,
      this.state.expandedKeys
    );

    additionalExpandedKeys.forEach((element) => {
      this.state.expandedKeys.add(element);
    });

    removedExpandedKeys.forEach((element) => {
      this.state.expandedKeys.delete(element);
    });

    if (navItems) {
      this.setState({
        navItems: [...navItems],
        expandedKeys: this.expandAll ? this.getAllExpandKeys(navItems) : this.state.expandedKeys,
        selectedNavItem: selectedNavItem ? selectedNavItem : this.state.selectedItem
      });
    } else {
      this.forceUpdate();
    }
  };

  componentDidMount() {
    Event.on(Event.SX_REFRESH_NAVBAR, this.listenerRefreshNaveBar);
  }

  componentWillUnmount() {
    Event.off(Event.SX_REFRESH_NAVBAR, this.listenerRefreshNaveBar);
  }

  getAllExpandKeys = (navItems) => {
    let expandedKeys = new Set([]);

    navItems.map((item) => {
      expandedKeys.add(item.id);

      if (item.items) {
        const subExpadedKeys = this.getAllExpandKeys(item.items);

        expandedKeys = new Set([...expandedKeys, ...subExpadedKeys]);
      }
    });

    //console.log("getAllExpandKeys: ", expandedKeys);
    return expandedKeys;
  };

  hasUnsavedItem(items) {
    let unsaved = null;

    items.every((item) => {
      if (item.dirty) {
        unsaved = item;
      } else if (Util.isNotEmpty(item.items)) {
        unsaved = this.hasUnsavedItem(item.items);
      }

      return unsaved ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
    });

    return unsaved;
  }

  handleNavItemClick = (item) => {
    //console.log('[SXDataCollectionNavigationBar handleNavItemClick] ', item);
    const unsaved = this.state.selectedItem ? this.state.selectedItem.dirty : false;

    if (unsaved && this.state.selectedItem !== item) {
      this.setState({
        confirmItemSelectDialog: true,
        toBeSelectedItem: item,
        dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
        dialogBody: Util.translate('item-does-not-saved-if-you-click-ok-all-changed-disappeared')
      });
    } else {
      this.fireNavItemSelected(item);
    }
  };

  handleExpandedChange = (expandedKeys) => {
    this.setState({ expandedKeys: expandedKeys });
  };

  fireNavItemSelected = (item) => {
    if (this.state.selectedItem === item) {
      console.log('Same Nav Item clicked: Do nothing!');
      return;
    } else if (this.state.selectedItem !== null) {
      this.state.selectedItem.dirty = false;
      this.state.selectedItem.active = false;
    }

    item.active = true;

    this.setState({ selectedItem: item, toBeSelectedItem: null });

    Event.fire(Event.SX_NAVITEM_SELECTED, this.namespace, this.namespace, {
      targetFormId: this.formId,
      prevItem: this.state.selectedItem,
      item: item
    });
  };

  render() {
    console.log('[Navigation render] ', this.state.navItems, this.state.selectedItem, this.state.expandedKeys);

    return (
      <Provider spritemap={this.spritemap}>
        <ClayVerticalNav
          key={this.state.selectedItem?.id}
          aria-label="vertical navbar"
          items={this.state.navItems}
          large={false}
          decorated={true}
          expandedKeys={this.state.expandedKeys}
          onExpandedChange={this.handleExpandedChange}
          style={this.style}
          spritemap={this.spritemap}
        >
          {(item) => {
            //console.log('NavItem: ', item.label, item.id, item.modelId);
            const itemStyle = {};

            if (item.active) {
              itemStyle.fontWeight = 'bold';
              itemStyle.color = 'green';
            } else {
              itemStyle.fontWeight = 'normal';
              itemStyle.color = 'gray';
            }

            if (item.dirty) {
              itemStyle.color = 'red';
            }

            return (
              <ClayVerticalNav.Item
                key={item.id}
                items={item.items}
                onClick={(event) => {
                  event.stopPropagation();
                  this.handleNavItemClick(item);
                }}
                spritemap={this.spritemap}
                textValue={item.label}
              >
                <span style={itemStyle}>{item.label}</span>
              </ClayVerticalNav.Item>
            );
          }}
        </ClayVerticalNav>
        {this.state.confirmItemSelectDialog && (
          <SXModalDialog
            header={this.state.dialogHeader}
            body={this.state.dialogBody}
            buttons={[
              {
                label: Util.translate('confirm'),
                onClick: (e) => {
                  this.fireNavItemSelected(this.state.toBeSelectedItem);
                  this.setState({ confirmItemSelectDialog: false });
                },
                displayType: 'secondary'
              },
              {
                label: Util.translate('cancel'),
                onClick: (e) => {
                  this.setState({ confirmItemSelectDialog: false, toBeSelectedItem: null });
                }
              }
            ]}
            spritemap={this.spritemap}
          />
        )}
      </Provider>
    );
  }
}

export default SXDataCollectionNavigationBar;
