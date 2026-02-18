package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.util.portlet.SXPortletURLUtil;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeExplorerPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_DELETE_DATATYPES
	    },
	    service = MVCResourceCommand.class
)
public class DeleteDataTypesResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DeleteDataTypesResourceCommand");
		String strDataTypeIds = ParamUtil.getString(resourceRequest, "dataTypeIds", "[]");
		System.out.println("strDataTypeIds: " + strDataTypeIds);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		if( strDataTypeIds.isEmpty() ) {
			result.put("error", LanguageUtil.get(resourceRequest.getLocale(), "datatypes-should-be-specified"));
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		JSONArray errorObjects = JSONFactoryUtil.createJSONArray();
		
		String[] strDataTypeArray = strDataTypeIds.split(",");
		for(String strDataTypeId : strDataTypeArray) {
			try{ 
				long dataTypeId = Long.parseLong(strDataTypeId);
				
				_dataTypeLocalService.removeDataType(dataTypeId);
			} catch ( NumberFormatException e ) {
				errorObjects.put( strDataTypeId );
			}
		}
		
		if( errorObjects.length() > 0 ) {
			result.put("error", LanguageUtil.get(resourceRequest.getLocale(), "cannot-delete-some-of-datatypes"));
			result.put("errorObjects", errorObjects);
		}
		
		result.put("dataTypeList", strDataTypeIds);
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
}
