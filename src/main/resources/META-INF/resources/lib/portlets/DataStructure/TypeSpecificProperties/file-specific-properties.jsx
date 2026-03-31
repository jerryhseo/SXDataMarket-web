import React from 'react';
import SXBasePropertiesPanelComponent from '../base-properties-panel-component.jsx';
import { Event, ParamProperty, ParamType } from '../../../stationx/station-x.jsx';
import { Util } from '../../../stationx/util.jsx';
import DataStructure from '../data-structure.jsx';
import ParameterConstants from '../../Parameter/parameter-constants.jsx';
import { createParameter } from '../datastructure-builder.jsx';

class SXFileTypeOptionForm extends SXBasePropertiesPanelComponent {
  constructor(props) {
    super(props);
    console.log('SXFileTypeOptionForm constructor: ', props, this.workingParam);

    this.componentId = this.workingParam.namespace + 'SXStringTypeOptionForm';

    this.multipleFiles = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.BOOLEAN,
      properties: {
        paramCode: ParamProperty.MULTIPLE_FILES,
        viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
        displayName: Util.getTranslationObject(this.languageId, 'multiple-files'),
        tooltip: Util.getTranslationObject(this.languageId, 'multiple-files-tooltip'),
        defaultValue: this.workingParam.multipleFiles
      }
    });

    this.accepts = createParameter({
      namespace: this.namespace,
      formId: this.componentId,
      paramType: ParamType.STRING,
      properties: {
        paramCode: ParamProperty.ACCEPTS,
        displayName: Util.getTranslationObject(this.languageId, 'accepts'),
        tooltip: Util.getTranslationObject(this.languageId, 'accepts-tooltip'),
        placeholder: Util.getTranslationObject(this.languageId, '.jpg .png'),
        defaultValue: this.workingParam.accepts
      }
    });
  }

  listenerFieldValueChanged = (event) => {
    const { targetPortlet, targetFormId, parameter } = event.dataPacket;
    if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
      return;
    }

    console.log('SXFileTypeSpecificPanel SX_FIELD_VALUE_CHANGED: ', event.dataPacket, this.workingParam);

    if (parameter.hasError()) {
      this.dataStructure.error = parameter.error;

      return;
    }

    switch (parameter.paramCode) {
      case ParamProperty.ACCEPTS: {
        this.workingParam.accepts = parameter.getValue();
        break;
      }
      case ParamProperty.MULTIPLE_FILES: {
        const multipleFiles = parameter.getValue();

        this.workingParam.multipleFiles = parameter.getValue();
        this.workingParam.value = [];
        break;
      }
    }

    if (Util.isNotEmpty(this.checkError())) {
      return;
    }

    if (this.workingParam.rendered) {
      if (this.workingParam.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
        this.workingParam.fireRefreshParent(true);
        /*
				Event.fire(Event.SX_REFRESH_PREVIEW, this.namespace, this.namespace, {
					targetFormId: this.workingParam.componentId,
					paramCode: this.workingParam.parent.code,
					paramVersion: this.workingParam.parent.version
				});
				*/
      } else {
        this.workingParam.fireRefresh();
      }
    }
  };

  componentDidMount() {
    Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  componentWillUnmount() {
    Event.off(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
  }

  checkError() {
    const error = DataStructure.checkError(Object.values([this.multipleFiles, this.accepts]));

    if (Util.isNotEmpty(error)) {
      this.dataStructure.setError(error.errorClass, error.errorMessage);
      return error;
    } else {
      this.dataStructure.clearError();
    }

    return error;
  }

  render() {
    return (
      <>
        {this.multipleFiles.renderField({ spritemap: this.spritemap })}
        {this.accepts.renderField({ spritemap: this.spritemap })}
      </>
    );
  }
}

export default SXFileTypeOptionForm;
