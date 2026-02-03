import React from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import {
	EditStatus,
	ErrorClass,
	Event,
	LoadingStatus,
	ParamType,
	RequestIDs,
	ValidationRule
} from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { SXLabeledText } from "../Form/form";
import ParameterConstants from "../Parameter/parameter-constants";
import { ParameterUtil } from "../Parameter/parameters";

class DataSetEditor extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataSetEditor: ", props);

		this.dataCollectionId = this.params.dataCollectionId ?? 0;
		this.dataSetId = this.params.dataSetId ?? 0;

		this.associatedDataTypeList = [];
		this.availableDataTypeList = [];

		this.dataSetCode = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: ParamType.STRING,
			properties: {
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
				},
				style: {
					width: "250px"
				}
			}
		});

		const versionPlaceholder = {};
		versionPlaceholder[this.languageId] = "1.0.0";
		this.dataSetVersion = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: ParamType.STRING,
			properties: {
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
				defaultValue: "1.0.0",
				style: {
					width: "150px"
				}
			}
		});

		this.displayName = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: ParamType.STRING,
			properties: {
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
				},
				className: "autofit-col-expand"
			}
		});

		this.description = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "description",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "description-tooltip"),
				multipleLine: true
			}
		});

		this.basicProps = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: ParamType.GROUP,
			properties: {
				paramCode: "basicProps",
				paramVersion: "1.0.0",
				displayName: Util.getTranslationObject(this.languageId, "required-properties"),
				viewType: ParameterConstants.GroupViewTypes.FIELDSET,
				members: [this.dataSetCode, this.dataSetVersion, this.displayName],
				membersPerRow: 3,
				expanded: true
			}
		});

		this.dataTypes = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: "DualList",
			properties: {
				paramCode: "datatypes",
				displayName: Util.getTranslationObject(this.languageId, "associated-datatypes"),
				tooltip: Util.getTranslationObject(this.languageId, "associated-datatypes-tooltip"),
				viewType: ParameterConstants.DualListViewTypes.ORDERED
			}
		});

		this.state = {
			infoDialog: false,
			confirmDeleteDialog: false,
			waringAndSaveDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.componentId = this.namespace;
	}

	listenerFieldValueChanged = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.formId) {
			console.log("[dataSetEditor] listenerFieldValueChanged rejected: ", event.dataPacket, this.formId);

			return;
		}

		console.log("[dataSetEditor] listenerFieldValueChanged received: ", event.dataPacket, parameter);

		Event.fire(Event.SX_DATASET_CHANGED, this.namespace, this.workbenchNamespace, {
			dataSet: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				dataSetCode: this.dataSetCode.getValue(),
				dataSetVersion: this.dataSetVersion.getValue(),
				displayName: this.displayName.getValue(),
				description: this.description.getValue(),
				dataTypes: this.getAssociatedDataTypeInfos(this.dataTypes.getValue())
			}
		});
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[dataSetEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		//console.log("[dataSetEditor] listenerWorkbenchReady received: ", dataPacket);
		this.fireRequest({
			requestId: RequestIDs.loadDataSet,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				loadAvailableDataTypes: true
			}
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[dataSetEditor] listenerResponse rejected: ", event.dataPacket);
			return;
		}

		//console.log("[dataSetEditor] listenerResponse received: ", event.dataPacket);

		switch (requestId) {
			case RequestIDs.loadDataSet: {
				const {
					dataCollection,
					dataSet,
					associatedDataTypeList = [],
					availableDataTypeList = [],
					error
				} = data;

				if (Util.isNotEmpty(error)) {
					this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("loading-dataset-is-failed");

					this.setState({ infoDialog: true });

					break;
				}

				this.dataSetCode.setValue({ value: Util.isEmpty(dataSet) ? "" : dataSet.dataSetCode });
				this.dataSetVersion.setValue({ value: Util.isEmpty(dataSet) ? "1.0.0" : dataSet.dataSetVersion });
				this.displayName.setValue({ value: Util.isEmpty(dataSet) ? "" : dataSet.displayName });
				this.description.setValue({ value: Util.isEmpty(dataSet) ? "" : dataSet.description });

				if (Util.isNotEmpty(availableDataTypeList)) {
					this.availableDataTypeList = availableDataTypeList;
					this.dataTypes.options = this.availableDataTypeList.map((dataType) => {
						const { dataTypeVersion, dataTypeId, displayName } = dataType;

						let label = {};
						label[this.languageId] = displayName + " v." + dataTypeVersion;

						return {
							value: dataTypeId,
							label: label
						};
					});

					this.dataTypes.refreshKey();
				}

				if (Util.isNotEmpty(associatedDataTypeList)) {
					this.associatedDataTypeList = associatedDataTypeList;

					const dataTypeIds = associatedDataTypeList.map((dataType) => {
						const { dataTypeVersion, dataTypeId, displayName } = dataType;

						return {
							key: dataTypeId,
							label: displayName + " v." + dataTypeVersion,
							value: dataTypeId
						};
					});
					this.dataTypes.setValue({
						value: dataTypeIds
					});
				}

				//console.log("[dataSetEditor] response this.dataTypes: ", this.dataTypes);

				break;
			}
			case RequestIDs.saveDataSet: {
				//console.log("DataSetEditor.listenerResponse.saveDataSet: ", dataPacket.data);
				const { dataSet, error } = data;

				/*
				if (Util.isNotEmpty(error)) {
					this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
					this.dialogBody = Util.translate("saving-dataset-is-failed");

					this.setState({ infoDialog: true });

					break;
				}

				this.dialogHeader = SXModalUtil.successDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("dataset-saved-as", dataSet.dataSetId);

				this.setState({
					infoDialog: true
				});
				*/

				this.dataSetId = dataSet.dataSetId;

				Event.fire(Event.SX_DATASET_CHANGED, this.namespace, this.workbenchNamespace, {
					dataSet: {
						dataCollectionId: this.dataCollectionId,
						dataSetId: this.dataSetId,
						dataSetCode: this.dataSetCode.getValue(),
						dataSetVersion: this.dataSetVersion.getValue(),
						displayName: this.displayName.getValue(),
						description: this.description.getValue(),
						dataTypes: this.getAssociatedDataTypeInfos(this.dataTypes.getValue())
					}
				});

				break;
			}
		}

		this.setState({ loadingStatus: LoadingStatus.COMPLETE });
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataTypeEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		//console.log("[DataTypeEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//Loading dataType
		//this.loadDataType();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);

		this.fireHandshake();
	}

	componentWillUnmount() {
		//console.log("[DataSetEditor] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	getAssociatedDataTypeInfos(dataTypeStrIds) {
		const dataTypeIds = dataTypeStrIds.map((id) => Number(id));

		const associatedDataTypes = this.availableDataTypeList.filter((dataType) =>
			dataTypeIds.includes(Number(dataType.dataTypeId))
		);

		return associatedDataTypes;
	}

	initForm = () => {
		this.dataSetCode.initValue();
		this.dataSetVersion.initValue();
		this.displayName.initValue();
		this.description.initValue();
		this.dataTypes.initValue();
	};

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
		//console.log("handleSaveClick: ", error);
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

	handleDeleteClick = (event) => {
		event.stopPropagation();

		Event.fire(Event.SX_DELETE_DATASET, this.namespace, this.workbenchNamespace, {
			dataCollectionId: this.dataCollectionId,
			dataSetId: this.dataSetId
		});
	};

	saveDataSet = () => {
		//console.log("associatedDataTypeIDs: ", this.dataTypes.getValue());

		const params = {
			dataCollectionId: this.dataCollectionId,
			dataSetId: this.dataSetId,
			dataSetCode: this.dataSetCode.getValue(),
			dataSetVersion: this.dataSetVersion.getValue(),
			associatedDataTypes: this.dataTypes.getValue()
		};

		if (this.displayName.hasValue()) {
			params.displayName = JSON.stringify(this.displayName.getValue());
		}

		if (this.description.hasValue()) {
			params.description = JSON.stringify(this.description.getValue());
		}

		Event.fire(Event.SX_SAVE_DATASET, this.namespace, this.workbenchNamespace, {
			dataSet: params
		});
	};

	deleteDataSet = () => {
		this.fireRequest({
			requestId: RequestIDs.deleteDataSets,
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
			<>
				{this.dataSetId > 0 && (
					<SXLabeledText
						label={Util.translate("dataset-id")}
						text={this.dataSetId}
						align="left"
						viewType="INLINE_ATTACH"
						style={{ marginBottom: "1rem", marginTop: "1.5rem" }}
					/>
				)}
				<div style={{ marginTop: "2rem" }}>
					{this.basicProps.render({ spritemap: this.spritemap })}
					{this.description.renderField({ spritemap: this.spritemap })}
					{this.dataTypes.renderField({ spritemap: this.spritemap })}
					<div
						style={{ width: "100%", marginTop: "1.5rem", display: "inline-flex", justifyContent: "center" }}
					>
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
					{this.state.waringAndSaveDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("confirm"),
									onClick: (e) => {
										this.saveDataSet();
										this.setState({ waringAndSaveDialog: false });
									},
									displayType: "secondary"
								},
								{
									label: Util.translate("cancel"),
									onClick: (e) => {
										this.setState({ waringAndSaveDialog: false });
									}
								}
							]}
						/>
					)}
				</div>
			</>
		);
	}
}

export default DataSetEditor;
