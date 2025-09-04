import React from "react";
import { Event } from "../../stationx/station-x";
import { DataStructure } from "./data-structure";
import Toolbar from "@clayui/toolbar";
import { ClayInput } from "@clayui/form";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { Autocomplete } from "@clayui/autocomplete";
import { Util } from "../../stationx/util";

class SXDataStructurePreviewer extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.dataStructure.namespace;
		this.formIds = props.formIds;
		this.dataStructure = props.dataStructure;
		this.typeStructureLink = props.typeStructureLink;
		this.spritemap = props.spritemap;

		this.state = {
			jumpToItems: this.dataStructure.getJumpToItems()
		};
	}

	fieldValueChangedHandler = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.formIds.previewCanvasId)
			return;

		console.log(
			"SXDataStructurePreviewer SX_FIELD_VALUE_CHANGED RECEIVED: ",
			dataPacket,
			this.dataStructure,
			this.dataStructure.members
		);
	};

	moveParameterUpHandler = (e) => {
		if (
			e.dataPacket.targetPortlet !== this.namespace ||
			e.dataPacket.targetFormId !== this.formIds.previewCanvasId
		) {
			return;
		}

		const parameter = e.dataPacket.parameter;
		const group = this.dataStructure.findParameter({
			paramCode: parameter.parentCode,
			paramVersion: parameter.parentVersion,
			descendant: true
		});

		group.moveMemberUp(parameter.order - 1);

		this.forceUpdate();
	};

	moveParameterDownHandler = (e) => {
		if (
			e.dataPacket.targetPortlet !== this.namespace ||
			e.dataPacket.targetFormId !== this.formIds.previewCanvasId
		) {
			return;
		}

		const parameter = e.dataPacket.parameter;

		const group = this.dataStructure.findParameter({
			paramCode: parameter.parentCode,
			paramVersion: parameter.parentVersion,
			descendant: true
		});

		group.moveMemberDown(parameter.order - 1);

		this.forceUpdate();
	};

	refreshFormHandler = (e) => {
		if (
			e.dataPacket.targetPortlet !== this.namespace ||
			e.dataPacket.targetFormId !== this.formIds.previewCanvasId
		) {
			return;
		}

		this.forceUpdate();
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
		Event.on(Event.SX_MOVE_PARAMETER_UP, this.moveParameterUpHandler);
		Event.on(Event.SX_MOVE_PARAMETER_DOWN, this.moveParameterDownHandler);
		Event.on(Event.SX_REFRESH_FORM, this.refreshFormHandler);
	}

	componentWillUnmount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.fieldValueChangedHandler);
		Event.on(Event.SX_MOVE_PARAMETER_UP, this.moveParameterUpHandler);
		Event.on(Event.SX_MOVE_PARAMETER_DOWN, this.moveParameterDownHandler);
		Event.on(Event.SX_REFRESH_FORM, this.refreshFormHandler);
	}

	render() {
		return (
			<>
				<Toolbar
					style={{ paddingLeft: "10px", paddingRight: "10px", background: "#d8f2df", marginBottom: "15px" }}
				>
					<Toolbar.Nav>
						<Toolbar.Item expand>
							{this.typeStructureLink.jumpTo && (
								<Toolbar.Section>
									<ClayInput.Group>
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
										<ClayInput.GroupItem
											append
											expand="true"
										>
											<Autocomplete
												aria-labelledby={Util.translate("find-parameter")}
												id=""
												defaultItems={this.dataStructure
													.getJumpToItems()
													.map((item) => item.name)}
												messages={{
													notFound: "No results found"
												}}
												placeholder={Util.translate("enter-keyword")}
											>
												{(item) => <Autocomplete.Item key={item}>{item}</Autocomplete.Item>}
											</Autocomplete>
										</ClayInput.GroupItem>
									</ClayInput.Group>
								</Toolbar.Section>
							)}
						</Toolbar.Item>
						{this.typeStructureLink.inputStatus && (
							<Toolbar.Item>
								<Toolbar.Section>
									<ClayInput.Group>
										<ClayInput.GroupItem shrink>
											<ClayInput.GroupText>
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
										title={Util.translate("pdf")}
										aria-labelledby={Util.translate("pdf")}
										displayType="secondary"
										symbol="document-pdf"
										spritemap={this.spritemap}
									/>
									<ClayButtonWithIcon
										title={Util.translate("structured-data-editor")}
										aria-labelledby={Util.translate("structured-data-editor")}
										displayType="secondary"
										symbol="order-form-pencil"
										spritemap={this.spritemap}
									/>
								</Button.Group>
							</Toolbar.Section>
						</Toolbar.Item>
					</Toolbar.Nav>
				</Toolbar>
				<div style={{ maxHeight: "1000px", overflowY: "auto", overflowX: "hidden" }}>
					{this.dataStructure.renderPreview({
						dsbuilderId: this.formIds.dsbuilderId,
						propertyPanelId: this.formIds.propertyPanelId,
						previewCanvasId: this.formIds.previewCanvasId,
						spritemap: this.spritemap
					})}
				</div>
			</>
		);
	}
}

export default SXDataStructurePreviewer;
