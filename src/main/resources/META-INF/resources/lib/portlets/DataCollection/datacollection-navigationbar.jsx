import React from "react";
import { ClayVerticalNav } from "@clayui/nav";

class SXDataCollectionNavigationBar extends React.Component {
	constructor(props) {
		super(props);

		//console.log("SXDataCollectionNavigationBar: ", props);
		this.namespace = props.namespace;
		this.spritemap = props.spritemap;
		this.navItems = props.navItems;
		this.style = props.style;
	}

	render() {
		return (
			<ClayVerticalNav
				aria-label="vertical navbar"
				active="6"
				defaultExpandedKeys={new Set(["5"])}
				items={this.navItems}
				large={false}
				style={this.style}
				spritemap={this.spritemap}
			>
				{(item) => (
					<ClayVerticalNav.Item
						href={item.href}
						items={item.items}
						key={item.id}
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
