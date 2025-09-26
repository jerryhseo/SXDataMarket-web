<%@page import="com.sx.icecap.constant.DisplayStyle"%>
<%@page import="com.liferay.portal.kernel.search.Field"%>
<%@page import="com.liferay.portal.kernel.workflow.WorkflowConstants"%>
<%@page import="com.sx.constant.StationXConstants"%>
<%@page import="com.liferay.portal.kernel.json.JSONFactoryUtil"%>
<%@page import="com.sx.icecap.model.DataStructure"%>
<%@page import="com.liferay.portal.kernel.util.GetterUtil"%>
<%@page import="com.sx.icecap.model.TypeStructureLink"%>
<%@page import="com.liferay.portal.kernel.json.JSONArray"%>
<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.liferay.portal.kernel.util.ParamUtil"%>
<%@page import="com.liferay.petra.string.StringPool"%>
<%@page import="com.sx.icecap.constant.WebKey"%>
<%@page import="com.liferay.portal.kernel.util.PortalUtil"%>
<%@ include file="./init.jsp" %>

<%
    long dataTypeId = ParamUtil.getLong(renderRequest, "dataTypeId", 0);
    long structuredDataId = ParamUtil.getLong(renderRequest, "structuredDataId", 0);
	JSONArray permissions = (JSONArray)GetterUtil.getObject(renderRequest.getAttribute("permissions"), JSONFactoryUtil.createJSONArray());
	int start = GetterUtil.getInteger(renderRequest.getAttribute(StationXWebKeys.START), StationXConstants.DEFAULT_START);
	int end = GetterUtil.getInteger(renderRequest.getAttribute(StationXWebKeys.END), StationXConstants.DEFAULT_END);
	int delta = GetterUtil.getInteger(renderRequest.getAttribute(StationXWebKeys.DELTA), StationXConstants.DEFAULT_DELTA);
	int status = GetterUtil.getInteger(renderRequest.getAttribute(StationXWebKeys.STATUS), WorkflowConstants.STATUS_APPROVED);
	String orderCol = GetterUtil.getString(renderRequest.getAttribute(StationXWebKeys.ORDER_BY_COL), Field.MODIFIED_DATE);
	String orderType = GetterUtil.getString(renderRequest.getAttribute(StationXWebKeys.ORDER_BY_TYPE), StationXConstants.ASC);
	String navigation = GetterUtil.getString(renderRequest.getAttribute(StationXWebKeys.NAVIGATION), StationXConstants.NAVIGATION_MINE);
	String  keywords = GetterUtil.getString(renderRequest.getAttribute(StationXWebKeys.KEYWORDS), StringPool.BLANK);

	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("[SXStructuredDataExplorer] workbenchNamespace: " + workbenchNamespace);
	System.out.println("[SXStructuredDataExplorer] portletId: " + portletDisplay.getId());
%>

<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<liferay-portlet:renderURL portletName="<%=workbenchId%>"  var="workbenchURL"  windowState="<%=LiferayWindowState.NORMAL.toString()%>">
</liferay-portlet:renderURL>

<div id="<portlet:namespace />structuredDataExplorerRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
			rootElement: "<portlet:namespace />structuredDataExplorerRoot",
			portletId: "<%=portletDisplay.getPortletName()%>",
			portletParams:{
				namespace: '<portlet:namespace/>',
				portalURL: '<%= portalURL %>', 
				contextPath: '<%= contextPath %>',
				spritemapPath: '<%= contextPath %>/asset/images/icons.svg',
				portletId: '<%= portletDisplay.getId() %>',
				imagePath: '<%= contextPath %>/asset/images/',
				baseRenderURL: '<%=  baseRenderURL %>',
				baseActionURL: '<%=  baseActionURL %>',
				baseResourceURL: '<%=  baseResourceURL %>',
				permissions: JSON.parse('<%= permissions.toJSONString() %>'),
				workbenchNamespace: '<%= workbenchNamespace %>',
				workbenchId: '<%= workbenchId %>',
				workbenchURL: '<%= workbenchId %>',
				dataTypeId: Number('<%= dataTypeId %>'),
				structuredDataId: Number('<%= structuredDataId %>'),
				start: Number('<%= start %>'),
				delta: Number('<%= delta %>'),
				status: Number('<%= status %>'),
				navigation: '<%= navigation %>',
				sortCol: '<%= orderCol %>',
				sortType: '<%= orderType %>',
				keywords: '<%= keywords %>',
				displayStyle: '<%= DisplayStyle.TABLE %>'
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>