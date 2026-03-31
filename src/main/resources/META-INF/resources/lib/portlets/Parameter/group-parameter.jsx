import React from 'react';
import { Util } from '../../stationx/util';
import Parameter from './parameter';
import { Constant, ParamType } from '../../stationx/station-x';
import ParameterConstants from './parameter-constants';
import SXGroup from '../Form/group';
import SXPreviewRow from '../Form/preview-row';
import { createParameter } from '../DataStructure/datastructure-builder';

export default class GroupParameter extends Parameter {
  #members = [];
  #membersPerRow = 1;
  #expanded = false;
  #titleDisplay = false;

  constructor({ namespace, formId, properties = {} }) {
    super({
      namespace,
      formId
    });

    if (Util.isNotEmpty(properties)) {
      this.initProperties(properties);
    }

    this.paramType = ParamType.GROUP;
  }

  /*********************************************
   * Setters and Getters
   *********************************************/
  get members() {
    return this.#members;
  }
  get memberCount() {
    return this.members.length;
  }
  get activeMembers() {
    return this.members.filter((member) => member.active);
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
    return '';
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
  }
  get paramVersion() {
    return super.paramVersion;
  }
  set paramVersion(val) {
    super.paramVersion = val;
  }

  /*********************************************
   * Properties Management
   *********************************************/

  /**
   * Initializes the properties of the group parameter,
   * including viewType, membersPerRow, expanded, and titleDisplay.
   *
   * @override
   * @param {*} json
  initProperties(json = {}) {
    this.parse(json);
    
    this.value = {};
  }
  */

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

  hasMembers() {
    return this.memberCount > 0;
  }

  checkDuplicateParam(param) {
    let duplicated = param ? this.paramCode == param.paramCode && this.paramVersion == param.paramVersion : false;

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

  /**************************************************
   * Methods to manage ans search members, which should be used in the SXGroup component.
   **************************************************/

  setMemberOrders() {
    this.members.forEach((member, index) => (member.order = index + 1));
  }

  addMember(member) {
    this.setMemberDisplayType(member);

    member.parent = this;

    member.order = this.members.length + 1;

    //member.initValue();
    this.members.push(member);

    this.setDirty(true);
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

  /**
   * Moves a parameter from one group to another.
   *
   * @param {Parameter} param
   * @param {GroupParameter} srcGroup
   * @param {GroupParameter} targetGroup
   */
  moveParameterGroup(param, srcGroup, targetGroup) {
    let movingParam = srcGroup.removeMember({ paramCode: param.paramCode, paramVersion: param.paramVersion });

    if (movingParam.isJunction) {
      movingParam.clearSlaves();
    }

    targetGroup.addMember(movingParam);
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

  /**
   * Inserts a member into the members list with the given order and
   * updates the orders of other members.
   * @param {Parameter} param
   * @param {int} memOrder
   */
  insertMember(param, memOrder) {
    param.parent = this;
    console.log('GroupParameter.insertMember: ', param, memOrder, this);

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

  getSiblings(paramCode, paramVersion) {
    const param = this.findParameter({ paramCode, paramVersion });
    //console.log('GroupParameter.getSiblings: ', param);
  }

  getSiblingParameters(parameter) {
    return parameter.parent.members?.filter((member) => member !== parameter);
  }

  /**
   * Gets the slaved sibling parameter codes of the given parameter,
   * which should be in the same group with the given parameter.
   * @param {Parameter} parameter
   * @returns
   */
  getSlavedSiblingCodes(parameter) {
    let siblings = this.getSiblingParameters(parameter);

    let slavedCodes = new Set([]);
    siblings.forEach((member) => {
      if (member.isJunction) {
        const subSlavedCodes = member.getAllOptionSlavesExcept();
        if (subSlavedCodes?.length > 0) {
          slavedCodes = new Set([...slavedCodes, ...subSlavedCodes]);
        }
      }
    });

    return [...slavedCodes];
  }

  deleteMemberByIndex(index) {
    const removed = this.members[index];
    //console.log('GroupParameter.deleteMemberByIndex: ', index, removed, this.members);

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

    //console.log('GroupParameter.deleteMemberByCode: ', memCode, memVersion, order);
    if (order >= 0) {
      return this.deleteMemberByIndex(order);
    }
  }

  /**
   * Removes a member from the members list by the given parameter code and version or order,
   * @param {JSON Object} paramCode, paramVersion, memOrder, or parameter object.
   * @returns
   * The removed member, which can be used for undo the delete action, or null if no member is removed.
   */
  removeMember({ paramCode, paramVersion, memOrder, parameter }) {
    let removed = null;

    if (parameter) {
      this.members.every((member, index) => {
        if (member === parameter) {
          removed = this.deleteMemberByIndex(index);
        } else if (member.isCollection) {
          removed = member.removeMember({ parameter });
        }

        return !removed;
      });
    } else if (memOrder >= 0) {
      removed = this.deleteMemberByIndex(memOrder);
    } else {
      removed = this.deleteMemberByCode(paramCode, paramVersion);
    }

    if (removed) {
      this.members.forEach((member) => {
        if (member.isJunction) {
          member.removeOptionSlave(member.paramCode);
        }
      });
    }

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
    return Util.isEmpty(memOrder) ? this.copyMemberByCode(paramCode, paramVersion) : this.copyMemberByIndex(memOrder);
  }

  /**
   * Gets the member of the group parameter by the given index of the members array.
   * @param {int} index
   * @returns
   * The member of the group parameter with the given index, or null if the index is out of bound.
   */
  getMember(index) {
    return this.members[index];
  }

  /**
   * Finds a parameter within the group parameter based on its code and version.
   * The search can be performed in the descendant members of the group parameter or
   * only in the direct members based on the descendant parameter.
   * @param {*} param0 - {paramCode, paramversion, descendant}
   * @returns
   *  The parameter found in the group parameter based on the given parameter code and version.
   * If descendant is true, the parameter will be searched in the descendant members of the group parameter;
   * if descendant is false, only the direct members of the group parameter will be searched.
   */
  findParameter({ paramCode, paramVersion = ParameterConstants.DEFAULT_VERSION, descendant = true }) {
    if (this.equalTo(paramCode, paramVersion)) {
      return this;
    }

    let found = null;

    this.members.every((field) => {
      if (field.equalTo(paramCode, paramVersion)) {
        found = field;
      } else if (descendant && field.isCollection) {
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

  /**
   * Inactivates all of the slave members of the Group.
   * w
   * @param {boolean} force
   * @returns
   * An array of the junction members whose slave members are inactivated,
   * which can be used for re-activating the slave members
   * when the junction members are updated with another value or deleted.
   * If force is true, all slave members of the junction members will be inactivated
   * regardless of the showAnyway property of the junction members;
   * if force is false, only the slave members of the junction members
   * with showAnyway property false will be inactivated.
   */
  inactivateSlaves(force = false) {
    let junctions = [];

    let groupSlaveCodes = [];
    this.members.forEach((member) => {
      if (member.isJunction) {
        let slaveCodes = [];

        if (force || !member.showAnyway) {
          junctions.push(member);

          slaveCodes = member.getAllOptionSlavesExcept();
        }

        groupSlaveCodes = [...groupSlaveCodes, ...slaveCodes];
      }
    });

    this.members.forEach((member) => {
      if (groupSlaveCodes.includes(member.paramCode)) {
        member.active = false;
      }

      if (member.isCollection) {
        const subJunctions = member.inactivateSlaves(force);

        junctions = [...junctions, ...subJunctions];
      }
    });

    return junctions;
  }

  /**
   * Activates the slave members of the given parameter based on the specified value.
   * The given parameter should be in the members list of the group parameter.
   * @param {Parameter} parameter
   * @param {String} value
   * @returns
   * true if any slave member is activated, or false if no slave member is activated.
   */
  activateSlaveMembers(parameter, value) {
    const optionSlaves = parameter.getOptionSlaves(value);
    console.log('GroupParameter.activateSlaveMembers: ', parameter, value, optionSlaves);
    if (optionSlaves?.length > 0) {
      const paramSlaveCodes = parameter.getAllOptionSlavesExcept();
      console.log('GroupParameter.activateSlaveMembers: ', parameter, paramSlaveCodes, value, optionSlaves);

      parameter.parent.members.forEach((member) => {
        if (member !== parameter && paramSlaveCodes.includes(member.paramCode)) {
          console.log(
            'GroupParameter.activateSlaveMembers activate: ',
            member.paramCode,
            optionSlaves.includes(member.paramCode)
          );
          member.active = optionSlaves.includes(member.paramCode);
        }
      });

      return true;
    }

    return false;
  }

  /**
   * Moves the member at the specified order up by one position.
   * @param {int} paramOrder
   */
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

  /**
   * Moves the member at the specified order down by one position.
   * @param {int} paramOrder
   */
  moveMemberDown(paramOrder) {
    const srcIndex = paramOrder;
    const targetIndex = srcIndex + 1;
    const targetParam = this.members[targetIndex];
    this.members[targetIndex] = this.members[srcIndex];
    this.members[targetIndex].refreshKey();
    this.members[srcIndex] = targetParam;
    this.members[srcIndex].refreshKey();

    this.setMemberOrders();
  }

  /**
   * Postfixes the parameter code of the group parameter and
   * its members with the given postfix to avoid the duplicate parameter code issue
   * when copying or moving parameters.
   * @param {String} postfix
   */
  postfixParameterCode(postfix) {
    this.paramCode += '_' + postfix;
    this.paramVersion = ParameterConstants.DEFAULT_VERSION;

    this.members.forEach((member, index) => member.postfixParameterCode(postfix + '_' + index));
  }

  /**
   * Gets the position of the member in the group parameter,
   * which can be used for determining the display style of the member in the preview mode.
   * @param {Parameter} member
   * @returns
   * Constant.Position.START if the member is the first one in the members list,
   * Constant.Position.END if the member is the last one in the members list,
   * Constant.Position.DEAD_END if the member is the only one in the members list,
   * or Constant.Position.MIDDLE if the member is in the middle of the members list.
   */
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

  /**
   * Sets the disabled status of the parameter and its members.
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this.disabled = disabled;

    this.members.forEach((member) => member.setDisabled(disabled));
  }

  /**
   * Sets the dirty status as false of the parameter and its members.
   */
  cleanDirty() {
    this.dirty = false;

    this.members.forEach((member) => member.cleanDirty());
  }

  /**
   * Initializes the value of the group parameter and its members.
   */
  initValue() {
    this.value = {};

    this.members.forEach((member) => {
      member.initValue();
    });
  }

  checkError() {
    if (this.hasError()) {
      return this.error;
    }

    let error = null;
    this.members.every((member) => {
      error = member.checkError();

      return !error ? Constant.CONTINUE_EVERY : Constant.STOP_EVERY;
    });

    return error;
  }

  validate() {
    let hasError = 0;

    this.members.forEach((member) => {
      const error = member.validate();

      if (hasError === 0 && error !== 0) {
        hasError = error;
      } else if (error === -1) {
        hasError = error;
      }
    });

    return hasError;
  }

  copy() {
    const copied = ParameterUtil.createParameter({
      namespace: this.namespace,
      formId: this.formId,
      paramType: this.paramType,
      properties: JSON.parse(JSON.stringify(this))
    });

    copied.postfixParameterCode('copied');

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
      { id: 'group', name: Util.translate('change-group'), symbol: 'move-folder' },
      { id: 'copy', name: Util.translate('copy'), symbol: 'copy' },
      { id: 'delete', name: Util.translate('delete'), symbol: 'times' }
    ];

    if (itemOrder > 0) {
      actionItems.push({ id: 'moveUp', name: Util.translate('move-up'), symbol: 'order-arrow-up' });
    }
    if (itemOrder < this.memberCount - 1) {
      actionItems.push({
        id: 'moveDown',
        name: Util.translate('move-down'),
        symbol: 'order-arrow-down'
      });
    }

    return actionItems;
  }

  getReferenceFiles() {
    let files = [];

    if (this.hasReferenceFile()) {
      files.push(this.toFileObject(this.referenceFile));
    }

    this.members.forEach((param) => {
      files = [...files, ...param.getReferenceFiles()];
    });

    return files;
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

    this.members.forEach((member) => {
      if (member.paramType === ParamType.FILE) {
        files = [...files, ...member.getDataFiles()];
      } else if (member.isGroup || member.isGrid) {
        files = [...files, ...member.getDataFiles()];
      }
    });

    //console.log("GroupParameter: ", files);
    return files;
  }

  enableInputStatus(enable = true) {
    this.inputStatus = enable;

    this.members.forEach((member) => {
      member.enableInputStatus(enable);
    });
  }

  focus(paramCode, paramVersion) {
    this.focused = this.equalTo(paramCode, paramVersion);

    this.members.forEach((param) => {
      param.focus(paramCode, paramVersion);
    });
  }

  getFileData(members = this.members) {
    let fileParams = [];
    members.forEach((member) => {});
  }

  /*****************************************************
   * Override Methods
   * All override methods should call the same method of the parent class
   * using super.methodName() at the very beginning to ensure proper functionality.
   *****************************************************/

  /**
   * Loads the data into the parameter and its members.
   * @override
   * @param {Object} data
   */
  loadData(data) {
    //console.log('GroupParameter.loadData: ', this.paramCode, data);
    super.loadData(data);

    this.members.forEach((member) => {
      const memberData = data.value[member.paramCode];
      console.log('GroupParameter.loadData member: ', member.paramCode, member, memberData, member.isJunction);

      if (Util.isNotEmpty(memberData)) {
        member.loadData(memberData);

        if (member.isJunction) {
          member.activateSlaveMembers({ group: this, activeParamCodes: Object.keys(data.value), junction: member });
        }
      }
    });
  }

  /**
   * Converts the group parameter and its members to a data object.
   * @returns
   * Object for being saved in database with all necessary information,
   * including the value and other related properties.
   */
  toData() {
    if (!this.active) {
      return;
    }

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
      groupOutput[this.paramCode] = super.toData();
      let data = groupOutput[this.paramCode];

      data.value = memberOutputs;

      return groupOutput;
    }
  }

  /**
   * @override
   * @param {JSON Object} json
   */
  parse(json = {}) {
    //console.log('GroupParameter.parse: ', json.paramCode, json);
    super.parse(json);

    this.viewType = this.viewType ?? ParameterConstants.GroupViewTypes.PANEL;
    this.membersPerRow = this.membersPerRow ?? 1;
    this.expanded = this.expanded ?? false;

    if (Util.isNotEmpty(json.members)) {
      this.members = json.members.map((member, index) => {
        let parameter;
        member.parent = this;
        if (member instanceof Parameter) {
          parameter = member;
          parameter.formId = this.paramCode;
        } else {
          parameter = createParameter({
            namespace: this.namespace,
            formId: this.paramCode,
            paramType: member.paramType,
            properties: member
          });
        }

        return parameter;
      });
    }
  }

  /**
   * Converts the properties of the group parameter to a JSON object.
   * @returns
   * Object for JSON.stringify, including properties to be serialized,
   * such as viewType, membersPerRow, expanded, and members.
   */
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

  /**
   * Converts the properties of the group parameter to a JSON object.
   * @returns
   * A JSON object representing the parameter properties,
   * including all necessary information for rendering and validation, such as viewType, membersPerRow, expanded, and members.
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
  */

  renderField({
    events = {},
    className = '',
    style = {},
    spritemap,
    displayType = this.displayType,
    viewType = this.viewType,
    cellIndex
  }) {
    return (
      <div key={this.key} style={{ marginBottom: '1.0rem' }}>
        {this.render({
          event: events,
          className: className,
          style: style,
          spritemap: spritemap,
          displayType: displayType,
          viewType: viewType,
          preview: false,
          cellIndex: cellIndex
        })}
      </div>
    );
  }

  renderPreview({ formId = this.formId, actionItems = [], spritemap }) {
    //console.log('GroupParameter.renderPreview: ', this.paramCode, formId, actionItems);
    return (
      <SXPreviewRow key={this.key} formId={formId} parameter={this} actionItems={actionItems} spritemap={spritemap} />
    );
  }

  render({
    events = {},
    className = '',
    style = {},
    spritemap,
    displayType = this.displayType,
    viewType = this.viewType,
    preview = false,
    cellIndex
  }) {
    return (
      this.active && (
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
      )
    );
  }
}
