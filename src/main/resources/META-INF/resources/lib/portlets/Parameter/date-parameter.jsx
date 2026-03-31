import React from 'react';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import SXDate from '../Form/date';
import { Util } from '../../stationx/util';

export default class DateParameter extends Parameter {
  #enableTime;
  #startYear;
  #endYear;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.DATE;
  }

  /**********************************************************
   * Getters and Setters
   **********************************************************/
  get enableTime() {
    return this.#enableTime;
  }
  get startYear() {
    return this.#startYear;
  }
  get endYear() {
    return this.#endYear;
  }

  set enableTime(val) {
    this.#enableTime = val;
  }
  set startYear(val) {
    this.#startYear = val;
  }
  set endYear(val) {
    this.#endYear = val;
  }

  /**********************************************************
   * Value-related Methods
   **********************************************************/
  getDate(cellIndex) {
    const value = super.getValue(cellIndex);

    return !!value ? new Date(value) : new Date();
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? '', cellIndex: cellIndex });
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

    this.enableTime = json.enableTime ?? false;
    this.startYear = json.startYear ?? '1970';
    this.endYear = json.endYear ?? new Date().getFullYear().toString();
  }

  /**
   * @override
   * @returns
   * Object for JSON.stringify, including properties to be serialized.
   */
  toJSON() {
    let json = super.toJSON();

    if (this.enableTime) json.enableTime = this.enableTime;

    json.startYear = this.startYear ?? '1970';
    json.endYear = this.endYear ?? new Date().getFullYear().toString();

    return json;
  }

  /**
   * @override
   * @returns
   * Object for properties, including all necessary information for rendering and validation.
   */
  toProperties() {
    let properties = super.toProperties();

    properties.enableTime = this.enableTime;

    properties.startYear = this.startYear;
    properties.endYear = this.endYear;

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
      <SXDate
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
