import React from "react";
import { Constant, ParamType, ValidationKeys, ErrorClass, Event } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import SXFormField, { SXFormFieldFeedback, SXRequiredMark, SXTitleBar, SXTooltip } from "../Form/form";
import { ClayInput } from "@clayui/form";
import SXPreviewRow from "../Form/preview-row";
import ParameterConstants from "./parameter-constants";

import SXLocalizedInput from "../Form/localized-input";
import SXInput from "../Form/input";
import SXSelect from "../Form/select";
import SXAddress from "../Form/address";
import SXBoolean from "../Form/boolean";
import SXDate from "../Form/date";
import SXDualListBox from "../Form/duallist";
import SXEMail from "../Form/email";
import SXFile from "../Form/file";
import SXGrid from "../Form/grid";
import SXGroup from "../Form/group";
import SXMatrix from "../Form/matrix";
import SXNumeric from "../Form/numeric";
import SXPhone from "../Form/phone";
import SXCommentDisplayer from "../../stationx/comment";

export class ParameterUtil {
	static createParameter({ namespace, formId, paramType, properties = {} }) {
		let parameter;
		switch (paramType) {
			case ParamType.STRING: {
				parameter = new StringParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.NUMERIC: {
				parameter = new NumericParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.BOOLEAN: {
				parameter = new BooleanParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.SELECT: {
				parameter = new SelectParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case "DualList": {
				parameter = new DualListParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.MATRIX: {
				parameter = new MatrixParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.FILE: {
				parameter = new FileParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.ADDRESS: {
				parameter = new AddressParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.EMAIL: {
				parameter = new EMailParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.DATE: {
				parameter = new DateParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.PHONE: {
				parameter = new PhoneParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.GROUP: {
				parameter = new GroupParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.GRID: {
				parameter = new GridParameter({
					namespace: namespace,
					formId: formId
				});
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

		parameter.initProperties(properties);

		return parameter;
	}

	constructor() {}
}

class Parameter {
	#paramId = 0;
	#paramType;
	#paramCode = "";
	#paramVersion = ParameterConstants.DEFAULT_VERSION;
	#displayName = {};
	#displayType = ParameterConstants.DisplayTypes.FORM_FIELD;
	#disabled = false;
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
	#parent = {};
	#standard = false;
	#status = Constant.Status.PENDING;
	#state = Constant.State.ACTIVE;
	#referenceFile = {};
	#position = Constant.Position.MIDDLE;

	#commentable = false;
	#verifiable = false;
	#freezable = false;

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
	commentFreezed = false;
	commentFreezeUserId;
	commentFreezeUserName;
	commentFreezeDate;
	actionHistories = [];
	freezed = false;
	freezedUserId;
	freezedUserName;
	freezedDate;
	verified = false;
	verifiedUserId;
	verifiedUserName;
	verifiedDate;

	activeActionItems = false;
	/* End of volatile variable */

	constructor({ namespace, formId, paramType }) {
		this.namespace = namespace;
		this.formId = formId;
		this.#paramType = paramType;
	}

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
	get parent() {
		return this.#parent;
	}
	get parentCode() {
		return Util.isEmpty(this.parent) ? "" : this.parent.code;
	}
	get parentVersion() {
		return Util.isEmpty(this.parent) ? "" : this.parent.version;
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
		return this.state == Constant.State.ACTIVE || this.state == Constant.State.DISABLED;
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
		return this.error.message ?? "";
	}
	get errorClass() {
		return this.error.errorClass ?? "";
	}
	get referenceFile() {
		return this.#referenceFile;
	}

	get title() {
		const locales = Object.keys(this.displayName);
		let title = {};
		locales.forEach((locale) => {
			title[locale] = this.displayName[locale] + " v." + this.paramVersion;
		});

		return title;
	}
	get localizedTitle() {
		const title = this.displayName[this.languageId];
		return title ? "" : title + " v." + this.paramVersion;
	}

	get componentId() {
		return this.namespace + this.paramCode + "_" + this.paramVersion;
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
	get commentable() {
		return this.#commentable;
	}
	get verifiable() {
		return this.#verifiable;
	}
	get freezable() {
		return this.#freezable;
	}

	get rowCount() {
		if (this.displayType !== ParameterConstants.DisplayTypes.GRID_CELL) {
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
		this.#referenceFile = val;
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
		console.log("Parameter key refreshed: ", this.paramCode);
		this.key = Util.randomKey();

		return this.key;
	}

	hasComments() {
		return Util.isNotEmpty(this.comments);
	}

	hasReferenceFile() {
		return Util.isNotEmpty(this.referenceFile);
	}

	checkDuplicateParamCode(param) {
		return this.paramCode == param.paramCode;
	}

	checkDuplicateParam(param) {
		return this.paramCode == param.paramCode && this.paramVersion == param.paramVersion;
	}

	setDisabled(disabled, cellIndex) {
		if (this.isGridCell()) {
			if (!(this.disabled instanceof Array)) {
				this.disabled = [];
			}

			if (Util.isNotEmpty(cellIndex)) {
				this.disabled[cellIndex] = disabled;
			} else {
				this.disabled = this.value.map((elem) => disabled);
			}
		} else {
			this.disabled = disabled;
		}

		//this.refreshKey();
	}

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
			this.dirty = true;
		}

		//this.refreshKey();
	}

	getDirty(cellIndex) {
		if (this.isGridCell() && Util.isNotEmpty(cellIndex)) {
			if (!(this.dirty instanceof Array)) {
				return false;
			}

			return this.dirty[cellIndex];
		} else {
			return this.dirty;
		}
	}

	isGridCell() {
		return this.displayType == ParameterConstants.DisplayTypes.GRID_CELL;
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
	set label(value) {
		this.displayName[this.languageId] = value;
	}
	addDisplayName(languageId, translation) {
		this.displayName[languageId] = translation;
	}
	removeDisplayName(languageId) {
		delete this.displayName[languageId];
	}

	getDefinition(languageId) {
		return languageId ? this.definition[languageId] : this.definition[this.languageId];
	}
	addDefinition(languageId, translation) {
		this.definition[languageId] = translation;
	}
	removeDefinition(languageId) {
		delete this.definition[languageId];
	}

	getTooltip(languageId) {
		return languageId ? this.tooltip[languageId] : this.tooltip[this.languageId];
	}
	addTooltip(languageId, translation) {
		this.tooltip[languageId] = translation;
	}
	removeTooltip(languageId) {
		delete this.tooltip[languageId];
	}

	equalTo(code, version) {
		if (version) {
			return code == this.paramCode && version == this.paramVersion;
		} else {
			return code == this.paramCode;
		}
	}

	isMemberOf(assembly) {
		return assembly.code == this.parentCode && assembly.version == this.parentVersion;
	}

	get isGroup() {
		return this.paramType == ParamType.GROUP;
	}

	get isGrid() {
		return this.paramType == ParamType.GRID;
	}

	postfixParameterCode(postfix) {
		this.paramCode += "_" + postfix;
		this.paramVersion = ParameterConstants.DEFAULT_VERSION;
	}

	createParameter({ namespace, formId, paramType, properties = {} }) {
		let parameter;
		switch (paramType) {
			case ParamType.STRING: {
				parameter = new StringParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.NUMERIC: {
				parameter = new NumericParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.BOOLEAN: {
				parameter = new BooleanParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.SELECT: {
				parameter = new SelectParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case "DualList": {
				parameter = new DualListParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.MATRIX: {
				parameter = new MatrixParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.FILE: {
				parameter = new FileParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.ADDRESS: {
				parameter = new AddressParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.EMAIL: {
				parameter = new EMailParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.DATE: {
				parameter = new DateParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.PHONE: {
				parameter = new PhoneParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.GROUP: {
				parameter = new GroupParameter({
					namespace: namespace,
					formId: formId
				});
				break;
			}
			case ParamType.GRID: {
				parameter = new GridParameter({
					namespace: namespace,
					formId: formId
				});
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

		parameter.initProperties(properties);

		return parameter;
	}

	copy() {
		const copied = this.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: this.paramType,
			properties: JSON.parse(JSON.stringify(this))
		});

		copied.paramCode = this.paramCode + "_" + Util.randomKey(8);
		copied.paramVersion = ParameterConstants.DEFAULT_VERSION;

		return copied;
	}

	focus(paramCode, paramVersion) {
		const focus = this.equalTo(paramCode, paramVersion);

		if (this.focused !== focus) {
			this.focused = focus;

			//this.refreshKey();

			return true;
		}
		return false;
	}

	isRendered() {
		return this.order > 0;
	}

	isValueFilled() {}

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
		return this.isGridCell() ? this.tagId + "_" + cellIndex : this.tagId;
	}

	addStyle(style) {
		this.style = { ...this.style, ...style };
	}

	removeStyle(property) {
		delete this.#style[property];
	}

	hasError(cellIndex) {
		return Util.isNotEmpty(cellIndex)
			? this.error.errorClass == ErrorClass.ERROR && cellIndex == this.errorCellIndex
			: this.error.errorClass == ErrorClass.ERROR;
	}

	hasWarning(cellIndex) {
		return Util.isNotEmpty(cellIndex)
			? this.error.errorClass == ErrorClass.WARNING && cellIndex == this.errorCellIndex
			: this.error.errorClass == ErrorClass.WARNING;
	}

	checkError(cellIndex) {
		this.validate(cellIndex);

		if (this.hasError()) {
			this.dirty = true;
			//this.refreshKey();
			return this.error;
		}

		return null;
	}

	setError(errorClass, errorMessage, cellIndex) {
		this.errorClass = errorClass;
		this.errorMessage = errorMessage;
		this.errorCellIndex = cellIndex;
	}

	clearError() {
		this.error = {};
	}

	getClassName(baseClassName, cellIndex) {
		let className = baseClassName;

		if (this.getDirty(cellIndex)) {
			if (this.hasError(cellIndex)) {
				className += " input-group-sm " + ErrorClass.ERROR;
			} else if (this.hasWarning(cellIndex)) {
				className += " input-group-sm " + ErrorClass.WARNING;
			} else {
				className += " input-group-sm " + ErrorClass.SUCCESS;
			}
		}

		return className;
	}

	checkIntegrity() {
		if (this.hasError()) {
			return false;
		}

		if (Util.isEmpty(this.paramCode)) {
			this.setError(ErrorClass.ERROR, Util.translate("parameter-code-is-missing"));

			this.setDirty(true);
			return false;
		}

		if (Util.isEmpty(this.paramVersion)) {
			this.setError(ErrorClass.ERROR, Util.translate("parameter-version-is-missing"));

			this.setDirty(true);
			return false;
		}

		if (Util.isEmpty(this.displayName)) {
			this.setError(ErrorClass.ERROR, Util.translate("display-name-is-missing"));

			this.setDirty(true);
			return false;
		}

		return true;
	}

	checkValidationEnabled(section) {
		return !!(this.validation && this.validation[section]);
	}

	getValidationValue(section, valueProp, locale) {
		if (this.checkValidationEnabled(section)) {
			switch (valueProp) {
				case "message": {
					if (locale) {
						return this.validation[section].message ? this.validation[section].message[locale] ?? "" : "";
					} else {
						return this.validation[section].message ?? {};
					}
				}
				case "value":
				case "errorClass": {
					return this.validation[section][valueProp];
				}
				case "boundary": {
					return this.validation[section][valueProp] ?? false;
				}
				default: {
					return this.validation[section];
				}
			}
		}
	}

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
		if (this.isGridCell()) {
			if (!this.value) {
				this.value = [];
			}

			return this.value[cellIndex];
		} else {
			return this.value;
		}
	}

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

	hasValue(cellIndex) {
		return Util.isNotEmpty(this.getValue(cellIndex));
	}

	initValue(cellIndex) {
		if (this.isGridCell()) {
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

		//this.refreshKey();
	}

	fire(event, params) {
		Event.fire(event, this.namespace, this.namespace, {
			targetFormId: this.formId,
			...params
		});
	}

	fireRefresh(cellIndex) {
		if (this.isGridCell()) {
			Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.parent.code,
				paramVersion: this.parent.version,
				parameter: this,
				cellIndex: cellIndex
			});
		} else {
			Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.paramCode,
				paramVersion: this.paramVersion,
				parameter: this,
				cellIndex: cellIndex
			});
		}
	}

	/**
	 * Fires SX_REFRESH_PREVIEW if preview is true otherwise SX_REFRESH
	 *
	 * @param {boolean} preview: default is false
	 * @returns
	 * 		void
	 */
	fireRefreshParent(preview = false) {
		if (Util.isEmpty(this.parent)) {
			return;
		}

		const event = preview ? Event.SX_REFRESH_PREVIEW : Event.SX_REFRESH;

		Event.fire(event, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.parent.code,
			paramVersion: this.parent.version
		});
	}

	fireRefreshPreview(cellIndex) {
		if (this.isGridCell()) {
			Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.parent.code,
				paramVersion: this.parent.version,
				parameter: this,
				cellIndex: cellIndex
			});
		} else {
			Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
				targetFormId: this.formId,
				paramCode: this.paramCode,
				paramVersion: this.paramVersion,
				parameter: this,
				cellIndex: cellIndex
			});
		}
	}

	fireRefreshForm() {
		Event.fire(Event.SX_REFRESH_FORM, this.namespace, this.namespace, {
			targetFormId: this.formId
		});
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

	fireParentRefreshPreview() {
		console.log("fireParentRefreshPreview: ", this);
		Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.parent.code,
			paramVersion: this.parent.version
		});
	}

	fireParentRefresh() {
		Event.fire(Event.SX_REFRESH, this.namespace, this.namespace, {
			targetFormId: this.formId,
			paramCode: this.parent.code,
			paramVersion: this.parent.version
		});
	}

	fireAddComment() {
		Event.fire(Event.SX_ADD_PARAMETER_COMMENT, this.namespace, this.namespace, {
			targetFormId: this.formId,
			parameter: this
		});
	}

	fireGridCellSelected(cellIndex) {}

	validate(cellIndex) {
		let value = this.getValue(cellIndex);
		let numValue = Number(this.uncertainty ? value.value : value);
		let numUncertainty = this.uncertainty ? value.uncertainty ?? 0 : 0;

		this.error = {};

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
					const dynamicFn = new Function("value", validationValue);

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
				message: "",
				errorClass: ErrorClass.SUCCESS
			};
		}

		return 0;
	}

	parse(json) {
		for (const key in json) {
			this[key] = json[key];
		}
	}

	loadData(data) {
		if (this.commentable) {
			//this.comments = data.comments;
		}
		this.actionHistories = data.actionHistories;

		if (this.freezable) {
			this.freezed = data.freezed;
			this.freezedUserId = data.freezedUserId;
			this.freezedUserName = data.freezedUserName;
			this.freezedDate = data.freezedDate;
		}

		if (this.verifiable) {
			this.verified = data.verified;
			this.verifiedUserId = data.verifiedUserId;
			this.verifiedUserName = data.verifiedUserName;
			this.verifiedDate = data.verifiedDate;
		}

		this.value = data.value;
	}

	toData() {
		let data = {};

		if (this.hasValue()) {
			data[this.paramCode] = {
				commentFreezed: this.commentFreezed,
				commentFreezeUserId: this.commentFreezeUserId,
				commentFreezeUserName: this.commentFreezeUserName,
				commentFreezeDate: this.commentFreezeDate,
				freezed: this.freezed,
				freezedUserId: this.freezedUserId,
				freezedUserName: this.freezedUserName,
				freezedDate: this.freezedDate,
				verified: this.verified,
				verifiedUserId: this.verifiedUserId,
				verifiedUserName: this.verifiedUserName,
				verifiedDate: this.verifiedDate,
				value: this.value
			};
		}

		return data;
	}

	toValue() {
		let value = {};

		if (this.hasValue()) {
			value[this.paramCode] = this.value;
		}

		return value;
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
			languageId: this.languageId,
			defaultLanguageId: this.defaultLanguageId,
			availableLanguageIds: this.availableLanguageIds,
			focused: this.focused,
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
				{this.getDirty(cellIndex) && this.hasError(cellIndex) && (
					<SXFormFieldFeedback
						content={this.errorMessage}
						spritemap={spritemap}
						symbol="exclamation-full"
					/>
				)}
				{this.getDirty(cellIndex) && this.hasWarning(cellIndex) && (
					<SXFormFieldFeedback
						content={this.errorMessage}
						spritemap={spritemap}
						symbol="warning"
					/>
				)}
			</>
		);
	}

	getPrefix(languageId = this.languageId) {
		return this.prefix[languageId];
	}

	getPostfix(languageId = this.languageId) {
		return this.postfix[languageId];
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

	renderPreview({ formId = this.formId, actionItems = [], spritemap }) {
		/* This is for test.*/
		this.referenceFile = {
			fileId: 12345,
			fileType: "jpg"
		};
		/**/

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

export class AddressParameter extends Parameter {
	searched = [];

	constructor({ namespace, formId, paramType = ParamType.ADDRESS, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + this.getFullAddress();
		}

		return "";
	}

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
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

	parse(json = {}) {
		super.parse(json);

		this.viewType = json.viewType ?? ParameterConstants.AddressViewTypes.BLOCK;
	}

	toJSON() {
		return super.toJSON();
	}

	toProperties() {
		let properties = super.toProperties();

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

export class SelectParameter extends Parameter {
	#options = [];
	#optionsPerRow = 0;
	#listboxSize = 3;
	#placeholder = "";

	constructor({ namespace, formId, paramType = ParamType.SELECT, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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
	get placeholder() {
		return this.#placeholder;
	}

	get optionCount() {
		return this.#options.length;
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + JSON.stringify(this.value);
		}

		return "";
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
	set placeholder(val) {
		this.#placeholder = val;
	}

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
		}
	}

	isMultiple() {
		return (
			this.viewType == ParameterConstants.SelectViewTypes.CHECKBOX ||
			this.viewType == ParameterConstants.SelectViewTypes.LISTBOX
		);
	}

	getPlaceholder() {
		return Util.getTranslation(this.placeholder, this.languageId);
	}

	checkDuplicatedOptionValue(optionValue) {
		if (!this.options) {
			return false;
		}

		let duplicated = false;
		this.options.every((option) => {
			duplicated = option.value == optionValue;

			return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return duplicated;
	}

	addOption(option) {
		this.#options.push(option);

		//this.refreshKey();

		return this.options.length;
	}

	getOption(index) {
		return this.options ? this.options[index] : {};
	}

	copyOption(index) {
		const insertPlace = index + 1;
		const newOption = { ...this.getOption(index), value: "" };
		this.options = [...this.options.slice(0, insertPlace), newOption, ...this.options.slice(insertPlace)];
		//this.refreshKey();
		return newOption;
	}

	removeOption(index) {
		this.#options.splice(index, 1);

		//this.refreshKey();

		return this.#options.length > 0 ? this.#options[0] : {};
	}

	switchOptions(index1, index2) {
		let elem1 = this.#options[index1];
		this.#options[index1] = this.#options[index2];
		this.#options[index2] = elem1;

		//this.refreshKey();
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

	initValue(cellIndex) {
		let value = this.defaultValue;
		if (this.isMultiple()) {
			value = this.defaultValue ?? [];
		}

		super.setValue({ value: value, cellIndex: cellIndex });
	}

	parse(json) {
		super.parse(json);

		this.options = json.options ?? [];
		this.viewType = json.viewType ?? ParameterConstants.SelectViewTypes.DROPDOWN;
		this.optionsPerRow = json.optionsPerRow ?? 0;
		this.listboxSize = json.listboxSize ?? this.#listboxSize;
		this.placeholder = json.placeholder;
	}

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

		if (Util.isNotEmpty(this.placeholder)) {
			json.placeholder = this.placeholder;
		}

		return json;
	}

	toProperties() {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.options = this.options.map((option) => ({ label: option.label[this.languageId], value: option.value }));
		json.optionsPerRow = this.optionsPerRow;
		json.listboxSize = this.listboxSize;
		json.placeholder = this.placeholder;

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

export class BooleanParameter extends SelectParameter {
	static ViewTypes = {
		CHECKBOX: "checkbox",
		TOGGLE: "toggle",
		RADIO: "radio",
		DROPDOWN: "dropdown"
	};

	constructor({ namespace, formId, paramType = ParamType.BOOLEAN, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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
			this.viewType == ParameterConstants.BooleanViewTypes.RADIO ||
			this.viewType == ParameterConstants.BooleanViewTypes.DROPDOWN
		);
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + this.value;
		}

		return "";
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

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
		}
	}

	getTrueLabel(languageId) {
		const langId = languageId ?? this.languageId;

		return this.trueLabel[langId];
	}

	getFalseLabel(languageId) {
		const langId = languageId ?? this.languageId;

		return this.falseLabel[langId];
	}

	initValue(cellIndex) {
		let defaultValue = this.defaultValue;
		if (
			this.viewType == ParameterConstants.BooleanViewTypes.CHECKBOX ||
			this.viewType == ParameterConstants.BooleanViewTypes.TOGGLE
		) {
			defaultValue = this.defaultValue ?? false;
		}

		super.setValue({ value: defaultValue, cellIndex: cellIndex });
	}

	parse(json) {
		super.parse(json);

		this.viewType = json.viewType ?? ParameterConstants.BooleanViewTypes.CHECKBOX;

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

	toProperties() {
		let properties = super.toProperties();

		properties.trueLabel = this.getTrueLabel(this.languageId);
		properties.falseLabel = this.getFalseLabel(this.languageId);

		properties.value = this.value ?? !!this.defaultValue;

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

export class DateParameter extends Parameter {
	#enableTime;
	#startYear;
	#endYear;

	constructor({ namespace, formId, paramType = ParamType.DATE, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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
	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + this.getValue();
		}

		return "";
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

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
		}
	}

	getDate(cellIndex) {
		const value = super.getValue(cellIndex);

		return !!value ? new Date(value) : new Date();
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? "", cellIndex: cellIndex });
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

	toProperties() {
		let properties = super.toProperties();

		properties.enableTime = this.enableTime;

		properties.startYear = this.startYear;
		properties.endYear = this.endYear;

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

export class DualListParameter extends Parameter {
	#options = [];

	constructor({ namespace, formId, paramType = ParamType.DUALLIST }, properties = {}) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
	}

	get options() {
		return this.#options;
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + JSON.stringify(this.value);
		}

		return "";
	}

	set options(val) {
		this.#options = val;
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

	setValue({ value, cellIndex, validate = true }) {
		const values = value.map((option) => option.value);
		console.log(
			"DualListParameter.setValue: ",
			values,
			this.options.filter((option) => values.includes(option.value))
		);

		super.setValue({
			value: this.options.filter((option) => values.includes(option.value)),
			cellIndex: cellIndex,
			validate: validate
		});
	}

	getLeftOptions(cellIndex) {
		const leftOptions = super.getValue(cellIndex) ?? [];

		return leftOptions.map((option) => ({
			key: option.value,
			label: option.label[this.languageId],
			value: option.value
		}));
	}

	getRightOptions(cellIndex) {
		const rightOptions = this.options
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

	addValue(val) {
		this.value.push(val);
	}

	includedInValues(value, cellIndex) {
		const values = this.getValue(cellIndex);

		const result = values.filter((val) => val.value == value);
		return result.length > 0;
	}

	notIncludedInValues(value, cellIndex) {
		return !this.includedInValues(value, cellIndex);
	}

	removeValue(val) {
		if (!this.hasValue()) {
			return;
		}

		this.value = this.value.filter((elem) => elem.value !== val.value);
	}
	checkDuplicatedOptionValue(optionValue) {
		if (!this.options) {
			return false;
		}

		let duplicated = false;
		this.options.every((option) => {
			duplicated = option.value == optionValue;

			return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return duplicated;
	}

	addOption(option) {
		this.#options.push(option);

		//this.refreshKey();

		return this.options.length;
	}

	getOption(index) {
		return this.option ? this.options[index] : {};
	}

	getOptionByValue(value) {
		let foundOption;

		this.options.every((option) => {
			if (option.value == value) {
				foundOption = option;
			}

			return foundOption ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		console.log("DualListParameter.getOptionByValue: ", value, foundOption);
		return foundOption;
	}

	copyOption(index) {
		const insertPlace = index + 1;
		const newOption = { ...this.getOption(index), value: "" };
		this.options = [...this.options.slice(0, insertPlace), newOption, ...this.options.slice(insertPlace)];

		//this.refreshKey();
		return newOption;
	}

	removeOption(index) {
		this.#options.splice(index, 1);

		//this.refreshKey();

		return this.#options.length > 0 ? this.#options[0] : {};
	}

	switchOptions(index1, index2) {
		let elem1 = this.#options[index1];
		this.#options[index1] = this.#options[index2];
		this.#options[index2] = elem1;

		//this.refreshKey();
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

	getValue(cellIndex) {
		const values = super.getValue(cellIndex) ?? [];

		return values.map((value) => value.value);
	}

	parse(json) {
		super.parse(json);

		this.viewType = json.viewType ?? ParameterConstants.DualListViewTypes.HORIZONTAL;
		this.options = json.options ?? [];
	}

	toJSON() {
		let json = super.toJSON();

		json.options = this.options;
		json.viewType = this.viewType;
	}

	toProperties() {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.leftOptions = this.value;
		json.options = this.options;

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

export class EMailParameter extends Parameter {
	constructor({ namespace, formId, paramType = ParamType.EMAIL, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + this.getEmailAddress();
		}

		return "";
	}

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
		}
	}

	getEmailId(cellIndex) {
		const value = super.getValue(cellIndex);

		if (Util.isEmpty(value)) {
			return "";
		} else {
			return value.emailId;
		}
	}

	getServerName(cellIndex) {
		const value = super.getValue(cellIndex);

		if (Util.isEmpty(value)) {
			return "";
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
			return "";
		} else {
			return value.emailId + "@" + value.serverName;
		}
	}

	initValue(cellIndex) {
		super.setValue({ value: this.defaultValue ?? {}, cellIndex: cellIndex });
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

	toProperties() {
		let properties = super.toProperties();

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

export class FileParameter extends Parameter {
	constructor({ namespace, formId, paramType = ParamType.FILE, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + JSON.stringify(this.value);
		}

		return "";
	}

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
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

export class GroupParameter extends Parameter {
	#members = [];
	#membersPerRow = 1;
	#expanded = false;
	#titleDisplay = false;

	constructor({ namespace, formId, paramType = ParamType.GROUP, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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
			this.viewType == ParameterConstants.GroupViewTypes.ARRANGEMENT ||
			this.viewType == ParameterConstants.GroupViewTypes.PANEL
		);
	}

	get abstract() {
		return "";
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

	checkDuplicateParamCode(param) {
		let duplicated = this.paramCode == param.paramCode;

		if (!duplicated) {
			this.members.every((member) => {
				if (param !== member) {
					duplicated = member.checkDuplicateParamCode(param);
				}

				return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
			});
		}

		return duplicated;
	}

	checkDuplicateParam(param) {
		let duplicated = this.paramCode == param.paramCode && this.paramVersion == param.paramVersion;

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

		this.setDirty(true);
	}

	setMemberDisplayType(member) {
		switch (this.viewType) {
			case ParameterConstants.GroupViewTypes.ARRANGEMENT:
			case ParameterConstants.GroupViewTypes.PANEL: {
				member.displayType = ParameterConstants.DisplayTypes.FORM_FIELD;
				break;
			}
			case ParameterConstants.GroupViewTypes.TABLE: {
				member.displayType = ParameterConstants.DisplayTypes.TABLE_ROW;
				break;
			}
			case ParameterConstants.GroupViewTypes.SHARED_OPTION_TABLE: {
				member.displayType = ParameterConstants.DisplayTypes.SHARED_OPTION_TABLE_ROW;
				break;
			}
		}
	}

	insertMember(param, memOrder) {
		if (this.members.length == 0 || memOrder == this.members.length) {
			this.members.push(param);
		} else if (memOrder == 0) {
			this.#members.unshift(param);
		} else {
			this.members.splice(memOrder, 0, param);
		}

		this.setMemberOrders();
		this.setDirty(true);
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
		this.setDirty(true);

		return removed;
	}

	deleteMemberByCode(memCode, memVersion) {
		let order = -1;

		this.members.every((member, index) => {
			if (!memVersion && member.paramCode == memCode) {
				order = index;
			} else if (member.paramVersion == memVersion && member.paramCode == memCode) {
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

		this.setDirty(true);

		return copied;
	}

	copyMemberByCode(memCode, memVersion) {
		let order = -1;

		this.members.every((member, index) => {
			if (!memVersion && member.paramCode == memCode) {
				order = index;
			} else if (member.paramVersion == memVersion && member.paramCode == memCode) {
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

	findParameter({ paramCode, paramVersion = ParameterConstants.DEFAULT_VERSION, descendant = true }) {
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
		//this.members[targetIndex].refreshKey();
		this.members[srcIndex] = targetParam;
		//this.members[srcIndex].refreshKey();

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
		this.paramVersion = ParameterConstants.DEFAULT_VERSION;

		this.members.forEach((member, index) => member.postfixParameterCode(postfix + "_" + index));
	}

	getMemberPosition(member) {
		if (this.members.length == 1 && member.order == 1) {
			return Constant.Position.DEAD_END;
		} else if (member.order == 1) {
			return Constant.Position.START;
		} else if (member.order == this.members.length) {
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
		const copied = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.formId,
			paramType: this.paramType,
			properties: JSON.parse(JSON.stringify(this))
		});

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

	getPreviewActionItems(itemOrder) {
		let actionItems = [
			{ id: "group", name: Util.translate("change-group"), symbol: "move-folder" },
			{ id: "copy", name: Util.translate("copy"), symbol: "copy" },
			{ id: "delete", name: Util.translate("delete"), symbol: "times" }
		];

		if (itemOrder > 0) {
			actionItems.push({ id: "moveUp", name: Util.translate("move-up"), symbol: "order-arrow-up" });
		}
		if (itemOrder < this.memberCount - 1) {
			actionItems.push({
				id: "moveDown",
				name: Util.translate("move-down"),
				symbol: "order-arrow-down"
			});
		}

		return actionItems;
	}

	focus(paramCode, paramVersion) {
		this.focused = this.equalTo(paramCode, paramVersion);

		this.members.forEach((param) => {
			param.focus(paramCode, paramVersion);
		});
	}

	superParse(json) {
		super.parse(json);
	}

	superToJSON() {
		return super.toJSON();
	}

	superToProperties() {
		return super.toProperties();
	}

	parse(json = {}) {
		super.parse(json);

		this.viewType = this.viewType ?? ParameterConstants.GroupViewTypes.PANEL;
		this.membersPerRow = json.membersPerRow ?? 1;
		this.expanded = json.expanded ?? false;

		if (Util.isNotEmpty(json.members)) {
			this.members = json.members.map((member) => {
				let parameter;
				if (member instanceof Parameter) {
					parameter = member;
				} else {
					parameter = ParameterUtil.createParameter({
						namespace: this.namespace,
						formId: this.componentId,
						paramType: member.paramType,
						properties: member
					});
				}

				this.setMemberDisplayType(parameter);

				return parameter;
			});
		}
	}

	loadData(data) {
		super.loadData(data);

		this.members.forEach((member) => {
			const value = data[member.paramCode];
			if (Util.isNotEmpty(value)) {
				member.loadData(value);
			}
		});
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

		if (this.viewType == ParameterConstants.GroupViewTypes.ARRANGEMENT) {
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

		if (this.viewType !== ParameterConstants.GroupViewTypes.PANEL) json.viewType = this.viewType;
		if (this.membersPerRow > 1) json.membersPerRow = this.membersPerRow;
		if (this.expanded) json.expanded = this.expanded;

		let jsonMembers = [];
		this.members.forEach((member) => {
			jsonMembers.push(member.toJSON());
		});

		json.members = jsonMembers;

		return json;
	}

	toProperties() {
		let json = super.toProperties();

		json.viewType = this.viewType;
		json.fieldsPerRow = this.membersPerRow;
		json.expanded = this.expanded;

		json.members = this.members.map((member) => {
			return member.toProperties();
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

	renderPreview({ formId = this.formId, actionItems = [], spritemap }) {
		return (
			<SXPreviewRow
				key={this.key}
				formId={formId}
				parameter={this}
				actionItems={actionItems}
				spritemap={spritemap}
			/>
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
		cellIndex
	}) {
		return (
			<SXGroup
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
		);
	}
}

export class GridParameter extends GroupParameter {
	#rowCount = 0;

	error = {};

	constructor({ namespace, formId, paramType = ParamType.GRID, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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

	get abstract() {
		return "";
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

	initValue(cellIndex) {
		this.columns.forEach((column) => column.initValue(cellIndex));
	}

	hasValue(cellIndex) {
		let hasValue = false;
		this.columns.every((column) => {
			hasValue = column.hasValue(cellIndex);

			return !hasValue;
		});

		return hasValue;
	}

	addMember(column) {
		column.parent = { code: this.paramCode, version: this.paramVersion };
		column.displayType = ParameterConstants.DisplayTypes.GRID_CELL;

		column.order = this.columnCount + 1;
		column.formId = this.tagName;

		this.columns.push(column);

		this.setDirty(true);
	}

	insertColumn(column, order) {
		this.insertMember(column, order);
	}

	isColumn(colCode, colVersion) {
		return this.isMember(colCode, colVersion);
	}

	removeColumn({ colCode, colVersion = ParameterConstants.DEFAULT_VERSION }) {
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

			//column.refreshKey();
		});

		this.rowCount++;

		this.setDirty(true);
	}

	copyRow(rowIndex) {
		const copyedIndex = rowIndex + 1;

		this.columns.forEach((column) => {
			column.value.splice(copyedIndex, 0, null);

			column.setValue({ value: column.getValue(rowIndex), cellIndex: copyedIndex });
			//column.refreshKey();
		});

		this.rowCount++;

		this.setDirty(true);
	}

	deleteRow(rowIndex) {
		if (this.rowCount == 1) {
			this.columns.forEach((column) => column.initValue(0));
			return;
		}

		this.columns.forEach((column) => {
			column.value.splice(rowIndex, 1);
			//column.refreshKey();
		});

		if (this.rowCount >= 1) {
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

			//column.refreshKey();
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

			//column.refreshKey();
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
		let colFound;

		this.columns.every((column) => {
			if (column.paramCode == colCode) {
				colFound = column;
			}

			return colFound ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		if (colFound) {
			console.log("GridParameter.fireColumnSelected: ", colCode, colFound);
			colFound.fireParameterSelected();
		}
	}

	parse(json = {}) {
		super.superParse(json);

		this.rowCount = json.rowCount ?? 0;

		if (Util.isNotEmpty(json.columns)) {
			this.columns = json.columns.map((column) => {
				return ParameterUtil.createParameter({
					namespace: this.namespace,
					formId: this.componentId,
					paramType: column.paramType,
					properties: column
				});
			});
		}

		if (this.rowCount == 0) {
			this.initValue(0);
			this.rowCount++;
		}
	}

	toJSON() {
		let json = super.superToJSON();

		json.rowCount = this.rowCount;

		json.columns = [];
		this.columns.forEach((column) => json.columns.push(column.toJSON()));

		return json;
	}

	toProperties() {
		let json = super.superToProperties();

		json.rowCount = this.rowCount;

		json.columns = this.columns.map((column) => {
			return column.toProperties();
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
		cellIndex
	}) {
		return (
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
		);
	}
}

export class MatrixParameter extends Parameter {
	#rowCount = 3;
	#colCount = 3;
	#delimiter = " ";
	#bracket = "[]";

	constructor({ namespace, formId, paramType = ParamType.MATRIX, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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

	toProperties() {
		let properties = super.toProperties();

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

export class NumericParameter extends Parameter {
	#decimalPlaces;
	#uncertainty;
	#isInteger;
	#unit;

	#prefix;
	#postfix;

	#min;
	#max;

	constructor({ namespace, formId, paramType = ParamType.NUMERIC, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + (this.uncertainty ? this.value.value : this.value);
		}

		return "";
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

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
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

		return this.isGridCell() ? this.value[cellIndex].uncertainty : this.value.uncertainty;
	}

	getValueValue(cellIndex) {
		return this.isGridCell() ? this.value[cellIndex].value : this.value.value;
	}

	setValueUncertainty(value, cellIndex) {
		if (this.isGridCell()) {
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
		if (this.isGridCell()) {
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

		let value = this.isGridCell() ? this.value[cellIndex] : this.value;
		if (Util.isEmpty(value)) {
			return false;
		}

		return value.uncertainty ? Util.isNotEmpty(value.value) : Util.isNotEmpty(value);
	}

	/*
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
		*/

	toNumber() {
		if (!this.hasValue()) {
			return;
		}

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
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
		this.decimalPlaces = json.decimalPlaces ?? (this.isInteger ? 0 : 1);
		this.unit = json.unit ?? "";
		this.prefix = json.prefix ?? {};
		this.postfix = json.postfix ?? {};
		this.min = json.min;
		this.max = json.max;
	}

	toJSON() {
		let json = super.toJSON();

		if (this.uncertainty == true) json.uncertainty = this.uncertainty;
		if (this.isInteger == true) json.isInteger = this.isInteger;
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

export class PhoneParameter extends Parameter {
	#enableCountryNo;

	constructor({ namespace, formId, paramType = ParamType.PHONE, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
	}

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + this.getPhoneNo();
		}

		return "";
	}

	initProperties(json) {
		this.parse(json);

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
					this.initValue(cellIndex);
				}
			});
		} else {
			if (!this.hasValue()) {
				this.initValue();
			}
		}
	}

	getCountryNo(cellIndex) {
		return this.isGridCell() ? this.value[cellIndex].countryNo : this.value.countryNo;
	}
	getAreaNo(cellIndex) {
		return this.isGridCell() ? this.value[cellIndex].areaNo : this.value.areaNo;
	}
	getStationNo(cellIndex) {
		return this.isGridCell() ? this.value[cellIndex].stationNo : this.value.stationNo;
	}
	getPersonalNo(cellIndex) {
		return this.isGridCell() ? this.value[cellIndex].personal : this.value.personal;
	}
	get enableCountryNo() {
		return this.#enableCountryNo;
	}

	getPhoneNo(cellIndex) {
		return (
			(this.enableCountryNo ? this.getCountryNo(cellIndex) : "") +
			")" +
			this.getAreaNo(cellIndex) +
			"-" +
			this.getStationNo(cellIndex) +
			"-" +
			this.getPersonalNo(cellIndex)
		);
	}

	setCountryNo(val, cellIndex) {
		if (this.isGridCell()) {
			this.value[cellIndex].countryNo;
		} else {
			this.value.countryNo = val;
		}
	}
	setAreaNo(val, cellIndex) {
		if (this.isGridCell()) {
			this.value[cellIndex].areaNo;
		} else {
			this.value.areaNo = val;
		}
	}
	setStationNo(val, cellIndex) {
		if (this.isGridCell()) {
			this.value[cellIndex].stationNo;
		} else {
			this.value.stationNo = val;
		}
	}
	setPersonalNo(val, cellIndex) {
		if (this.isGridCell()) {
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

	parse(json = {}) {
		super.parse(json);

		this.enableCountryNo = json.enableCountryNo ?? "";
	}

	toJSON() {
		let json = super.toJSON();

		if (this.enableCountryNo) json.enableCountryNo = this.enableCountryNo;

		return json;
	}

	toProperties() {
		let properties = super.toProperties();

		properties.enableCountryNo = this.enableCountryNo;

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

export class StringParameter extends Parameter {
	#minLength;
	#maxLength;
	#multipleLine;
	#localized;
	#placeholder;
	#prefix;
	#postfix;

	constructor({ namespace, formId, paramType = ParamType.STRING, properties = {} }) {
		super({
			namespace: namespace,
			formId: formId,
			paramType: paramType
		});

		if (Util.isNotEmpty(properties)) {
			this.parse(properties);
		}
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

	get abstract() {
		if (this.abstractKey && this.hasValue()) {
			return this.paramCode + ": " + (this.localized ? this.value[this.languageId] : this.value);
		}

		return "";
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

		if (this.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			if (!this.value) {
				this.value = [];
			}

			this.value.forEach((val, cellIndex) => {
				if (!this.hasValue(cellIndex)) {
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
		if (this.multipleLine == true) json.multipleLine = this.multipleLine;
		if (this.localized == true) json.localized = this.localized;
		if (Util.isNotEmpty(this.placeholder)) json.placeholder = this.placeholder;
		if (Util.isNotEmpty(this.prefix)) json.prefix = this.prefix;
		if (Util.isNotEmpty(this.postfix)) json.postfix = this.postfix;

		return json;
	}

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
