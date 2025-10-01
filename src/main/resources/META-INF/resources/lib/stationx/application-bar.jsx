import { ButtonWithIcon } from "@clayui/core";
import Icon from "@clayui/icon";
import React from "react";
import { Util } from "./util";
import { Event } from "./station-x";

class SXApplicationBar extends React.Component {
	constructor(props) {
		super(props);

		//console.log("ApplicationBar props: ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;
		this.spritemap = props.spritemap;
		this.applicationTitle = props.applicationTitle;

		this.state = {
			verticalNavOpened: props.verticalNavOpened
		};
	}

	handleMenuOpen = (open) => {
		Event.fire(Event.SX_CLOSE_VERTICAL_NAV, this.namespace, this.namespace, {
			targetFormId: this.formId,
			open: open
		});

		this.setState({ verticalNavOpened: open });
	};

	render() {
		//console.log("ApplicationBar render: ", this.state.verticalNavOpened);
		return (
			<nav
				className="application-bar application-bar-dark navbar navbar-expand-md"
				style={{ height: "40px" }}
			>
				<ul className="navbar-nav">
					{this.state.verticalNavOpened && (
						<li className="nav-item">
							<ButtonWithIcon
								key={this.state.verticalNavOpened}
								aria-label={Util.translate("menu-opened")}
								title={Util.translate("menu-opened")}
								displayType="unstyled"
								symbol="product-menu-open"
								spritemap={this.spritemap}
								onClick={(event) => {
									this.handleMenuOpen(false);
								}}
							/>
						</li>
					)}
					{!this.state.verticalNavOpened && (
						<li className="nav-item">
							<ButtonWithIcon
								key={this.state.verticalNavOpened}
								aria-label={Util.translate("menu-closed")}
								title={Util.translate("menu-closed")}
								displayType="unstyled"
								symbol="product-menu-closed"
								spritemap={this.spritemap}
								onClick={(event) => {
									this.handleMenuOpen(true);
								}}
							/>
						</li>
					)}
				</ul>
				<div className="container-fluid container-fluid-max-xl">
					<ul className="navbar-nav"></ul>
					<div className="navbar-title navbar-text-truncate">{this.applicationTitle}</div>
					<ul className="navbar-nav"></ul>
				</div>
			</nav>
		);
	}
}

export default SXApplicationBar;
