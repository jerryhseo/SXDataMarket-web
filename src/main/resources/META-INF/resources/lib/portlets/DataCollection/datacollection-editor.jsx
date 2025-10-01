import React from "react";
import { Util } from "../../stationx/util";
import { ErrorClass, Event, ParamType, ValidationRule } from "../../stationx/station-x";
import { GroupParameter, Parameter } from "../../stationx/parameter";
import Button from "@clayui/button";
import Icon from "@clayui/icon";
import { SXModalDialog, SXModalUtil } from "../../stationx/modal";
import SXBaseVisualizer from "../../stationx/visualizer";

class DataCollectionEditor extends SXBaseVisualizer {
	constructor(props) {
		super(props);

		console.log("DataCollectionEditor props: ", props);

		this.dataCollectionId = this.params.dataCollectionId ?? 0;

		this.state = {
			confirmDlgState: false,
			confirmDlgHeader: <></>,
			confirmDlgBody: <></>
		};

		this.dataCollectionCode = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataCollectionCode",
				displayName: Util.getTranslationObject(this.languageId, "datacollection-code"),
				placeholder: Util.getTranslationObject(this.languageId, "datacollection-code"),
				tooltip: Util.getTranslationObject(this.languageId, "code-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VARIABLE,
						message: Util.getTranslationObject(this.languageId, "invalid-code"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 3,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", "3"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 32,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", "32"),
						errorClass: ErrorClass.ERROR
					}
				},
				style: {
					width: "250px"
				}
			}
		);

		this.dataCollectionVersion = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "dataCollectionVersion",
				displayName: Util.getTranslationObject(this.languageId, "version"),
				placeholder: Util.getTranslationObject(this.languageId, "1.0.0"),
				tooltip: Util.getTranslationObject(this.languageId, "version-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					pattern: {
						value: ValidationRule.VERSION,
						message: Util.getTranslationObject(this.languageId, "invalid-version-format"),
						errorClass: ErrorClass.ERROR
					}
				},
				defaultValue: "1.0.0",
				style: {
					width: "150px"
				}
			}
		);

		this.displayName = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "displayName",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "display-name"),
				placeholder: Util.getTranslationObject(this.languageId, "display-name"),
				tooltip: Util.getTranslationObject(this.languageId, "display-name-tooltip"),
				validation: {
					required: {
						value: true,
						message: Util.getTranslationObject(this.languageId, "this-field-is-required"),
						errorClass: ErrorClass.ERROR
					},
					minLength: {
						value: 6,
						message: Util.getTranslationObject(this.languageId, "shorter-than-min-length", "6"),
						errorClass: ErrorClass.ERROR
					},
					maxLength: {
						value: 64,
						message: Util.getTranslationObject(this.languageId, "longer-than-max-length", "64"),
						errorClass: ErrorClass.ERROR
					}
				},
				className: "autofit-col-expand"
			}
		);

		this.description = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.STRING,
			{
				paramCode: "description",
				localized: true,
				displayName: Util.getTranslationObject(this.languageId, "description"),
				placeholder: Util.getTranslationObject(this.languageId, "description"),
				tooltip: Util.getTranslationObject(this.languageId, "description-tooltip"),
				multipleLine: true
			}
		);

		this.groupParameter = Parameter.createParameter(
			this.namespace,
			this.formId,
			this.languageId,
			this.availableLanguageIds,
			ParamType.GROUP,
			{
				paramCode: "requiredProps",
				paramVersion: "1.0.0",
				displayName: Util.getTranslationObject(this.languageId, "required-properties"),
				viewType: GroupParameter.ViewTypes.FIELDSET,
				members: [this.dataCollectionCode, this.dataCollectionVersion, this.displayName],
				membersPerRow: 3
			}
		);
	}

	listenerComponentWillUnmount = (event) => {
		const dataPacket = event.dataPacket;

		if (dataPacket.targetPortlet !== this.namespace) {
			console.log("[DataCollectionEditor] listenerComponentWillUnmount rejected: ", dataPacket);
			return;
		}

		console.log("[DataCollectionEditor] listenerComponentWillUnmount received: ", dataPacket);
		this.componentWillUnmount();
	};

	componentDidMount() {
		Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	componentWillUnmount() {
		console.log("[DataCollectionEditor] componentWillUnmount");
		Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
	}

	handleSaveDataCollection = () => {
		let error = this.groupParameter.checkError();

		if (Util.isNotEmpty(error)) {
			this.setState({
				confirmDlgState: true,
				confirmDlgHeader: SXModalUtil.errorDlgHeader(this.spritemap),
				confirmDlgBody: Util.translate("fix-the-error-first", error.message)
			});

			return;
		}

		let data = {};
		data.dataCollectionId = this.dataCollectionId;
		data.dataCollectionCode = this.dataCollectionCode.getValue();
		data.dataCollectionVersion = this.dataCollectionVersion.getValue();
		data.displayName = this.displayName.getValue();
		data.description = this.description.getValue();

		Event.fire(Event.SX_SAVE_DATACOLLECTION, this.namespace, this.workbenchNamespace, {
			targetFormId: this.workbenchId,
			data: data
		});
	};

	render() {
		return (
			<div style={{ marginTop: "2rem" }}>
				{this.groupParameter.render({ spritemap: this.spritemap })}
				{this.description.renderField({ spritemap: this.spritemap })}
				<Button.Group
					spaced
					style={{ width: "100%", justifyContent: "center" }}
				>
					<Button
						displayType="primary"
						onClick={this.handleSaveDataCollection}
						title={Util.translate("save-datacollection")}
					>
						<Icon
							symbol="disk"
							spritemap={this.spritemap}
							style={{ marginRight: "5px" }}
						/>
						{Util.translate("save")}
					</Button>
				</Button.Group>
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
			</div>
		);
	}
}

export default DataCollectionEditor;
