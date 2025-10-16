<%@page import="com.liferay.portal.kernel.search.Field"%>
<%@page import="com.sx.constant.StationXConstants"%>
<%@page import="com.liferay.portal.kernel.json.JSONArray"%>
<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.sx.icecap.constant.MVCCommand"%>
<%@page import="com.liferay.portal.kernel.workflow.WorkflowConstants"%>
<%@page import="com.liferay.portal.kernel.util.ParamUtil"%>
<%@page import="com.liferay.petra.string.StringPool"%>
<%@page import="com.liferay.petra.string.StringUtil"%>
<%@page import="com.sx.icecap.constant.WebKey"%>
<%@page import="com.liferay.portal.kernel.util.GetterUtil"%>
<%@page import="com.liferay.portal.kernel.util.PortalUtil"%>
<%@ include file="./init.jsp" %>

<%
	JSONArray permissions = (JSONArray)renderRequest.getAttribute("permissions");

	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	int start = ParamUtil.getInteger(renderRequest, StationXWebKeys.START, StationXConstants.DEFAULT_START);
	int end = ParamUtil.getInteger(renderRequest, StationXWebKeys.END, StationXConstants.DEFAULT_END);
	int delta = ParamUtil.getInteger(renderRequest, StationXWebKeys.DELTA, StationXConstants.DEFAULT_DELTA);
	int status = ParamUtil.getInteger(renderRequest, StationXWebKeys.STATUS, WorkflowConstants.STATUS_APPROVED);
	String orderCol = ParamUtil.getString(renderRequest, StationXWebKeys.ORDER_BY_COL, Field.MODIFIED_DATE);
	String orderType = ParamUtil.getString(renderRequest, StationXWebKeys.ORDER_BY_TYPE, StationXConstants.ASC);
	String navigation = ParamUtil.getString(renderRequest, StationXWebKeys.NAVIGATION, StationXConstants.NAVIGATION_MINE);
	String  keywords = ParamUtil.getString(renderRequest, StationXWebKeys.KEYWORDS, StringPool.BLANK);

	boolean  managementBar = ParamUtil.getBoolean(renderRequest, "managementBar", true);
	boolean  filter = ParamUtil.getBoolean(renderRequest, "filter", true);
	boolean  searchBar = ParamUtil.getBoolean(renderRequest, "searchBar", true);
	boolean  addButton = ParamUtil.getBoolean(renderRequest, "addButton", true);
	boolean  checkbox = ParamUtil.getBoolean(renderRequest, "checkbox", true);
	boolean  actionButtons = ParamUtil.getBoolean(renderRequest, "actionButtons", true);
	boolean  actionMenus = ParamUtil.getBoolean(renderRequest, "actionMenus", true);
	boolean  displayStyles = ParamUtil.getBoolean(renderRequest, "displayStyles", true);
	
	System.out.println("[datacollection-explorer.jsp] workbenchNamespace: " + workbenchNamespace);
	System.out.println("[datacollection-explorer.jsp] workbenchId: " + workbenchId);
%>

<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<div id="<portlet:namespace />dataCollectionExplorerRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
			rootElement: "<portlet:namespace />dataCollectionExplorerRoot",
			portletId: "<%=WebPortletKey.SXDataCollectionExplorerPortlet%>",
			portletParams:{
				namespace: '<portlet:namespace/>',
				groupId: themeDisplay.getScopeGroupId(),
				userId: themeDisplay.getUserId(),
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
				params:{ // initial parameters
					groupId :  themeDisplay.getScopeGroupId(),
					userId: themeDisplay.getUserId(),
					start: Number('<%= start %>'),
					delta: Number('<%= delta %>'),
					status: Number('<%= status %>'),
					navigation: '<%= navigation %>',
					sortCol: '<%= orderCol %>',
					sortType: '<%= orderType %>',
					keywords: '<%= keywords %>',
					managementBar: <%= managementBar %>,
					filter: <%= filter %>,
					searchBar: <%= searchBar %>,
					addButton: <%= addButton %>,
					checkbox: <%= checkbox %>,
					actionButtons: <%= actionButtons %>,
					actionMenus: <%= actionMenus %>,
					displayStyles: <%= displayStyles %>
				}
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>