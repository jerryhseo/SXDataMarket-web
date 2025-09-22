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
	TypeStructureLink typeStructureLink = (TypeStructureLink)GetterUtil.getObject(renderRequest.getAttribute("typeStructureLink"), null);
    String editStatus = ParamUtil.getString(renderRequest, "editStatus", "");
    long dataTypeId = ParamUtil.getLong(renderRequest, "dataTypeId", 0);
    long dataStructureId = ParamUtil.getLong(renderRequest, "dataStructureId", 0);
    long structuredDataId = ParamUtil.getLong(renderRequest, "structuredDataId", 0);
	JSONArray permissions = (JSONArray)GetterUtil.getObject(renderRequest.getAttribute("permissions"), JSONFactoryUtil.createJSONArray());

	String workbenchNamespace = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_NAMESPACE, StringPool.BLANK);
	String workbenchId = ParamUtil.getString(renderRequest, StationXWebKeys.WORKBENCH_ID, StringPool.BLANK);
	
	String portalURL = PortalUtil.getPortalURL(renderRequest);
	
	System.out.println("[SXDataTypeEditor] workbenchNamespace: " + workbenchNamespace);
	System.out.println("[SXDataTypeEditor] portletId: " + portletDisplay.getId());
%>

<portlet:renderURL  var="baseRenderURL">
</portlet:renderURL>

<portlet:actionURL  var="baseActionURL">
</portlet:actionURL>

<portlet:resourceURL  var="baseResourceURL">
</portlet:resourceURL>

<div id="<portlet:namespace />structuredDataEditorRoot"></div>

<script>
	window.SXWorkingPortletInfo = {
			rootElement: "<portlet:namespace />structuredDataEditorRoot",
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
				typeStructureLink: <%= typeStructureLink.toJSON().toString()%>,
				dataStructureId: Number('<%= dataStructureId %>'),
				dataTypeId: Number('<%= dataTypeId %>'),
				structuredDataId: Number('<%= structuredDataId %>'),
				editStatus: '<%= editStatus %>'
			}
	};
	
	SXSystem.loadStartPortletModuleScript("<%= request.getContextPath() %>/lib/start-portlet.js");
</script>