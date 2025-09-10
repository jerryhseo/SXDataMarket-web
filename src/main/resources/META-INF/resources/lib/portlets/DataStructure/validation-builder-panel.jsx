import React, { useContext, useRef, useState } from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamType, ValidationKeys } from "../../stationx/station-x";
import { ClayCheckbox, ClayInput, ClaySelectWithOption, ClayToggle } from "@clayui/form";
import LocalizedInput from "@clayui/localized-input";
import { Context } from "@clayui/modal";
import { openConfirmModal, SXModalDialog, SXModalUtil } from "../../stationx/modal";
import { BooleanParameter, Parameter, SelectParameter } from "../../stationx/parameter";

class SXDSBuilderValidationPanel extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.workingParam.namespace;
		this.formIds = props.formIds;
		this.languageId = props.workingParam.languageId;
		this.availableLanguageIds = props.workingParam.availableLanguageIds;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;
		this.spritemap = props.spritemap;

		this.locales = this.availableLanguageIds.map((locale) => ({
			label: locale,
			symbol: locale.toLowerCase()
		}));

		this.errorLevelOptions = Object.keys(ErrorClass)
			.filter((errorClass) => errorClass !== "SUCCESS")
			.map((errorClass) => ({
				label: errorClass,
				value: ErrorClass[errorClass]
			}));

		this.validation = this.workingParam.validation ?? {};
		this.state = {
			selectedLang: {
				required: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				pattern: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				minLength: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				maxLength: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				min: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				max: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				normalMin: { label: this.languageId, symbol: this.languageId.toLowerCase() },
				normalMax: { label: this.languageId, symbol: this.languageId.toLowerCase() }
			},
			noticeDialog: false
		};

		this.formId = this.namespace + "validationBulder";

		const errorOptions = [
			{
				label: Util.getTranslationObject(this.languageId, ErrorClass.ERROR),
				value: ErrorClass.ERROR
			},
			{
				label: Util.getTranslationObject(this.languageId, ErrorClass.WARNING),
				value: ErrorClass.WARNING
			}
		];

		const baseValue = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				displayName: Util.getTranslationObject(this.languageId, "value"),
				placeholder: Util.getTranslationObject(this.languageId, "error-message")
			}
		);
		const baseBoundary = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				viewType: BooleanParameter.ViewTypes.CHECKBOX,
				displayName: Util.getTranslationObject(this.languageId, "boundary")
			}
		);
		const baseMessage = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "message"),
				placeholder: Util.getTranslationObject(this.languageId, "error-message")
			}
		);
		const baseErrorLevel = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.SELECT,
			{
				viewType: SelectParameter.ViewTypes.RADIO,
				displayName: Util.getTranslationObject(this.languageId, "error-level"),
				optionsPerRow: 2,
				options: errorOptions,
				defaultValue: ErrorClass.ERROR
			}
		);

		const requiredMessage = baseMessage.copy();
		requiredMessage.paramCode = "requiredMessage";
		requiredMessage.setValue({ value: this.getSectionMessage(ValidationKeys.REQUIRED) });
		const requiredErrorLevel = baseErrorLevel.copy();
		requiredErrorLevel.paramCode = "requiredErrorLevel";
		requiredErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.REQUIRED) });

		this.requiredProps = {
			message: requiredMessage,
			errorLevel: requiredErrorLevel
		};

		const patternValue = baseValue.copy();
		patternValue.paramCode = "patternValue";
		patternValue.setValue({ value: this.getSectionValue(ValidationKeys.PATTERN) });
		const patternMessage = baseMessage.copy();
		patternMessage.paramCode = "patternMessage";
		patternMessage.setValue({ value: this.getSectionMessage(ValidationKeys.PATTERN) });
		const patternErrorLevel = baseErrorLevel.copy();
		patternErrorLevel.paramCode = "patternErrorLevel";
		patternErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.PATTERN) });

		this.patternProps = {
			value: patternValue,
			message: patternMessage,
			errorLevel: patternErrorLevel
		};

		const minLengthValue = baseValue.copy();
		minLengthValue.paramCode = "minLengthValue";
		minLengthValue.setValue({ value: this.getSectionValue(ValidationKeys.MIN_LENGTH) });
		const minLengthMessage = baseMessage.copy();
		minLengthMessage.paramCode = "minLengthMessage";
		minLengthMessage.setValue({ value: this.getSectionMessage(ValidationKeys.MIN_LENGTH) });
		const minLengthErrorLevel = baseErrorLevel.copy();
		minLengthErrorLevel.paramCode = "minLengthErrorLevel";
		minLengthErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.MIN_LENGTH) });

		this.minLengthProps = {
			value: minLengthValue,
			message: minLengthMessage,
			errorLevel: minLengthErrorLevel
		};

		const maxLengthValue = baseValue.copy();
		maxLengthValue.paramCode = "maxLengthValue";
		maxLengthValue.setValue({ value: this.getSectionValue(ValidationKeys.MAX_LENGTH) });
		const maxLengthMessage = baseMessage.copy();
		maxLengthMessage.paramCode = "maxLengthMessage";
		maxLengthMessage.setValue({ value: this.getSectionMessage(ValidationKeys.MAX_LENGTH) });
		const maxLengthErrorLevel = baseErrorLevel.copy();
		maxLengthErrorLevel.paramCode = "maxLengthErrorLevel";
		maxLengthErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.MAX_LENGTH) });

		this.maxLengthProps = {
			value: maxLengthValue,
			message: maxLengthMessage,
			errorLevel: maxLengthErrorLevel
		};

		const minValue = baseValue.copy();
		minValue.paramCode = "minValue";
		const minValueBoundary = baseBoundary.copy();
		minValueBoundary.paramCode = "minValueBoundary";
		const minMessage = baseMessage.copy();
		minMessage.paramCode = "minMessage";
		const minErrorLevel = baseErrorLevel.copy();
		minErrorLevel.paramCode = "minErrorLevel";
		minValue.setValue({ value: this.getSectionValue(ValidationKeys.MIN) });
		minValueBoundary.setValue({ value: this.getSectionBoundary(ValidationKeys.MIN) });
		minMessage.setValue({ value: this.getSectionMessage(ValidationKeys.MIN) });
		minErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.MIN) });

		this.minProps = {
			value: minValue,
			boundary: minValueBoundary,
			message: minMessage,
			errorLevel: minErrorLevel
		};

		const maxValue = baseValue.copy();
		maxValue.paramCode = "maxValue";
		const maxValueBoundary = baseBoundary.copy();
		maxValueBoundary.paramCode = "maxValueBoundary";
		const maxMessage = baseMessage.copy();
		maxMessage.paramCode = "maxMessage";
		const maxErrorLevel = baseErrorLevel.copy();
		maxErrorLevel.paramCode = "maxErrorLevel";
		maxValue.setValue({ value: this.getSectionValue(ValidationKeys.MAX) });
		maxValueBoundary.setValue({ value: this.getSectionBoundary(ValidationKeys.MAX) });
		maxMessage.setValue({ value: this.getSectionMessage(ValidationKeys.MAX) });
		maxErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.MAX) });

		this.maxProps = {
			value: maxValue,
			boundary: maxValueBoundary,
			message: maxMessage,
			errorLevel: maxErrorLevel
		};

		const normalMinValue = baseValue.copy();
		normalMinValue.paramCode = "normalMinValue";
		const normalMinBoundary = baseBoundary.copy();
		normalMinBoundary.paramCode = "normalMinBoundary";
		const normalMinMessage = baseMessage.copy();
		normalMinMessage.paramCode = "normalMinMessage";
		const normalMinErrorLevel = baseErrorLevel.copy();
		normalMinErrorLevel.paramCode = "normalMinErrorLevel";
		normalMinValue.setValue({ value: this.getSectionValue(ValidationKeys.NORMAL_MIN) });
		normalMinBoundary.setValue({ value: this.getSectionBoundary(ValidationKeys.NORMAL_MIN) });
		normalMinMessage.setValue({ value: this.getSectionMessage(ValidationKeys.NORMAL_MIN) });
		normalMinErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.NORMAL_MIN) });

		this.normalMinProps = {
			value: normalMinValue,
			boundary: normalMinBoundary,
			message: normalMinMessage,
			errorLevel: normalMinErrorLevel
		};

		const normalMaxValue = baseValue.copy();
		normalMaxValue.paramCode = "normalMaxValue";
		const normalMaxBoundary = baseBoundary.copy();
		normalMaxBoundary.paramCode = "normalMaxBoundary";
		const normalMaxMessage = baseMessage.copy();
		normalMaxMessage.paramCode = "normalMaxMessage";
		const normalMaxErrorLevel = baseErrorLevel.copy();
		normalMaxErrorLevel.paramCode = "normalMaxErrorLevel";
		normalMaxValue.setValue({ value: this.getSectionValue(ValidationKeys.NORMAL_MAX) });
		normalMaxBoundary.setValue({ value: this.getSectionBoundary(ValidationKeys.NORMAL_MAX) });
		normalMaxMessage.setValue({ value: this.getSectionMessage(ValidationKeys.NORMAL_MAX) });
		normalMaxErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.NORMAL_MAX) });

		this.normalMaxProps = {
			value: normalMaxValue,
			boundary: normalMaxBoundary,
			message: normalMaxMessage,
			errorLevel: normalMaxErrorLevel
		};

		const customValue = baseValue.copy();
		customValue.paramCode = "customValue";
		customValue.multipleLine = true;
		const customMessage = baseMessage.copy();
		customMessage.paramCode = "customMessage";
		const customErrorLevel = baseErrorLevel.copy();
		customErrorLevel.paramCode = "customErrorLevel";
		customValue.setValue({ value: this.getSectionValue(ValidationKeys.CUSTOM) });
		customMessage.setValue({ value: this.getSectionMessage(ValidationKeys.CUSTOM) });
		customErrorLevel.setValue({ value: this.getSectionErrorClass(ValidationKeys.CUSTOM) });

		this.customProps = {
			value: customValue,
			message: customMessage,
			errorLevel: customErrorLevel
		};
	}

	listenerFieldValueChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.formId)) {
			return;
		}

		switch (dataPacket.paramCode) {
			case "requiredMessage": {
				this.setSectionMessage(ValidationKeys.REQUIRED, this.requiredProps.message.getValue());
				break;
			}
			case "requiredErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.REQUIRED, this.requiredProps.errorLevel.getValue());
				break;
			}
			case "patternValue": {
				this.setSectionValue(ValidationKeys.PATTERN, this.patternProps.value.getValue());
				break;
			}
			case "patternMessage": {
				this.setSectionMessage(ValidationKeys.PATTERN, this.patternProps.message.getValue());
				break;
			}
			case "patternErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.PATTERN, this.patternProps.errorLevel.getValue());
				break;
			}
			case "minLengthValue": {
				const value = this.minLengthProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.MIN_LENGTH, "");

					break;
				}

				const minLength = Number(value);
				const maxLength = this.getSectionValue(ValidationKeys.MAX_LENGTH);

				if (Util.isNotEmpty(maxLength)) {
					if (minLength > maxLength) {
						this.minLengthProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("min-length-must-be-smaller-than-max-length")
						);

						this.minLengthProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.MIN_LENGTH, minLength);

				break;
			}
			case "minLengthMessage": {
				this.setSectionMessage(ValidationKeys.MIN_LENGTH, this.minLengthProps.message.getValue());
				break;
			}
			case "minLengthErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.MIN_LENGTH, this.minLengthProps.errorLevel.getValue());
				break;
			}
			case "maxLengthValue": {
				const value = this.maxLengthProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.MAX_LENGTH, "");

					break;
				}

				const maxLength = Number(value);
				const minLength = this.getSectionValue(ValidationKeys.MIN_LENGTH);

				if (Util.isNotEmpty(minLength)) {
					if (maxLength < minLength) {
						this.maxLengthProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("max-length-must-be-larger-than-min-length")
						);

						this.maxLengthProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.MAX_LENGTH, maxLength);

				break;
			}
			case "maxLengthMessage": {
				this.setSectionMessage(ValidationKeys.MAX_LENGTH, this.maxLengthProps.message.getValue());
				break;
			}
			case "maxLengthErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.MAX_LENGTH, this.maxLengthProps.errorLevel.getValue());
				break;
			}
			case "minValue": {
				const value = this.minProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.MIN, "");

					break;
				}

				const min = Number(value);
				const max = this.getSectionValue(ValidationKeys.MAX);
				const normalMin = this.getSectionValue(ValidationKeys.NORMAL_MIN);
				const normalMax = this.getSectionValue(ValidationKeys.NORMAL_MAX);

				if (Util.isNotEmpty(normalMin)) {
					if (min > normalMin) {
						this.minProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("min-value-must-be-smaller-than-normal-min")
						);

						this.minProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(normalMax)) {
					if (min > normalMax) {
						this.minProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("min-value-must-be-smaller-than-normal-max")
						);

						this.minProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(max)) {
					if (min > max) {
						this.minProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("min-value-must-be-smaller-than-max")
						);

						this.minProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.MIN, min);

				break;
			}
			case "minValueBoundary": {
				this.toggleBoundary(ValidationKeys.MIN);
				break;
			}
			case "minMessage": {
				this.setSectionMessage(ValidationKeys.MIN, this.minProps.message.getValue());
				break;
			}
			case "minErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.MIN, this.minProps.errorLevel.getValue());
				break;
			}
			case "maxValue": {
				const value = this.maxProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.MAX, "");

					break;
				}

				const min = this.getSectionValue(ValidationKeys.MIN);
				const max = Number(value);
				const normalMin = this.getSectionValue(ValidationKeys.NORMAL_MIN);
				const normalMax = this.getSectionValue(ValidationKeys.NORMAL_MAX);

				if (Util.isNotEmpty(normalMin)) {
					if (max < normalMin) {
						this.maxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("max-value-must-be-larger-than-normal-min")
						);

						this.maxProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(normalMax)) {
					if (max < normalMax) {
						this.maxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("max-value-must-be-larger-than-normal-max")
						);

						this.maxProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(min)) {
					if (max < min) {
						this.maxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("max-value-must-be-larger-than-min")
						);

						this.maxProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.MAX, max);

				break;
			}
			case "maxValueBoundary": {
				this.toggleBoundary(ValidationKeys.MAX);
				break;
			}
			case "maxMessage": {
				this.setSectionMessage(ValidationKeys.MAX, this.maxProps.message.getValue());
				break;
			}
			case "maxErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.MAX, this.maxProps.errorLevel.getValue());
				break;
			}
			case "normalMinValue": {
				const value = this.normalMinProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.NORMAL_MIN, "");

					break;
				}

				const min = this.getSectionValue(ValidationKeys.MIN);
				const max = this.getSectionValue(ValidationKeys.MAX);
				const normalMin = Number(value);
				const normalMax = this.getSectionValue(ValidationKeys.NORMAL_MAX);

				if (Util.isNotEmpty(normalMax)) {
					if (normalMin > normalMax) {
						this.normalMinProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-min-value-must-be-smaller-than-normal-max")
						);

						this.normalMinProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(min)) {
					if (normalMin < min) {
						this.normalMinProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-min-value-must-be-larger-than-min")
						);

						this.normalMinProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(max)) {
					if (normalMin > max) {
						this.normalMinProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-min-value-must-be-smaller-than-max")
						);

						this.normalMinProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.NORMAL_MIN, normalMin);

				break;
			}
			case "normalMinBoundary": {
				this.toggleBoundary(ValidationKeys.NORMAL_MIN);
				break;
			}
			case "normalMinMessage": {
				this.setSectionMessage(ValidationKeys.NORMAL_MIN, this.normalMinProps.message.getValue());
				break;
			}
			case "normalMinErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.NORMAL_MIN, this.normalMinProps.errorLevel.getValue());
				break;
			}
			case "normalMaxValue": {
				const value = this.normalMaxProps.value.getValue();
				if (Util.isEmpty(value)) {
					this.setSectionValue(ValidationKeys.NORMAL_MAX, "");

					break;
				}

				const min = this.getSectionValue(ValidationKeys.MIN);
				const max = this.getSectionValue(ValidationKeys.MAX);
				const normalMin = this.getSectionValue(ValidationKeys.NORMAL_MIN);
				const normalMax = Number(value);

				if (Util.isNotEmpty(normalMin)) {
					if (normalMax < normalMin) {
						this.normalMaxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-max-value-must-be-larger-than-normal-min")
						);

						this.normalMaxProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(min)) {
					if (normalMax < min) {
						this.normalMaxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-max-value-must-be-larger-than-min")
						);

						this.normalMaxProps.value.fireRefresh();

						break;
					}
				}

				if (Util.isNotEmpty(max)) {
					if (normalMax > max) {
						this.normalMaxProps.value.setError(
							ErrorClass.ERROR,
							Util.translate("normal-max-value-must-be-smaller-than-max")
						);

						this.normalMaxProps.value.fireRefresh();

						break;
					}
				}

				this.setSectionValue(ValidationKeys.NORMAL_MAX, normalMax);

				break;
			}
			case "normalMaxBoundary": {
				this.toggleBoundary(ValidationKeys.NORMAL_MAX);
				break;
			}
			case "normalMaxMessage": {
				this.setSectionMessage(ValidationKeys.NORMAL_MAX, this.normalMaxProps.message.getValue());
				break;
			}
			case "normalMaxErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.NORMAL_MAX, this.normalMaxProps.errorLevel.getValue());
				break;
			}
			case "customValue": {
				this.setSectionValue(ValidationKeys.CUSTOM, this.customProps.value.getValue());
				break;
			}
			case "customMessage": {
				this.setSectionMessage(ValidationKeys.CUSTOM, this.customProps.message.getValue());
				break;
			}
			case "customErrorLevel": {
				this.setSectionErrorLevel(ValidationKeys.CUSTOM, this.customProps.errorLevel.getValue());
				break;
			}
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	getSection(sectionId) {
		return this.validation[sectionId];
	}

	enableSection(sectionId, enable) {
		if (enable) {
			switch (sectionId) {
				case ValidationKeys.REQUIRED: {
					const message = {};

					for (let i = 0; i < this.availableLanguageIds.length; i++) {
						const lang = this.availableLanguageIds[i];
						message[lang] = "This field is required";
					}

					this.validation.required = {
						value: true,
						message: message,
						errorClass: ErrorClass.ERROR
					};

					this.requiredProps.message.setValue({ value: message });

					break;
				}
				case ValidationKeys.CUSTOM: {
					this.validation.custom = {
						value: "(value)=>{\n return true;\n}",
						message: {},
						errorClass: ErrorClass.ERROR
					};

					this.customProps.value.setValue({ value: "(value)=>{\n return true;\n}" });
					break;
				}
				default: {
					this.validation[sectionId] = {
						value: "",
						message: {},
						errorClass: ErrorClass.ERROR
					};
				}
			}
		} else {
			delete this.validation[sectionId];
		}

		this.forceUpdate();
		this.workingParam.fireRefresh();
	}

	checkSectionEnabled(sectionId) {
		return !!this.getSection(sectionId);
	}

	getSectionValue(sectionId) {
		const section = this.getSection(sectionId);

		return Util.isNotEmpty(section) ? section.value ?? "" : "";
	}

	getSectionBoundary(sectionId) {
		const section = this.getSection(sectionId);
		return section ? section.boundary ?? false : false;
	}

	getSectionMessage(sectionId) {
		const section = this.getSection(sectionId);
		return section ? section.message ?? {} : {};
	}

	getSectionErrorClass(sectionId) {
		const section = this.getSection(sectionId);
		return section ? section.errorClass ?? ErrorClass.ERROR : ErrorClass.ERROR;
	}

	setSectionValue(sectionId, value) {
		let prevSection = this.getSection(sectionId);

		if (value) {
			prevSection.value = value;

			if (sectionId == ValidationKeys.REQUIRED) {
				prevSection.value = value;

				if (Util.isEmpty(prevSection.message)) {
					prevSection.message = {};

					for (let i = 0; i < this.availableLanguageIds.length; i++) {
						const lang = this.availableLanguageIds[i];
						this.setSectionMessageTranslation(ValidationKeys.REQUIRED, "This field is required", lang);
					}
				}
			}
		} else {
			if (sectionId == ValidationKeys.REQUIRED) {
				prevSection = {};
			} else {
				prevSection.value = value;
			}
		}

		this.validation[sectionId] = prevSection;

		this.workingParam.validation = this.validation;

		this.workingParam.validate();
		this.workingParam.fireRefresh();

		this.forceUpdate();
	}

	setSectionMessage(sectionid, message) {
		const prevSection = this.getSection(sectionid);

		prevSection.message = message;
		this.validation[sectionid] = prevSection;
		this.workingParam.validation = this.validation;

		this.forceUpdate();

		this.workingParam.validate();
		this.workingParam.fireRefresh();
	}

	setSectionMessageTranslation(sectionid, translation, languageId) {
		const prevSection = this.getSection(sectionid);
		const prevMsg = prevSection.message ?? {};
		prevMsg[languageId] = translation;
		prevSection.message = prevMsg;

		this.validation[sectionid] = prevSection;

		this.forceUpdate();
		this.workingParam.validate();
		this.workingParam.fireRefreshPreview();
	}

	setSectionErrorLevel(sectionid, errorLevel) {
		const prevSection = this.getSection(sectionid);

		prevSection.errorClass = errorLevel;
		this.validation[sectionid] = prevSection;
		this.workingParam.validation = this.validation;
		this.forceUpdate();
		this.workingParam.validate();
		this.workingParam.fireRefreshPreview();
	}

	handleToggle(sectionId) {
		this.enableSection(sectionId, !this.checkSectionEnabled(sectionId));
	}

	toggleBoundary(sectionId) {
		const prevSection = this.getSection(sectionId) ?? {};

		prevSection.boundary = !prevSection.boundary;

		this.validation[sectionId] = prevSection;
		this.workingParam.validation = this.validation;

		this.forceUpdate();
		this.workingParam.validate();
		this.workingParam.fireRefresh();
	}

	handleMessageChanged(sectionId, translations) {
		this.setSectionMessage(sectionId, translations);
	}

	handleErrorLevelChanged(sectionId, errorLevel) {
		this.setSectionErrorLevel(sectionId, errorLevel);
	}

	handleLanguageChanged(sectionId, locale) {
		this.state.selectedLang[sectionId] = locale;

		this.setState({ ...this.state.selectedLang });
	}

	renderToggleBar(sectionId) {
		let titleKey;

		switch (sectionId) {
			case ValidationKeys.REQUIRED: {
				titleKey = "required";
				break;
			}
			case ValidationKeys.PATTERN: {
				titleKey = "pattern";
				break;
			}
			case ValidationKeys.MIN_LENGTH: {
				titleKey = "min-length";
				break;
			}
			case ValidationKeys.MAX_LENGTH: {
				titleKey = "max-length";
				break;
			}
			case ValidationKeys.MIN: {
				titleKey = "min";
				break;
			}
			case ValidationKeys.MAX: {
				titleKey = "max";
				break;
			}
			case ValidationKeys.NORMAL_MIN: {
				titleKey = "normal-min";
				break;
			}
			case ValidationKeys.NORMAL_MAX: {
				titleKey = "normal-max";
				break;
			}
			case ValidationKeys.CUSTOM: {
				titleKey = "custom";
				break;
			}
		}

		return (
			<div className="autofit-row">
				<span className="autifit-col autofit-col-expand">
					<h4>{Util.translate(titleKey)}</h4>
				</span>
				<span className="autofit-col">
					<ClayToggle
						onToggle={() => this.handleToggle(sectionId)}
						spritemap={this.spritemap}
						symbol={{
							off: "times",
							on: "check"
						}}
						toggled={this.checkSectionEnabled(sectionId)}
						className="form-control-sm"
					/>
				</span>
			</div>
		);
	}

	renderSectionBody(sectionId) {
		switch (sectionId) {
			case "required": {
				return (
					<>
						{this.requiredProps.message.renderField({ spritemap: this.spritemap })}
						{this.requiredProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "pattern": {
				return (
					<>
						{this.patternProps.value.renderField({ spritemap: this.spritemap })}
						{this.patternProps.message.renderField({ spritemap: this.spritemap })}
						{this.patternProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "minLength": {
				return (
					<>
						{this.minLengthProps.value.renderField({ spritemap: this.spritemap })}
						{this.minLengthProps.message.renderField({ spritemap: this.spritemap })}
						{this.minLengthProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "maxLength": {
				return (
					<>
						{this.maxLengthProps.value.renderField({ spritemap: this.spritemap })}
						{this.maxLengthProps.message.renderField({ spritemap: this.spritemap })}
						{this.maxLengthProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "min": {
				return (
					<>
						<div
							className="autofit-row autofit-padded"
							style={{ marginBottom: "0.5rem" }}
						>
							<div className="autofit-col autofit-col-expand">
								{this.minProps.value.render({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.minProps.boundary.render({
									spritemap: this.spritemap,
									style: { marginTop: "1.5rem" }
								})}
							</div>
						</div>
						{this.minProps.message.renderField({ spritemap: this.spritemap })}
						{this.minProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "max": {
				return (
					<>
						<div
							className="autofit-row autofit-padded"
							style={{ marginBottom: "0.5rem" }}
						>
							<div className="autofit-col autofit-col-expand">
								{this.maxProps.value.renderField({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.maxProps.boundary.renderField({
									spritemap: this.spritemap,
									style: { marginTop: "1.5rem" }
								})}
							</div>
						</div>
						{this.maxProps.message.renderField({ spritemap: this.spritemap })}
						{this.maxProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "normalMin": {
				return (
					<>
						<div
							className="autofit-row autofit-padded"
							style={{ marginBottom: "0.5rem" }}
						>
							<div className="autofit-col autofit-col-expand">
								{this.normalMinProps.value.renderField({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.normalMinProps.boundary.renderField({
									spritemap: this.spritemap,
									style: { marginTop: "1.5rem" }
								})}
							</div>
						</div>
						{this.normalMinProps.message.renderField({ spritemap: this.spritemap })}
						{this.normalMinProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "normalMax": {
				return (
					<>
						<div
							className="autofit-row autofit-padded"
							style={{ marginBottom: "0.5rem" }}
						>
							<div className="autofit-col autofit-col-expand">
								{this.normalMaxProps.value.renderField({ spritemap: this.spritemap })}
							</div>
							<div className="autofit-col">
								{this.normalMaxProps.boundary.renderField({
									spritemap: this.spritemap,
									style: { marginTop: "1.5rem" }
								})}
							</div>
						</div>
						{this.normalMaxProps.message.renderField({ spritemap: this.spritemap })}
						{this.normalMaxProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
			case "custom": {
				return (
					<>
						{this.customProps.value.renderField({ spritemap: this.spritemap })}
						{this.customProps.message.renderField({ spritemap: this.spritemap })}
						{this.customProps.errorLevel.renderField({ spritemap: this.spritemap })}
					</>
				);
			}
		}
	}

	errorLevelSelector(sectionId) {
		const errorClass = this.getSection(sectionId)
			? this.getSection(sectionId).errorClass ?? ErrorClass.ERROR
			: ErrorClass.ERROR;

		return (
			<ClaySelectWithOption
				aria-label={Util.translate("error-level")}
				options={this.errorLevelOptions}
				value={errorClass}
				onChange={(e) => {
					this.handleErrorLevelChanged(sectionId, e.target.value);
				}}
				spritemap={this.spritemap}
			/>
		);
	}

	hasPatternValidation(paramType) {
		return paramType == ParamType.STRING || paramType == ParamType.LOCALIZED_STRING;
	}

	hasLengthValidation(paramType) {
		return paramType == ParamType.STRING || paramType == ParamType.LOCALIZED_STRING;
	}

	hasMinMaxValidation(paramType) {
		return paramType == ParamType.NUMERIC;
	}

	hasCustomValidation(paramType) {
		return (
			paramType == ParamType.STRING ||
			paramType == ParamType.LOCALIZED_STRING ||
			paramType == ParamType.NUMERIC ||
			paramType == ParamType.INTEGER ||
			paramType == ParamType.MATRIX
		);
	}

	render() {
		return (
			<>
				{this.workingParam.paramType !== ParamType.GROUP && this.workingParam.paramType !== ParamType.GRID && (
					<div className="border sx-validation-section">
						<div className="autofit-row">{this.renderToggleBar(ValidationKeys.REQUIRED)}</div>
						{this.checkSectionEnabled(ValidationKeys.REQUIRED) && (
							<div style={{ marginLeft: "2rem" }}>{this.renderSectionBody(ValidationKeys.REQUIRED)}</div>
						)}
					</div>
				)}
				{(this.workingParam.paramType == ParamType.GROUP || this.workingParam.paramType == ParamType.GRID) && (
					<div className="border sx-validation-section">
						<div>{Util.translate("no-validation-rule-for-group-or-grid")}</div>
					</div>
				)}
				{this.hasPatternValidation(this.workingParam.paramType) && (
					<div className="border sx-validation-section">
						<div className="autofit-row">{this.renderToggleBar(ValidationKeys.PATTERN)}</div>
						{this.checkSectionEnabled(ValidationKeys.PATTERN) && (
							<div style={{ marginLeft: "2rem" }}>{this.renderSectionBody(ValidationKeys.PATTERN)}</div>
						)}
					</div>
				)}

				{this.hasLengthValidation(this.workingParam.paramType) && (
					<>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.MIN_LENGTH)}</div>
							{this.checkSectionEnabled(ValidationKeys.MIN_LENGTH) && (
								<div style={{ marginLeft: "2rem" }}>
									{this.renderSectionBody(ValidationKeys.MIN_LENGTH)}
								</div>
							)}
						</div>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.MAX_LENGTH)}</div>
							{this.checkSectionEnabled(ValidationKeys.MAX_LENGTH) && (
								<div style={{ marginLeft: "2rem" }}>
									{this.renderSectionBody(ValidationKeys.MAX_LENGTH)}
								</div>
							)}
						</div>
					</>
				)}
				{this.hasMinMaxValidation(this.workingParam.paramType) && (
					<>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.MIN)}</div>
							{this.checkSectionEnabled("min") && (
								<div style={{ marginLeft: "2rem" }}>{this.renderSectionBody(ValidationKeys.MIN)}</div>
							)}
						</div>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.MAX)}</div>
							{this.checkSectionEnabled(ValidationKeys.MAX) && (
								<div style={{ marginLeft: "2rem" }}>{this.renderSectionBody(ValidationKeys.MAX)}</div>
							)}
						</div>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.NORMAL_MIN)}</div>
							{this.checkSectionEnabled(ValidationKeys.NORMAL_MIN) && (
								<div style={{ marginLeft: "2rem" }}>
									{this.renderSectionBody(ValidationKeys.NORMAL_MIN)}
								</div>
							)}
						</div>
						<div className="border sx-validation-section">
							<div className="autofit-row">{this.renderToggleBar(ValidationKeys.NORMAL_MAX)}</div>
							{this.checkSectionEnabled(ValidationKeys.NORMAL_MAX) && (
								<div style={{ marginLeft: "2rem" }}>
									{this.renderSectionBody(ValidationKeys.NORMAL_MAX)}
								</div>
							)}
						</div>
					</>
				)}
				{this.hasCustomValidation(this.workingParam.paramType) && (
					<div className="border sx-validation-section">
						<div className="autofit-row">{this.renderToggleBar(ValidationKeys.CUSTOM)}</div>
						{this.checkSectionEnabled(ValidationKeys.CUSTOM) && (
							<div style={{ marginLeft: "2rem" }}>{this.renderSectionBody(ValidationKeys.CUSTOM)}</div>
						)}
					</div>
				)}
				{this.state.noticeDialog && (
					<SXModalDialog
						header={this.dlgHeader}
						body={this.dlgBody}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ noticeDialog: false });
								}
							}
						]}
					/>
				)}
			</>
		);
	}
}

export default SXDSBuilderValidationPanel;
