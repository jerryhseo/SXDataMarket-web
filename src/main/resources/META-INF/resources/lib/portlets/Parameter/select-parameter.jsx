import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXSelect from '../Form/select';

export default class SelectParameter extends Parameter {
  #options = [];
  #optionsPerRow = 0;
  #listboxSize = 3;
  #placeholder = '';
  #multiple = false;
  #nullable = false;
  #showAnyway = false;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace: namespace,
      formId: formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }

    this.paramType = ParamType.SELECT;
  }

  get options() {
    return this.#options;
  }
  get optionsPerRow() {
    return this.#optionsPerRow;
  }
  get listboxSize() {
    return this.#listboxSize;
  }
  get multiple() {
    return this.#multiple;
  }
  get placeholder() {
    return this.#placeholder;
  }

  get optionCount() {
    return this.#options.length;
  }

  get nullable() {
    return this.#nullable;
  }
  get showAnyway() {
    return this.#showAnyway;
  }

  set options(val) {
    this.#options = val;
  }
  set optionsPerRow(val) {
    this.#optionsPerRow = val;
  }
  set listboxSize(val) {
    this.#listboxSize = val;
  }
  set multiple(val) {
    this.#multiple = val;
  }
  set placeholder(val) {
    this.#placeholder = val;
  }
  set nullable(val) {
    this.#nullable = val;

    this.value = this.defaultValue ?? (this.displayType === ParameterConstants.DisplayTypes.GRID_CELL ? [] : '');
    if (Util.isEmpty(this.value)) {
      let initVal;

      if (this.nullable) {
        initVal = this.multiple ? [] : '';
      } else {
        const firstOptionVal = this.options[0]?.value;
        if (firstOptionVal) {
          initVal = this.multiple ? [firstOptionVal] : firstOptionVal;
        } else {
          initVal = this.multiple ? [] : '';
        }
      }

      if (Util.isNotEmpty(initVal)) {
        if (this.value instanceof Array) {
          this.value.push(initVal);
        } else {
          this.value = initVal;
        }
      }
    }
  }
  set showAnyway(val) {
    this.#showAnyway = val;
  }

  get isMultiple() {
    return (
      this.viewType == ParameterConstants.SelectViewTypes.CHECKBOX ||
      (this.viewType == ParameterConstants.SelectViewTypes.LISTBOX && this.multiple)
    );
  }

  getPlaceholder() {
    return Util.getTranslation(this.placeholder, this.languageId);
  }

  checkDuplicatedOptionValue(optionValue) {
    if (!this.options) {
      return true;
    }

    const duplicated = this.options.filter((option) => option.value === optionValue);

    return duplicated.length > 0;
  }

  addOption(option) {
    this.#options.push(option);

    return this.options.length;
  }

  getOption(index) {
    return this.options ? this.options[index] : {};
  }

  getOptionByValue(value) {
    const foundOptions = this.options.filter((option) => option.value === optionValue);

    //console.log("DualListParameter.getOptionByValue: ", value, foundOption);
    return foundOptions[0];
  }

  copyOption(index) {
    const insertPlace = index + 1;
    const option = this.getOption(index);

    const newOption = { label: { ...option.label }, value: option.value + '_' + (index + 1) };
    this.options = [...this.options.slice(0, insertPlace), newOption, ...this.options.slice(insertPlace)];

    return newOption;
  }

  removeOption(index) {
    this.#options.splice(index, 1);

    return this.#options.length > 0 && index > 0 ? this.#options[index - 1] : {};
  }

  switchOptions(index1, index2) {
    let elem1 = this.#options[index1];
    this.#options[index1] = this.#options[index2];
    this.#options[index2] = elem1;
  }

  moveOptionUp(index) {
    if (index == 0) {
      return 0;
    }

    this.switchOptions(index - 1, index);

    return index - 1;
  }

  moveOptionDown(index) {
    if (index >= this.options.length - 1) {
      return index;
    }

    this.switchOptions(index, index + 1);

    return index + 1;
  }

  clearSlaves() {
    this.options.forEach((option) => delete option.slaves);
  }

  fetchOption(optionValue) {
    const option = this.options.filter((option) => {
      console.log('SelectParameter.fetchOption: ', option.value, typeof option.value, optionValue, typeof optionValue);
      return option.value === optionValue;
    })[0];
    console.log('SelectParameter.fetchOption: ', optionValue, option);
    return option;
  }

  getOptionSlaves(optionValue) {
    const option = this.fetchOption(optionValue);

    return option?.slaves;
  }

  /**
   * Remove the slave code from all options' slaves list
   * @param {*} salveCode
   */
  removeOptionSlave(salveCode) {
    this.options.forEach((option) => {
      if (option.slaves) {
        option.slaves = option.slaves.filter((slave) => slave !== salveCode);
      }
    });
  }

  getAllOptionSlavesExcept(exceptOption) {
    let slaveSet = new Set([]);

    const options = this.#options?.filter((option) => option !== exceptOption);
    options.forEach((option) => {
      const optionSlaves = option.slaves ?? [];
      slaveSet = new Set([...slaveSet, ...optionSlaves]);
    });

    return [...slaveSet];
  }

  initValue(cellIndex) {
    let value = this.defaultValue ?? (this.multiple ? [] : '');
    if (Util.isEmpty(value)) {
      if (!this.nullable) {
        const firstOptionVal = this.options[0]?.value;
        if (Util.isNotEmpty(firstOptionVal)) {
          value = this.multiple ? [firstOptionVal] : firstOptionVal;
        }
      }
    }

    super.setValue({ value: value, cellIndex: cellIndex });
  }

  /**
   * @override
   * @param {JSON Object} json
   */
  parse(json) {
    super.parse(json);

    this.options = json.options ?? [];
    this.viewType = json.viewType ?? ParameterConstants.SelectViewTypes.DROPDOWN;
    this.optionsPerRow = json.optionsPerRow ?? 0;
    this.listboxSize = json.listboxSize ?? this.#listboxSize;
    this.multiple = json.multiple ?? true;
    this.placeholder = json.placeholder;
    this.nullable = json.nullable ?? (Util.isEmpty(json.placeholder) ? false : true);
    this.showAnyway = json.showAnyway ?? false;
  }

  /**
   * @override
   * @returns
   * JSON Object for JSON.stringify
   */
  toJSON() {
    let json = super.toJSON();

    json.viewType = this.viewType;
    if (Util.isNotEmpty(this.options)) json.options = this.options;

    if (this.optionsPerRow > 0) {
      json.optionsPerRow = this.optionsPerRow;
    }

    if (this.listboxSize != 5) {
      json.listboxSize = this.listboxSize;
    }

    if (!this.multiple) {
      json.multiple = false;
    }

    if (this.nullable) {
      json.nullable = this.nullable;
    }

    if (this.showAnyway) {
      json.showAnyway = this.showAnyway;
    }

    if (Util.isNotEmpty(this.placeholder)) {
      json.placeholder = this.placeholder;
    }

    return json;
  }

  /**
   * @override
   * @returns
   */
  toProperties() {
    let json = super.toProperties();

    json.viewType = this.viewType;
    json.options = this.options.map((option) => ({ label: option.label[this.languageId], value: option.value }));
    json.optionsPerRow = this.optionsPerRow;
    json.listboxSize = this.listboxSize;
    json.multiple = this.multiple;
    json.placeholder = this.placeholder;
    json.nullable = this.nullable;
    json.showAnyway = this.showAnyway;

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
      <SXSelect
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
