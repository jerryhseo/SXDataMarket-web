import React from 'react';
import { Util } from '../../stationx/util';
import { ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXDualListBox from '../Form/duallist';
import SelectParameter from './select-parameter';

export default class DualListParameter extends SelectParameter {
  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.DUALLIST;
  }

  /**********************************************************
   * Properties-related Methods
   **********************************************************/

  getLeftOptions(cellIndex) {
    const leftOptions = this.getValue(cellIndex) ?? [];

    return leftOptions.map((option) => ({
      key: option.value,
      label: option.label[this.languageId],
      value: option.value
    }));
  }

  getRightOptions(cellIndex) {
    const rightOptions = Util.isNotEmpty(this.options)
      ? this.options.filter((option) => this.notIncludedInValues(option.value, cellIndex))
      : [];

    return rightOptions.map((option) => ({
      key: option.value,
      label: option.label[this.languageId],
      value: option.value
    }));
  }

  getOptions() {
    return this.options.map((option) => ({
      key: option.value,
      label: option.label[this.languageId],
      value: option.value
    }));
  }

  /**********************************************************
   * Value-related Methods
   **********************************************************/

  addValue(val) {
    this.value.push(val);
  }

  removeValue(val) {
    if (!this.hasValue()) {
      return;
    }

    this.value = this.value.filter((elem) => elem.value !== val.value);
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

    this.viewType = json.viewType ?? ParameterConstants.DualListViewTypes.HORIZONTAL;
    this.options = json.options ?? [];
  }

  /**
   * @override
   * @returns
   * JSON Object for JSON.stringify
   */
  toJSON() {
    let json = super.toJSON();

    json.options = this.options;
    json.viewType = this.viewType;

    return json;
  }

  /**
   * @override
   * @returns
   */
  toProperties() {
    let json = super.toProperties();

    json.viewType = this.viewType;
    json.leftOptions = this.value;
    json.options = this.options;

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
      <SXDualListBox
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
