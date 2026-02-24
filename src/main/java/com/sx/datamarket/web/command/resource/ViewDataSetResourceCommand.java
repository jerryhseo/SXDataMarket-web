package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.service.ActionHistoryLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.util.Iterator;
import java.util.List;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataSetViewerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_VIEW_DATASET
	    },
	    service = MVCResourceCommand.class
)
public class ViewDataSetResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("ViewDataSetResourceCommand: " );
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		
		System.out.println("[ViewDataSetResourceCommand] dataCollectionId: " + dataCollectionId);
		System.out.println("[ViewDataSetResourceCommand] dataSetId: " + dataSetId);
		
		if( dataSetId == 0 ) {
			result.put("error", SXUtil.translate(resourceRequest, "dataset-id-should-be-specified"));
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		if( dataCollectionId > 0 && dataSetId > 0) {
			DataSet dataSet = _dataSetLocalService.getDataSet(dataSetId);
			result = dataSet.toJSON(themeDisplay.getLocale());
			
			// Construct information of linked DataSets
			List<SetTypeLink> setTypeLinkList =  
					_setTypeLinkLocalService.getSetTypeLinkListByCollectionSet(
							dataSet.getGroupId(), dataCollectionId, dataSetId);
			
			JSONArray dataTypeArray = JSONFactoryUtil.createJSONArray();
			Iterator<SetTypeLink> listIter = setTypeLinkList.iterator();
			while( listIter.hasNext()) {
				SetTypeLink link = listIter.next();
				DataType dataType = _dataTypeLocalService.getDataType(link.getDataTypeId());
				
				dataTypeArray.put( dataType.toJSON(themeDisplay.getLocale()));
			}
			
			if(dataTypeArray.length() > 0) {
				result.put("dataTypeList", dataTypeArray);
			}
			
			// Construct Comments 
			
			// Construct Histories
			
			// Construct Structured Data Statistics
			
			System.out.println("ViewDataSet result: " + result.toString(4));
		}

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataCommentLocalService _dataCommentLocalService;
	
	@Reference
	private ActionHistoryLocalService _actionHistoryLocalService;
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
}
