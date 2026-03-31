import React from 'react';
import { Text } from '@clayui/core';
import Button from '@clayui/button';
import Icon from '@clayui/icon';
import { SXButtonWithIcon, SXLabeledText } from '../Form/form';
import { Util } from '../../stationx/util';
import {
  EditStatus,
  LoadingStatus,
  Event,
  DataTypeProperty,
  ValidationRule,
  PortletKeys,
  Constant,
  ErrorClass,
  ParamType,
  RequestIDs
} from '../../stationx/station-x';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import SXBaseVisualizer from '../../stationx/visualizer';
import ParameterConstants from '../Parameter/parameter-constants';
import { createParameter } from '../DataStructure/datastructure-builder';

export const DataTypeInfo = ({ title, abstract, items, colsPerRow = 1 }) => {
  let sectionContent;

  if (colsPerRow == 1) {
    sectionContent = items.map((item, index) => (
      <div class="form-group-item" key={index}>
        <SXLabeledText label={item.label} text={item.text} />
      </div>
    ));
  } else if (colsPerRow > 1) {
    let rows = Util.convertArrayToRows(items, colsPerRow);

    sectionContent = rows.map((row, rowIndex) => (
      <div key={rowIndex} className="form-group-autofit" style={{ marginBottom: '5px' }}>
        {row.map((col, colIndex) => (
          <div key={(rowIndex + 1) * (colIndex + 1)} className="form-group-item" style={{ marginBottom: '0' }}>
            <SXLabeledText label={col.label} text={col.text} viewType="INLINE_ATTACH" />
          </div>
        ))}
      </div>
    ));
  }

  return (
    <div className="form-group sheet">
      <div className="sheet-header" style={{ marginBottom: '20px' }}>
        <h3 className="sheet-title" style={{ marginBottom: '10px' }}>
          {title}
        </h3>
        <div className="sheet-text" style={{ marginBottom: '5px' }}>
          {abstract}
        </div>
      </div>
      <div className="sheet-section" style={{ marginBottom: '1rem' }}>
        {sectionContent}
      </div>
    </div>
  );
};

class DataTypeEditor extends SXBaseVisualizer {
  /* Constants */
  dataCollectionId;
  dataSetId;
  componentId;

  /* volatile global variables */
  dirty = false;

  /* Form fields */
  dataTypeCode;
  dataTypeVersion;
  extension;
  displayName;
  description;
  visualizers;
  dataStructure;

  constructor(props) {
    super(props);

    console.log('DataTypeEditor props: ', props);

    /* Set global constants */
    this.dataCollectionId = this.params.dataCollectionId ?? 0;
    this.dataSetId = this.params.dataSetId ?? 0;
    this.componentId = this.namespace + 'DataTypeEditor';

    /* Definitions of the form fields */
    this.dataTypeCode = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: DataTypeProperty.CODE,
        displayName: Util.getTranslationObject(this.languageId, 'datatype-code'),
        placeholder: Util.getTranslationObject(this.languageId, 'datatype-code'),
        tooltip: Util.getTranslationObject(this.languageId, 'code-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          pattern: {
            value: ValidationRule.VARIABLE,
            message: Util.getTranslationObject(this.languageId, 'invalid-code'),
            errorClass: ErrorClass.ERROR
          },
          minLength: {
            value: 3,
            message: Util.getTranslationObject(this.languageId, 'shorter-than-min-length', ', 3'),
            errorClass: ErrorClass.ERROR
          },
          maxLength: {
            value: 32,
            message: Util.getTranslationObject(this.languageId, 'longer-than-max-length', ', 32'),
            errorClass: ErrorClass.ERROR
          }
        },
        style: {
          width: '200px'
        }
      }
    });

    const versionPlaceholder = {};
    versionPlaceholder[this.languageId] = '1.0.0';
    this.dataTypeVersion = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: DataTypeProperty.VERSION,
        displayName: Util.getTranslationObject(this.languageId, 'version'),
        placeholder: versionPlaceholder,
        tooltip: Util.getTranslationObject(this.languageId, 'version-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          pattern: {
            value: ValidationRule.VERSION,
            message: Util.getTranslationObject(this.languageId, 'invalid-version-format'),
            errorClass: ErrorClass.ERROR
          }
        },
        defaultValue: '1.0.0',
        style: {
          width: '100px'
        }
      }
    });

    const versionExt = {};
    versionExt[this.languageId] = 'ext';
    this.extension = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: DataTypeProperty.EXTENSION,
        displayName: Util.getTranslationObject(this.languageId, 'extension'),
        placeholder: versionExt,
        tooltip: Util.getTranslationObject(this.languageId, 'extension-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          pattern: {
            value: ValidationRule.EXTENSION,
            message: Util.getTranslationObject(this.languageId, 'invalid-extension'),
            errorClass: ErrorClass.ERROR
          },
          minLength: {
            value: 2,
            message: Util.getTranslationObject(this.languageId, 'shorter-than-min-length', ', 2'),
            errorClass: ErrorClass.ERROR
          },
          maxLength: {
            value: 8,
            message: Util.getTranslationObject(this.languageId, 'longer-than-max-length', ', 8'),
            errorClass: ErrorClass.ERROR
          }
        },
        style: {
          width: '100px'
        }
      }
    });

    this.displayName = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: DataTypeProperty.DISPLAY_NAME,
        localized: true,
        displayName: Util.getTranslationObject(this.languageId, 'display-name'),
        placeholder: Util.getTranslationObject(this.languageId, 'display-name'),
        tooltip: Util.getTranslationObject(this.languageId, 'display-name-tooltip'),
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          minLength: {
            value: 6,
            message: Util.getTranslationObject(this.languageId, 'shorter-than-min-length', ', 6'),
            errorClass: ErrorClass.ERROR
          },
          maxLength: {
            value: 64,
            message: Util.getTranslationObject(this.languageId, 'longer-than-max-length', ', 64'),
            errorClass: ErrorClass.ERROR
          }
        }
      }
    });

    this.description = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: DataTypeProperty.DESCRIPTION,
        localized: true,
        displayName: Util.getTranslationObject(this.languageId, 'description'),
        placeholder: Util.getTranslationObject(this.languageId, 'description'),
        tooltip: Util.getTranslationObject(this.languageId, 'description-tooltip'),
        multipleLine: true
      }
    });

    this.dataStructure = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.SELECT,
      properties: {
        paramCode: 'dataStructure',
        displayName: Util.getTranslationObject(this.languageId, 'import-datastructure'),
        tooltip: Util.getTranslationObject(this.languageId, 'import-datastructure-tooltip'),
        viewType: ParameterConstants.SelectViewTypes.LISTBOX,
        multiple: false,
        options: [],
        defaultValue: ''
      }
    });

    this.groupParameter = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.GROUP,
      properties: {
        paramCode: 'basicProps',
        paramVersion: '1.0.0',
        viewType: ParameterConstants.GroupViewTypes.ARRANGEMENT,
        members: [this.dataTypeCode, this.dataTypeVersion, this.extension, this.displayName],
        membersPerRow: 4
      }
    });

    this.fields = [this.groupParameter, this.description, this.dataStructure];

    this.state = {
      dataTypeId: this.params.dataTypeId ?? 0,
      loadingStatus: LoadingStatus.PENDING,
      infoDialog: false,
      dialogBody: <></>,
      dialogHeader: <></>,
      formValidated: false,
      deleteWarningDialog: false,
      underConstruction: false
    };

    this.hasStructure = false;

    this.editStatus = props.params.dataTypeId > 0 ? EditStatus.UPDATE : EditStatus.ADD;
  }

  /**********************
   *  Event Listers from other components.
   ***********************/
  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId, parameter } = event.dataPacket;

    if (!(targetPortlet === this.namespace && targetFormId === this.componentId)) {
      /*
			console.log(
				"[DataTypeEditor SX_FIELD_VALUE_CHANGED REJECTED] ",
				targetPortlet,
				this.namespace,
				targetFormId,
				this.componentId
			);
			*/
      return;
    }

    const error = this.checkFieldError();

    const validated = Util.isEmpty(error);
    console.log('[DataTypeEditor SX_FIELD_VALUE_CHANGED] ', parameter, error, validated);

    if (validated !== this.state.formValidated) {
      this.setState({
        formValidated: validated
      });
    }

    Event.fire(Event.SX_DATATYPE_CHANGED, this.namespace, this.workbenchNamespace, {
      dataType: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeCode: this.dataTypeCode.getValue(),
        dataTypeVersion: this.dataTypeVersion.getValue(),
        displayName: this.displayName.getValue(),
        description: this.description.getValue()
      }
    });
  };

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[dataTypeEditor] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[dataTypeEditor] listenerWorkbenchReady received: ", event.dataPacket);
    if (this.state.dataTypeId > 0) {
      this.fireRequest({
        requestId: RequestIDs.loadDataType,
        params: {
          dataCollectionId: this.dataCollectionId,
          dataSetId: this.dataSetId,
          dataTypeId: this.state.dataTypeId,
          loadStructure: true,
          loadVisualizers: true,
          loadAvailableVisualizers: true,
          loadAvailableStructures: true
        }
      });
    } else {
      this.setState({
        loadingStatus: LoadingStatus.COMPLETE
      });
    }
  };

  listenerResponse = (event) => {
    const { targetPortlet, targetFormId, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataTypeEditor] listenerResponse rejected: ", event.dataPacket);
      return;
    }

    console.log('[DataTypeEditor] listenerResonse: ', requestId, params, data);
    const { error, message } = data;
    if (Util.isNotEmpty(error)) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: error
      });

      return;
    } else if (Util.isNotEmpty(message)) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.successDlgHeader(this.spritemap),
        dialogBody: message
      });
    }

    switch (requestId) {
      case RequestIDs.saveDataType: {
        const { dataType } = data;

        this.cleanDirty();

        break;
      }
      case RequestIDs.addDataType: {
        const { dataType } = data;

        this.cleanDirty();

        this.setState({ dataTypeId: dataType.dataTypeId });
        break;
      }
      case RequestIDs.deleteDataTypes: {
        this.redirectTo({
          portletName: PortletKeys.DATATYPE_EXPLORER
        });

        break;
      }
      case RequestIDs.loadDataType: {
        // Set dataType values to fields and initialize fields
        this.setFormValues(data);

        break;
      }
    }

    this.setState({
      loadingStatus: LoadingStatus.COMPLETE
    });
  };

  listenerComponentWillUnmount = (event) => {
    const dataPacket = event.dataPacket;

    if (dataPacket.targetPortlet !== this.namespace) {
      //console.log("[DataTypeEditor] listenerComponentWillUnmount rejected: ", dataPacket);
      return;
    }

    //console.log("[DataTypeEditor] listenerComponentWillUnmount received: ", dataPacket);
    this.componentWillUnmount();
  };

  componentDidMount() {
    //Loading dataType
    //this.loadDataType();

    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);

    this.fireHandshake();
  }

  componentWillUnmount() {
    //console.log("[DataTypeEditor] componentWillUnmount");
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
  }

  setFormValues = ({ dataType, visualizers, availableVisualizers, availableDataStructures }) => {
    //console.log("setFormValues: ", dataType, dataStructure);

    if (dataType) {
      const { dataTypeCode, dataTypeVersion, extension, displayName, description, hasStructure } = dataType;

      this.dataTypeCode.setValue({ value: dataTypeCode });
      this.dataTypeVersion.setValue({ value: dataTypeVersion });
      this.extension.setValue({ value: extension });
      this.displayName.setValue({ value: displayName });
      this.description.setValue({ value: description });

      this.hasStructure = hasStructure ?? false;
    }

    if (availableDataStructures) {
      this.dataStructure.options = availableDataStructures.map((item) => ({
        label: Util.getTranslationObject(this.languageId, item.label),
        value: item.id
      }));
    }
  };

  isDirty() {
    return (
      this.dataTypeCode.dirty ||
      this.dataTypeVersion.dirty ||
      this.extension.dirty ||
      this.displayName.dirty ||
      this.description.dirty ||
      this.dataStructure.dirty
    );
  }

  cleanDirty() {
    this.dataTypeCode.dirty = false;
    this.dataTypeVersion.dirty = false;
    this.extension.dirty = false;
    this.displayName.dirty = false;
    this.description.dirty = false;
    this.dataStructure.dirty = false;
  }

  clearForm = (forceUpdate = true) => {
    this.dataTypeCode.clearValue();
    this.dataTypeVersion.clearValue();
    this.extension.clearValue();
    this.displayName.clearValue();
    this.description.clearValue();

    this.dataStructure.clearValue();

    this.forceUpdate();
  };

  deleteDataType = () => {
    Event.fire(Event.SX_DELETE_DATATYPES, this.namespace, this.workbenchNamespace, {
      dataTypeIds: [this.state.dataTypeId]
    });
  };

  checkFieldError = () => {
    let error = this.dataTypeCode.validate();
    let warning = null;
    if (error === -1) {
      this.dataTypeCode.dirty = true;
      return this.dataTypeCode.error;
    } else if (error === 1) {
      warning = this.dataTypeCode.error;
    }

    error = this.dataTypeVersion.validate();
    if (error === -1) {
      this.dataTypeVersion.dirty = true;
      return this.dataTypeVersion.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.dataTypeVersion.error;
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

    error = this.dataStructure.validate();
    if (error === -1) {
      this.dataStructure.dirty = true;
      return this.dataStructure.error;
    } else if (error === 1 && Util.isEmpty(warning)) {
      warning = this.dataStructure.error;
    }

    return warning;
  };

  handleBtnSaveClick = (event) => {
    event.stopPropagation();

    const error = this.checkFieldError();

    if (error) {
      this.setState({
        infoDialog: true,
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: Util.translate('fix-the-error-first', error.message)
      });

      return;
    }

    console.log('DataTypeEditor.handleBtnSaveClick');
    Event.fire(
      this.state.dataTypeId > 0 ? Event.SX_SAVE_DATATYPE : Event.SX_ADD_DATATYPE,
      this.namespace,
      this.workbenchNamespace,
      {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeId: this.state.dataTypeId,
        dataTypeCode: this.dataTypeCode.getValue(),
        dataTypeVersion: this.dataTypeVersion.getValue(),
        extension: this.extension.getValue(),
        displayName: JSON.stringify(this.displayName.getValue()),
        description: JSON.stringify(this.description.getValue()),
        dataStructureId: this.hasStructure ? 0 : this.dataStructure.getValue()[0]
      }
    );
  };

  handleBtnNewDataStructure = () => {
    this.redirectTo({
      portletName: PortletKeys.DATASTRUCTURE_BUILDER,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeId: this.state.dataTypeId
      }
    });
  };

  handleDeleteDataTypeBtnClick = (event) => {
    event.stopPropagation();

    this.setState({
      deleteWarningDialog: true,
      dialogHeader: SXModalUtil.warningDlgHeader(this.spritemap),
      dialogBody: Util.translate('this-is-not-recoverable-are-you-sure-delete-the-datatype')
    });
  };

  handleUpdateStructure = (event) => {
    event.stopPropagation();

    this.redirectTo({
      portletName: PortletKeys.DATASTRUCTURE_BUILDER,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId,
        dataTypeId: this.state.dataTypeId
      }
    });
  };

  render() {
    if (this.state.loadingStatus == LoadingStatus.PENDING) {
      return <h1>Loading......</h1>;
    } else if (this.state.loadingStatus == LoadingStatus.FAIL) {
      return <h1>Data Loading Failed......</h1>;
    } else if (this.state.loadingStatus == LoadingStatus.COMPLETE) {
      //console.log("[DataTypeEditor Render] ", this.hasStructure);
      return (
        <>
          <div
            className="autofit-float-end-sm-down autofit-padded-no-gutters-x autofit-row"
            style={{ borderBottom: '3px solid #e7e7ed', marginBottom: '1.5rem' }}
          >
            <div className="autofit-col autofit-col-expand">
              <Text size={6} weight="bold">
                {this.state.dataTypeId > 0 ? Util.translate('edit-datatype') : Util.translate('add-datatype')}
              </Text>
            </div>
          </div>
          {this.state.dataTypeId > 0 && (
            <SXLabeledText
              label={Util.translate('datatype-id')}
              text={this.state.dataTypeId}
              align="left"
              viewType="INLINE_ATTACH"
              style={{ marginBottom: '1rem' }}
            />
          )}
          {this.groupParameter.renderField({ spritemap: this.spritemap })}
          {this.description.renderField({ spritemap: this.spritemap })}
          {!this.hasStructure && this.dataStructure.renderField({ spritemap: this.spritemap })}
          {/*!this.hasStructure && (
						<div
							className="autofit-float-end-sm-down autofit-padded-no-gutters-x autofit-row"
							style={{ borderBottom: "3px solid #e7e7ed", marginBottom: "1.5rem" }}
						>
							<div className="autofit-col autofit-col-expand">
								{this.dataStructure.renderField({ spritemap: this.spritemap })}
							</div>
							{this.state.dataTypeId > 0 && (
								<div className="autofit-col">
									<SXButtonWithIcon
										label={Util.translate("new-datastructure")}
										symbol={"plus"}
										onClick={this.handleBtnNewDataStructure}
										spritemap={this.spritemap}
									/>
								</div>
							)}
						</div>
					)*/}
          <div style={{ width: '100%', marginTop: '1.5rem', display: 'inline-flex', justifyContent: 'center' }}>
            <Button.Group spaced>
              <SXButtonWithIcon
                label={Util.translate('save')}
                symbol={'disk'}
                disabled={!this.isDirty() || this.checkFieldError()}
                onClick={this.handleBtnSaveClick}
                spritemap={this.spritemap}
              />
              {this.state.dataTypeId > 0 && (
                <>
                  <SXButtonWithIcon
                    label={Util.translate('edit-datastructure')}
                    symbol={'forms'}
                    displayType="secondary"
                    onClick={this.handleUpdateStructure}
                    spritemap={this.spritemap}
                  />
                  <SXButtonWithIcon
                    label={Util.translate('delete')}
                    symbol={'trash'}
                    displayType="warning"
                    onClick={this.handleDeleteDataTypeBtnClick}
                    spritemap={this.spritemap}
                  />
                </>
              )}
            </Button.Group>
          </div>

          {this.state.infoDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('ok'),
                  onClick: () => {
                    this.setState({ infoDialog: false });
                  }
                }
              ]}
            />
          )}
          {this.state.deleteWarningDialog && (
            <SXModalDialog
              header={this.state.dialogHeader}
              body={this.state.dialogBody}
              buttons={[
                {
                  label: Util.translate('confirm'),
                  onClick: (e) => {
                    this.deleteDataType();
                    this.setState({ deleteWarningDialog: false });
                  },
                  displayType: 'secondary'
                },
                {
                  label: Util.translate('cancel'),
                  onClick: (e) => {
                    this.setState({ deleteWarningDialog: false });
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

export default DataTypeEditor;
