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
	long dataCollectionId = ParamUtil.getLong(renderRequest, WebKey.DATACOLLECTION_ID, 0);
	JSONArray permissions = (JSONArray)renderRequest.getAttribute("permissions");

	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("[datacollection-editor.jsp] workbenchNamespace: " + workbenchNamespace);
	System.out.println("[datacollection-editor.jsp] workbenchId: " + workbenchId);
%>

<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<liferay-portlet:renderURL portletName="<%=workbenchId%>"  var="workbenchURL"  windowState="<%=LiferayWindowState.NORMAL.toString()%>">
</liferay-portlet:renderURL>

<div id="<portlet:namespace />dataCollectionEditorRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
			rootElement: "<portlet:namespace />dataCollectionEditorRoot",
			portletId: "<%=WebPortletKey.SXDataCollectionEditorPortlet%>",
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
				params:{
					dataCollectionId: Number('<%= dataCollectionId %>')
				}
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>