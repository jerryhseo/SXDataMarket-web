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

		const files = this.parameter.getValue(this.cellIndex) ?? [];

		this.state = {
			value: files.filter((file) => !!file.name),
			underConstruction: false
		};

		console.log("[SXFile props] ", props, this.parameter, this.state.value);
	}

	componentDidMount() {
		super.componentDidMount();

		if (this.inputRef.current && Util.isNotEmpty(this.state.value)) {
			//console.log("[SXFile componentDidMount] ", this.state.value);
			const dataTransfer = new DataTransfer();

			this.state.value.forEach((fileItem) => {
				if (Util.isNotEmpty(fileItem.file)) {
					dataTransfer.items.add(fileItem.file);
				}
			});

			this.inputRef.current.files = dataTransfer.files;
		}
	}

	hasFiles() {
		let hasFile;

		this.state.value.every((fileInfo) => {
			hasFile = this.isFileInstance(fileInfo);

			return hasFile ? false : true;
		});

		return !!hasFile;
	}

	isFileInstance(fileItem) {
		return fileItem.file instanceof File;
	}

	handleFileSelectionChanged(files) {
		//console.log("[SXFile handleFileSelectionChanged] ", this.parameter.paramCode, files);

		let fileList;
		if (this.parameter.multipleFiles) {
			fileList = this.state.value.filter((fileInfo) => !this.isFileInstance(fileInfo));

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				fileList.push({
					name: file.name,
					lastModified: file.lastModified,
					type: file.type,
					file: file
				});
			}
		} else {
			const file = files[0];
			fileList = file ? [{ name: file.name, lastModified: file.lastModified, type: file.type, file: file }] : [];
		}

		this.setState({ value: fileList });
		this.parameter.setValue({ value: fileList, cellIndex: this.cellIndex });
		this.parameter.fireValueChanged(this.cellIndex);
	}

	valueToFiles() {
		const dataTransfer = new DataTransfer();

		let files = this.state.value
			.filter((fileItem) => {
				return this.isFileInstance(fileItem);
			})
			.map((fileItem) => fileItem.file);

		/*
		console.log(
			"[SXFile valueToFiles] ",
			this.parameter.paramCode,
			this.parameter.getValue(),
			this.state.value,
			files
		); */
		files.forEach((file) => dataTransfer.items.add(file));

		this.inputRef.current.files = dataTransfer.files;
	}

	handleActionClick(action, fileInfo) {
		console.log("[SXFile handleActionClick] ", action, fileInfo);
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
				let files;
				if (this.isFileInstance(fileInfo)) {
					files = this.state.value
						.filter((fileItem) => {
							return this.isFileInstance(fileItem) && fileItem.name !== fileInfo.name;
						})
						.map((fileItem) => fileItem.file);

					const dataTransfer = new DataTransfer();
					if (files.length > 0) {
						files.forEach((file) => dataTransfer.items.add(file));
					}

					this.inputRef.current.files = dataTransfer.files;
				} else {
					files = this.state.value.filter((fileItem) => {
						if (fileItem.name === fileInfo.name) {
							fileItemDeleting = fileItem;
							/*
							this.parameter.fireDeleteFiles({
								files: [
									{
										fileName: fileInfo.name,
										lastModified: fileInfo.lastModified,
										fileType: fileInfo.type
									}
								]
							});
							*/

							return false;
						}

						return true;
					});

					this.parameter.setValue({ value: files });
					this.setState({ value: files });
				}

				this.handleFileSelectionChanged(files);

				break;
			}
		}
	}

	renderFileManager() {
		if (this.inputRef.current && !this.parameter.hasValue()) {
			this.inputRef.current.value = "";
		}

		//console.log("[SXFile render] ", this.parameter.paramCode, this.state.value);
		if (this.inputRef && this.inputRef.current) {
			this.valueToFiles();
		}

		return (
			<div ref={this.focusRef}>
				<ClayInput
					type="file"
					accept={this.parameter.accepts}
					disabled={this.parameter.getDisabled(this.cellIndex)}
					multiple={this.parameter.multipleFiles}
					ref={this.inputRef}
					onChange={(e) => {
						this.handleFileSelectionChanged(e.target.files);
					}}
					sizing="sm"
					style={{ paddingLeft: "10px", marginBottom: "5px" }}
				/>
				{this.parameter.fileManager && Util.isNotEmpty(this.state.value) && this.state.value.length > 0 && (
					<div style={{ paddingLeft: "1rem" }}>
						<table
							style={{ width: "100%", fontSize: "0.750rem", borderCollapse: "collapse", border: "none" }}
						>
							<thead style={{ backgroundColor: "seashell" }}>
								<tr>
									<th style={{ padding: "3px", textAlign: "center" }}>{Util.translate("name")}</th>
									<th style={{ padding: "3px", textAlign: "center" }}>
										{Util.translate("last-modified")}
									</th>
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
											<td style={{ textAlign: "right" }}>
												{new Date(fileInfo.lastModified).toLocaleString()}
											</td>
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
															!this.isFileInstance(fileInfo)
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
