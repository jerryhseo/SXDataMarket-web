import React from 'react';
import { Constant, ParamType } from '../../stationx/station-x';
import { Util } from '../../stationx/util';
import GroupParameter from '../Parameter/group-parameter';
import Parameter from '../Parameter/parameter';

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

  #jumpTo = false;

  constructor({ namespace, formId, properties = {}, codeName, version }) {
    super({
      namespace: namespace,
      formId: formId
    });

    this.parse(properties);
    //console.log('[DataStructure constructor] ', namespace, formId, properties);
    this.paramCode = codeName ?? '';
    this.paramVersion = version ?? '1.0.0';
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
  get jumpTo() {
    return this.#jumpTo;
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
  set jumpTo(jumpTo) {
    this.#jumpTo = jumpTo;
  }

  initProperties(json) {
    this.parse(json);
  }

  getJumpToItems(rootGroup, basis = DataStructure.JumpToBasis.DISPLAY_NAME) {
    const members = rootGroup ? rootGroup.members : this.members;
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
          this.jumpTo = infos.jumpTo;
          break;
        }
        case 'bulletNo': {
          this.bulletNo = infos.bulletNo;
          break;
        }
      }
    }
  }

  /**
   * @override
   * @param {Object} json
   */
  parse(json = {}) {
    //console.log('DataStructure.parse: ', json.paramCode, json);
    super.parse(json);

    //this.inactivateSlaves(false);

    this.viewType = DataStructure.ViewTypes.BAREBONE;
    this.parent = null;

    this.paramDelimiter = json.paramDelimiter ?? ';';
    this.paramDelimiterPosition = json.paramDelimiterPosition ?? 'end';
    this.paramValueDelimiter = json.paramValueDelimiter ?? '=';

    this.dataStructureId = json.paramId ?? json.dataStructureId;
    this.inputStatus = json.inputStatus ?? false;
    this.jumpTo = json.jumpTo ?? false;
    this.bulletNo = json.bulletNo ?? false;
  }

  /**
   * @override
   * @returns
   *  Object
   */
  toJSON() {
    let json = super.toJSON();

    if (this.paramDelimiter !== ';') json.paramDelimiter = this.paramDelimiter;
    if (this.paramDelimiterPosition !== 'end') json.paramDelimiterPosition = this.paramDelimiterPosition;
    if (this.paramValueDelimiter !== '=') json.paramValueDelimiter = this.paramValueDelimiter;
    if (this.inputStatus) json.inputStatus = this.inputStatus;
    if (this.jumpTo) json.jumpTo = this.jumpTo;
    if (this.bulletNo) json.bulletNo = this.bulletNo;

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
