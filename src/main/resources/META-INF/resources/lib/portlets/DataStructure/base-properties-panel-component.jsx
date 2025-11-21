import React from "react";

class SXBasePropertiesPanelComponent extends React.Component {
	constructor(props) {
		super(props);

		this.namespace = props.namespace;
		this.formId = props.formId;
		this.dataStructure = props.dataStructure;
		this.workingParam = props.workingParam;

		this.languageId = SXSystem.getLanguageId();
		this.defaultLanguageId = SXSystem.getDefaultLanguageId();
		this.availableLanguageIds = SXSystem.getAvailableLanguages();
		this.spritemap = props.spritemap;
	}

	render() {
		return <></>;
	}
}

export default SXBasePropertiesPanelComponent;
