<%@page import="com.liferay.portal.kernel.portlet.LiferayWindowState"%>
<%@page import="com.liferay.portal.kernel.portlet.bridges.mvc.MVCCommand"%>
<%@page import="com.liferay.portal.kernel.util.PortalUtil"%>
<%@page import="com.liferay.portal.kernel.portlet.PortletIdCodec"%>
<%@page import="com.sx.icecap.constant.WebPortletKey"%>
<%@page import="com.sx.constant.StationXWebKeys"%>
<%@page import="com.liferay.portal.kernel.util.ParamUtil"%>
<%@ include file="./init.jsp" %>


<%
	String workingPortletName = ParamUtil.getString(
						renderRequest, 
						StationXWebKeys.WORKING_PORTLET_NAME, 
						WebPortletKey.SXDataTypeExplorerPortlet);
	String workingPortletId = PortletIdCodec.encode(workingPortletName);
	String workingPortletNamespace = "_" + workingPortletId + "_";
	
	String workingPortletParams = ParamUtil.getString(renderRequest, StationXWebKeys.WORKING_PORTLET_PARAMS, "{}");
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("workingPortletId: " + workingPortletId );
	System.out.println("workingPortletNamespace: " + workingPortletNamespace );
	System.out.println("workbenchId: " + portletDisplay.getId() );
	
	System.out.println("workingPortletParams: " + workingPortletParams );
%>


<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<liferay-portlet:renderURL portletName="<%=workingPortletName%>" var="workingPortletURL"  windowState="<%=LiferayWindowState.EXCLUSIVE.toString()%>">
</liferay-portlet:renderURL>

<div id="<portlet:namespace />workbenchRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
			rootElement: '<portlet:namespace />workbenchRoot',
			portletId: '<%=WebPortletKey.SXDataWorkbenchPortlet%>',
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
				redirectURLs: {
					backURL: '<%= currentURL %>',
				},
				workbench:{
					url: '<%= baseRenderURL%>',
					namespace: '<portlet:namespace/>',
					portletId: '<%= portletDisplay.getId() %>',
				},
				workingPortlet:{
					portletId: '<%= workingPortletId %>',
					portletName: '<%= workingPortletName %>',
					namespace: '<%= workingPortletNamespace %>',
					url: '<%= workingPortletURL %>',
					params: JSON.parse('<%= workingPortletParams %>')
				},
				params: { // initial parameters
				}
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>
