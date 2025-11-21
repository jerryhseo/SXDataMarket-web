import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayInput } from "@clayui/form";

class SXInputGroup extends SXBaseParameterComponent {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<ClayInput.Group
				small
				style={this.style}
			>
				<ClayInput.GroupItem>
					<ClayInput className="input-group-inset input-group-inset-after"></ClayInput>
				</ClayInput.GroupItem>
				<div className="input-group-inset-item input-group-inset-item-after">
					<ClayButtonWithIcon
						displayType="unstyled"
						symbol="search"
						spritemap={this.spritemap}
					/>
				</div>
			</ClayInput.Group>
		);
	}
}

export default SXInputGroup;
