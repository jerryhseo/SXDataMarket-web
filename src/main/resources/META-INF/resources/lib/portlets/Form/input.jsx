import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayInput } from "@clayui/form";
import ParameterConstants from "../Parameter/parameter-constants";

class SXInput extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.initValue = this.parameter.getValue(this.cellIndex);

		this.state = {
			value: this.initValue
		};

		//console.log("[SXInput] constructor: ", props);
	}

	handleChange(value) {
		if (value == this.state.value) {
			return;
		}

		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });
		this.setState({ value: value });
	}

	fireValueChanged(value) {
		if (value == this.initValue) {
			return;
		}

		this.parameter.fireValueChanged(this.cellIndex);
	}

	renderGridCell() {
		return (
			<ClayInput
				component={this.parameter.multipleLine ? "textarea" : "input"}
				id={this.parameter.getTagId(this.cellIndex)}
				name={this.parameter.tagName}
				placeholder={this.parameter.getPlaceholder(this.parameter.languageId)}
				type="text"
				value={this.state.value}
				disabled={this.parameter.getDisabled(this.cellIndex)}
				onChange={(e) => this.handleChange(e.target.value)}
				onClick={(e) => {
					this.parameter.fireGridCellSelected(this.cellIndex);
				}}
				onBlur={(e) => this.fireValueChanged(e.target.value)}
				sizing="sm"
				style={{ ...this.disabledControlStyle, border: "none" }}
				ref={this.inputRef}
			/>
		);
	}

	renderTableRow() {
		return (
			<tr>
				<td>{this.parameter.renderTitle({ spritemap: this.spritemap })}</td>
				<td>
					<ClayInput
						component={this.parameter.multipleLine ? "textarea" : "input"}
						id={this.parameter.getTagId(this.cellIndex)}
						name={this.parameter.tagName}
						placeholder={this.parameter.getPlaceholder(this.parameter.languageId)}
						type="text"
						value={this.state.value}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						onChange={(e) => this.handleChange(e.target.value)}
						onClick={(e) => {
							this.parameter.fireGridCellSelected(this.cellIndex);
						}}
						onBlur={(e) => this.fireValueChanged(e.target.value)}
						sizing="sm"
						style={{ ...this.disabledControlStyle, border: "none" }}
						ref={this.inputRef}
					/>
				</td>
				<td>
					<span>data status</span>
				</td>
			</tr>
		);
	}

	renderFormField() {
		const style = { ...this.style, ...this.parameter.style };
		style.marginBottom = this.style.marginBottom ?? "15px";
		const component = this.parameter.multipleLine ? "textarea" : "input";
		let textareaStyle = {};
		if (component === "textarea" && this.inputRef.current) {
			console.log("Input Render: ", this.inputRef.current.style.height, this.inputRef.current.scrollHeight);
			textareaStyle.height = "5rem";
		}

		return (
			<>
				{this.parameter.renderTitle({ spritemap: this.spritemap })}
				{this.parameter.showDefinition && (
					<div className="sx-param-definition">
						<pre>{this.parameter.getDefinition(this.parameter.languageId)}</pre>
					</div>
				)}
				<ClayInput.Group style={{ paddingLeft: "10px" }}>
					{!!this.parameter.prefix && this.parameter.renderPrefix()}
					<ClayInput.GroupItem>
						<ClayInput
							component={component}
							id={this.parameter.getTagId(this.cellIndex)}
							name={this.parameter.tagName}
							placeholder={this.parameter.getPlaceholder(this.parameter.languageId)}
							type="text"
							value={this.state.value}
							disabled={this.parameter.getDisabled(this.cellIndex)}
							sizing="sm"
							rows="3"
							onChange={(e) => this.handleChange(e.target.value)}
							onBlur={(e) => this.fireValueChanged(e.target.value)}
							ref={this.inputRef}
							style={{ ...textareaStyle, ...this.disabledControlStyle }}
						/>
					</ClayInput.GroupItem>
					{!!this.parameter.postfix && this.parameter.renderPostfix()}
				</ClayInput.Group>
			</>
		);
	}

	render() {
		//console.log("[SXInput] render", this.parameter);

		if (this.displayType == ParameterConstants.DisplayTypes.TABLE_ROW) {
			return this.renderTableRow();
		} else {
			return (
				<>
					{this.parameter.displayType !== ParameterConstants.DisplayTypes.TABLE_ROW && (
						<div
							className={this.parameter.getClassName(this.className, this.cellIndex)}
							style={{ ...this.style, ...this.parameter.style }}
						>
							{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD &&
								this.renderFormField()}
							{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL &&
								this.renderGridCell()}
							{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
						</div>
					)}
				</>
			);
		}
	}
}

export default SXInput;
