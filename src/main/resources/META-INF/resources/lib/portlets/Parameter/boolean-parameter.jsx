import React from 'react';
import { Util } from '../../stationx/util';
import { ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXBoolean from '../Form/boolean';
import SelectParameter from './select-parameter';

export default class BooleanParameter extends SelectParameter {
  static ViewTypes = {
    CHECKBOX: 'checkbox',
    TOGGLE: 'toggle',
    RADIO: 'radio',
    DROPDOWN: 'dropdown'
  };

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.BOOLEAN;
  }

  /**********************************************************
   * Getters and Setters
   **********************************************************/
  get trueOption() {
    return this.options[1];
  }
  get trueLabel() {
    return this.trueOption.label;
  }
  get falseOption() {
    return this.options[0];
  }
  get falseLabel() {
    return this.falseOption.label;
  }

  set trueOption(option) {
    this.options[1] = option;
  }
  set trueLabel(label) {
    this.trueOption.label = label;
  }
  set falseOption(option) {
    this.options[0] = option;
  }
  set falseLabel(label) {
    this.falseOption.label = label;
  }

  /**********************************************************
   * Property-related Methods
   **********************************************************/
  getTrueLabel(languageId) {
    const langId = languageId ?? this.languageId;

    return this.trueLabel[langId];
  }

  getFalseLabel(languageId) {
    const langId = languageId ?? this.languageId;

    return this.falseLabel[langId];
  }

  /**********************************************************
   * Value-related Methods
   **********************************************************/
  initValue(cellIndex) {
    let value = this.defaultValue;
    if (Util.isEmpty(value)) {
      if (!this.nullable) {
        const firstOptionVal = this.falseOption.value;
        if (Util.isNotEmpty(firstOptionVal)) {
          value = firstOptionVal;
        }
      }
    }

    this.setValue({ value: value, cellIndex: cellIndex });
  }

  /**********************************************************
   * Override Methods
   * All override methods should call the same method of the parent class
   * using super.methodName() at the very beginning to ensure proper functionality.
   **********************************************************/
  /**
   * @override
   * @param {JSON Object} json
   */
  parse(json) {
    super.parse(json);

    this.viewType = json.viewType ?? ParameterConstants.BooleanViewTypes.CHECKBOX;

    if (Util.isEmpty(this.options)) {
      const falseOption = {
        label: {},
        value: false
      };
      falseOption.label[this.languageId] = Util.translate('no');
      const trueOption = {
        label: {},
        value: true
      };
      trueOption.label[this.languageId] = Util.translate('yes');

      this.options = [falseOption, trueOption];
    } else {
      this.trueOption.value = true;
    }
  }

  /**
   * @override
   * @returns
   * Object for JSON.stringify, including properties to be serialized.
   */
  toJSON() {
    return super.toJSON();
  }

  /**
   * @override
   * @returns
   * Object for properties, including all necessary information for rendering and validation.
   */
  toProperties() {
    let properties = super.toProperties();

    properties.trueLabel = this.getTrueLabel(this.languageId);
    properties.falseLabel = this.getFalseLabel(this.languageId);

    properties.value = this.value ?? !!this.defaultValue;

    return properties;
  }

  render({
    events = {},
    className = '',
    style = {},
    spritemap,
    displayType = this.displayType,
    viewType = this.viewType,
    cellIndex
  }) {
    return (
      <SXBoolean
        key={this.key}
        parameter={this}
        events={events}
        className={className}
        style={style}
        spritemap={spritemap}
        displayType={displayType}
        viewType={viewType}
        cellIndex={cellIndex}
      />
    );
  }
}
