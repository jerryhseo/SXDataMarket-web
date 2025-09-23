import React from "react";
import { Event } from "./station-x";

class Visualizer {
	constructor({ namespace, visualizerId, workbenchNamespace, workbenchId, dataLoadFunc }) {
		this.namespace = namespace;
		this.visualizerId = visualizerId;
		this.workbenchNamespace = workbenchNamespace;
		this.workbenchId = workbenchId;
	}

	loadData() {}

	fireHandshake() {
		Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId
		});
	}

	fireRequestData() {}
}

export default Visualizer;
