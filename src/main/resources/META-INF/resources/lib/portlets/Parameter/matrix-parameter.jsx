import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import SXMatrix from '../Form/matrix';

export default class MatrixParameter extends Parameter {
  #rowCount = 3;
  #colCount = 3;
  #delimiter = ' ';
  #bracket = '[]';

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.MATRIX;
  }

  get rowCount() {
    return this.#rowCount;
  }
  get colCount() {
    return this.#colCount;
  }
  get bracket() {
    return this.#bracket;
  }
  get delimiter() {
    return this.#delimiter;
  }

  set rowCount(val) {
    this.#rowCount = val;
  }
  set colCount(val) {
    this.#colCount = val;
  }
  set bracket(val) {
    this.#bracket = val;
  }
  set delimiter(val) {
    this.#delimiter = val;
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? [], cellIndex: cellIndex });
  }

  validate(cellIndex) {
    for (const validationType in this.validation) {
      switch (validationType) {
        case ValidationKeys.REQUIRED: {
          if (this.validation.required.value && !this.hasValue(cellIndex)) {
            this.error = {
              message: this.getValidationValue(validationType, 'message', this.languageId),
              errorClass: ErrorClass.ERROR
            };

            return;
          }

          break;
        }
        case ValidationKeys.CUSTOM: {
          this.error = this.validation.custom(this.getValue(cellIndex));

          if (this.hasError()) {
            return;
          }
        }
      }
    }

    this.error = {
      message: '',
      errorClass: ErrorClass.SUCCESS
    };
  }

  parse(json) {
    super.parse(json);

    this.rowCount = json.rowCount ?? 3;
    this.colCount = json.colCount ?? 3;
    this.bracket = json.bracket ?? '[]';
    this.delimiter = json.delimiter ?? ' ';
  }

  toJSON() {
    let json = super.toJSON();

    json.rowCount = this.rowCount;
    json.colCount = this.colCount;

    if (this.bracket !== '[]') json.bracket = this.bracket;
    if (this.delimiter != ' ') json.delimiter = this.delimiter;

    return json;
  }

  toProperties() {
    let properties = super.toProperties();

    properties.rowCount = this.rowCount;
    properties.colCount = this.colCount;
    properties.bracket = this.bracket ?? '[]';
    properties.delimiter = this.delimiter ?? ' ';

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
      <SXMatrix
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
