import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXNumeric from '../Form/numeric';

export default class NumericParameter extends Parameter {
  #decimalPlaces;
  #uncertainty;
  #isInteger;
  #unit;

  #prefix;
  #postfix;

  #min;
  #max;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.NUMERIC;
  }

  get uncertainty() {
    return this.#uncertainty;
  }
  get decimalPlaces() {
    return this.#decimalPlaces;
  }
  get isInteger() {
    return this.#isInteger;
  }
  get unit() {
    return this.#unit;
  }
  get valueUncertainty() {
    return this.value.uncertainty;
  }
  get valueValue() {
    return this.value.value;
  }
  get prefix() {
    return this.#prefix;
  }
  get postfix() {
    return this.#postfix;
  }
  get min() {
    return this.#min;
  }
  get max() {
    return this.#max;
  }

  set uncertainty(val) {
    this.#uncertainty = val;
  }
  set decimalPlaces(val) {
    this.#decimalPlaces = val;
  }
  set isInteger(val) {
    this.#isInteger = val;
  }
  set unit(val) {
    this.#unit = val;
  }
  set valueUncertainty(val) {
    this.value.uncertainty = val;
  }
  set valueValue(val) {
    this.value.value = val;
  }
  set prefix(val) {
    this.#prefix = val;
  }
  set postfix(val) {
    this.#postfix = val;
  }
  set min(val) {
    this.#min = val;
  }
  set max(val) {
    this.#max = val;
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? (this.uncertainty ? {} : ''), cellIndex: cellIndex });
  }

  clearValue(cellIndex) {
    this.initValue(cellIndex);
  }

  getValueUncertainty(cellIndex) {
    const value = this.getValue(cellIndex);

    return this.isGridCell() ? this.value[cellIndex].uncertainty : this.value.uncertainty;
  }

  getValueValue(cellIndex) {
    return this.isGridCell() ? this.value[cellIndex].value : this.value.value;
  }

  setValueUncertainty(value, cellIndex) {
    if (this.isGridCell()) {
      if (!this.value) {
        this.value = [];
      }

      if (!this.value[cellIndex]) {
        this.value[cellIndex] = {};
      }
      this.value[cellIndex].uncertainty = value;
    } else {
      if (!this.value) {
        this.value = {};
      }
      this.value.uncertainty = value;
    }

    this.validate(cellIndex);
  }

  setValueValue(value, cellIndex) {
    if (this.isGridCell()) {
      if (!this.value) {
        this.value = [];
      }

      if (!this.value[cellIndex]) {
        this.value[cellIndex] = {};
      }
      this.value[cellIndex].value = value;
    } else {
      if (!this.value) {
        this.value = {};
      }

      this.value.value = value;
    }

    this.validate(cellIndex);
  }

  hasValue(cellIndex) {
    if (!this.value) {
      return false;
    }

    let value = this.isGridCell() ? this.value[cellIndex] : this.value;
    if (Util.isEmpty(value)) {
      return false;
    }

    return value.uncertainty ? Util.isNotEmpty(value.value) : Util.isNotEmpty(value);
  }

  /*
      validate(cellIndex) {
          const valueObj = this.getValue(cellIndex);
          const value = this.uncertainty ? valueObj.value : valueObj;
          const uncertainty = this.uncertainty ? valueObj.uncertainty : 0;
  
          if (isNaN(value)) {
              this.error = {
                  message: Util.translate("only-numbers-allowed-for-this-field"),
                  errorClass: ErrorClass.ERROR
              };
  
              return;
          }
  
          super.validate(cellIndex);
      }
          */

  toNumber() {
    if (!this.hasValue()) {
      return;
    }

    if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
      return this.uncertainty
        ? this.value.map((val) => ({ value: Number(val.value), uncertainty: Number(val.uncertainty) }))
        : this.value.map((val) => Number(val));
    } else {
      return this.uncertainty
        ? { value: Number(this.valueValue), uncertainty: Number(this.valueUncertainty) }
        : Number(this.value);
    }
  }

  parse(json) {
    super.parse(json);

    this.uncertainty = json.uncertainty ?? false;
    this.isInteger = json.isInteger ?? false;
    this.decimalPlaces = json.decimalPlaces ?? (this.isInteger ? 0 : 1);
    this.unit = json.unit ?? '';
    this.prefix = json.prefix ?? {};
    this.postfix = json.postfix ?? {};
    this.min = json.min;
    this.max = json.max;
  }

  toJSON() {
    let json = super.toJSON();

    if (this.uncertainty == true) json.uncertainty = this.uncertainty;
    if (this.isInteger == true) json.isInteger = this.isInteger;
    if (this.decimalPlaces !== 2) json.decimalPlaces = this.decimalPlaces;
    if (this.unit) json.unit = this.unit;
    if (Util.isNotEmpty(this.prefix)) json.prefix = this.prefix;
    if (Util.isNotEmpty(this.postfix)) json.postfix = this.postfix;
    if (Util.isNotEmpty(this.min)) json.min = this.min;
    if (Util.isNotEmpty(this.max)) json.max = this.max;

    return json;
  }

  toProperties(tagId, tagName) {
    let json = super.toProperties();

    json.uncertainty = this.uncertainty;
    json.isInteger = this.isInteger;
    json.unit = this.unit;
    json.prefix = this.prefix;
    json.postfix = this.postfix;
    json.min = this.min;
    json.max = this.max;
    json.value = this.value ?? this.defaultValue;
    if (Util.isNotEmpty(this.decimalPlaces)) {
      json.decimalPlaces = this.decimalPlaces;
    }

    return json;
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
      <SXNumeric
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
