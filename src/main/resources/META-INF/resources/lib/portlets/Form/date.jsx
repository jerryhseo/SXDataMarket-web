import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import DatePicker from "@clayui/date-picker";
import ClayForm from "@clayui/form";
import ParameterConstants from "../Parameter/parameter-constants";

class SXDate extends SXBaseParameterComponent {
	constructor(props) {
		super(props);
	}

	handleDateChanged(value) {
		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });

		this.parameter.fireValueChanged();

		this.forceUpdate();
	}

	renderDatePicker() {
		return (
			<DatePicker
				onChange={(val) => this.handleDateChanged(val)}
				placeholder={this.parameter.enableTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD"}
				time={this.parameter.enableTime}
				value={this.parameter.getValue(this.cellIndex) ?? ""}
				disabled={this.parameter.getDisabled(this.cellIndex)}
				years={{
					end: Number(this.parameter.endYear),
					start: Number(this.parameter.startYear)
				}}
				spritemap={this.spritemap}
			/>
		);
	}

	renderGridCell() {
		return this.renderDatePicker();
	}

	renderFormField() {
		return (
			<ClayForm.Group small>
				{this.parameter.renderTitle({
					spritemap: this.spritemap
				})}
				{this.parameter.showDefinition && (
					<div className="sx-param-definition">
						<pre>{this.parameter.getDefinition()}</pre>
					</div>
				)}
				<div style={{ paddingLeft: "10px" }}>{this.renderDatePicker()}</div>
			</ClayForm.Group>
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

export default SXDate;
