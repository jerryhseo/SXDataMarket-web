import React from "react";
import { Util } from "../../stationx/util";
import {
	EditStatus,
	ErrorClass,
	Event,
	LoadingStatus,
	ParamType,
	PortletKeys,
	ValidationRule
} from "../../stationx/station-x";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Workbench } from "../DataWorkbench/workbench";
import { SXLabeledText, SXTitleBar } from "../Form/form";
import ParameterConstants from "../Parameter/parameter-constants";
import { ParameterUtil } from "../Parameter/parameters";
import Panel from "@clayui/panel";
import { Body, Cell, Head, Row, Table, Text } from "@clayui/core";

class SXCollectionInfo extends React.Component {
	constructor(props) {
		super(props);

		console.log("[SXCollectionInfo props] ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;

		this.collectionId = props.collectionId;
		this.collectionCode = props.collectionCode;
		this.collectionVersion = props.collectionVersion;
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
							{ fieldName: Util.translate("id"), fieldValue: this.collectionId },
							{ fieldName: Util.translate("code"), fieldValue: this.collectionCode },
							{ fieldName: Util.translate("version"), fieldValue: this.collectionVersion },
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

class DataCollectionViewer extends SXBaseVisualizer {
	dataCollectionId = 0;
	dataCollectionCode = "";
	dataCollectionVersion = "1.0.0";
	displayName;
	description;
	dataSetList = [];
	verified = {};
	freezed = {};
	histories = [];
	comments = [];
	statistics = {};

	constructor(props) {
		super(props);

		//console.log("[DataCollectionViewer props] ", props);

		this.dataCollectionId = this.params.dataCollectionId ?? 0;

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
			},
			{
				id: "delete",
				label: Util.translate("delete"),
				symbol: "trash"
			}
		];
	}

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			//console.log("[DataCollectionViewer] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		//console.log("[DataCollectionViewer] listenerWorkbenchReady received: ", dataPacket);

		this.fireRequest({
			requestId: Workbench.RequestIDs.viewDataCollection,
			params: {
				dataCollectionId: this.dataCollectionId
			}
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace) {
			//console.log("[DataCollectionViewer] listenerResponce rejected: ", event.dataPacket);
			return;
		}

		console.log("[DataCollectionViewer] listenerResonse: ", requestId, params, data);
		switch (requestId) {
			case Workbench.RequestIDs.viewDataCollection: {
				this.dataCollectionId = data.dataCollectionId;
				this.dataCollectionCode = data.dataCollectionCode;
				this.dataCollectionVersion = data.dataCollectionVersion;
				this.displayName = data.displayName;
				this.description = data.description;
				this.dataSetList = data.dataSets;
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
			//console.log("[DataCollectionViewer] listenerComponentWillUnmount rejected: ", event.dataPacket);
			return;
		}

		//console.log("[DataCollectionViewer] listenerComponentWillUnmount received: ", event.dataPacket);
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
		let portletName;
		switch (button.id) {
			case "edit": {
				portletName = PortletKeys.DATACOLLECTION_EDITOR;

				this.fireLoadPortlet({
					portletName: portletName,
					params: { dataCollectionId: this.dataCollectionId }
				});

				break;
			}
			case "delete": {
				break;
			}
		}
	};

	render() {
		//console.log("[DataCollectionViewer render] ", JSON.stringify(this.dataSetList, null, 4));
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
												title={button.label}
												onClick={(event) => {
													event.stopPropagation();
													this.handleButtonClick(button);
												}}
												style={{
													width: "1.0rem",
													height: "100%"
												}}
												role="button"
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
					style={{ backgroundColor: "rgb(241 251 251)" }}
					spritemap={this.spritemap}
				>
					<Panel.Body style={{ backgroundColor: "#fff" }}>
						<div
							className="autofit-padded-no-gutters-x autofit-row"
							style={{ alignItems: "start" }}
						>
							<div className="autofit-col autofit-col-shrink">
								<SXCollectionInfo
									key={this.dataCollectionCode}
									namespace={this.namespace}
									formId={this.componentId}
									collectionId={this.dataCollectionId}
									collectionCode={this.dataCollectionCode}
									collectionVersion={this.dataCollectionVersion}
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
									{Util.translate("datasets")}
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
												id: "name",
												name: Util.translate("display-name"),
												width: "auto"
											},
											{
												id: "code",
												name: Util.translate("code"),
												width: "auto"
											},
											{
												id: "version",
												name: Util.translate("version"),
												width: "5rem"
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
										key={this.dataSetList}
										defaultItems={this.dataSetList}
									>
										{(row) => (
											<Row>
												<Cell textAlign="center">{row.displayName}</Cell>
												<Cell textAlign="center">{row.dataSetCode}</Cell>
												<Cell textAlign="center">{row.dataSetVersion}</Cell>
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
					style={{ backgroundColor: "rgb(241 251 251)" }}
					spritemap={this.spritemap}
				>
					<Panel.Body style={{ backgroundColor: "#fff" }}>
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
					style={{ backgroundColor: "rgb(241 251 251)" }}
					spritemap={this.spritemap}
				>
					<Panel.Body style={{ backgroundColor: "#fff" }}>
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

export default DataCollectionViewer;
