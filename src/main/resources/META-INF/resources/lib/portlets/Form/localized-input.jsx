import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { ClayInput } from "@clayui/form";
import DropDown from "@clayui/drop-down";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import ClayLabel from "@clayui/label";
import { Util } from "../../stationx/util";
import ParameterConstants from "../Parameter/parameter-constants";

class SXLocalizedInput extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.initValue = { ...this.parameter.getValue(this.cellIndex) };
		this.state = {
			selectedLang: this.languageId,
			translation: this.parameter.getTranslation(this.parameter.languageId, this.cellIndex)
		};

		//console.log("[SXLocalizedInput props] ", props, this.state.selectedLang, this.state.translation);
	}

	handleChange(value) {
		if (this.state.translation == value) {
			return;
		}

		this.parameter.setTranslation(this.state.selectedLang, value, this.cellIndex);

		this.setState({
			translation: value
		});
	}

	fireValueChanged() {
		if (Util.isEqual(this.initValue, this.parameter.getValue(this.cellIndex))) {
			return;
		}

		this.parameter.fireValueChanged(this.cellIndex);
	}

	getTranslatedArray() {
		const translations = this.parameter.getTranslations();

		const translated = [];
		Object.keys(translations).forEach((key) => {
			if (key !== this.state.selectedLang) {
				translated.push([key, translations[key]]);
			}
		});

		return translated;
	}

	getClayUI(tagId, tagName) {
		const translated = this.getTranslatedArray();

		return (
			<>
				<ClayInput.Group>
					{this.parameter.renderPrefix()}
					<ClayInput.GroupItem>
						<ClayInput
							component={this.parameter.multipleLine ? "textarea" : "input"}
							type="text"
							id={tagId}
							name={tagName}
							value={this.state.translation}
							placeholder={this.parameter.getPlaceholder(this.state.selectedLang)}
							disabled={this.parameter.getDisabled(this.cellIndex)}
							onChange={(e) => this.handleChange(e.target.value)}
							onBlur={(e) => this.fireValueChanged(e.target.value)}
							ref={this.focusRef}
							sizing="sm"
						/>
					</ClayInput.GroupItem>
					{this.parameter.renderPostfix()}
					<ClayInput.GroupItem shrink>
						<DropDown
							trigger={
								<Button
									displayType="secondary"
									className="btn-monospaced"
									disabled={this.parameter.getDisabled(this.cellIndex)}
									size="sm"
								>
									<Icon
										symbol={this.state.selectedLang.toLowerCase()}
										spritemap={this.spritemap}
									/>
									<span className="btn-section">{this.state.selectedLang}</span>
								</Button>
							}
							closeOnClick={true}
						>
							<DropDown.ItemList items={this.parameter.languageFlags}>
								{(flag) => {
									let displayType, label;
									const translations = this.parameter.getTranslations(this.cellIndex);

									if (translations[flag.name]) {
										displayType = "success";
										label = Util.translate("translated");
									} else {
										displayType = "warning";
										label = Util.translate("not-translated");
									}

									return (
										<DropDown.Item
											key={flag.name}
											onClick={() => {
												console.log(
													"Locealized Dropdown: ",
													flag.name,
													this.parameter.value,
													this.parameter.getTranslation(flag.name, this.cellIndex)
												);
												this.setState({
													selectedLang: flag.name,
													translation: this.parameter.getTranslation(
														flag.name,
														this.cellIndex
													)
												});
											}}
											active={this.state.selectedLang == flag.name}
										>
											<Icon
												spritemap={this.spritemap}
												symbol={flag.symbol}
												style={{
													marginRight: "5px"
												}}
											/>
											{flag.name}
											<ClayLabel
												displayType={displayType}
												spritemap={this.spritemap}
												style={{
													float: "right"
												}}
											>
												{label}
											</ClayLabel>
										</DropDown.Item>
									);
								}}
							</DropDown.ItemList>
						</DropDown>
					</ClayInput.GroupItem>
				</ClayInput.Group>
				{translated.length > 0 && (
					<div style={{ fontSize: "0.7rem", fontWeight: "300", paddingLeft: "1.5rem" }}>
						{translated.map((trans) => {
							return <div key={trans[0]}>{trans[0] + ": " + trans[1]}</div>;
						})}
					</div>
				)}
			</>
		);
	}

	renderGridCell() {
		return this.getClayUI(this.parameter.tagId + "_" + this.cellIndex, this.parameter.tagName);
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
					{this.getClayUI(this.parameter.tagId, this.parameter.tagName)}
					{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
				</div>
			</>
		);
	}

	render() {
		//console.log("SXLocalizedInput render: ", this.parameter.label, this.parameter.value);
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

export default SXLocalizedInput;
