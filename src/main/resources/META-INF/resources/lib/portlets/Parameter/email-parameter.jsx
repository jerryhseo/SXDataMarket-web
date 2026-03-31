import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import SXEMail from '../Form/email';

export default class EMailParameter extends Parameter {
  constructor({ namespace, formId, paramType = ParamType.EMAIL, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.EMAIL;
  }

  /**********************************************************
   * Value-related Methods
   **********************************************************/
  getEmailId(cellIndex) {
    const value = super.getValue(cellIndex);

    if (Util.isEmpty(value)) {
      return '';
    } else {
      return value.emailId;
    }
  }

  getServerName(cellIndex) {
    const value = super.getValue(cellIndex);

    if (Util.isEmpty(value)) {
      return '';
    } else {
      return value.serverName;
    }
  }

  setEmailId(value, cellIndex) {
    const serverName = this.getServerName(cellIndex);
    super.setValue({ value: { emailId: value, serverName: serverName }, cellIndex: cellIndex, validate: true });
  }
  setServerName(value, cellIndex) {
    const emailId = this.getEmailId(cellIndex);
    super.setValue({ value: { emailId: emailId, serverName: value }, cellIndex: cellIndex, validate: true });
  }

  getEmailAddress(cellIndex) {
    const value = super.getValue(cellIndex);
    if (Util.isEmpty(value)) {
      return '';
    } else {
      return value.emailId + '@' + value.serverName;
    }
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
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
  }

  /**
   * @override
   */
  toString() {
    return this.value.emailId + '@' + this.value.serverName;
  }

  /**
   * @override
   * @returns
   * JSON Object for JSON.stringify
   */
  toJSON() {
    return super.toJSON();
  }

  /**
   * @override
   * @returns
   */
  toProperties() {
    let properties = super.toProperties();

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
      <SXEMail
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
