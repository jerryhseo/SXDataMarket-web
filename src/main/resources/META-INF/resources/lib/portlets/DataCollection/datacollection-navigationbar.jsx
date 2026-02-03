import React from "react";
import { ClayVerticalNav } from "@clayui/nav";
import { Constant, Event } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import Icon from "@clayui/icon";
import CollectionsManagement from "./collections-management";

class SXDataCollectionNavigationBar extends React.Component {
	static NavTypes = {
		DATACOLLECTION: "dataCollection",
		DATASET: "dataSet",
		DATATYPE: "dataType"
	};

	constructor(props) {
		super(props);

		//console.log("SXDataCollectionNavigationBar: ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;
		this.componentId = props.componentId;
		this.navType = props.navType ?? SXDataCollectionNavigationBar.NavTypes.DATACOLLECTION;
		this.spritemap = props.spritemap;
		this.navItems = props.navItems;
		this.expandedKeys = props.expandedKeys;
		this.orderable = props.orderable;
		this.style = props.style;

		this.state = {
			expandedKeys: Util.isEmpty(this.navItems) ? new Set([]) : new Set(this.navItems.map((item) => item.id)),
			confirmItemSelectDialog: false,
			selectedItem: null
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;
	}

	listenerRefreshNaveBar = (event) => {
		const { targetPortlet, targetFormId, additinalExpandedKeys = [] } = event.dataPacket;

		if (!(this.namespace === targetPortlet && this.componentId === targetFormId)) {
			return;
		}

		//console.log("[SXDataCollectionNavigationBar] REFRESH: ", this.state.expandedKeys);

		additinalExpandedKeys.forEach((element) => {
			this.state.expandedKeys.add(element);
		});

		this.forceUpdate();
	};

	componentDidMount() {
		Event.on(Event.SX_REFRESH_NAVBAR, this.listenerRefreshNaveBar);
	}

	componentWillUnmount() {
		Event.off(Event.SX_REFRESH_NAVBAR, this.listenerRefreshNaveBar);
	}

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
		//console.log("[SXDataCollectionNavigationBar handleNavItemClick] ", item);
		const unsaved = this.hasUnsavedItem(this.navItems);

		if (unsaved && unsaved.id !== item.id) {
			this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
			this.dialogBody = Util.translate("item-does-not-saved-if-you-click-ok-all-changed-disappeared");

			this.setState({ confirmItemSelectDialog: true, selectedItem: item });
		} else {
			this.fireNavItemSelected(item);
		}
	};

	handleExpandedChange = (expandedKeys) => {
		this.setState({ expandedKeys: expandedKeys });
	};

	handleOrderChange(item, index, direction) {
		if (direction === "up") {
		} else {
		}
	}

	fireNavItemSelected = (item) => {
		Event.fire(Event.SX_NAVITEM_SELECTED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			item: item
		});
	};

	render() {
		//console.log("[Navigation render] ", this.navItems, this.state.expandedKeys);

		return (
			<>
				<ClayVerticalNav
					key={Util.randomKey()}
					aria-label="vertical navbar"
					items={this.navItems}
					large={false}
					decorated={true}
					expandedKeys={this.state.expandedKeys}
					onExpandedChange={this.handleExpandedChange}
					style={this.style}
					spritemap={this.spritemap}
				>
					{(item, index) => {
						const itemStyle = {};

						if (item.active) {
							itemStyle.fontWeight = "bold";
							itemStyle.color = "green";
						} else {
							itemStyle.fontWeight = "normal";
							itemStyle.color = "gray";
						}

						if (item.dirty) {
							itemStyle.color = "red";
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
						header={this.dialogHeader}
						body={this.dialogBody}
						buttons={[
							{
								label: Util.translate("confirm"),
								onClick: (e) => {
									this.fireNavItemSelected(this.state.selectedItem);
									this.setState({ confirmItemSelectDialog: false });
								},
								displayType: "secondary"
							},
							{
								label: Util.translate("cancel"),
								onClick: (e) => {
									this.setState({ confirmItemSelectDialog: false });
								}
							}
						]}
					/>
				)}
			</>
		);
	}
}

export default SXDataCollectionNavigationBar;
