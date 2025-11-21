import React from "react";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { ErrorClass, Event, ParamType } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import DataStructure from "./data-structure";
import { SXLabel } from "../Form/form";
import { Table, Head, Body, Cell, Row } from "@clayui/core";
import Icon from "@clayui/icon";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { ParameterUtil } from "../Parameter/parameters";
import SXBasePropertiesPanelComponent from "./base-properties-panel-component";
import SXActionDropdown from "../../stationx/dropdown";

class SXSelectOptionBuilder extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		console.log("SXSelectOptionBuilder constructor: ", props);

		this.selectedOption = this.workingParam.getOption(0) ?? {};
		this.setWorkingOption();

		this.state = {
			optionValueDuplicated: false,
			confirmDlgState: false,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: <></>
		};

		this.componentId = this.namespace + "SXSelectOptionBuilder";

		this.fieldOptionLabel = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "optionLabel",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "option-label"),
				placeholder: Util.getTranslationObject(this.languageId, "option-label"),
				value: this.selectedOption.label ?? {},
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "option-label-must-be-longer-than", 32),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		});

		this.fieldOptionValue = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "optionValue",
				displayName: Util.getTranslationObject(this.languageId, "option-value"),
				placeholder: Util.getTranslationObject(this.languageId, "option-value"),
				value: this.selectedOption.value ?? "",
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 16,
						message: Util.getTranslationObject(this.languageId, "option-value-must-be-shorter-than", 16),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		});
	}

	listenerFieldValueChanged = (event) => {
		/*
        console.log(
            "SXSelectOptionBuilder SX_FIELD_VALUE_CHANGED before: ",
            event.dataPacket.parameter,
            event.dataPacket.parameter.getValue(),
            this.selectedOption
        );
        */

		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.componentId);

		if (!dataPacket) {
			return;
		}

		/*
        console.log(
            "SXSelectOptionBuilder SX_FIELD_VALUE_CHANGED: ",
            dataPacket.parameter,
            dataPacket.parameter.getValue(),
            this.selectedOption
        );
        */

		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		if (dataPacket.paramCode == "optionLabel") {
			this.workingOption.label = this.fieldOptionLabel.getValue();
		} else {
			const value = this.fieldOptionValue.getValue();
			if (value == this.workingOption.value) {
				this.checkError();
				return;
			}

			const duplicated = this.workingParam.checkDuplicatedOptionValue(value);
			if (duplicated) {
				this.fieldOptionValue.setError(
					ErrorClass.ERROR,
					Util.translate("the-option-value-exists-already-try-another-value")
				);
				this.fieldOptionValue.fireRefresh();
			} else {
				this.fieldOptionValue.clearError();
				this.workingOption.value = this.fieldOptionValue.getValue();
			}
		}

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.isRendered()) {
			if (this.workingParam.isGridCell()) {
				const gridParam = this.dataStructure.findParameter({
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version,
					descendant: true
				});

				gridParam.fireRefresh();
			} else {
				this.workingParam.fireRefresh();
			}
		}

		this.forceUpdate();
	};

	listenerPopActionClicked = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.componentId);

		if (!dataPacket) {
			return;
		}

		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));

			return;
		}

		console.log("SXSelectOptionBuilder listenerPopActionClicked: ", dataPacket, this.workingParam);
		switch (dataPacket.action) {
			case "copy": {
				this.copyOption(dataPacket.data);

				break;
			}
			case "delete": {
				this.removeOption(dataPacket.data);

				break;
			}
			case "up": {
				this.moveOptionUp(dataPacket.data);

				break;
			}
			case "down": {
				this.moveOptionDown(dataPacket.data);

				break;
			}
		}

		this.actionRefreshKey = Util.randomKey();
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
	}

	setWorkingOption = () => {
		this.workingOption = Util.isEmpty(this.selectedOption) ? {} : this.selectedOption;
	};

	handleNewOption = (event) => {
		event.stopPropagation();

		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));

			return;
		}

		this.workingOption = {};
		this.selectedOption = {};

		this.fieldOptionLabel.setValue({ value: {} });
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.setValue({ value: "" });
		this.fieldOptionValue.refreshKey();

		this.forceUpdate();
	};

	handleAddOption(event) {
		//console.log("handleAddOption: ", this.workingOption);
		event.stopPropagation();

		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));

			return;
		}

		const optionLength = this.workingParam.addOption(this.workingOption);
		this.selectedOption = this.workingOption;
		if (optionLength.length == 0) {
			return;
		}

		this.workingParam.fireRefresh();

		this.forceUpdate();
	}

	copyOption = (index) => {
		this.workingOption = this.selectedOption = this.workingParam.copyOption(index);

		this.workingParam.fireRefresh();

		this.forceUpdate();
	};

	moveOptionUp = (index) => {
		this.workingParam.moveOptionUp(index);

		this.workingParam.fireRefresh();

		this.forceUpdate();
	};

	moveOptionDown = (index) => {
		this.workingParam.moveOptionDown(index);

		this.workingParam.fireRefresh();

		this.forceUpdate();
	};

	removeOption = (index) => {
		this.workingParam.removeOption(index);
		this.fieldOptionLabel.setValue({ value: {} });
		this.fieldOptionValue.setValue({ value: "" });
		//console.log("removeOption: ", this.fieldOptionLabel, this.fieldOptionValue);
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.refreshKey();

		this.workingParam.fireRefresh();

		this.selectedOption = {};
		this.workingOption = {};

		this.forceUpdate();
	};

	checkError() {
		const error = DataStructure.checkError([this.fieldOptionLabel, this.fieldOptionValue]);

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
		}

		return error;
	}

	openErrorDlg(message) {
		this.setState({
			confirmDlgState: true,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: message
		});
	}

	handleOptionSelected(option) {
		const error = this.checkError();
		if (Util.isNotEmpty(error)) {
			this.openErrorDlg(Util.translate("fix-the-error-first", error.errorMessage));

			return;
		}

		//console.log("handleOptionSelected: ", option, this.selectedOption);
		if (option === this.selectedOption) {
			return;
		}

		this.fieldOptionLabel.setValue({ value: option.label });
		this.fieldOptionLabel.refreshKey();
		this.fieldOptionValue.setValue({ value: option.value });
		this.fieldOptionValue.refreshKey();

		this.workingOption = this.selectedOption = option;

		this.forceUpdate();
	}

	render() {
		/*
        console.log(
            "SXSelectOptionBuilder render: ",
            this.selectedOption,
            Util.isNotEmpty(this.selectedOption),
            !(this.fieldOptionLabel.hasValue() && this.fieldOptionValue.hasValue()),
            this.workingParam.options
        );
        */

		return (
			<>
				<div className="sx-option-builder-title">{Util.translate("option-builder")}</div>
				<div className="sx-option-builder-label">
					<SXLabel
						label={Util.translate("options")}
						forHtml=""
						required={true}
						style={{
							fontWeight: "600",
							fontSize: "0.875rem"
						}}
						spritemap={this.spritemap}
					/>
				</div>
				<Table
					columnsVisibility={false}
					borderedColumns={false}
					size="sm"
					hover={false}
					striped={false}
					className="sx-option-table"
				>
					<Head
						items={[
							{ id: "label", name: Util.translate("label"), width: "auto" },
							{ id: "value", name: Util.translate("value"), width: "6rem" },
							{ id: "actions", name: "actions", width: "3.5rem" }
						]}
					>
						{(column) => {
							if (column.id == "actions") {
								return (
									<Cell
										key={column.id}
										textValue="actions"
										textAlign="center"
										width={column.width}
									>
										<Icon
											symbol="ellipsis-v"
											spritemap={this.spritemap}
										/>
									</Cell>
								);
							} else {
								return (
									<Cell
										key={column.id}
										textAlign="center"
										width={column.width}
									>
										{column.name}
									</Cell>
								);
							}
						}}
					</Head>
					<Body items={this.workingParam.options}>
						{(option, index) => {
							let actionItems = [
								{
									id: "copy", //
									name: Util.translate("copy"),
									symbol: "copy"
								},
								{
									id: "delete", //
									name: Util.translate("delete"),
									symbol: "times"
								}
							];
							if (index > 0) {
								actionItems.push({
									id: "up",
									name: Util.translate("moveUp"),
									symbol: "order-arrow-up"
								});
							}
							if (index < this.workingParam.options.length - 1) {
								actionItems.push({
									id: "down",
									name: Util.translate("moveDown"),
									symbol: "order-arrow-down"
								});
							}

							const selected = option == this.selectedOption;
							const selectedColor = "#fae6ecff";
							return (
								<Row
									key={option.value}
									onClick={(e) => {
										e.stopPropagation();
										this.handleOptionSelected(option);
									}}
								>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											{option.label[this.languageId]}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											{option.value}
										</div>
									</Cell>
									<Cell textAlign="center">
										<div style={{ backgroundColor: selected ? selectedColor : "inherit" }}>
											<SXActionDropdown
												key={this.actionRefreshKey}
												namespace={this.namespace}
												formId={this.componentId}
												actionItems={actionItems}
												triggerType="icon"
												dataKey={index}
												symbol="ellipsis-v"
												spritemap={this.spritemap}
											/>
										</div>
									</Cell>
								</Row>
							);
						}}
					</Body>
				</Table>
				<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
					<div className="autofit-col autofit-col-expand">
						<div style={{ textAlign: "center" }}>
							<Button
								aria-label={Util.translate("add-option")}
								displayType="secondary"
								size="sm"
								onClick={this.handleAddOption}
								title={Util.translate("add-option")}
								disabled={
									Util.isNotEmpty(this.selectedOption) ||
									!(this.fieldOptionLabel.hasValue() && this.fieldOptionValue.hasValue())
								}
							>
								<Icon
									symbol="caret-top"
									spritemap={this.props.spritemap}
								/>
							</Button>
						</div>
					</div>
					<div className="autofit-col">
						<ClayButtonWithIcon
							aria-label={Util.translate("new-option")}
							size="sm"
							symbol="plus"
							title={Util.translate("new-option")}
							onClick={this.handleNewOption}
							spritemap={this.spritemap}
							style={{ leftMargin: "auto" }}
						/>
					</div>
				</div>

				{this.fieldOptionLabel.renderField({
					spritemap: this.spritemap
				})}

				{this.fieldOptionValue.renderField({
					spritemap: this.spritemap
				})}
				{this.state.optionValueDuplicated && (
					<SXModalDialog
						header={Util.translate("error")}
						body={Util.translate("the-option-value-exists-already-try-another-value")}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: (e) => {
									this.setState({ optionValueDuplicated: false });
								},
								displayType: "secondary"
							}
						]}
					/>
				)}
				{this.state.confirmDlgState && (
					<SXModalDialog
						header={this.state.confirmDlgHeader}
						body={this.state.confirmDlgBody}
						buttons={[
							{
								onClick: () => {
									this.setState({ confirmDlgState: false });
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="info"
						spritemap={this.spritemap}
					/>
				)}
			</>
		);
	}
}

export default SXSelectOptionBuilder;
