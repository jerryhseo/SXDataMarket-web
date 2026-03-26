import React from 'react';
import { ErrorClass, Event, ParamProperty, ParamType } from '../../../stationx/station-x';
import { Util } from '../../../stationx/util';
import DataStructure from '../data-structure';
import SXBasePropertiesPanelComponent from '../base-properties-panel-component.jsx';
import ParameterConstants from '../../Parameter/parameter-constants.jsx';
import { ParameterUtil } from '../../Parameter/parameters.jsx';
import Button from '@clayui/button';
import { SXModalDialog } from '../../../stationx/modal.jsx';
import { ClayCheckbox, ClayToggle } from '@clayui/form';
import { Text } from '@clayui/core';

class SXBooleanTypeOptionForm extends SXBasePropertiesPanelComponent {
  constructor(props) {
    super(props);

    this.componentId = this.namespace + 'booleanTypeOptionForm';

    this.state = {
      selectedOption: this.workingParam.trueOption,
      siblingsSelector: false,
      dialogHeader: <></>,
      dialogBody: <></>
    };

    this.fields = {
      viewType: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.SELECT,
        properties: {
          paramCode: ParamProperty.VIEW_TYPE,
          viewType: ParameterConstants.SelectViewTypes.RADIO,
          options: [
            {
              label: Util.getTranslationObject(this.languageId, 'Checkbox'),
              value: ParameterConstants.BooleanViewTypes.CHECKBOX
            },
            {
              label: Util.getTranslationObject(this.languageId, 'Toggle'),
              value: ParameterConstants.BooleanViewTypes.TOGGLE
            },
            {
              label: Util.getTranslationObject(this.languageId, 'Dropdown'),
              value: ParameterConstants.BooleanViewTypes.DROPDOWN
            },
            {
              label: Util.getTranslationObject(this.languageId, 'Radio'),
              value: ParameterConstants.BooleanViewTypes.RADIO
            }
          ],
          optionsPerRow: 2,
          displayName: Util.getTranslationObject(this.languageId, 'view-type'),
          tooltip: Util.getTranslationObject(this.languageId, 'select-view-type-tooltip'),
          value: this.workingParam.viewType ?? ParameterConstants.SelectViewTypes.CHECKBOX,
          validation: {
            required: {
              value: true,
              message: Util.getTranslationObject(this.languageId, 'this-field-is-required')
            }
          }
        }
      }),
      defaultValue: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.BOOLEAN,
        properties: {
          paramCode: ParamProperty.DEFAULT_VALUE,
          viewType: ParameterConstants.BooleanViewTypes.RADIO,
          displayName: Util.getTranslationObject(this.languageId, 'default-value'),
          tooltip: Util.getTranslationObject(this.languageId, 'default-value-tooltip'),
          defaultValue: this.workingParam.defaultValue ?? (this.workingParam.nullable ? null : false)
        }
      }),
      nullable: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.BOOLEAN,
        properties: {
          paramCode: ParamProperty.NULLABLE,
          viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
          displayName: Util.getTranslationObject(this.languageId, 'nullable'),
          tooltip: Util.getTranslationObject(this.languageId, 'nullable-tooltip'),
          defaultValue: this.workingParam.nullable ?? false
        }
      }),
      placeholder: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.STRING,
        properties: {
          paramCode: ParamProperty.PLACEHOLDER,
          displayName: Util.getTranslationObject(this.languageId, 'placeholder'),
          localized: true,
          tooltip: Util.getTranslationObject(this.languageId, 'placeholder-tooltip'),
          validation: {
            minLength: {
              value: 5,
              message: Util.getTranslationObject(this.languageId, 'placeholder-should-be-longer-than', 4),
              errorClass: ErrorClass.ERROR
            },
            maxLength: {
              value: 16,
              message: Util.getTranslationObject(this.languageId, 'placeholder-should-be-shorter-than', 17),
              errorClass: ErrorClass.ERROR
            }
          },
          defaultValue: this.workingParam.placeholder ?? {}
        }
      }),
      trueLabel: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.STRING,
        properties: {
          paramCode: ParamProperty.TRUE_LABEL,
          localized: true,
          displayName: Util.getTranslationObject(this.languageId, 'true-label'),
          placeholder: Util.getTranslationObject(this.languageId, 'label-for-true-option'),
          tooltip: Util.getTranslationObject(this.languageId, 'label-for-true-option-tooltip'),
          defaultValue: this.workingParam.trueLabel
        }
      }),

      falseLabel: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.STRING,
        properties: {
          paramCode: ParamProperty.FALSE_LABEL,
          localized: true,
          displayName: Util.getTranslationObject(this.languageId, 'false-label'),
          placeholder: Util.getTranslationObject(this.languageId, 'label-for-false-option'),
          tooltip: Util.getTranslationObject(this.languageId, 'label-for-false-option-tooltip'),
          defaultValue: this.workingParam.falseLabel
        }
      })
    };
  }

  listenerFieldValueChanged = (e) => {
    const { targetPortlet, targetFormId, parameter } = e.dataPacket;
    if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
      return;
    }

    /*
        console.log(
            "SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
            parameter,
            this.workingParam,
            this.fields[parameter.paramCode].getValue()
        );
        */
    if (parameter.hasError()) {
      this.dataStructure.setError(parameter.errorClass, parameter.errorMessage);
      return;
    }

    this.workingParam[parameter.paramCode] = this.fields[parameter.paramCode].getValue();

    if (parameter.paramCode == 'viewType') {
      this.forceUpdate();
    }

    if (Util.isNotEmpty(this.checkError())) {
      return;
    }

    if (this.workingParam.isRendered()) {
      if (this.workingParam.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
        this.workingParam.fireRefreshParent(true);

        /*
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.formId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
				*/
      } else {
        this.workingParam.fireRefreshPreview();
      }
    }
  };

  componentDidMount() {
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  componentWillUnmount() {
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  checkError() {
    const error = DataStructure.checkError(Object.values(this.fields));

    if (Util.isNotEmpty(error)) {
      this.dataStructure.setError(error.errorClass, error.errorMessage);
      return error;
    } else {
      this.dataStructure.clearError();
    }

    return error;
  }

  handleSlaveSelectionChanged = (event, param) => {
    event.stopPropagation();

    const value = event.target.checked;
    console.log('handleSlaveSelectionChanged: ', param, event.target.checked);

    const slaveSet = new Set(this.state.selectedOption.slaves ?? []);
    if (value) {
      slaveSet.add(param.paramCode);
    } else {
      slaveSet.delete(param.paramCode);
    }

    this.state.selectedOption.slaves = [...slaveSet];

    this.forceUpdate();
  };

  renderSlavesSelectorBody = () => {
    // Slaved param codes of the options of the working param to be disabled
    // except for the currently selected option.
    const paramSlavedCodes = this.workingParam.getAllOptionSlaves({
      exceptOption: this.state.selectedOption
    });
    console.log('paramSlavedCodes: ', paramSlavedCodes);

    // Slaved param codes of the currently selected option to check checkbox
    const optionSlavedCodes = this.state.selectedOption.slaves ?? [];
    console.log('optionSlavedCodes: ', optionSlavedCodes);

    const parentGroup = this.dataStructure.getParentGroup(this.workingParam);
    console.log('parentGroup: ', parentGroup);

    // All sibling codes to be displayed as checkbox
    const siblingParams = this.dataStructure.getSiblingParameters({
      group: parentGroup,
      parameter: this.workingParam
    });
    console.log('siblingParams: ', siblingParams);

    //Slaved sibling codes to be disabled
    const slavedSiblingCodes = this.dataStructure.getSlavedSiblingCodes({
      group: parentGroup,
      parameter: this.workingParam
    });
    console.log('slavedSiblingCodes: ', slavedSiblingCodes);

    const rows = Util.convertArrayToRows(siblingParams, 2);

    return (
      <div key={this.state.selectedOption.slaves} style={{ width: '400px' }}>
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

  handleSetSlaves = (event, value) => {
    event.stopPropagation();

    console.log('SXBooleanTypeOptionForm.handleSetSlaves: ', event, value);

    const selectedOption = value ? this.workingParam.trueOption : this.workingParam.falseOption;

    this.setState({
      selectedOption: selectedOption,
      siblingsSelector: true,
      dialogHeader: <Text>{Util.translate('choose-slave-parameters')}</Text>
    });
  };

  render() {
    return (
      <>
        {this.fields.viewType.renderField({ spritemap: this.spritemap })}
        {this.workingParam.viewType === ParameterConstants.BooleanViewTypes.RADIO &&
          this.fields.nullable.renderField({ spritemap: this.spritemap })}
        {this.fields.defaultValue.renderField({ spritemap: this.spritemap })}
        {this.workingParam.viewType === ParameterConstants.BooleanViewTypes.DROPDOWN &&
          this.fields.placeholder.renderField({ spritemap: this.spritemap })}
        {this.fields.trueLabel.renderField({ spritemap: this.spritemap })}
        <div style={{ display: 'block', textAlign: 'right' }}>
          <Button displayType="secondary" size="sm" onClick={(e) => this.handleSetSlaves(e, true)}>
            {Util.translate('set-slave-parameters')}
          </Button>
        </div>
        {this.fields.falseLabel.renderField({ spritemap: this.spritemap })}
        <div style={{ display: 'block', textAlign: 'right' }}>
          <Button displayType="secondary" size="sm" onClick={(e) => this.handleSetSlaves(e, false)}>
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
      </>
    );
  }
}

export default SXBooleanTypeOptionForm;
