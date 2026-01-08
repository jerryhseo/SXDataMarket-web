package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.StructuredData;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_STRUCTURED_DATA
	    },
	    service = MVCResourceCommand.class
)
public class LoadStructuredDataResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		long structuredDataId = ParamUtil.getLong(resourceRequest, WebKey.STRUCTURED_DATA_ID, 0);
		
		System.out.println("--- Start LoadStructuredDataResourceCommand:  " );
		System.out.println("structuredDataId: " + structuredDataId);

		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		StructuredData structuredData = _structuredDataLocalService.getStructuredData(structuredDataId);
		
		result.put("structuredData", structuredData.toJSON());
		
		long dataTypeId = structuredData.getDataTypeId();
		TypeStructureLink typeStructureLink = _typeStructureLocalService.getTypeStructureLink(dataTypeId);
		
		long dataStructureId = typeStructureLink.getDataStructureId();
		DataStructure dataStructure = _dataStructureLocalService.getDataStructure(dataStructureId);
		
		result.put("dataStructure", dataStructure.toJSON());
		
		// Finishing controller
		System.out.println("Result: " + result.toString(4));
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
		
		System.out.println("--- End LoadStructuredDataResourceCommand" );
	}
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLocalService;
	
}
