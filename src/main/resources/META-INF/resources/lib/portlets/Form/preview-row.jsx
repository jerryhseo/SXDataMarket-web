import React from "react";
import DropDown from "@clayui/drop-down";
import { Event, ParamType } from "../../stationx/station-x";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayButtonWithIcon } from "@clayui/button";
import Icon from "@clayui/icon";
import { Util } from "../../stationx/util";
import ParameterConstants from "../Parameter/parameter-constants";

class SXPreviewRow extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.actionItems = props.actionItems;

		this.state = {
			activeDropdown: props.activeActionItems
		};

		//console.log("[SXPreviewRow] props: ", props);
	}

	listenerRefreshPreview = (event) => {
		const { targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0" } = event.dataPacket;

		if (
			targetPortlet !== this.namespace ||
			targetFormId !== this.formId ||
			paramCode !== this.parameter.paramCode ||
			paramVersion !== this.parameter.paramVersion
		) {
			//console.log("[SXPreviewRow] listenerRefreshPreview Rejected: ", event.dataPacket);
			return;
		}
		//console.log("[SXPreviewRow] listenerRefreshPreview: ", this.parameter);

		this.forceUpdate();
	};

	componentDidMount() {
		Event.on(Event.SX_REFRESH_PREVIEW, this.listenerRefreshPreview);

		if (this.parameter.focused && this.focusRef.current) {
			this.focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}

	componentWillUnmount() {
		Event.off(Event.SX_REFRESH_PREVIEW, this.listenerRefreshPreview);
	}

	handleClick = (event) => {
		event.stopPropagation();

		//console.log("SXPreviewRow.handleClick: ", this.parameter);

		if (!this.parameter.focused) {
			this.parameter.fireParameterSelected();
		}
	};

	handleActionClick(actionId) {
		//console.log("SXPreviewRow: ", actionId, this.parameter, this.formId);

		switch (actionId) {
			case "group": {
				this.parameter.fireSelectGroup(this.formId);
				break;
			}
			case "copy": {
				this.parameter.fireCopy(this.formId);
				break;
			}
			case "delete": {
				this.parameter.fireDelete(this.formId);
				break;
			}
			case "moveUp": {
				this.parameter.fireMoveUp(this.formId);
				break;
			}
			case "moveDown": {
				this.parameter.fireMoveDown(this.formId);
				break;
			}
		}

		this.parameter.activeActionItems = false;
		this.setState({ activeDropdown: false });
	}

	handleActiveChange = (val) => {
		//console.log("SXPreviewRow.handleActiveChange: ", val, this.parameter);

		if (!this.parameter.focused) {
			this.parameter.fireParameterSelected();
		}

		this.parameter.activeActionItems = val;

		this.setState({ activeDropdown: val });
	};

	render() {
		let className = this.parameter.focused ? "autofit-row sx-focused" : "autofit-row";

		let style = {};
		if (
			this.parameter.paramType == ParamType.BOOLEAN &&
			(this.parameter.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX ||
				this.parameter.viewType == ParameterConstants.BooleanViewTypes.TOGGLE)
		) {
			style = {
				marginTop: "0.5rem",
				marginBottom: "0.5rem"
			};
		}

		return (
			<>
				<div
					className={
						className + (this.parameter.position == "end" ? " sx-preview-row-end" : " sx-preview-row")
					}
					onClick={this.handleClick}
					ref={this.focusRef}
				>
					<div
						className="autofit-col autofit-col-expand"
						style={{ marginRight: "10px", width: "100%" }}
					>
						{this.parameter.render({
							style: style,
							spritemap: this.spritemap,
							inputStatus: this.parameter.inputStatus,
							preview: true
						})}
					</div>
					<div
						key={Util.randomKey()}
						className="autofit-col autofit-col-shrink"
						style={{ alignSelf: "center" }}
					>
						<DropDown
							key={Util.randomKey()}
							active={this.state.activeDropdown}
							trigger={
								<ClayButtonWithIcon
									aria-label="Actions"
									symbol="ellipsis-v"
									title="Actions"
									borderless="true"
									className="btn-secondary"
									spritemap={this.spritemap}
									onClick={(e) => {
										e.stopPropagation();
									}}
								/>
							}
							onActiveChange={this.handleActiveChange}
							menuWidth="shrink"
						>
							<DropDown.ItemList items={this.actionItems}>
								{(actionItem) => (
									<DropDown.Item
										key={actionItem.id}
										onClick={(e) => {
											e.stopPropagation();
											this.handleActionClick(actionItem.id);
										}}
									>
										<Icon
											spritemap={this.spritemap}
											symbol={actionItem.symbol}
											style={{ marginRight: "5px" }}
										/>
										{actionItem.name}
									</DropDown.Item>
								)}
							</DropDown.ItemList>
						</DropDown>
					</div>
				</div>
			</>
		);
	}
}

export default SXPreviewRow;
