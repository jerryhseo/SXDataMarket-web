import React from "react";

class Visualizer {
	constructor({ namespace, visualizerId, workbenchNamespace, workbenchFormId, dataLoadFunc }) {
		this.namespace = namespace;
		this.visualizerId = visualizerId;
		this.workbenchNamespace = workbenchNamespace;
		this.workbenchFormId = workbenchFormId;
	}

	loadData() {}

	fireHandshake() {
		Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchFormId
		});
	}

	fireRequestData() {}
}

export default Visualizer;
