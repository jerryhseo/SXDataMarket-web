import React from "react";
import { Constant, ParamType, ValidationKeys, ErrorClass, Event } from "./station-x";
import { Util } from "./util";
import SXFormField, {
	SXAddress,
	SXBoolean,
	SXDate,
	SXDualListBox,
	SXEMail,
	SXFile,
	SXGrid,
	SXGroup,
	SXInput,
	SXLocalizedInput,
	SXMatrix,
	SXNumeric,
	SXPhone,
	SXPreviewRow,
	SXRequiredMark,
	SXSelect,
	SXTitleBar,
	SXTooltip
} from "./form";
import { ClayInput } from "@clayui/form";
import { SXQMarkIcon } from "./icon";

export class Translations {
	constructor(json) {
		if (json) {
			this.parse(json);
		}
	}

	addTranslation(key, translation) {
		this[key] = translation;
	}

	removeTranslation(key) {
		delete this[key];
	}

	parse(json) {
		for (const key in json) {
			this[key] = json[key];
		}
	}

	toJSON() {
		return { ...this };
	}
}

export class SelectOption {
	label = new Translations();
	value;

	constructor(json) {}
}

export class ParamId {}

export class Parameter {
	static ColumnReadyTypes = [
		ParamType.STRING,
		ParamType.NUMERIC,
		ParamType.BOOLEAN,
		ParamType.SELECT,
		ParamType.EMAIL,
		ParamType.ADDRESS,
		ParamType.DATE,
		ParamType.FILE
	];

	static DisplayTypes = {
		FORM_FIELD: "formField",
		INLINE: "inline",
		SHARED_OPTION_TABLE_ROW: "sharedOptionTableRow",
		SHARED_LABEL_CELL: "sharedLabelCell",
		GRID_CELL: "gridCell",
		TABLE_ROW: "tableRow"
	};

	static DEFAULT_VERSION = "1.0.0";

	static createParameter(namespace, formId, languageId, availableLanguageIds, paramType, json = {}) {
		let parameter;
		switch (paramType) {
			case ParamType.STRING: {
				parameter = new StringParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.NUMERIC: {
				parameter = new NumericParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.BOOLEAN: {
				parameter = new BooleanParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.SELECT: {
				parameter = new SelectParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.DUALLIST: {
				parameter = new DualListParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.MATRIX: {
				parameter = new MatrixParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.FILE: {
				parameter = new FileParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.ADDRESS: {
				parameter = new AddressParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.EMAIL: {
				parameter = new EMailParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.DATE: {
				parameter = new DateParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.PHONE: {
				parameter = new PhoneParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.GROUP: {
				parameter = new GroupParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}
			case ParamType.GRID: {
				parameter = new GridParameter(namespace, formId, languageId, availableLanguageIds);
				break;
			}

			/*
			case ParamType.TABLE: {
				return new TableParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
			case ParamType.CALCULATOR: {
				return new CalculatorParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
			case ParamType.REFERENCE: {
				return new ReferenceParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
			case ParamType.LINKER: {
				return new LinkerParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
			case ParamType.IMAGE: {
				return new ImageParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
			case ParamType.COMMENT: {
				return new CommentParameter(namespace, formId, languageId, availableLanguageIds, json);
			}
				*/
		}

		parameter.initProperties(json);

		return parameter;
	}

	static getTranslation(localizationObj, languageId) {
		let translation = localizationObj[languageId];

		if (Util.isEmpty(translation)) {
			for (const lanId in localizationObj) {
				translation = localizationObj[lanId];

				if (Util.isNotEmpty(translation)) {
					break;
				}
			}
		}

		return translation;
	}
	static addTranslation(localizationObj, languageId, translation) {
		return (localizationObj[languageId] = translation);
	}
	static removeTranslation(localizationObj, languageId) {
		delete localizationObj[languageId];

		return localizationObj;
	}

	#key = Util.randomKey();
	#namespace;
	#formId;
	#languageId;
	#availableLanguageIds;
	#dirty = false;
	#focused = false;
	#error = {};

	#paramType;
	#paramCode = "";
	#paramVersion = Parameter.DEFAULT_VERSION;
	#displayName = {};
	#displayType = Parameter.DisplayTypes.FORM_FIELD;
	#viewType;
	#abstractKey = false;
	#searchable = true;
	#downloadable = true;
	#synonyms = "";
	#definition = {};
	#showDefinition = false;
	#tooltip = {};
	#order = 0;
	#defaultValue = null;
	#parent = {
		code: GroupParameter.ROOT_GROUP,
		version: Parameter.DEFAULT_VERSION
	};
	#paramId = 0;
	#standard = false;
	#status = Constant.Status.PENDING;
	#state = Constant.State.ACTIVE;
	#referenceFile = { fileId: 0, fileType: "pdf" };
	#position = Constant.Position.MIDDLE;

	#validation = {};
	#style = {};

	#value;

	companyId = 0;
	groupId = 0;
	userid = 0;
	createDate = null;
	modifedDate = null;

	inputStatus = false;
	commentable = false;
	commentableIcon = "";
	verifiable = false;
	verifiableIcon = "";
	freezable = false;
	freezableIcon = "";
	freezed = false;
	verified = false;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType) {
		this.#namespace = namespace;
		this.#formId = formId;
		this.#languageId = languageId;
		this.#availableLanguageIds = availableLanguageIds;
		this.#paramType = paramType;
	}

	get key() {
		return this.#key;
	}
	get namespace() {
		return this.#namespace;
	}
	get formId() {
		return this.#formId;
	}
	get languageId() {
		return this.#languageId;
	}
	get availableLanguageIds() {
		return this.#availableLanguageIds;
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
			Util.isNotEmpty(this.validation) &&
			Util.isNotEmpty(this.validation.required) &&
			this.validation.required.value
		);
	}
	get requiredMessege() {
		if (Util.isNotEmpty(this.validation) && Util.isNotEmpty(this.validation.required)) {
			return this.validation.required.message ? this.validation.required.message : "";
		} else {
			return "";
		}
	}
	get disabled() {
		return this.state === Constant.State.DISABLED;
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
	get parent() {
		return this.#parent;
	}
	get parentCode() {
		return this.parent.code;
	}
	get parentVersion() {
		return this.parent.version;
	}
	get paramId() {
		return this.#paramId;
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
		return this.state === Constant.State.ACTIVE || this.state === Constant.State.DISABLED;
	}
	get value() {
		return this.#value;
	}
	get displayType() {
		return this.#displayType;
	}
	get error() {
		return this.#error;
	}
	get errorProperty() {
		return this.error.property ?? "value";
	}
	get errorMessage() {
		return this.error.message ?? "";
	}
	get errorClass() {
		return this.error.errorClass ?? "";
	}
	get referenceFile() {
		return this.#referenceFile;
	}
	get dirty() {
		return this.#dirty;
	}
	get focused() {
		return this.#focused;
	}
	get tagId() {
		return this.namespace + this.paramCode + "_" + this.paramVersion;
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

	get rowCount() {
		if (this.displayType !== Parameter.DisplayTypes.GRID_CELL) {
			return;
		}

		return this.value.length;
	}

	get totalFieldsCount() {
		return 1;
	}
	get valuedFieldsCount() {
		return this.hasValue() ? 1 : 0;
	}

	set namespace(val) {
		this.#namespace = val;
	}
	set formId(val) {
		this.#formId = val;
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
		this.#state = val ? Constant.State.DISABLED : Constant.State.ACTIVE;
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
	set parent(val) {
		this.#parent = val;
	}
	set parentCode(val) {
		this.parent = {
			code: val,
			version: this.parent.version
		};
	}
	set parentVersion(val) {
		this.parent = {
			code: this.parent.code,
			version: val
		};
	}
	set paramId(val) {
		this.#paramId = val;
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
		this.#state = val ? Constant.State.ACTIVE : Constant.State.INACTIVE;
	}
	set value(val) {
		this.#value = val;
	}
	set displayType(val) {
		this.#displayType = val;
	}
	set error(val) {
		this.#error = val;
	}
	set errorProperty(prop) {
		this.#error.property = prop;
	}
	set errorMessage(message) {
		this.error.message = message;
	}
	set errorClass(className) {
		this.error.errorClass = className;
	}

	set referenceFile(val) {
		this.#referenceFile = val;
	}
	set dirty(val) {
		this.#dirty = val;
	}
	set focused(val) {
		this.#focused = val;
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

	refreshKey() {
		this.#key = Util.randomKey();

		return this.#key;
	}

	checkDuplicateParam(param) {
		return this.paramCode === param.paramCode;
	}

	setDisabled(disabled) {
		this.disabled = disabled;
		this.refreshKey();
	}

	setDirty() {
		if (this.dirty) {
			return;
		}

		this.dirty = true;
		this.refreshKey();
	}

	isGridCell(cellIndex) {
		return this.displayType === Parameter.DisplayTypes.GRID_CELL && cellIndex >= 0;
	}

	setRequiredMessage(msg) {
		this.#validation.required.message = msg;
	}

	setParent(parentCode, parentVersion) {
		this.parent = {
			code: parentCode,
			version: parentVersion
		};
	}

	getDisplayName(languageId) {
		return languageId ? this.displayName[languageId] : this.displayName[this.languageId];
	}
	get label() {
		return Parameter.getTranslation(this.displayName, this.languageId);
	}
	set label(value) {
		this.displayName = Parameter.addTranslation(this.displayName, this.languageId, value);
	}
	addDisplayName(languageId, translation) {
		this.displayName = Parameter.addTranslation(this.displayName, languageId, translation);
	}
	removeDisplayName(languageId) {
		this.displayName = Parameter.removeTranslation(this.displayName, languageId);
	}

	getDefinition(languageId) {
		return languageId ? this.definition[languageId] : this.definition[this.languageId];
	}
	addDefinition(languageId, translation) {
		this.definition = Parameter.addTranslation(this.definition, languageId, translation);
	}
	removeDefinition(languageId) {
		this.definition = Parameter.removeTranslation(this.definition, languageId);
	}

	getTooltip(languageId) {
		return languageId ? this.tooltip[languageId] : this.tooltip[this.languageId];
	}
	addTooltip(languageId, translation) {
		this.tooltip = Parameter.addTranslation(this.tooltip, languageId, translation);
	}
	removeTooltip(languageId) {
		this.tooltip = Parameter.removeTranslation(this.tooltip, languageId);
	}

	equalTo(code, version) {
		if (version) {
			return code === this.paramCode && version === this.paramVersion;
		} else {
			return code === this.paramCode;
		}
	}

	isMemberOf(assembly) {
		return assembly.code === this.parentCode && assembly.version === this.parentVersion;
	}

	get isGroup() {
		return this.paramType === ParamType.GROUP;
	}

	get isGrid() {
		return this.paramType === ParamType.GRID;
	}

	postfixParameterCode(postfix) {
		this.paramCode += "_" + postfix;
		this.paramVersion = Parameter.DEFAULT_VERSION;
	}

	copy() {
		const copied = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			this.paramType,
			JSON.parse(JSON.stringify(this))
		);

		copied.paramCode = "_copied_" + Util.randomKey(8);
		copied.paramVersion = Parameter.DEFAULT_VERSION;

		return copied;
	}

	focus(paramCode, paramVersion) {
		const focus = this.equalTo(paramCode, paramVersion);

		if (this.focused !== focus) {
			this.focused = focus;

			this.refreshKey();

			return true;
		}
		return false;
	}

	isRendered() {
		return this.order > 0;
	}

	isValueFilled() {}

	loadData(data) {
		this.freezed = data.freezed;
		this.verified = data.verified;
		this.value = data.value;
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

	getTagId(cellIndex) {
		return this.isGridCell(cellIndex) ? this.tagId + "_" + cellIndex : this.tagId;
	}

	addStyle(style) {
		this.style = { ...this.style, ...style };
	}

	removeStyle(property) {
		delete this.#style[property];
	}

	hasError() {
		return this.error.errorClass === ErrorClass.ERROR || this.error.errorClass === ErrorClass.WARNING;
	}

	checkError() {
		if (this.hasError()) {
			return this.error;
		}

		return null;
	}

	setError(errorClass, errorMessage, errorProperty = "value") {
		this.errorClass = errorClass;
		this.errorMessage = errorMessage;
		this.errorProperty = errorProperty;
	}

	clearError(errorProperty = "value") {
		if (errorProperty === this.errorProperty) {
			this.error = {};
		}
	}

	checkIntegrity() {
		if (this.hasError()) {
			return false;
		}

		if (Util.isEmpty(this.paramCode)) {
			this.setError(ErrorClass.ERROR, Util.translate("parameter-code-is-missing"), "paramCode");

			this.dirty = true;
			//this.refreshKey();

			return false;
		}

		if (Util.isEmpty(this.paramVersion)) {
			this.setError(ErrorClass.ERROR, Util.translate("parameter-version-is-missing"), "paramVersion");

			this.dirty = true;
			//this.refreshKey();
			return false;
		}

		if (Util.isEmpty(this.displayName)) {
			this.setError(ErrorClass.ERROR, Util.translate("display-name-is-missing"), "displayName");

			this.dirty = true;
			//this.refreshKey();
			return false;
		}

		return true;
	}

	checkValidationEnabled(section) {
		return !!(this.validation && this.validation[section]);
	}

	/*
	enableValidation(section, enable) {
		if (enable) {
			switch (section) {
				case ValidationKeys.REQUIRED: {
					this.validation.required = {
						value: true
					};
					break;
				}
				case ValidationKeys.CUSTOM: {
					this.validation.custom = 'function(value){\n return {\nmessage:"",\nerrorClass:"has-error"};\n}';
					break;
				}
				default: {
					this.validation[section] = {};
				}
			}
		} else {
			delete this.validation[section];
		}
	}

	toggleValidationSection(section) {
		return this.enableValidation(section, !this.checkValidationEnabled(section));
	}
		*/

	getValidationValue(section, valueProp, locale) {
		if (this.checkValidationEnabled(section)) {
			switch (valueProp) {
				case "message": {
					if (locale) {
						return this.validation[section].message ? this.validation[section].message[locale] : "";
					} else {
						return this.validation[section].message ?? {};
					}
				}
				case "value":
				case "errorClass":
				case "boundary": {
					return this.validation[section][valueProp];
				}
				default: {
					return this.validation[section];
				}
			}
		}
	}

	/*
	setValidationValue(section, valueProp, value, locale) {
		if (this.checkValidationEnabled(section)) {
			switch (valueProp) {
				case "message": {
					if (Util.isEmpty(this.validation[section].message)) {
						this.validation[section].message = {};
					}

					if (Util.isNotEmpty(value)) {
						if (locale) {
							this.validation[section].message[locale] = value;
						} else {
							this.validation[section].message = value;
						}
					} else {
						if (locale) {
							delete this.validation[section].message[locale];
						} else {
							delete this.validation[section].message;
						}
					}

					break;
				}
				case "value":
				case "boundary": {
					if (Util.isNotEmpty(value)) {
						this.validation[section][valueProp] = value;
					} else {
						delete this.validation[section][valueProp];
					}
					break;
				}
				default: {
					if (Util.isNotEmpty(value)) {
						this.validation[section] = value;
					} else {
						delete this.validation[section];
					}
				}
			}
		}
	}
		*/

	convertToSelectItem() {
		return {
			label: this.displayName,
			value: this.paramCode
		};
	}

	/**
	 *
	 * @param {Integer} cellIndex
	 * @returns
	 *     If cellIndex is larger than or equal to 0, it means the value type is array
	 *     so that the function returns indexed cell value.
	 */
	getValue(cellIndex) {
		if (this.isGridCell(cellIndex)) {
			if (!this.value) {
				this.value = [];
			}

			return this.value[cellIndex];
		} else {
			return this.value;
		}
	}

	setValue({ value, cellIndex = null, validate = false }) {
		if (this.isGridCell(cellIndex)) {
			if (!this.value) {
				this.value = [];
			}

			this.value[cellIndex] = value;
		} else {
			this.value = value;
		}

		if (validate) {
			this.setDirty();
			this.validate(cellIndex);
		}
	}

	hasValue(cellIndex) {
		return Util.isNotEmpty(this.getValue(cellIndex));
	}

	initValue(cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.setValue({ value: this.defaultValue ?? null, cellIndex: cellIndex });
		} else {
			this.setValue({ value: this.defaultValue ?? null });
		}
	}

	clearValue(cellIndex) {
		this.initValue(cellIndex);
	}

	setTitleBarInfo(property, value) {
		switch (property) {
			case "commentable": {
				this.commentable = value;
				break;
			}
			case "verifiable": {
				this.verifiable = value;
				break;
			}
			case "freezable": {
				this.freezable = value;
				break;
			}
			case "inputStatus": {
				this.inputStatus = value;
				break;
			}
			case "jumpTo": {
				this.jumpTo = value;
				break;
			}
			case "verified": {
				this.verified = value;
				break;
			}
			case "freezed": {
				this.freezed = value;
				break;
			}
		}

		this.refreshKey();
	}

	fireRefresh(cellIndex) {
		Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.paramCode,
			paramVersion: this.paramVersion,
			parameter: this,
			cellIndex: cellIndex
		});
	}

	fireRefreshPreview(cellIndex) {
		if (this.isGridCell(cellIndex)) {
			Event.fire(Event.SX_REFRESH_FORM, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.parent.code,
				paramVersion: this.parent.version,
				parameter: this,
				cellIndex: cellIndex
			});
		} else {
			Event.fire(Event.SX_REFRESH_FORM, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.paramCode,
				paramVersion: this.paramVersion,
				parameter: this,
				cellIndex: cellIndex
			});
		}
	}

	fireFocus(cellIndex) {
		Event.fire(Event.SX_FOCUS, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.paramCode,
			paramVersion: this.paramVersion,
			parameter: this,
			cellIndex: cellIndex
		});
	}

	fireValueChanged(cellIndex) {
		Event.fire(Event.SX_FIELD_VALUE_CHANGED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.paramCode,
			paramVersion: this.paramVersion,
			parameter: this,
			cellIndex: cellIndex
		});
	}

	fireSelectGroup(targetForm) {
		Event.fire(Event.SX_SELECT_GROUP, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	fireCopy(targetForm) {
		Event.fire(Event.SX_COPY_PARAMETER, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	fireDelete(targetForm) {
		Event.fire(Event.SX_DELETE_PARAMETER, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	fireMoveUp(targetForm) {
		Event.fire(Event.SX_MOVE_PARAMETER_UP, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	fireMoveDown(targetForm) {
		Event.fire(Event.SX_MOVE_PARAMETER_DOWN, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	fireParameterSelected(targetForm) {
		Event.fire(Event.SX_PARAMETER_SELECTED, this.namespace, this.namespace, {
			targetFormId: targetForm,
			parameter: this
		});
	}

	validate(cellIndex) {
		let value = this.getValue(cellIndex);
		let numValue = this.uncertainty ? value.value : value;
		let numUncertainty = this.uncertainty ? value.uncertainty : 0;

		for (const validationType in this.validation) {
			const validationValue = this.getValidationValue(validationType, "value");
			const validationBoundary = this.getValidationValue(validationType, "boundary");
			const validationMessage = this.getValidationValue(validationType, "message", this.languageId);
			const validationErrorClass = this.getValidationValue(validationType, "errorClass");

			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (!this.hasValue(cellIndex)) {
						this.error = {
							message: validationMessage,
							errorClass: validationErrorClass
						};

						return;
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

								return;
							}
						}
					} else if (!regExpr.test(value)) {
						this.error = {
							message: validationMessage,
							errorClass: validationErrorClass
						};

						return;
					}

					break;
				}
				case ValidationKeys.MIN_LENGTH: {
					const minLength = validationValue;
					if (Util.isEmpty(minLength)) {
						this.error = {};
						return;
					}

					if (this.localized) {
						for (const locale in value) {
							if (value[locale].length < minLength) {
								this.error = {
									message: validationMessage,
									errorClass: validationErrorClass
								};

								return;
							}
						}
					} else {
						if (value.length < minLength) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}

					break;
				}
				case ValidationKeys.MAX_LENGTH: {
					const maxLength = validationValue;
					if (Util.isEmpty(maxLength)) {
						this.error = {};
						return;
					}

					if (this.localized) {
						for (const locale in value) {
							if (value[locale].length > maxLength) {
								this.error = {
									message: validationMessage,
									errorClass: validationErrorClass
								};

								return;
							}
						}
					} else {
						if (value.length > maxLength) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}

					break;
				}
				case ValidationKeys.NORMAL_MIN: {
					if (Util.isEmpty(value)) {
						this.error = {};
						return;
					}

					if (validationBoundary) {
						if (numValue - numUncertainty < validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					} else {
						if (numValue - numUncertainty <= validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}

					break;
				}
				case ValidationKeys.NORMAL_MAX: {
					if (Util.isEmpty(value)) {
						this.error = {};
						return;
					}

					if (validationBoundary) {
						if (numValue + numUncertainty >= validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					} else {
						if (numValue + numUncertainty > validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}

					break;
				}
				case ValidationKeys.MIN: {
					if (Util.isEmpty(value)) {
						this.error = {};
						return;
					}

					if (validationBoundary) {
						if (numValue - numUncertainty < validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					} else {
						if (numValue - numUncertainty <= validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}

					break;
				}
				case ValidationKeys.MAX: {
					if (Util.isEmpty(value)) {
						this.error = {};
						return;
					}

					if (validationBoundary) {
						if (numValue + numUncertainty > validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					} else {
						console.log("Max validation: ", numValue, numUncertainty, validationValue);
						if (numValue + numUncertainty >= validationValue) {
							this.error = {
								message: validationMessage,
								errorClass: validationErrorClass
							};

							return;
						}
					}
					break;
				}
				case ValidationKeys.CUSTOM: {
					const func = eval(validationValue);

					const valid = func(value);

					if (!valid) {
						this.error = {
							message: validationMessage,
							errorClass: validationErrorClass
						};

						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json) {
		for (const key in json) {
			this[key] = json[key];
		}
	}

	toData() {
		let data = {};

		if (this.hasValue()) {
			data[this.paramCode] = {
				freezed: this.freezed,
				verified: this.verified,
				value: this.value
			};
		}

		return data;
	}

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
		if (Util.isNotEmpty(this.parent)) json.parent = this.parent;
		if (Util.isNotEmpty(this.validation)) json.validation = this.validation;
		if (Util.isNotEmpty(this.defaultValue)) json.defaultValue = this.defaultValue;
		if (Util.isNotEmpty(this.referenceFile)) json.referenceFile = this.referenceFile;
		if (this.showDefinition) json.showDefinition = this.showDefinition;
		if (this.abstractKey) json.abstractKey = this.abstractKey;
		if (this.standard) json.standard = this.standard;
		if (!this.searchable) json.searchable = this.searchable;
		if (!this.downloadable) json.downloadable = this.downloadable;
		if (this.order > 0) json.order = this.order;

		json.status = this.status;
		json.state = this.state;

		json.displayType = this.displayType;

		return json;
	}

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
			order: this.order,
			languageId: this.languageId,
			availableLanguageIds: this.availableLanguageIds,
			focused: this.focused,
			inputStatus: this.inputStatus,
			position: this.position
		};
	}

	renderLabel({ forHtml = this.tagId, spritemap, languageId = this.languageId, style = {} }) {
		style.color = this.inputStatus && !this.hasValue() ? "#ff80b3" : "black";
		style.marginBottom = "0.3rem";
		style.fontSize = "0.825rem";
		style.fontWeight = "600";

		return (
			<div
				key={this.key}
				style={style}
			>
				{this.label}
				{this.required && <SXRequiredMark spritemap={spritemap} />}
				{Util.isNotEmpty(this.tooltip) && (
					<SXTooltip
						tooltip={this.getTooltip()}
						spritemap={spritemap}
					/>
				)}
			</div>
		);
	}

	renderTitle({ spritemap, style }) {
		return (
			<SXTitleBar
				key={Util.randomKey()}
				namespace={this.namespace}
				formId={this.formId}
				parameter={this}
				spritemap={spritemap}
				style={style}
			/>
		);
	}

	getPrefix(languageId = this.languageId) {
		return this.prefix[languageId];
	}

	getPostfix(languageId = this.languageId) {
		return this.postfix[languageId];
	}

	renderPrefix() {
		if (Util.isNotEmpty(this.prefix)) {
			return (
				<ClayInput.GroupItem
					shrink
					style={{ alignContent: "end", marginLeft: "0.5rem" }}
				>
					{this.getPrefix()}
				</ClayInput.GroupItem>
			);
		}
	}

	renderPostfix() {
		if (Util.isNotEmpty(this.postfix)) {
			return (
				<ClayInput.GroupItem
					shrink
					style={{ alignContent: "end" }}
				>
					{this.getPostfix()}
				</ClayInput.GroupItem>
			);
		}
	}

	renderPreview({ dsbuilderId, propertyPanelId, previewCanvasId, className = "", style = {}, spritemap, position }) {
		return (
			<SXPreviewRow
				key={this.key}
				dsbuilderId={dsbuilderId}
				propertyPanelId={propertyPanelId}
				previewCanvasId={previewCanvasId}
				parameter={this}
				spritemap={spritemap}
				position={position}
				className={className}
				style={style}
			/>
		);
	}

	renderField({ className = "", style = {}, spritemap }) {
		return (
			<SXFormField
				key={this.key}
				parameter={this}
				spritemap={spritemap}
				className={className}
				style={style}
			/>
		);
	}
}

/**
 * 01. String
 * 		for <SXInput/> or <SXLocalizedInput/> if localized is true.
 */
export class StringParameter extends Parameter {
	#minLength;
	#maxLength;
	#multipleLine;
	#localized;
	#placeholder;
	#prefix;
	#postfix;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.STRING) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

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
	get prefix() {
		return this.#prefix;
	}
	get postfix() {
		return this.#postfix;
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
	set prefix(val) {
		this.#prefix = val;
	}
	set postfix(val) {
		this.#postfix = val;
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	/**
	 *
	 * @param {Integer} cellIndex
	 * @returns
	 *     If index is larger than or equal to 0, it means the value type is array
	 *     so that the function returns indexed cell value.
	 *     Otherwise, vlaue array is returned when the value type of the parameter is "array",
	 *     and single value when the value type of the parameter is "single".
	 */
	getValue(cellIndex) {
		const value = super.getValue(cellIndex);

		return this.localized ? value ?? {} : value ?? "";
	}

	initValue(cellIndex) {
		this.setValue({ value: this.defaultValue ?? (this.localized ? {} : ""), cellIndex: cellIndex });
	}

	getPlaceholder(languageId) {
		return this.placeholder[languageId];
	}

	getPrefix(languageId) {
		return languageId ?? this.prefix[this.languageId];
	}

	getPostfix(languageId) {
		return languageId ?? this.postfix[this.languageId];
	}

	setPrefix(prefix, languageId) {
		const langKey = languageId ?? this.languageId;

		this.prefix[langKey] = prefix;
	}

	setPostfix(postfix, languageId) {
		const langKey = languageId ?? this.languageId;

		this.postfix[langKey] = postfix;
	}

	getTranslation(languageId, cellIndex) {
		const translations = this.getValue(cellIndex);

		if (!(this.localized && Util.isNotEmpty(translations))) {
			return "";
		}

		return translations[languageId] ?? "";
	}

	setTranslation(languageId, translation, cellIndex) {
		if (!this.localized) {
			return;
		}

		const translations = this.getValue(cellIndex);

		translations[languageId] = translation;

		super.setValue({ value: translations, cellIndex: cellIndex, validate: true });
	}

	getTranslations(cellIndex) {
		const translations = this.getValue(cellIndex);

		return this.localized && Util.isNotEmpty(translations) ? translations : {};
	}

	parse(json = {}) {
		super.parse(json);

		this.minLength = json.minLength ?? 1;
		this.maxLength = json.maxLength ?? 72;
		this.multipleLine = json.multipleLine ?? false;
		this.localized = json.localized ?? false;
		this.placeholder = json.placeholder ?? "";
		this.prefix = json.prefix ?? {};
		this.postfix = json.prefix ?? {};
	}

	toJSON() {
		let json = super.toJSON();

		if (this.minLength > 1) json.minLength = this.minLength;
		if (this.maxLength !== 72) json.maxLength = this.maxLength;
		if (this.multipleLine === true) json.multipleLine = this.multipleLine;
		if (this.localized === true) json.localized = this.localized;
		if (Util.isNotEmpty(this.placeholder)) json.placeholder = this.placeholder;
		if (Util.isNotEmpty(this.prefix)) json.prefix = this.prefix;
		if (Util.isNotEmpty(this.postfix)) json.postfix = this.postfix;

		return json;
	}

	toProperties(tagId, tagName) {
		let json = super.toProperties();

		json.placeholder = this.getPlaceholder(this.languageId);
		json.minLength = this.minLength;
		json.maxLength = this.maxLength;
		json.multipleLine = this.multipleLine;
		json.localized = this.localized;
		json.prefix = this.prefix;
		json.postfix = this.postfix;
		json.value = this.hasValue() ? this.value : this.defaultValue;

		if (tagId) json.tagId = tagId;
		if (tagName) json.tagName = tagName;

		return json;
	}

	render({
		events = {},
		className = "",
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

/**
 * 02. Numeric
 * 		for <SXNumeric/>
 */
export class NumericParameter extends Parameter {
	#decimalPlaces;
	#uncertainty;
	#isInteger;
	#unit;

	#prefix;
	#postfix;

	#min;
	#max;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.NUMERIC) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get uncertainty() {
		return this.#uncertainty;
	}
	get decimalPlaces() {
		return this.#decimalPlaces;
	}
	get isInteger() {
		return this.#isInteger;
	}
	get unit() {
		return this.#unit;
	}
	get valueUncertainty() {
		return this.value.uncertainty;
	}
	get valueValue() {
		return this.value.value;
	}
	get prefix() {
		return this.#prefix;
	}
	get postfix() {
		return this.#postfix;
	}
	get min() {
		return this.#min;
	}
	get max() {
		return this.#max;
	}

	set uncertainty(val) {
		this.#uncertainty = val;
	}
	set decimalPlaces(val) {
		this.#decimalPlaces = val;
	}
	set isInteger(val) {
		this.#isInteger = val;
	}
	set unit(val) {
		this.#unit = val;
	}
	set valueUncertainty(val) {
		this.value.uncertainty = val;
	}
	set valueValue(val) {
		this.value.value = val;
	}
	set prefix(val) {
		this.#prefix = val;
	}
	set postfix(val) {
		this.#postfix = val;
	}
	set min(val) {
		this.#min = val;
	}
	set max(val) {
		this.#max = val;
	}

	initProperties(json = {}) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getValue(cellIndex) {
		let value = super.getValue(cellIndex);

		if (Util.isEmpty(value)) {
			value = this.uncertainty ? {} : "";
		}

		return value;
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? (this.uncertainty ? {} : ""), cellIndex: cellIndex });
	}

	clearValue(cellIndex) {
		this.initValue(cellIndex);
	}

	getValueUncertainty(cellIndex) {
		const value = this.getValue(cellIndex);

		return this.isGridCell(cellIndex) ? this.value[cellIndex].uncertainty : this.value.uncertainty;
	}

	getValueValue(cellIndex) {
		return this.isGridCell(cellIndex) ? this.value[cellIndex].value : this.value.value;
	}

	setValueUncertainty(value, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			if (!this.value) {
				this.value = [];
			}

			if (!this.value[cellIndex]) {
				this.value[cellIndex] = {};
			}
			this.value[cellIndex].uncertainty = value;
		} else {
			if (!this.value) {
				this.value = {};
			}
			this.value.uncertainty = value;
		}

		this.validate(cellIndex);
	}

	setValueValue(value, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			if (!this.value) {
				this.value = [];
			}

			if (!this.value[cellIndex]) {
				this.value[cellIndex] = {};
			}
			this.value[cellIndex].value = value;
		} else {
			if (!this.value) {
				this.value = {};
			}

			this.value.value = value;
		}

		this.validate(cellIndex);
	}

	hasValue(cellIndex) {
		if (!this.value) {
			return false;
		}

		let value = this.isGridCell(cellIndex) ? this.value[cellIndex] : this.value;
		if (Util.isEmpty(value)) {
			return false;
		}

		return value.uncertainty ? Util.isNotEmpty(value.value) : Util.isNotEmpty(value);
	}

	validate(cellIndex) {
		const valueObj = this.getValue(cellIndex);
		const value = this.uncertainty ? valueObj.value : valueObj;
		const uncertainty = this.uncertainty ? valueObj.uncertainty : 0;

		if (isNaN(value)) {
			this.error = {
				message: Util.translate("only-numbers-allowed-for-this-field"),
				errorClass: ErrorClass.ERROR
			};

			return;
		}

		super.validate(cellIndex);
	}

	toNumber() {
		if (!this.hasValue()) {
			return;
		}

		if (this.displayType === Parameter.DisplayTypes.GRID_CELL) {
			return this.uncertainty
				? this.value.map((val) => ({ value: Number(val.value), uncertainty: Number(val.uncertainty) }))
				: this.value.map((val) => Number(val));
		} else {
			return this.uncertainty
				? { value: Number(this.valueValue), uncertainty: Number(this.valueUncertainty) }
				: Number(this.value);
		}
	}

	parse(json) {
		super.parse(json);

		this.uncertainty = json.uncertainty ?? false;
		this.isInteger = json.isInteger ?? false;
		this.decimalPlaces = json.decimalPlaces ?? 1;
		this.unit = json.unit ?? "";
		this.prefix = json.prefix ?? {};
		this.postfix = json.postfix ?? {};
		this.min = json.min;
		this.max = json.max;
	}

	toJSON() {
		let json = super.toJSON();

		if (this.uncertainty === true) json.uncertainty = this.uncertainty;
		if (this.isInteger === true) json.isInteger = this.isInteger;
		if (this.decimalPlaces !== 2) json.decimalPlaces = this.decimalPlaces;
		if (this.unit) json.unit = this.unit;
		if (Util.isNotEmpty(this.prefix)) json.prefix = this.prefix;
		if (Util.isNotEmpty(this.postfix)) json.postfix = this.postfix;
		if (Util.isNotEmpty(this.min)) json.min = this.min;
		if (Util.isNotEmpty(this.max)) json.max = this.max;

		return json;
	}

	toProperties(tagId, tagName) {
		let json = super.toProperties();

		json.uncertainty = this.uncertainty;
		json.isInteger = this.isInteger;
		json.unit = this.unit;
		json.prefix = this.prefix;
		json.postfix = this.postfix;
		json.min = this.min;
		json.max = this.max;
		json.value = this.value ?? this.defaultValue;
		if (Util.isNotEmpty(this.decimalPlaces)) {
			json.decimalPlaces = this.decimalPlaces;
		}

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return json;
	}

	render({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		cellIndex
	}) {
		return (
			<SXNumeric
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

/**
 * 03. Select
 * 		for <SXSelectList/>
 * 			<SXRadioGroup/> if viewType is radio
 */
export class SelectParameter extends Parameter {
	static ViewTypes = {
		DROPDOWN: "dropdown",
		RADIO: "radio",
		CHECKBOX: "checkbox",
		LISTBOX: "listbox"
	};

	#options = [];
	#optionsPerRow = 0;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.SELECT) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get options() {
		return this.#options;
	}
	get optionsPerRow() {
		return this.#optionsPerRow;
	}

	get optionCount() {
		return this.#options.length;
	}

	set options(val) {
		this.#options = val;
	}
	set optionsPerRow(val) {
		this.#optionsPerRow = val;
	}

	initProperties(json = {}) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	isMultiple() {
		return (
			this.viewType === SelectParameter.ViewTypes.CHECKBOX || this.viewType === SelectParameter.ViewTypes.LISTBOX
		);
	}

	checkDuplicatedOptionValue(optionValue) {
		let duplicated = false;
		this.options.every((option) => {
			duplicated = option.value === optionValue;

			return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return duplicated;
	}

	addOption(option) {
		this.#options.push(option);

		this.refreshKey();

		return this.options.length;
	}

	getOption(index) {
		return this.options[index];
	}

	copyOption(index) {
		const insertPlace = index + 1;
		const newOption = { ...this.getOption(index), value: "" };
		this.options = [...this.options.slice(0, insertPlace), newOption, ...this.options.slice(insertPlace)];

		this.refreshKey();
		return newOption;
	}

	removeOption(index) {
		this.#options.splice(index, 1);

		this.refreshKey();

		return this.#options.length > 0 ? this.#options[0] : {};
	}

	switchOptions(index1, index2) {
		let elem1 = this.#options[index1];
		this.#options[index1] = this.#options[index2];
		this.#options[index2] = elem1;

		this.refreshKey();
	}

	moveOptionUp(index) {
		if (index === 0) {
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

	initValue(cellIndex) {
		let value = this.defaultValue;
		if (this.isMultiple()) {
			value = this.defaultValue ?? [];
		}

		super.setValue({ value: value, cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json) {
		super.parse(json);

		this.options = json.options ?? [];
		this.viewType = json.viewType ?? SelectParameter.ViewTypes.DROPDOWN;
		this.optionsPerRow = json.optionsPerRow ?? 0;
	}

	toJSON() {
		let json = super.toJSON();

		json.viewType = this.viewType;
		if (Util.isNotEmpty(this.options)) json.options = this.options;

		if (this.viewType === SelectParameter.ViewTypes.RADIO || this.viewType === SelectParameter.ViewTypes.CHECKBOX) {
			if (this.optionsPerRow > 0) {
				json.optionsPerRow = this.optionsPerRow;
			}
		}

		return json;
	}

	toProperties(tagId, tagName) {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.options = this.options.map((option) => ({ label: option.label[this.languageId], value: option.value }));
		json.optionsPerRow = this.optionsPerRow;

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return json;
	}

	render({
		events = {},
		className = "",
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

/**
 * 04. DualList
 *
 */
export class DualListParameter extends Parameter {
	static ViewTypes = {
		HORIZONTAL: "horizontal",
		VERTICAL: "vertical"
	};
	#options;
	#viewType;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.DUALLIST) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get options() {
		return this.#options;
	}
	get viewType() {
		return this.#viewType;
	}

	set options(val) {
		this.#options = val;
	}
	set viewType(val) {
		this.#viewType = val;
	}

	initProperties(json = {}) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? [], cellIndex: cellIndex });
	}

	setValue({ value, cellIndex }) {
		const values = value.map((option) => option.value);
		console.log(
			"DualList values: ",
			values,
			this.options,
			this.options.filter((option) => values.includes(option.value))
		);
		super.setValue({
			value: this.options.filter((option) => values.includes(option.value)),
			cellIndex: cellIndex,
			validate: true
		});
	}

	getLeftOptions(cellIndex) {
		const value = this.getValue(cellIndex) ?? [];
		//const value = this.getValue(cellIndex).map((val) => ({ displayName: val.displayName, value: val.id })) ?? [];

		return value.map((option) => ({
			key: option.value,
			label: option.label[this.languageId],
			value: option.value
		}));
	}

	getRightOptions(cellIndex) {
		return this.options
			.filter((option) => this.notIncludedInValues(option.value, cellIndex))
			.map((option) => ({
				key: option.value,
				label: option.label[this.languageId],
				value: option.value
			}));
	}

	addValue(val) {
		this.value.push(val);
	}

	includedInValues(value, cellIndex) {
		const values = this.getValue(cellIndex);

		const result = values.filter((val) => val.value === value);
		return result.length > 0;
	}

	notIncludedInValues(value, cellIndex) {
		return !this.includedInValues(value, cellIndex);
	}

	removeValue(val) {
		if (!this.hasValue()) {
			return;
		}

		this.value = this.value.filter((elem) => elem.value !== val);
	}

	/*
	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}
		*/

	parse(json) {
		super.parse(json);

		this.viewType = json.viewType ?? DualListParameter.ViewTypes.HORIZONTAL;
	}

	toJSON() {
		let json = super.toJSON();

		json.options = this.options;
		json.viewType = this.viewType;
	}

	toProperties(tagId, tagName) {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.leftOptions = this.value;
		json.options = this.options;

		if (tagId) json.tagId = tagId;
		if (tagName) json.tagName = tagName;

		return json;
	}

	render({
		events = {},
		className = "",
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

/**
 * 06. Boolean
 *
 */
export class BooleanParameter extends SelectParameter {
	static ViewTypes = {
		CHECKBOX: "checkbox",
		TOGGLE: "toggle",
		RADIO: "radio",
		DROPDOWN: "dropdown"
	};

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.BOOLEAN) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get trueOption() {
		return this.options[1];
	}
	get trueLabel() {
		return this.trueOption.label;
	}
	get falseOption() {
		return this.options[0];
	}
	get falseLabel() {
		return this.falseOption.label;
	}
	get allowUnsetValue() {
		return (
			this.viewType === BooleanParameter.ViewTypes.RADIO || this.viewType === BooleanParameter.ViewTypes.DROPDOWN
		);
	}

	set trueOption(option) {
		this.options[1] = option;
	}
	set trueLabel(label) {
		this.trueOption.label = label;
	}
	set falseOption(option) {
		this.options[0] = option;
	}
	set falseLabel(label) {
		this.falseOption.label = label;
	}

	initProperties(json = {}) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getTrueLabel(languageId) {
		const langId = languageId ?? this.languageId;

		return Parameter.getTranslation(this.trueLabel, langId);
	}

	getFalseLabel(languageId) {
		const langId = languageId ?? this.languageId;

		return Parameter.getTranslation(this.falseLabel, langId);
	}

	initValue(cellIndex) {
		let defaultValue = this.defaultValue;
		if (
			this.viewType === BooleanParameter.ViewTypes.CHECKBOX ||
			this.viewType === BooleanParameter.ViewTypes.TOGGLE
		) {
			defaultValue = this.defaultValue ?? false;
		}

		super.setValue({ value: defaultValue, cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json) {
		super.parse(json);

		this.viewType = json.viewType ?? BooleanParameter.ViewTypes.CHECKBOX;

		if (Util.isEmpty(this.options)) {
			const falseOption = {
				label: {},
				value: false
			};
			falseOption.label[this.languageId] = Util.translate("no");
			const trueOption = {
				label: {},
				value: false
			};
			trueOption.label[this.languageId] = Util.translate("yes");

			this.options = [falseOption, trueOption];
		}
	}

	toJSON() {
		return super.toJSON();
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties(tagId, tagName);

		properties.trueLabel = this.getTrueLabel(this.languageId);
		properties.falseLabel = this.getFalseLabel(this.languageId);

		properties.value = this.value ?? !!this.defaultValue;

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		cellIndex
	}) {
		return (
			<SXBoolean
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

/**
 * 07. Matrix
 *
 */
export class MatrixParameter extends Parameter {
	#rowCount = 3;
	#colCount = 3;
	#delimiter = " ";
	#bracket = "[]";

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.MATRIX) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get rowCount() {
		return this.#rowCount;
	}
	get colCount() {
		return this.#colCount;
	}
	get bracket() {
		return this.#bracket;
	}
	get delimiter() {
		return this.#delimiter;
	}

	set rowCount(val) {
		this.#rowCount = val;
	}
	set colCount(val) {
		this.#colCount = val;
	}
	set bracket(val) {
		this.#bracket = val;
	}
	set delimiter(val) {
		this.#delimiter = val;
	}

	initProperties(json = {}) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? [], cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json) {
		super.parse(json);

		this.rowCount = json.rowCount ?? 3;
		this.colCount = json.colCount ?? 3;
		this.bracket = json.bracket ?? "[]";
		this.delimiter = json.delimiter ?? " ";
	}

	toJSON() {
		let json = super.toJSON();

		json.rowCount = this.rowCount;
		json.colCount = this.colCount;

		if (this.bracket !== "[]") json.bracket = this.bracket;
		if (this.delimiter != " ") json.delimiter = this.delimiter;

		return json;
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		properties.rowCount = this.rowCount;
		properties.colCount = this.colCount;
		properties.bracket = this.bracket ?? "[]";
		properties.delimiter = this.delimiter ?? " ";

		return properties;
	}

	render({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		cellIndex
	}) {
		return (
			<SXMatrix
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

/**
 * 08. File
 *
 */
export class FileParameter extends Parameter {
	constructor(namespace, formId, languageId, availableLanguageIds, json) {
		super(namespace, formId, languageId, availableLanguageIds, ParamType.FILE);
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? [], cellIndex: cellIndex });
	}

	getFiles(cellIndex) {
		return this.getValue(cellIndex);
	}

	setFiles(val, cellIndex) {
		this.setValue(val, cellIndex);
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json = {}) {
		super.parse(json);
	}

	toJSON() {
		return super.toJSON();
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
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

/**
 * 09. Address
 *
 */
export class AddressParameter extends Parameter {
	static ViewTypes = {
		INLINE: "inline",
		BLOCK: "block",
		ONE_LINE: "oneLine"
	};

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.ADDRESS) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getValue(cellIndex) {
		const value = super.getValue(cellIndex);

		return !value ? {} : value;
	}

	getZipcode(cellIndex) {
		const value = this.getValue(cellIndex);

		return Util.isEmpty(value.zipcode) ? "" : value.zipcode;
	}
	getStreet(cellIndex) {
		const value = this.getValue(cellIndex);

		return Util.isEmpty(value.street) ? "" : value.street;
	}
	getAddress(cellIndex) {
		const value = this.getValue(cellIndex);

		return Util.isEmpty(value.address) ? "" : value.address;
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
		return this.getZipcode(cellIndex) + ", " + this.getStreet(cellIndex) + ", " + this.getAddress(cellIndex);
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json = {}) {
		super.parse(json);

		this.viewType = json.viewType ?? AddressParameter.ViewTypes.BLOCK;
	}

	toJSON() {
		return super.toJSON();
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
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

/**
 * 10. Date
 *
 */
export class DateParameter extends Parameter {
	#enableTime;
	#startYear;
	#endYear;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.DATE) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}
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

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getDate(cellIndex) {
		const value = super.getValue(cellIndex);

		return !!value ? new Date(value) : new Date();
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? "", cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json = {}) {
		super.parse(json);

		this.enableTime = json.enableTime ?? false;
		this.startYear = json.startYear ?? "1970";
		this.endYear = json.endYear ?? new Date().getFullYear().toString();
	}

	toJSON() {
		let json = super.toJSON();

		if (this.enableTime) json.enableTime = this.enableTime;

		json.startYear = this.startYear ?? "1970";
		json.endYear = this.endYear ?? new Date().getFullYear().toString();

		return json;
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		properties.enableTime = this.enableTime;

		properties.startYear = this.startYear;
		properties.endYear = this.endYear;

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
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

/**
 * 11. Phone
 *
 */
export class PhoneParameter extends Parameter {
	#enableCountryNo;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.PHONE) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getCountryNo(cellIndex) {
		return this.isGridCell(cellIndex) ? this.value[cellIndex].countryNo : this.value.countryNo;
	}
	getAreaNo(cellIndex) {
		return this.isGridCell(cellIndex) ? this.value[cellIndex].areaNo : this.value.areaNo;
	}
	getStationNo(cellIndex) {
		return this.isGridCell(cellIndex) ? this.value[cellIndex].stationNo : this.value.stationNo;
	}
	getPersonalNo(cellIndex) {
		return this.isGridCell(cellIndex) ? this.value[cellIndex].personal : this.value.personal;
	}
	get enableCountryNo() {
		return this.#enableCountryNo;
	}

	setCountryNo(val, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.value[cellIndex].countryNo;
		} else {
			this.value.countryNo = val;
		}
	}
	setAreaNo(val, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.value[cellIndex].areaNo;
		} else {
			this.value.areaNo = val;
		}
	}
	setStationNo(val, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.value[cellIndex].stationNo;
		} else {
			this.value.stationNo = val;
		}
	}
	setPersonalNo(val, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.value[cellIndex].personalNo;
		} else {
			this.value.personalNo = val;
		}
	}
	set enableCountryNo(val) {
		this.#enableCountryNo = val;
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json = {}) {
		super.parse(json);

		this.enableCountryNo = json.enableCountryNo ?? "";
	}

	toJSON() {
		let json = super.toJSON();

		if (this.enableCountryNo) json.enableCountryNo = this.enableCountryNo;

		return json;
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		properties.enableCountryNo = this.enableCountryNo;

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
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

/**
 * 12. EMail
 *
 */
export class EMailParameter extends Parameter {
	static SERVERS = ["gmail.com", "daum.net", "naver.com"];

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.EMAIL) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);

		/*
		this.validation.pattern = {
			value: "^[a-z][a-zA-Z0-9._%+-]+@[a-z][a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
			message:Util.getTranslationObject(this.languageId, "wrong-email-pattern"),
			errorClass: ErrorClass.ERROR
		};
		*/
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue();
		}
	}

	getEmailId(cellIndex) {
		const value = super.getValue(cellIndex);

		if (Util.isEmpty(value)) {
			return "";
		} else {
			return this.value.emailId;
		}
	}

	getServerName(cellIndex) {
		const value = super.getValue(cellIndex);

		if (Util.isEmpty(value)) {
			return "";
		} else {
			return this.value.serverName;
		}
	}

	setEmailId(value, cellIndex) {
		const serverName = this.getServerName(cellIndex);
		super.setValue({ emailId: value, serverName: serverName }, cellIndex);

		this.setDirty();
	}
	setServerName(value, cellIndex) {
		if (this.isGridCell(cellIndex)) {
			this.value[cellIndex].serverName = value;
		} else {
			this.value.serverName = value;
		}

		this.setDirty();
	}

	getEmailAddress(cellIndex) {
		const value = super.getValue(cellIndex);
		if (Util.isEmpty(value)) {
			return "";
		} else {
			return value.emailId + "@" + value.serverName;
		}
	}

	checkValidEmail(cellIndex) {
		const value = this.isGridCell(cellIndex) ? this.value[cellIndex] : this.value;
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
	}

	validate(cellIndex) {
		for (const validationType in this.validation) {
			switch (validationType) {
				case ValidationKeys.REQUIRED: {
					if (this.validation.required.value && !this.hasValue(cellIndex)) {
						this.error = {
							message: this.getValidationValue(validationType, "message", this.languageId),
							errorClass: ErrorClass.ERROR
						};

						return;
					}

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.error = this.validation.custom(this.getValue(cellIndex));

					if (this.hasError()) {
						return;
					}
				}
			}
		}

		this.error = {
			message: "",
			errorClass: ErrorClass.SUCCESS
		};
	}

	parse(json = {}) {
		super.parse(json);
	}

	toString() {
		return this.value.emailId + "@" + this.value.serverName;
	}

	toJSON() {
		return super.toJSON();
	}

	toProperties(tagId, tagName) {
		let properties = super.toProperties();

		if (tagId) properties.tagId = tagId;
		if (tagName) properties.tagName = tagName;

		return properties;
	}

	render({
		events = {},
		className = "",
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

/**
 * 13. Group
 *
 */
export class GroupParameter extends Parameter {
	static ROOT_GROUP = "__root__";

	static ViewTypes = {
		ARRANGEMENT: "arrangement", // Just for arrangement for all members
		FIELDSET: "fieldset",
		PANEL: "panel",
		TABLE: "table",
		SHARED_LABLE_TABLE: "sharedLabelTable",
		SHARED_OPTION_TABLE: "sharedOptionTable"
	};

	#members = [];
	#membersPerRow = 1;
	#expanded = false;
	#titleDisplay = false;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.GROUP) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

	get members() {
		return this.#members;
	}
	get memberCount() {
		return this.members.length;
	}
	get firstMember() {
		return this.members.length > 0 ? this.members[0] : null;
	}
	get lastMember() {
		return this.members.length > 0 ? this.members[this.members.length - 1] : null;
	}

	get membersPerRow() {
		return this.#membersPerRow;
	}
	get expanded() {
		return this.#expanded;
	}
	get titleDisplay() {
		return this.#titleDisplay;
	}
	get totalFieldsCount() {
		let totalFields = 0;
		this.members.forEach((field) => {
			totalFields += field.totalFieldsCount;
		});

		return totalFields;
	}
	get valuedFieldsCount() {
		let valuedFields = 0;
		this.members.forEach((field) => {
			valuedFields += field.valuedFieldsCount;
		});

		return valuedFields;
	}

	get showMembersPerRow() {
		return (
			this.viewType === GroupParameter.ViewTypes.ARRANGEMENT || this.viewType === GroupParameter.ViewTypes.PANEL
		);
	}

	set members(val) {
		this.#members = val;
	}
	set membersPerRow(val) {
		this.#membersPerRow = val;
	}
	set expanded(val) {
		this.#expanded = val;
	}
	set titleDisplay(val) {
		this.#titleDisplay = val;
	}

	get paramCode() {
		return super.paramCode;
	}
	set paramCode(val) {
		super.paramCode = val;

		this.updateMemberParents();
	}
	get paramVersion() {
		return super.paramVersion;
	}
	set paramVersion(val) {
		super.paramVersion = val;

		this.updateMemberParents();
	}

	initProperties(json) {
		this.parse(json);

		this.value = {};
	}

	hasMembers() {
		return this.memberCount > 0;
	}

	checkDuplicateParam(param) {
		let duplicated = this.paramCode === param.paramCode;

		if (!duplicated) {
			this.members.every((member) => {
				if (param !== member) {
					duplicated = member.checkDuplicateParam(param);
				}

				return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
			});
		}

		return duplicated;
	}

	updateMemberParents() {
		this.#members.forEach((member) => (member.parent = { code: this.paramCode, version: this.paramVersion }));
	}

	setMemberOrders() {
		this.members.forEach((member, index) => (member.order = index + 1));
	}

	addMember(member, memOrder = this.members.length) {
		this.setMemberDisplayType(member);

		member.parent = { code: this.paramCode, version: this.paramVersion };

		member.order = this.members.length + 1;

		member.initValue();
		this.members.push(member);

		this.setDirty();
	}

	setMemberDisplayType(member) {
		switch (this.viewType) {
			case GroupParameter.ViewTypes.ARRANGEMENT:
			case GroupParameter.ViewTypes.PANEL: {
				member.displayType = Parameter.DisplayTypes.FORM_FIELD;
				break;
			}
			case GroupParameter.ViewTypes.TABLE: {
				member.displayType = Parameter.DisplayTypes.TABLE_ROW;
				break;
			}
			case GroupParameter.ViewTypes.SHARED_OPTION_TABLE: {
				member.displayType = Parameter.DisplayTypes.SHARED_OPTION_TABLE_ROW;
				break;
			}
		}
	}

	insertMember(param, memOrder) {
		if (this.members.length === 0 || memOrder === this.members.length) {
			this.members.push(param);
		} else if (memOrder === 0) {
			this.#members.unshift(param);
		} else {
			this.members.splice(memOrder, 0, param);
		}

		this.setMemberOrders();
		this.setDirty();
	}

	isMember(paramCode, paramVersion) {
		let isMember = false;

		this.members.every((member) => {
			if (member.equalTo(paramCode, paramVersion)) {
				isMember = true;

				return Constant.STOP_EVERY;
			}

			return Constant.CONTINUE_EVERY;
		});

		return isMember;
	}

	deleteMemberByIndex(index) {
		const removed = this.members[index];

		this.members.splice(index, 1);

		this.setMemberOrders();
		this.setDirty();

		return removed;
	}

	deleteMemberByCode(memCode, memVersion) {
		let order = -1;

		this.members.every((member, index) => {
			if (!memVersion && member.paramCode === memCode) {
				order = index;
			} else if (member.paramVersion === memVersion && member.paramCode === memCode) {
				order = index;
			}

			return order > 0 ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		if (order >= 0) {
			return this.deleteMemberByIndex(order);
		}
	}

	removeMember({ paramCode, paramVersion, memOrder }) {
		const removed = Util.isEmpty(memOrder)
			? this.deleteMemberByCode(paramCode, paramVersion)
			: this.deleteMemberByIndex(memOrder);

		return removed;
	}

	copyMemberByIndex(index) {
		const copied = this.members[index].copy();

		this.insertMember(copied, index + 1);

		this.setDirty();

		return copied;
	}

	copyMemberByCode(memCode, memVersion) {
		let order = -1;

		this.members.every((member, index) => {
			if (!memVersion && member.paramCode === memCode) {
				order = index;
			} else if (member.paramVersion === memVersion && member.paramCode === memCode) {
				order = index;
			}

			return order > 0 ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		if (order >= 0) {
			return this.copyMemberByIndex(order);
		}
	}

	copyMember({ paramCode, paramVersion, memOrder }) {
		return Util.isEmpty(memOrder)
			? this.copyMemberByCode(paramCode, paramVersion)
			: this.copyMemberByIndex(memOrder);
	}

	getMember(index) {
		return this.members[index];
	}

	findParameter({ paramCode, paramVersion = Parameter.DEFAULT_VERSION, descendant = true }) {
		if (this.equalTo(paramCode, paramVersion)) {
			return this;
		}

		let found = null;

		this.members.every((field) => {
			if (field.equalTo(paramCode, paramVersion)) {
				found = field;
			} else if (descendant && field.isGroup) {
				found = field.findParameter({
					paramCode: paramCode,
					paramVersion: paramVersion,
					descendant: descendant
				});
			}

			return found ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return found;
	}

	moveMemberUp(paramOrder) {
		const srcIndex = paramOrder;
		const targetIndex = srcIndex - 1;
		const targetParam = this.members[targetIndex];
		this.members[targetIndex] = this.members[srcIndex];
		this.members[targetIndex].refreshKey();
		this.members[srcIndex] = targetParam;
		this.members[srcIndex].refreshKey();

		this.setMemberOrders();
	}

	moveMemberDown(paramOrder) {
		const srcIndex = paramOrder;
		const targetIndex = srcIndex + 1;
		const targetParam = this.members[targetIndex];
		this.members[targetIndex] = this.members[srcIndex];
		this.members[srcIndex] = targetParam;

		this.setMemberOrders();
	}

	postfixParameterCode(postfix) {
		this.paramCode += "_" + postfix;
		this.paramVersion = Parameter.DEFAULT_VERSION;

		this.members.forEach((member, index) => member.postfixParameterCode(postfix + "_" + index));
	}

	getMemberPosition(member) {
		if (this.members.length === 1 && member.order === 1) {
			return Constant.Position.DEAD_END;
		} else if (member.order === 1) {
			return Constant.Position.START;
		} else if (member.order === this.members.length) {
			return Constant.Position.END;
		}

		return Constant.Position.MIDDLE;
	}

	setDisabled(disabled) {
		this.disabled = disabled;

		this.members.forEach((member) => member.setDisabled(disabled));
	}

	checkError() {
		if (this.hasError()) {
			return this.error;
		}

		let error = null;
		this.members.every((member) => {
			error = member.checkError();

			return Util.isEmpty(error) ? Constant.CONTINUE_EVERY : Constant.STOP_EVERY;
		});

		return error;
	}

	copy() {
		const copied = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			this.paramType,
			JSON.parse(JSON.stringify(this))
		);

		copied.postfixParameterCode("copied");

		return copied;
	}

	countParameters() {
		return this.members.length;
	}

	setTitleBarInfo(property, value, setMembers = true) {
		super.setTitleBarInfo(property, value);

		if (setMembers) {
			this.members.forEach((member) => {
				member.setTitleBarInfo(property, value);
			});
		}
	}

	focus(paramCode, paramVersion) {
		this.focused = this.equalTo(paramCode, paramVersion);

		this.members.forEach((param) => {
			param.focus(paramCode, paramVersion);
		});
	}

	loadData(data) {
		this.members.forEach((member) => {
			const value = data[member.paramCode];
			if (Util.isNotEmpty(value)) {
				member.loadData(value);
			}
		});
	}

	superParse(json) {
		super.parse(json);
	}

	superToJSON() {
		return super.toJSON();
	}

	supertoProperties() {
		return super.toProperties();
	}

	parse(json = {}) {
		super.parse(json);

		this.viewType = this.viewType ?? GroupParameter.ViewTypes.PANEL;
		this.membersPerRow = json.membersPerRow ?? 1;
		this.expanded = json.expanded ?? false;

		if (Util.isNotEmpty(json.members)) {
			this.members = json.members.map((member) => {
				let parameter;
				if (member instanceof Parameter) {
					parameter = member;
				} else {
					parameter = Parameter.createParameter(
						this.namespace,
						this.formId,
						this.languageId,
						this.availableLanguageIds,
						member.paramType,
						member
					);
				}

				this.setMemberDisplayType(parameter);

				return parameter;
			});
		}
	}

	toData() {
		let memberOutputs = {};
		this.members.forEach((member) => {
			const memberData = member.toData();

			if (Util.isNotEmpty(memberData)) {
				memberOutputs = { ...memberOutputs, ...memberData };
			}
		});

		if (Util.isEmpty(memberOutputs)) {
			return memberOutputs;
		}

		if (this.viewType === GroupParameter.ViewTypes.ARRANGEMENT) {
			return memberOutputs;
		} else {
			let groupOutput = {};
			groupOutput[this.paramCode] = {
				freezed: this.freezed,
				verified: this.verified,
				value: memberOutputs
			};

			return groupOutput;
		}
	}

	toJSON() {
		let json = super.toJSON();

		if (this.viewType !== GroupParameter.ViewTypes.PANEL) json.viewType = this.viewType;
		if (this.membersPerRow > 1) json.membersPerRow = this.membersPerRow;
		if (this.expanded) json.expanded = this.expanded;

		let jsonMembers = [];
		this.members.forEach((member) => {
			jsonMembers.push(member.toJSON());
		});

		json.members = jsonMembers;

		return json;
	}

	toProperties(tagId, tagName) {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.fieldsPerRow = this.membersPerRow;
		json.expanded = this.expanded;

		json.tagId = tagId;
		json.tagName = tagName;

		json.members = this.members.map((member) => {
			return member.toProperties(member.paramCode, member.paramCode);
		});

		return json;
	}

	renderField({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		dsbuilderId,
		propertyPanelId,
		previewCanvasId,
		cellIndex
	}) {
		return (
			<div
				key={this.key}
				style={{ marginBottom: "1.0rem" }}
			>
				{this.render({
					event: events,
					className: className,
					style: style,
					spritemap: spritemap,
					displayType: displayType,
					viewType: viewType,
					preview: false,
					dsbuilderId: dsbuilderId,
					propertyPanelId: propertyPanelId,
					previewCanvasId: previewCanvasId,
					cellIndex: cellIndex
				})}
			</div>
		);
	}

	render({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		preview = false,
		dsbuilderId,
		propertyPanelId,
		previewCanvasId,
		cellIndex
	}) {
		return (
			<SXGroup
				key={this.key}
				parameter={this}
				formId={this.formId}
				events={events}
				className={className}
				style={style}
				spritemap={spritemap}
				displayType={displayType}
				viewType={viewType}
				cellIndex={cellIndex}
				preview={preview}
				dsbuilderId={dsbuilderId}
				propertyPanelId={propertyPanelId}
				previewCanvasId={previewCanvasId}
			/>
		);
	}
}

/**
 * 14. Grid
 *
 */
export class GridParameter extends GroupParameter {
	#rowCount = 0;

	constructor(namespace, formId, languageId, availableLanguageIds, paramType = ParamType.GRID) {
		super(namespace, formId, languageId, availableLanguageIds, paramType);
	}

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

	set columns(val) {
		this.members = val;
	}
	set rowCount(val) {
		this.#rowCount = val;
	}

	initProperties(json) {
		this.parse(json);

		if (!this.hasValue()) {
			this.initValue(0);
		}
	}

	addMember(column) {
		column.parent = { code: this.paramCode, version: this.paramVersion };
		column.displayType = Parameter.DisplayTypes.GRID_CELL;

		column.order = this.columnCount + 1;
		column.formId = this.tagName;

		this.columns.push(column);

		this.setDirty();
	}

	insertColumn(column, colOrder) {
		this.insertMember(column, colOrder);
	}

	isColumn(colCode, colVersion) {
		return this.isMember(colCode, colVersion);
	}

	removeColumn({ colCode, colVersion = Parameter.DEFAULT_VERSION }) {
		return this.removeMember({ paramCode: colCode, paramVersion: colVersion });
	}

	/**
	 * Deletes a column from the grid.
	 *
	 * @param {integer} colIndex: 1 to column count
	 */
	deleteColumn(colIndex) {
		this.removeMember({ memOrder: colIndex });
	}

	findColumn({ colCode, colVersion = Parameter.DEFAULT_VERSION }) {
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

			column.refreshKey();
		});

		this.rowCount++;

		this.dirty = true;
		this.refreshKey();
	}

	copyRow(rowIndex) {
		const copyedIndex = rowIndex + 1;

		this.columns.forEach((column) => {
			column.value.splice(copyedIndex, 0, null);

			column.setValue({ value: column.getValue(rowIndex), cellIndex: copyedIndex });
			column.refreshKey();
		});

		this.rowCount++;

		this.dirty = true;
		this.refreshKey();
	}

	deleteRow(rowIndex) {
		this.columns.forEach((column) => {
			column.value.splice(rowIndex, 1);
			column.refreshKey();
		});

		if (this.rowCount > 1) {
			this.rowCount--;
		}

		this.dirty = true;
		this.refreshKey();
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

		this.dirty = true;
		this.refreshKey();
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

		this.dirty = true;
		this.refreshKey();
	}

	checkError() {
		if (this.hasError()) {
			return this.error;
		}

		let error = null;
		this.members.every((member) => {
			error = member.checkError();

			return Util.isEmpty(error) ? Constant.CONTINUE_EVERY : Constant.STOP_EVERY;
		});

		return error;
	}

	setTitleBarInfo(property, value) {
		super.setTitleBarInfo(property, value, false);
	}

	fireColumnSelected(colCode, targetForm) {
		let colFound;

		this.columns.every((column) => {
			if (column.paramCode === colCode) {
				colFound = column;

				return Constant.STOP_EVERY;
			}

			return Constant.CONTINUE_EVERY;
		});

		if (colFound) {
			colFound.fireParameterSelected(targetForm);
		}
	}

	parse(json = {}) {
		super.superParse(json);

		this.rowCount = json.rowCount ?? 0;

		if (Util.isNotEmpty(json.columns)) {
			this.columns = json.columns.map((column) => {
				return Parameter.createParameter(
					this.namespace,
					this.tagName,
					this.languageId,
					this.availableLanguageIds,
					column.paramType,
					column
				);
			});
		}
	}

	toJSON() {
		let json = super.superToJSON();

		json.rowCount = this.rowCount;

		json.columns = [];
		this.columns.forEach((column) => json.columns.push(column.toJSON()));

		return json;
	}

	toProperties(tagId, tagName) {
		let json = super.superToProperties();

		json.tagId = tagId;
		json.tagName = tagName;

		json.rowCount = this.rowCount;

		json.columns = this.columns.map((column) => {
			return column.toProperties(column.tagId, column.tagName);
		});

		return json;
	}

	render({
		events = {},
		className = "",
		style = {},
		spritemap,
		displayType = this.displayType,
		viewType = this.viewType,
		preview = false,
		dsbuilderId,
		propertyPanelId,
		previewCanvasId,
		cellIndex
	}) {
		return (
			<SXGrid
				key={this.key}
				parameter={this}
				formId={this.formId}
				events={events}
				className={className}
				style={style}
				spritemap={spritemap}
				displayType={displayType}
				viewType={viewType}
				cellIndex={cellIndex}
				preview={preview}
				dsbuilderId={dsbuilderId}
				propertyPanelId={propertyPanelId}
				previewCanvasId={previewCanvasId}
			/>
		);
	}
}
