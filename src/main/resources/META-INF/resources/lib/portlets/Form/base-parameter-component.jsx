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
	}

	listenerRefresh = (event) => {
		const { targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0", cellIndex } = event.dataPacket;

		if (
			!this.isMyEvent({
				targetPortlet: targetPortlet,
				targetFormId: targetFormId,
				paramCode: paramCode,
				paramVersion: paramVersion
			})
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
		const { dataPacket } = event;
		const { targetPortlet, targetFormId, paramCode, paramVersion = "1.0.0" } = dataPacket;

		if (
			!this.isMyEvent({
				targetPortlet: targetPortlet,
				targetFormId: targetFormId,
				paramCode: paramCode,
				paramVersion: paramVersion
			})
		) {
			return;
		}

		if (this.parameter.isGridCell()) {
			if (dataPacket.cellIndex !== this.cellIndex) {
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

	componentDidMount() {
		//console.log("Parameter Component Remounted: ", this.parameter.paramCode, this.parameter);

		Event.on(Event.SX_REFRESH, this.listenerRefresh);
		Event.on(Event.SX_FOCUS, this.listenerFocus);

		if (this.parameter.focused && this.inputRef.current) {
			this.inputRef.current.focus();
		}
	}

	componentWillUnmount() {
		Event.off(Event.SX_REFRESH, this.listenerRefresh);
		Event.off(Event.SX_FOCUS, this.listenerFocus);
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
