import React, { createRef } from "react";
import { ClayInput } from "@clayui/form";
import { Util } from "./util";
import Button, { ClayButtonWithIcon } from "@clayui/button";
import { Constant, Event } from "./station-x";
import Icon from "@clayui/icon";
import { SXElbowDownRightIcon, SXSendIcon } from "./icon";
import { Workbench } from "../portlets/DataWorkbench/workbench";

class SXBaseCommentComponent extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.formId = props.formId;

		this.dataId = props.dataId;
		this.paramCode = props.paramCode;
		this.paramVersion = props.paramVersion ?? "1.0.0";
		this.commentItem = props.commentItem ?? {};
		this.spritemap = props.spritemap;
		this.level = props.level ?? 1;

		this.commentId = this.commentItem.id;
		this.userId = this.commentItem.userId;
		this.userName = this.commentItem.userName;
		this.comment = this.commentItem.comment;
		this.parentId = this.commentItem.parentId;
		this.date = this.commentItem.date;
		this.replies = this.commentItem.replies;
		this.status = this.commentItem.status;
	}

	render() {
		return null;
	}
}

class SXCommentFreezed extends SXBaseCommentComponent {
	constructor(props) {
		super(props);

		this.userId = props.userId;
		this.userName = props.userName;
		this.date = props.date;
	}

	handle;

	render() {
		return (
			<ClayInput.Group small>
				<ClayInput.GroupItem>
					<ClayInput
						defaultValue={Util.translate("comments-are-freezed-by-at", this.userName, this.date)}
						disabled={true}
						className="form-control"
						sizing="sm"
						style={{
							backgroundColor: "#f5d5d5",
							fontWeight: "bolder"
						}}
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>
		);
	}
}

class SXCommentInput extends SXBaseCommentComponent {
	constructor(props) {
		super(props);
		//console.log("[SXCommentInput] props: ", props);

		this.placeholder = props.placeholder ?? Util.translate("enter-a-comment");

		this.state = {
			comment: ""
		};
	}

	countRows() {
		return this.state.comment ? this.state.comment.split("\n").length : 1;
	}

	handleChange = (event) => {
		//console.log("[SXCommentInput] handleChange: ", event.target.value);
		this.setState({ comment: event.target.value });
	};

	handleSend = () => {
		this.commentItem.status = "view";
		Event.fire(Event.SX_ADD_COMMENT, this.namespace, this.namespace, {
			targetFormId: this.formId,
			parentId: this.commentItem.id,
			comment: this.state.comment
		});

		this.setState({ comment: "" });
	};

	handleCancel = () => {
		this.commentItem.status = "view";

		Event.fire(Event.SX_OPEN_COMMENT_INPUT, this.namespace, this.namespace, {
			targetFormId: this.formId,
			commentItem: this.commentItem
		});
	};

	render() {
		const textareaStyle = {
			width: "100%",
			fontSize: "16px",
			backgroundColor: "#fff",
			lineHeight: "1.5em",
			padding: "8px",
			resize: "none",
			overflow: "hidden",
			boxSizing: "border-box",
			border: "none",
			borderBottom: "2px solid gray",
			height: "auto",
			marginBottom: "5px"
		};

		//console.log("[SXCommentInput] render: ", this.countRows());
		return (
			<ClayInput.Group
				small
				style={{ marginBottom: "1rem" }}
			>
				{this.level > 1 && (
					<ClayInput.GroupItem
						shrink
						style={{
							alignContent: "center"
						}}
					>
						<SXElbowDownRightIcon
							width="18px"
							height="18px"
						/>
					</ClayInput.GroupItem>
				)}
				<ClayInput.GroupItem>
					<textarea
						id={this.namespace + "_" + this.commentItem.id}
						rows={"" + this.countRows()}
						placeholder={this.placeholder}
						style={textareaStyle}
						value={this.state.comment}
						onChange={this.handleChange}
						className="form-control"
					></textarea>
				</ClayInput.GroupItem>
				<ClayInput.GroupItem
					shrink
					style={{
						alignContent: "center"
					}}
				>
					<SXSendIcon
						width="18"
						height="18"
						onClick={this.handleSend}
					/>
					{this.parentId > 0 && (
						<Icon
							symbol="times-circle"
							spritemap={this.spritemap}
							onClick={this.handleCancel}
							style={{ marginLeft: "8px", fontSize: "14", alignSelf: "end" }}
						/>
					)}
				</ClayInput.GroupItem>
			</ClayInput.Group>
		);
	}
}

class SXCommentView extends SXBaseCommentComponent {
	constructor(props) {
		super(props);
		//console.log("[SXCommentView] props: ", props);
	}

	handleReply = () => {
		this.commentItem.status = "add";

		Event.fire(Event.SX_OPEN_COMMENT_INPUT, this.namespace, this.namespace, {
			targetFormId: this.formId,
			commentItem: this.commentItem
		});
	};

	handleDelete = () => {
		Event.fire(Event.SX_DELETE_COMMENT, this.namespace, this.namespace, {
			targetFormId: this.formId,
			commentId: this.commentItem.id
		});
	};

	render() {
		return (
			<div className="autofit-row">
				<div className="autofit-col autofit-col-expand">
					<div
						className="autofit-row"
						style={{ fontStyle: "italic" }}
					>
						{this.level > 1 && (
							<div className="autofit-col autofit-col-shrink">
								<SXElbowDownRightIcon
									width="18px"
									height="18px"
								/>
							</div>
						)}
						<div
							className="autofit-col"
							style={{ marginRight: "0.5rem" }}
						>
							<span style={{ fontWeight: "bold" }}>{this.userName}</span>
						</div>
						<div className="autofit-col">{this.date}</div>
					</div>
					<div className="autofit-row">
						<div
							className="autofit-col autofit-col-expand"
							style={{ paddingLeft: this.level * 0.5 + 1 + "rem" }}
						>
							{this.comment}
						</div>
					</div>
				</div>
				<div
					className="autofit-col autofit-col-shrink"
					style={{ display: "inline" }}
				>
					<Icon
						symbol="reply"
						spritemap={this.spritemap}
						onClick={this.handleReply}
						style={{ marginRight: "5px", height: "0.775em", width: "0.775em" }}
					/>
					<Icon
						symbol="times"
						spritemap={this.spritemap}
						onClick={this.handleDelete}
						style={{ height: "0.775em", width: "0.775em" }}
					></Icon>
				</div>
			</div>
		);
	}
}

class SXCommentDisplayer extends React.Component {
	constructor(props) {
		super(props);
		//console.log("[SXCommentDisplayer] props: ", props);
		this.namespace = props.namespace;
		this.formId = props.formId;

		this.user = SXSystem.getUser();

		this.dataId = props.dataId;
		this.commentModel = props.commentModel;
		this.dataInstance = props.dataInstance;
		this.paramCode = props.paramCode;
		this.paramVersion = props.paramVersion ?? "1.0.0";
		this.placeholder = props.placeholder ?? Util.translate("enter-a-comment");
		this.spritemap = props.spritemap;
		this.level = 1;

		this.commentItems = props.commentItems;

		this.componentId = this.dataId + "_" + this.paramCode + "_" + Util.randomKey();
	}

	listenerAddReply = (event) => {
		const { targetPortlet, targetFormId } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.itemId) {
			return;
		}
	};

	listenerOpenCommentInput = (event) => {
		const { targetPortlet, targetFormId, commentItem } = event.dataPacket;

		//console.log("[SXCommentDisplayer] listenerOpenCommentInput", targetPortlet, targetFormId, commentItem);
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}
		//console.log("[SXCommentDisplayer] listenerOpenCommentInput", commentItem);

		commentItem.commentInput = true;

		this.forceUpdate();
	};

	listenerDeleteComment = (event) => {
		const { targetPortlet, targetFormId, commentId } = event.dataPacket;

		//console.log("[SXCommentDisplayer] listenerDeleteComment", targetPortlet, targetFormId, commentId);
		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			return;
		}

		//console.log("[SXCommentDisplayer] listenerDeleteComment", commentId);
		Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
			targetFormId: this.formId,
			sourceFormId: this.componentId,
			requestId: Workbench.RequestIDs.deleteComment,
			params: { commentId: commentId }
		});
	};

	listenerAddComment = (event) => {
		const { targetPortlet, targetFormId, comment, parentId } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			/*
			console.log(
				"[SXCommentDisplayer] listenerAddComment rejected",
				targetPortlet,
				targetFormId,
				parentId,
				comment
			);
			*/
			return;
		}

		//console.log("[SXCommentDisplayer] listenerAddComment", parentId, comment);
		Event.fire(Event.SX_REQUEST, this.namespace, this.namespace, {
			requestId: Workbench.RequestIDs.addComment,
			targetFormId: this.formId,
			sourceFormId: this.componentId,
			params: {
				dataId: this.dataId,
				paramCode: this.paramCode,
				parentId: parentId,
				comment: comment
			}
		});
	};

	listenerResponse = (event) => {
		const { targetPortlet, targetFormId, requestId, params, data } = event.dataPacket;

		if (targetPortlet !== this.namespace || targetFormId !== this.componentId) {
			//console.log("[SXCommentDisplayer] listenerResponse rejected", event.dataPacket);
			return;
		}
		//console.log("[SXCommentDisplayer] listenerResponse", requestId, params, data);

		switch (requestId) {
			case Workbench.RequestIDs.addComment: {
				const parentItem = this.findCommentItem(this.commentItems, data.parentId);

				if (parentItem) {
					parentItem.replies.unshift(data);
				} else {
					this.commentItems.unshift(data);
				}

				break;
			}
			case Workbench.RequestIDs.deleteComment: {
				this.commentItems = this.deleteCommentItem(this.commentItems, data.id);

				//console.log("[SXCommentDisplayer] listenerResponse deleteComment data: ", data, this.commentItems);
				break;
			}
		}

		this.forceUpdate();
	};

	componentDidMount() {
		Event.on(Event.SX_OPEN_COMMENT_INPUT, this.listenerOpenCommentInput);
		Event.on(Event.SX_DELETE_COMMENT, this.listenerDeleteComment);
		Event.on(Event.SX_ADD_COMMENT, this.listenerAddComment);
		Event.on(Event.SX_RESPONSE, this.listenerResponse);
	}

	componentWillUnmount() {
		Event.off(Event.SX_OPEN_COMMENT_INPUT, this.listenerOpenCommentInput);
		Event.off(Event.SX_DELETE_COMMENT, this.listenerDeleteComment);
		Event.off(Event.SX_ADD_COMMENT, this.listenerAddComment);
		Event.off(Event.SX_RESPONSE, this.listenerResponse);
	}

	findCommentItem(commentItems, id) {
		let foundItem = null;
		commentItems.every((item) => {
			foundItem = item.id === id ? item : null;

			if (!foundItem && item.replies) {
				foundItem = this.findCommentItem(item.replies, id);
			}

			return foundItem ? Constant.STOP_EVERY : Constant.CONTINUE_EVERY;
		});

		return foundItem;
	}

	deleteCommentItem(commentItems, id) {
		return commentItems.filter((item) => {
			let deleted = item.id === id ? true : false;

			if (!deleted && item.replies) {
				item.replies = this.deleteCommentItem(item.replies, id);
			}

			return !deleted;
		});
	}

	renderReplies(commentItems, level) {
		return (
			<div style={{ marginLeft: level + "rem" }}>
				{commentItems.map((commentItem) => {
					return this.renderCommentItem(commentItem, level);
				})}
			</div>
		);
	}

	renderCommentItem(commentItem, level) {
		return (
			<div key={commentItem.id}>
				<SXCommentView
					namespace={this.namespace}
					formId={this.componentId}
					commentItem={commentItem}
					level={level}
					spritemap={this.spritemap}
				/>
				{commentItem.status === "add" && (
					<div style={{ marginLeft: level + 1 + "rem" }}>
						<SXCommentInput
							namespace={this.namespace}
							formId={this.componentId}
							commentItem={commentItem}
							spritemap={this.spritemap}
						/>
					</div>
				)}
				{commentItem.replies &&
					commentItem.replies.length > 0 &&
					this.renderReplies(commentItem.replies, level + 1)}
			</div>
		);
	}

	handleCloseComment = (close) => {
		this.dataInstance.commentFreezed = close ?? true;
		this.dataInstance.commentFreezeUserId = this.user.userId;
		this.dataInstance.commentFreezeUserName = this.user.userName;
		this.dataInstance.commentFreezeDate = new Date();

		Event.fire(Event.SX_FREEZE_COMMENTS, this.namespace, this.namespace, {
			targetFormId: this.formId,
			sourceFormId: this.formId,
			params: {
				dataId: this.dataId,
				dataInstance: this.dataInstance
			}
		});

		this.forceUpdate();
	};

	render() {
		//console.log("[SXCommentDisplayer] render: ", this.props, this.commentItems);
		return (
			<div style={{ marginLeft: "1rem" }}>
				<div className="autofit-row autofit-row-padded autofit-padded-no-gutters-x">
					<div className="autofit-col autofit-col-expand">
						{!this.dataInstance.commentFreezed && (
							<SXCommentInput
								namespace={this.namespace}
								formId={this.componentId}
								spritemap={this.spritemap}
							/>
						)}
						{this.dataInstance.commentFreezed && (
							<SXCommentFreezed
								namespace={this.namespace}
								formId={this.componentId}
								userId={this.dataInstance.commentFreezeUserId}
								userName={this.dataInstance.commentFreezeUserName}
								date={this.dataInstance.commentFreezeDate.toLocaleString()}
								spritemap={this.spritemap}
							/>
						)}
					</div>
					<div className="autofit-col autofit-col-shrink">
						{!this.dataInstance.commentFreezed && (
							<Button
								displayType="primary"
								size="xs"
								style={{ borderRadius: "15px" }}
								onClick={() => this.handleCloseComment(true)}
							>
								{Util.translate("freeze-comments")}
							</Button>
						)}
						{this.dataInstance.commentFreezed && (
							<Button
								displayType="primary"
								size="xs"
								style={{ borderRadius: "15px" }}
								onClick={() => this.handleCloseComment(false)}
							>
								{Util.translate("unfreeze-comments")}
							</Button>
						)}
					</div>
				</div>
				<div className="autofit-row">
					<div className="autofit-col autofit-col-expand">
						{this.commentItems.map((commentItem) => {
							return this.renderCommentItem(commentItem, 1);
						})}
					</div>
				</div>
			</div>
		);
	}
}

export default SXCommentDisplayer;
