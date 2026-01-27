import React from "react";
import { ClayVerticalNav } from "@clayui/nav";
import { Event } from "../../stationx/station-x";
import { Util } from "../../stationx/util";

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
		this.style = props.style;

		this.state = {
			expandedKeys: Util.isEmpty(this.navItems) ? new Set([]) : new Set(this.navItems.map((item) => item.id))
		};
	}

	listenerRefreshNaveBar = (event) => {
		const { targetPortlet, targetFormId, additinalExpandedKeys = [] } = event.dataPacket;

		if (!(this.namespace === targetPortlet && this.componentId === targetFormId)) {
			return;
		}

		console.log("[SXDataCollectionNavigationBar] REFRESH: ", this.state.expandedKeys);

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

	handleNavItemClick = (item) => {
		//console.log("[SXDataCollectionNavigationBar handleNavItemClick] ", item);

		Event.fire(Event.SX_NAVITEM_SELECTED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			params: {
				item: item
			}
		});
	};

	handleExpandedChange = (expandedKeys) => {
		this.setState({ expandedKeys: expandedKeys });
	};

	render() {
		//console.log("[Navigation render] ", this.navItems, this.state.expandedKeys);

		return (
			<ClayVerticalNav
				key={Util.randomKey()}
				aria-label="vertical navbar"
				active="6"
				//defaultExpandedKeys={new Set(defaultExpandedKeys)}
				items={this.navItems}
				large={false}
				decorated={true}
				expandedKeys={this.state.expandedKeys}
				onExpandedChange={this.handleExpandedChange}
				style={this.style}
				spritemap={this.spritemap}
			>
				{(item) => (
					<ClayVerticalNav.Item
						key={item.id}
						items={item.items}
						onClick={(event) => {
							event.stopPropagation();
							this.handleNavItemClick(item);
						}}
						spritemap={this.spritemap}
					>
						{item.label}
					</ClayVerticalNav.Item>
				)}
			</ClayVerticalNav>
		);
	}
}

export default SXDataCollectionNavigationBar;
