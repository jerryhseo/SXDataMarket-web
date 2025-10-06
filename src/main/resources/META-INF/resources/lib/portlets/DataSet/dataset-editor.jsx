import React from "react";
import SXBaseVisualizer from "../../stationx/visualizer";
import { Event, LoadingStatus } from "../../stationx/station-x";

class DataSetEditor extends SXBaseVisualizer {
	constructor(props) {
		super(props);
	}

	listenerFieldValueChanged = (event) => {
		const dataPacket = Event.pickUpDataPacket(event, this.namespace, this.formId);

		if (!dataPacket) {
			console.log("[dataSetEditor] listenerFieldValueChanged rejected: ", dataPacket);

			return;
		}

		console.log("[dataSetEditor] listenerFieldValueChanged received: ", dataPacket);
	};

	listenerWorkbenchReady = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataSetEditor] listenerWorkbenchReady event rejected: ", dataPacket);
			return;
		}

		console.log("[dataSetEditor] listenerWorkbenchReady received: ", dataPacket);

		this.setState({ loadingStatus: LoadingStatus.PENDING });
	};

	listenerResponse = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[dataSetEditor] listenerResponse rejected: ", dataPacket);
			return;
		}

		console.log("[dataSetEditor] listenerResponse received: ", dataPacket);

		this.setState({ loadingStatus: LoadingStatus.COMPLETE });
	};

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataTypeEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataTypeEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		//Loading dataType
		//this.loadDataType();

		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.on(Event.SX_RESPONSE, this.listenerResponce);
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

		this.fireHandshake();
	}

	componentWillUnmount() {
		console.log("[DataSetEditor] componentWillUnmount");
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
		Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
		Event.off(Event.SX_RESPONSE, this.listenerResponce);
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	render() {
		if (this.state.loadingStatus == LoadingStatus.PENDING) {
			return <h3>Loading....</h3>;
		} else if (this.state.loadingStatus == LoadingStatus.FAIL) {
			return <h3>Loading failed</h3>;
		}

		return <div>DataSetEditor</div>;
	}
}

export default DataSetEditor;
