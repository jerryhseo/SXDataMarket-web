import React from "react";
import { Util } from "../../stationx/util";
import Form, { ClayInput, ClayRadio, ClaySelectWithOption } from "@clayui/form";
import ClayMultiStepNav from "@clayui/multi-step-nav";
import SXDSBuilderBasicPropertiesPanel from "./basic-properties-panel";
import SXDSBuilderTypeSpecificPanel from "./TypeSpecificProperties/type-specific-panel";
import SXDSBuilderOptionPropertiesPanel from "./option-properties-panel";
import SXDSBuilderValidationPanel from "./validation-builder-panel";
import { Event, ParamProperty, ParamType } from "../../stationx/station-x";
import { SXLabel } from "../Form/form";
import Button from "@clayui/button";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import ParameterConstants from "../Parameter/parameter-constants";
import SXBasePropertiesPanelComponent from "./base-properties-panel-component";

class SXDSBuilderPropertiesPanel extends SXBasePropertiesPanelComponent {
	panelSteps = [
		{
			title: Util.translate("basic")
		},
		{
			title: Util.translate("type-specific")
		},
		{
			title: Util.translate("options")
		},
		{
			title: Util.translate("validation")
		}
	];

	constructor(props) {
		super(props);

		this.state = {
			panelStep: 0,
			paramType: props.workingParam.paramType,
			openSelectGroupModal: false,
			confirmDlgState: false,
			confirmDlgBody: <></>,
			confirmDlgHeader: <></>
		};

		this.componentId = this.namespacee + "SXDSBuilderPropertiesPanel";
	}

	listenerRefreshPropertyPanel = (event) => {
		const { dataPacket } = event;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) {
			console.log("[SXDSBuilderPropertiesPanel] listenerRefreshPropertyPanel rejected: ", dataPacket);
			return;
		}
		console.log("[SXDSBuilderPropertiesPanel] listenerRefreshPropertyPanel: ", dataPacket);

		this.workingParam = dataPacket.workingParam;
		this.setState({ paramType: dataPacket.workingParam.paramType });
	};

	componentDidMount() {
		//console.log("componentDidMount: SXDSBuilderPropertiesPanel");

		Event.on(Event.SX_REFRESH_PROPERTY_PANEL, this.listenerRefreshPropertyPanel);
	}

	componentWillUnmount() {
		Event.off(Event.SX_REFRESH_PROPERTY_PANEL, this.listenerRefreshPropertyPanel);
	}

	handlePanelStepChange(step) {
		if (this.dataStructure.hasError()) {
			this.setState({
				confirmDlgState: true,
				confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
				confirmDlgBody: Util.translate("fix-the-error-first", this.dataStructure.errorMessage)
			});

			return;
		}

		this.setState({ panelStep: step });
	}

	handleParamTypeSelect(value) {
		this.setState({ paramType: value });

		Event.fire(Event.SX_PARAM_TYPE_CHANGED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramType: value
		});
	}

	handleSelectGroup() {
		this.setState({ openSelectGroupModal: true });
	}

	renderPanelContent = () => {
		//console.log("renderPanelContent: ", this.workingParam);

		switch (this.state.panelStep) {
			case 0: {
				return (
					<SXDSBuilderBasicPropertiesPanel
						key={this.workingParam.key}
						namespace={this.namespace}
						formId={this.componentId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case 1: {
				return (
					<SXDSBuilderTypeSpecificPanel
						key={this.workingParam.key}
						namespace={this.namespace}
						formId={this.componentId}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case 2: {
				return (
					<SXDSBuilderOptionPropertiesPanel
						key={this.workingParam.key}
						namespace={this.namespace}
						formIds={this.formIds}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
			case 3: {
				return (
					<SXDSBuilderValidationPanel
						key={this.workingParam.key}
						namespace={this.namespace}
						formIds={this.formIds}
						dataStructure={this.dataStructure}
						workingParam={this.workingParam}
						spritemap={this.spritemap}
					/>
				);
			}
		}
	};

	render() {
		//console.log("SXDSBuilderPropertiesPanel rendered: ", this.workingParam);

		const parentGroup = Util.isNotEmpty(this.workingParam.parent)
			? this.dataStructure.findParameter({
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
			  })
			: this.dataStructure;
		console.log("Group selector parentGroup: ", parentGroup, this.options);

		return (
			<>
				<Form.Group className="form-group-sm">
					<SXLabel
						label={Util.translate("parameter-type")}
						forHtml={this.namespace + ParamProperty.PARAM_TYPE}
						required={true}
						tooltip={Util.translate("parameter-type-tooltip")}
						spritemap={this.spritemap}
					/>
					<div style={{ paddingLeft: "10px" }}>
						<ClaySelectWithOption
							aria-label={Util.translate("parameter-type")}
							id={this.namespace + ParamProperty.PARAM_TYPE}
							options={Object.keys(ParamType).map((key) => ({
								label: ParamType[key],
								value: ParamType[key]
							}))}
							value={this.state.paramType}
							onChange={(e) => {
								this.handleParamTypeSelect(e.target.value);
							}}
							disabled={this.workingParam.order > 0}
							style={{ paddingLeft: "10px" }}
							spritemap={this.spritemap}
						/>
					</div>
				</Form.Group>
				{parentGroup && this.workingParam.displayType !== ParameterConstants.DisplayTypes.GRID_CELL && (
					<Form.Group style={{ marginBottom: "1.5rem" }}>
						<SXLabel
							label={Util.translate("group")}
							forHtml={this.namespace + ParamProperty.GROUP}
							required={true}
							tooltip={Util.translate("group-tooltip")}
							spritemap={this.spritemap}
						/>
						<ClayInput.Group style={{ paddingLeft: "10px" }}>
							<ClayInput.GroupItem
								prepend
								style={{ padding: "5px", backgroundColor: "#effccf", justifyContent: "center" }}
							>
								{parentGroup.label}
							</ClayInput.GroupItem>
							<ClayInput.GroupItem
								append
								shrink
							>
								<Button
									displayType="secondary"
									onClick={() => this.handleSelectGroup()}
									size="sm"
								>
									{Util.translate("select-group")}
								</Button>
							</ClayInput.GroupItem>
						</ClayInput.Group>
					</Form.Group>
				)}
				{this.state.openSelectGroupModal && (
					<SXModalDialog
						header={Util.translate("select-group")}
						body={
							<GroupSelectorBody
								key={this.workingParam}
								namespace={this.namespace}
								formIds={this.formIds}
								dataStructure={this.dataStructure}
								workingParam={this.workingParam}
								optionType="radio"
								spritemap={this.spritemap}
							/>
						}
						buttons={[
							{
								onClick: () => {
									this.setState({ openSelectGroupModal: false });

									Event.fire(Event.SX_REFRESH_FORM, this.namespace, this.namespace, {
										targetFormId: this.formIds.previewCanvasId
									});
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="info"
						disableAutoClose="false"
						spritemap={this.spritemap}
					/>
				)}
				<ClayMultiStepNav
					className="sx-multistep"
					style={{ padding: "10px" }}
					center="true"
				>
					{this.panelSteps.map(({ subTitle, title }, i) => {
						let panelStep = this.state.panelStep < 0 ? 0 : this.state.panelStep;
						const complete = i < this.state.panelStep;

						return (
							<ClayMultiStepNav.Item
								active={panelStep == i}
								expand={i + 1 !== this.panelSteps.length}
								key={i}
								state={complete ? "complete" : undefined}
								style={{ padding: "0", marginBottom: "0" }}
							>
								<ClayMultiStepNav.Title>{title}</ClayMultiStepNav.Title>
								<ClayMultiStepNav.Divider />
								<ClayMultiStepNav.Indicator
									complete={complete}
									label={i + 1}
									onClick={() => this.handlePanelStepChange(i)}
									subTitle={subTitle}
								/>
							</ClayMultiStepNav.Item>
						);
					})}
				</ClayMultiStepNav>
				<div style={{ maxHeight: "700px", overflowY: "auto", overflowX: "hidden" }}>
					{this.renderPanelContent()}
				</div>
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

export default SXDSBuilderPropertiesPanel;
