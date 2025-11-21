import React from "react";
import { Util } from "../../stationx/util";
import { ClayRadio } from "@clayui/form";
import { SXModalDialog } from "../../stationx/modal";
import { Event } from "../../stationx/station-x";

class SXGroupSelector extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.workingParam.namespace;
		this.formId = props.formId;
		this.title = props.title;
		this.workingParam = props.workingParam;
		this.dataStructure = props.dataStructure;
		this.optionType = props.optionType ?? "radio";
		this.open = props.open ?? true;
		this.languageId = props.dataStructure.languageId;
		this.defaultLanguageId = props.dataStructure.defaultLanguageId;
		this.availableLanguageIds = props.dataStructure.availableLanguageIds;
		this.spritemap = props.spritemap;

		this.options = this.convertGroupsToOptions();

		this.state = {
			selected: this.getOption(
				this.workingParam.parentCode ? this.workingParam.parentCode : this.dataStructure.paramCode
			),
			openModal: this.open
		};
	}

	/**
	 * Gets groups as select options in the data structure parameters except of the working group parameter.
	 * "Top Level Group" should be added as first option.
	 *
	 * @param {{paramCode: String, paramVersion:String}} param0
	 * @returns
	 */
	convertGroupsToOptions() {
		return this.dataStructure
			.getAllGroups({
				paramCode: this.workingParam.paramCode,
				paramVersion: this.workingParam.paramVersion
			})
			.map((group) => ({
				label: group.label,
				paramCode: group.paramCode,
				paramVersion: group.paramVersion
			}));
	}

	getOption(paramCode) {
		return this.options.filter((option) => option.paramCode == paramCode)[0];
	}

	handleGroupSelected(option) {
		const srcGroup =
			this.dataStructure.findParameter({
				paramCode: this.workingParam.parentCode,
				paramVersion: this.workingParam.parentVersion,
				descendant: true
			}) ?? this.dataStructure;
		const targetGroup =
			this.dataStructure.findParameter({
				paramCode: option.paramCode,
				paramVersion: option.paramVersion,
				descendant: true
			}) ?? this.dataStructure;

		this.dataStructure.moveParameterGroup(this.workingParam, srcGroup, targetGroup);

		this.setState({ selected: option });
	}

	render() {
		return (
			<>
				{this.state.openModal && (
					<SXModalDialog
						header={this.title}
						body={
							<div style={{ width: "100%" }}>
								{Util.convertArrayToRows(this.options, 2).map((row, index) => (
									<div
										key={index}
										style={{ width: "100%", display: "inline-flex", gap: "1.5rem" }}
									>
										{row.map((option) => {
											console.log("option: ", option);
											return (
												<ClayRadio
													key={Util.randomKey()}
													name={this.namespace + "group"}
													label={option.label}
													value={option.paramCode}
													defaultChecked={
														Util.isNotEmpty(this.state.selected) &&
														option.paramCode == this.state.selected.paramCode
													}
													onChange={(e) => {
														e.stopPropagation();
														this.handleGroupSelected(option);
													}}
												/>
											);
										})}
									</div>
								))}
							</div>
						}
						buttons={[
							{
								onClick: () => {
									this.setState({ openModal: false });

									if (this.state.selected !== this.workingParam.paramCode) {
										Event.fire(Event.SX_GROUP_CHANGED, this.namespace, this.namespace, {
											targetFormId: this.formId,
											parameter: this.workingParam
										});
									}
								},
								label: Util.translate("ok"),
								displayType: "primary"
							}
						]}
						status="info"
						disableAutoClose="false"
						spritemap={this.spritemap}
					/>
				)}
			</>
		);
	}
}

export default SXGroupSelector;
