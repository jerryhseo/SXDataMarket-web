import React from "react";
import { Util } from "../../stationx/util";
import { EditStatus, Event, LoadingStatus, ResourceIds } from "../../stationx/station-x";
import { DataTypeStructureLink, SXDataTypeStructureLink } from "../DataType/datatype";
import Toolbar from "@clayui/toolbar";
import { ClayInput } from "@clayui/form";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import Visualizer from "../../stationx/visualizer";
import Icon from "@clayui/icon";
import { DataStructure } from "../DataStructure/data-structure";

class StructuredDataEditor extends React.Component {
	static EditState = {
		WAIT: "wait",
		PREVIEW: "preview",
		ADD: "add",
		UPDATE: "update",
		VIEW: "view"
	};

	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.languageId = SXSystem.getLanguageId();
		this.defaultLanguageId = SXSystem.getDefaultLanguageId();
		this.availableLanguageIds = SXSystem.getAvailableLanguages();

		this.baseResourceURL = props.baseResourceURL;
		this.spritemap = props.spritemapPath;
		this.workbenchNamespace = props.workbenchNamespace;
		this.workbenchId = props.workbenchId;
		this.permissions = props.permissions;
		this.portletId = props.portletId;

		this.subject = props.subject;

		this.dataCollectionId = props.dataCollectionId ?? 0;
		this.dataSetId = props.dataSetId ?? 0;
		this.dataTypeId = props.dataTypeId ?? 0;
		this.dataStructureId = props.dataStructureId ?? 0;
		this.structuredDataId = props.structuredDataId ?? 0;

		this.structuredDataInfo = [];
		this.dataStructure = null;

		this.editStatus = props.editStatus;

		this.visualizer = new Visualizer({
			namespace: this.namespace,
			workbenchNamespace: this.workbenchNamespace,
			workbenchId: this.workbenchId,
			visualizerId: this.portletId
		});

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
			this.editStatus
		);
		*/
	}

	setEditState() {
		this.editState = StructuredDataEditor.EditState.WAIT;

		if (this.structuredDataId > 0) {
			this.editState = StructuredDataEditor.EditState.UPDATE;
		} else {
			if (this.dataCollectionId > 0 && this.dataSetId > 0 && this.dataTypeId > 0) {
				this.editState = StructuredDataEditor.EditState.ADD;
			} else if (this.dataStructureId > 0) {
				this.editState = StructuredDataEditor.EditState.PREVIEW;
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
		this.dataStructure = new DataStructure(
			this.namespace,
			this.portletId,
			this.languageId,
			this.availableLanguageIds,
			dataPacket.data.dataStructure ?? {}
		);

		this.typeStructureLink = dataPacket.data.typeStructureLink;

		this.forceUpdate();
	};

	componentDidMount() {
		//this.loadStructuredData();
		Event.on(Event.SX_LOAD_DATA, this.listenerLoadData);
		this.visualizer.fireHandshake();
	}

	componentWillUnmount() {
		Event.off(Event.SX_LOAD_DATA, this.listenerLoadData);
	}

	loadStructuredData = async () => {
		const params = {
			cmd: this.editStatus,
			dataCollectionId: this.dataCollectionId,
			dataSetId: this.dataSetId,
			dataTypeId: this.dataTypeId,
			dataStructureId: this.dataStructureId,
			structuredDataId: this.dataStructureId
		};

		const ajaxURL = await this.workbenchId.loadData(ResourceIds.LOAD_STRUCTURED_DATA_EDITING, params);

		try {
			const response = await fetch("https://api.example.com/data");
			if (!response.ok) throw new Error("Fetch failed");
			const data = await response.json();
			console.log("Data:", data);
		} catch (error) {
			console.error("Error:", error);
		}
	};

	handleSaveData = () => {
		console.log("handleSaveData: ", this.dataStructure.toData());
	};

	handleCancel = () => {
		Event.fire(Event.SX_REMOVE_WINDOW, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	};

	render() {
		console.log("Editor render: ", this.dataStructure);
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
											<div className="autofit-col shrink">{this.dataCollection.displayName}</div>
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

export default StructuredDataEditor;
