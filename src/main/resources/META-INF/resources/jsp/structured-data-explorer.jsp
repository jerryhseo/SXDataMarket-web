<%@page import="com.sx.icecap.constant.DisplayStyle"%>
<%@page import="com.liferay.portal.kernel.search.Field"%>
<%@page import="com.liferay.portal.kernel.workflow.WorkflowConstants"%>
<%@page import="com.sx.constant.StationXConstants"%>
<%@page import="com.liferay.portal.kernel.json.JSONFactoryUtil"%>
<%@page import="com.liferay.portal.kernel.util.GetterUtil"%>
<%@page import="com.liferay.portal.kernel.json.JSONArray"%>
<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.liferay.portal.kernel.util.ParamUtil"%>
<%@page import="com.liferay.petra.string.StringPool"%>
<%@page import="com.sx.icecap.constant.WebKey"%>
<%@page import="com.liferay.portal.kernel.util.PortalUtil"%>
<%@ include file="./init.jsp" %>

<%
    long dataCollectionId = ParamUtil.getLong(renderRequest, "dataCollectionId", 0);
    long dataSetId = ParamUtil.getLong(renderRequest, "dataSetId", 0);
    long dataTypeId = ParamUtil.getLong(renderRequest, "dataTypeId", 0);
    boolean checkbox = ParamUtil.getBoolean(renderRequest, "checkbox", true);
    boolean breadcrumb = ParamUtil.getBoolean(renderRequest, "breadcrumb", false);
    boolean addButton = ParamUtil.getBoolean(renderRequest, "addButton", true);
    
	int start = ParamUtil.getInteger(renderRequest, "start", StationXConstants.DEFAULT_START);
	int end = ParamUtil.getInteger(renderRequest, "end", StationXConstants.DEFAULT_END);
	int delta = ParamUtil.getInteger(renderRequest, "delta", StationXConstants.DEFAULT_DELTA);
	int status = ParamUtil.getInteger(renderRequest, "status", WorkflowConstants.STATUS_APPROVED);
	String orderCol = ParamUtil.getString(renderRequest, StationXWebKeys.ORDER_BY_COL, Field.MODIFIED_DATE);
	String orderType = ParamUtil.getString(renderRequest, StationXWebKeys.ORDER_BY_TYPE, StationXConstants.ASC);
	String navigation = ParamUtil.getString(renderRequest, StationXWebKeys.NAVIGATION, StationXConstants.NAVIGATION_MINE);
	String  keywords = ParamUtil.getString(renderRequest, StationXWebKeys.KEYWORDS, StringPool.BLANK);

	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);

	JSONArray permissions = (JSONArray)GetterUtil.getObject(renderRequest.getAttribute("permissions"), JSONFactoryUtil.createJSONArray());
	
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
				params:{
					dataCollectionId: Number('<%= dataCollectionId %>'),
					dataSetId: Number('<%= dataSetId %>'),
					dataTypeId: Number('<%= dataTypeId %>'),
					checkbox: <%= checkbox %>,
					addButton: <%= addButton %>,
					breadcrumb: <%= breadcrumb %>,
					start: Number('<%= start %>'),
					delta: Number('<%= delta %>'),
					status: Number('<%= status %>'),
					navigation: '<%= navigation %>',
					sortCol: '<%= orderCol %>',
					sortType: '<%= orderType %>',
					keywords: '<%= keywords %>',
					displayStyle: '<%= DisplayStyle.TABLE %>'
				}
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>