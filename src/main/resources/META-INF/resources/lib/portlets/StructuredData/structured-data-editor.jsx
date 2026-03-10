import React from 'react';
import { Util } from '../../stationx/util';
import { EditStatus, Event, LoadingStatus, RequestIDs } from '../../stationx/station-x';
import Button from '@clayui/button';
import Icon from '@clayui/icon';
import DataStructure from '../DataStructure/data-structure';
import SXBaseVisualizer from '../../stationx/visualizer';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import { SXLabeledText } from '../Form/form';

class StructuredDataEditor extends SXBaseVisualizer {
  constructor(props) {
    super(props);

    console.log('StructuredDataEditor props: ', props);

    this.editStatus = this.params.editStatus ? this.params.editStatus : EditStatus.PREVIEW;
    this.dataCollectionId = this.params.dataCollectionId ?? 0;
    this.dataSetId = this.params.dataSetId ?? 0;
    this.dataTypeId = this.params.dataTypeId ?? 0;
    this.dataStructureId = this.params.dataStructureId ?? 0;
    this.structuredData = null;

    this.dataStructure = null;

    this.state = {
      structuredDataId: this.params.structuredDataId ?? 0,
      infoDialog: false,
      saveWarningDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      loadingStatus: LoadingStatus.PENDING
    };

    this.abstract = '';
    /*
		console.log(
			"StructuredDataEditor constructor: ",
			this.namespace,
			this.portletId,
			this.workbenchId,
			this.workbenchNamespace,
			this.editStatus
		);
		*/

    this.componentId = this.formId;
  }

  listenerLoadData = (event) => {
    const { targetPortlet, data } = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      console.log('StructuredDataEditor listenerLoadData REJECTED: ', event.dataPacket);
      return;
    }

    console.log('StructuredDataEditor listenerLoadData: ', event.dataPacket);

    this.structuredData = data;
    this.forceUpdate();
  };

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[StructuredDataEditor] listenerWorkbenchReady event rejected: ", targetPortlet);
      return;
    }

    console.log('[StructuredDataEditor] listenerWorkbenchReady received: ', this.editStatus);

    switch (this.editStatus) {
      case EditStatus.PREVIEW:
      case EditStatus.ADD: {
        this.fireRequest({
          requestId: RequestIDs.loadDataStructure,
          params: {
            dataTypeId: this.dataTypeId
          }
        });

        this.setState({ loadingStatus: LoadingStatus.PENDING });
        break;
      }
      case EditStatus.UPDATE: {
        this.fireRequest({
          requestId: RequestIDs.loadStructuredData,
          params: {
            dataCollectionId: this.dataCollectionId,
            dataSetId: this.dataSetId,
            dataTypeId: this.dataTypeId,
            structuredDataId: this.state.structuredDataId
          }
        });

        this.setState({ loadingStatus: LoadingStatus.PENDING });
        break;
      }
    }
  };

  listenerResponce = (event) => {
    const { targetPortlet, requestId, data, params, status } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      console.log('[StructuredDataEditor] listenerResponce rejected: ', event.dataPacket);
      return;
    }

    console.log('[StructuredDataEditor] listenerResonse: ', event.dataPacket);

    const { error } = data;
    if (error) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: error
      });
    }

    switch (requestId) {
      case RequestIDs.loadStructuredData: {
        const { dataStructure, structuredData } = data;

        this.structuredData = structuredData;

        const { dataCollectionId, dataSetId, dataTypeId, structuredDataId } = structuredData;

        this.dataCollectionId = dataCollectionId;
        this.dataSetId = dataSetId;
        this.dataTypeId = dataTypeId;
        this.state.structuredDataId = structuredDataId;

        this.dataStructure = new DataStructure({
          namespace: this.namespace,
          formId: this.portletId,
          properties: dataStructure ?? {}
        });

        this.dataStructure.loadData(structuredData.data);

        console.log('DataStructure filled with values: ', this.dataStructure);
        break;
      }
      case RequestIDs.loadDataStructure: {
        const { dataStructure } = data;
        this.dataStructure = new DataStructure({
          namespace: this.namespace,
          formId: this.portletId,
          properties: dataStructure ?? {}
        });

        this.componentId = this.formId + this.dataStructure.paramCode + '_' + this.dataStructure.paramVersion;
        break;
      }
      case RequestIDs.saveStructuredData: {
        console.log('Saved data result: ', data);
        const { message, structuredDataId } = data;

        this.setState({
          structuredDataId: structuredDataId,
          infoDialog: true,
          dialogHeader: SXModalUtil.successDlgHeader(),
          dialogBody: message
        });

        this.dataStructure.markClean();

        break;
      }
      case RequestIDs.downloadFieldAttachedFile: {
        console.log('download finished');
        const blob = new Blob([data]);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = params.fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      }
      case RequestIDs.openReferenceFile: {
        this.openDataOnWindow(data);
      }
    }

    this.setState({ loadingStatus: status });
  };

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, parameter } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[StructuredDataEditor] listenerFieldValueChanged rejected: ", event.dataPacket);
      return;
    }

    const structuredData = this.dataStructure.toData();
    console.log('[StructuredDataEditor] listenerFieldValueChanged received: ', event.dataPacket, structuredData);

    const files = this.dataStructure.getDataFiles();

    //console.log("[StructuredDataEditor files] ", files);
    //console.log("[StructuredDataEditor data] ", structuredData);

    Event.fire(Event.SX_STRUCTURED_DATA_CHANGED, this.namespace, this.workbenchNamespace, {
      targetFormId: this.sourceFormId,
      dataCollectionId: this.dataCollectionId,
      dataSetId: this.dataSetId,
      dataTypeId: this.dataTypeId,
      structuredDataId: this.state.structuredDataId,
      data: structuredData
    });
  };

  listenerDownloadFieldAttachedFile = (event) => {
    const { targetPortlet, fileName, fileType, paramCode, paramVersion } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      console.log('[StructuredDataEditor] listenerDownloadFieldAttachedFile rejected: ', event.dataPacket);
      return;
    }

    console.log('[StructuredDataEditor] listenerDownloadFieldAttachedFile received: ', event.dataPacket);

    this.fireRequest({
      requestId: RequestIDs.downloadFieldAttachedFile,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeId: this.dataTypeId,
        structuredDataId: this.state.structuredDataId,
        paramCode: paramCode,
        paramVersion: paramVersion,
        fileName: fileName,
        fileType: fileType,
        disposition: 'attachment'
      }
    });
  };

  listenerOpenReferenceFile = (event) => {
    const { targetPortlet, targetFormId, sourceFormId, paramCode, paramVersion, fileName, fileType } = event.dataPacket;

    if (!(this.namespace === targetPortlet && this.componentId === targetFormId)) {
      console.log(
        '[StructuredDataEditor] listenerOpenReferenceFile rejected: ',
        paramCode,
        event.dataPacket,
        this.componentId,
        targetFormId
      );

      return;
    }

    console.log(
      '[StructuredDataEditor] listenerOpenReferenceFile: ',
      paramCode,
      paramVersion,
      fileName,
      fileType,
      event.dataPacket
    );

    this.fireRequest({
      targetFormId: this.formId,
      sourceFormId: sourceFormId,
      requestId: RequestIDs.openReferenceFile,
      params: {
        dataStructureCode: this.dataStructure.paramCode,
        dataStructureVersion: this.dataStructure.paramVersion,
        paramCode: paramCode,
        paramVersion: paramVersion,
        fileName: fileName,
        fileType: fileType,
        disposition: 'inline'
      }
    });
  };

  listenerComponentWillUnmount = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[StructuredDataEditor] listenerComponentWillUnmount rejected: ", event.dataPacket);
      return;
    }

    //console.log("[StructuredDataEditor] listenerComponentWillUnmount received: ", event.dataPacket);
    this.componentWillUnmount();
  };

  componentDidMount() {
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    //this.loadStructuredData();
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_RESPONSE, this.listenerResponce);
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.on(Event.SX_DOWNLOAD_FIELD_ATTACHED_FILE, this.listenerDownloadFieldAttachedFile);
    Event.on(Event.SX_OPEN_REFERENCE_FILE, this.listenerOpenReferenceFile);

    this.fireHandshake();
  }

  componentWillUnmount() {
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_RESPONSE, this.listenerResponce);
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.off(Event.SX_DOWNLOAD_FIELD_ATTACHED_FILE, this.listenerDownloadFieldAttachedFile);
    Event.off(Event.SX_OPEN_REFERENCE_FILE, this.listenerOpenReferenceFile);
  }

  loadStructuredData = async () => {
    const params = {
      dataCollectionId: this.dataCollectionId,
      dataSetId: this.dataSetId,
      dataTypeId: this.dataTypeId,
      dataStructureId: this.dataStructureId,
      structuredDataId: this.dataStructureId
    };

    //this.visualizer.loadData(ResourceIds.LOAD_STRUCTURED_DATA_EDITING, params);
  };

  saveData = () => {
    const data = this.dataStructure.toData();
    console.log('handleSaveData: ', data);

    const files = this.dataStructure.getDataFiles();

    console.log('[StructuredDataEditor files] ', files);
    console.log('[StructuredDataEditor data] ', data);

    console.log(
      'Handle SaveData: ',
      this.dataCollectionId,
      this.dataSetId,
      this.dataTypeId,
      this.state.structuredDataId
    );

    this.fireRequest({
      requestId: RequestIDs.saveStructuredData,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeId: this.dataTypeId,
        structuredDataId: this.state.structuredDataId,
        files: files,
        data: JSON.stringify(data)
      }
    });
  };

  handleSaveData = () => {
    const hasError = this.dataStructure.validate();
    console.log('[StructuredDataEditor handleSaveData hasError] ', hasError);
    if (hasError > 0) {
      this.setState({
        saveWarningDialog: true,
        dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
        dialogBody: Util.translate('data-has-warning-are-you-sure-to-save-with-warning')
      });

      return;
    } else if (hasError < 0) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: Util.translate('data-has-error-please-fix-it-to-save')
      });

      return;
    }

    this.saveData();
  };

  handleCancel = () => {
    Event.fire(Event.SX_REMOVE_WINDOW, this.namespace, this.workbenchNamespace, {
      targetFormId: this.workbenchId
    });
  };

  render() {
    //console.log("Editor render: ", this.dataStructure, this.loadingStatus);
    if (this.loadingStatus === LoadingStatus.PENDING) {
      return <h3>Loading...</h3>;
    } else if (this.loadingStatus === LoadingStatus.FAIL) {
      return <h3>Loading Failed</h3>;
    } else {
      return (
        <>
          {this.state.structuredDataId > 0 && (
            <div className="autofit-row" style={{ paddingRight: '10px' }}>
              <div className="autofit-col autofit-col-expand">
                <SXLabeledText
                  label={Util.translate('id')}
                  text={this.state.structuredDataId}
                  spritemap={this.spritemap}
                />
              </div>
              {this.structuredData && <div className="autofit-col"></div>}
            </div>
          )}
          <div className="autofit-row" style={{ backgroundColor: '#fff', paddingTop: '1.5rem', paddingRight: '10px' }}>
            <div className="autofit-col autofit-col-expand">
              {Util.isNotEmpty(this.dataStructure) &&
                this.dataStructure.render({ canvasId: this.namespace, spritemap: this.spritemap })}
            </div>
          </div>
          {this.buttons && (
            <Button.Group
              spaced
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '1.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <Button displayType="primary" onClick={this.handleSaveData} title={Util.translate('save-data')}>
                <Icon symbol="disk" spritemap={this.spritemap} style={{ marginRight: '5px' }} />
                {Util.translate('save')}
              </Button>
              <Button displayType="secondary" onClick={this.handleCancel} title={Util.translate('cancel')}>
                {Util.translate('cancel')}
              </Button>
            </Button.Group>
          )}
          {this.state.infoDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('ok'),
                  onClick: (e) => {
                    this.setState({ infoDialog: false });
                  }
                }
              ]}
            />
          )}
          {this.state.saveWarningDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('save'),
                  onClick: (e) => {
                    this.saveData();

                    this.setState({ saveWarningDialog: false });
                  }
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ saveWarningDialog: false });
                  }
                }
              ]}
            />
          )}
        </>
      );
    }
  }
}

export default StructuredDataEditor;
