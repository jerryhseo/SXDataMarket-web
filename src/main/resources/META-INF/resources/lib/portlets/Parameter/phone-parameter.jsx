import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import SXPhone from '../Form/phone';

export default class PhoneParameter extends Parameter {
  #enableCountryNo;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.PHONE;
  }

  getCountryNo(cellIndex) {
    const value = this.getValue(cellIndex);
    return value?.countryNo;
  }
  getAreaNo(cellIndex) {
    const value = this.getValue(cellIndex);
    return value?.areaNo;
  }
  getStationNo(cellIndex) {
    const value = this.getValue(cellIndex);
    return value?.stationNo;
  }
  getPersonalNo(cellIndex) {
    const value = this.getValue(cellIndex);
    return value?.personalNo;
  }

  get enableCountryNo() {
    return this.#enableCountryNo;
  }

  getPhoneNo(cellIndex) {
    return (
      (this.enableCountryNo ? this.getCountryNo(cellIndex) : '') +
      ')' +
      this.getAreaNo(cellIndex) +
      '-' +
      this.getStationNo(cellIndex) +
      '-' +
      this.getPersonalNo(cellIndex)
    );
  }

  setCountryNo(val, cellIndex) {
    let value = this.getValue(cellIndex);

    value.countryNo = val;
  }
  setAreaNo(val, cellIndex) {
    let value = this.getValue(cellIndex);

    value.areaNo = val;
  }
  setStationNo(val, cellIndex) {
    let value = this.getValue(cellIndex);

    value.stationNo = val;
  }
  setPersonalNo(val, cellIndex) {
    let value = this.getValue(cellIndex);

    value.personalNo = val;
  }

  set enableCountryNo(val) {
    this.#enableCountryNo = val;
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
  }

  /**
   * @override
   * @param {JSON Object} json
   */
  parse(json = {}) {
    super.parse(json);

    this.enableCountryNo = json.enableCountryNo ?? '';
  }

  /**
   * @override
   * @returns
   * JSON Object for JSON.stringify
   */
  toJSON() {
    let json = super.toJSON();

    if (this.enableCountryNo) json.enableCountryNo = this.enableCountryNo;

    return json;
  }

  /**
   * @override
   * @returns
   */
  toProperties() {
    let properties = super.toProperties();

    properties.enableCountryNo = this.enableCountryNo;

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
      <SXPhone
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
