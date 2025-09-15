package com.sx.datamarket.web.command.resource.datastructure;

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
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATASTRUCTURE
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataStructureResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, WebKey.DATATYPE_ID, 0);
		long dataStructureId = ParamUtil.getLong(resourceRequest, "dataStructureId", 0);
		
		System.out.println("LoadDataStructureResourceCommand:  " + dataTypeId + ", dataStructureId: " + dataStructureId );
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		TypeStructureLink typeStructureLink = null;
		try{
			typeStructureLink = _typeStructureLocalService.getTypeStructureLink(dataTypeId);
			dataStructureId = typeStructureLink.getDataStructureId();
			result.put("typeStructureLink", typeStructureLink.toJSON());
		} catch( PortalException e) {
			System.out.println("No TypeStructureLink while loading data structure");
		}
		
		if( dataTypeId > 0 ) {
			DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
			result.put("dataType", dataType.toJSON( ));
		}
		
		if( dataStructureId > 0) {
			DataStructure dataStructure = _dataStructureLocalService.getDataStructure(dataStructureId);
			result.put("dataStructure", dataStructure.toJSON());
		}
		
		//System.out.println("Result: " + result.toString(4));
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLocalService;
	
	@Reference
	private UserLocalService _userLocalService;
}
