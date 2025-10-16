import React from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import { EditStatus, ErrorClass, Event, LoadingStatus, ParamType, ValidationRule } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import { DualListParameter, GroupParameter, Parameter, SelectParameter } from "../../stationx/parameter";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { Workbench } from "../DataWorkbench/workbench";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";

class DataSetEditor extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataSetEditor: ", props);
		this.dataCollectionId = this.params.dataCollectionId ?? 0;
		this.dataSetId = this.params.dataSetId ?? 0;

		this.availableDataTypes = [];

		this.dataSetCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataSetCode",
				displayName: Util.getTranslationObject(this.languageId, "dataset-code"),
				placeholder: Util.getTranslationObject(this.languageId, "dataset-code"),
				tooltip: Util.getTranslationObject(this.languageId, "code-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VARIABLE,
						message: Util.getTranslationObject(this.languageId, "invalid-code"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 3,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", 3),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", 32),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		const versionPlaceholder = {};
		versionPlaceholder[this.languageId] = "1.0.0";
		this.dataSetVersion = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataSetVersion",
				displayName: Util.getTranslationObject(this.languageId, "version"),
				placeholder: versionPlaceholder,
				tooltip: Util.getTranslationObject(this.languageId, "version-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VERSION,
						message: Util.getTranslationObject(this.languageId, "invalid-version-format"),
						errorClass: ErrorClass.ERROR
					}
				},
				defaultValue: "1.0.0"
			}
		);

		this.displayName = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "displayName",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "display-name"),
				placeholder: Util.getTranslationObject(this.languageId, "display-name"),
				tooltip: Util.getTranslationObject(this.languageId, "display-name-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 6,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", 6),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", 64),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		this.description = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "description",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "description-tooltip"),
				multipleLine: true
			}
		);

		this.basicProps = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramCode: "basicProps",
				paramVersion: "1.0.0",
				displayName: Util.getTranslationObject(this.languageId, "required-properties"),
				viewType: GroupParameter.ViewTypes.FIELDSET,
				members: [this.dataSetCode, this.dataSetVersion, this.displayName],
				membersPerRow: 3
			}
		);

		this.dataTypes = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.SELECT,
			{
				paramCode: "datatypes",
				displayName: Util.getTranslationObject(this.languageId, "associated-datatypes"),
				tooltip: Util.getTranslationObject(this.languageId, "associated-datatypes-tooltip"),
				viewType: SelectParameter.ViewTypes.CHECKBOX,
				optionsPerRow: 3,
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		);

		this.state = {
			editStatus: this.dataSetId > 0 ? EditStatus.UPDATE : EditStatus.ADD,
			infoDialog: false,
			confirmDeleteDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;
	}

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			console.log("[dataSetEditor] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		console.log("[dataSetEditor] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataSetEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[dataSetEditor] listenerWorkbenchReady received: ", dataPacket);
		this.fireRequest({
			requestId: Workbench.RequestIDs.loadDataSet,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				loadAvailableDataTypes: true
			}
		});
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataSetEditor] listenerResponse rejected: ", dataPacket);
			return;
		}

		console.log("[dataSetEditor] listenerResponse received: ", dataPacket);

		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.loadDataSet: {
				const dataSet = dataPacket.data.dataSet;

				this.dataSetCode.setValue({ value: dataSet.dataSetCode });
				this.dataSetVersion.setValue({ value: dataSet.dataSetVersion });
				this.displayName.setValue({ value: dataSet.displayName });
				this.description.setValue({ value: dataSet.description });

				if (Util.isNotEmpty(dataPacket.data.dataTypeList)) {
					this.dataTypes.setValue({
						value: dataPacket.data.dataTypeList.map((dataType) => {
							return dataType.dataTypeId;
						})
					});
				}

				if (Util.isNotEmpty(dataPacket.data.availableDataTypeList)) {
					this.availableDataTypeList = dataPacket.data.availableDataTypeList;
					this.dataTypes.options = this.availableDataTypeList.map((dataType) => {
						let label = {};
						Object.keys(dataType.displayName).forEach((key) => {
							label[key] = dataType.displayName[key] + " v." + dataType.dataTypeVersion;
						});

						return {
							value: dataType.dataTypeId,
							label: label
						};
					});

					this.dataTypes.refreshKey();
				}

				console.log("[dataSetEditor] response this.dataTypes: ", this.dataTypes);

				break;
			}
		}

		this.setState({ loadingStatus: LoadingStatus.COMPLETE });
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//Loading dataType
		//this.loadDataType();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataSetEditor] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	checkFieldError = () => {
		let error = this.dataSetCode.validate();
		let warning = null;
		if (error === -1) {
			this.dataSetCode.dirty = true;
			return this.dataSetCode.error;
		} else if (error === 1) {
			warning = this.dataSetCode.error;
		}

		error = this.dataSetVersion.validate();
		if (error === -1) {
			this.dataSetVersion.dirty = true;
			return this.dataSetVersion.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.dataSetVersion.error;
		}

		error = this.displayName.validate();
		if (error === -1) {
			this.displayName.dirty = true;
			return this.displayName.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.displayName.error;
		}

		error = this.description.validate();
		if (error === -1) {
			this.description.dirty = true;
			return this.description.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.description.error;
		}

		error = this.dataTypes.validate();
		if (error === -1) {
			this.dataTypes.dirty = true;
			return this.dataTypes.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.dataTypes.error;
		}

		return warning;
	};

	handleSaveClick = () => {
		const error = this.checkFieldError();
		console.log("handleSaveClick: ", error);
		if (Util.isNotEmpty(error)) {
			if (error.errorClass === ErrorClass.ERROR) {
				this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("fix-the-error-first", error.message);

				this.setState({ infoDialog: true });

				return;
			} else {
				this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("data-has-warning-do-you-proceed-anyway", error.message);

				this.setState({ waringAndSaveDialog: true });

				return;
			}
		}

		this.saveDataSet();
	};

	handleDeleteClick = () => {
		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	saveDataSet = () => {
		const associatedDataTypeIds = this.dataTypes.getValue().map((val) => val);
		const associatedDataTypes = this.availableDataTypeList.filter((dataType) => {
			console.log("Filter: ", dataType.dataTypeId, typeof dataType.dataTypeId);
			return associatedDataTypeIds.includes(dataType.dataTypeId);
		});

		console.log("associatedDataTypes: ", associatedDataTypeIds, associatedDataTypes);

		this.fireRequest({
			requestId: Workbench.RequestIDs.saveDataSet,
			params: {
				dataSetCode: this.dataSetCode.getValue(),
				dataSetVersion: this.dataSetVersion.getValue(),
				displayName: JSON.stringify(this.displayName.getValue()),
				description: JSON.stringify(this.description.getValue()),
				associatedDataTypes: JSON.stringify(associatedDataTypes)
			}
		});
	};

	deleteDataSet = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataSets,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetIds: [this.dataSetId]
			}
		});
	};

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <h3>Loading....</h3>;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <h3>Loading failed</h3>;
		}

		return (
			<div style={{ marginTop: "2rem" }}>
				{this.basicProps.render({ spritemap: this.spritemap })}
				{this.description.renderField({ spritemap: this.spritemap })}
				{this.dataTypes.renderField({ spritemap: this.spritemap })}
				<div style={{ width: "100%", marginTop: "1.5rem", display: "inline-flex", justifyContent: "center" }}>
					<Button.Group spaced>
						<Button
							title={Util.translate("save")}
							onClick={this.handleSaveClick}
						>
							<span className="inline-item inline-item-before">
								<Icon
									symbol="disk"
									spritemap={this.spritemap}
								/>
							</span>
							{Util.translate("save")}
						</Button>
						<Button
							title={Util.translate("delete")}
							onClick={this.handleDeleteClick}
							displayType="warning"
						>
							<span className="inline-item inline-item-before">
								<Icon
									symbol="trash"
									spritemap={this.spritemap}
								/>
							</span>
							{Util.translate("delete")}
						</Button>
					</Button.Group>
				</div>
				{this.state.infoDialog && (
					<SXModalDialog
						header={this.dialogHeader}
						body={this.dialogBody}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ infoDialog: false });
								}
							}
						]}
					/>
				)}
				{this.state.confirmDeleteDialog && (
					<SXModalDialog
						header={this.dialogHeader}
						body={this.dialogBody}
						buttons={[
							{
								label: Util.translate("confirm"),
								onClick: (e) => {
									this.deleteDataSet();
									this.setState({ confirmDeleteDialog: false });
								},
								displayType: "secondary"
							},
							{
								label: Util.translate("cancel"),
								onClick: (e) => {
									this.setState({ confirmDeleteDialog: false });
								}
							}
						]}
					/>
				)}
			</div>
		);
	}
}

export default DataSetEditor;
