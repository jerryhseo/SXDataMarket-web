package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
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
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		long dataStructureId = ParamUtil.getLong(resourceRequest, "dataStructureId", 0);
		
		System.out.println("LoadDataStructureResourceCommand: dataStructureId: " );
		System.out.println("dataTypeId:  " + dataTypeId );
		System.out.println("dataStructureId:  " + dataStructureId );
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		DataType dataType = null;
		JSONObject dataTypeStructure = null;
		DataStructure dataStructure = null;
		
		if( dataTypeId > 0 ) {
			dataType = _dataTypeLocalService.getDataType(dataTypeId);
			
			if( Validator.isNull(dataType) ) {
				result.put( "error", SXUtil.translate(resourceRequest, "cannot-find-datatype", dataTypeId) );
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			result.put("dataType", dataType.toJSON(resourceRequest.getLocale()));
			
			dataTypeStructure = _dataTypeLocalService.getDataStructureJSON(dataTypeId);
			if( Validator.isNotNull(dataTypeStructure) ) {
				result.put("dataStructure", dataTypeStructure);
			}
			
		} else if( dataStructureId > 0) {
			dataStructure = _dataStructureLocalService.getDataStructure(dataStructureId);
			if( Validator.isNull(dataStructure) ) {
				result.put( "error", SXUtil.translate(resourceRequest, "cannot-find-datastructure", dataStructureId) );
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			result.put("dataStructure", dataStructure.toJSON());
		} 
		else {
			result.put("error", "datastructure-is-not-specified-to-load");
		}
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private UserLocalService _userLocalService;
}
