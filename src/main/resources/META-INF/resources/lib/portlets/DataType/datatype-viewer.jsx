import React from "react";
import { Util } from "../../stationx/util";
import { Event, LoadingStatus, PortletKeys, PortletState, RequestIDs } from "../../stationx/station-x";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import SXBaseVisualizer from "../../stationx/visualizer";
import Panel from "@clayui/panel";
import { Body, Cell, Head, Row, Table, Text } from "@clayui/core";

class SXTypeInfo extends React.Component {
	constructor(props) {
		super(props);

		//console.log("[SXTypeInfo props] ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;

		this.dataTypeId = props.dataTypeId;
		this.dataTypeCode = props.dataTypeCode;
		this.dataTypeVersion = props.dataTypeVersion;
		this.displayName = props.displayName;
		this.description = props.description;
		this.verified = props.verified;
		this.freezed = props.freezed;
		this.spritemap = props.spritemap;
	}

	render() {
		return (
			<>
				<Text
					weight="bold"
					size="1.0rem"
				>
					{Util.translate("field-values")}
				</Text>
				<Table
					columnsVisibility={false}
					borderedColumns={false}
					size="sm"
					hover={false}
					striped={false}
				>
					<Head
						items={[
							{ columnName: "columnName", value: Util.translate("field-name"), width: "7rem" },
							{
								columnName: "columnValue",
								value: Util.translate("value"),
								className: "table-cell-expand"
							}
						]}
					>
						{(headItem) => (
							<Cell
								key={headItem.columnName}
								className={headItem.className}
								width={headItem.width}
								textAlign="center"
								style={{ fontWeight: "bold", fontSize: "1.0rem" }}
							>
								{headItem.value}
							</Cell>
						)}
					</Head>
					<Body
						defaultItems={[
							{ fieldName: Util.translate("id"), fieldValue: this.dataTypeId },
							{ fieldName: Util.translate("code"), fieldValue: this.dataTypeCode },
							{ fieldName: Util.translate("version"), fieldValue: this.dataTypeVersion },
							{ fieldName: Util.translate("description"), fieldValue: this.description }
						]}
					>
						{(row, index) => (
							<Row key={index}>
								<Cell>
									<Text size={3}>
										<span style={{ fontWeight: "bold" }}>{row.fieldName}</span>
									</Text>
								</Cell>
								<Cell>
									<Text size={3}>{row.fieldValue}</Text>
								</Cell>
							</Row>
						)}
					</Body>
				</Table>
			</>
		);
	}
}

class DataTypeViewer extends SXBaseVisualizer {
	dataCollectionId = 0;
	dataSetId = 0;
	dataTypeId = 0;
	dataTypeCode = "";
	dataTypeVersion = "1.0.0";
	displayName;
	description;
	dataStructureId = 0;
	dataStructureCode = "";
	dataStructureVersion = "1.0.0";
	verified = {};
	freezed = {};
	histories = [];
	comments = [];
	statistics = {};

	constructor(props) {
		super(props);

		//console.log("[DataTypeViewer props] ", props);

		this.dataCollectionId = this.params.dataCollectionId ?? 0;
		this.dataSetId = this.params.dataCollectionId ?? 0;
		this.dataTypeId = this.params.dataTypeId ?? 0;

		this.displayInfo = this.params.displayInfo ?? true;
		this.displayVerified = this.params.displayVerified ?? true;
		this.displayFreezed = this.params.displayFreezed ?? true;
		this.displayHistories = this.params.displayHistories ?? true;
		this.displayComments = this.params.displayComments ?? true;
		this.displayStatistics = this.params.displayStatistics ?? true;

		this.state = {
			infoDialog: false,
			loadingStatus: LoadingStatus.PENDING
		};

		this.dialogHeader = <></>;
		this.dialogBody = <></>;

		this.buttons = [
			{
				id: "edit",
				label: Util.translate("edit"),
				symbol: "pencil"
			}
		];
	}

	listenerWorkbenchReady = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[DataTypeViewer] listenerWorkbenchReady event rejected: ", event.dataPacket);
			return;
		}

		//console.log("[DataTypeViewer] listenerWorkbenchReady received: ", event.dataPacket);

		this.fireRequest({
			requestId: RequestIDs.viewDataType,
			params: {
				dataCollectionId: this.dataCollectionId,
				dataSetId: this.dataSetId,
				dataTypeId: this.dataTypeId
			}
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[DataTypeViewer] listenerResponce rejected: ", event.dataPacket);
			return;
		}

		//console.log("[DataTypeViewer] listenerResonse: ", requestId, params, data);
		switch (requestId) {
			case RequestIDs.viewDataType: {
				this.dataTypeId = data.dataTypeId;
				this.dataTypeCode = data.dataTypeCode;
				this.dataTypeVersion = data.dataTypeVersion;
				this.displayName = data.displayName;
				this.description = data.description;
				this.dataStructure = data.dataStructure;
				this.verified = data.verified;
				this.freezed = data.freezed;
				this.histories = data.histories;
				this.comments = data.comments;
				this.statistics = data.statistics;

				this.setState({
					loadingStatus: LoadingStatus.COMPLETE
				});

				break;
			}
		}
	};

	listenerComponentWillUnmount = (event) => {
		const { targetPortlet } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[DataTypeViewer] listenerComponentWillUnmount rejected: ", event.dataPacket);
			return;
		}

		//console.log("[DataTypeViewer] listenerComponentWillUnmount received: ", event.dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);

		this.fireHandshake();
	}

	componentWillUnmount() {
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
	}

	handleButtonClick = (button) => {
		switch (button.id) {
			case "edit": {
				const portletName =
					button.id === "edit" ? PortletKeys.DATATYPE_EDITOR : PortletKeys.DATASTRUCTURE_BUILDER;

				Event.fire(Event.SX_LOAD_PORTLET, this.namespace, this.workbenchNamespace, {
					portletName: portletName,
					portletState: PortletState.NORMAL,
					params: {
						dataCollectionId: this.dataCollectionId,
						dataSetId: this.dataSetId,
						dataTypeId: this.dataTypeId
					}
				});

				break;
			}
			case "delete": {
				this.fireRequest({
					targetFormId: this.workbenchNamespace,
					requestId: RequestIDs.deleteDataTypes,
					params: {
						dataTypeIds: [this.dataTypeId]
					}
				});
				break;
			}
		}
	};

	render() {
		//console.log("[DataTypeViewer render] ", JSON.stringify(this.dataStructure, null, 4));
		return (
			<>
				<Panel
					collapsable
					displayTitle={
						<div className="autofit-row autofit-padding">
							<div className={"autofit-col autofit-col-expand"}>
								<Text
									size={5}
									weight="semi-bold"
								>
									{Util.translate("basic-information")}
								</Text>
							</div>
							<div className="autofit-col">
								{this.buttons.length > 0 && (
									<Button.Group
										spaced
										style={{ height: "1.0rem", marginRight: "10px" }}
									>
										{this.buttons.map((button) => (
											<Icon
												key={button.id}
												symbol={button.symbol}
												onClick={(event) => {
													event.stopPropagation();
													this.handleButtonClick(button);
												}}
												style={{
													width: "1.0rem",
													height: "100%"
												}}
												spritemap={this.spritemap}
											/>
										))}
									</Button.Group>
								)}
							</div>
						</div>
					}
					displayType="secondary"
					showCollapseIcon={true}
					defaultExpanded={true}
					spritemap={this.spritemap}
				>
					<Panel.Body>
						<div
							className="autofit-padded-no-gutters-x autofit-row"
							style={{ alignItems: "start" }}
						>
							<div className="autofit-col autofit-col-shrink">
								<SXTypeInfo
									key={this.dataTypeCode}
									namespace={this.namespace}
									formId={this.componentId}
									dataTypeId={this.dataTypeId}
									dataTypeCode={this.dataTypeCode}
									dataTypeVersion={this.dataTypeVersion}
									displayName={this.displayName}
									description={this.description}
									verified={this.verified}
									freezed={this.freezed}
									spritemap={this.spritemap}
								/>
							</div>
							<div className="autofit-col autofit-col-expand">
								<Text
									weight="bold"
									size="1.0rem"
								>
									{Util.translate("datastructure-info")}
								</Text>
								<Table
									key={Util.randomKey()}
									columnsVisibility={false}
									borderedColumns={false}
									size="sm"
									hover={false}
								>
									<Head
										items={[
											{
												id: "field",
												name: Util.translate("field-name"),
												width: "auto"
											},
											{
												id: "value",
												name: Util.translate("value"),
												width: "auto"
											}
										]}
									>
										{(column) => (
											<Cell
												textAlign="center"
												width={column.width}
											>
												{column.name}
											</Cell>
										)}
									</Head>
									<Body
										key={this.dataStructure}
										defaultItems={this.dataStructure}
									>
										{(row) => (
											<Row>
												<Cell>
													<Text size={3}>
														<span style={{ fontWeight: "bold" }}>
															{Util.translate(row.fieldName)}
														</span>
													</Text>
												</Cell>
												<Cell>
													<Text size={3}>{row.fieldValue}</Text>
												</Cell>
											</Row>
										)}
									</Body>
								</Table>
							</div>
						</div>
					</Panel.Body>
				</Panel>
				<Panel
					collapsable
					displayTitle={<Text size={5}>{Util.translate("data-status")}</Text>}
					displayType="secondary"
					showCollapseIcon={true}
					defaultExpanded={true}
					spritemap={this.spritemap}
				>
					<Panel.Body>
						<div
							className="autofit-padded-no-gutters-x autofit-row"
							style={{ alignItems: "start" }}
						>
							<div className="autofit-col autofit-col-expand">
								<Text
									weight="bold"
									size="1.0rem"
								>
									{Util.translate("verified-status")}
								</Text>
							</div>
							<div className="autofit-col autofit-col-expand">
								<Text
									weight="bold"
									size="1.0rem"
								>
									{Util.translate("freezed-status")}
								</Text>
							</div>
						</div>
					</Panel.Body>
				</Panel>
				<Panel
					collapsable
					displayTitle={<Text size={5}>{Util.translate("comments-and-histories")}</Text>}
					displayType="secondary"
					showCollapseIcon={true}
					defaultExpanded={true}
					spritemap={this.spritemap}
				>
					<Panel.Body>
						<div
							className="autofit-padded-no-gutters-x autofit-row"
							style={{ alignItems: "start" }}
						>
							<div className="autofit-col autofit-col-expand">
								<Text
									weight="bold"
									size="1.0rem"
								>
									{Util.translate("comments")}
								</Text>
							</div>
							<div className="autofit-col autofit-col-expand">
								<Text
									weight="bold"
									size="1.0rem"
								>
									{Util.translate("histories")}
								</Text>
							</div>
						</div>
					</Panel.Body>
				</Panel>
			</>
		);
	}
}

export default DataTypeViewer;
