import React from "react";
import { Icon, Provider, TreeView } from "@clayui/core";
import { SXModalDialog } from "../../stationx/modal";
import SXBaseParameterComponent from "./base-parameter-component";
import { ParameterUtil } from "../Parameter/parameters";
import { ParamType } from "../../stationx/station-x";
import { Util } from "../../stationx/util";
import "@clayui/css/lib/css/atlas.css";

class SXTreeView extends SXBaseParameterComponent {
	constructor(props) {
		super(props);

		console.log("[SXTreeView] props: ", props);
		this.commentItems = props.commentItems;

		this.nestedKey = "replies";

		this.comment = ParameterUtil.createParameter({
			namespace: this.namespace,
			formId: this.componentId,
			paramType: ParamType.STRING,
			properties: {
				paramCode: "_comment",
				multipleLine: true,
				placeholder: Util.getTranslationObject(this.languageId, "add-a-comment")
			}
		});
	}

	handleAddComment = () => {};

	handleAddReply = (parentCommentId) => {};

	render() {
		console.log("[SXTreeView] render: ", this.commentItems);
		const items = [
			{
				children: [
					{
						children: [{ comment: "ultrices dui sapien" }],
						comment: "fusce ut placerat"
					},
					{ comment: "maecenas pharetra convallis" }
				],
				comment: "nisi quis eleifend"
			}
		];

		return (
			<div style={{ border: "1px solid gray", marginLeft: "1.0rem", overflowX: "auto", maxHeight: "10.0rem" }}>
				<Provider spritemap={this.spritemap}>
					<TreeView
						defaultItems={items}
						nestedKey="children"
						dragAndDrop={true}
					>
						{(item) => (
							<TreeView.Item key={item.comment}>
								<TreeView.ItemStack>{item.comment}</TreeView.ItemStack>

								{item.children && (
									<TreeView.Group items={item.children}>
										{(item) => <TreeView.Item key={item.comment}>{item.comment}</TreeView.Item>}
									</TreeView.Group>
								)}
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			</div>
		);

		/*
		return (
			<div>
				{this.comment.renderField({ spritemap: this.spritemap })}
				<TreeView
					items={this.commentItems}
					nestedKey={this.nestedKey}
				>
					{(item) => {
						return (
							<TreeView.item key={item.id}>
								<TreeView.ItemStack>
									<div className="autofit-row">
										<div className="autofit-col">
											<Icon
												symbol="reply"
												spritemap={this.spritemap}
											/>
											<pre>{item.comment}</pre>
										</div>
										<div className="autofit-col autofit-col-shrink">
											<Icon
												symbol="comments"
												spritemap={this.spritemap}
												onClick={() => {
													item.parentId > 0
														? this.handleAddReply(item.parentId)
														: this.handleAddComment();
												}}
											/>
										</div>
									</div>
								</TreeView.ItemStack>
								{ item.replies && <TreeView.Group items={item.replies}>

								</TreeView.Group>
							</TreeView.item>
						);
					}}
				</TreeView>
			</div>
		); */
	}
}

export default SXTreeView;
