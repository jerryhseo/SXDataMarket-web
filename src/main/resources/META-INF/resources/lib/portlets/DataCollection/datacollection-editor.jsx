import React from 'react';
import { Util } from '../../stationx/util';
import {
  EditStatus,
  ErrorClass,
  Event,
  LoadingStatus,
  ParamType,
  RequestIDs,
  ValidationRule,
} from '../../stationx/station-x';
import Button from '@clayui/button';
import Icon from '@clayui/icon';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import SXBaseVisualizer from '../../stationx/visualizer';
import { SXLabeledText } from '../Form/form';
import ParameterConstants from '../Parameter/parameter-constants';
import { ParameterUtil } from '../Parameter/parameters';
import { Text } from '@clayui/core';

class DataCollectionEditor extends SXBaseVisualizer {
  constructor(props) {
    super(props);

    //console.log("DataCollectionEditor props: ", props);

    this.state = {
      editStatus: this.props.dataCollectionId > 0 ? EditStatus.UPDATE : EditStatus.ADD,
      dataCollectionId: Number(this.params.dataCollectionId ?? 0),
      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      warningAndSaveDialog: false,
      loadingStatus: LoadingStatus.PENDING,
    };

    this.dataCollectionCode = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'dataCollectionCode',
        displayName: Util.getTranslationObject(this.languageId, 'datacollection-code'),
        placeholder: Util.getTranslationObject(this.languageId, 'datacollection-code'),
        tooltip: Util.getTranslationObject(this.languageId, 'code-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR,
          },
          pattern: {
            value: ValidationRule.VARIABLE,
            message: Util.getTranslationObject(this.languageId, 'invalid-code'),
            errorClass: ErrorClass.ERROR,
          },
          minLength: {
            value: 3,
            message: Util.getTranslationObject(this.languageId, 'shorter-than-min-length', '3'),
            errorClass: ErrorClass.ERROR,
          },
          maxLength: {
            value: 32,
            message: Util.getTranslationObject(this.languageId, 'longer-than-max-length', '32'),
            errorClass: ErrorClass.ERROR,
          },
        },
        style: {
          width: '250px',
        },
      },
    });

    this.dataCollectionVersion = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'dataCollectionVersion',
        displayName: Util.getTranslationObject(this.languageId, 'version'),
        placeholder: Util.getTranslationObject(this.languageId, '1.0.0'),
        tooltip: Util.getTranslationObject(this.languageId, 'version-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR,
          },
          pattern: {
            value: ValidationRule.VERSION,
            message: Util.getTranslationObject(this.languageId, 'invalid-version-format'),
            errorClass: ErrorClass.ERROR,
          },
        },
        defaultValue: '1.0.0',
        style: {
          width: '150px',
        },
      },
    });

    this.displayName = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'displayName',
        localized: true,
        displayName: Util.getTranslationObject(this.languageId, 'display-name'),
        placeholder: Util.getTranslationObject(this.languageId, 'display-name'),
        tooltip: Util.getTranslationObject(this.languageId, 'display-name-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR,
          },
          minLength: {
            value: 3,
            message: Util.getTranslationObject(this.languageId, 'shorter-than-min-length', '3'),
            errorClass: ErrorClass.ERROR,
          },
          maxLength: {
            value: 64,
            message: Util.getTranslationObject(this.languageId, 'longer-than-max-length', '64'),
            errorClass: ErrorClass.ERROR,
          },
        },
        className: 'autofit-col-expand',
      },
    });

    this.description = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'description',
        localized: true,
        displayName: Util.getTranslationObject(this.languageId, 'description'),
        placeholder: Util.getTranslationObject(this.languageId, 'description'),
        tooltip: Util.getTranslationObject(this.languageId, 'description-tooltip'),
        multipleLine: true,
      },
    });

    this.groupParameter = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: ParamType.GROUP,
      properties: {
        paramCode: 'requiredProps',
        paramVersion: '1.0.0',
        displayName: Util.getTranslationObject(this.languageId, 'required-properties'),
        viewType: ParameterConstants.GroupViewTypes.FIELDSET,
        members: [this.dataCollectionCode, this.dataCollectionVersion, this.displayName],
        membersPerRow: 3,
      },
    });

    this.dataSets = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: 'DualList',
      properties: {
        paramCode: 'dataSets',
        displayName: Util.getTranslationObject(this.languageId, 'associated-datasets'),
        tooltip: Util.getTranslationObject(this.languageId, 'associated-datasets-tooltip'),
        viewType: ParameterConstants.DualListViewTypes.ORDERED,
      },
    });
  }

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId, parameter } = event.dataPacket;

    if (targetPortlet !== this.namespace || this.formId !== targetFormId) {
      //console.log("[dataCollectionEditor] listenerFieldValueChanged rejected: ", event.dataPacket);
      return;
    }

    /*
		console.log(
			"[dataCollectionEditor] listenerFieldValueChanged received: ",
			event.dataPacket,
			parameter,
			this.dataSets.getValue(),
			this.dataSets.getValue().map((strDataSetId) => Number(strDataSetId))
		); */

    Event.fire(Event.SX_DATACOLLECTION_CHANGED, this.namespace, this.workbenchNamespace, {
      dataCollection: {
        dataCollectionId: this.state.dataCollectionId,
        dataCollectionCode: this.dataCollectionCode.getValue(),
        dataCollectionVersion: this.dataCollectionVersion.getValue(),
        displayName: this.displayName.getValue(),
        description: this.description.getValue(),
        dataSets: this.dataSets.getValue().map((strDataSetId) => Number(strDataSetId)),
      },
    });
  };

  listenerWorkbenchReady = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      //console.log("[dataCollectionEditor] listenerWorkbenchReady event rejected: ", dataPacket);
      return;
    }

    //console.log("[dataCollectionEditor] listenerWorkbenchReady received: ", dataPacket);
    this.fireRequest({
      requestId: RequestIDs.loadDataCollection,
      params: {
        dataCollectionId: this.state.dataCollectionId,
        loadAvailableDataSets: true,
      },
    });
  };

  listenerResponse = (event) => {
    const { targetPortlet, requestId, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[dataCollectionEditor] listenerResponce rejected: ", event.dataPacket);
      return;
    }

    console.log('[dataCollectionEditor] listenerResonse: ', event.dataPacket);
    switch (requestId) {
      case RequestIDs.loadDataCollection: {
        const { dataCollection, associatedDataSetList = [], availableDataSetList = [] } = data;

        if (Util.isNotEmpty(dataCollection)) {
          this.dataCollectionCode.setValue({ value: dataCollection.dataCollectionCode });
          this.dataCollectionVersion.setValue({ value: dataCollection.dataCollectionVersion });
          this.displayName.setValue({ value: dataCollection.displayName });
          this.description.setValue({ value: dataCollection.description });
          this.dataCollectionCode.refreshKey();
          this.dataCollectionVersion.refreshKey();
          this.displayName.refreshKey();
          this.description.refreshKey();
        }

        //console.log("DataCollectionEditor.listenerResponse : associatedDataSetList", associatedDataSetList);

        if (Util.isNotEmpty(availableDataSetList)) {
          this.availableDataSetList = availableDataSetList;
          this.dataSets.options = this.availableDataSetList.map((dataSet) => {
            let label = {};
            label[this.languageId] = dataSet.displayName + ' v.' + dataSet.dataSetVersion;

            return {
              key: dataSet.dataSetId,
              value: dataSet.dataSetId,
              label: label,
            };
          });
        }

        if (Util.isNotEmpty(associatedDataSetList)) {
          const associatedDataSetIds = associatedDataSetList.map((dataSet) => {
            const { dataSetCode, dataSetVersion, dataSetId, displayName } = dataSet;

            return {
              key: dataSetId,
              label: Util.getTranslationObject(this.languageId, displayName + ' v.' + dataSetVersion),
              value: dataSetId,
            };
          });

          this.dataSets.setValue({
            value: associatedDataSetIds,
          });
        }

        this.dataSets.refreshKey();

        this.setState({
          loadingStatus: LoadingStatus.COMPLETE,
        });

        break;
      }
      case RequestIDs.saveDataCollection: {
        const { dataCollection } = data;

        this.setState({
          editStatus: EditStatus.UPDATE,
          dataCollectionId: Number(dataCollection.dataCollectionId),
          loadingStatus: LoadingStatus.COMPLETE,
        });

        break;
      }
    }
  };

  listenerComponentWillUnmount = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      //console.log("[DataCollectionEditor] listenerComponentWillUnmount rejected: ", dataPacket);
      return;
    }

    //console.log("[DataCollectionEditor] listenerComponentWillUnmount received: ", dataPacket);
    this.componentWillUnmount();
  };

  componentDidMount() {
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);

    this.fireHandshake();
  }

  componentWillUnmount() {
    //console.log("[DataCollectionEditor] componentWillUnmount");
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  getAssociatedDataSetInfos(dataSetStrIds) {
    return dataSetStrIds.map((id) => Number(id));

    /*
		const associatedDataSets = this.availableDataSetList
			? this.availableDataSetList.filter((dataSet) => dataSetIds.includes(Number(dataSet.dataSetId)))
			: [];

		return associatedDataSets;
		*/
  }

  checkFieldError = () => {
    let error = this.dataCollectionCode.validate();
    let warning = null;
    if (error === -1) {
      this.dataCollectionCode.dirty = true;
      return this.dataCollectionCode.error;
    } else if (error === 1) {
      warning = this.dataCollectionCode.error;
    }

    //console.log("dataCollectionVersion: ", this.dataCollectionVersion.getValue());
    error = this.dataCollectionVersion.validate();
    if (error === -1) {
      this.dataCollectionVersion.dirty = true;
      return this.dataCollectionVersion.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.dataCollectionVersion.error;
    }

    error = this.displayName.validate();
    if (error === -1) {
      this.displayName.dirty = true;
      return this.displayName.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.displayName.error;
    }

    error = this.description.validate();
    if (error === -1) {
      this.description.dirty = true;
      return this.description.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.description.error;
    }

    error = this.dataSets.validate();
    if (error === -1) {
      this.dataSets.dirty = true;
      return this.dataSets.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.dataSets.error;
    }

    return warning;
  };

  handleSaveDataCollection = () => {
    const error = this.checkFieldError();

    if (Util.isNotEmpty(error)) {
      if (error.errorClass === ErrorClass.ERROR) {
        this.setState({
          infoDialog: true,
          dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
          dialogBody: Util.translate('fix-the-error-first', error.message),
        });
      } else {
        this.setState({
          waringAndSaveDialog: true,
          dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
          dialogBody: Util.translate('data-has-warning-do-you-proceed-anyway', error.message),
        });
      }

      return;
    }

    this.saveDataCollection();
  };

  handleDeleteClick = (event) => {
    event.stopPropagation();

    Event.fire(Event.SX_DELETE_DATACOLLECTION, this.namespace, this.workbenchNamespace, {
      dataCollectionId: this.state.dataCollectionId,
    });
  };

  saveDataCollection = () => {
    let params = {
      dataCollectionId: this.state.dataCollectionId,
      dataCollectionCode: this.dataCollectionCode.getValue(),
      dataCollectionVersion: this.dataCollectionVersion.getValue(),
      associatedDataSetList: this.dataSets.getValue(),
    };

    //console.log("saveDataCollection: ", this.dataSets.getValue());

    if (this.displayName.hasValue()) {
      params.displayName = JSON.stringify(this.displayName.getValue());
    }

    if (this.description.hasValue()) {
      params.description = JSON.stringify(this.description.getValue());
    }

    Event.fire(Event.SX_SAVE_DATACOLLECTION, this.namespace, this.workbenchNamespace, {
      dataCollection: params,
    });

    /*
		this.fireRequest({
			requestId: RequestIDs.saveDataCollection,
			params: params
		});
		*/
  };

  render() {
    return (
      <>
        {this.titleBar && this.state.dataCollectionId > 0 && (
          <div style={{ borderBottom: '3px solid #e7e7ed', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <Text size={6} weight="bold">
              {Util.translate('edit-datacollection')}
            </Text>
          </div>
        )}
        {this.state.dataCollectionId > 0 && (
          <SXLabeledText
            label={Util.translate('datacollection-id')}
            text={this.state.dataCollectionId}
            align="left"
            viewType="INLINE_ATTACH"
            style={{ marginBottom: '1rem', marginTop: '1.5rem' }}
          />
        )}
        <div style={{ marginTop: '2rem' }}>
          {this.groupParameter.render({ spritemap: this.spritemap })}
          {this.description.renderField({ spritemap: this.spritemap })}
          {this.dataSets.renderField({ spritemap: this.spritemap })}
          <Button.Group spaced style={{ width: '100%', justifyContent: 'center' }}>
            <Button
              displayType="primary"
              onClick={this.handleSaveDataCollection}
              title={Util.translate('save-datacollection')}
            >
              <Icon symbol="disk" spritemap={this.spritemap} style={{ marginRight: '5px' }} />
              {Util.translate('save')}
            </Button>
            {this.state.dataCollectionId > 0 && (
              <Button title={Util.translate('delete')} onClick={this.handleDeleteClick} displayType="warning">
                <span className="inline-item inline-item-before">
                  <Icon symbol="trash" spritemap={this.spritemap} />
                </span>
                {Util.translate('delete')}
              </Button>
            )}
          </Button.Group>
          {this.state.infoDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.dialogBody}
              buttons={[
                {
                  label: Util.translate('ok'),
                  onClick: () => {
                    this.setState({ infoDialog: false });
                  },
                },
              ]}
            />
          )}
          {this.state.waringAndSaveDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.dialogBody}
              buttons={[
                {
                  label: Util.translate('confirm'),
                  onClick: (e) => {
                    this.saveDataCollection();
                    this.setState({ waringAndSaveDialog: false });
                  },
                  displayType: 'secondary',
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ waringAndSaveDialog: false });
                  },
                },
              ]}
            />
          )}
        </div>
      </>
    );
  }
}

export default DataCollectionEditor;
