import React from "react";
import { Constant, ParamType } from "../../stationx/station-x";
import { GroupParameter } from "../../stationx/parameter";
import { Util } from "../../stationx/util";

export class DataStructure extends GroupParameter {
	static ViewTypes = {
		BAREBONE: "barebone"
	};

	static JumpToBasis = {
		PARAM_CODE: "paramCode",
		DISPLAY_NAME: "displayName"
	};

	static checkError(fields) {
		//console.log("checkError: ", fields);
		let error = null;
		fields.every((field) => {
			if (field.hasError()) {
				error = {
					errorClass: field.errorClass,
					errorMessage: field.errorMessage
				};
			}

			return Util.isEmpty(error) ? Constant.CONTINUE_EVERY : Constant.STOP_EVERY;
		});

		return error;
	}

	#paramDelimiter = ";";
	#paramDelimiterPosition = "end";
	#paramValueDelimiter = "=";
	#hierarchicalData = false;

	constructor(namespace, formId, languageId, availableLanguageIds, json = {}) {
		super(namespace, formId, languageId, availableLanguageIds);

		this.parse(json);
	}

	get paramDelimiter() {
		return this.#paramDelimiter;
	}
	get paramDelimiterPosition() {
		return this.#paramDelimiterPosition;
	}
	get paramValueDelimiter() {
		return this.#paramValueDelimiter;
	}
	get hierarchicalData() {
		return this.#hierarchicalData;
	}
	get dataStructureId() {
		return this.paramId;
	}
	get dataStructureCode() {
		return this.paramCode;
	}
	get dataStructureVersion() {
		return this.paramVersion;
	}
	get description() {
		return this.definition;
	}

	set paramDelimiter(val) {
		this.#paramDelimiter = val;
	}
	set paramDelimiterPosition(val) {
		this.#paramDelimiterPosition = val;
	}
	set paramValueDelimiter(val) {
		this.#paramValueDelimiter = val;
	}
	set hierarchicalData(val) {
		this.#hierarchicalData = val;
	}
	set dataStructureId(val) {
		this.paramId = val;
	}
	set dataStructureCode(val) {
		this.paramCode = val;
	}
	set dataStructureVersion(val) {
		this.paramVersion = val;
	}
	set description(val) {
		this.definition = val;
	}

	initProperties(json) {
		this.parse(json);
	}

	checkDuplicateParamCode(param) {
		let duplicated = false;

		this.members.every((member) => {
			if (param !== member) {
				duplicated = member.checkDuplicateParamCode(param);
			}

			return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return duplicated;
	}

	checkDuplicateParam(param) {
		let duplicated = false;

		this.members.every((member) => {
			if (param !== member) {
				duplicated = member.checkDuplicateParam(param);
			}

			return duplicated ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return duplicated;
	}

	addMember(member) {
		super.addMember(member);
	}

	getSiblingParameters({ groupCode = "", groupVersion = "", paramCode, paramVersion }) {
		let siblings;

		if (!groupCode) {
			siblings = this.members;
		} else {
			const group = this.findParameter(groupCode, groupVersion);
			siblings = group.members;
		}

		return siblings.filter((param) => !(param.paramCode == paramCode && param.paramVersion == paramVersion));
	}

	getSiblingGroups({ groupCode = "", groupVersion = "", paramCode, paramVersion }) {
		let siblings;

		if (!groupCode) {
			siblings = this.members;
		} else {
			const group = this.findParameter(groupCode, groupVersion);
			siblings = group.members;
		}

		return siblings.filter(
			(param) => param.isGroup && (param.paramCode !== paramCode || param.paramVersion !== paramVersion)
		);
	}

	getChildParameters({ paramCode, paramVersion }) {
		if (Util.isEmpty(paramCode)) {
			return this.members;
		} else {
			const groupParam = this.getParameter(paramCode, paramVersion);

			return groupParam.members;
		}
	}

	getSiblingParamsAsSelectItems({ groupCode = "", groupVersion = "", paramCode, paramVersion }) {
		const siblings = this.getSiblingParameters({
			groupCode: groupCode,
			groupVersion: groupVersion,
			paramCode: paramCode,
			paramVersion: paramVersion
		});

		return siblings.map((param) => param.convertToSelectItem());
	}

	getSiblingGroupsAsSelectItems({ groupCode = "", groupVersion = "", paramCode, paramVersion }) {
		const param = this.getParameter(paramCode, paramVersion);

		const siblings = this.getSiblingGroups({
			groupCode: groupCode,
			groupVersion: groupVersion,
			paramCode: paramCode,
			paramVersion: paramVersion
		});

		return siblings.map((param) => param.convertToSelectItem());
	}

	getAllGroups({ paramCode, paramVersion }) {
		let groups = [this];

		const pickUpGroup = (params) => {
			params.forEach((param) => {
				if (param.isGroup) {
					if (!param.equalTo(paramCode, paramVersion)) {
						groups.push(param);
						pickUpGroup(param.members);
					}
				}
			});
		};

		pickUpGroup(this.members);

		return groups;
	}

	moveParameterGroup(param, srcGroup, targetGroup) {
		console.log("moveParameterGroup: ", param, srcGroup, targetGroup);
		targetGroup.addMember(srcGroup.removeMember({ paramCode: param.paramCode, paramVersion: param.paramVersion }));
	}

	getJumpToItems(rootGroup, basis = DataStructure.JumpToBasis.DISPLAY_NAME) {
		const members = !!rootGroup ? rootGroup.members : this.members;
		let items = [];

		members.forEach((param) => {
			if (param.isGroup) {
				items = items.concat(this.getJumpToItems(param, basis));
			}

			basis == DataStructure.JumpToBasis.DISPLAY_NAME
				? items.push({ name: param.paramCode, version: param.paramVersion })
				: items.push({ name: param.label, version: param.paramVersion });
		});

		console.log("getJumpToItems: ", rootGroup, basis, items);
		return items;
	}

	setTitleBarInfos(infos) {
		for (const key in infos) {
			switch (key) {
				case "commentable": {
					this.setTitleBarInfo(key, infos.commentable);
					break;
				}
				case "verifiable": {
					this.setTitleBarInfo(key, infos.verifiable);
					break;
				}
				case "freezable": {
					this.setTitleBarInfo(key, infos.freezable);
					break;
				}
				case "verified": {
					this.setTitleBarInfo(key, infos.verified);
					break;
				}
				case "freezed": {
					this.setTitleBarInfo(key, infos.freezed);
					break;
				}
				case "inputStatus": {
					this.setTitleBarInfo(key, infos.inputStatus);
					break;
				}
				case "jumpTo": {
					this.jumpTo = infos.inputStatus;
					break;
				}
			}
		}
	}

	getDataAbstract() {
		let abstrct = "";

		this.members.forEach((member) => {
			if (abstract && member.abstract) {
				abstract += " ";
			}

			abstract += member.abstract;
		});
	}

	toData() {
		let data = {};

		this.members.forEach((member) => {
			data = { ...data, ...member.toData() };
		});

		return data;
	}

	parse(json = {}) {
		super.parse(json);

		this.viewType = DataStructure.ViewTypes.BAREBONE;
		this.parent = {};

		this.paramDelimiter = json.paramDelimiter ?? ";";
		this.paramDelimiterPosition = json.paramDelimiterPosition ?? "end";
		this.paramValueDelimiter = json.paramValueDelimiter ?? "=";

		this.dataStructureId = json.paramId ?? json.dataStructureId;
	}

	toJSON() {
		let json = super.toJSON();

		if (this.paramDelimiter !== ";") json.paramDelimiter = this.paramDelimiter;
		if (this.paramDelimiterPosition !== "end") json.paramDelimiterPosition = this.paramDelimiterPosition;
		if (this.paramValueDelimiter !== "=") json.paramValueDelimiter = this.paramValueDelimiter;

		json.dataStructureId = this.dataStructureId;

		return json;
	}

	renderPreview({ dsbuilderId, propertyPanelId, previewCanvasId, className, style, spritemap }) {
		return (
			<>
				{this.members.map((parameter) => {
					parameter.position = this.getMemberPosition(parameter);

					return parameter.renderPreview({
						dsbuilderId: dsbuilderId,
						propertyPanelId: propertyPanelId,
						previewCanvasId: previewCanvasId,
						className: className,
						style: style,
						spritemap: spritemap
					});
				})}
			</>
		);
	}

	render({ canvasId, events, className, style, spritemap }) {
		return (
			<div id={canvasId}>
				{this.members.map((parameter) =>
					parameter.renderField({
						events: events,
						className: className,
						style: style,
						spritemap: spritemap
					})
				)}
			</div>
		);
	}
}
