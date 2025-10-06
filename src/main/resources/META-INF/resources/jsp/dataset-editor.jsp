<%@page import="com.liferay.portal.kernel.json.JSONArray"%>
<%@page import="com.sx.icecap.constant.DisplayStyle"%>
<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.liferay.portal.kernel.service.LayoutLocalServiceUtil"%>
<%@page import="com.liferay.portal.kernel.model.LayoutTypePortlet"%>
<%@page import="com.liferay.portal.kernel.workflow.WorkflowConstants"%>
<%@page import="com.liferay.petra.string.StringPool"%>
<%@page import="com.liferay.portal.kernel.search.Field"%>
<%@page import="com.liferay.portal.kernel.model.Layout"%>
<%@page import="com.liferay.portal.kernel.util.PortalUtil"%>
<%@page import="com.sx.util.SXPortalUtil"%>
<%@page import="com.sx.icecap.constant.WebKey"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.sx.icecap.constant.MVCCommand"%>
<%@page import="com.sx.constant.StationXWebKeys"%>
<%@page import="com.liferay.portal.kernel.util.Validator"%>
<%@page import="com.sx.constant.StationXConstants"%>
<%@page import="com.liferay.portal.kernel.util.GetterUtil"%>
<%@page import="com.sx.icecap.model.DataType"%>
<%@page import="java.util.List"%>
<%@ include file="./init.jsp" %>
<!-- link
	rel="stylesheet"
	href="https://cdn.jsdelivr.net/npm/@clayui/css/lib/css/atlas.css"
/ -->

<%
	long dataCollectionId = ParamUtil.getLong(renderRequest, "dataCollectionId", 0);
	long dataSetId = ParamUtil.getLong(renderRequest, "dataSetId", 0);
	
	JSONArray permissions = (JSONArray)renderRequest.getAttribute("permissions");
	
	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("[DataSetEditor] workbenchId: " + workbenchId);
	System.out.println("[DataSetEditor] permissions: " + permissions.toString());
%>

<div id="<portlet:namespace />dataSetEditorRoot"></div>

<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<liferay-portlet:renderURL portletName="<%=workbenchId%>"  var="workbenchURL"  windowState="<%=LiferayWindowState.NORMAL.toString()%>">
</liferay-portlet:renderURL>

<script>
window.SXWorkingPortletInfo = {
		rootElement: "<portlet:namespace />dataSetEditorRoot",
		portletId: "<%=WebPortletKey.SXDataSetEditorPortlet%>",
		portletParams:{
			namespace: '<portlet:namespace/>',
			groupId: themeDisplay.getScopeGroupId(),
			userId: themeDisplay.getUserId(),
			dafaultLanguageId: '<%= defaultLocale.toLanguageTag() %>',
			currentLanguageId: '<%= locale.toLanguageTag() %>',
			availableLanguageIds: '<%= String.join( ",", locales.toArray(new String[0]) ) %>', 
			portalURL: '<%= portalURL %>', 
			contextPath: '<%= contextPath %>',
			spritemapPath: '<%= contextPath %>/asset/images/icons.svg',
			portletId: '<%= portletDisplay.getId() %>',
			imagePath: '<%= contextPath %>/asset/images/',
			plid: '<%= themeDisplay.getPlid() %>',
			baseRenderURL: '<%=  baseRenderURL %>',
			baseActionURL: '<%=  baseActionURL %>',
			baseResourceURL: '<%=  baseResourceURL %>',
			permissions: JSON.parse('<%= permissions.toJSONString() %>'),
			workbenchNamespace: '<%= workbenchNamespace %>',
			workbenchPortletId: '<%= workbenchId %>',
			params: { // initial parameters
				dataCollectionId: Number('<%= dataCollectionId %>'),
				dataSetId: Number('<%= dataSetId %>'),
			}
		}
};

SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>
