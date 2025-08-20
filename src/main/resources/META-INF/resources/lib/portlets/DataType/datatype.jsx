import { Util } from "../../stationx/util";

class DataType {
	namespace;
	formId;
	languageid;
	availableLanguageIds;

	dataTypeId = 0;
	dataTypeName = "";
	dataTypeVersion = "1.0.0";
	extension = "";
	displayName = {};
	description = {};
	tooltip = {};
	structureId = 0;

	structureLink = {};
	visualizers = [];

	constructer(namespace, formid, languageId, availableLanguageIds, json) {
		this.namespace = namespace;
		this.formId = formid;
		this.languageid = languageId;
		this.availableLanguageIds = availableLanguageIds;

		if (json) {
			this.parse(json);
		}
	}

	getDisplayName() {
		return this.displayName[this.languageid];
	}

	getDescription() {
		return this.description[this.languageid];
	}

	getTooltip() {
		return this.tooltip[this.languageid];
	}

	toJSON() {
		let dataType = {};

		json.dataTypeId = this.dataTypeId;
		json.dataTypeName = this.dataTypeName;
		json.dataTypeVersion = this.dataTypeVersion;
		json.extension = this.extension;
		json.displayName = this.displayName;
		if (Util.isNotEmpty(this.description)) json.description = this.description;
		if (Util.isNotEmpty(this.tooltip)) json.tooltip = this.tooltip;
		if (this.structureId > 0) json.structureId = this.structureId;
		else if (this.structureLink.structureId > 0) json.structureId = this.structureLink.structureId;

		return {
			dataType: dataType,
			structureLink: this.structureLink,
			visualizers: this.visualizers
		};
	}

	validate() {
		if (Util.isEmpty(this.dataTypeName)) return "dataTypeName";
		if (Util.isEmpty(this.dataTypeVersion)) return "dataTypeVersion";
		if (Util.isEmpty(this.extension)) return "extension";
		if (Util.isEmpty(this.displayName)) return "displayName";
		if (Util.isEmpty(this.visualizers)) return "visualizers";
	}

	parse(json) {
		for (const prop in json) {
			switch (prop) {
				case "dataTypeId": {
					this.dataTypeId = json[prop];
					break;
				}
				case "dataTypeName": {
					this.dataTypeName = json[prop];
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
				case "structureId": {
					this.structureId = json[prop];
					break;
				}
				case "structureLink": {
					this.structureLink = json[prop];
					break;
				}
				case "visualizers": {
					this.visualizers = json[prop];
					break;
				}
			}
		}
	}
}

export class DataTypeStructureLink {
	typeStructureLinkId = 0;
	dataTypeId = 0;
	dataStructureId = 0;

	commentable = false;
	freezable = false;
	verifiable = false;
	freezed = false;
	verified = true;
	inputStatus = false;
	jumpTo = false;

	constructor(namespace, formid, languageId, availableLanguageIds, json) {
		this.namespace = namespace;
		this.formId = formid;
		this.languageid = languageId;
		this.availableLanguageIds = availableLanguageIds;

		if (json) {
			this.parse(json);
		}
	}

	parse(json) {
		for (const prop in json) {
			switch (prop) {
				case "typeStructureLinkId": {
					this.typeStructureLinkId = json.typeStructureLinkId;
					break;
				}
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
				case "freezed": {
					this.freezed = json.freezed;
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

		if (this.typeStructureLinkId > 0) json.typeStructureLinkId = this.typeStructureLinkId;
		if (this.dataTypeId > 0) json.dataTypeId = this.dataTypeId;
		if (this.dataStructureId > 0) json.dataStructureId = this.dataStructureId;
		if (this.commentable) json.commentable = this.commentable;
		if (this.verifiable) json.verifiable = this.verifiable;
		if (this.freezable) json.freezable = this.freezable;
		if (this.verified) json.verified = this.verified;
		if (this.freezed) json.freezed = this.freezed;
		if (this.inputStatus) json.inputStatus = this.inputStatus;
		if (this.jumpTo) json.jumpTo = this.jumpTo;

		return json;
	}
}

export default DataType;
