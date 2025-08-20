import startPortlet from "./index.js";

function waitForSXWorkingPortletInfo() {
	if (window.SXWorkingPortletInfo) {
		startPortlet(
			window.SXWorkingPortletInfo.rootElement,
			window.SXWorkingPortletInfo.portletId,
			window.SXWorkingPortletInfo.portletParams
		);
	} else {
		setTimeout(waitForSXWorkingPortletInfo, 50);
	}
}

waitForSXWorkingPortletInfo();
