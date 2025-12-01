import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayInput } from "@clayui/form";
import { Util } from "../../stationx/util";
import { ErrorClass, ValidationKeys, ValidationRule, ValidationSectionProperty } from "../../stationx/station-x";
import ParameterConstants from "../Parameter/parameter-constants";

class SXNumeric extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		const value = this.parameter.getValue(this.cellIndex) ?? "";
		this.state = {
			value: (this.parameter.uncertainty ? value.value ?? "" : value).toString(),
			uncertainty: (this.parameter.uncertainty ? value.uncertainty ?? "" : "").toString()
		};
	}

	toNumber(val) {
		if (Util.isEmpty(val)) {
			return "";
		}

		return Number(Number(val).toFixed(this.parameter.isInteger ? 0 : this.parameter.decimalPlaces));
	}

	handleValueChanged = (newValue) => {
		if (Util.isEmpty(this.state.value) && Util.isEmpty(newValue)) {
			return;
		} else if (Util.isNotEmpty(this.state.value) && Util.isEmpty(newValue)) {
			this.parameter.setValue({ value: "", cellIndex: this.cellIndex, validate: true });
			this.setState({ value: "" });
			this.parameter.fireValueChanged(this.cellIndex);

			return;
		} else if (Util.isNotEmpty(newValue)) {
			if (this.state.value === newValue) {
				return;
			} else {
				const regExpr = this.parameter.isInteger
					? new RegExp(ValidationRule.INTEGER)
					: new RegExp(ValidationRule.NUMERIC);

				if (!regExpr.test(newValue)) {
					this.parameter.setError(
						ErrorClass.ERROR,
						this.parameter.isInteger
							? Util.translate("only-digits-allowed-for-this-field")
							: Util.translate("only-numbers-allowed-for-this-field"),
						this.cellIndex
					);
					this.parameter.setDirty(true, this.cellIndex);

					this.setState({ value: newValue });
					return;
				}
			}
		}

		let value;
		if (Util.isNotEmpty(newValue)) {
			value = this.parameter.uncertainty
				? { value: this.toNumber(newValue), uncertainty: this.toNumber(this.state.uncertainty) }
				: this.toNumber(newValue);
		} else {
			value = this.parameter.uncertainty ? { value: "", uncertainty: this.toNumber(this.state.uncertainty) } : "";
		}

		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });

		this.setState({ value: Util.isEmpty(newValue) ? "" : this.toNumber(newValue) });
		this.parameter.fireValueChanged(this.cellIndex);
	};

	handleUncertaintyChanged(newUncertainty) {
		if (Util.isEmpty(this.state.uncertainty) && Util.isEmpty(newUncertainty)) {
			return;
		} else if (Util.isNotEmpty(this.state.uncertainty) && Util.isEmpty(newUncertainty)) {
			const value = { value: this.state.value, uncertainty: "" };

			this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });
			this.parameter.fireValueChanged(this.cellIndex);

			this.setState({ uncertainty: "" });

			return;
		} else if (Util.isNotEmpty(newUncertainty)) {
			if (this.state.uncertainty === newUncertainty) {
				return;
			} else {
				const regExpr = this.parameter.isInteger
					? new RegExp(ValidationRule.INTEGER)
					: new RegExp(ValidationRule.NUMERIC);

				if (!regExpr.test(newUncertainty)) {
					this.parameter.setError(
						ErrorClass.ERROR,
						this.parameter.isInteger
							? Util.translate("only-digits-allowed-for-this-field")
							: Util.translate("only-numbers-allowed-for-this-field"),
						this.cellIndex
					);
					this.parameter.setDirty(true, this.cellIndex);

					this.setState({ uncertainty: newUncertainty });
					return;
				}
			}
		}

		const value = { value: this.state.value, uncertainty: this.toNumber(newUncertainty) };

		this.setState({ uncertainty: this.toNumber(newUncertainty) });
		this.parameter.setValue({ value: value, cellIndex: this.cellIndex, validate: true });

		//this.parameter.fireValueChanged(this.cellIndex);
	}

	renderClayUI() {
		//min and max are for Integer
		let min = this.parameter.getValidationValue("min", "boundary")
			? this.parameter.getValidationValue("min", "value")
			: this.parameter.getValidationValue("min", "value") + 1;
		if (isNaN(min)) min = "";

		let max = this.parameter.getValidationValue("max", "boundary")
			? this.parameter.getValidationValue("max", "value")
			: this.parameter.getValidationValue("max", "value") - 1;
		if (isNaN(max)) max = "";

		return (
			<ClayInput.Group
				small
				stacked
			>
				{this.parameter.validationMin && (
					<>
						<ClayInput.GroupItem
							prepend
							shrink
						>
							<ClayInput.GroupText>
								{this.parameter.getValidationValue(ValidationKeys.MIN, ValidationSectionProperty.VALUE)}
							</ClayInput.GroupText>
						</ClayInput.GroupItem>
						<ClayInput.GroupItem
							append
							shrink
						>
							{this.parameter.getValidationValue(
								ValidationKeys.MIN,
								ValidationSectionProperty.BOUNDARY
							) ? (
								<ClayInput.GroupText>&#8804;</ClayInput.GroupText>
							) : (
								<ClayInput.GroupText>{"<"}</ClayInput.GroupText>
							)}
						</ClayInput.GroupItem>
					</>
				)}
				<ClayInput.GroupItem append>
					<ClayInput.Group>
						{this.parameter.renderPrefix()}
						<ClayInput.GroupItem>
							<ClayInput
								type={this.parameter.isInteger ? "number" : "text"}
								value={this.state.value}
								min={min}
								max={max}
								ref={this.inputRef}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								onChange={(e) => {
									this.handleValueChanged(e.target.value);
								}}
								onBlur={(e) => {
									this.parameter.fireValueChanged(this.cellIndex);
								}}
							/>
						</ClayInput.GroupItem>
					</ClayInput.Group>
				</ClayInput.GroupItem>
				{this.parameter.uncertainty && (
					<>
						<ClayInput.GroupItem
							append
							shrink
						>
							<ClayInput.GroupText>&#177;</ClayInput.GroupText>
						</ClayInput.GroupItem>
						<ClayInput.GroupItem
							append
							shrink
							style={{ maxWidth: "10rem", width: "4rem" }}
						>
							<ClayInput
								type={this.parameter.isInteger ? "number" : "text"}
								value={this.state.uncertainty}
								min={min}
								max={max}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								onChange={(e) => this.handleUncertaintyChanged(e.target.value)}
								onBlur={(e) => {
									this.parameter.fireValueChanged(this.cellIndex);
								}}
							/>
						</ClayInput.GroupItem>
					</>
				)}
				{this.parameter.renderPostfix()}
				{this.parameter.unit && (
					<ClayInput.GroupItem
						append
						shrink
					>
						<ClayInput.GroupText>{this.parameter.unit}</ClayInput.GroupText>
					</ClayInput.GroupItem>
				)}
				{this.parameter.validationMax && (
					<>
						<ClayInput.GroupItem
							append
							shrink
						>
							{this.parameter.getValidationValue(
								ValidationKeys.MAX,
								ValidationSectionProperty.BOUNDARY
							) ? (
								<ClayInput.GroupText>&#8804;</ClayInput.GroupText>
							) : (
								<ClayInput.GroupText>{"<"}</ClayInput.GroupText>
							)}
						</ClayInput.GroupItem>
						<ClayInput.GroupItem
							append
							shrink
						>
							<ClayInput.GroupText>
								{this.parameter.getValidationValue(ValidationKeys.MAX, ValidationSectionProperty.VALUE)}
							</ClayInput.GroupText>
						</ClayInput.GroupItem>
					</>
				)}
			</ClayInput.Group>
		);
	}

	renderGridCell() {
		return this.renderClayUI();
	}

	renderFormField() {
		return (
			<>
				{this.parameter.renderTitle({
					spritemap: this.spritemap
				})}
				<div style={{ paddingLeft: "10px" }}>
					{this.parameter.showDefinition && (
						<div className="sx-param-definition">
							<pre>{this.parameter.getDefinition()}</pre>
						</div>
					)}
					{this.renderClayUI()}
					{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
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
				{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD && this.renderFormField()}
				{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL && this.renderGridCell()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXNumeric;
