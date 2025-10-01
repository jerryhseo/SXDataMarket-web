import React from "react";
import { Util } from "../../stationx/util";
import { BooleanParameter, GroupParameter, Parameter } from "../../stationx/parameter";
import { DataTypeProperty, ErrorClass, Event, ParamType, ValidationRule } from "../../stationx/station-x";
import { SXLabeledText } from "../../stationx/form";
import { Body, Cell, Head, Row, Table, Text } from "@clayui/core";
import { DataStructure } from "../DataStructure/data-structure";

export class DataType {
	languageId;
	availableLanguageIds;

	dataTypeId = 0;
	dataTypeCode = "";
	dataTypeVersion = "1.0.0";
	extension = "";
	displayName = {};
	description = {};
	tooltip = {};

	dirty = false;

	constructor(languageId, availableLanguageIds, json) {
		this.languageId = languageId;
		this.availableLanguageIds = availableLanguageIds;

		if (json) {
			this.parse(json);
		}
	}

	getDisplayName() {
		return this.displayName[this.languageId];
	}

	getDescription() {
		return this.description[this.languageId];
	}

	getTooltip() {
		return this.tooltip[this.languageId];
	}

	setProperty(prop, value) {
		this[prop] = value;
	}

	validate() {
		if (
			Util.isEmpty(this.dataTypeCode) ||
			Util.isEmpty(this.dataTypeVersion) ||
			Util.isEmpty(this.extension) ||
			Util.isEmpty(this.displayName)
		) {
			return false;
		}

		return true;
	}

	copy() {
		let json = {};

		json.dataTypeCode = "";
		json.dataTypeVersion = "1.0.0";
		json.extension = this.extension;
		json.displayName = this.displayName;
		json.description = this.description;
		json.tooltip = this.tooltip;

		json.languageId = this.languageId;
		json.availableLanguageIds = this.availableLanguageIds;

		return new DataType(this.languageId, this.availableLanguageIds, json);
	}

	parse(json) {
		for (const prop in json) {
			switch (prop) {
				case "dataTypeId": {
					this.dataTypeId = json[prop];
					break;
				}
				case "dataTypeCode": {
					this.dataTypeCode = json[prop];
					break;
				}
				case "dataTypeVersion": {
					this.dataTypeVersion = json[prop];
					break;
				}
				case "extension": {
					this.extension = json[prop];
					break;
				}
				case "displayName": {
					this.displayName = json[prop];
					break;
				}
				case "description": {
					this.description = json[prop];
					break;
				}
				case "tooltip": {
					this.tooltip = json[prop];
					break;
				}
			}
		}
	}

	toJSON() {
		let json = {};

		json.dataTypeId = this.dataTypeId;
		json.dataTypeCode = this.dataTypeCode;
		json.dataTypeVersion = this.dataTypeVersion;
		json.extension = this.extension;
		json.displayName = this.displayName;
		if (Util.isNotEmpty(this.description)) json.description = this.description;
		if (Util.isNotEmpty(this.tooltip)) json.tooltip = this.tooltip;

		json.languageId = this.languageId;
		json.availableLanguageIds = this.availableLanguageIds;

		return json;
	}
}

export class DataTypeStructureLink {
	static ViewTypes = {
		VIEW: "view",
		EDIT: "edit",
		NONE: "none"
	};

	dataTypeId = 0;
	dataStructureId = 0;

	commentable = false;
	freezable = false;
	verifiable = false;
	freezed = false;
	freezedUserId = 0;
	freezedDate = null;
	verified = false;
	verifiedUserId = 0;
	verifiedDate = null;
	inputStatus = false;
	jumpTo = false;

	dirty = false;
	fromDB = false;

	constructor(languageId, availableLanguageIds, json) {
		this.languageId = languageId;
		this.availableLanguageIds = availableLanguageIds;

		if (json) {
			this.parse(json);
		}
	}

	copy() {
		return new DataTypeStructureLink(this.languageId, this.availableLanguageIds, this.toJSON());
	}

	parse(json) {
		for (const prop in json) {
			switch (prop) {
				case "dataTypeId": {
					this.dataTypeId = json.dataTypeId;
					break;
				}
				case "dataStructureId": {
					this.dataStructureId = json.dataStructureId;
					break;
				}
				case "commentable": {
					this.commentable = json.commentable;
					break;
				}
				case "verifiable": {
					this.verifiable = json.verifiable;
					break;
				}
				case "freezable": {
					this.freezable = json.freezable;
					break;
				}
				case "verified": {
					this.verified = json.verified;
					break;
				}
				case "verifiedUserId": {
					this.verifiedUserId = json.verifiedUserId;
					break;
				}
				case "verifiedDate": {
					this.verifiedDate = new Date(json.verifiedDate);
					break;
				}
				case "freezed": {
					this.freezed = json.freezed;
					break;
				}
				case "freezedUserId": {
					this.freezedUserId = json.freezedUserId;
					break;
				}
				case "freezedDate": {
					this.freezedDate = new Date(json.freezedDate);
					break;
				}
				case "inputStatus": {
					this.inputStatus = json.inputStatus;
					break;
				}
				case "jumpTo": {
					this.jumpTo = json.jumpTo;
					break;
				}
			}
		}
	}

	toJSON() {
		let json = {};

		if (this.dataTypeId > 0) json.dataTypeId = this.dataTypeId;
		if (this.dataStructureId > 0) json.dataStructureId = this.dataStructureId;
		if (this.commentable) json.commentable = this.commentable;
		if (this.verifiable) json.verifiable = this.verifiable;
		if (this.freezable) json.freezable = this.freezable;
		if (this.verified) json.verified = this.verified;
		if (this.verifiedUserId > 0) json.verifiedUserId = this.verifiedUserId;
		if (this.verifiedDate) json.verifiedDate = this.verifiedDate.getTime();
		if (this.freezed) json.freezed = this.freezed;
		if (this.freezedUserId > 0) json.freezedUserId = this.freezedUserId;
		if (this.freezedDate) json.freezedDate = this.freezedDate.getTime();
		if (this.inputStatus) json.inputStatus = this.inputStatus;
		if (this.jumpTo) json.jumpTo = this.jumpTo;

		return json;
	}
}

export const SXInstanceInfo = ({
	title,
	id,
	code,
	version,
	displayName,
	align = "left",
	viewType = "INLINE_ATTACH"
}) => {
	return (
		<>
			<div
				className="form-group sx-fieldset"
				style={{ marginTop: "2rem" }}
			>
				<div className="sx-legend">{title}</div>
				<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
					<div className="autofit-col">
						<SXLabeledText
							label={Util.translate("id")}
							text={id}
							align={align}
							viewType={viewType}
						/>
					</div>
					<div className="autofit-col">
						<SXLabeledText
							label={Util.translate("code")}
							text={code}
							align={align}
							viewType={viewType}
						/>
					</div>
					<div className="autofit-col">
						<SXLabeledText
							label={Util.translate("version")}
							text={version}
							align={align}
							viewType={viewType}
						/>
					</div>
					<div className="autofit-col autofit-col-expand">
						<SXLabeledText
							label={Util.translate("display-name")}
							text={displayName}
							align={align}
							viewType={viewType}
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export class SXDataTypeStructureLink extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.formId = props.formId;
		this.languageId = props.languageId ?? SXSystem.getLanguageId();
		this.defaultLanguageId = props.languageId ?? SXSystem.getDefaultLanguageId();
		this.availableLanguageIds = props.availableLanguageIds ?? SXSystem.getAvailableLanguages();

		this.spritemap = props.spritemap;

		this.dataType = props.dataType ?? new DataType(this.languageId, this.availableLanguageIds);
		this.typeStructureLink =
			props.typeStructureLink ?? new DataTypeStructureLink(this.languageId, this.availableLanguageIds);

		this.dataStructure =
			props.dataStructure ??
			new DataStructure(this.namespace, this.formId, this.languageId, this.availableLanguageIds);

		this.dataTypeViewMode = props.dataTypeViewMode ?? DataTypeStructureLink.ViewTypes.NONE;
		this.typeStructureLinkViewMode = props.typeStructureLinkViewMode ?? DataTypeStructureLink.ViewTypes.NONE;
		this.dataStructureViewMode = props.dataStructureViewMode ?? DataTypeStructureLink.ViewTypes.NONE;

		if (Util.isNotEmpty(this.dataType.dataTypeCode) && Util.isEmpty(this.dataStructure.dataStructureCode)) {
			this.dataStructure.dataStructureCode = this.dataType.dataTypeCode;
		}
		if (Util.isNotEmpty(this.dataType.displayName) && Util.isEmpty(this.dataStructure.displayName)) {
			this.dataStructure.displayName = { ...this.dataType.displayName };
		}
		if (Util.isNotEmpty(this.dataType.description) && Util.isEmpty(this.dataStructure.description)) {
			this.dataStructure.description = { ...this.dataType.description };
		}

		this.componentId = this.namespace + "dataTypeStructureLink";

		this.commentable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "commentable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "commentable"),
				tooltip: Util.getTranslationObject(this.languageId, "commentable-tooltip"),
				defaultValue: this.typeStructureLink.commentable
			}
		);

		this.verifiable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "verifiable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "verifiable"),
				tooltip: Util.getTranslationObject(this.languageId, "verifiable-tooltip"),
				defaultValue: this.typeStructureLink.verifiable
			}
		);

		this.freezable = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "freezable",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "freezable"),
				tooltip: Util.getTranslationObject(this.languageId, "freezable-tooltip"),
				defaultValue: this.typeStructureLink.freezable
			}
		);

		this.inputStatus = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "inputStatus",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "enable-input-status"),
				tooltip: Util.getTranslationObject(this.languageId, "enable-input-status-tooltip"),
				defaultValue: this.typeStructureLink.inputStatus
			}
		);

		this.jumpTo = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "jumpTo",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "enable-jump-to"),
				tooltip: Util.getTranslationObject(this.languageId, "enable-jump-to-tooltip"),
				defaultValue: this.typeStructureLink.jumpTo
			}
		);

		this.verified = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "verified",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "verified"),
				tooltip: Util.getTranslationObject(this.languageId, "verified-tooltip"),
				defaultValue: this.typeStructureLink.verified
			}
		);

		this.freezed = Parameter.createParameter(
			this.namespace,
			this.componentId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.BOOLEAN,
			{
				paramCode: "freezed",
				viewType: BooleanParameter.ViewTypes.TOGGLE,
				displayName: Util.getTranslationObject(this.languageId, "freezed"),
				tooltip: Util.getTranslationObject(this.languageId, "freezed-tooltip"),
				defaultValue: this.typeStructureLink.freezed
			}
		);
	}

	listenerValueChanged = (event) => {
		const dataPacket = event.dataPacket;

		if (!(dataPacket.targetPortlet == this.namespace && dataPacket.targetFormId == this.componentId)) {
			return;
		}

		console.log("SXDaTypeStructureLink value changed: ", dataPacket);

		switch (dataPacket.paramCode) {
			case "commentable": {
				this.typeStructureLink.commentable = this.commentable.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.commentable.getValue());
				break;
			}
			case "verifiable": {
				this.typeStructureLink.verifiable = this.verifiable.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.verifiable.getValue());
				break;
			}
			case "freezable": {
				this.typeStructureLink.freezable = this.freezable.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.freezable.getValue());
				break;
			}
			case "inputStatus": {
				this.typeStructureLink.inputStatus = this.inputStatus.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.inputStatus.getValue());
				break;
			}
			case "jumpTo": {
				this.typeStructureLink.jumpTo = this.jumpTo.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.jumpTo.getValue());
				break;
			}
			case "verified": {
				this.typeStructureLink.verified = this.verified.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.verified.getValue());
				break;
			}
			case "freezed": {
				this.typeStructureLink.freezed = this.freezed.getValue();
				this.typeStructureLink.dirty = true;
				this.dataStructure.setTitleBarInfo(dataPacket.paramCode, this.freezed.getValue());
				break;
			}
		}

		Event.fire(Event.SX_TYPE_STRUCTURE_LINK_INFO_CHANGED, this.namespace, this.namespace, {
			targetFormId: this.formId,
			typeStructureLink: this.typeStructureLink
		});
		console.log("Component value changed: ", dataPacket, this.typeStructureLink, this.dataStructure);
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerValueChanged);
	}

	componentWillUnmount() {
		Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerValueChanged);
	}

	render() {
		return (
			<div style={{ marginTop: "2rem" }}>
				{this.dataTypeViewMode !== DataTypeStructureLink.ViewTypes.NONE && (
					<>
						<div className="form-group sx-fieldset">
							<div className="sx-legend">{Util.translate("linked-datatype-info")}</div>
							<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
								<div className="autofit-col">
									<SXLabeledText
										label={Util.translate("datatype-id")}
										text={this.dataType.dataTypeId}
										align="left"
										viewType="INLINE_ATTACH"
									/>
								</div>
								<div className="autofit-col">
									<SXLabeledText
										label={Util.translate("datatype-code")}
										text={this.dataType.dataTypeCode}
										align="left"
										viewType="INLINE_ATTACH"
									/>
								</div>
								<div className="autofit-col">
									<SXLabeledText
										label={Util.translate("datatype-version")}
										text={this.dataType.dataTypeVersion}
										align="left"
										viewType="INLINE_ATTACH"
									/>
								</div>
								<div className="autofit-col autofit-col-expand">
									<SXLabeledText
										label={Util.translate("display-name")}
										text={this.dataType.getDisplayName()}
										align="left"
										viewType="INLINE_ATTACH"
									/>
								</div>
							</div>
						</div>
					</>
				)}

				{this.typeStructureLinkViewMode == DataTypeStructureLink.ViewTypes.VIEW && (
					<div className="form-group sx-fieldset">
						<div className="sx-legend">{Util.translate("type-structure-link-info")}</div>
						<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("commentable")}
									text={this.typeStructureLink.commentable}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("freezable")}
									text={this.typeStructureLink.freezable}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("verifiable")}
									text={this.typeStructureLink.verifiable}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
						</div>
						<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("freezed")}
									text={this.typeStructureLink.freezed}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("verified")}
									text={this.typeStructureLink.verified()}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
						</div>
					</div>
				)}
				{this.typeStructureLinkViewMode == DataTypeStructureLink.ViewTypes.EDIT && (
					<div
						className="autofit-float autofit-padded-no-gutters-x autofit-row"
						style={{ alignItems: "start" }}
					>
						<div className="autofit-col">
							<div className="form-group sx-fieldset">
								<div className="sx-legend">{Util.translate("structure-link-options")}</div>
								<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
									<div className="autofit-col autofit-col-expand">
										{this.commentable.render({
											spritemap: this.spritemap
										})}
									</div>
									<div className="autofit-col autofit-col-expand">
										{this.freezable.render({
											spritemap: this.spritemap
										})}
									</div>
									<div className="autofit-col autofit-col-expand">
										{this.verifiable.render({
											spritemap: this.spritemap
										})}
									</div>
								</div>
								<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
									<div className="autofit-col autofit-col-expand">
										{this.inputStatus.render({
											spritemap: this.spritemap
										})}
									</div>
									<div className="autofit-col autofit-col-expand">
										{this.jumpTo.render({
											spritemap: this.spritemap
										})}
									</div>
								</div>
							</div>
						</div>
						<div className="autofit-col autofit-col-expand">
							<div className="form-group sx-fieldset">
								<div className="sx-legend">{Util.translate("datatype-structure-link-status")}</div>
								<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
									<div className="autofit-col autofit-col-expand">
										{this.verified.render({ spritemap: this.spritemap })}
									</div>
									<div className="autofit-col autofit-col-expand">
										{this.freezed.render({ spritemap: this.spritemap })}
									</div>
								</div>
							</div>
						</div>
						{/*
									<Table
										columnsVisibility={false}
										borderedColumns="true"
										size="sm"
										striped="false"
										style={{
											width: "auto",
											tableLayout: "auto"
										}}
									>
										<Head>
											<Cell
												textAlign="center"
												width="10rem"
											>
												{Util.translate("item")}
											</Cell>
											<Cell
												textAlign="center"
												width="15rem"
											>
												{Util.translate("status")}
											</Cell>
											<Cell
												textAlign="center"
												width="15rem"
											>
												{Util.translate("last-modified-by")}
											</Cell>
											<Cell
												textAlign="center"
												width="20rem"
											>
												{Util.translate("last-modified-date")}
											</Cell>
										</Head>
										<Body>
											<Row>
												<Cell textAlign="center">
													<Text
														size={3}
														weight="bold"
													>
														{Util.translate("verified")}
													</Text>
												</Cell>
												<Cell textAlign="center">
													{this.verified.render({ spritemap: this.spritemap })}
												</Cell>
												<Cell textAlign="center">
													{this.typeStructureLink.verifiedUserId > 0 &&
														this.typeStructureLink.verifiedUserId}
													{this.typeStructureLink.verifiedUserId == 0 && "-"}
												</Cell>
												<Cell textAlign="center">
													{Util.isNotEmpty(this.typeStructureLink.verifiedDate) &&
														this.typeStructureLink.verifiedDate}
													{Util.isEmpty(this.typeStructureLink.verifiedDate) && "-"}
												</Cell>
											</Row>
											<Row>
												<Cell textAlign="center">
													<Text
														size={3}
														weight="bold"
													>
														{Util.translate("freezed")}
													</Text>
												</Cell>
												<Cell textAlign="center">
													{this.freezed.render({ spritemap: this.spritemap })}
												</Cell>
												<Cell textAlign="center">
													{this.typeStructureLink.freezedUserId > 0 &&
														this.typeStructureLink.freezedUserId}
													{this.typeStructureLink.freezedUserId == 0 && "-"}
												</Cell>
												<Cell textAlign="center">
													{Util.isNotEmpty(this.typeStructureLink.freezedDate) &&
														this.typeStructureLink.freezedDate}
													{Util.isEmpty(this.typeStructureLink.freezedDate) && "-"}
												</Cell>
											</Row>
										</Body>
									</Table>*/}
					</div>
				)}

				{this.dataStructureViewMode == DataTypeStructureLink.ViewTypes.VIEW && (
					<div className="form-group sx-fieldset">
						<div className="sx-legend">{Util.translate("datastructure-info")}</div>
						<div className="autofit-float autofit-padded-no-gutters-x autofit-row">
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("datastructure-id")}
									text={this.dataStructure.dataStructureId}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("datastructure-code")}
									text={this.dataStructure.dataStructureCode}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col">
								<SXLabeledText
									label={Util.translate("datastructure-version")}
									text={this.dataStructure.dataStructureVersion}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
							<div className="autofit-col autofit-col-expand">
								<SXLabeledText
									label={Util.translate("display-name")}
									text={this.dataStructure.label}
									align="left"
									viewType="INLINE_ATTACH"
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}
