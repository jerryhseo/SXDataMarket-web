import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { Event, ParamType } from "../../stationx/station-x";
import Panel from "@clayui/panel";
import ParameterConstants from "../Parameter/parameter-constants";

class SXGroup extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.preview = props.preview ?? false;

		this.state = {
			expanded: this.parameter.expanded
		};
	}

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(
			event,
			this.namespace,
			this.componentId,
			this.parameter.paramCode,
			this.parameter.paramVersion
		);

		if (Util.isEmpty(dataPacket)) {
			return;
		}

		this.parameter.fireValueChanged();
	};

	listenerParameterSelected = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXGroup]  SX_PARAMETER_SELECTED rejected: ", event.dataPacket);
			return;
		}

		//console.log("[SXGroup] SX_PARAMETER_SELECTED: ", parameter);
		this.parameter.fire(Event.SX_PARAMETER_SELECTED, { parameter: parameter });
	};

	listenerFieldValueChanged = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) return;

		//console.log("[SXGroup] SX_FIELD_VALUE_CHANGED RECEIVED: ", parameter);
		const groupValue = this.parameter.value;
		groupValue[parameter.paramCode] = parameter.value;
		this.parameter.value = groupValue;

		this.parameter.fireValueChanged();
	};

	listenerMoveParameterUp = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}
		//console.log("[SXGroup] listenerMoveParameterUp: ", parameter);

		this.parameter.moveMemberUp(parameter.order - 1);

		this.forceUpdate();
	};

	listenerMoveParameterDown = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}
		//console.log("[SXGroup] listenerMoveParameterDown: ", parameter);

		this.parameter.moveMemberDown(parameter.order - 1);

		this.forceUpdate();
	};

	listenerCopyParameter = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		//console.log("[SXGroup] listenerCopyParameter: ", parameter);
		const copied = this.parameter.copyMember({
			paramCode: parameter.paramCode,
			paramVersion: parameter.paramVersion
		});

		//console.log("[SXGroup] listenerCopyParameter: ", copied);
		copied.fireParameterSelected();
	};

	listenerDeleteParameter = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		//console.log("[SXGroup] SX_DELETE_PARAMETER received: ", parameter);

		this.parameter.fire(Event.SX_DELETE_PARAMETER, {
			parameter: parameter
		});
	};

	listenerSelectGroup = (event) => {
		const { targetPortlet, targetFormId, parameter } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXGroup] listenerSelectGroup rejected:", parameter);
			return;
		}

		//console.log("[SXGroup] listenerSelectGroup:", parameter);

		this.parameter.fire(Event.SX_SELECT_GROUP, {
			parameter: parameter
		});
	};

	componentDidMount() {
		super.componentDidMount();

		Event.on(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.on(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_MOVE_PARAMETER_DOWN, this.listenerMoveParameterDown);
		Event.on(Event.SX_MOVE_PARAMETER_UP, this.listenerMoveParameterUp);
		Event.on(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.on(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
	}

	componentWillUnmount() {
		super.componentWillUnmount();

		Event.off(Event.SX_COPY_PARAMETER, this.listenerCopyParameter);
		Event.off(Event.SX_DELETE_PARAMETER, this.listenerDeleteParameter);
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_MOVE_PARAMETER_DOWN, this.listenerMoveParameterDown);
		Event.off(Event.SX_MOVE_PARAMETER_UP, this.listenerMoveParameterUp);
		Event.off(Event.SX_PARAMETER_SELECTED, this.listenerParameterSelected);
		Event.off(Event.SX_SELECT_GROUP, this.listenerSelectGroup);
	}

	renderMember(member, order) {
		member.inputStatus = this.parameter.inputStatus;
		member.position = this.parameter.getMemberPosition(member);

		return this.preview
			? member.renderPreview({
					formId: this.componentId,
					actionItems: this.parameter.getPreviewActionItems(order),
					spritemap: this.spritemap
			  })
			: member.renderField({
					spritemap: this.spritemap
			  });
	}

	renderArrangement() {
		const rows = Util.convertArrayToRows(this.parameter.members, this.parameter.membersPerRow);

		return (
			<div
				className={this.className}
				style={this.style}
				ref={this.focusRef}
			>
				{this.parameter.membersPerRow == 0 && (
					<div
						className=""
						style={{ display: "flex", overflowX: "auto" }}
					>
						{rows.map((member, order) => (
							<div
								key={order}
								style={{
									display: "inline-block",
									flex: "0 0 auto",
									marginRight: "20px",
									padding: "5px"
								}}
							>
								{this.renderMember(member, order)}
							</div>
						))}
					</div>
				)}
				{this.parameter.membersPerRow == 1 && rows.map((member, order) => this.renderMember(member, order))}
				{this.parameter.membersPerRow > 1 &&
					rows.map((row, rowIndex) => (
						<div
							key={rowIndex}
							className="autofit-row autofit-padded"
							style={{ marginBottom: "5px" }}
						>
							{row.map((member, order) => (
								<div
									key={member.key}
									className={
										Util.isEmpty(member.style.width)
											? "autofit-col autofit-col-expand"
											: "autofit-col autofit-col-shrink"
									}
									style={{ marginBottom: "0" }}
								>
									{this.renderMember(member, order)}
								</div>
							))}
						</div>
					))}
			</div>
		);
	}

	renderPanel() {
		return (
			<Panel
				key={Util.randomKey()}
				collapsable
				displayTitle={
					<Panel.Title key={Util.randomKey()}>
						{this.parameter.renderTitle({
							spritemap: this.spritemap,
							style: { fontSize: "1.0rem", fontWeight: "800" }
						})}
						{this.parameter.showDefinition && this.state.expanded && (
							<div
								className="autofit-row"
								style={{ paddingLeft: "10px" }}
							>
								<pre className="autofit-col">{this.parameter.getDefinition()}</pre>
							</div>
						)}
					</Panel.Title>
				}
				displayType="secondary"
				showCollapseIcon={true}
				defaultExpanded={this.state.expanded}
				onExpandedChange={(expanded) => {
					this.parameter.expanded = expanded;
					this.setState({ expanded: expanded });
				}}
				size="sm"
				spritemap={this.spritemap}
				style={{
					...this.style,
					...this.parameter.style,
					backgroundColor: "rgba(123, 233, 78, 0.1)",
					marginBottom: "0"
				}}
			>
				<Panel.Body style={{ backgroundColor: "#ffffff" }}>{this.renderArrangement()}</Panel.Body>
			</Panel>
		);
	}

	renderTable() {
		return (
			<div
				style={{
					...this.style,
					...this.parameter.style
				}}
			>
				{this.parameter.renderTitle({ spritemap: this.spritemap })}
				{this.parameter.showDefinition && (
					<div
						className="autofit-row"
						style={{ paddingLeft: "10px" }}
					>
						<pre className="autofit-col">{this.parameter.getDefinition()}</pre>
					</div>
				)}
				<table style={{ tableLayout: "auto", width: "100%" }}>
					<tbody>
						{this.parameter.members.map((member) => {
							if (member.paramType === ParamType.STRING) {
								return member.render({
									displayType: ParameterConstants.DisplayTypes.TABLE_ROW,
									spritemap: this.spritemap
								});
							}
						})}
					</tbody>
				</table>
			</div>
		);
	}

	render() {
		switch (this.parameter.viewType) {
			case ParameterConstants.GroupViewTypes.ARRANGEMENT: {
				return this.renderArrangement();
			}
			case ParameterConstants.GroupViewTypes.FIELDSET: {
				return (
					<div className="sx-fieldset form-group">
						<div className="sx-legend">{this.parameter.label}</div>
						{this.renderArrangement()}
					</div>
				);
			}
			case ParameterConstants.GroupViewTypes.PANEL: {
				return this.renderPanel();
			}
			case ParameterConstants.GroupViewTypes.TABLE: {
				return this.renderTable();
			}
			default: {
				return this.renderPanel();
			}
		}
	}
}

export default SXGroup;
