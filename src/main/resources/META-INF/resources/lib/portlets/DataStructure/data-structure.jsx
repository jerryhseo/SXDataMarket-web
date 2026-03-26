import React from 'react';
import { Constant, ParamType } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import { GroupParameter } from '../Parameter/parameters';

class DataStructure extends GroupParameter {
  static ViewTypes = {
    BAREBONE: 'barebone'
  };

  static JumpToBasis = {
    PARAM_CODE: 'paramCode',
    DISPLAY_NAME: 'displayName'
  };

  static checkError(fields) {
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

  #paramDelimiter = ';';
  #paramDelimiterPosition = 'end';
  #paramValueDelimiter = '=';
  #hierarchicalData = false;

  #inputStatus = false;
  #jumpTo = false;
  #bulletNo = false;

  #verified = {};
  #freezed = {};

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace: namespace,
      formId: formId
    });

    if (Util.isNotEmpty(properties)) {
      this.parse(properties);
    }

    //console.log('[DataStructure constructor] ', namespace, formId, properties);
    this.paramCode = properties.paramCode ?? formId;
    this.paramVersion = properties.paramVersion ?? '1.0.0';
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
  get inputStatus() {
    return this.#inputStatus;
  }
  get jumpTo() {
    return this.#jumpTo;
  }
  get bulletNo() {
    return this.#bulletNo;
  }
  get jumpTo() {
    return this.#jumpTo;
  }
  get verified() {
    return this.#verified;
  }
  get freezed() {
    return this.#freezed;
  }

  get label() {
    return '_ROOT_';
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
  set inputStatus(inputStatus) {
    this.#inputStatus = inputStatus;
  }
  set jumpTo(jumpTo) {
    this.#jumpTo = jumpTo;
  }
  set bulletNo(bulletNo) {
    this.#bulletNo = bulletNo;
  }
  set verified(verified) {
    this.#verified = verified;
  }
  set freezed(freezed) {
    this.#freezed = freezed;
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

  getParentGroup(parameter) {
    return this.findParameter({
      paramCode: parameter.parent?.code,
      paramVersion: parameter.parent?.version
    });
  }

  getSiblingParameters({ group, parameter }) {
    return group.members?.filter((member) => member !== parameter);
  }

  getSiblingCodes({ group = this, parameter }) {
    let members = group.members.filter((member) => member !== parameter);

    let siblingCodes = new Set([]);
    if (members.length === group.members.length) {
      members.forEach((member) => {
        if (member.isGroup || member.isGrid) {
          const subSiblingCodes = this.getSiblingCodes({ member, parameter });
          if (subSiblingCodes.length > 0) {
            siblingCodes = new Set([...siblingCodes, ...subSiblingCodes]);
          }
        }
      });
    } else {
      siblingCodes = new Set(members.map((member) => member.paramCode));
    }

    return [...siblingCodes];
  }

  getSlavedSiblingCodes({ group, parameter }) {
    let members = group.members.filter((member) => member !== parameter);

    let slavedCodes = new Set([]);
    members.forEach((member) => {
      if (member.paramType === ParamType.SELECT || member.paramType === ParamType.BOOLEAN) {
        const subSlavedCodes = member.getAllOptionSlaves({});
        if (subSlavedCodes?.length > 0) {
          slavedCodes = new Set([...slavedCodes, ...subSlavedCodes]);
        }
      }
    });

    return [...slavedCodes];
  }

  getSiblingGroups({ groupCode = '', groupVersion = '', paramCode, paramVersion }) {
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

  getSiblingParamsAsSelectItems({ groupCode = '', groupVersion = '', paramCode, paramVersion }) {
    const siblings = this.getSiblingParameters({
      groupCode: groupCode,
      groupVersion: groupVersion,
      paramCode: paramCode,
      paramVersion: paramVersion
    });

    return siblings.map((param) => param.convertToSelectItem());
  }

  getSiblingGroupsAsSelectItems({ groupCode = '', groupVersion = '', paramCode, paramVersion }) {
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
    console.log('moveParameterGroup: ', param, srcGroup, targetGroup);
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

    console.log('getJumpToItems: ', rootGroup, basis, items);
    return items;
  }

  setTitleBarInfos(infos) {
    for (const key in infos) {
      switch (key) {
        case 'commentable': {
          this.setTitleBarInfo(key, infos.commentable);
          break;
        }
        case 'verifiable': {
          this.setTitleBarInfo(key, infos.verifiable);
          break;
        }
        case 'freezable': {
          this.setTitleBarInfo(key, infos.freezable);
          break;
        }
        case 'verified': {
          this.setTitleBarInfo(key, infos.verified);
          break;
        }
        case 'freezed': {
          this.setTitleBarInfo(key, infos.freezed);
          break;
        }
        case 'inputStatus': {
          this.setTitleBarInfo(key, infos.inputStatus);
          break;
        }
        case 'jumpTo': {
          this.jumpTo = infos.inputStatus;
          break;
        }
      }
    }
  }

  getDataAbstract() {
    let abstrct = '';

    this.members.forEach((member) => {
      if (abstract && member.abstract) {
        abstract += ' ';
      }

      abstract += member.abstract;
    });
  }

  getDataFiles() {
    let files = [];

    this.members.forEach((param) => {
      if (param.isGroup || param.isGrid) {
        files = [...files, ...param.getDataFiles()];
      } else if (param.paramType === ParamType.FILE && param.hasValue()) {
        files = [...files, ...param.getDataFiles()];
      }
    });

    return files;
  }

  loadData(data) {
    this.members.forEach((member) => {
      const memberData = data[member.paramCode];
      console.log('DataStructure.loadData member: ', member.paramCode, memberData);

      if (Util.isNotEmpty(memberData)) {
        member.loadData(memberData);
      }
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

    //this.inactivateSlaves(false);

    this.viewType = DataStructure.ViewTypes.BAREBONE;
    this.parent = {};

    this.paramDelimiter = json.paramDelimiter ?? ';';
    this.paramDelimiterPosition = json.paramDelimiterPosition ?? 'end';
    this.paramValueDelimiter = json.paramValueDelimiter ?? '=';

    this.dataStructureId = json.paramId ?? json.dataStructureId;
    this.inputStatus = json.inputStatus ?? false;
    this.jumpTo = json.jumpTo ?? false;
    this.bulletNo = json.bulletNo ?? false;

    this.verified = json.verified ?? { verified: false };
    this.freezed = json.freezed ?? { freezed: false };
  }

  toJSON() {
    let json = super.toJSON();

    if (this.paramDelimiter !== ';') json.paramDelimiter = this.paramDelimiter;
    if (this.paramDelimiterPosition !== 'end') json.paramDelimiterPosition = this.paramDelimiterPosition;
    if (this.paramValueDelimiter !== '=') json.paramValueDelimiter = this.paramValueDelimiter;
    if (this.inputStatus !== '=') json.inputStatus = this.inputStatus;
    if (this.jumpTo !== '=') json.jumpTo = this.jumpTo;
    if (this.bulletNo !== '=') json.bulletNo = this.bulletNo;

    json.dataStructureId = this.dataStructureId;

    if (Util.isNotEmpty(this.verified)) json.verified = this.verified;
    if (Util.isNotEmpty(this.freezed)) json.freezed = this.freezed;

    return json;
  }

  renderPreview({ formId = this.formId, spritemap }) {
    const visiableMembers = this.activeMembers;

    return (
      <>
        {visiableMembers.map((parameter, order) => {
          let actionItems = this.getPreviewActionItems(order);

          parameter.formId = formId;
          parameter.commentable = true;
          parameter.verifiable = true;
          parameter.freezable = true;

          return parameter.renderPreview({
            formId: formId,
            actionItems: actionItems,
            spritemap: spritemap
          });
        })}
      </>
    );
  }

  render({ canvasId, events, className, style, spritemap }) {
    const visiableMembers = this.activeMembers;
    console.log('DataStructure.render: ', this.members, visiableMembers);

    return (
      <div id={canvasId}>
        {visiableMembers.map((parameter) => {
          if (parameter.active) {
            return parameter.renderField({
              events: events,
              className: className,
              style: style,
              spritemap: spritemap
            });
          }
        })}
      </div>
    );
  }
}

export default DataStructure;
