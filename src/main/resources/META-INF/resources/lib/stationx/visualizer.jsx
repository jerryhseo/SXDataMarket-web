import React from "react";
import { Event, LoadingStatus } from "./station-x";
import { Workbench } from "../portlets/DataWorkbench/workbench";

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
		this.formId = props.portletId;

		this.permissions = props.permissions;
		this.spritemap = props.spritemapPath;
		this.imagePath = props.imagePath;
		this.groupId = props.groupId;
		this.userId = props.userId;

		this.languageId = SXSystem.getLanguageId();
		this.defaultLanguageId = SXSystem.getDefaultLanguageId();
		this.availableLanguageIds = SXSystem.getAvailableLanguages();

		this.params = props.params ?? {};
	}

	fireHandshake() {
		Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	}

	fireLoadPortlet({ portletName, params = {}, portletState = Workbench.PortletState.NORMAL }) {
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

	fireRequest({ targetFormId = this.workbenchId, sourceFormId, requestId, params, refresh = true }) {
		Event.fire(Event.SX_REQUEST, this.namespace, this.workbenchNamespace, {
			targetFormId: targetFormId,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});

		if (refresh) {
			this.setState({ loadingStatus: LoadingStatus.PENDING });
		}
	}

	redirectTo({ portletName, params = {} }) {
		this.fireLoadPortlet({
			portletName: portletName,
			params: params
		});
	}

	render() {
		return <></>;
	}
}

export default SXBaseVisualizer;
