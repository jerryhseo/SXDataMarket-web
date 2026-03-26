import React from 'react';
import SXBasePropertiesPanelComponent from '../base-properties-panel-component.jsx';
import { ErrorClass, Event, ParamProperty, ParamType } from '../../../stationx/station-x';
import { Util } from '../../../stationx/util';
import DataStructure from '../data-structure';
import SXSelectOptionBuilder from '../select-option-builder';
import ParameterConstants from '../../Parameter/parameter-constants.jsx';
import { ParameterUtil } from '../../Parameter/parameters.jsx';

class SXSelectTypeOptionForm extends SXBasePropertiesPanelComponent {
  constructor(props) {
    super(props);

    this.componentId = this.workingParam.namespace + 'SXSelectTypeOptionForm';

    const viewTypes = [
      {
        label: Util.getTranslationObject(this.languageId, 'Dropdown'),
        value: ParameterConstants.SelectViewTypes.DROPDOWN
      },
      {
        label: Util.getTranslationObject(this.languageId, 'Radio'),
        value: ParameterConstants.SelectViewTypes.RADIO
      },
      {
        label: Util.getTranslationObject(this.languageId, 'Checkbox'),
        value: ParameterConstants.SelectViewTypes.CHECKBOX
      }
    ];

    if (this.workingParam.displayType !== ParameterConstants.DisplayTypes.GRID_CELL) {
      viewTypes.push({
        label: Util.getTranslationObject(this.languageId, 'Listbox'),
        value: ParameterConstants.SelectViewTypes.LISTBOX
      });
    }

    this.fields = {
      viewType: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.SELECT,
        properties: {
          paramCode: ParamProperty.VIEW_TYPE,
          viewType: ParameterConstants.SelectViewTypes.RADIO,
          options: viewTypes,
          optionsPerRow: 2,
          displayName: Util.getTranslationObject(this.languageId, 'view-type'),
          tooltip: Util.getTranslationObject(this.languageId, 'select-view-type-tooltip'),
          value: this.workingParam.viewType ?? ParameterConstants.SelectViewTypes.DROPDOWN,
          validation: {
            required: {
              value: true,
              message: Util.getTranslationObject(this.languageId, 'this-field-is-required')
            }
          }
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
          value: this.workingParam.nullable ?? false
        }
      }),
      optionsPerRow: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.NUMERIC,
        properties: {
          paramCode: ParamProperty.OPTIONS_PER_ROW,
          isInteger: true,
          displayName: Util.getTranslationObject(this.languageId, 'options-per-row'),
          tooltip: Util.getTranslationObject(this.languageId, 'options-per-row-tooltip'),
          defaultValue: 0,
          validation: {
            min: {
              value: 0,
              message: Util.getTranslationObject(this.languageId, 'options-per-row-must-be-larger-than-or-equal-to', 0),
              errorClass: ErrorClass.ERROR
            },
            max: {
              value: 10,
              message: Util.getTranslationObject(
                this.languageId,
                'options-per-row-must-be-smaller-than-or-equal-to',
                10
              ),
              errorClass: ErrorClass.ERROR
            }
          },
          value: this.workingParam.optionsPerRow
        }
      }),
      listboxSize: ParameterUtil.createParameter({
        namespace: this.namespace,
        formId: this.componentId,
        paramType: ParamType.NUMERIC,
        properties: {
          paramCode: ParamProperty.LISTBOX_SIZE,
          isInteger: true,
          displayName: Util.getTranslationObject(this.languageId, 'listbox-size'),
          tooltip: Util.getTranslationObject(this.languageId, 'listbox-size-tooltip'),
          validation: {
            min: {
              value: 2,
              boundary: true,
              message: Util.getTranslationObject(this.languageId, 'listbox-size-must-be-larger-than-or-equal-to', 2),
              errorClass: ErrorClass.ERROR
            },
            max: {
              value: 10,
              boundary: true,
              message: Util.getTranslationObject(this.languageId, 'listbox-size-must-be-smaller-than-or-equal-to', 10),
              errorClass: ErrorClass.ERROR
            }
          },
          value: this.workingParam.listboxSize ?? 5
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
              message: Util.getTranslationObject(this.languageId, 'placeholder-should-be-shorter-than', 16),
              errorClass: ErrorClass.ERROR
            }
          },
          value: this.workingParam.placeholder ?? {}
        }
      })
    };
  }

  displayOptionsPerRow() {
    return (
      this.workingParam.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX ||
      this.workingParam.viewType == ParameterConstants.BooleanViewTypes.RADIO
    );
  }

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId, parameter, cellIndex } = event.dataPacket;
    if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
      return;
    }

    /*
        console.log(
            "SXDSBuilderTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ",
            parameter,
            this.workingParam,
            this.fields[parameter.paramCode],
            this.fields[parameter.paramCode].getValue()
        );
        */
    if (parameter.hasError()) {
      this.dataStructure.setError(parameter.errorClass, parameter.errorMessage);
      return;
    }

    this.workingParam[parameter.paramCode] = this.fields[parameter.paramCode].getValue();

    switch (parameter.paramCode) {
      case 'viewType': {
        const viewType = parameter.getValue();

        const multiple =
          viewType === ParameterConstants.BooleanViewTypes.DROPDOWN ||
          viewType === ParameterConstants.BooleanViewTypes.RADIO
            ? false
            : true;

        this.workingParam.multiple = multiple;
        this.workingParam.initValue(cellIndex);

        this.forceUpdate();
        break;
      }
      case 'placeholder': {
        if (parameter.hasValue()) {
          this.workingParam.nullable = true;
        } else {
          this.workingParam.nullable = false;
        }

        this.workingParam.initValue(cellIndex);

        break;
      }
      case 'nullable': {
        this.workingParam.initValue(cellIndex);

        break;
      }
    }

    //this.workingParam.initValue();
    if (Util.isNotEmpty(this.checkError())) {
      return;
    }

    //this.forceUpdate();

    if (this.workingParam.isRendered()) {
      if (parameter.paramCode == 'viewType') {
        if (this.workingParam.multiple) {
          this.workingParam.setValue({ value: [] });
        } else {
          this.workingParam.setValue({ value: '' });
        }
      }

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
        this.workingParam.fireRefresh();
      }
    }
  };

  componentDidMount() {
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  componentWillUnmount() {
    Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
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

  render() {
    return (
      <>
        {this.fields.viewType.renderField({ spritemap: this.spritemap })}
        {this.workingParam.viewType === ParameterConstants.SelectViewTypes.RADIO &&
          this.fields.nullable.renderField({ spritemap: this.spritemap })}
        {this.displayOptionsPerRow() &&
          this.fields.optionsPerRow.renderField({
            spritemap: this.spritemap
          })}
        {(this.workingParam.viewType === ParameterConstants.SelectViewTypes.DROPDOWN ||
          this.workingParam.viewType === ParameterConstants.SelectViewTypes.LISTBOX) &&
          this.fields.placeholder.renderField({ spritemap: this.spritemap })}
        {this.workingParam.viewType === ParameterConstants.SelectViewTypes.LISTBOX &&
          this.fields.listboxSize.renderField({ spritemap: this.spritemap })}
        <SXSelectOptionBuilder
          namespace={this.namespace}
          formId={this.componentId}
          dataStructure={this.dataStructure}
          workingParam={this.workingParam}
          spritemap={this.spritemap}
        />
      </>
    );
  }
}

export default SXSelectTypeOptionForm;
