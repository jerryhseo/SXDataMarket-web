import React from "react";
import SXBaseParameterComponent from "./base-parameter-component";
import { Util } from "../../stationx/util";
import { ClayButtonWithIcon } from "@clayui/button";
import { ClayInput } from "@clayui/form";
import DropDown from "@clayui/drop-down";
import { SXModalDialog } from "../../stationx/modal";
import { UnderConstruction } from "../../stationx/common";
import ParameterConstants from "../Parameter/parameter-constants";
import Icon from "@clayui/icon";

class SXFile extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		this.state = {
			value: this.parameter.getValue(this.cellIndex) ?? [],
			underConstruction: false
		};

		//console.log("[SXFile props] ", props, props.parameter.key);
	}

	hasFiles() {
		let file;

		this.state.value.every((fileInfo) => {
			file = fileInfo.file;

			return file ? false : true;
		});

		return !!file;
	}

	handleFileSelectionChanged(files) {
		const fileList = this.state.value.filter((fileInfo) => !fileInfo.file);

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			fileList.push({
				name: file.name,
				size: file.size,
				type: file.type,
				file: file
			});
		}

		this.setState({ value: fileList });
		this.parameter.setValue({ value: fileList, cellIndex: this.cellIndex });
		this.parameter.fireValueChanged(this.cellIndex);
	}

	valueToFiles() {
		const dataTransfer = new DataTransfer();

		let files = this.state.value
			.filter((fileItem) => {
				return fileItem.file;
			})
			.map((fileItem) => fileItem.file);

		files.forEach((file) => dataTransfer.items.add(file));

		this.focusRef.current.files = dataTransfer.files;
	}

	handleActionClick(action, fileInfo) {
		switch (action) {
			case "download": {
				this.parameter.fireDownloadFile(fileInfo);
				break;
			}
			case "upload": {
				this.setState({ underConstruction: true });

				break;
			}
			case "delete": {
				const dataTransfer = new DataTransfer();

				let files = this.state.value
					.filter((fileItem) => {
						return fileItem.file && fileItem.name !== fileInfo.name;
					})
					.map((fileItem) => fileItem.file);

				files.forEach((file) => dataTransfer.items.add(file));

				this.inputRef.current.files = dataTransfer.files;

				this.handleFileSelectionChanged(files);

				break;
			}
		}
	}

	renderFileManager() {
		if (this.inputRef.current && !this.parameter.hasValue()) {
			this.inputRef.current.value = "";
		}

		return (
			<div ref={this.focusRef}>
				<ClayInput
					type="file"
					accepts={this.parameter.accepts}
					disabled={this.parameter.getDisabled(this.cellIndex)}
					multiple={this.parameter.multipleFiles}
					ref={this.inputRef}
					onChange={(e) => {
						this.handleFileSelectionChanged(e.target.files);
					}}
					sizing="sm"
					style={{ paddingLeft: "10px", marginBottom: "5px" }}
				/>
				{this.parameter.multipleFiles && Util.isNotEmpty(this.state.value) && this.state.value.length > 1 && (
					<div style={{ paddingLeft: "1rem" }}>
						<table
							style={{ width: "100%", fontSize: "0.750rem", borderCollapse: "collapse", border: "none" }}
						>
							<thead style={{ backgroundColor: "seashell" }}>
								<tr>
									<th style={{ padding: "3px", textAlign: "center" }}>{Util.translate("name")}</th>
									<th style={{ padding: "3px", textAlign: "center" }}>{Util.translate("size")}</th>
									<th style={{ width: "1rem", padding: "3px", textAlign: "center" }}>
										<Icon
											symbol="ellipsis-v"
											spritemap={this.spritemap}
										/>
									</th>
								</tr>
							</thead>
							<tbody>
								{this.state.value.map((fileInfo) => {
									return (
										<tr key={fileInfo.name}>
											<td>{fileInfo.name}</td>
											<td style={{ textAlign: "right" }}>{fileInfo.size}</td>
											<td style={{ textAlign: "center" }}>
												<DropDown
													trigger={
														<ClayButtonWithIcon
															aria-label="Actions"
															symbol="ellipsis-v"
															title="Actions"
															borderless="true"
															displayType="secondary"
															size="xs"
															spritemap={this.spritemap}
														/>
													}
													menuWidth="shrink"
												>
													<DropDown.ItemList
														items={
															!fileInfo.file
																? [
																		{
																			id: "delete",
																			name: Util.translate("delete"),
																			symbol: "times"
																		},
																		{
																			id: "download",
																			name: Util.translate("download"),
																			symbol: "download"
																		}
																  ]
																: [
																		{
																			id: "delete",
																			name: Util.translate("delete"),
																			symbol: "times"
																		},
																		{
																			id: "upload",
																			name: Util.translate("upload"),
																			symbol: "upload"
																		}
																  ]
														}
													>
														{(actionItem) => (
															<DropDown.Item
																key={actionItem.name}
																onClick={() =>
																	this.handleActionClick(actionItem.id, fileInfo)
																}
															>
																<Icon
																	spritemap={this.spritemap}
																	symbol={actionItem.symbol}
																	style={{ marginRight: "5px" }}
																/>
																{actionItem.name}
															</DropDown.Item>
														)}
													</DropDown.ItemList>
												</DropDown>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		);
	}

	renderGridCell() {
		return this.renderFileManager();
	}

	renderFormField() {
		return (
			<>
				{this.parameter.renderTitle({
					spritemap: this.spritemap
				})}
				{this.parameter.showDefinition && (
					<div className="sx-param-definition">
						<pre>{this.parameter.getDefinition()}</pre>
					</div>
				)}
				{this.renderFileManager()}
				{this.state.openComments && this.parameter.renderCommentDisplayer(this.spritemap)}
			</>
		);
	}

	renderUnderConstruction() {
		return (
			<>
				{this.state.underConstruction && (
					<SXModalDialog
						header={Util.translate("sorry")}
						body={<UnderConstruction />}
						buttons={[
							{
								label: Util.translate("ok"),
								onClick: () => {
									this.setState({ underConstruction: false });
								}
							}
						]}
					/>
				)}
			</>
		);
	}

	render() {
		return (
			<div
				className={this.parameter.getClassName(this.className, this.cellIndex)}
				style={{ ...this.style, ...this.parameter.style }}
			>
				{this.parameter.displayType == ParameterConstants.DisplayTypes.FORM_FIELD && this.renderFormField()}
				{this.parameter.displayType == ParameterConstants.DisplayTypes.GRID_CELL && this.renderGridCell()}
				{this.parameter.renderFormFieldFeedback(this.spritemap, this.cellIndex)}
			</div>
		);
	}
}

export default SXFile;
