import React from "react";
import { Event, ExecutionMode, LoadingStatus, PortletState } from "./station-x";

export class Visualizer {
	constructor({ namespace, visualizerId, workbenchNamespace, workbenchId, basicFuncs }) {
		this.namespace = namespace;
		this.visualizerId = visualizerId;
		this.workbenchNamespace = workbenchNamespace;
		this.workbenchId = workbenchId;

		this.basicFuncs = basicFuncs;
	}

	fireHandshake() {
		Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	}

	fireRequestData() {}
}

class SXBaseVisualizer extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.baseRenderURL = props.baseRenderURL;
		this.baseResourceURL = props.baseResourceURL;
		this.workbenchNamespace = props.workbenchNamespace;
		this.workbenchId = props.workbenchPortletId;
		this.portletId = props.portletId;
		this.formId = props.namespace;
		this.execMode = props.execMode ?? ExecutionMode.WORKBENCH_BASED;

		this.permissions = props.permissions;
		this.spritemap = props.spritemapPath;
		this.imagePath = props.imagePath;
		this.groupId = props.groupId;

		const user = SXSystem.getUser();
		this.userId = user.userId;
		this.userName = user.userName;

		this.languageId = SXSystem.getLanguageId();
		this.defaultLanguageId = SXSystem.getDefaultLanguageId();
		this.availableLanguageIds = SXSystem.getAvailableLanguages();

		this.params = props.params ?? {};

		this.titleBar = this.params.titleBar;
		this.buttons = this.params.buttons;
	}

	fireHandshake() {
		Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	}

	fireLoadPortlet({ portletName, params = {}, portletState = PortletState.NORMAL }) {
		Event.fire(Event.SX_LOAD_PORTLET, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId,
			portletName: portletName,
			params: params,
			portletState: portletState
		});

		this.componentWillUnmount();
	}

	fireOpenPortletWindow({ portletName, params = {}, windowTitle }) {
		Event.fire(Event.SX_OPEN_PORTLET_WINDOW, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId,
			portletName: portletName,
			windowTitle: windowTitle,
			params: params
		});
	}

	fireRequest({ targetFormId = this.workbenchId, sourceFormId, requestId, params }) {
		Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
			targetFormId: targetFormId,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});

		this.setState({ loadingStatus: LoadingStatus.PENDING });
	}

	redirectTo({ portletName, params = {} }) {
		this.fireLoadPortlet({
			portletName: portletName,
			params: params
		});
	}

	openDataOnWindow(data) {
		//console.log("Open BLOB data");
		const url = window.URL.createObjectURL(data);

		const link = document.createElement("a");
		link.href = url;
		link.target = "_blank";
		link.click();
	}

	render() {
		return <></>;
	}
}

export default SXBaseVisualizer;
