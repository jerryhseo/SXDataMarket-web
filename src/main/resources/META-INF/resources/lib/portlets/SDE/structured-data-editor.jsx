import React from "react";
import { Util } from "../../stationx/util";
import { Event, LoadingStatus } from "../../stationx/station-x";
import { DataTypeStructureLink, SXDataTypeStructureLink } from "../DataType/datatype";
import Toolbar from "@clayui/toolbar";
import { ClayInput } from "@clayui/form";
import Button, { ClayButtonWithIcon } from "@clayui/button";

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
		this.baseResourceURL = props.baseResourceURL;
		this.spritemap = props.spritemapPath;
		this.workbenchNamespace = props.workbenchNamespace;
		this.workbenchId = props.workbenchId;
		this.permissions = props.permissions;
		this.portletId = props.portletId;

		this.dataCollectionId = props.dataCollectionId ?? 0;
		this.dataSetId = props.dataSetId ?? 0;
		this.dataTypeId = props.dataTypeId ?? 0;
		this.dataStructureId = props.dataStructureId ?? 0;
		this.structuredDataId = props.structuredDataId ?? 0;

		this.structuredDataInfo = [];
		this.dataStructure = null;

		this.setEditState();

		this.visual;

		this.state = {
			loadingStatus: LoadingStatus.PENDING
		};
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

	listenerLoadData = (event) => {};

	componentDidMount() {
		console.log("StructuredDataEditor: ", this.props);

		if (Util.isNotEmpty(this.typeStructureLink)) {
			this.dataTypeId =
				this.typeStructureLink.dataTypeId > 0 ? this.typeStructureLink.dataTypeId : this.dataTypeId;
			this.dataStructureId =
				this.typeStructureLink.dataStructureId > 0
					? this.typeStructureLink.dataStructureId
					: this.dataStructureId;
		}

		if (Util.isNotEmpty(this.workbenchNamespace)) {
			Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
				targetFormId: this.workbenchId
			});
		}
	}

	componentWillUnmount() {}

	loadStructuredData;

	render() {
		return (
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
		);
	}
}

export default StructuredDataEditor;
