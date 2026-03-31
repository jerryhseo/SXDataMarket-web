import React from 'react';
import { Constant, ParamType, ValidationKeys, ErrorClass, Event, DisplayType } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import SXFormField, { SXFormFieldFeedback, SXRequiredMark, SXTitleBar, SXTooltip } from '../Form/form';
import { ClayInput } from '@clayui/form';
import SXPreviewRow from '../Form/preview-row';
import ParameterConstants from './parameter-constants';

import SXCommentDisplayer from '../../stationx/comment';
import { createParameter } from '../DataStructure/datastructure-builder';

export default class Parameter {
  #paramId = 0;
  #paramType;
  #paramCode = '';
  #paramVersion = ParameterConstants.DEFAULT_VERSION;
  #displayName = {};
  #displayType = ParameterConstants.DisplayTypes.FORM_FIELD;
  #disabled = false;
  #viewType;
  #abstractKey = false;
  #searchable = true;
  #downloadable = true;
  #synonyms = '';
  #definition = {};
  #showDefinition = false;
  #tooltip = {};
  #order = 0;
  #defaultValue = null;
  #standard = false;
  #status = Constant.Status.PENDING;
  #state = Constant.State.ACTIVE;
  #referenceFile = {};
  #position = Constant.Position.MIDDLE;
  #active = true;
  #prefix;
  #postfix;

  #commentable = false;
  #verifiable = false;
  #freezable = false;

  /*
  Under Construction.

  junctions are used to store the juction which is consisted of 
  {value or range, codes of the slave parameters}.
  */
  #junctions = [];

  #validation = {};
  #style = {};

  #value;
  dataId = 0;

  /**
   * volatile variables from here
   */
  key = Util.randomKey();
  namespace;
  formId;
  languageId = SXSystem.getLanguageId();
  defaultLanguageId = SXSystem.getDefaultLanguageId();
  availableLanguageIds = SXSystem.getAvailableLanguages();
  dirty = false;
  focused = false;
  error = {};

  companyId = 0;
  groupId = 0;
  userid = 0;
  createDate = null;
  modifedDate = null;

  inputStatus = false;
  bulletNo = false;
  itemNo = '';
  comments = [];

  parent = null;
  /*
	comments = [
		{
			id: "1",
			userId: 12345,
			userName: "user 01",
			comment: "comment 1",
			parentId: 0,
			date: "11/15/2025, 4:01:00 PM",
			replies: [
				{
					id: "1-1",
					userId: 23456,
					userName: "user 2",
					comment: "reply to comment 1",
					parentId: "1",
					date: "11/16/2025, 6:01:00 AM",
					replies: [
						{
							id: "1-1-1",
							userId: 12345,
							userName: "user 01",
							comment: "reply to comment 1-1",
							date: "11/16/2025, 1:01:00 PM",
							parentId: "1"
						},
						{
							id: "1-1-2",
							userId: 34567,
							userName: "user 03",
							comment: "another reply to comment 1-1",
							date: "11/16/2025, 2:01:00 PM",
							parentId: "1"
						}
					]
				},
				{
					id: "1-2",
					userId: 45678,
					userName: "user 04",
					comment: "another reply to comment 1",
					date: "11/17/2025, 4:01:00 PM",
					parentId: "1"
				}
			]
		},
		{
			id: "2",
			userId: 56789,
			userName: "user 05",
			comment: "comment 2",
			parentId: 0,
			date: "11/16/2025, 6:01:00 PM",
			replies: [
				{
					id: "2-1",
					userId: 12345,
					userName: "user 01",
					comment: "reply to comment 2",
					parentId: "2",
					date: "11/16/2025, 8:01:00 PM",
					replies: [
						{
							id: "2-1-1",
							userId: 56789,
							userName: "user 05",
							comment: "reply to comment 2-1",
							date: "11/17/2025, 9:01:00 AM",
							parentId: "2-1"
						},
						{
							id: "2-1-2",
							userId: 12345,
							userName: "user 01",
							comment: "another reply to comment 2-1",
							date: "11/17/2025, 11:01:00 AM",
							parentId: "2-1"
						}
					]
				},
				{
					id: "2-2",
					userId: 45678,
					userName: "user 04",
					comment: "another reply to comment 2",
					date: "11/17/2025, 10:01:00 AM",
					parentId: "2"
				}
			]
		}
	];
	*/
  commentFreezed = {};
  historyItems = [];
  /*
	historyItems = [
		{
			actionHistoryId: 123456,
			createDate: "11/17/2025, 10:01:00 AM",
			userid: 543678,
			userName: "Jane Doe",
			actionModel: "Parameter",
			dataId: 234567,
			paramCode: "paramCode",
			actionCommand: "update",
			prevValue: "prevValue",
			modifiedValue: "modifiedValue",
			comment: "This is modified"
		}
	];
	*/
  freezed = {};
  verified = {};

  activeActionItems = false;
  /* End of volatile variable */

  constructor({ namespace, formId }) {
    this.namespace = namespace;
    this.formId = formId;
  }

  /**********************************************************
   * Getters and Setters
   **********************************************************/

  get paramId() {
    return this.#paramId;
  }
  get paramType() {
    return this.#paramType;
  }
  get paramCode() {
    return this.#paramCode;
  }
  get paramVersion() {
    return this.#paramVersion;
  }
  get displayName() {
    return this.#displayName;
  }
  get viewType() {
    return this.#viewType;
  }
  get abstractKey() {
    return this.#abstractKey;
  }
  get searchable() {
    return this.#searchable;
  }
  get downloadable() {
    return this.#downloadable;
  }
  get synonyms() {
    return this.#synonyms;
  }
  get required() {
    return (
      Util.isNotEmpty(this.validation) && Util.isNotEmpty(this.validation.required) && this.validation.required.value
    );
  }
  get requiredMessege() {
    if (Util.isNotEmpty(this.validation) && Util.isNotEmpty(this.validation.required)) {
      return this.validation.required.message ? this.validation.required.message : '';
    } else {
      return '';
    }
  }
  get disabled() {
    return this.#disabled;
  }
  get definition() {
    return this.#definition;
  }
  get showDefinition() {
    return this.#showDefinition;
  }
  get tooltip() {
    return this.#tooltip;
  }
  get order() {
    return this.#order;
  }
  get defaultValue() {
    return this.#defaultValue;
  }
  get standard() {
    return this.#standard;
  }
  get status() {
    return this.#status;
  }
  get state() {
    return this.#state;
  }
  get validation() {
    return this.#validation;
  }
  get validationRequired() {
    return !!this.validation.required;
  }
  get validationPattern() {
    return !!this.validation.pattern;
  }
  get validationMinLength() {
    return !!this.validation.minLength;
  }
  get validationMaxLength() {
    return !!this.validation.maxLength;
  }
  get validationMin() {
    return !!this.validation.min;
  }
  get validationMax() {
    return !!this.validation.max;
  }
  get validationNormalMin() {
    return !!this.validation.normalMin;
  }
  get validationNormalMax() {
    return !!this.validation.normalMax;
  }
  get validationCustom() {
    return !!this.validation.custom;
  }
  get active() {
    return this.#active;
  }
  get value() {
    return this.#value;
  }
  get displayType() {
    return this.#displayType;
  }
  get errorCellIndex() {
    return this.error.cellIndex;
  }
  get errorMessage() {
    return this.error.message ?? '';
  }
  get errorClass() {
    return this.error.errorClass ?? '';
  }
  get referenceFile() {
    return this.#referenceFile;
  }
  get junctions() {
    return this.#junctions;
  }
  get prefix() {
    return this.#prefix;
  }
  get postfix() {
    return this.#postfix;
  }

  get title() {
    const locales = Object.keys(this.displayName);
    let title = {};
    locales.forEach((locale) => {
      title[locale] = this.displayName[locale] + ' v.' + this.paramVersion;
    });

    return title;
  }
  get localizedTitle() {
    const title = this.displayName[this.languageId];
    return title ? '' : title + ' v.' + this.paramVersion;
  }

  get componentId() {
    return this.namespace + this.paramCode + '_' + this.paramVersion;
  }
  get tagId() {
    return this.namespace + this.paramCode + '_' + this.paramVersion;
  }
  get tagName() {
    return this.namespace + this.paramCode;
  }
  get style() {
    return this.#style;
  }
  get cssWidth() {
    if (this.style) {
      return this.style.width;
    }
  }
  get position() {
    return this.#position;
  }
  get commentable() {
    return this.#commentable;
  }
  get verifiable() {
    return this.#verifiable;
  }
  get freezable() {
    return this.#freezable;
  }

  get totalFieldsCount() {
    return 1;
  }
  get valuedFieldsCount() {
    return this.hasValue() ? 1 : 0;
  }

  get abstract() {
    if (this.abstractKey && this.hasValue()) {
      return this.paramCode + ': ' + JSON.stringify(this.value);
    }

    return '';
  }
  get label() {
    let translation = this.displayName[this.languageId] ?? this.displayName[this.defaultLanguageId];

    if (Util.isEmpty(translation)) {
      for (const lanId in this.displayName) {
        translation = this.displayName[lanId];

        if (Util.isNotEmpty(translation)) {
          break;
        }
      }
    }
    return translation;
  }

  get isGroup() {
    return this.paramType == ParamType.GROUP;
  }

  get isGrid() {
    return this.paramType == ParamType.GRID;
  }

  get isCollection() {
    return this.paramType == ParamType.GROUP || this.paramType == ParamType.GRID;
  }

  get isJunction() {
    return this.paramType === ParamType.SELECT || this.paramType === ParamType.BOOLEAN || this.junctions?.length > 0;
  }

  get rendered() {
    return this.order > 0;
  }

  set paramId(val) {
    this.#paramId = val;
  }

  set paramType(val) {
    this.#paramType = val;
  }
  set paramCode(val) {
    this.#paramCode = val;
  }
  set paramVersion(val) {
    this.#paramVersion = val;
  }
  set displayName(val) {
    this.#displayName = val;
  }
  set viewType(val) {
    this.#viewType = val;
  }
  set abstractKey(val) {
    this.#abstractKey = val;
  }
  set searchable(val) {
    this.#searchable = val;
  }
  set downloadable(val) {
    this.#downloadable = val;
  }
  set synonyms(val) {
    this.#synonyms = val;
  }
  set required(val) {
    if (!val && Util.isNotEmpty(this.#validation)) {
      delete this.#validation.required;
    } else if (!this.#validation) {
      this.validation = {
        required: {
          value: val
        }
      };
    } else {
      this.#validation.required = {
        value: val
      };
    }
  }

  set disabled(val) {
    this.#disabled = val;
  }
  set definition(val) {
    this.#definition = val;
  }
  set showDefinition(val) {
    this.#showDefinition = val;
  }
  set tooltip(val) {
    this.#tooltip = val;
  }
  set order(val) {
    this.#order = val;
  }
  set defaultValue(val) {
    this.#defaultValue = val;
  }
  set standard(val) {
    this.#standard = val;
  }
  set status(val) {
    this.#status = val;
  }
  set state(val) {
    this.#state = val;
  }
  set validation(val) {
    this.#validation = val;
  }
  set active(val) {
    this.#active = val;
  }
  set value(val) {
    this.#value = val;
  }
  set displayType(val) {
    this.#displayType = val;
  }
  set errorCellIndex(index) {
    this.error.cellIndex = index;
  }
  set errorMessage(message) {
    this.error.message = message;
  }
  set errorClass(className) {
    this.error.errorClass = className;
  }
  set commentable(val) {
    this.#commentable = val;
  }
  set verifiable(val) {
    this.#verifiable = val;
  }
  set freezable(val) {
    this.#freezable = val;
  }

  set referenceFile(val) {
    if (val && !val.name && !val.file) {
      return;
    }

    this.#referenceFile = val;
  }
  set junctions(val) {
    this.#junctions = val;
  }
  set prefix(val) {
    this.#prefix = val;
  }
  set postfix(val) {
    this.#postfix = val;
  }

  set style(val) {
    this.#style = val;
  }
  set cssWidth(val) {
    if (!this.style) {
      this.style = {};
    }

    this.#style.width = val;
  }
  set position(val) {
    this.#position = val;
  }
  set label(value) {
    this.displayName[this.languageId] = value;
  }

  /*******************************************************
   * Properties handling methods
   *******************************************************/

  /**
   *
   * @returns
   * long: new key
   */
  refreshKey() {
    this.key = Util.nowTime() + this.paramCode;

    return this.key;
  }

  /**
   *
   * @returns
   * boolean
   */
  hasComments() {
    return Util.isNotEmpty(this.comments);
  }

  /**
   *
   * @returns
   * boolean
   */
  hasReferenceFile() {
    return Util.isNotEmpty(this.referenceFile);
  }

  /**
   *
   * @param {Parameter} param
   * @returns
   * boolean
   */
  checkDuplicateParamCode(param) {
    return this.paramCode == param.paramCode;
  }

  /**
   *
   * @param {Parameter} param
   * @returns
   * boolean
   */
  checkDuplicateParam(param) {
    return this.paramCode == param.paramCode && this.paramVersion == param.paramVersion;
  }

  /**
   *
   * @param {boolean} disabled
   * @param {int} cellIndex
   */
  setDisabled(disabled, cellIndex) {
    if (this.isGridCell()) {
      if (!(this.disabled instanceof Array)) {
        this.disabled = [];
      }

      if (Util.isNotEmpty(cellIndex)) {
        this.disabled[cellIndex] = disabled;
      } else {
        this.disabled = this.disabled.map((elem) => disabled);
      }
    } else {
      this.disabled = disabled;
    }
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * boolean
   */
  getDisabled(cellIndex) {
    if (this.isGridCell() && Util.isNotEmpty(cellIndex)) {
      if (!(this.disabled instanceof Array)) {
        return false;
      }
      return this.disabled[cellIndex];
    } else {
      return this.disabled;
    }
  }

  /**
   * Check if the parameter's display type is grid cell.
   * @returns
   * true if the display type is grid cell, false otherwise.
   */
  isGridCell() {
    return this.displayType == ParameterConstants.DisplayTypes.GRID_CELL;
  }

  /**
   * Gets the display name for a specific language or the current language if no languageId is provided.
   * @param {String} languageId
   * @returns
   * display name for the specified language or the current language.
   */
  getDisplayName(languageId) {
    return languageId ? this.displayName[languageId] : this.displayName[this.languageId];
  }

  /**
   * Sets the display name for a specific language or the current language if no languageId is provided.
   * @param {String} languageId
   * @param {String} translation
   */
  addDisplayName(languageId, translation) {
    this.displayName[languageId] = translation;
  }

  /**
   * Removes the display name for a specific language. 
   * If no languageId is provided, it removes the display name for the current language.

   * @param {String} languageId
   */
  removeDisplayName(languageId = this.languageId) {
    delete this.displayName[languageId];
  }

  /**
   * Gets the definition for a specific language or the current language if no languageId is provided.
   * @param {String} languageId
   * @returns
   * String: localized
   */
  getDefinition(languageId) {
    return languageId ? this.definition[languageId] : this.definition[this.languageId];
  }

  /**
   * Adds a definition for a specific language.
   * @param {String} languageId
   * @param {String} translation
   */
  addDefinition(languageId, translation) {
    this.definition[languageId] = translation;
  }

  /**
   * Removes the definition for a specific language.
   * If no languageId is provided, it removes the definition for the current language.
   * @param {String} languageId
   */
  removeDefinition(languageId) {
    delete this.definition[languageId];
  }

  /**
   * Gets the tooltip for a specific language or the current language if no languageId is provided.
   * @param {String} languageId
   * @returns
   * String: localized
   */
  getTooltip(languageId) {
    return languageId ? this.tooltip[languageId] : this.tooltip[this.languageId];
  }

  /**
   * Adds a tooltip for a specific language.
   * @param {String} languageId
   * @param {String} translation
   */
  addTooltip(languageId, translation) {
    this.tooltip[languageId] = translation;
  }

  /**
   * Removes the tooltip for a specific language.
   * If no languageId is provided, it removes the tooltip for the current language.
   * @param {String} languageId
   */
  removeTooltip(languageId) {
    delete this.tooltip[languageId];
  }

  /**
   * Get the reference files attached to this parameter.
   * If the parameter has a reference file, return an array containing the file, otherwise return an empty array.
   * @returns
   * Array
   */
  getReferenceFiles() {
    if (Util.isNotEmpty(this.referenceFile)) {
      return [this.referenceFile];
    } else {
      return [];
    }
  }

  /**
   * Compare the parameter code and version with the given code and version to check if they are equal.
   * If version is not provided, only compare the code.
   * @param {String} code
   * @param {String} version
   * @returns
   * boolean
   */
  equalTo(code, version) {
    if (version) {
      return code == this.paramCode && version == this.paramVersion;
    } else {
      return code == this.paramCode;
    }
  }

  /**
   * Initialize the parameter properties with the given JSON object.
   * If the parameter is of grid cell type, it will initialize the value for each cell.
   * @param {Object} json
   */
  initProperties(json) {
    //console.log('Parameter.initProperties json: ', this.paramCode, json);
    if (json) {
      this.parse(json);
    }

    if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
      if (!this.value) {
        this.value = [];
      }

      this.value?.forEach((value, cellIndex) => {
        if (Util.isEmpty(value)) {
          this.initValue(cellIndex);
        }
      });
    } else {
      if (!this.hasValue()) {
        this.initValue();
      }
    }
  }

  /**
   * Postfix the parameter code with the given postfix and reset the version to default.
   *
   * @param {String} postfix
   */
  postfixParameterCode(postfix) {
    this.paramCode += '_' + postfix;
    this.paramVersion = ParameterConstants.DEFAULT_VERSION;
  }

  /**
   * Gets the prefix for a specific language or the current language if no languageId is provided.
   *
   * @param {String} languageId
   * @returns
   * String: localized
   */
  getPrefix(languageId = this.languageId) {
    return this.prefix[languageId];
  }

  /**
   * Gets the postfix for a specific language or the current language if no languageId is provided.
   *
   * @param {String} languageId
   * @returns
   * String: localized
   */
  getPostfix(languageId = this.languageId) {
    return this.postfix[languageId];
  }

  /**
   * Sets the prefix for a specific language or the current language if no languageId is provided.
   *
   * @param {String} prefix
   * @param {String} languageId
   */
  setPrefix(prefix, languageId) {
    const langKey = languageId ?? this.languageId;

    this.prefix[langKey] = prefix;
  }

  /**
   * Sets the postfix for a specific language or the current language if no languageId is provided.
   *
   * @param {String} postfix
   * @param {String} languageId
   */
  setPostfix(postfix, languageId) {
    const langKey = languageId ?? this.languageId;

    this.postfix[langKey] = postfix;
  }

  /**
   *
   * @returns
   * boolean
   */
  checkIntegrity() {
    if (this.hasError()) {
      return false;
    }

    if (Util.isEmpty(this.paramCode)) {
      this.setError(ErrorClass.ERROR, Util.translate('parameter-code-is-missing'));

      this.setDirty(true);
      return false;
    }

    if (Util.isEmpty(this.paramVersion)) {
      this.setError(ErrorClass.ERROR, Util.translate('parameter-version-is-missing'));

      this.setDirty(true);
      return false;
    }

    if (Util.isEmpty(this.displayName)) {
      this.setError(ErrorClass.ERROR, Util.translate('display-name-is-missing'));

      this.setDirty(true);
      return false;
    }

    return true;
  }

  /**************************************************************
   * Instance methods
   **************************************************************/

  /**
   *
   * @returns
   * Parameter instance
   */
  copy() {
    let properties = JSON.parse(JSON.stringify(this));
    properties.namespace = this.namespace;
    properties.formId = this.formId;

    let copied = createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: this.paramType,
      properties
    });

    copied.paramCode = this.paramCode + '_' + Util.randomKey(8);
    copied.paramVersion = ParameterConstants.DEFAULT_VERSION;

    copied.refreshKey();

    return copied;
  }

  /**
   *
   * @returns
   * Object
   */
  convertToSelectItem() {
    return {
      label: this.displayName,
      value: this.paramCode
    };
  }

  /**
   *
   * @param {Object} property
   * @param {*} value
   */
  setTitleBarInfo(property, value) {
    switch (property) {
      case 'commentable': {
        this.commentable = value;
        break;
      }
      case 'verifiable': {
        this.verifiable = value;
        break;
      }
      case 'freezable': {
        this.freezable = value;
        break;
      }
      case 'inputStatus': {
        this.inputStatus = value;
        break;
      }
      case 'jumpTo': {
        this.jumpTo = value;
        break;
      }
      case 'verified': {
        this.verified = value;
        break;
      }
      case 'freezed': {
        this.freezed = value;
        break;
      }
    }
  }

  /**************************************************************
   * Value-related methods
   **************************************************************/
  /**
   *
   * @param {Integer} cellIndex
   * @returns
   *     If cellIndex is larger than or equal to 0, it means the value type is array
   *     so that the function returns indexed cell value.
   */
  getValue(cellIndex) {
    if (this.isGridCell()) {
      if (!this.value) {
        this.value = [];
      }

      return Util.isNotEmpty(cellIndex) ? this.value[cellIndex] : this.value;
    } else {
      return this.value ?? {};
    }
  }

  /**
   *
   * @param {Object{value,cellinde, validate}} param0
   */
  setValue({ value, cellIndex = null, validate = false }) {
    //console.log("setValue: ", this.label, this.value, value);
    if (this.isGridCell()) {
      if (!this.value) {
        this.value = [];
      }

      this.value[cellIndex] = value;
    } else {
      this.value = value;
    }

    if (validate) {
      this.setDirty(true, cellIndex);
      this.validate(cellIndex);
    }
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * boolean
   */
  hasValue(cellIndex) {
    return Util.isNotEmpty(this.getValue(cellIndex));
  }

  /**
   *
   * @param {int} cellIndex
   */
  initValue(cellIndex) {
    if (this.isGridCell()) {
      this.setValue({ value: this.defaultValue ?? null, cellIndex: cellIndex });
    } else {
      this.setValue({ value: this.defaultValue ?? null });
    }
  }

  /**
   *
   * @param {int} cellIndex
   */
  clearValue(cellIndex) {
    this.initValue(cellIndex);
  }

  /**
   * Check if the value includes the given value.
   * If the parameter is of grid cell type, it will check the value of the specific cell.
   * @param {*} value
   * @param {*} cellIndex
   * @returns
   * true if the value includes the given value, false otherwise
   */
  includedInValues(value, cellIndex) {
    const values = this.getValue(cellIndex);

    return values.includes(value);
  }

  /**
   * Check if the value does not include the given value.
   * If the parameter is of grid cell type, it will check the value of the specific cell.
   * @param {*} value
   * @param {*} cellIndex
   * @returns
   * true if the value does not include the given value, false otherwise
   */
  notIncludedInValues(value, cellIndex) {
    return !this.includedInValues(value, cellIndex);
  }

  /**
   * Set dirty to true or false.
   * If the parameter is of grid cell type, it will set dirty for the specific cell if cellIndex is provided,
   * otherwise it will set dirty for all cells.
   * @param {boolean} dirty
   * @param {int} cellIndex
   */
  setDirty(dirty, cellIndex) {
    if (this.isGridCell()) {
      if (!(this.dirty instanceof Array)) {
        this.dirty = [];
      }

      if (Util.isNotEmpty(cellIndex)) {
        this.dirty[cellIndex] = dirty;
      } else {
        this.dirty = this.dirty.map((elem) => dirty);
      }
    } else {
      this.dirty = dirty;
    }
  }

  /**
   * Check if the parameter is dirty.
   * If the parameter is of grid cell type, it will check dirty for the specific cell if cellIndex is provided,
   * otherwise it will check if any cell is dirty.
   * @param {int} cellIndex
   * @returns
   * true if the parameter is dirty, false otherwise
   */
  isDirty(cellIndex) {
    if (this.isGridCell() && Util.isNotEmpty(cellIndex)) {
      return this.dirty instanceof Array ? (this.dirty[cellIndex] ?? false) : false;
    } else {
      return this.dirty ?? false;
    }
  }

  /**
   * Clean dirty. If the parameter is of grid cell type, it will clean dirty for all cells.
   */
  cleanDirty() {
    if (this.isGridCell()) {
      this.dirty = [];
    } else {
      this.dirty = false;
    }
  }

  /**
   * Check if the validation is enabled for the given section.
   * @param {String} section
   * @returns
   * true if the validation is enabled for the given section, false otherwise
   */
  checkValidationEnabled(section) {
    return !!(this.validation && this.validation[section]);
  }

  /**
   *
   * @param {String} section
   * @param {String} valueProp
   * @param {String} locale
   * @returns
   * Any
   */
  getValidationValue(section, valueProp, locale) {
    if (this.checkValidationEnabled(section)) {
      switch (valueProp) {
        case 'message': {
          if (locale) {
            return this.validation[section].message ? (this.validation[section].message[locale] ?? '') : '';
          } else {
            return this.validation[section].message ?? {};
          }
        }
        case 'value':
        case 'errorClass': {
          return this.validation[section][valueProp];
        }
        case 'boundary': {
          return this.validation[section][valueProp] ?? false;
        }
        default: {
          return this.validation[section];
        }
      }
    }
  }

  toValue() {
    let value = {};

    if (this.hasValue()) {
      value[this.paramCode] = this.value;
    }

    return value;
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * 		-1: has error
   * 		0 : no error
   * 		1 : has warning
   */
  validate(cellIndex) {
    if (this.displayType === ParameterConstants.DisplayTypes.GRID_CELL && Util.isEmpty(cellIndex)) {
      const values = this.getValue();

      for (let i = 0; i < values.length; i++) {
        const error = this.validate(i);

        if (error !== 0) {
          return error;
        }
      }
    }

    let value = this.getValue(cellIndex);
    let numValue = Number(this.uncertainty ? value.value : value);
    let numUncertainty = this.uncertainty ? (value.uncertainty ?? 0) : 0;

    this.error = {};

    for (const validationType in this.validation) {
      const validationValue = this.getValidationValue(validationType, 'value');
      const validationBoundary = this.getValidationValue(validationType, 'boundary');
      const validationMessage = this.getValidationValue(validationType, 'message', this.languageId);
      const validationErrorClass = this.getValidationValue(validationType, 'errorClass');

      switch (validationType) {
        case ValidationKeys.REQUIRED: {
          if (!this.hasValue(cellIndex)) {
            this.error = {
              message: validationMessage,
              errorClass: validationErrorClass
            };

            break;
          }

          break;
        }
        case ValidationKeys.PATTERN: {
          const regExpr = new RegExp(validationValue);

          if (this.localized) {
            for (const locale in value) {
              if (!regExpr.test(value[locale])) {
                this.error = {
                  message: validationMessage,
                  errorClass: validationErrorClass
                };

                break;
              }
            }
          } else if (!regExpr.test(value)) {
            this.error = {
              message: validationMessage,
              errorClass: validationErrorClass
            };

            break;
          }

          break;
        }
        case ValidationKeys.MIN_LENGTH: {
          const minLength = validationValue;
          if (Util.isEmpty(value) || Util.isEmpty(minLength)) {
            this.error = {};
            break;
          }

          if (this.localized) {
            for (const locale in value) {
              if (value[locale].length < minLength) {
                this.error = {
                  message: validationMessage,
                  errorClass: validationErrorClass
                };

                break;
              }
            }
          } else {
            if (value.length < minLength) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }

          break;
        }
        case ValidationKeys.MAX_LENGTH: {
          const maxLength = validationValue;
          if (Util.isEmpty(maxLength)) {
            this.error = {};
            break;
          }

          if (this.localized) {
            for (const locale in value) {
              if (value[locale].length > maxLength) {
                this.error = {
                  message: validationMessage,
                  errorClass: validationErrorClass
                };

                break;
              }
            }
          } else {
            if (value.length > maxLength) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }

          break;
        }
        case ValidationKeys.NORMAL_MIN: {
          if (Util.isEmpty(value)) {
            this.error = {};
            break;
          }

          if (validationBoundary) {
            if (numValue - numUncertainty < validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          } else {
            if (numValue - numUncertainty <= validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }

          break;
        }
        case ValidationKeys.NORMAL_MAX: {
          if (Util.isEmpty(value)) {
            this.error = {};
            break;
          }

          if (validationBoundary) {
            if (numValue + numUncertainty > validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          } else {
            if (numValue + numUncertainty >= validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }

          break;
        }
        case ValidationKeys.MIN: {
          if (Util.isEmpty(value)) {
            this.error = {};
            break;
          }

          if (validationBoundary) {
            if (numValue - numUncertainty < validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          } else {
            if (numValue - numUncertainty <= validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }

          break;
        }
        case ValidationKeys.MAX: {
          if (Util.isEmpty(value)) {
            this.error = {};
            break;
          }

          if (validationBoundary) {
            if (numValue + numUncertainty > validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          } else {
            if (numValue + numUncertainty >= validationValue) {
              this.error = {
                message: validationMessage,
                errorClass: validationErrorClass
              };

              break;
            }
          }
          break;
        }
        case ValidationKeys.CUSTOM: {
          //const func = eval(validationValue);
          const dynamicFn = new Function('value', validationValue);

          const valid = dynamicFn(value);

          if (!valid) {
            this.setError(validationErrorClass, validationMessage);

            break;
          }
        }
      }

      if (this.hasError()) {
        return -1;
      }
    }

    if (this.hasWarning()) {
      return 1;
    } else {
      this.error = {
        message: '',
        errorClass: ErrorClass.SUCCESS
      };
    }

    return 0;
  }

  enableInputStatus(enable = true) {
    this.inputStatus = enable;
  }

  /************************************************************
   * Error handling methods
   ************************************************************/
  /**
   *
   * @param {String} msg
   */
  setRequiredMessage(msg) {
    this.#validation.required.message = msg;
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * boolean
   */
  hasError(cellIndex) {
    return Util.isNotEmpty(cellIndex)
      ? this.error.errorClass == ErrorClass.ERROR && cellIndex == this.errorCellIndex
      : this.error.errorClass == ErrorClass.ERROR;
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * boolean
   */
  hasWarning(cellIndex) {
    return Util.isNotEmpty(cellIndex)
      ? this.error.errorClass == ErrorClass.WARNING && cellIndex == this.errorCellIndex
      : this.error.errorClass == ErrorClass.WARNING;
  }

  /**
   *
   * @param {int} cellIndex
   * @returns
   * Object
   */
  checkError(cellIndex) {
    if (this.hasError()) {
      return this.error;
    }

    const error = this.validate(cellIndex);

    if (error !== 0) {
      this.setDirty(true, cellIndex);
      return this.error;
    }

    return null;
  }

  /**
   *
   * @param {String} errorClass
   * @param {String} errorMessage
   * @param {int} cellIndex
   */
  setError(errorClass, errorMessage, cellIndex) {
    this.errorClass = errorClass;
    this.errorMessage = errorMessage;
    this.errorCellIndex = cellIndex;
  }

  clearError() {
    this.error = {};
  }

  /*********************************************************
   * Firing Event Methods
   *********************************************************/

  fire(event, params) {
    Event.fire(event, this.namespace, this.namespace, {
      targetFormId: this.formId,
      ...params
    });
  }

  fireRefresh(cellIndex) {
    let parameter = this.isGridCell() ? this.parent : this;

    Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
      targetFormId: this.formId,
      parameter: parameter,
      cellIndex: cellIndex
    });
  }

  /**
   * Fires SX_REFRESH_PREVIEW if preview is true otherwise SX_REFRESH
   *
   * @param {boolean} preview: default is false
   * @returns
   * 		void
   */
  fireRefreshParent() {
    if (Util.isEmpty(this.parent)) {
      return;
    }

    this.parent.fireRefresh();
  }

  fireRefreshPreview(cellIndex) {
    let parameter = this.isGridCell() ? this.parent : this;

    Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
      targetFormId: this.formId,
      parameter: parameter,
      cellIndex: cellIndex
    });
  }

  fireRefreshForm() {
    Event.fire(Event.SX_REFRESH_FORM, this.namespace, this.namespace, {
      targetFormId: this.formId
    });
  }

  fireFocus(cellIndex) {
    Event.fire(Event.SX_FOCUS, this.namespace, this.namespace, {
      targetFormId: this.formId,
      parameter: this,
      cellIndex: cellIndex
    });
  }

  fireValueChanged(cellIndex) {
    Event.fire(Event.SX_FIELD_VALUE_CHANGED, this.namespace, this.namespace, {
      targetFormId: this.formId,
      parameter: this,
      cellIndex: cellIndex
    });
  }

  fireSelectGroup(targetForm) {
    Event.fire(Event.SX_SELECT_GROUP, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireCopy(targetForm) {
    Event.fire(Event.SX_COPY_PARAMETER, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireDelete(targetForm) {
    Event.fire(Event.SX_DELETE_PARAMETER, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireDeleteFiles({ targetForm, files }) {
    Event.fire(Event.SX_DELETE_FILES, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      paramCode: this.paramCode,
      paramVersion: this.paramVersion,
      files: files
    });
  }

  fireMoveUp(targetForm) {
    Event.fire(Event.SX_MOVE_PARAMETER_UP, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireMoveDown(targetForm) {
    Event.fire(Event.SX_MOVE_PARAMETER_DOWN, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireParameterSelected(targetForm) {
    Event.fire(Event.SX_PARAMETER_SELECTED, this.namespace, this.namespace, {
      targetFormId: targetForm ?? this.formId,
      parameter: this
    });
  }

  fireOpenReferenceFile() {
    if (!this.hasReferenceFile()) {
      return;
    }

    Event.fire(Event.SX_OPEN_REFERENCE_FILE, this.namespace, this.namespace, {
      targetFormId: this.formId,
      parameter: this,
      fileName: this.referenceFile.name,
      fileType: this.referenceFile.type,
      file: this.referenceFile.file
    });
  }

  /**
   *
   * @param {*} event
   */
  removeEvent(event, fire) {
    if (fire) {
      this.events.fire = this.events.fire.filter((e) => e !== event);
    } else {
      this.events.on = this.events.on.filter((e) => e !== event);
    }
  }

  /*********************************************************
   * File-related Methods
   *********************************************************/

  /**
   * @returns
   * Object
   */
  toFileData() {
    const files = [];

    const mapFileValueToFileData = (fileInfo, rowIndex) => {
      return {
        info: {}
      };
    };

    if (this.paramType === ParamType.FILE && this.hasValue()) {
      if (this.#displayType === ParameterConstants.DisplayTypes.GRID_CELL) {
        const values = this.getValue();
        values.map((cellValues, rowIndex) => {
          cellValues.map((value) => {});
        });
      } else {
      }
    }
  }

  /**
   *
   * @returns
   */
  fileInfoToData() {
    if (this.paramType !== ParamType.FILE) {
      // return empty object
      return {};
    }

    // Type of the value of the file type parameter is an array.
    const values = this.value; // [...]

    let data = [];
    if (this.displayType === ParameterConstants.DisplayTypes.GRID_CELL) {
      // It means the value is an Array of JSON Array
      data = values.map((value) => {
        return value.map((item) => ({
          info: item,
          file: item.file
        }));
      });
    } else {
      // It means the value is an Array of JSON object
      data = value.map;
    }
  }

  /*********************************************************
   * Abstract Methods
   *
   * These methods will be called at the very beggining in the override method of the subclass.
   *
   *********************************************************/
  /**
   * Initialize the parameter properties with the given JSON object.
   *
   * @abstract
   * @param {Object} json
   */
  parse(json) {
    for (const key in json) {
      this[key] = json[key];
    }

    this.refreshKey();
  }

  /**
   *
   * @abstract
   * @param {Object} data
   * @returns
   *    Object
   */
  loadData(data) {
    if (!data) {
      return;
    }

    if (this.commentable) {
      this.comments = data.comments;
    }

    this.historyItems = data.historyItems;

    if (this.freezable) {
      this.freezed = data.freezed ?? { freezed: false };
    }

    if (this.verifiable) {
      this.verified = data.verified ?? { verified: false };
    }

    this.value = data.value;
  }

  /**
   * @abstract
   * @returns
   *  Object
   */
  toData() {
    let data;

    if (this.active && this.hasValue()) {
      data = {};
      data[this.paramCode] = {};
      const strucValue = data[this.paramCode];

      if (!this.isGridCell()) {
        if (this.commentFreezed?.freezed) {
          strucValue.commentFreezed = this.commentFreezed;
        }

        if (this.freezed?.freezed) {
          strucValue.freezed = this.freezed;
        }

        if (this.verified?.verified) {
          strucValue.verified = this.verified;
        }
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
   * @abstract
   * @returns
   */ Object;
  toJSON() {
    let json = new Object();

    if (this.paramId > 0) json.paramId = this.paramId;

    if (Util.isNotEmpty(this.paramType)) json.paramType = this.paramType;
    if (Util.isNotEmpty(this.paramCode)) json.paramCode = this.paramCode;
    if (Util.isNotEmpty(this.paramVersion)) json.paramVersion = this.paramVersion;
    if (Util.isNotEmpty(this.displayName)) json.displayName = this.displayName;
    if (Util.isNotEmpty(this.definition)) json.definition = this.definition;
    if (Util.isNotEmpty(this.tooltip)) json.tooltip = this.tooltip;
    if (Util.isNotEmpty(this.synonyms)) json.synonyms = this.synonyms;
    if (Util.isNotEmpty(this.defaultValue)) json.defaultValue = this.defaultValue;
    if (Util.isNotEmpty(this.validation)) json.validation = this.validation;
    if (Util.isNotEmpty(this.defaultValue)) json.defaultValue = this.defaultValue;
    if (Util.isNotEmpty(this.referenceFile)) {
      json.referenceFile = {
        name: this.referenceFile.name,
        type: this.referenceFile.type,
        lastModified: this.referenceFile.lastModified
      };
    }
    if (Util.isNotEmpty(this.junctions)) json.junctions = this.junctions;
    if (Util.isNotEmpty(this.style)) json.style = this.style;
    if (this.showDefinition) json.showDefinition = this.showDefinition;
    if (this.abstractKey) json.abstractKey = this.abstractKey;
    if (this.standard) json.standard = this.standard;
    if (!this.searchable) json.searchable = this.searchable;
    if (!this.downloadable) json.downloadable = this.downloadable;
    if (this.order > 0) json.order = this.order;

    json.commentable = this.commentable;
    json.verifiable = this.verifiable;
    json.freezable = this.freezable;
    json.status = this.status;
    json.state = this.state;

    json.displayType = this.displayType;

    return json;
  }

  /**
   * @abstract
   * @returns
   * Object
   */
  toProperties() {
    return {
      key: this.key,
      paramType: this.paramType,
      paramCode: this.paramCode,
      paramVersion: this.paramVersion,
      parent: this.parent,
      tagId: this.paramCode,
      tagName: this.paramCode,
      label: this.label,
      definition: this.getDefinition(this.languageId),
      showDefinition: this.showDefinition,
      required: this.required,
      state: this.state,
      status: this.status,
      tooltip: this.getTooltip(this.languageId),
      referenceFile: this.referenceFile,
      validation: this.validation,
      commentable: this.commentable,
      verifiable: this.verifiable,
      freezable: this.freezable,
      order: this.order,
      junctions: this.junctions,
      languageId: this.languageId,
      defaultLanguageId: this.defaultLanguageId,
      availableLanguageIds: this.availableLanguageIds,
      focused: this.focused,
      position: this.position
    };
  }

  /*********************************************************
   * Render Methods
   *********************************************************/

  /**
   *
   * @param {int} cellIndex
   * @returns
   * String: id of the parameter's component
   */
  getTagId(cellIndex) {
    return this.isGridCell() ? this.tagId + '_' + cellIndex : this.tagId;
  }

  /**
   *
   * @param {Object} style
   */
  addStyle(style) {
    this.style = { ...this.style, ...style };
  }

  /**
   *
   * @param {String} property
   */
  removeStyle(property) {
    delete this.#style[property];
  }

  focus(paramCode, paramVersion) {
    const focus = this.equalTo(paramCode, paramVersion);

    if (this.focused !== focus) {
      this.focused = focus;

      return true;
    }
    return false;
  }

  /**
   *
   * @param {String} baseClassName
   * @param {int} cellIndex
   * @returns
   * String
   */
  getClassName(baseClassName, cellIndex) {
    let className = baseClassName;

    if (this.isDirty(cellIndex)) {
      if (this.hasError(cellIndex)) {
        className += ' input-group-sm ' + ErrorClass.ERROR;
      } else if (this.hasWarning(cellIndex)) {
        className += ' input-group-sm ' + ErrorClass.WARNING;
      } else {
        className += ' input-group-sm ' + ErrorClass.SUCCESS;
      }
    }

    return className;
  }

  renderLabel({ forHtml = this.tagId, spritemap, languageId = this.languageId, style = {} }) {
    style.color = this.inputStatus && !this.hasValue() ? '#ff80b3' : 'black';
    style.marginBottom = '0.3rem';
    style.fontSize = '0.825rem';
    style.fontWeight = '600';

    return (
      <div key={this.key} style={style}>
        {this.label}
        {this.required && <SXRequiredMark spritemap={spritemap} />}
        {Util.isNotEmpty(this.tooltip) && <SXTooltip tooltip={this.getTooltip()} spritemap={spritemap} />}
      </div>
    );
  }

  renderTitle({ spritemap, style }) {
    return (
      <SXTitleBar
        key={Util.randomKey()}
        namespace={this.namespace}
        formId={this.componentId}
        parameter={this}
        spritemap={spritemap}
        style={style}
      />
    );
  }

  renderFormFieldFeedback(spritemap, cellIndex) {
    return (
      <>
        {this.isDirty(cellIndex) && this.hasError(cellIndex) && (
          <SXFormFieldFeedback content={this.errorMessage} spritemap={spritemap} symbol="exclamation-full" />
        )}
        {this.isDirty(cellIndex) && this.hasWarning(cellIndex) && (
          <SXFormFieldFeedback content={this.errorMessage} spritemap={spritemap} symbol="warning" />
        )}
      </>
    );
  }

  renderCommentDisplayer(spritemap) {
    return (
      <SXCommentDisplayer
        namespace={this.namespace}
        formId={this.componentId}
        commentModel="parameter"
        dataInstance={this}
        dataId={this.dataId}
        paramCode={this.paramCode}
        commentItems={this.comments}
        spritemap={spritemap}
      />
    );
  }

  renderPrefix() {
    if (Util.isNotEmpty(this.prefix)) {
      return (
        <ClayInput.GroupItem shrink style={{ alignContent: 'end', marginLeft: '0.5rem' }}>
          {this.getPrefix()}
        </ClayInput.GroupItem>
      );
    }
  }

  renderPostfix() {
    if (Util.isNotEmpty(this.postfix)) {
      return (
        <ClayInput.GroupItem shrink style={{ alignContent: 'end' }}>
          {this.getPostfix()}
        </ClayInput.GroupItem>
      );
    }
  }

  renderPreview({ formId = this.formId, actionItems = [], spritemap }) {
    //console.log('Parameter.renderPreview: ', this.paramCode, formId, actionItems);
    return (
      <SXPreviewRow
        key={this.key}
        formId={formId}
        parameter={this}
        actionItems={actionItems}
        activeActionItems={this.activeActionItems}
        spritemap={spritemap}
      />
    );
  }

  renderField({ className = '', style = {}, spritemap }) {
    //console.log("renderField: " + this.formId);
    return <SXFormField key={this.key} parameter={this} spritemap={spritemap} className={className} style={style} />;
  }
}
