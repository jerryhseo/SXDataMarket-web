import React from "react";
import ClayForm, { ClayInput } from "@clayui/form";
import { ClayTooltipProvider } from "@clayui/tooltip";
import Icon from "@clayui/icon";
import Button from "@clayui/button";
import { Util } from "../../stationx/util";
import { Text } from "@clayui/core";
import { SXFreezeIcon, SXLinkIcon, SXQMarkIcon, SXVerifyIcon } from "../../stationx/icon";
import { Event } from "../../stationx/station-x";

export const SXRequiredMark = ({ spritemap }) => {
	return (
		<sup>
			<Icon
				symbol="asterisk"
				style={{
					fontSize: "0.5rem",
					margin: "0 3px 3px 3px",
					color: "red"
				}}
				spritemap={spritemap}
			/>
		</sup>
	);
};

export const SXTooltip = ({ tooltip, spritemap }) => {
	return (
		<ClayTooltipProvider>
			<span
				data-tooltip-align="top"
				title={tooltip}
				style={{ marginLeft: "3px" }}
			>
				<Icon
					spritemap={spritemap}
					symbol="question-circle-full"
				/>
			</span>
		</ClayTooltipProvider>
	);
};

export const SXLabel = ({ label, forHtml = "", required = false, tooltip = "", style, spritemap }) => {
	return (
		<label
			htmlFor={forHtml}
			className="control-label"
			style={style}
		>
			{label}
			{required ? <SXRequiredMark spritemap={spritemap} /> : undefined}
			{tooltip ? (
				<SXTooltip
					tooltip={tooltip}
					spritemap={spritemap}
				/>
			) : undefined}
		</label>
	);
};

export class SXTitleBar extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.formId = props.formId;
		this.spritemap = props.spritemap;
		this.parameter = props.parameter;
		this.style = props.style ?? { marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" };

		this.title = this.parameter.label;
		this.hasValue = this.parameter.hasValue();
		this.required = this.parameter.required ?? false;
		this.tooltip = this.parameter.getTooltip() ?? "";

		this.refLink = this.parameter.hasReferenceFile();
		this.inputStatus = this.parameter.inputStatus ?? false;
		this.commentable = this.parameter.commentable ?? false;
		this.commentClosed = this.parameter.commentable ?? false;
		this.verifiable = this.parameter.verifiable ?? false;
		this.freezable = this.parameter.freezable ?? false;
		this.verified = this.parameter.verified ?? true;
		this.freezed = this.parameter.freezed ?? false;

		this.commentInputOpened = false;

		//console.log("[SXTitleBar] props", props);
	}

	handlerQMarkClicked = () => {
		console.log("SXTitleBar: QMark clicked");
		//this.parameter.fireAddComment();

		this.commentInputOpened = !this.commentInputOpened;
		console.log("[SXTitleBar] handlerQMarkClicked: ", this.commentInputOpened);
		Event.fire(Event.SX_OPEN_COMMENTS, this.namespace, this.namespace, {
			targetFormId: this.formId,
			open: this.commentInputOpened,
			comentClosed: this.commentClosed
		});
	};

	handlerVerifyClicked = () => {
		console.log("SXTitleBar: Verified clicked");
	};

	handlerFreezeClicked = () => {
		console.log("SXTitleBar: Freezed clicked");
	};

	render() {
		let titleClass = this.inputStatus
			? this.hasValue
				? "sx-control-label"
				: "sx-control-label no-value"
			: "sx-control-label";

		return (
			<div
				className="autofit-row autofit-padding"
				style={this.style}
			>
				<div
					className={"autofit-col autofit-col-expand " + titleClass}
					style={{ display: "inline-block" }}
				>
					<span>{this.title}</span>
					<span>{this.required && <SXRequiredMark spritemap={this.spritemap} />}</span>
					<span>
						{Util.isNotEmpty(this.tooltip) && (
							<SXTooltip
								tooltip={this.tooltip}
								spritemap={this.spritemap}
							/>
						)}
					</span>
					{this.refLink && this.parameter.hasReferenceFile() && (
						<span style={{ paddingLeft: "3px" }}>
							<SXLinkIcon linked={true} />
						</span>
					)}
				</div>
				{this.parameter && this.inputStatus && this.parameter.isGroup && (
					<div
						className={"autofit-col"}
						style={{ display: "inline-block", color: "#f18585", marginRight: "0.5rem" }}
					>
						<span>
							{this.parameter.valuedFieldsCount +
								"/" +
								this.parameter.totalFieldsCount +
								"(" +
								((this.parameter.valuedFieldsCount / this.parameter.totalFieldsCount) * 100).toFixed(
									1
								) +
								"%)"}
						</span>
					</div>
				)}
				<div
					className="autofit-col"
					style={{ display: "inline-block" }}
				>
					{this.commentable && (
						<span style={{ marginRight: "0.4rem" }}>
							<SXQMarkIcon onClick={this.handlerQMarkClicked} />
						</span>
					)}
					{this.verifiable && (
						<span style={{ marginRight: "0.4rem" }}>
							<SXVerifyIcon
								verified={this.verified}
								onClick={() => this.handlerVerifyClicked()}
							/>
						</span>
					)}
					{this.freezable && (
						<span style={{ marginRight: "0.4rem" }}>
							<SXFreezeIcon
								freezed={this.freezed}
								onClick={() => this.handlerFreezeClicked()}
							/>
						</span>
					)}
				</div>
			</div>
		);
	}
}

export const SXLabeledText = ({
	label,
	text,
	align = "center",
	viewType = "INLINE_ATTACH",
	className = "",
	style = {},
	spritemap
}) => {
	const labelStyle = {
		backgroundColor: "#e7e7ed",
		marginBottom: "5px"
	};

	const textStyle = {
		backgroundColor: "#f1f2f5",
		marginBottom: "5px",
		justifyContent: align
	};

	switch (viewType) {
		case "INLINE_ATTACH": {
			return (
				<ClayInput.Group style={style}>
					<ClayInput.GroupItem
						shrink
						prepend
					>
						<ClayInput.GroupText style={labelStyle}>{label}</ClayInput.GroupText>
					</ClayInput.GroupItem>
					<ClayInput.GroupItem append>
						<ClayInput.GroupText
							className="form-group-autofit"
							style={textStyle}
						>
							{text}
						</ClayInput.GroupText>
					</ClayInput.GroupItem>
				</ClayInput.Group>
			);
		}
		case "FORM_FIELD": {
			return (
				<div
					className={className}
					style={style}
				>
					<SXLabel
						label={label}
						spritemap={spritemap}
					/>
					<br></br>
					<Text
						className="form-control form-control-sm"
						size={3}
						style={{ paddingBottom: "0" }}
					>
						{text}
					</Text>
				</div>
			);
		}
		default: {
			return <></>;
		}
	}
};

export const SXFormFieldFeedback = ({ content, level, symbol, spritemap }) => {
	return (
		<ClayForm.FeedbackGroup>
			<ClayForm.FeedbackItem>
				<ClayForm.FeedbackIndicator
					spritemap={spritemap}
					symbol={symbol}
				/>
				{content}
			</ClayForm.FeedbackItem>
		</ClayForm.FeedbackGroup>
	);
};

export const SXButtonWithIcon = ({
	type,
	id,
	label,
	symbol,
	disabled,
	displayType,
	href,
	style,
	size = "md",
	spritemap,
	onClick
}) => {
	return (
		<Button
			type={type}
			id={id}
			displayType={displayType}
			href={href}
			disabled={disabled}
			style={style}
			size={size}
			onClick={onClick}
		>
			<Icon
				spritemap={spritemap}
				symbol={symbol}
				style={{ marginRight: "5px" }}
			/>
			{label}
		</Button>
	);
};

class SXFormField extends React.Component {
	constructor(props) {
		super(props);
	}

	handleClick(e) {
		e.stopPropagation();

		if (!this.props.parameter.focused) {
			this.props.parameter.focused = true;

			this.props.parameter.fireParameterSelected(this.props.parameter.formId);

			this.forceUpdate();
		}
	}

	render() {
		return (
			<div
				style={{ marginBottom: "1.0rem" }}
				onClick={(e) => this.handleClick(e)}
			>
				{this.props.parameter.render({
					className: this.props.className,
					style: this.props.style,
					spritemap: this.props.spritemap,
					events: this.props.events,
					displayType: this.props.displayType,
					viewType: this.props.viewType,
					cellIndex: this.props.cellIndex
				})}
			</div>
		);
	}
}

export default SXFormField;
