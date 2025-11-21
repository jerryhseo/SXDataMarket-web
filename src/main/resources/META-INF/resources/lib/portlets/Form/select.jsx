import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { ClayCheckbox, ClayRadio, ClaySelect, ClaySelectBox } from "@clayui/form";
import ParameterConstants from "../Parameter/parameter-constants";

class SXSelect extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.selectedOptionChanged = false;

		this.state = {
			focus: false,
			value: this.parameter.getValue(this.cellIndex) ?? (this.parameter.isMultiple() ? [] : "")
		};

		//console.log("SXSelect Remounted: ", this.parameter.paramCode, this.parameter);
	}

	setValue(value) {
		this.setState({ value: value });
		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });

		this.parameter.fireValueChanged(this.cellIndex);
	}

	handleRadioClick(val) {
		if (this.state.value == val) {
			this.setValue("");
		}
	}

	handleLiastboxSelectChanged = (values) => {
		this.setValue(values.filter((value) => Util.isNotEmpty(value)));
	};

	handleValueChange(val) {
		let newValue = val;
		if (this.parameter.isMultiple()) {
			if (this.state.value.includes(val)) {
				newValue = this.state.value.filter((elem) => elem !== val);
			} else {
				newValue = [...this.state.value, val];
			}
		}

		this.setValue(newValue);
	}

	renderListBox() {
		let optionItems = Util.isEmpty(this.parameter.placeholder)
			? []
			: [
					{
						key: "",
						label: this.parameter.getPlaceholder(),
						value: ""
					}
			  ];

		optionItems = [
			...optionItems,
			...this.parameter.options.map((option) => ({
				key: option.value,
				label: Util.getTranslation(option.label, this.parameter.languageId, this.defaultLanguageId),
				value: option.value
			}))
		];

		return (
			<ClaySelectBox
				value={Util.isNotEmpty(this.state.value) ? this.state.value : []}
				items={optionItems}
				multiple
				disabled={this.parameter.getDisabled(this.cellIndex)}
				size={this.parameter.listboxSize ?? 4}
				onSelectChange={this.handleLiastboxSelectChanged}
				style={{ marginBottom: "0px" }}
				spritemap={this.spritemap}
			/>
		);
	}

	renderCheckBoxGroup() {
		const optionRows = Util.convertArrayToRows(this.parameter.options, this.parameter.optionsPerRow);

		return (
			<>
				{this.parameter.optionsPerRow == 0 && (
					<div style={{ display: "flex", overflowX: "auto" }}>
						{optionRows.map((option) => (
							<div
								key={option.value}
								style={{
									display: "inline-block",
									flex: "0 0 auto",
									marginRight: "20px",
									padding: "5px"
								}}
							>
								<ClayCheckbox
									key={option.value}
									label={Util.getTranslation(
										option.label,
										this.parameter.languageId,
										this.defaultLanguageId
									)}
									checked={this.state.value.includes(option.value)}
									onChange={(e) => {
										e.stopPropagation();
										this.handleValueChange(option.value);
									}}
									disabled={this.parameter.getDisabled(this.cellIndex)}
								/>
							</div>
						))}
					</div>
				)}
				{this.parameter.optionsPerRow == 1 &&
					optionRows.map((option) => (
						<ClayCheckbox
							key={option.value}
							label={Util.getTranslation(option.label, this.parameter.languageId, this.defaultLanguageId)}
							checked={this.state.value.includes(option.value)}
							onChange={(e) => {
								e.stopPropagation();
								this.handleValueChange(option.value);
							}}
							disabled={this.parameter.getDisabled(this.cellIndex)}
						/>
					))}
				{this.parameter.optionsPerRow > 1 &&
					optionRows.map((row, rowIndex) => (
						<div
							key={rowIndex}
							style={{ display: "inline-flex", width: "100%" }}
						>
							{row.map((option) => {
								return (
									<div
										key={option.value}
										style={{
											display: "inline-block",
											width: 100 / this.parameter.optionsPerRow + "%"
										}}
									>
										<ClayCheckbox
											label={Util.getTranslation(
												option.label,
												this.parameter.languageId,
												this.defaultLanguageId
											)}
											checked={this.state.value.includes(option.value)}
											onChange={(e) => {
												e.stopPropagation();
												this.handleValueChange(option.value);
											}}
											disabled={this.parameter.getDisabled(this.cellIndex)}
										/>
									</div>
								);
							})}
						</div>
					))}
			</>
		);
	}

	renderRadioGroup() {
		const optionRows = Util.convertArrayToRows(this.parameter.options, this.parameter.optionsPerRow);

		return (
			<>
				{this.parameter.optionsPerRow == 0 && (
					<div style={{ display: "inline-flex", overflowX: "auto", width: "100%" }}>
						{optionRows.map((option) => (
							<div
								key={option.value}
								style={{
									display: "inline",
									width: "fit-content",
									marginRight: "20px",
									flex: "0 0 auto",
									padding: "5px"
								}}
							>
								<ClayRadio
									label={Util.getTranslation(
										option.label,
										this.parameter.languageId,
										this.defaultLanguageId
									)}
									value={option.value}
									checked={this.state.value == option.value}
									onClick={(e) => this.handleRadioClick(e.target.value)}
									onChange={(e) => {
										e.stopPropagation();
										this.handleValueChange(option.value);
									}}
									disabled={this.parameter.getDisabled(this.cellIndex)}
								/>
							</div>
						))}
					</div>
				)}

				{this.parameter.optionsPerRow == 1 &&
					optionRows.map((option) => (
						<ClayRadio
							key={option.value}
							label={Util.getTranslation(option.label, this.parameter.languageId, this.defaultLanguageId)}
							value={option.value}
							checked={this.state.value == option.value}
							onClick={(e) => this.handleRadioClick(e.target.value)}
							onChange={(e) => {
								e.stopPropagation();
								this.handleValueChange(option.value);
							}}
							disabled={this.parameter.getDisabled(this.cellIndex)}
						/>
					))}
				{this.parameter.optionsPerRow > 1 &&
					optionRows.map((row, index) => (
						<div
							key={index}
							style={{ display: "inline-flex", width: "100%" }}
						>
							{row.map((option) => (
								<div
									key={option.value}
									style={{
										display: "inline-block",
										width: 100 / this.parameter.optionsPerRow + "%"
									}}
								>
									<ClayRadio
										label={Util.getTranslation(
											option.label,
											this.parameter.languageId,
											this.defaultLanguageId
										)}
										value={option.value}
										checked={this.state.value == option.value}
										onClick={(e) => this.handleRadioClick(e.target.value)}
										onChange={(e) => {
											e.stopPropagation();
											this.handleValueChange(option.value);
										}}
										disabled={this.parameter.getDisabled(this.cellIndex)}
									/>
								</div>
							))}
						</div>
					))}
			</>
		);
	}

	renderDropDown() {
		let optionItems = Util.isEmpty(this.parameter.placeholder)
			? []
			: [
					{
						key: "",
						label: this.parameter.getPlaceholder(),
						value: ""
					}
			  ];

		optionItems = [
			...optionItems,
			...this.parameter.options.map((option) => ({
				key: option.value,
				label: Util.getTranslation(option.label, this.parameter.languageId, this.defaultLanguageId),
				value: option.value
			}))
		];

		return (
			<ClaySelect
				key={this.parameter.key}
				value={this.state.value}
				disabled={this.parameter.getDisabled(this.cellIndex)}
				onChange={(e) => {
					e.stopPropagation();
					this.handleValueChange(e.target.value);
				}}
				sizing="sm"
			>
				{optionItems.map((option, index) => {
					return (
						<ClaySelect.Option
							key={option.key}
							label={option.label}
							value={option.value}
						/>
					);
				})}
			</ClaySelect>
		);
	}

	renderGridCell() {
		return (
			<>
				{this.parameter.viewType == ParameterConstants.SelectViewTypes.DROPDOWN && this.renderDropDown()}
				{this.parameter.viewType == ParameterConstants.SelectViewTypes.RADIO && (
					<div style={{ width: "max-content" }}>{this.renderRadioGroup()}</div>
				)}
				{(this.parameter.viewType == ParameterConstants.SelectViewTypes.CHECKBOX ||
					this.parameter.viewType == ParameterConstants.SelectViewTypes.LISTBOX) && (
					<div style={{ width: "max-content" }}>{this.renderCheckBoxGroup()}</div>
				)}
			</>
		);
	}

	renderFormField() {
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
				<div style={{ paddingLeft: "10px" }}>
					{this.parameter.viewType == ParameterConstants.SelectViewTypes.DROPDOWN && this.renderDropDown()}
					{this.parameter.viewType == ParameterConstants.SelectViewTypes.RADIO && this.renderRadioGroup()}
					{this.parameter.viewType == ParameterConstants.SelectViewTypes.CHECKBOX &&
						this.renderCheckBoxGroup()}
					{this.parameter.viewType == ParameterConstants.SelectViewTypes.LISTBOX && this.renderListBox()}
				</div>
			</>
		);
	}

	render() {
		return (
			<div
				className={this.parameter.getClassName(this.className, this.cellIndex)}
				style={{ ...this.style, ...this.parameter.style }}
			>
				{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD && this.renderFormField()}{" "}
				{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL && this.renderGridCell()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXSelect;
