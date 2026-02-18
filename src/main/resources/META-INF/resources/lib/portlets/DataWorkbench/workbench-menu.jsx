import React from "react";
import NavigationBar from "@clayui/navigation-bar";
import Link from "@clayui/link";
import DropDown from "@clayui/drop-down";
import { Event } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { Provider } from "@clayui/core";

class SXWorkbenchMenu extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.menuItems = props.menuItems;
		this.spritemap = this.spritemap;
		this.style = props.style;

		this.state = {
			active: "",
			label: "",
			dropDown: false
		};

		//console.log("SXWorkbenchMenu: ", props);
	}

	handleMenuItemClick = (menuId) => {
		Event.fire(Event.SX_MENU_SELECTED, this.namespace, this.namespace, {
			menuId: menuId
		});

		this.setState({ active: false });
	};

	render() {
		//console.log("SXWorkbenchMenu render: ", this.state.active);
		return (
			<NavigationBar
				spritemap={this.spritemap}
				style={{ ...this.style }}
			>
				{this.menuItems.map((menuItem) => {
					if (Util.isNotEmpty(menuItem.children)) {
						return (
							<NavigationBar.Item
								key={menuItem.id}
								style={{ marginRight: "10px" }}
								spritemap={this.spritemap}
							>
								<DropDown
									active={this.state.active === menuItem.id}
									alignmentByViewport={true}
									closeOnClick={true}
									trigger={
										<Link
											style={{ fontWeight: "550", fontSize: "1.0rem" }}
											spritemap={this.spritemap}
										>
											{menuItem.label}
										</Link>
									}
									onActiveChange={(val) => {
										let active = val ? menuItem.id : "";
										this.setState({ dropDown: val, active: active });
									}}
									style={{
										cursor: "pointer"
									}}
									spritemap={this.spritemap}
								>
									{this.state.active === menuItem.id && (
										<DropDown.ItemList
											items={menuItem.children}
											spritemap={this.spritemap}
										>
											{(item) => {
												return (
													<DropDown.Item
														key={item.id}
														onClick={(event) => {
															//console.log("menu item clicked: ", item);

															this.handleMenuItemClick(item.id);
														}}
														spritemap={this.spritemap}
													>
														{item.label}
													</DropDown.Item>
												);
											}}
										</DropDown.ItemList>
									)}
								</DropDown>
							</NavigationBar.Item>
						);
					} else {
						return (
							<NavigationBar.Item
								key={menuItem.id}
								active={this.state.active === menuItem.id}
								spritemap={this.spritemap}
							>
								<Link
									style={{ fontWeight: "550", fontSize: "1.0rem", cursor: "pointer" }}
									onClick={(event) => {
										this.setState({ active: menuItem.id });
										this.handleMenuItemClick(menuItem.id);
									}}
									spritemap={this.spritemap}
								>
									{menuItem.label}
								</Link>
							</NavigationBar.Item>
						);
					}
				})}
			</NavigationBar>
		);
	}
}

export default SXWorkbenchMenu;
