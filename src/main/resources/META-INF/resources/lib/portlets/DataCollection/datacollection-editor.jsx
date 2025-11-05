import React from "react";
import { Util } from "../../stationx/util";
import { EditStatus, ErrorClass, Event, LoadingStatus, ParamType, ValidationRule } from "../../stationx/station-x";
import { DualListParameter, GroupParameter, Parameter, SelectParameter } from "../../stationx/parameter";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";
import { SXLabeledText } from "../../stationx/form";

class DataCollectionEditor extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataCollectionEditor props: ", props);

		this.dataCollectionId = this.params.dataCollectionId ?? 0;

		this.state = {
			editStatus: this.dataCollectionId > 0 ? EditStatus.UPDATE : EditStatus.ADD,
			infoDialog: false,
			confirmDeleteDialog: false,
			waringAndSaveDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.dataCollectionCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataCollectionCode",
				displayName: Util.getTranslationObject(this.languageId, "datacollection-code"),
				placeholder: Util.getTranslationObject(this.languageId, "datacollection-code"),
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
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", "3"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", "32"),
						errorClass: ErrorClass.ERROR
					}
				},
				style: {
					width: "250px"
				}
			}
		);

		this.dataCollectionVersion = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataCollectionVersion",
				displayName: Util.getTranslationObject(this.languageId, "version"),
				placeholder: Util.getTranslationObject(this.languageId, "1.0.0"),
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
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", "6"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", "64"),
						errorClass: ErrorClass.ERROR
					}
				},
				className: "autofit-col-expand"
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

		this.groupParameter = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramCode: "requiredProps",
				paramVersion: "1.0.0",
				displayName: Util.getTranslationObject(this.languageId, "required-properties"),
				viewType: GroupParameter.ViewTypes.FIELDSET,
				members: [this.dataCollectionCode, this.dataCollectionVersion, this.displayName],
				membersPerRow: 3
			}
		);

		this.dataSets = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			"DualList",
			{
				paramCode: "dataSets",
				displayName: Util.getTranslationObject(this.languageId, "associated-datasets"),
				tooltip: Util.getTranslationObject(this.languageId, "associated-datasets-tooltip"),
				viewType: DualListParameter.ViewTypes.ORDERED
			}
		);
	}

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataCollectionEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[dataCollectionEditor] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.loadDataCollection,
			params: {
				dataCollectionId: this.dataCollectionId,
				loadAvailableDataSets: true
			}
		});
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataCollectionEditor] listenerResponce rejected: ", dataPacket);
			return;
		}

		console.log("[dataCollectionEditor] listenerResonse: ", dataPacket);
		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.loadDataCollection: {
				const {
					dataCollectionCode,
					dataCollectionVersion = "1.0.0",
					displayName,
					description,
					associatedDataSetList = [],
					availableDataSetList = []
				} = dataPacket.data;

				this.dataCollectionCode.setValue({ value: dataCollectionCode });
				this.dataCollectionVersion.setValue({ value: dataCollectionVersion });
				this.displayName.setValue({ value: displayName });
				this.description.setValue({ value: description });
				this.dataCollectionCode.refreshKey();
				this.dataCollectionVersion.refreshKey();
				this.displayName.refreshKey();
				this.description.refreshKey();

				console.log("DataCollectionEditor.listenerResponse : associatedDataSetList", associatedDataSetList);

				if (Util.isNotEmpty(availableDataSetList)) {
					this.availableDataSetList = availableDataSetList;
					this.dataSets.options = this.availableDataSetList.map((dataSet) => {
						let label = {};
						label[this.languageId] = dataSet.displayName;

						return {
							key: dataSet.dataSetId,
							value: dataSet.dataSetId,
							label: label
						};
					});
				}

				if (Util.isNotEmpty(associatedDataSetList)) {
					const associatedDataSetIds = associatedDataSetList.map((dataSet) => {
						const { dataSetCode, dataSetVersion, dataSetId, displayName } = dataSet;

						return {
							key: dataSetId,
							label: displayName + " v." + dataSetVersion,
							value: dataSetId
						};
					});

					this.dataSets.setValue({
						value: associatedDataSetIds
					});
				}

				this.dataSets.refreshKey();

				this.setState({
					loadingStatus: LoadingStatus.COMPLETE
				});

				break;
			}
			case Workbench.RequestIDs.saveDataCollection: {
				this.dataCollectionId = dataPacket.data.dataCollectionId;

				this.dialogHeader = SXModalUtil.successDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("datacollection-saved-as", dataPacket.data.dataCollectionId);

				this.setState({
					infoDialog: true,
					editStatus: EditStatus.UPDATE,
					loadingStatus: LoadingStatus.COMPLETE
				});

				break;
			}
		}
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataCollectionEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataCollectionEditor] componentWillUnmount");
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	checkFieldError = () => {
		let error = this.dataCollectionCode.validate();
		let warning = null;
		if (error === -1) {
			this.dataCollectionCode.dirty = true;
			return this.dataCollectionCode.error;
		} else if (error === 1) {
			warning = this.dataCollectionCode.error;
		}

		console.log("dataCollectionVersion: ", this.dataCollectionVersion.getValue());
		error = this.dataCollectionVersion.validate();
		if (error === -1) {
			this.dataCollectionVersion.dirty = true;
			return this.dataCollectionVersion.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.dataCollectionVersion.error;
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

		error = this.dataSets.validate();
		if (error === -1) {
			this.dataSets.dirty = true;
			return this.dataSets.error;
		} else if (error === 1 && Util.isEmpty(warning)) {
			warning = this.dataSets.error;
		}

		return warning;
	};

	handleSaveDataCollection = () => {
		const error = this.checkFieldError();

		if (Util.isNotEmpty(error)) {
			if (error.errorClass === ErrorClass.ERROR) {
				this.dialogHeader = SXModalUtil.errorDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("fix-the-error-first", error.message);

				this.setState({ infoDialog: true });
			} else {
				this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
				this.dialogBody = Util.translate("data-has-warning-do-you-proceed-anyway", error.message);

				this.setState({ waringAndSaveDialog: true });
			}

			return;
		}

		this.saveDataCollection();
	};

	handleDeleteClick = () => {
		this.dialogHeader = SXModalUtil.warningDlgHeader(this.spritemap);
		this.dialogBody = Util.translate("this-is-not-recoverable-are-you-sure-to-proceed");

		this.setState({ confirmDeleteDialog: true });
	};

	saveDataCollection = () => {
		let data = {};
		data.dataCollectionId = this.dataCollectionId;
		data.dataCollectionCode = this.dataCollectionCode.getValue();
		data.dataCollectionVersion = this.dataCollectionVersion.getValue();
		data.displayName = this.displayName.getValue();
		data.description = this.description.getValue();

		//console.log("saveDataCollection: ", this.dataSets.getValue());

		this.fireRequest({
			requestId: Workbench.RequestIDs.saveDataCollection,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataCollectionCode: this.dataCollectionCode.getValue(),
				dataCollectionVersion: this.dataCollectionVersion.getValue(),
				displayName: JSON.stringify(this.displayName.getValue()),
				description: JSON.stringify(this.description.getValue()),
				associatedDataSetList: this.dataSets.getValue()
			}
		});
	};

	deleteDataCollection = () => {
		this.fireRequest({
			requestId: Workbench.RequestIDs.deleteDataCollections,
			params: {
				dataCollectionIds: [this.dataCollectionId]
			}
		});
	};

	render() {
		return (
			<>
				{this.state.editStatus === EditStatus.UPDATE && (
					<SXLabeledText
						label={Util.translate("datacollection-id")}
						text={this.dataCollectionId}
						align="left"
						viewType="INLINE_ATTACH"
						style={{ marginBottom: "1rem", marginTop: "1.5rem" }}
					/>
				)}
				<div style={{ marginTop: "2rem" }}>
					{this.groupParameter.render({ spritemap: this.spritemap })}
					{this.description.renderField({ spritemap: this.spritemap })}
					{this.dataSets.renderField({ spritemap: this.spritemap })}
					<Button.Group
						spaced
						style={{ width: "100%", justifyContent: "center" }}
					>
						<Button
							displayType="primary"
							onClick={this.handleSaveDataCollection}
							title={Util.translate("save-datacollection")}
						>
							<Icon
								symbol="disk"
								spritemap={this.spritemap}
								style={{ marginRight: "5px" }}
							/>
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
										this.deleteDataCollection();
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
										this.saveDataCollection();
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

export default DataCollectionEditor;
