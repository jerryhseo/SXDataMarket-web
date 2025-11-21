import React from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamProperty, ParamType } from "../../stationx/station-x";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import DataStructure from "./data-structure";
import SXBasePropertiesPanelComponent from "./base-properties-panel-component.jsx";
import ParameterConstants from "../Parameter/parameter-constants.jsx";
import { ParameterUtil } from "../Parameter/parameters.jsx";

class SXDSBuilderOptionPropertiesPanel extends SXBasePropertiesPanelComponent {
	constructor(props) {
		super(props);

		this.componentId = this.namespace + "SXDSBuilderOptionPropertiesPanel";

		this.state = {
			confirmDlgState: false,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: <></>
		};

		this.toggleFields = {
			abstractKey: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.ABSTRACT_KEY,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "abstract-key"),
					tooltip: Util.getTranslationObject(this.languageId, "abstract-key-tooltip"),
					value: this.workingParam.abstractKey
				}
			}),
			downloadable: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.DOWNLOADABLE,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "downloadable"),
					tooltip: Util.getTranslationObject(this.languageId, "downloadable-tooltip"),
					value: this.workingParam.downloadable
				}
			}),
			searchable: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.SEARCHABLE,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "searchable"),
					tooltip: Util.getTranslationObject(this.languageId, "searchable-tooltip"),
					value: this.workingParam.searchable
				}
			}),
			disabled: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: ParamProperty.DISABLED,
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "disabled"),
					tooltip: Util.getTranslationObject(this.languageId, "disabled-tooltip"),
					value: this.workingParam.getDisabled()
				}
			}),
			commentable: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: "commentable",
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "commentable"),
					tooltip: Util.getTranslationObject(this.languageId, "commentable-tooltip"),
					defaultValue: false,
					value: this.workingParam.commentable
				}
			}),
			verifiable: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: "verifiable",
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "verifiable"),
					tooltip: Util.getTranslationObject(this.languageId, "verifiable-tooltip"),
					defaultValue: false,
					value: this.workingParam.verifiable
				}
			}),
			freezable: ParameterUtil.createParameter({
				namespace: this.namespace,
				formId: this.componentId,
				paramType: ParamType.BOOLEAN,
				properties: {
					paramCode: "freezable",
					viewType: ParameterConstants.BooleanViewTypes.CHECKBOX,
					displayName: Util.getTranslationObject(this.languageId, "freezable"),
					tooltip: Util.getTranslationObject(this.languageId, "freezable-tooltip"),
					defaultValue: false,
					value: this.workingParam.freezable
				}
			})
		};

		this.fieldToggleGroup = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.GROUP,
			properties: {
				paramCode: "toggleGroup",
				viewType: ParameterConstants.GroupViewTypes.ARRANGEMENT,
				membersPerRow: 2,
				members: Object.values(this.toggleFields)
			}
		});

		this.fieldCssWidth = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: ParamProperty.CSS_WIDTH,
				displayName: Util.getTranslationObject(this.languageId, "width"),
				placeholder: Util.getTranslationObject(this.languageId, "20.rem or 100px"),
				tooltip: Util.getTranslationObject(this.languageId, "width-of-the-parameter-tooltip"),
				value: this.workingParam.cssWidth,
				validation: {
					custom: {
						value: `value = value.trim(); 
						if( !(value.endsWith("rem") || value.endsWith("px") || value.endsWith("%") || value.endsWith("em"))){
								return false;
							}

							return true;
						`,
						message: Util.getTranslationObject(this.languageId, "invalid-width-format"),
						errorClass: ErrorClass.ERROR
					}
				}
			}
		});
	}

	listenerFieldValueChanged = (e) => {
		const dataPacket = e.dataPacket;
		if (dataPacket.targetPortlet !== this.namespace || dataPacket.targetFormId !== this.componentId) return;

		/*
		console.log(
			"DataStructureBuilder SX_FIELD_VALUE_CHANGED RECEIVED: ",
			dataPacket,
			this.dataStructure,
			this.workingParam
		);
		*/
		if (dataPacket.parameter.hasError()) {
			this.dataStructure.setError(dataPacket.parameter.errorClass, dataPacket.parameter.errorMessage);
			return;
		}

		if (dataPacket.paramCode == ParamProperty.CSS_WIDTH) {
			this.workingParam.cssWidth = this.fieldCssWidth.getValue();
		} else if (dataPacket.paramCode == "disabled") {
			this.workingParam.setDisabled(this.toggleFields[dataPacket.paramCode].getValue());
		} else {
			this.workingParam[dataPacket.paramCode] = this.toggleFields[dataPacket.paramCode].getValue();
		}

		if (Util.isNotEmpty(this.checkError())) {
			return;
		}

		if (this.workingParam.displayType == ParameterConstants.DisplayTypes.GRID_CELL) {
			console.log("Refresh Grid from cell: ", this.workingParam);

			this.workingParam.fireRefreshParent(true);
			/*
			const gridParam = this.dataStructure.findParameter({
				paramCode: this.workingParam.parent.code,
				paramVersion: this.workingParam.parent.version,
				descendant: true
			});

			gridParam.fireRefreshPreview();
			*/
		} else {
			this.workingParam.fireRefreshPreview();
		}
	};

	componentDidMount() {
		Event.on(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	componentWillUnmount() {
		Event.detach(Event.SX_FIELD_VALUE_CHANGED, this.listenerFieldValueChanged);
	}

	checkError() {
		const error = DataStructure.checkError([
			this.toggleFields.abstractKey,
			this.toggleFields.downloadable,
			this.toggleFields.searchable,
			this.toggleFields.disabled,
			this.fieldCssWidth
		]);

		if (Util.isNotEmpty(error)) {
			this.dataStructure.setError(error.errorClass, error.errorMessage);
			return error;
		} else {
			this.dataStructure.clearError();
		}

		return error;
	}

	openErrorDlg(message) {
		this.setState({
			confirmDlgState: true,
			confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
			confirmDlgBody: message
		});
	}

	render() {
		return (
			<>
				{this.fieldToggleGroup.renderField({
					spritemap: this.spritemap
				})}
				{this.fieldCssWidth.renderField({
					spritemap: this.spritemap
				})}
				{this.state.confirmDlgState && (
					<SXModalDialog
						header={this.state.confirmDlgHeader}
						body={this.state.confirmDlgBody}
						buttons={[
							{
								onClick: () => {
									this.setState({ confirmDlgState: false });
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="info"
						spritemap={this.spritemap}
					/>
				)}
			</>
		);
	}
}

export default SXDSBuilderOptionPropertiesPanel;
