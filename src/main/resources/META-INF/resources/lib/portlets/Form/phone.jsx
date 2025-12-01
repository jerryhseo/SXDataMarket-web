import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { ClayInput } from "@clayui/form";
import { ErrorClass } from "../../stationx/station-x";

class SXPhone extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.state = {
			countryNo: this.parameter.enableCountryNo ? this.parameter.getCountryNo(this.cellIndex) : "",
			areaNo: this.parameter.getAreaNo(this.cellIndex) ?? "",
			stationNo: this.parameter.getStationNo(this.cellIndex) ?? "",
			personalNo: this.parameter.getPersonalNo(this.cellIndex) ?? ""
		};
	}

	checkFullNo() {
		return this.state.areaNo && this.state.stationNo && this.state.personalNo;
	}

	checkNo(val) {
		if (Util.isNotEmpty(val)) {
			return /^\d+$/.test(val);
		} else {
			return true;
		}
	}

	handleValueChanged(section, sectionValue) {
		this.parameter.setDirty(true, this.cellIndex);

		if (!this.checkNo(sectionValue)) {
			this.parameter.setError(ErrorClass.ERROR, Util.translate("only-numbers"), this.cellIndex);

			this.forceUpdate();

			return;
		}

		const newValue = { ...this.state };

		newValue[section] = sectionValue;

		this.setState(newValue);

		if (this.checkFullNo()) {
			this.parameter.setValue({ value: newValue, cellIndex: this.cellIndex, validate: true });
			this.parameter.fireValueChanged();
		}
	}

	renderClayUI() {
		const tagId = this.parameter.tagId;
		const tagName = this.parameter.tagName;

		return (
			<ClayInput.Group
				id={tagId}
				small
				style={{ paddingLeft: "10px" }}
			>
				{this.parameter.enableCountryNo && (
					<>
						<ClayInput.GroupItem shrink>
							<ClayInput
								ref={this.inputRef}
								value={this.state.countryNo}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								maxLength={6}
								style={{ maxWidth: "10ch" }}
								onChange={(e) => {
									e.stopPropagation();
									this.handleValueChanged("countryNo", e.target.value);
								}}
								spritemap={this.spritemap}
							/>
						</ClayInput.GroupItem>
						<ClayInput.GroupItem shrink>
							<span style={{ alignContent: "center" }}>-</span>
						</ClayInput.GroupItem>
					</>
				)}
				<ClayInput.GroupItem shrink>
					<ClayInput
						value={this.state.areaNo}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						maxLength={4}
						onChange={(e) => {
							e.stopPropagation();
							this.handleValueChanged("areaNo", e.target.value);
						}}
						style={{ maxWidth: "8ch" }}
						spritemap={this.spritemap}
						ref={this.focusRef}
					/>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem shrink>
					<span style={{ alignContent: "center" }}>-</span>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem shrink>
					<ClayInput
						value={this.state.stationNo}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						maxLength={4}
						style={{ maxWidth: "8ch" }}
						onChange={(e) => {
							e.stopPropagation();
							this.handleValueChanged("stationNo", e.target.value);
						}}
						spritemap={this.spritemap}
					/>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem shrink>
					<span style={{ alignContent: "center" }}>-</span>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem shrink>
					<ClayInput
						value={this.state.personalNo}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						maxLength={4}
						style={{ maxWidth: "8ch" }}
						onChange={(e) => {
							e.stopPropagation();
							this.handleValueChanged("personalNo", e.target.value);
						}}
						spritemap={this.spritemap}
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>
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
					{this.renderClayUI()}
					{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
				</div>
			</>
		);
	}

	render() {
		//console.log("[SXPhone] render: ", this.parameter);
		return (
			<div
				className={this.parameter.getClassName(this.className, this.cellIndex)}
				style={{ ...this.style, ...this.parameter.style }}
			>
				{this.renderFormField()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXPhone;
