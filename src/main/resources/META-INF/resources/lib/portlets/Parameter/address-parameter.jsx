import React from 'react';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXAddress from '../Form/address';
import { Util } from '../../stationx/util';

export default class AddressParameter extends Parameter {
  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.ADDRESS;
  }

  getZipcode(cellIndex) {
    const value = this.getValue(cellIndex);

    return value?.zipcode ?? '';
  }
  getStreet(cellIndex) {
    const value = this.getValue(cellIndex);

    return value?.street ?? '';
  }
  getAddress(cellIndex) {
    const value = this.getValue(cellIndex);

    return value?.address ?? '';
  }

  setZipcode(val, cellIndex) {
    super.setValue({
      value: {
        zipcode: val,
        street: this.getStreet(cellIndex),
        address: this.getAddress(cellIndex)
      },
      cellIndex: cellIndex,
      validate: true
    });
  }
  setStreet(val, cellIndex) {
    super.setValue({
      value: {
        zipcode: this.getZipcode(cellIndex),
        street: val,
        address: this.getAddress(cellIndex)
      },
      cellIndex: cellIndex,
      validate: true
    });
  }
  setAddress(val, cellIndex) {
    super.setValue({
      value: {
        zipcode: this.getZipcode(cellIndex),
        street: this.getStreet(cellIndex),
        address: val
      },
      cellIndex: cellIndex,
      validate: true
    });
  }

  getFullAddress(cellIndex) {
    return this.getZipcode(cellIndex) + ', ' + this.getStreet(cellIndex) + ', ' + this.getAddress(cellIndex);
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

    this.viewType = json.viewType ?? ParameterConstants.AddressViewTypes.BLOCK;
    this.searched = [];
  }

  /**
   * @override
   * @returns
   * JSON Object for JSON.stringify
   */
  toJSON() {
    let json = super.toJSON();

    if (this.viewType !== ParameterConstants.AddressViewTypes.BLOCK) {
      json.viewType = this.viewType;
    }

    return json;
  }

  /**
   * @override
   * @returns
   */
  toProperties() {
    let properties = super.toProperties();
    properties.viewType = this.viewType;

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
      <SXAddress
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
