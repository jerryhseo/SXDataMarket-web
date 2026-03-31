import React from 'react';
import { Util } from '../../stationx/util';
import { Constant, ErrorClass, ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import GroupParameter from './group-parameter';
import SXGrid from '../Form/grid';

export default class GridParameter extends GroupParameter {
  #rowCount = 0;

  error = {};

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.GRID;
  }

  /**********************************************************
   * Getters and Setters
   **********************************************************/

  get columns() {
    return this.members;
  }
  get firstColumn() {
    return this.columns.length > 0 ? this.columns[0] : null;
  }
  get lastColumn() {
    return this.columns.length > 0 ? this.columns[this.columns.length - 1] : null;
  }
  get rowCount() {
    return this.#rowCount;
  }
  get columnCount() {
    return this.members.length;
  }

  get abstract() {
    return '';
  }

  set columns(val) {
    this.members = val;
  }
  set rowCount(val) {
    this.#rowCount = val;
  }

  initValue(cellIndex) {
    this.columns.forEach((column) => column.initValue(cellIndex));
  }

  addMember(member) {
    member.parent = this;

    member.order = this.members.length + 1;

    //member.initValue();
    this.members.push(member);

    this.setDirty(true);
  }

  insertColumn(column, order) {
    this.insertMember(column, order);
  }

  isColumn(colCode, colVersion) {
    return this.isMember(colCode, colVersion);
  }

  removeColumn({ colCode, colVersion = ParameterConstants.DEFAULT_VERSION, colOrder, parameter }) {
    return this.removeMember({ paramCode: colCode, paramVersion: colVersion, memOrder: colOrder, parameter });
  }

  /**
   * Deletes a column from the grid.
   *
   * @param {integer} colIndex: 1 to column count
   */
  deleteColumn(colIndex) {
    this.removeMember({ memOrder: colIndex });
  }

  findColumn({ colCode, colVersion = ParameterConstants.DEFAULT_VERSION }) {
    let found = null;

    this.columns.every((column) => {
      if (column.equalTo(colCode, colVersion)) {
        found = column;
      }

      return found ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
    });

    return found;
  }

  moveColumnLeft(colOrder) {
    this.moveMemberUp(colOrder);
  }

  moveColumnRight(colOrder) {
    this.moveMemberDown(colOrder);
  }

  insertRow(rowIndex) {
    this.columns.forEach((column) => {
      column.value.splice(rowIndex, 0, null);
      column.initValue(rowIndex);
    });

    this.rowCount++;

    this.setDirty(true);
  }

  copyRow(rowIndex) {
    const copyedIndex = rowIndex + 1;

    this.columns.forEach((column) => {
      column.value.splice(copyedIndex, 0, null);

      column.setValue({ value: column.getValue(rowIndex), cellIndex: copyedIndex });
      column.refreshKey();
    });

    this.rowCount++;

    this.setDirty(true);
  }

  deleteRow(rowIndex) {
    if (this.rowCount == 1) {
      this.columns.forEach((column) => {
        column.initValue(0);
        column.refreshKey();
      });
    } else {
      this.columns.forEach((column) => {
        column.value.splice(rowIndex, 1);
        column.refreshKey();
      });
    }

    if (this.rowCount > 1) {
      this.rowCount--;
    }

    this.setDirty(true);
  }

  moveUpRow(rowIndex) {
    const prevIndex = rowIndex - 1;

    this.columns.forEach((column) => {
      const prevValue = column.getValue(prevIndex);
      const targetValue = column.getValue(rowIndex);

      column.setValue({ value: prevValue, cellIndex: rowIndex });
      column.setValue({ value: targetValue, cellIndex: prevIndex });

      column.refreshKey();
    });

    this.setDirty(true);
  }

  moveDownRow(rowIndex) {
    const nextIndex = rowIndex + 1;

    this.columns.forEach((column) => {
      const nextValue = column.getValue(nextIndex);
      const targetValue = column.getValue(rowIndex);

      column.setValue({ value: nextValue, cellIndex: rowIndex });
      column.setValue({ value: targetValue, cellIndex: nextIndex });

      column.refreshKey();
    });

    this.setDirty(true);
  }

  hasError() {
    if (this.errorClass == ErrorClass.ERROR) {
      return true;
    }

    let error = null;
    this.members.every((member) => {
      if (member.hasError()) {
        error = member.error;
      }

      return Util.isNotEmpty(error) ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
    });

    return error;
  }

  setTitleBarInfo(property, value) {
    super.setTitleBarInfo(property, value, false);
  }

  fireColumnSelected(colCode) {
    const colFound = this.columns.filter((column) => column.paramCode == colCode);

    if (colFound.length > 0) {
      colFound[0].fireParameterSelected(this.formId);
    }
  }

  parse(json = {}) {
    super.parse(json);

    //json.members = Util.isEmpty(json.members) ? (Util.isEmpty(json.columns) ? [] : json.columns) : json.members;

    //super.superParse(json);

    this.rowCount = json.rowCount ?? 0;

    /*
    if (Util.isNotEmpty(members)) {
      this.columns = members.map((member) => {
        return ParameterUtil.createParameter({
          namespace: this.namespace,
          formId: this.componentId,
          paramType: member.paramType,
          properties: member
        });
      });
    }
      */

    if (this.rowCount == 0) {
      this.initValue(0);
      this.rowCount++;
    }
  }

  toJSON() {
    let json = super.toJSON();
    //let json = super.superToJSON();

    json.rowCount = this.rowCount;

    /*
    json.members = [];
    this.columns.forEach((column) => json.members.push(column.toJSON()));
    */

    return json;
  }

  toProperties() {
    let json = super.toProperties();
    //let json = super.superToProperties();

    json.rowCount = this.rowCount;

    /*
    json.members = this.columns.map((column) => {
      return column.toProperties();
    });
    */

    return json;
  }

  render({
    events = {},
    className = '',
    style = {},
    spritemap,
    displayType = this.displayType,
    viewType = this.viewType,
    preview = false,
    cellIndex
  }) {
    return (
      this.active && (
        <SXGrid
          key={this.key}
          parameter={this}
          events={events}
          className={className}
          style={style}
          spritemap={spritemap}
          displayType={displayType}
          viewType={viewType}
          cellIndex={cellIndex}
          preview={preview}
        />
      )
    );
  }
}
