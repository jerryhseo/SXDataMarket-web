import React from "react";
import { Util } from "../../stationx/util";
import { Event, ExecutionMode, LoadingStatus, ParamType } from "../../stationx/station-x";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import DataStructure from "../DataStructure/data-structure";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { Text } from "@clayui/core";
import { SXLabeledText } from "../Form/form";

class StructuredDataEditor extends SXBaseVisualizer {
	static EditState = {
		WAIT: "wait",
		PREVIEW: "preview",
		ADD: "add",
		UPDATE: "update",
		VIEW: "view",
		ERROR: "error"
	};

	constructor(props) {
		super(props);

		//console.log("StructuredDataEditor props: ", props);

		this.editState = this.params.editState ?? StructuredDataEditor.EditState.PREVIEW;
		this.dataCollectionId = this.params.dataCollectionId ?? 0;
		this.dataSetId = this.params.dataSetId ?? 0;
		this.dataTypeId = this.params.dataTypeId ?? 0;
		this.dataStructureId = this.params.dataStructureId ?? 0;
		this.structuredDataId = this.params.structuredDataId ?? 0;
		this.structuredData = null;

		this.dataStructure = null;

		this.state = {
			noticeDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.abstract = "";
		/*
		console.log(
			"StructuredDataEditor constructor: ",
			this.namespace,
			this.portletId,
			this.workbenchId,
			this.workbenchNamespace,
			this.editState
		);
		*/
	}

	listenerLoadData = (event) => {
		const { targetPortlet, data } = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("StructuredDataEditor listenerLoadData REJECTED: ", event.dataPacket);
			return;
		}

		console.log("StructuredDataEditor listenerLoadData: ", event.dataPacket);

		this.structuredData = data;
		this.forceUpdate();
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[StructuredDataEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		//console.log("[StructuredDataEditor] listenerWorkbenchReady received: ", dataPacket, "++" + this.editState);

		switch (this.editState) {
			case StructuredDataEditor.EditState.PREVIEW:
			case StructuredDataEditor.EditState.ADD: {
				this.fireRequest({
					requestId: Workbench.RequestIDs.loadDataStructure,
					params: {
						dataTypeId: this.dataTypeId
					}
				});

				this.setState({ loadingStatus: LoadingStatus.PENDING });
				break;
			}
			case StructuredDataEditor.EditState.UPDATE: {
				this.fireRequest({
					requestId: Workbench.RequestIDs.loadStructuredData,
					params: {
						structuredDataId: this.structuredDataId
					}
				});

				this.setState({ loadingStatus: LoadingStatus.PENDING });
				break;
			}
		}
	};

	listenerResponce = (event) => {
		const { targetPortlet, requestId, data, params, status } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[StructuredDataEditor] listenerResponce rejected: ", event.dataPacket);
			return;
		}

		console.log("[StructuredDataEditor] listenerResonse: ", event.dataPacket);

		switch (requestId) {
			case Workbench.RequestIDs.loadStructuredData: {
				const { dataStructure, structuredData } = data;

				this.structuredData = structuredData;

				const { dataCollectionId, dataSetId, dataTypeId, structuredDataId } = structuredData;

				this.dataCollectionId = dataCollectionId;
				this.dataSetId = dataSetId;
				this.dataTypeId = dataTypeId;
				this.structuredDataId = structuredDataId;

				this.dataStructure = new DataStructure({
					namespace: this.namespace,
					formId: this.portletId,
					properties: dataStructure ?? {}
				});

				this.dataStructure.loadData(structuredData.data);

				console.log("DataStructure filled with values: ", this.dataStructure);
				break;
			}
			case Workbench.RequestIDs.loadDataStructure: {
				const { dataStructure } = data;
				this.dataStructure = new DataStructure({
					namespace: this.namespace,
					formId: this.portletId,
					properties: dataStructure ?? {}
				});

				break;
			}
			case Workbench.RequestIDs.saveStructuredData: {
				console.log("Saved data result: ", data);
				if (data.structuredDataId > 0) {
					this.structuredDataId = data.structuredDataId;
					this.structuredData = data;
				}

				this.dialogHeader = SXModalUtil.successDlgHeader();
				this.dialogBody = Util.translate("data-saved-as");

				this.setState({ noticeDialog: true });
				break;
			}
			case Workbench.RequestIDs.downloadFieldAttachedFile: {
				console.log("download finished");
				const blob = new Blob([data]);
				const url = window.URL.createObjectURL(blob);

				const link = document.createElement("a");
				link.href = url;
				link.download = params.fileName;
				link.click();

				window.URL.revokeObjectURL(url);
			}
		}

		this.setState({ loadingStatus: status });
	};

	listenerFieldValueChanged = (event) => {
		const { targetPortlet, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataEditor] listenerFieldValueChanged rejected: ", event.dataPacket);
			return;
		}

		const structuredData = this.dataStructure.toData();
		//console.log("[StructuredDataEditor] listenerFieldValueChanged received: ", event.dataPacket, structuredData);

		const files = this.dataStructure.getFiles();

		//console.log("[StructuredDataEditor files] ", files);
		//console.log("[StructuredDataEditor data] ", structuredData);

		Event.fire(Event.SX_STRUCTURED_DATA_CHANGED, this.namespace, this.workbenchNamespace, {
			targetFormId: this.sourceFormId,
			dataCollectionId: this.dataCollectionId,
			dataSetId: this.dataSetId,
			dataTypeId: this.dataTypeId,
			structuredDataId: this.structuredDataId,
			data: structuredData
		});
	};

	listenerDownloadFieldAttachedFile = (event) => {
		const { targetPortlet, fileName, fileType, paramCode, paramVersion } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			console.log("[StructuredDataEditor] listenerDownloadFieldAttachedFile rejected: ", event.dataPacket);
			return;
		}

		console.log("[StructuredDataEditor] listenerDownloadFieldAttachedFile received: ", event.dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.downloadFieldAttachedFile,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				dataTypeId: this.dataTypeId,
				structuredDataId: this.structuredDataId,
				paramCode: paramCode,
				paramVersion: paramVersion,
				fileName: fileName,
				fileType: fileType,
				disposition: "attachment"
			}
		});
	};

	listenerComponentWillUnmount = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataEditor] listenerComponentWillUnmount rejected: ", event.dataPacket);
			return;
		}

		//console.log("[StructuredDataEditor] listenerComponentWillUnmount received: ", event.dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		//this.loadStructuredData();
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_DOWNLOAD_FIELD_ATTACHED_FILE, this.listenerDownloadFieldAttachedFile);

		this.fireHandshake();
	}

	componentWillUnmount() {
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_DOWNLOAD_FIELD_ATTACHED_FILE, this.listenerDownloadFieldAttachedFile);
	}

	loadStructuredData = async () => {
		const params = {
			dataCollectionId: this.dataCollectionId,
			dataSetId: this.dataSetId,
			dataTypeId: this.dataTypeId,
			dataStructureId: this.dataStructureId,
			structuredDataId: this.dataStructureId
		};

		//this.visualizer.loadData(ResourceIds.LOAD_STRUCTURED_DATA_EDITING, params);
	};

	handleSaveData = () => {
		const data = this.dataStructure.toData();
		console.log("handleSaveData: ", data);

		const files = this.dataStructure.getDataFiles();

		console.log("[StructuredDataEditor files] ", files);
		console.log("[StructuredDataEditor data] ", data);

		console.log("Handle SaveData: ", this.dataCollectionId, this.dataSetId, this.dataTypeId, this.structuredDataId);

		this.fireRequest({
			requestId: Workbench.RequestIDs.saveStructuredData,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				dataTypeId: this.dataTypeId,
				structuredDataId: this.structuredDataId,
				files: files,
				data: JSON.stringify(data)
			}
		});
	};

	handleCancel = () => {
		Event.fire(Event.SX_REMOVE_WINDOW, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	};

	render() {
		//console.log("Editor render: ", this.dataStructure, this.loadingStatus);
		if (this.loadingStatus === LoadingStatus.PENDING) {
			return <h3>Loading...</h3>;
		} else if (this.loadingStatus === LoadingStatus.FAIL) {
			return <h3>Loading Failed</h3>;
		} else {
			return (
				<>
					{this.structuredDataId > 0 && (
						<div
							className="autofit-row"
							style={{ paddingRight: "10px" }}
						>
							<div className="autofit-col autofit-col-expand">
								<SXLabeledText
									label={Util.translate("id")}
									text={this.structuredDataId}
									spritemap={this.spritemap}
								/>
							</div>
							{this.structuredData && <div className="autofit-col"></div>}
						</div>
					)}
					<div
						className="autofit-row"
						style={{ backgroundColor: "#fff", paddingTop: "1.5rem", paddingRight: "10px" }}
					>
						<div className="autofit-col autofit-col-expand">
							{Util.isNotEmpty(this.dataStructure) &&
								this.dataStructure.render({ canvasId: this.namespace, spritemap: this.spritemap })}
						</div>
					</div>
					{this.buttons && (
						<Button.Group
							spaced
							style={{
								width: "100%",
								justifyContent: "center",
								marginTop: "1.5rem",
								marginBottom: "1.5rem"
							}}
						>
							<Button
								displayType="primary"
								onClick={this.handleSaveData}
								title={Util.translate("save-data")}
							>
								<Icon
									symbol="disk"
									spritemap={this.spritemap}
									style={{ marginRight: "5px" }}
								/>
								{Util.translate("save")}
							</Button>
							<Button
								displayType="secondary"
								onClick={this.handleCancel}
								title={Util.translate("cancel")}
							>
								{Util.translate("cancel")}
							</Button>
						</Button.Group>
					)}
					{this.state.noticeDialog && (
						<SXModalDialog
							header={this.dialogHeader}
							body={this.dialogBody}
							buttons={[
								{
									label: Util.translate("ok"),
									onClick: (e) => {
										this.setState({ noticeDialog: false });
									}
								}
							]}
						/>
					)}
				</>
			);
		}
	}
}

export default StructuredDataEditor;
