<%@page import="com.liferay.portal.kernel.portlet.PortletIdCodec"%>
<%@page import="com.liferay.portal.kernel.json.JSONArray"%>
<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.liferay.petra.string.StringPool"%>
<%@page import="com.sx.icecap.constant.WebKey"%>
<%@page import="com.sx.constant.StationXWebKeys"%>

<!-- link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@clayui/css/lib/css/atlas.css" -->
<%@ include file="./init.jsp" %>
<%
	JSONArray permissions = (JSONArray)renderRequest.getAttribute("permissions");
	
	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("workbenchNamespace: " + workbenchNamespace);
	System.out.println("workbenchId: " + workbenchId);
	System.out.println("DataStructureExplorer portletId: " + portletDisplay.getId());

%>


<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<div id="<portlet:namespace />dataStructureExplorerRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
		rootElement: "<portlet:namespace />dataStructureExplorerRoot",
		portletId: "<%=WebPortletKey.SXDataStructureExplorerPortlet%>",
		portletParams: {
			namespace: '<portlet:namespace/>',
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
			workbenchNamespace: '<%=workbenchNamespace %>',
			workbenchPortletId: '<%= workbenchId %>',
		}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>