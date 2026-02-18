package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.ActionHistoryLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.portlet.SXPortletURLUtil;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeViewerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_VIEW_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class ViewDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("ViewDataTypeResourceCommand: " );
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);
		
		DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
		
		if( Validator.isNotNull(dataType) ) {
			result = dataType.toJSON(resourceRequest.getLocale());
			result.put("hasStructure", _dataTypeLocalService.hasDataStructure(dataTypeId));
			
			// Construct Comments 
			
			// Construct Histories
			
			// Construct Structured Data Statistics
		}
		else {
			result.put("error", LanguageUtil.format(resourceRequest.getLocale(), "cannot-find-datatype", new Object[] {dataTypeId}, false));
		}

		System.out.println("ViewDataType result: " + result.toString(4));

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private DataCommentLocalService _dataCommentLocalService;
	
	@Reference
	private ActionHistoryLocalService _actionHistoryLocalService;
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
}
