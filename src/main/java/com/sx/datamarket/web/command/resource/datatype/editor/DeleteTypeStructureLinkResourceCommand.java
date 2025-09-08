package com.sx.datamarket.web.command.resource.datatype.editor;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.TypeStructureLinkLocalService;

import java.io.PrintWriter;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_DELETE_TYPE_STRUCTURE_LINK
	    },
	    service = MVCResourceCommand.class
)
public class DeleteTypeStructureLinkResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DeleteTypeStructureLinkResourceCommand");
		long dataTypeId = ParamUtil.getLong(resourceRequest, WebKey.DATATYPE_ID, 0);
		System.out.println("dataTypeId: " + dataTypeId);
		
		TypeStructureLink link =_typeStructureLinkLocalService.removeTypeStructureLink(dataTypeId);
		
		PrintWriter pw = resourceResponse.getWriter();
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		result.put("dataTypeId", link.getDataTypeId());
		
		pw.write(result.toJSONString());
		
		pw.flush();
		pw.close(); 
	}
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;
}
