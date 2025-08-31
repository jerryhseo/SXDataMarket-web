package com.sx.datamarket.web.command.resource.datatype.editor;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.DuplicatedDataTypeNameException;
import com.sx.icecap.exception.InvalidDataTypeCodeException;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.portlet.PortletException;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SAVE_TYPE_STRUCTURE_LINK
	    },
	    service = MVCResourceCommand.class
)
public class SaveTypeStructureLinkResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("SaveTypeStructureLinkResourceCommand");
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, DataTypeProperties.DATATYPE_ID, 0);
		long dataStructureId = ParamUtil.getLong(resourceRequest, "dataStructureId", 0);
		
		if( !(dataTypeId > 0 && dataStructureId > 0) ) {
			throw new PortletException("dataTypeId or dataStructureId is wrong: " + dataTypeId + ", "+dataStructureId);
		}
		
		boolean commentable = ParamUtil.getBoolean(resourceRequest, "commentable", false);
		boolean verifiable = ParamUtil.getBoolean(resourceRequest, "verifiable", false);
		boolean freezable = ParamUtil.getBoolean(resourceRequest, "freezable", false);
		boolean verified = ParamUtil.getBoolean(resourceRequest, "verified", false);
		boolean freezed = ParamUtil.getBoolean(resourceRequest, "freezed", false);
		boolean inputStatus = ParamUtil.getBoolean(resourceRequest, "inputStatus", false);
		boolean jumpTo = ParamUtil.getBoolean(resourceRequest, "jumpTo", false);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		ServiceContext sc = ServiceContextFactory.getInstance(TypeStructureLink.class.getName(), resourceRequest);

		TypeStructureLink link = null;
		if( dataTypeId > 0) {
			link = _typeStructureLinkLocalService.getTypeStructureLink(dataTypeId);
			
			_typeStructureLinkLocalService.updateTypeDataStructureLink(
					dataTypeId, 
					dataStructureId, 
					commentable, 
					verifiable, 
					freezable, 
					verified, 
					freezed,
					inputStatus,
					jumpTo,
					sc);
		}
		else {
			link = _typeStructureLinkLocalService.addTypeDataStructureLink(
					dataTypeId, 
					dataStructureId, 
					commentable, 
					verifiable, 
					freezable, 
					verified, 
					freezed, 
					inputStatus, 
					jumpTo, 
					sc);
		}
		
		result.put("dataTypeId", dataTypeId);
		result.put("dataStructureId", dataStructureId);
			
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		
		pw.flush();
		pw.close();
	}
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;
}
