import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { Event, ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXFile from '../Form/file';

export default class FileParameter extends Parameter {
  #multipleFiles = false;
  #fileManager = true;
  #accepts = '';

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.FILE;
  }

  get multipleFiles() {
    return this.#multipleFiles;
  }
  get fileManager() {
    return this.#fileManager;
  }
  get accepts() {
    return this.#accepts;
  }

  set multipleFiles(val) {
    this.#multipleFiles = val;
  }
  set fileManager(val) {
    this.#fileManager = val;
  }
  set accepts(val) {
    this.#accepts = val;
  }

  fireDownloadFile(fileInfo) {
    //console.log("Download file: ", fileInfo);
    Event.fire(Event.SX_DOWNLOAD_FIELD_ATTACHED_FILE, this.namespace, this.namespace, {
      targetFormId: this.formId,
      fileName: fileInfo.name,
      lastModified: fileInfo.lastModified,
      fileType: fileInfo.type,
      paramCode: this.paramCode,
      paramVersion: this.paramVersion
    });
  }

  initValue(cellIndex) {
    super.setValue({ value: this.defaultValue ?? (this.multipleFiles ? [] : {}), cellIndex: cellIndex });
  }

  toDataObject(fileItem) {
    return {
      name: fileItem.name,
      lastModified: fileItem.lastModified,
      type: fileItem.type
    };
  }

  getDataFiles() {
    let files = [];

    if (this.hasValue()) {
      if (this.displayType === ParameterConstants.DisplayTypes.GRID_CELL) {
        // It means the value is an Array of JSON Array
        this.value.forEach((value) => {
          files.push(...value.filter((item) => item.file).map((item) => this.toFileObject(item)));
        });
      } else {
        // It means the value is an Array of JSON object
        files = this.value.filter((item) => item.file).map((item) => this.toFileObject(item));
      }
    }

    return files;
  }

  /***************************************************************
   * Override Methods
   * All override methods should call the same method of the parent class
   * using super.methodName() at the very beginning to ensure proper functionality.
   ****************************************************************/

  /**
   * Constructs a files data object from the value.
   * @override
   * @returns
   * Object for being saved in database with all necessary information,
   * including the value and other related properties.
   */
  toData() {
    let data = super.toData();

    if (data) {
      let strucValue = data[this.paramCode];

      if (this.isGridCell()) {
        strucValue.value = this.value.map((value) => {
          return value.map((item) => this.toDataObject(item));
        });
      } else {
        strucValue.value = this.value.map((item) => this.toDataObject(item));
      }

      /*
              console.log(
                  "Parameter.toData() displayType: ",
                  this.paramCode,
                  this.displayType,
                  ParameterConstants.DisplayTypes.GRID_CELL,
                  this.displayType !== DisplayType.GRID_CELL
              );
              */
    }

    return data;
  }

  /**
   * Parses the JSON object and initializes the parameter properties.
   * @override
   * @param {*} json
   */
  parse(json = {}) {
    super.parse(json);

    this.multipleFiles = json.multipleFiles ?? true;
    this.fileManager = json.fileManager ?? true;

    this.accepts = json.accepts ?? '';
  }

  toJSON() {
    let json = super.toJSON();

    json.multipleFiles = this.multipleFiles;
    json.fileManager = this.fileManager;
    json.accepts = this.accepts;

    return json;
  }

  toProperties(tagId, tagName) {
    let properties = super.toProperties();
    properties.multipleFiles = this.multipleFiles;
    properties.fileManager = this.fileManager;
    properties.accepts = this.accepts;

    if (tagId) properties.tagId = tagId;
    if (tagName) properties.tagName = tagName;

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
      <SXFile
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
