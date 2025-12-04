import React from "react";
import { Util } from "../../stationx/util";
import { Event, ExecutionMode, LoadingStatus } from "../../stationx/station-x";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import DataStructure from "../DataStructure/data-structure";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";

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

		this.subject = this.params.subject;

		this.dataCollectionId = this.params.dataCollectionId ?? 0;
		this.dataSetId = this.params.dataSetId ?? 0;
		this.dataTypeId = this.params.dataTypeId ?? 0;
		this.dataStructureId = this.params.dataStructureId ?? 0;
		this.structuredDataId = this.params.structuredDataId ?? 0;

		this.structuredDataInfo = [];
		this.dataStructure = null;

		this.setEditState();

		this.state = {
			loadingStatus: LoadingStatus.PENDING
		};

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

	setEditState() {
		if (this.structuredDataId > 0) {
			this.editState = StructuredDataEditor.EditState.UPDATE;
		} else {
			if (this.dataCollectionId > 0 && this.dataSetId > 0 && this.dataTypeId > 0) {
				this.editState = StructuredDataEditor.EditState.ADD;
			} else if (this.dataStructureId > 0) {
				this.editState = StructuredDataEditor.EditState.PREVIEW;
			} else {
				StructuredDataEditor.EditState.ERROR;
			}
		}
	}

	listenerLoadData = (event) => {
		const dataPacket = event.dataPacket;

		console.log("StructuredDataEditor listenerLoadData: ", dataPacket);
		if (dataPacket.targetPortlet !== this.namespace) {
			return;
		}

		console.log("StructuredDataEditor listenerLoadData: ", dataPacket);

		this.subject = dataPacket.data.subject;
		this.dataCollection = dataPacket.data.dataCollection;
		this.dataSet = dataPacket.data.dataSet;
		this.dataType = dataPacket.data.dataType;
		this.dataStructure = new DataStructure({
			namespace: this.namespace,
			formId: this.portletId,
			properties: dataPacket.data.dataStructure ?? {}
		});

		this.typeStructureLink = dataPacket.data.typeStructureLink;

		this.forceUpdate();
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[StructuredDataEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[StructuredDataEditor] listenerWorkbenchReady received: ", dataPacket, this.editState);

		if (this.editState === StructuredDataEditor.EditState.PREVIEW) {
			this.fireRequest({
				requestId: Workbench.RequestIDs.loadDataStructure,
				params: {
					dataStructureId: this.dataStructureId
				},
				refresh: true
			});
		} else if (this.editState === StructuredDataEditor.EditState.ADD) {
			this.fireRequest({
				requestId: Workbench.RequestIDs.loadDataStructureWithInfo,
				params: {
					dataCollectionId: this.dataCollectionId,
					dataSetId: this.dataSetId,
					dataTypeId: this.dataTypeId,
					dataStructureId: this.dataStructureId
				},
				refresh: true
			});
		} else if (this.editState === StructuredDataEditor.EditState.UPDATE) {
			this.fireRequest({
				requestId: Workbench.RequestIDs.loadStructuredData,
				params: {
					structuredDataId: 0
				},
				refresh: true
			});
		}

		this.setState({ loadingStatus: LoadingStatus.PENDING });
	};

	listenerResponce = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[StructuredDataEditor] listenerResponce rejected: ", dataPacket);
			return;
		}

		console.log("[StructuredDataEditor] listenerResonse: ", dataPacket);

		const data = dataPacket.data;
		switch (dataPacket.requestId) {
			case Workbench.RequestIDs.loadDataStructureWithInfo:
			case Workbench.RequestIDs.loadStructuredData: {
				this.dataCollection = data.dataCollection;
				this.dataSet = data.dataSet;
				this.dataType = data.dataType;
				this.dataStructure = new DataStructure({
					namespace: this.namespace,
					formId: this.portletId,
					properties: data.dataStructure ?? {}
				});

				this.typeStructureLink = data.typeStructureLink ?? {};

				break;
			}
			case Workbench.RequestIDs.loadDataStructure: {
				this.dataStructure = new DataStructure({
					namespace: this.namespace,
					formId: this.portletId,
					properties: data.dataStructure ?? {}
				});

				break;
			}
		}

		this.setState({ loadingStatus: dataPacket.status });
	};

	listenerFieldValueChanged = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[StructuredDataEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		//console.log("[StructuredDataEditor] listenerComponentWillUnmount received: ", dataPacket);
		if (this.execMode === ExecutionMode.WORKBENCH_BASED) {
			Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
				requestId: Workbench.RequestIDs.saveStructuredData,
				params: {
					dataCollectionId: this.dataCollectionId,
					dataSetId: this.dataSetId,
					dataTypeId: this.dataTypeId,
					structuredDataId: this.dataStructureId,
					data: this.dataStructure.toData()
				}
			});
		} else {
		}
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[StructuredDataEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		//console.log("[StructuredDataEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//this.loadStructuredData();
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
	}

	componentWillUnmount() {
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
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
		console.log("handleSaveData: ", this.dataStructure.toData());

		Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
			requestId: Workbench.RequestIDs.saveStructuredData,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				dataTypeId: this.dataTypeId,
				structuredDataId: this.dataStructureId,
				data: this.dataStructure.toData()
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
					<div style={{ paddingRight: "10px" }}>
						<div
							className="autofit-row"
							style={{ backgroundColor: "#ecf5de", padding: "5px 10px" }}
						>
							<div className="autofit-col autofit-col-expand">
								{(Util.isNotEmpty(this.dataCollection) ||
									Util.isNotEmpty(this.dataSet) ||
									Util.isNotEmpty(this.dataType)) && (
									<div className="autofit-row">
										{Util.isNotEmpty(this.dataCollection) && (
											<>
												<div className="autofit-col shrink">
													<Icon
														symbol="angle-right"
														spritemap={this.spritemap}
													/>
												</div>
												<div className="autofit-col shrink">
													{this.dataCollection.displayName}
												</div>
											</>
										)}
										{Util.isNotEmpty(this.dataSet) && (
											<>
												<div className="autofit-col shrink">
													<Icon
														symbol="angle-right"
														spritemap={this.spritemap}
													/>
												</div>
												<div className="autofit-col shrink">{this.dataSet.displayName}</div>
											</>
										)}
										{Util.isNotEmpty(this.dataType) && (
											<>
												<div className="autofit-col shrink">
													<Icon
														symbol="angle-right"
														spritemap={this.spritemap}
													/>
												</div>
												<div className="autofit-col shrink">{this.dataType.displayName}</div>
											</>
										)}
									</div>
								)}
							</div>
							<div className="autofit-col shrink">{this.subject}</div>
						</div>
					</div>
					<div
						className="autofit-row"
						style={{ backgroundColor: "#fff", paddingTop: "1.5rem", paddingRight: "10px" }}
					>
						<div className="autofit-col autofit-col-expand">
							{Util.isNotEmpty(this.dataStructure) &&
								this.dataStructure.render({ canvasId: this.namespace, spritemap: this.spritemap })}
						</div>
					</div>
					<Button.Group
						spaced
						style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem", marginBottom: "1.5rem" }}
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
					{/* 
			<div>
				{StructuredDataEditor.EditState.UPDATE || StructuredDataEditor.EditState.ADD}
				<SXDataTypeStructureLink
					namespace={this.namespace}
					formId={this.editorId}
					dataType={this.dataType}
					dataTypeViewMode={DataTypeStructureLink.ViewTypes.VIEW}
					typeStructureLink={this.typeStructureLink}
					typeStructureLinkViewMode={DataTypeStructureLink.ViewTypes.EDIT}
					spritemap={this.spritemap}
				/>
				<Toolbar
					style={{ paddingLeft: "10px", paddingRight: "10px", background: "#d8f2df", marginBottom: "15px" }}
				>
					<Toolbar.Nav>
						<Toolbar.Item expand>
							{this.typeStructureLink.jumpTo && (
								<Toolbar.Section>
									<ClayInput.Group small>
										<ClayInput.GroupItem shrink>
											<label className="component-title">{Util.translate("jump-to")}</label>
										</ClayInput.GroupItem>
										<ClayInput.GroupItem
											shrink
											prepend
										>
											<ClayButtonWithIcon
												aria-labelledby={Util.translate("jump-to")}
												symbol="search"
												spritemap={this.spritemap}
												displayType="secondary"
												onClick={(e) => this.jumpTo()}
											/>
										</ClayInput.GroupItem>
									</ClayInput.Group>
								</Toolbar.Section>
							)}
						</Toolbar.Item>
						{this.typeStructureLink.inputStatus && (
							<Toolbar.Item>
								<Toolbar.Section>
									<ClayInput.Group small>
										<ClayInput.GroupItem shrink>
											<ClayInput.GroupText
												style={{ backgroundColor: "#f3ded7", borderRadius: "1.0rem" }}
											>
												{this.dataStructure.valuedFieldsCount +
													"/" +
													this.dataStructure.totalFieldsCount +
													"(" +
													(
														(this.dataStructure.valuedFieldsCount /
															this.dataStructure.totalFieldsCount) *
														100
													).toFixed(1) +
													"%)"}
											</ClayInput.GroupText>
										</ClayInput.GroupItem>
									</ClayInput.Group>
								</Toolbar.Section>
							</Toolbar.Item>
						)}
						<Toolbar.Item>
							<Toolbar.Section>
								<Button.Group spaced>
									<ClayButtonWithIcon
										title={Util.translate("save")}
										aria-labelledby={Util.translate("save")}
										symbol="disk"
										size="sm"
										spritemap={this.spritemap}
									/>
									<ClayButtonWithIcon
										title={Util.translate("structured-data-editor")}
										aria-labelledby={Util.translate("structured-data-editor")}
										displayType="secondary"
										symbol="order-form-pencil"
										size="sm"
										spritemap={this.spritemap}
									/>
								</Button.Group>
							</Toolbar.Section>
						</Toolbar.Item>
					</Toolbar.Nav>
				</Toolbar>
				<div className="field-area"></div>
			</div>
			*/}
				</>
			);
		}
	}
}

export default StructuredDataEditor;
