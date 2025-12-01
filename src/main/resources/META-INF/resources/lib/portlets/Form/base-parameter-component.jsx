import React, { createRef } from "react";
import { Event } from "../../stationx/station-x";
import ParameterConstants from "../Parameter/parameter-constants";

class SXBaseParameterComponent extends React.PureComponent {
	className = "";
	style = {};
	spritemap = "";
	parameter = null;
	displayType = ParameterConstants.DisplayTypes.FORM_FIELD;
	viewType = "";
	cellIndex = null;
	focusRef = null;
	inputRef = null;

	disabledControlStyle = {};

	constructor(props) {
		super(props);

		this.parameter = props.parameter;
		this.events = props.events ?? {};
		this.className = props.className ?? "";
		this.style = props.style ?? {};
		this.spritemap = props.spritemap ?? "";
		this.viewType = props.viewType ?? props.parameter.viewType;
		this.displayType = props.displayType ?? props.parameter.displayType;
		this.cellIndex = props.cellIndex;

		this.namespace = this.parameter.namespace;
		this.formId = this.parameter.formId;
		this.componentId = this.parameter.componentId;
		this.componentName = this.parameter.tagName;
		this.languageId = this.parameter.languageId;
		this.defaultLanguageId = this.parameter.defaultLanguageId;
		this.availableLanguageIds = this.parameter.availableLanguageIds;

		this.focusRef = createRef();
		this.inputRef = createRef();

		this.disabledControlStyle = this.parameter.disabled
			? { backgroundColor: "#fff", borderColor: "#e1ebf6", color: "#7b7c85" }
			: {};

		this.state = {
			openComments: false,
			openActionHistories: false
		};
	}

	listenerRefresh = (event) => {
		const { targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0", cellIndex } = event.dataPacket;

		if (
			!(
				this.namespace === targetPortlet &&
				this.formId === targetFormId &&
				paramCode === this.parameter.paramCode &&
				paramVersion === this.parameter.paramVersion
			)
		) {
			return;
		}

		if (this.parameter.isGridCell()) {
			if (cellIndex !== this.cellIndex) {
				return;
			}
		}
		this.forceUpdate();
	};

	listenerFocus = (event) => {
		const { targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0", cellIndex } = event.dataPacket;

		if (
			!(
				this.namespace === targetPortlet &&
				this.formId === targetFormId &&
				paramCode === this.parameter.paramCode &&
				paramVersion === this.parameter.paramVersion
			)
		) {
			return;
		}

		if (this.parameter.isGridCell()) {
			if (cellIndex !== this.cellIndex) {
				return;
			}
		}

		if (this.parameter.focused && this.focusRef.current) {
			this.focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });

			if (this.inputRef.current) {
				this.inputRef.current.focus();
			}
		}
	};

	listenerOpenComments = (event) => {
		const { targetPortlet, targetFormId, open } = event.dataPacket;

		if (!(this.namespace === targetPortlet && this.componentId === targetFormId)) {
			/*
			console.log(
				"[SXBaseParameterComponent] listenerOpenComments rejected: ",
				this.parameter.label,
				event.dataPacket
			);
			*/
			return;
		}
		//console.log("[SXBaseParameterComponent] listenerOpenComments: ", this.parameter.label, event.dataPacket);

		this.setState({ openComments: open });
	};

	listenerRequest = (event) => {
		const { targetPortlet, targetFormId, sourceFormId, requestId, params } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXBaseParameterComponent] listenerRequest rejected:", this.paramCode, event.dataPacket);
			return;
		}

		//console.log("[SXBaseParameterComponent] listenerRequest:", this.paramCode, event.dataPacket);
		Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
			targetFormId: this.formId,
			sourceFormId: sourceFormId,
			requestId: requestId,
			params: params
		});
	};

	listenerFreezeComments = (event) => {
		const { targetPortlet, targetFormId, params } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			/*
			console.log(
				"[SXBaseParameterComponent] listenerFreezeComments rejected:",
				this.parameter.paramCode,
				event.dataPacket
			);
			*/
			return;
		}

		//console.log("[SXBaseParameterComponent] listenerFreezeComments:", this.parameter.paramCode, params);
	};

	componentDidMount() {
		//console.log("Parameter Component Remounted: ", this.parameter.paramCode, this.parameter);

		Event.on(Event.SX_REFRESH, this.listenerRefresh);
		Event.on(Event.SX_FOCUS, this.listenerFocus);
		Event.on(Event.SX_OPEN_COMMENTS, this.listenerOpenComments);
		Event.on(Event.SX_FREEZE_COMMENTS, this.listenerFreezeComments);
		Event.on(Event.SX_REQUEST, this.listenerRequest);

		if (this.parameter.focused && this.inputRef.current) {
			this.inputRef.current.focus();
		}
	}

	componentWillUnmount() {
		Event.off(Event.SX_REFRESH, this.listenerRefresh);
		Event.off(Event.SX_FOCUS, this.listenerFocus);
		Event.off(Event.SX_OPEN_COMMENTS, this.listenerOpenComments);
		Event.off(Event.SX_FREEZE_COMMENTS, this.listenerFreezeComments);
		Event.off(Event.SX_REQUEST, this.listenerRequest);
	}

	isMyEvent({ targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0" }) {
		return (
			this.namespace === targetPortlet &&
			this.formId === targetFormId &&
			paramCode === this.parameter.paramCode &&
			paramVersion === this.parameter.paramVersion
		);
	}

	render() {
		return null;
	}
}

export default SXBaseParameterComponent;
