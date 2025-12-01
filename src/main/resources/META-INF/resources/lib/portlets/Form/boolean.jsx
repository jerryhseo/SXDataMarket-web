import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayCheckbox, ClayRadio, ClaySelect, ClayToggle } from "@clayui/form";
import ParameterConstants from "../Parameter/parameter-constants";

class SXBoolean extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.state = {
			value: this.parameter.getValue(this.cellIndex)
		};

		//console.log("SXBoolean constructor: ", this.parameter.paramCode, this.parameter, props);
	}

	setValue(value) {
		this.setState({ value: value });
		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });

		this.parameter.fireValueChanged(this.cellIndex);
	}

	handleRadioClick = (value) => {
		if (this.state.value == value) {
			this.setValue(null);
		}
	};

	handleValueChange = (value) => {
		this.setValue(value);
	};

	renderGridCell() {
		const tagId = this.parameter.tagId;
		const tagName = tagId;

		return (
			<div style={{ justifyItems: "center" }}>
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX && (
					<>
						<ClayCheckbox
							name={tagName}
							label={this.parameter.getTrueLabel()}
							aria-label={this.parameter.label}
							checked={this.state.value}
							onChange={(e) => {
								this.handleValueChange(e.target.checked);
							}}
							disabled={this.parameter.getDisabled(this.cellIndex)}
						/>
					</>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.DROPDOWN && (
					<ClaySelect
						id={tagId}
						name={tagName}
						defaultValue={this.state.value}
						onSelect={(val) => {
							this.handleValueChange(val);
						}}
						disabled={this.parameter.getDisabled(this.cellIndex)}
					>
						<ClaySelect.Option
							label={this.parameter.getTrueLabel()}
							value="true"
						/>
						<ClaySelect.Option
							label={this.parameter.getFalseLabel()}
							value="false"
						/>
					</ClaySelect>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.RADIO && (
					<div
						className="form-group"
						style={{ display: "flex", marginBottom: "5px", paddingLeft: "10px" }}
					>
						<div style={{ display: "inline", marginBottom: "0", marginRight: "20px" }}>
							<ClayRadio
								label={this.parameter.getTrueLabel()}
								value={true}
								checked={this.state.value == true}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								onClick={(e) => this.handleRadioClick(true)}
								onChange={(e) => {
									e.stopPropagation();
									this.handleValueChange(true);
								}}
							/>
						</div>
						<div style={{ display: "inline", marginBottom: "0" }}>
							<ClayRadio
								label={this.parameter.getFalseLabel()}
								value={false}
								checked={this.state.value == false}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								onClick={(e) => this.handleRadioClick(false)}
								onChange={(e) => {
									e.stopPropagation();
									this.handleValueChange(false);
								}}
							/>
						</div>
					</div>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.TOGGLE && (
					<ClayToggle
						id={tagId}
						name={tagName}
						label={this.parameter.getTrueLabel()}
						onToggle={(e) => this.handleValueChange(!this.state.value)}
						spritemap={this.spritemap}
						symbol={{
							off: "times",
							on: "check"
						}}
						toggled={this.state.value}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						sizing="md"
					/>
				)}
			</div>
		);
	}

	renderFormField() {
		const tagId = this.parameter.tagId;
		const tagName = tagId;

		return (
			<>
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX && (
					<div className="autofit-row autofit-padded autofit-row-center">
						<div className="autofit-col shirink">
							<ClayCheckbox
								ref={this.inputRef}
								aria-label={this.parameter.label}
								checked={this.state.value}
								onChange={(e) => this.handleValueChange(!this.state.value)}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								style={{ marginBottom: "0" }}
							/>
						</div>
						<div className="autofit-col autofit-col-expand">
							{this.parameter.renderTitle({
								spritemap: this.spritemap,
								style: {
									paddingLeft: "0",
									fontSize: "0.875rem"
								}
							})}
						</div>
					</div>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.DROPDOWN && (
					<div>
						{this.parameter.renderTitle({
							spritemap: this.spritemap
						})}
						{this.parameter.showDefinition && (
							<div className="sx-param-definition">
								<pre>{this.parameter.getDefinition()}</pre>
							</div>
						)}
						<ClaySelect
							defaultValue={this.state.value}
							onSelect={(val) => this.handleValueChange(val)}
							disabled={this.parameter.getDisabled(this.cellIndex)}
						>
							<ClaySelect.Option
								label={this.parameter.getTrueLabel()}
								value="true"
							/>
							<ClaySelect.Option
								label={this.parameter.getFalseLabel()}
								value="false"
							/>
						</ClaySelect>
					</div>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.RADIO && (
					<div>
						{this.parameter.renderTitle({
							spritemap: this.spritemap
						})}
						{this.parameter.showDefinition && (
							<div className="sx-param-definition">
								<pre>{this.parameter.getDefinition()}</pre>
							</div>
						)}
						<div
							className="form-group"
							style={{ display: "flex", marginBottom: "5px", paddingLeft: "10px" }}
						>
							<div style={{ display: "inline", marginBottom: "0", marginRight: "20px" }}>
								<ClayRadio
									label={this.parameter.getTrueLabel()}
									value={true}
									checked={this.state.value == true}
									disabled={this.parameter.getDisabled(this.cellIndex)}
									onClick={(e) => this.handleRadioClick(true)}
									onChange={(e) => {
										e.stopPropagation();
										this.handleValueChange(true);
									}}
									ref={this.inputRef}
								/>
							</div>
							<div style={{ display: "inline", marginBottom: "0" }}>
								<ClayRadio
									label={this.parameter.getFalseLabel()}
									value={false}
									checked={this.state.value == false}
									disabled={this.parameter.getDisabled(this.cellIndex)}
									onClick={(e) => this.handleRadioClick(false)}
									onChange={(e) => {
										e.stopPropagation();
										this.handleValueChange(false);
									}}
								/>
							</div>
						</div>
					</div>
				)}
				{this.parameter.viewType == ParameterConstants.BooleanViewTypes.TOGGLE && (
					<ClayToggle
						label={this.parameter.renderTitle({
							spritemap: this.spritemap
						})}
						onToggle={(e) => this.handleValueChange(!this.state.value)}
						spritemap={this.spritemap}
						symbol={{
							off: "times",
							on: "check"
						}}
						toggled={this.state.value}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						sizing="md"
						ref={this.inputRef}
					/>
				)}
				{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
			</>
		);
	}

	render() {
		return (
			<div
				className={this.parameter.getClassName(this.className, this.cellIndex)}
				style={{ ...this.style, ...this.parameter.style }}
			>
				{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD && this.renderFormField()}
				{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL && this.renderGridCell()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXBoolean;
