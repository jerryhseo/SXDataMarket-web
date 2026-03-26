import React from 'react';
import { createRoot } from 'react-dom/client';
import DataWorkbench from './portlets/DataWorkbench/data-workbench';
import { PortletKeys } from './stationx/station-x';
import { ClayModalProvider } from '@clayui/modal';
import DataTypeExplorer from './portlets/DataType/datatype-explorer';
import DataTypeEditor from './portlets/DataType/datatype-editor';
import DataStructureBuilder from './portlets/DataStructure/datastructure-builder';
import StructuredDataEditor from './portlets/StructuredData/structured-data-editor';
import StructuredDataExplorer from './portlets/StructuredData/structured-data-explorer';
import DataCollectionEditor from './portlets/DataCollection/datacollection-editor';
import DataSetExplorer from './portlets/DataSet/dataset-explorer';
import DataCollectionExplorer from './portlets/DataCollection/datacollection-explorer';
import DataSetEditor from './portlets/DataSet/dataset-editor';
import DataStructureExplorer from './portlets/DataStructure/datastructure-explorer';
import CollectionsManagement from './portlets/DataCollection/collections-management';
import DataCollectionViewer from './portlets/DataCollection/datacollection-viewer';
import DataSetViewer from './portlets/DataSet/dataset-viewer';
import DataTypeViewer from './portlets/DataType/datatype-viewer';

export default function (elementId, portletId, portletParams) {
  const root = createRoot(document.getElementById(elementId));

  switch (portletId) {
    case PortletKeys.DATA_WORKBENCH: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPathPath}>
          <DataWorkbench {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.COLLECTION_MANAGEMENT: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPathPath}>
          <CollectionsManagement {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATACOLLECTION_VIEWER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPathPath}>
          <DataCollectionViewer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATACOLLECTION_EDITOR: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataCollectionEditor {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATACOLLECTION_EXPLORER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataCollectionExplorer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATASET_EDITOR: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataSetEditor {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATASET_VIEWER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataSetViewer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATASET_EXPLORER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataSetExplorer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATATYPE_VIEWER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataTypeViewer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATATYPE_EXPLORER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataTypeExplorer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATATYPE_EDITOR: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataTypeEditor {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATASTRUCTURE_BUILDER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataStructureBuilder {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.DATASTRUCTURE_EXPLORER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <DataStructureExplorer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.STRUCTURED_DATA_EDITOR: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <StructuredDataEditor {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
    case PortletKeys.STRUCTURED_DATA_EXPLORER: {
      root.render(
        <ClayModalProvider spritemap={portletParams.spritemapPath}>
          <StructuredDataExplorer {...portletParams} />
        </ClayModalProvider>
      );
      break;
    }
  }
}
