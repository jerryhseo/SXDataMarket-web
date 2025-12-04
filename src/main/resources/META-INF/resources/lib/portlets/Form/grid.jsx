import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { Event } from "../../stationx/station-x";
import DropDown from "@clayui/drop-down";
import { ClayButtonWithIcon } from "@clayui/button";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import Icon from "@clayui/icon";

class SXGrid extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.preview = props.preview ?? false;

		this.state = {
			activeDropdown: false,
			selectedRow: 0,
			selectedColumn: null,
			errorAlert: false,
			errorMessage: ""
		};

		//console.log("SXGrid constructor: ", this.parameter);
	}

	listenerFieldValueChanged = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXGrid] SX_FIELD_VALUE_CHANGED Rejected: ", parameter);
			return;
		}

		console.log("[SXGrid] SX_FIELD_VALUE_CHANGED RECEIVED: ", parameter);

		const gridValue = this.parameter.value ?? {};
		gridValue[parameter.paramCode] = parameter.value;
		this.parameter.setValue({ value: gridValue });

		console.log("[SXGrid] value: ", this.parameter.hasValue(), this.parameter.getValue());

		this.parameter.fireValueChanged();
		//this.forceUpdate();
	};

	listenerColumnSelected = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXGrid] SX_PARAMETER_SELECTED Rejected: ", parameter);
			return;
		}

		console.log("[SXGrid] SX_PARAMETER_SELECTED RECEIVED: ", parameter);

		this.parameter.fire(Event.SX_PARAMETER_SELECTED, { parameter: parameter });
	};

	componentDidMount() {
		super.componentDidMount();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_PARAMETER_SELECTED, this.listenerColumnSelected);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_PARAMETER_SELECTED, this.listenerColumnSelected);
	}

	handleRowActionClick(actionId) {
		const error = this.parameter.hasError();
		if (Util.isNotEmpty(error)) {
			this.setState({
				activeDropdown: false,
				errorAlert: true,
				errorMessage: Util.translate("fix-the-error-first", error.message)
			});
			return;
		}

		switch (actionId) {
			case "insert": {
				this.parameter.insertRow(this.state.selectedRow + 1);
				break;
			}
			case "copy": {
				this.parameter.copyRow(this.state.selectedRow);
				break;
			}
			case "delete": {
				this.parameter.deleteRow(this.state.selectedRow);
				break;
			}
			case "up": {
				this.parameter.moveUpRow(this.state.selectedRow);
				break;
			}
			case "down": {
				this.parameter.moveDownRow(this.state.selectedRow);
				break;
			}
		}

		this.setState({
			activeDropdown: false
		});
	}

	handleColumnActionClick(e, actionId, colIndex) {
		switch (actionId) {
			case "left": {
				this.parameter.moveColumnLeft(colIndex - 1);
				break;
			}
			case "right": {
				this.parameter.moveColumnRight(colIndex - 1);
				break;
			}
			case "delete": {
				this.parameter.deleteColumn(colIndex - 1);
				break;
			}
		}

		this.setState({ selectedColumn: colIndex });
	}

	handleColumnClicked = (rowIndex, colIndex) => {
		if (colIndex < 0) {
			return;
		}

		const column = this.parameter.columns[colIndex];

		column.fireParameterSelected();
	};

	getHeadItems() {
		return [
			{
				id: "rowIndex",
				name: "No.",
				textValue: "order",
				style: { maxWidth: "5rem" }
			},
			...this.parameter.columns.map((column) => {
				return {
					id: column.paramCode,
					name: column.renderTitle({
						spritemap: this.spritemap,
						style: { marginBottom: "0" }
					}),
					textValue: column.label,
					style: {
						width: column.style.width ?? "auto"
					},
					focus: column.focused
				};
			})
		];
	}

	renderBodyRows() {
		let rows = [];
		let rowCount = this.parameter.rowCount;

		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			const actionItems = [
				{ id: "insert", name: Util.translate("insert"), symbol: "add-row" },
				{ id: "copy", name: Util.translate("copy"), symbol: "copy" },
				{ id: "delete", name: Util.translate("delete"), symbol: "times" }
			];

			if (rowIndex > 0) {
				actionItems.push({
					id: "up",
					name: Util.translate("move-up"),
					symbol: "caret-top"
				});
			}

			if (rowIndex < rowCount - 1) {
				actionItems.push({
					id: "down",
					name: Util.translate("move-down"),
					symbol: "caret-bottom"
				});
			}

			rows.push(
				<tr key={rowIndex}>
					<td
						onClick={(e) => {
							e.stopPropagation();
							this.handleColumnClicked(rowIndex, -1);
						}}
					>
						{!this.parameter.getDisabled(this.cellIndex) && (
							<DropDown
								active={this.state.activeDropdown && this.state.selectedRow == rowIndex}
								trigger={<div style={{ textAlign: "center" }}>{rowIndex + 1}</div>}
								onActiveChange={(val) => {
									this.setState({ activeDropdown: val, selectedRow: rowIndex });
								}}
								menuWidth="shrink"
							>
								<DropDown.ItemList items={actionItems}>
									{(actionItem) => (
										<DropDown.Item
											key={actionItem.id}
											onClick={(e) => this.handleRowActionClick(actionItem.id)}
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
						)}
						{this.parameter.getDisabled(this.cellIndex) && (
							<div style={{ textAlign: "center" }}>{rowIndex + 1}</div>
						)}
					</td>
					{this.parameter.columns.map((column, colIndex) => (
						<td
							key={colIndex}
							onClick={(e) => {
								e.stopPropagation();
								this.handleColumnClicked(rowIndex, colIndex);
							}}
						>
							{column.render({
								spritemap: this.spritemap,
								inputStatus: this.parameter.inputStatus,
								cellIndex: rowIndex
							})}
						</td>
					))}
				</tr>
			);
		}

		return rows;
	}

	render() {
		return (
			<div style={{ ...this.parameter.style }}>
				{this.parameter.renderTitle({ spritemap: this.spritemap })}
				{this.parameter.showDefinition && (
					<div className="sx-param-definition">
						<pre>{this.parameter.getDefinition()}</pre>
					</div>
				)}
				<div style={{ paddingLeft: "10px", overflowX: "auto", width: "100%" }}>
					<table
						className="sx-table"
						style={{ width: "100%" }}
					>
						<thead>
							<tr>
								{this.getHeadItems().map((column, index) => (
									<th
										key={column.id}
										onClick={(e) => {
											e.stopPropagation();
											console.log("head clicked: ", column);
											this.parameter.fireColumnSelected(column.id, this.formId);
										}}
									>
										<div
											className={column.focus ? "sx-focused" : ""}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												...column.style
											}}
										>
											{this.preview && index > 1 && (
												<ClayButtonWithIcon
													aria-labelledby={Util.translate("move-left")}
													symbol="caret-left"
													spritemap={this.spritemap}
													displayType="secondary"
													borderless="true"
													size="sm"
													onClick={(e) => {
														this.handleColumnActionClick(e, "left", index);
													}}
												/>
											)}
											<span style={{ textAlign: "center" }}>{column.name}</span>
											{this.preview && index > 0 && index < this.parameter.columnCount && (
												<ClayButtonWithIcon
													aria-labelledby={Util.translate("move-right")}
													symbol="caret-right"
													spritemap={this.spritemap}
													displayType="secondary"
													borderless="true"
													size="sm"
													onClick={(e) => {
														this.handleColumnActionClick(e, "right", index);
													}}
												/>
											)}
											{this.preview && index > 0 && (
												<ClayButtonWithIcon
													aria-labelledby={Util.translate("delete")}
													symbol="times"
													spritemap={this.spritemap}
													displayType="secondary"
													borderless="true"
													size="sm"
													onClick={(e) => {
														this.handleColumnActionClick(e, "delete", index);
													}}
												/>
											)}
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody key={this.parameter.rowCount}>{this.renderBodyRows()}</tbody>
					</table>
				</div>
				{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
				{this.state.errorAlert && (
					<SXModalDialog
						header={SXModalUtil.errorDlgHeader(this.spritemap)}
						body={this.state.errorMessage}
						buttons={[
							{
								onClick: () => {
									this.setState({ errorAlert: false });
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="error"
						spritemap={this.spritemap}
					/>
				)}
			</div>
		);
	}
}

export default SXGrid;
