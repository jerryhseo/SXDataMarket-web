import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { ClayCheckbox, ClaySelectBox } from "@clayui/form";
import { Event } from "../../stationx/station-x";
import { ClayButtonWithIcon } from "@clayui/button";
import SXActionDropdown from "../../stationx/dropdown";
import ParameterConstants from "../Parameter/parameter-constants";

class SXDualListBox extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.viewType = this.parameter.viewType ?? ParameterConstants.DualListViewTypes.HORIZONTAL;

		this.state = {
			leftOptions: this.parameter.getLeftOptions(this.cellIndex),
			rightOptions: this.getRightOptions(),
			leftSelected: [],
			rightSelected: []
		};
	}

	listenerPopActionClicked = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			console.log("[SXDualListBox] listenerPopActionClicked event rejected: ", dataPacket);
			return;
		}
		console.log("[SXDualListBox] listenerPopActionClicked: ", dataPacket);

		switch (dataPacket.action) {
			case "moveUp": {
				const index = dataPacket.data;

				const options = [...this.state.leftOptions];
				const prevOption = options[index - 1];
				options[index - 1] = options[index];
				options[index] = prevOption;

				this.setState({
					leftOptions: options
				});

				break;
			}
			case "moveDown": {
				const index = dataPacket.data;

				const options = [...this.state.leftOptions];
				const nextOption = options[index + 1];
				options[index + 1] = options[index];
				options[index] = nextOption;

				this.setState({
					leftOptions: options
				});

				break;
			}
		}
	};

	componentDidMount() {
		super.componentDidMount();

		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	componentWillUnmount() {
		super.componentWillUnmount();

		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	getRightOptions() {
		return this.viewType === ParameterConstants.DualListViewTypes.ORDERED
			? this.parameter.getOptions()
			: this.parameter.getRightOptions(this.cellIndex);
	}

	handleLeftSelectChange(selects, a) {
		this.setState({ leftSelected: selects.map((value) => value) });
	}

	handleRightSelectChange(selects, a) {
		this.setState({ rightSelected: selects.map((value) => value) });
	}

	handleRemoveBtnClick(e) {
		const left = this.state.leftOptions.filter((item) => !this.state.leftSelected.includes(item.value));
		const leave = this.state.leftOptions.filter((item) => this.state.leftSelected.includes(item.value));

		this.setState({
			leftOptions: left,
			rightOptions: [...this.state.rightOptions, ...leave]
		});

		this.parameter.setValue({ value: left, cellIndex: this.cellIndex, validate: true });

		this.parameter.fireValueChanged(this.cellIndex);
	}

	handleAddBtnClick(e) {
		const left = this.state.rightOptions.filter((item) => !this.state.rightSelected.includes(item.value));
		const leave = this.state.rightOptions.filter((item) => this.state.rightSelected.includes(item.value));

		this.setState({
			leftOptions: [...this.state.leftOptions, ...leave],
			rightOptions: left
		});

		this.parameter.setValue({
			value: [...this.state.leftOptions, ...leave],
			cellIndex: this.cellIndex,
			validate: true
		});

		this.parameter.fireValueChanged(this.cellIndex);
	}

	handleOptionClicked = (option, checked) => {
		console.log("handleOptionClicked: ", option, checked);
		const clickedOption = this.parameter.getOptionByValue(option.value);

		if (checked) {
			this.parameter.addValue(clickedOption);
		} else {
			this.parameter.removeValue(clickedOption);
		}

		this.setState({
			leftOptions: this.parameter.getLeftOptions()
		});
	};

	isSelected = (option) => {
		const optionValues = this.state.leftOptions.map((option) => option.value);

		return optionValues.includes(option.value);
	};

	renderGridCell() {
		return <></>;
	}

	renderFormField() {
		console.log("SxDualListBox: ", this.parameter);
		return (
			<>
				{this.parameter.renderTitle({
					spritemap: this.spritemap
				})}
				{this.parameter.showDefinition && (
					<div className="sx-param-definition">
						<pre>{this.parameter.getDefinition()}</pre>
					</div>
				)}
				<div
					className="sx-dual-listbox"
					style={{ paddingLeft: "10px" }}
				>
					{this.viewType === ParameterConstants.DualListViewTypes.HORIZONTAL && (
						<>
							<div className="sx-dual-listbox-item sx-dual-listbox-item-expand listbox-left form-group ">
								<ClaySelectBox
									items={this.state.leftOptions}
									label="In Use"
									multiple
									onSelectChange={(selected) => this.handleLeftSelectChange(selected)}
									spritemap={this.spritemap}
									value={this.state.leftSelected}
									disabled={this.parameter.getDisabled(this.cellIndex)}
									style={{ marginBottom: "5px" }}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
							<div className="btn-group-vertical sx-dual-listbox-actions sx-dual-listbox-item">
								<ClayButtonWithIcon
									aria-label="Remove"
									spritemap={this.spritemap}
									symbol="caret-right"
									displayType="secondary"
									title="Remove"
									className="transfer-button-ltr btn btn-monospaced btn-sm btn-secondary"
									disabled={this.parameter.getDisabled(this.cellIndex)}
									onClick={(e) => this.handleRemoveBtnClick(e)}
								/>
								<ClayButtonWithIcon
									aria-label="Add"
									spritemap={this.spritemap}
									symbol="caret-left"
									displayType="secondary"
									title="Add"
									className="transfer-button-ltr btn btn-monospaced btn-sm btn-secondary"
									disabled={this.parameter.getDisabled(this.cellIndex)}
									onClick={(e) => this.handleAddBtnClick(e)}
								/>
							</div>
							<div className="sx-dual-listbox-item sx-dual-listbox-item-expand listbox-right form-group">
								<ClaySelectBox
									items={this.state.rightOptions}
									label="Availables"
									multiple
									onSelectChange={(selected) => this.handleRightSelectChange(selected)}
									spritemap={this.spritemap}
									value={this.state.rightSelected}
									disabled={this.parameter.getDisabled(this.cellIndex)}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						</>
					)}
					{this.viewType === ParameterConstants.DualListViewTypes.ORDERED && (
						<div className="autofit-row autofit-padded">
							<div className="autofit-col">
								<div>{Util.translate("in-use")}</div>
								<div
									style={{
										border: "1px solid #c6c4c4",
										minWidth: "20rem",
										height: "calc(32px*10)",
										marginRight: "1rem",
										padding: "10px",
										overflowY: "auto",
										overflowX: "hidden"
									}}
								>
									{this.state.leftOptions.map((option, index) => {
										console.log("SXDualListBox.option: ", option);
										const actionMenus = [];

										if (index > 0) {
											actionMenus.push({
												id: "moveUp",
												name: Util.translate("move-up"),
												symbol: "caret-top"
											});
										}

										if (index < this.state.leftOptions.length - 1) {
											actionMenus.push({
												id: "moveDown",
												name: Util.translate("move-down"),
												symbol: "caret-bottom"
											});
										}

										return (
											<div
												key={option.value}
												className="autofit-row"
												style={{ padding: "5px" }}
											>
												<div className="autofit-col autofit-col-expand">{option.label}</div>
												<div className="autofit-col autofit-col-shrink">
													<SXActionDropdown
														key={Util.randomKey()}
														namespace={this.namespace}
														formId={this.componentId}
														actionItems={actionMenus}
														dataKey={index}
														spritemap={this.spritemap}
													/>
												</div>
											</div>
										);
									})}
								</div>
							</div>
							<div className="autofit-col">
								<div>{Util.translate("availables")}</div>
								<div
									style={{
										border: "1px solid #c6c4c4",
										minWidth: "20rem",
										height: "calc(32px*10)",
										padding: "10px",
										overflowY: "auto",
										overflowX: "hidden"
									}}
								>
									{this.parameter.getOptions().map((option) => {
										return (
											<div
												key={option.value}
												style={{ margin: "5px" }}
											>
												<ClayCheckbox
													checked={this.isSelected(option)}
													onChange={(e) => {
														this.handleOptionClicked(option, e.target.checked);
													}}
													label={option.label}
												/>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
				{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
			</>
		);
	}

	render() {
		return (
			<div
				className={this.parameter.getClassName(this.className, this.cellIndex)}
				style={{ ...this.style, ...this.parameter.style }}
				ref={this.focusRef}
			>
				{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD && this.renderFormField()}
				{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL && this.renderGridCell()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXDualListBox;
