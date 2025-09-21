import startPortlet from "./index.js";

function waitForSXWorkingPortletInfo() {
	if (window.SXWorkingPortletInfo) {
		startPortlet(
			window.SXWorkingPortletInfo.rootElement,
			window.SXWorkingPortletInfo.portletId,
			window.SXWorkingPortletInfo.portletParams
		);
	} else {
		console.log("Waiting working portlet Info...");
		setTimeout(waitForSXWorkingPortletInfo, 200);
	}
}

waitForSXWorkingPortletInfo();
