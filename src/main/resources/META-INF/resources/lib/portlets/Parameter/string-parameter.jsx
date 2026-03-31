import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { ParamType } from '../../stationx/station-x';
import SXInput from '../Form/input';
import SXLocalizedInput from '../Form/localized-input';

export default class StringParameter extends Parameter {
  #minLength;
  #maxLength;
  #multipleLine;
  #localized;
  #placeholder;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }
    this.paramType = ParamType.STRING;
  }

  /**********************************************************
   * Getters and Setters
   **********************************************************/
  get minLength() {
    return this.#minLength;
  }
  get maxLength() {
    return this.#maxLength;
  }
  get multipleLine() {
    return this.#multipleLine;
  }
  get localized() {
    return this.#localized;
  }
  get placeholder() {
    return this.#placeholder;
  }

  get languageFlags() {
    return this.availableLanguageIds.map((lang) => ({
      id: lang,
      name: lang,
      symbol: lang.toLowerCase()
    }));
  }

  set minLength(val) {
    this.#minLength = val;
  }
  set maxLength(val) {
    this.#maxLength = val;
  }
  set multipleLine(val) {
    this.#multipleLine = val;
  }
  set localized(val) {
    this.#localized = val;
  }
  set placeholder(val) {
    this.#placeholder = val;
  }

  /**********************************************************
   * Property-related Methods
   **********************************************************/
  /**
   * Returns the placeholder for a specific language.
   * @param {String} languageId
   * @returns
   */
  getPlaceholder(languageId) {
    return this.placeholder[languageId];
  }

  /**********************************************************
   * Value-related Methods
   **********************************************************/
  /**
   * Initializes the parameter value for a specific cell index.
   * @param {int} cellIndex
   */
  initValue(cellIndex) {
    const value = this.defaultValue ?? (this.localized ? {} : '');
    this.setValue({ value: value, cellIndex: cellIndex });
  }

  /**
   * Returns the translation for a specific language and cell index.
   * @param {String} languageId
   * @param {int} cellIndex
   * @returns
   * The translation for the specified language and cell index, or an empty string if not available.
   */
  getTranslation(languageId, cellIndex) {
    const translations = this.getValue(cellIndex);

    if (!(this.localized && Util.isNotEmpty(translations))) {
      return '';
    }

    return translations[languageId] ?? '';
  }

  /**
   * Sets the translation for a specific language and cell index.
   * @param {String} languageId
   * @param {String} translation
   * @param {int} cellIndex
   */
  setTranslation(languageId, translation, cellIndex) {
    if (this.localized) {
      let translations = this.getValue(cellIndex);
      if (Util.isEmpty(translations)) {
        translations = {};
      }

      translations[languageId] = translation;

      super.setValue({ value: translations, cellIndex: cellIndex, validate: true });
    }
  }

  /**
   * Returns the translations for all available languages.
   * @param {int} cellIndex
   * @returns
   * An object containing the translations for all available languages, or an empty object if not available.
   */
  getTranslations(cellIndex) {
    const translations = this.getValue(cellIndex);

    return this.localized && Util.isNotEmpty(translations) ? translations : {};
  }

  /**********************************************************
   * Override Methods
   * All override methods should call the same method of the parent class
   * using super.methodName() at the very beginning to ensure proper functionality.
   **********************************************************/
  /**
   * Parses the JSON object and initializes the parameter properties.
   * @override
   * @param {JSON Object} json
   */
  parse(json = {}) {
    super.parse(json);

    this.minLength = json.minLength ?? 1;
    this.maxLength = json.maxLength ?? 72;
    this.multipleLine = json.multipleLine ?? false;
    this.localized = json.localized ?? false;
    this.placeholder = json.placeholder ?? '';
    this.prefix = json.prefix ?? {};
    this.postfix = json.prefix ?? {};
  }

  /**
   * Converts the parameter to a JSON object.
   * @override
   * @returns
   * A JSON object representing the parameter, including properties to be serialized.
   */
  toJSON() {
    let json = super.toJSON();

    if (this.minLength > 1) json.minLength = this.minLength;
    if (this.maxLength !== 72) json.maxLength = this.maxLength;
    if (this.multipleLine == true) json.multipleLine = this.multipleLine;
    if (this.localized == true) json.localized = this.localized;
    if (Util.isNotEmpty(this.placeholder)) json.placeholder = this.placeholder;
    if (Util.isNotEmpty(this.prefix)) json.prefix = this.prefix;
    if (Util.isNotEmpty(this.postfix)) json.postfix = this.postfix;

    return json;
  }

  /**
   * Converts the parameter to a JSON object for properties.
   * @override
   * @returns
   * A JSON object representing the parameter properties, including all necessary information for rendering and validation.
   */
  toProperties() {
    let json = super.toProperties();

    json.placeholder = this.getPlaceholder(this.languageId);
    json.minLength = this.minLength;
    json.maxLength = this.maxLength;
    json.multipleLine = this.multipleLine;
    json.localized = this.localized;
    json.prefix = this.prefix;
    json.postfix = this.postfix;
    json.value = this.hasValue() ? this.value : this.defaultValue;

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
    if (this.localized) {
      return (
        <SXLocalizedInput
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
    } else {
      return (
        <SXInput
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
}
