import React from 'react';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';
import { ErrorClass, Event, ParamType } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import { SXLabel } from '../Form/form';
import { Table, Head, Body, Cell, Row, Text } from '@clayui/core';
import Icon from '@clayui/icon';
import Button, { ClayButtonWithIcon } from '@clayui/button';
import { ParameterUtil } from '../Parameter/parameters';
import SXBasePropertiesPanelComponent from './base-properties-panel-component';
import SXActionDropdown from '../../stationx/dropdown';
import { ClayCheckbox, ClayToggle } from '@clayui/form';

class SXSelectOptionBuilder extends SXBasePropertiesPanelComponent {
  constructor(props) {
    super(props);

    //console.log('SXSelectOptionBuilder constructor: ', props);

    const attachedOption = this.workingParam.options?.length > 0;
    this.state = {
      attachedOption: attachedOption,
      fieldValidated: true,
      selectedOption: this.workingParam.options ? (this.workingParam?.options[0] ?? {}) : {},
      actionRefreshKey: Util.nowTime(),
      siblingsSelector: false,
      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>
    };

    this.componentId = this.namespace + 'SXSelectOptionBuilder';

    this.fieldOptionLabel = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'optionLabel',
        localized: true,
        displayName: Util.getTranslationObject(this.languageId, 'option-label'),
        placeholder: Util.getTranslationObject(this.languageId, 'option-label'),
        value: this.state.selectedOption?.label ?? {},
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          maxLength: {
            value: 32,
            message: Util.getTranslationObject(this.languageId, 'option-label-must-be-longer-than', 32),
            errorClass: ErrorClass.ERROR
          }
        }
      }
    });

    this.fieldOptionValue = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: 'optionValue',
        displayName: Util.getTranslationObject(this.languageId, 'option-value'),
        placeholder: Util.getTranslationObject(this.languageId, 'option-value'),
        value: this.state.selectedOption?.value ?? '',
        validation: {
          required: {
            value: true,
            message: Util.getTranslationObject(this.languageId, 'this-field-is-required'),
            errorClass: ErrorClass.ERROR
          },
          maxLength: {
            value: 16,
            message: Util.getTranslationObject(this.languageId, 'option-value-must-be-shorter-than', 16),
            errorClass: ErrorClass.ERROR
          }
        }
      }
    });
  }

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId, parameter } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
      /* console.log(
        '[SXSelectOptionBuilder.listenerFieldValueChanged] REJECTED: ',
        event.dataPacket,
        targetPortlet,
        targetFormId
      ); */
      return;
    }

    /*
    console.log(
      '[SXSelectOptionBuilder.listenerFieldValueChanged] ',
      parameter,
      parameter.getValue(),
      this.state.selectedOption
    );
    */

    switch (parameter.paramCode) {
      case 'optionLabel': {
        if (parameter.hasError()) {
          return;
        }

        this.state.selectedOption.label = parameter.getValue();

        break;
      }
      case 'optionValue': {
        const value = this.fieldOptionValue.getValue();

        const duplicated = this.workingParam.checkDuplicatedOptionValue(value);
        if (duplicated) {
          this.fieldOptionValue.setError(
            ErrorClass.ERROR,
            Util.translate('the-option-value-exists-already-try-another-value')
          );
          this.fieldOptionValue.fireRefresh();

          return;
        } else {
          if (this.fieldOptionValue.hasError()) {
            this.fieldOptionValue.clearError();
            this.fieldOptionValue.fireRefresh();
          }

          this.state.selectedOption.value = parameter.getValue();
        }

        break;
      }
    }

    const checked = this.checkFieldError();
    if (checked && this.workingParam.isRendered()) {
      this.rerenderWorkingParam();
    }

    this.setState({
      fieldValidated: checked
    });
  };

  listenerPopActionClicked = (event) => {
    const { targetPortlet, targetFormId, action, data } = event.dataPacket;

    if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
      //console.log('[SXSelectOptionBuilder.listenerPopActionClicked] REJECTED: ', targetPortlet, targetFormId);
      return;
    }

    //console.log('[SXSelectOptionBuilder.listenerPopActionClicked] ', action, data);

    const checked = this.checkFieldError();
    if (checked) {
      switch (action) {
        case 'copy': {
          this.copyOption(data);

          break;
        }
        case 'delete': {
          this.removeOption(data);

          break;
        }
        case 'up': {
          this.moveOptionUp(data);

          break;
        }
        case 'down': {
          this.moveOptionDown(data);

          break;
        }
      }
    }

    this.setState({ fieldValidated: checked });
  };

  componentDidMount() {
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.on(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
  }

  componentWillUnmount() {
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
    Event.off(Event.SX_POP_ACTION_CLICKED, this.listenerPopActionClicked);
  }

  rerenderWorkingParam() {
    if (this.workingParam.isGridCell()) {
      const gridParam = this.dataStructure.findParameter({
        paramCode: this.workingParam.parent.code,
        paramVersion: this.workingParam.parent.version,
        descendant: true
      });

      gridParam.fireRefresh();
    } else {
      this.workingParam.fireRefresh();
    }
  }

  handleNewOption = (event) => {
    event.stopPropagation();

    const checked = this.checkFieldError();
    if (checked) {
      this.fieldOptionLabel.setValue({ value: {} });
      this.fieldOptionLabel.dirty = false;
      this.fieldOptionLabel.refreshKey();
      this.fieldOptionValue.setValue({ value: '' });
      this.fieldOptionValue.dirty = false;
      this.fieldOptionValue.refreshKey();
    }

    this.setState({
      fieldValidated: checked,
      attachedOption: false,
      selectedOption: {}
    });
  };

  handleAddOption = (event) => {
    //console.log("handleAddOption: ", this.workingOption);
    event.stopPropagation();

    const checked = this.checkFieldError();
    if (checked) {
      this.workingParam.addOption(this.state.selectedOption);

      this.rerenderWorkingParam();
    }

    this.fieldOptionLabel.dirty = false;
    this.fieldOptionValue.dirty = false;

    this.setState({
      fieldValidated: checked,
      attachedOption: true,
      actionRefreshKey: Util.randomKey()
    });
  };

  copyOption = (index) => {
    const copied = this.workingParam.copyOption(index);
    this.setState({
      selectedOption: copied
    });

    this.fieldOptionLabel.setValue({ value: copied.label ?? {} });
    this.fieldOptionValue.setValue({ value: copied.value });
    //console.log("removeOption: ", this.fieldOptionLabel, this.fieldOptionValue);
    this.fieldOptionLabel.refreshKey();
    this.fieldOptionValue.refreshKey();

    this.rerenderWorkingParam();
  };

  moveOptionUp = (index) => {
    this.workingParam.moveOptionUp(index);

    this.forceUpdate();

    this.rerenderWorkingParam();
  };

  moveOptionDown = (index) => {
    this.workingParam.moveOptionDown(index);

    this.forceUpdate();

    this.rerenderWorkingParam();
  };

  removeOption = (index) => {
    const nextOption = this.workingParam.removeOption(index);

    this.setState({
      selectedOption: nextOption,
      attachedOption: Util.isEmpty(nextOption) ? false : true
    });

    this.fieldOptionLabel.setValue({ value: nextOption.label ?? {} });
    this.fieldOptionValue.setValue({ value: nextOption.value });
    this.fieldOptionLabel.refreshKey();
    this.fieldOptionValue.refreshKey();

    this.rerenderWorkingParam();
  };

  checkFieldError() {
    if (this.fieldOptionLabel.hasError()) {
      this.dataStructure.setError(this.fieldOptionLabel.errorClass, this.fieldOptionLabel.errorMessage);

      return false;
    }

    if (this.fieldOptionValue.hasError()) {
      this.dataStructure.setError(this.fieldOptionValue.errorClass, this.fieldOptionValue.errorMessage);
      return false;
    }

    let error = this.fieldOptionLabel.validate();
    if (error != 0) {
      this.dataStructure.setError(this.fieldOptionLabel.errorClass, this.fieldOptionLabel.errorMessage);
      return false;
    }

    error = this.fieldOptionValue.validate();
    if (error != 0) {
      this.dataStructure.setError(this.fieldOptionValue.errorClass, this.fieldOptionValue.errorMessage);
      return false;
    }

    this.dataStructure.clearError();

    return true;
  }

  openErrorDlg(message) {
    this.setState({
      infoDialog: true,
      dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
      dialogBody: message
    });
  }

  handleOptionSelected = (option) => {
    if (option === this.state.selectedOption) {
      return;
    }

    const checked = this.checkFieldError();
    if (checked) {
      //console.log("handleOptionSelected: ", option, this.selectedOption);

      this.fieldOptionLabel.setValue({ value: option.label });
      this.fieldOptionLabel.dirty = false;
      this.fieldOptionLabel.refreshKey();
      this.fieldOptionValue.setValue({ value: option.value });
      this.fieldOptionValue.dirty = false;
      this.fieldOptionValue.refreshKey();
    }

    this.setState({
      fieldValidated: checked,
      selectedOption: option
    });
  };

  handleSlaveSelectionChanged = (event, param) => {
    event.stopPropagation();

    const value = event.target.checked;

    const slaveSet = new Set(this.state.selectedOption.slaves ?? []);
    if (value) {
      slaveSet.add(param.paramCode);
    } else {
      slaveSet.delete(param.paramCode);
    }

    this.state.selectedOption.slaves = [...slaveSet];

    this.forceUpdate();
  };

  handleSetSlaveParameters = (event) => {
    event.stopPropagation();

    this.setState({
      siblingsSelector: true,
      dialogHeader: <Text>{Util.translate('choose-slave-parameters')}</Text>
    });
  };

  handleShowAllSlaves = (val) => {
    //console.log('handleShowAllSlaves: ', val);

    this.workingParam.showAnyway = val;
  };

  renderSlavesSelectorBody = () => {
    // Slaved param codes of the options of the working param to be disabled
    // except for the currently selected option.
    const paramSlavedCodes = this.workingParam.getAllOptionSlaves({
      exceptOption: this.state.selectedOption
    });

    // Slaved param codes of the currently selected option to check checkbox
    const optionSlavedCodes = this.state.selectedOption.slaves ?? [];

    const parentGroup = this.dataStructure.getParentGroup(this.workingParam);

    // All sibling codes to be displayed as checkbox
    const siblingParams = this.dataStructure.getSiblingParameters({
      group: parentGroup,
      parameter: this.workingParam
    });

    //Slaved sibling codes to be disabled
    const slavedSiblingCodes = this.dataStructure.getSlavedSiblingCodes({
      group: parentGroup,
      parameter: this.workingParam
    });

    const rows = Util.convertArrayToRows(siblingParams, 2);

    return (
      <div key={this.state.selectedOption.slaves} style={{ width: '400px' }}>
        <ClayToggle
          label={Util.translate('show-all-slaves-when-value-is-null')}
          onToggle={this.handleShowAllSlaves}
          symbol={{
            off: 'times',
            on: 'check'
          }}
          sizing="sm"
          toggled={this.workingParam.showAnyway}
          spritemap={this.spritemap}
        />
        <hr style={{ marginBottom: '1.5rem' }}></hr>
        {rows.map((row, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', bottomMargin: '1.0rem' }}>
            {row.map((sibling) => (
              <div key={sibling.paramCode} style={{ flex: '1' }}>
                <ClayCheckbox
                  aria-label={sibling.label}
                  checked={optionSlavedCodes.includes(sibling.paramCode)}
                  label={sibling.label}
                  disabled={
                    paramSlavedCodes.includes(sibling.paramCode) || slavedSiblingCodes.includes(sibling.paramCode)
                  }
                  onChange={(e) => {
                    this.handleSlaveSelectionChanged(e, sibling);
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  render() {
    /*
    console.log(
      'SXSelectOptionBuilder render: ',
      this.workingParam.options,
      this.state.attachedOption,
      this.state.selectedOption,
      this.checkFieldError()
    ); */

    return (
      <>
        <div className="sx-option-builder-title">{Util.translate('option-builder')}</div>
        <div className="sx-option-builder-label">
          <SXLabel
            label={Util.translate('options')}
            forHtml=""
            required={true}
            style={{
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
            spritemap={this.spritemap}
          />
        </div>
        <Table
          columnsVisibility={false}
          borderedColumns={false}
          size="sm"
          hover={false}
          striped={false}
          className="sx-option-table"
        >
          <Head
            items={[
              { id: 'label', name: Util.translate('label'), width: 'auto' },
              { id: 'value', name: Util.translate('value'), width: '6rem' },
              { id: 'actions', name: 'actions', width: '3.5rem' }
            ]}
          >
            {(column) => {
              if (column.id == 'actions') {
                return (
                  <Cell key={column.id} textValue="actions" textAlign="center" width={column.width}>
                    <Icon symbol="ellipsis-v" spritemap={this.spritemap} />
                  </Cell>
                );
              } else {
                return (
                  <Cell key={column.id} textAlign="center" width={column.width}>
                    {column.name}
                  </Cell>
                );
              }
            }}
          </Head>
          <Body items={this.workingParam.options} onItemsChange={(val) => console.log('onItemsChange: ', val)}>
            {(option, index) => {
              let actionItems = [
                {
                  id: 'copy', //
                  name: Util.translate('copy'),
                  symbol: 'copy'
                },
                {
                  id: 'delete', //
                  name: Util.translate('delete'),
                  symbol: 'times'
                },
                {
                  id: 'slaveParams', //
                  name: Util.translate('slave-parameters'),
                  symbol: 'add-row'
                }
              ];
              if (index > 0) {
                actionItems.push({
                  id: 'up',
                  name: Util.translate('moveUp'),
                  symbol: 'order-arrow-up'
                });
              }
              if (index < this.workingParam.options.length - 1) {
                actionItems.push({
                  id: 'down',
                  name: Util.translate('moveDown'),
                  symbol: 'order-arrow-down'
                });
              }

              const selected = option == this.state.selectedOption;
              const selectedColor = '#fae6ecff';
              return (
                <Row
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleOptionSelected(option, index);
                  }}
                >
                  <Cell textAlign="center">
                    <div style={{ backgroundColor: selected ? selectedColor : 'inherit' }}>
                      {option.label[this.languageId]}
                    </div>
                  </Cell>
                  <Cell textAlign="center">
                    <div style={{ backgroundColor: selected ? selectedColor : 'inherit' }}>{option.value}</div>
                  </Cell>
                  <Cell textAlign="center">
                    <div style={{ backgroundColor: selected ? selectedColor : 'inherit' }}>
                      <SXActionDropdown
                        key={index}
                        namespace={this.namespace}
                        formId={this.componentId}
                        actionItems={actionItems}
                        triggerType="icon"
                        dataKey={index}
                        symbol="ellipsis-v"
                        spritemap={this.spritemap}
                      />
                    </div>
                  </Cell>
                </Row>
              );
            }}
          </Body>
        </Table>
        <div className="autofit-float autofit-padded-no-gutters-x autofit-row">
          <div className="autofit-col autofit-col-expand">
            <div style={{ textAlign: 'center' }}>
              <ClayButtonWithIcon
                aria-label={Util.translate('add-option')}
                size="sm"
                symbol="caret-top"
                title={Util.translate('add-option')}
                disabled={
                  !(this.fieldOptionLabel.dirty && this.fieldOptionValue.dirty && this.state.fieldValidated) ||
                  this.state.attachedOption
                }
                displayType="secondary"
                onClick={this.handleAddOption}
                spritemap={this.spritemap}
              />
            </div>
          </div>
          <div className="autofit-col">
            <ClayButtonWithIcon
              aria-label={Util.translate('new-option')}
              size="sm"
              symbol="plus"
              title={Util.translate('new-option')}
              disabled={!this.state.attachedOption || !this.state.fieldValidated}
              onClick={this.handleNewOption}
              spritemap={this.spritemap}
              style={{ leftMargin: 'auto' }}
            />
          </div>
        </div>

        {this.fieldOptionLabel.renderField({
          spritemap: this.spritemap
        })}

        {this.fieldOptionValue.renderField({
          spritemap: this.spritemap
        })}
        <div style={{ display: 'block', textAlign: 'right' }}>
          <Button displayType="secondary" size="sm" onClick={this.handleSetSlaveParameters}>
            {Util.translate('set-slave-parameters')}
          </Button>
        </div>
        {this.state.siblingsSelector && (
          <SXModalDialog
            header={this.state.dialogHeader}
            body={this.renderSlavesSelectorBody()}
            buttons={[
              {
                onClick: () => {
                  this.setState({ siblingsSelector: false });
                },
                label: Util.translate('ok'),
                displayType: 'primary'
              }
            ]}
            status="info"
            spritemap={this.spritemap}
          />
        )}
        {this.state.infoDialog && (
          <SXModalDialog
            header={this.state.dialogHeader}
            body={this.state.dialogBody}
            buttons={[
              {
                onClick: () => {
                  this.setState({ infoDialog: false });
                },
                label: Util.translate('ok'),
                displayType: 'primary'
              }
            ]}
            status="info"
            spritemap={this.spritemap}
          />
        )}
      </>
    );
  }
}

export default SXSelectOptionBuilder;
