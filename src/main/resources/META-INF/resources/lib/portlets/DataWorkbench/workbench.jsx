import React, { createRef, useEffect, useRef } from "react";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import Panel from "@clayui/panel";
import { Rnd } from "react-rnd";
import { Util } from "../../stationx/util";
import { Constant, ResourceIds, WindowState } from "../../stationx/station-x";
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

	static BASE_WINDOW_ID = 10000;

	namespace = "";
	windows = [];
	workbenchId = "";
	workbenchNamespace;
	baseResourceURL = "";
	baseRenderURL = "";

	constructor({ namespace, workbenchId, baseRenderURL, baseResourceURL }) {
		this.namespace = namespace;
		this.workbenchId = workbenchId ?? "";
		this.workbenchNamespace = "_" + this.workbenchId + "_";
		this.baseResourceURL = baseResourceURL;
		this.baseRenderURL = baseRenderURL;
	}

	get increasedWindowId() {
		return this.windows.length;
	}

	get topWindow() {
		return this.windows[this.windows.length - 1];
	}

	get zIndex() {
		return Workbench.BASE_WINDOW_ID + this.windows.length - 1;
	}

	addWindow = (portletNamespace) => {
		this.windows.push(portletNamesapce);
	};

	loadPortletWindow = async ({ portletName, params }) => {
		let portletInstance = await this.createPortletInfo({
			resourceId: ResourceIds.CREATE_PORTLET_INSTANCE,
			portletName: portletName
		});

		params.workbenchNamespace = this.namespace;

		let renderURL = await this.createRenderURL({
			baseRenderURL: portletInstance.url,
			portletParams: {
				portletId: portletInstance.portletId,
				windowState: WindowState.EXCLUSIVE
			},
			dataParams: params
		});

		let portletContent = await this.ajax({ url: renderURL, type: "get", dataType: "html" });

		this.addWindow(portletInstance.portletInstance.namespace);

		return { portletNamespace: portletInstance.namespace, portletContent: portletContent };
	};

	createPortletInfo = async ({ resourceId, portletName }) => {
		let url = await this.createResourceURL({
			resourceId: resourceId
		});

		const dataParams = Util.toNamespacedParams(this.namespace, {
			portletName: portletName
		});

		let portletInfo = await this.ajax({
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

	fireHandshake = () => {};
}

export class SXPortletWindow extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.formId = props.formId;

		this.title = props.title;
		this.content = props.content;
		this.standAlone = props.standAlone ?? false;
		this.windowId = props.windowId ?? 0;
		this.width = props.width ?? 800;
		this.height = props.height ?? 600;
		this.spritemap = props.spritemap;
		this.zIndex = this.windowId;

		this.portletContentRef = createRef(null);
	}

	componentDidMount() {
		//$(this.portletContentRef.current).html(this.content ?? "<div></div>");
		Util.html(this.portletContentRef.current, this.content ?? "<div></div>");
	}

	render() {
		return (
			<Rnd
				default={{ x: 100, y: 100, width: this.width, height: this.height }}
				dragHandleClassName="clay-panel-header"
				style={{ zIndex: this.zIndex }}
			>
				<Panel
					displayType="secondary"
					style={{ width: "100%", height: "100%", backgroundColor: "#fff", borderRadius: "0.5rem" }}
				>
					<Panel.Header
						className="clay-panel-header"
						style={{ backgroundColor: "#9ed8f9ff", padding: "0px 5px", borderRadius: "0.5rem 0.5rem 0 0" }}
					>
						<div className="autofit-row autofit-padded">
							<div className="autofit-col autofit-col-expand">
								<span style={{ fontSize: "1.0rem", fontWeight: "800" }}>{this.title}</span>
							</div>
							<div className="autofit-col">
								<Button.Group>
									<ClayButtonWithIcon
										aria-label={Util.translate("minimize-window")}
										symbol="hr"
										size="sm"
										displayType="translucent"
										style={{
											borderRadius: "50%"
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
										spritemap={this.spritemap}
									/>
									<ClayButtonWithIcon
										aria-label={Util.translate("close-window")}
										symbol="times"
										size="sm"
										displayType="translucent"
										style={{
											borderRadius: "50%"
										}}
										spritemap={this.spritemap}
									/>
								</Button.Group>
							</div>
						</div>
					</Panel.Header>
					<Panel.Body>
						<div ref={this.portletContentRef}></div>
					</Panel.Body>
				</Panel>
			</Rnd>
		);
	}
}
