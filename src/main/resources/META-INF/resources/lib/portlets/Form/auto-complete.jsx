import React from "react";
import { Event } from "../../stationx/station-x";
import { ClayInput } from "@clayui/form";
import Autocomplete from "@clayui/autocomplete";
import { ClayButtonWithIcon } from "@clayui/button";
import { Util } from "../../stationx/util";

class SXAutoComplete extends React.Component {
	constructor(props) {
		super(props);

		this.id = props.id;
		this.namespace = props.namespace;
		this.formId = props.formId;
		this.items = props.items;
		this.itemLabelKey = props.itemLabelKey;
		this.itemFilterKey = props.itemFilterKey;
		this.itemValueKey = props.itemValueKey;
		this.label = props.label;
		this.disabled = props.disabled;
		this.symbol = props.symbol;
		this.spritemap = props.spritemap;

		this.selectedItem = {};
		this.state = {
			value: ""
		};

		console.log("[SXAutoComplete props] ", props);
	}

	handleInputChanged = (value) => {
		this.setState({ value: value });
	};

	handleSelectionSubmit = () => {
		Event.fire(Event.SX_AUTOCOMPLETE_SELECTED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			id: this.id,
			item: this.selectedItem
		});
	};

	render() {
		return (
			<div className="autofit-float-end-sm-down autofit-padded-no-gutters-x autofit-row">
				<div className="autofit-col">
					<ClayInput.Group>
						<ClayInput.GroupItem prepend>
							<Autocomplete
								aria-labelledby="autocomplete"
								id={this.id}
								defaultItems={this.items}
								menuTrigger={true}
								messages={{
									notFound: Util.translate("not-found")
								}}
								placeholder="Enter keywords..."
								disabled={this.disabled}
								filterKey={this.itemFilterKey}
								value={this.state.value}
								onChange={this.handleInputChanged}
								className="input-group-inset input-group-inset-after"
							>
								{(item) => (
									<Autocomplete.Item
										key={item[this.itemValueKey]}
										onClick={(e) => {
											this.selectedItem = item;
										}}
									>
										{item[this.itemLabelKey]}
									</Autocomplete.Item>
								)}
							</Autocomplete>
						</ClayInput.GroupItem>
						<div className="input-group-inset-item input-group-inset-item-after">
							<ClayButtonWithIcon
								aria-labelledby={this.label}
								title={this.label}
								symbol={this.symbol}
								spritemap={this.spritemap}
								displayType="secondary"
								disabled={Util.isEmpty(this.state.value)}
								borderless
								onClick={(e) => this.handleSelectionSubmit()}
							/>
						</div>
					</ClayInput.Group>
				</div>
			</div>
		);
	}
}

export default SXAutoComplete;
