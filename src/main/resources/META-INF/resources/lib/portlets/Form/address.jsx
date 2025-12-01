import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { ClayInput } from "@clayui/form";
import { SXModalDialog } from "../../stationx/modal";
import { UnderConstruction } from "../../stationx/common";
import Icon from "@clayui/icon";
import { ErrorClass } from "../../stationx/station-x";
import ParameterConstants from "../Parameter/parameter-constants";

class SXAddress extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		const value = this.parameter.getValue(this.cellIndex);
		this.state = {
			zipcode: value.zipcode ?? "",
			street: value.street ?? "",
			address: value.address ?? "",
			underConstruction: this.parameter.viewType == ParameterConstants.AddressViewTypes.ONE_LINE ? true : false
		};
	}

	get fullAddress() {
		return this.state.zipcode + ", " + this.state.street + ", " + this.state.address;
	}

	get address() {
		const address = this.fullAddress.replace(this.state.zipcode + ", " + this.state.street + ",", "");

		return address.trim();
	}

	handleAddressSearch() {
		new daum.Postcode({
			width: 500,
			height: 600,
			oncomplete: (data) => {
				let street;
				if (this.parameter.languageId == "ko-KR") {
					street = data.address;

					if (data.buildingName) {
						street += " " + data.buildingName;
					}
				} else {
					street = data.addressEnglish;
				}
				console.log("SXAddress: ", data, this.parameter, this.cellIndex);

				this.parameter.setValue({
					value: {
						zipcode: data.zonecode,
						street: street
					},
					cellIndex: this.cellIndex
				});
				this.parameter.setDirty(true, this.cellIndex);

				this.parameter.setError(ErrorClass.ERROR, Util.translate("input-detailed-address"), this.cellIndex);

				this.focusRef.current.disabled = false;
				this.focusRef.current.focus();
				this.setState({ zipcode: data.zonecode, street: street, address: "" });
				this.parameter.searched[this.cellIndex ?? 0] = true;
			}
		}).open();
	}

	handleAddressChanged(address) {
		this.setState({ address: address });

		let validate = true;
		if (!address) {
			this.parameter.setError(ErrorClass.ERROR, Util.translate("detailed-address-is-required"), this.cellIndex);
			validate = false;
		}

		this.parameter.setValue({
			value: {
				zipcode: this.state.zipcode,
				street: this.state.street,
				address: address
			},
			cellIndex: this.cellIndex,
			validate: validate
		});

		this.parameter.fireValueChanged(this.cellIndex);
	}

	renderOneLineUI() {
		return (
			<>
				{this.parameter.searched[this.cellIndex ?? 0] ? (
					<ClayInput.Group small>
						<ClayInput.GroupItem prepend>
							<ClayInput
								style={{ minWidth: "5rem", width: "100%" }}
								value={this.state.zipcode + ", " + this.state.street + ", " + this.state.address}
								disabled={this.parameter.getDisabled(this.cellIndex)}
								onChange={(e) => {
									e.stopPropagation();
									const value = e.target.value.replace(
										this.state.zipcode + ", " + this.state.street + ", ",
										""
									);

									this.handleAddressChanged(value);
								}}
								ref={this.focusRef}
							/>
						</ClayInput.GroupItem>
						<ClayInput.GroupItem
							shrink
							append
						>
							<Button
								onClick={(e) => this.handleAddressSearch()}
								size="sm"
								disabled={this.parameter.getDisabled(this.cellIndex)}
							>
								<span>
									<Icon
										symbol="search"
										spritemap={this.spritemap}
									/>
								</span>
							</Button>
						</ClayInput.GroupItem>
					</ClayInput.Group>
				) : (
					<ClayInput.Group style={{ justifyContent: "center" }}>
						<ClayInput.GroupItem shrink>
							<Button
								onClick={(e) => {
									this.handleAddressSearch();
								}}
								size="sm"
							>
								<span className="inline-item inline-item-before">
									<Icon
										symbol="search"
										spritemap={this.spritemap}
									/>
								</span>
								{Util.translate("search")}
							</Button>
						</ClayInput.GroupItem>
					</ClayInput.Group>
				)}
			</>
		);
	}

	renderInlineUI() {
		return (
			<ClayInput.Group small>
				<ClayInput.GroupItem
					shrink
					prepend
					style={{ alignSelf: "center" }}
				>
					<ClayButtonWithIcon
						aria-label={Util.translate("search-address")}
						symbol="search"
						onClick={(e) => this.handleAddressSearch()}
						size="sm"
						spritemap={this.spritemap}
						disabled={this.parameter.getDisabled(this.cellIndex)}
					/>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem
					append
					style={{ minWidth: "15rem" }}
				>
					<ClayInput
						key={this.state.zipcode + " " + this.state.street}
						defaultValue={this.state.zipcode + " " + this.state.street}
						disabled={true}
					/>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem
					append
					style={{ minWidth: "6rem" }}
				>
					<ClayInput
						aria-label={Util.translate("address")}
						value={this.state.address}
						placeholder={Util.translate("detail-address")}
						disabled={
							this.parameter.getDisabled(this.cellIndex) || !this.parameter.searched[this.cellIndex ?? 0]
						}
						onChange={(e) => {
							e.stopPropagation();
							this.handleAddressChanged(e.target.value);
						}}
						ref={this.focusRef}
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>
		);
	}

	renderGridCell() {
		return this.renderInlineUI();
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
					{this.parameter.viewType == ParameterConstants.AddressViewTypes.ONE_LINE && this.renderOneLineUI()}
					{this.parameter.viewType == ParameterConstants.AddressViewTypes.INLINE && this.renderInlineUI()}
					{this.parameter.viewType == ParameterConstants.AddressViewTypes.BLOCK && (
						<>
							<div style={{ display: "block" }}>
								<span>{this.state.zipcode}</span>
								<ClayButtonWithIcon
									aria-label={Util.translate("search-address")}
									symbol="search"
									onClick={(e) => this.handleAddressSearch()}
									size="sm"
									spritemap={this.spritemap}
									disabled={this.parameter.getDisabled(this.cellIndex)}
									className="float-right"
								/>
							</div>
							<div style={{ display: "block", marginTop: "10px", marginBottom: "10px" }}>
								{this.state.street}
							</div>
							<ClayInput
								value={this.state.address}
								placeholder={Util.translate("detail-address")}
								disabled={!this.parameter.searched[0]}
								autoFocus={true}
								sizing="sm"
								onChange={(e) => {
									e.stopPropagation();
									this.handleAddressChanged(e.target.value);
								}}
								ref={this.focusRef}
							/>
						</>
					)}
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
				{this.state.underConstruction && (
					<SXModalDialog
						header={Util.translate("sorry")}
						body={<UnderConstruction />}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ underConstruction: false });
								}
							}
						]}
					/>
				)}
			</div>
		);
	}
}

export default SXAddress;
