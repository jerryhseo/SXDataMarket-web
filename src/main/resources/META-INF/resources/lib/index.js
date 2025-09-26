import React from "react";
import { createRoot } from "react-dom/client";
import DataWorkbench from "./portlets/DataWorkbench/data-workbench";
import { PortletKeys } from "./stationx/station-x";
import { ClayModalProvider } from "@clayui/modal";
import DataTypeExplorer from "./portlets/DataType/datatype-explorer";
import DataTypeEditor from "./portlets/DataType/datatype-editor";
import DataStructureBuilder from "./portlets/DataStructure/datastructure-builder";
import StructuredDataEditor from "./portlets/StructuredData/structured-data-editor";
import StructuredDataExplorer from "./portlets/StructuredData/structured-data-explorer";

export default function (elementId, portletId, portletParams) {
	const root = createRoot(document.getElementById(elementId));

	switch (portletId) {
		case PortletKeys.DATA_WORKBENCH: {
			root.render(
				<ClayModalProvider>
					<DataWorkbench {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
		case PortletKeys.DATATYPE_EXPLORER: {
			root.render(
				<ClayModalProvider>
					<DataTypeExplorer {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
		case PortletKeys.DATATYPE_EDITOR: {
			root.render(
				<ClayModalProvider>
					<DataTypeEditor {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
		case PortletKeys.DATASTRUCTURE_BUILDER: {
			root.render(
				<ClayModalProvider>
					<DataStructureBuilder {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
		case PortletKeys.STRUCTURED_DATA_EDITOR: {
			root.render(
				<ClayModalProvider>
					<StructuredDataEditor {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
		case PortletKeys.STRUCTURED_DATA_EXPLORER: {
			root.render(
				<ClayModalProvider>
					<StructuredDataExplorer {...portletParams} />
				</ClayModalProvider>
			);
			break;
		}
	}
}
