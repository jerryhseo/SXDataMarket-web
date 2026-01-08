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

		console.log("SXDataCollectionNavigationBar: ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;
		this.dataCollectionId = props.dataCollectionId;
		this.dataSetId = props.dataSetId;
		this.dataTypeId = props.dataTypeId;
		this.navType = props.navType ?? SXDataCollectionNavigationBar.NavTypes.DATACOLLECTION;
		this.spritemap = props.spritemap;
		this.navItems = props.navItems;
		this.style = props.style;
	}

	handleNavItemClick = (item) => {
		console.log("[SXDataCollectionNavigationBar handleNavItemClick] ", item);

		Event.fire(Event.SX_NAVITEM_SELECTED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			params: {
				item: item
			}
		});
	};

	render() {
		return (
			<ClayVerticalNav
				aria-label="vertical navbar"
				active="6"
				defaultExpandedKeys={new Set(["5"])}
				items={this.navItems}
				large={false}
				decorated={true}
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
