import React from "react";
import { Util } from "../../stationx/util";
import { Event } from "../../stationx/station-x";

class StructuredDataEditor extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.baseResourceURL = props.baseResourceURL;
		this.spritemap = props.spritemapPath;
		this.workbenchNamespace = props.workbenchNamespace;
		this.permissions = props.permissions;

		this.typeStructureLink = props.typeStructureLink ?? {};
		this.dataTypeId = props.dataTypeId;
		this.dataStructureId = props.dataStructureId;
		this.structuredDataId = props.structuredDataId;
	}

	componentDidMount() {
		console.log("StructuredDataEditor: ", this.props);

		if (Util.isNotEmpty(this.typeStructureLink)) {
			this.dataTypeId =
				this.typeStructureLink.dataTypeId > 0 ? this.typeStructureLink.dataTypeId : this.dataTypeId;
			this.dataStructureId =
				this.typeStructureLink.dataStructureId > 0
					? this.typeStructureLink.dataStructureId
					: this.dataStructureId;
		}

		if (Util.isNotEmpty(this.workbenchNamespace)) {
			Event.fire(Event.SX_HANDSHAKE, this.namespace, this.workbenchNamespace, {});
		}
	}

	componentWillUnmount() {}

	loadStructuredData;

	render() {
		return (
			<>
				<h4>StructuredDataEditor</h4>
			</>
		);
	}
}

export default StructuredDataEditor;
