import React, { createRef, useEffect, useRef } from "react";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import Panel from "@clayui/panel";
import { Rnd } from "react-rnd";
import { Util } from "../../stationx/util";
import { Constant, Event, ResourceIds, WindowState } from "../../stationx/station-x";
import parse from "html-react-parser";

export class Workbench {
	static loadWorkingPortlet({ portletSectionId, windowState, workingPortlet, workbench }) {
		console.log("Workbench.loadWorkingPortlet: ", workingPortlet);

		AUI().use("aui-base, portlet-url", function (A) {
			let portletURL = Liferay.PortletURL.createURL(workingPortlet.url);

			portletURL.setWindowState(windowState ?? WindowState.EXCLUSIVE);

			portletURL.setParameter("workbenchId", workbench.portletId);

			for (const paramKey in workingPortlet.params) {
				portletURL.setParameter(paramKey, workingPortlet.params[paramKey]);
			}

			console.log("Load working portlet: ", portletURL.toString());

			$.ajax({
				url: portletURL.toString(),
				type: "get",
				dataType: "html",
				success: (html) => {
					$("#" + portletSectionId).html(html);
				},
				error: (a) => {
					console.log(a);
				}
			});
		});
	}

	static BASE_WINDOW_ZINDEX = 10000;

	static WindowState = {
		MINIMIZE: 0,
		NORMAL: 1,
		MAXIMIZE: 2
	};

	namespace = "";
	windows = {};
	workbenchId = "";
	baseResourceURL = "";
	baseRenderURL = "";

	constructor({ namespace, workbenchId, baseRenderURL, baseResourceURL, spritemap }) {
		this.namespace = namespace;
		this.workbenchId = workbenchId ?? "";
		this.baseResourceURL = baseResourceURL;
		this.baseRenderURL = baseRenderURL;
		this.spritemap = spritemap;
	}

	get windowCount() {
		return Object.keys(this.windows).length;
	}

	get topWindow() {
		return this.windows[this.windows.length - 1];
	}

	get zIndex() {
		return Workbench.BASE_WINDOW_ZINDEX + this.windowCount - 1;
	}

	get increasedWindowId() {
		let increased = 0;
		Object.values(this.windows).forEach((value) => {
			increased = value.windowId >= increased ? value.windowId : increased;
		});

		return increased + 1;
	}

	get windowContentArray() {
		return Object.values(this.windows).map((value) => value.windowContent);
	}

	addWindow = (portletId, windowContent, windowState) => {
		this.windows[portletId] = {
			windowId: this.increasedWindowId,
			windowContent: windowContent,
			windowState: windowState
		};

		return this.windows.length;
	};

	setWindowState(portletId, windowState) {
		this.windows[portletId].windowState = windowState;
	}

	getWindowState(portletId) {
		return this.windows[portletId].windowState;
	}

	getWindowId(portletId) {
		return this.windows[portletId].windowId;
	}

	removeWindow(portletId) {
		delete this.windows[portletId];
	}

	openPortletWindow = async ({ portletName, title, params }) => {
		let portletInstance = await this.createPortletInfo({
			resourceId: ResourceIds.CREATE_PORTLET_INSTANCE,
			portletName: portletName
		});

		params.workbenchNamespace = this.namespace;
		params.workbenchId = this.workbenchId;

		let renderURL = await this.createRenderURL({
			baseRenderURL: portletInstance.url,
			portletParams: {
				portletId: portletInstance.portletId,
				windowState: WindowState.EXCLUSIVE
			},
			dataParams: params
		});

		let portletContent = await this.ajax({ url: renderURL, type: "get", dataType: "html" });

		return this.addWindow(
			portletInstance.portletId,
			<SXPortletWindow
				key={portletInstance.portletId}
				portletNamespace={portletInstance.namespace}
				portletId={portletInstance.portletId}
				workbenchNamespace={this.namespace}
				workbenchId={this.workbenchId}
				title={title}
				content={portletContent}
				windowId={this.increasedWindowId}
				spritemap={this.spritemap}
			/>,
			Workbench.WindowState.NORMAL
		);

		/*
		return (
			<SXPortletWindow
				portletNamespace={portletInstance.namespace}
				portletId={portletInstance.portletId}
				workbenchNamespace={this.namespace}
				workbenchId={this.workbenchId}
				title={title}
				content={portletContent}
				windowId={this.increasedWindowId}
				spritemap={this.spritemap}
			/>
		);
		*/
	};

	createPortletInfo = async ({ resourceId, portletName }) => {
		let url = await this.createResourceURL({
			resourceId: resourceId
		});

		const dataParams = Util.toNamespacedParams(this.namespace, {
			portletName: portletName
		});

		const portletInfo = await this.ajax({
			url: url,
			params: dataParams
		});

		return portletInfo;
	};

	createResourceURL = async ({ resourceId }) => {
		let url = "";

		await AUI().use("aui-base, portlet-url", (A) => {
			let resourceURL = Liferay.PortletURL.createURL(this.baseResourceURL);
			resourceURL.setResourceId(resourceId);
			resourceURL.setPortletId(this.workbenchId);

			url = resourceURL.toString();
		});

		return url;
	};

	createRenderURL = async ({ baseRenderURL, portletParams, dataParams }) => {
		let url;
		await AUI().use("aui-base, portlet-url", function (A) {
			let renderURL = Liferay.PortletURL.createURL(baseRenderURL);
			for (const portletParam in portletParams) {
				switch (portletParam) {
					case "portletId":
						renderURL.setPortletId(portletParams[portletParam]);
						break;
					case "windowState":
						renderURL.setWindowState(portletParams[portletParam]);
						break;
					case "lifecycle":
						renderURL.setLifecycle(portletParams[portletParam]);
						break;
					case "doAsGroupId":
						renderURL.setDoAsGroupId(portletParams[portletParam]);
						break;
					case "doAsUserId":
						renderURL.setDoAsUserId(portletParams[portletParam]);
						break;
					case "escapeXML":
						renderURL.setEscapeXML(portletParams[portletParam]);
						break;
					case "plid":
						renderURL.setPlid(portletParams[portletParam]);
						break;
					case "portletMode":
						renderURL.setPortletMode(portletParams[portletParam]);
						break;
				}
			}

			//const namespacedParams = Util.toNamespacedParams(namespace, dataParams);
			renderURL.setParameters(dataParams);

			url = renderURL.toString();
		});

		return url;
	};

	fetchData = async (resourceId, params) => {
		const resourceURL = this.createResourceURL({ resourceId: resourceId });
		console.log("fetchData: ", resourceURL);
	};

	ajax = async ({ url, params = {}, type = "post", dataType = "json" }) => {
		let result;

		await $.ajax({
			url: url,
			type: type,
			dataType: dataType,
			data: params,
			success: (successData) => {
				result = successData;
			},
			error: (err) => {
				console.log("[ERROR] Workbecn.ajax: ", err);
			}
		});

		return result;
	};
}

export class SXPortletWindow extends React.Component {
	constructor(props) {
		super(props);

		this.portletNamespace = props.portletNamespace;
		this.portletId = props.portletId;
		this.workbenchNamespace = props.workbenchNamespace;
		this.workbenchId = props.workbenchId;

		this.title = props.title;
		this.content = props.content;
		this.standAlone = props.standAlone ?? false;
		this.windowId = props.windowId ?? 0;
		this.spritemap = props.spritemap;
		this.zIndex = Workbench.BASE_WINDOW_ZINDEX + this.windowId;

		this.portletContentRef = createRef(null);

		this.portletBody = this.namespace + this.windowId;

		this.state = {
			width: props.width ?? 800,
			height: props.height ?? 800
		};
	}

	componentDidMount() {
		//$(this.portletContentRef.current).html(this.content ?? "<div></div>");
		Util.html(this.portletContentRef.current, this.content ?? "<div></div>");
		//$("#" + this.portletBody).html(this.content);
		//Util.html(this.portletBody, this.content);
	}

	handleClick = (e) => {
		e.stopPropagation();

		Event.fire(Event.SX_WINDOW_SELECTED, this.portletNamespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId,
			windowId: this.portletId
		});
	};

	render() {
		return (
			<Rnd
				default={{ x: 100, y: 100, width: this.state.width, height: this.state.height }}
				dragHandleClassName="clay-panel-header"
				style={{
					zIndex: this.zIndex
				}}
				onResizeStop={(e, direction, ref, delta, newPosition) => {
					this.setState({
						width: ref.offsetWidth,
						height: ref.offsetHeight
					});
				}}
				onClick={this.handleClick}
			>
				<Panel
					displayType="secondary"
					style={{
						width: "100%",
						height: "100%",
						backgroundColor: "#fff",
						borderWidth: "3px 3px 3px 3px",
						borderRadius: "0.5rem",
						boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.2)",
						overflow: "hidden"
					}}
				>
					<Panel.Header
						className="clay-panel-header"
						style={{
							backgroundColor: "#9ed8f9ff",
							padding: "0px 5px",
							borderRadius: "0.5rem 0.5rem 0 0"
						}}
					>
						<div className="autofit-row autofit-padded">
							<div className="autofit-col autofit-col-expand">
								<span style={{ fontSize: "1.0rem", fontWeight: "800" }}>{this.title}</span>
							</div>
							<div className="autofit-col">
								<Button.Group>
									{/*
									<ClayButtonWithIcon
										aria-label={Util.translate("minimize-window")}
										symbol="hr"
										size="sm"
										displayType="translucent"
										style={{
											borderRadius: "50%"
										}}
										onClick={(e) => {
											e.stopPropagation();

											Event.fire(Event.SX_MINIMIZE_WINDOW, this.namespace, this.namespace, {
												targetFormId: this.workbenchId,
												windowId: this.windowId
											});
										}}
										spritemap={this.spritemap}
									/>
									<ClayButtonWithIcon
										aria-label={Util.translate("full-screen")}
										symbol="rectangle"
										size="sm"
										displayType="translucent"
										style={{
											borderRadius: "50%"
										}}
										onClick={(e) => {
											e.stopPropagation();

											Event.fire(Event.SX_MAXIMIZE_WINDOW, this.namespace, this.namespace, {
												targetFormId: this.workbenchId,
												windowId: this.windowId
											});
										}}
										spritemap={this.spritemap}
									/>
									*/}
									<ClayButtonWithIcon
										aria-label={Util.translate("close-window")}
										symbol="times"
										size="sm"
										displayType="translucent"
										style={{
											borderRadius: "50%"
										}}
										onClick={(e) => {
											e.stopPropagation();

											Event.fire(
												Event.SX_REMOVE_WINDOW,
												this.portletNamespace,
												this.workbenchNamespace,
												{
													targetFormId: this.workbenchId,
													portletId: this.portletId
												}
											);
										}}
										spritemap={this.spritemap}
									/>
								</Button.Group>
							</div>
						</div>
					</Panel.Header>
					<Panel.Body>
						<div
							ref={this.portletContentRef}
							style={{
								display: "block",
								height: this.state.height - 40 + "px",
								overflowX: "hidden",
								overflowY: "auto",
								paddingBottom: "2rem"
							}}
						></div>
						<div style={{ paddingTop: "2rem" }}></div>
					</Panel.Body>
				</Panel>
			</Rnd>
		);
	}
}
