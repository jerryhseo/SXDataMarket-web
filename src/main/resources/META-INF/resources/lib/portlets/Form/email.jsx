import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { ClayInput } from "@clayui/form";
import { ErrorClass, ValidationRule } from "../../stationx/station-x";
import Autocomplete from "@clayui/autocomplete";
import ParameterConstants from "../Parameter/parameter-constants";

class SXEMail extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.initEmailId = this.parameter.getEmailId(this.cellIndex) ?? "";
		this.initServerName = this.parameter.getServerName(this.cellIndex) ?? "";
		this.emailServers = ["gmail.com", "daum.net", "naver.com"];
		this.state = {
			emailId: this.initEmailId,
			serverName: this.initServerName
		};

		//console.log("EMail constructor: ", this.parameter);
	}

	checkFullAddress() {
		return this.state.emailId && this.state.serverName;
	}

	fireValueChanged(event) {
		//console.log("SXEmail onItemChange: ", event);
		if (this.state.emailId && this.state.serverName) {
			if (this.initEmailId == this.state.emailId && this.initServerName == this.state.serverName) {
				return;
			}

			this.parameter.setValue({
				value: { emailId: this.state.emailId, serverName: this.state.serverName },
				cellIndex: this.cellIndex,
				validate: true
			});
			this.parameter.fireValueChanged();
		}
	}

	handleEMailIdChanged(emailId) {
		this.setState({ emailId: emailId });

		const regExpr = new RegExp(ValidationRule.EMAIL_ID);
		if (!regExpr.test(emailId)) {
			this.parameter.error = {
				message: Util.translate("invalid-email"),
				errorClass: ErrorClass.ERROR
			};
			this.parameter.setDirty(true, this.cellIndex);
		}
	}

	handleServerChanged(serverName) {
		console.log("SXEmail.handleServerChanged: ", serverName);
		this.setState({ serverName: serverName });

		const regExpr = new RegExp(ValidationRule.SERVER_NAME);
		if (!regExpr.test(serverName)) {
			this.parameter.error = {
				message: Util.translate("invalid-server-name"),
				errorClass: ErrorClass.ERROR
			};
			this.parameter.setDirty(true, this.cellIndex);
		}
	}

	getClayUI() {
		return (
			<ClayInput.Group small>
				<ClayInput.GroupItem>
					<ClayInput
						value={this.state.emailId}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						placeholder={Util.translate("email-id")}
						onChange={(e) => {
							e.stopPropagation();
							this.handleEMailIdChanged(e.target.value);
						}}
						onBlur={(e) => this.fireValueChanged()}
						spritemap={this.spritemap}
						ref={this.focusRef}
					/>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem shrink>
					<span style={{ alignContent: "center" }}>@</span>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem>
					<Autocomplete
						aria-labelledby={Util.translate("email-server-name")}
						items={this.emailServers}
						placeholder={Util.translate("email-server-name")}
						disabled={this.parameter.getDisabled(this.cellIndex)}
						onChange={(val) => this.handleServerChanged(val)}
						onBlur={(e) => this.fireValueChanged(e)}
						value={this.state.serverName}
					>
						{(item) => <Autocomplete.Item key={item}>{item}</Autocomplete.Item>}
					</Autocomplete>
				</ClayInput.GroupItem>
			</ClayInput.Group>
		);
	}

	renderGridCell() {
		return this.getClayUI();
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
				<div style={{ paddingLeft: "10px" }}>{this.getClayUI()}</div>
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

export default SXEMail;
