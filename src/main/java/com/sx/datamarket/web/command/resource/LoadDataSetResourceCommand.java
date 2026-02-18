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
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATASET
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataSetResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		//System.out.println("LoadDataSetResourceCommand: " + dataCollectionId + ", "+dataSetId );
		
		boolean loadAvailableDataTypes = ParamUtil.getBoolean(resourceRequest, "loadAvailableDataTypes", false);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		if( dataSetId > 0 ) {
			result = _dataSetLocalService.getDataSetInfo(
					themeDisplay.getScopeGroupId(), 
					dataCollectionId, 
					dataSetId, 
					themeDisplay.getLocale());
		}
			
		if(loadAvailableDataTypes == true) {
			List<DataType> availableDataTypeList = 
					_dataTypeLocalService.getDataTypesByGroupId(themeDisplay.getScopeGroupId());
			JSONArray availableDataTypeJSONArray = JSONFactoryUtil.createJSONArray();
			
			Iterator<DataType> iter = availableDataTypeList.iterator();
			while(iter.hasNext()) {
				DataType dataType = iter.next();
				
				JSONObject jsonDataType = JSONFactoryUtil.createJSONObject();
				
				jsonDataType.put("dataTypeId", dataType.getDataTypeId());
				jsonDataType.put("dataTypeCode", dataType.getDataTypeCode());
				jsonDataType.put("dataTypeVersion", dataType.getDataTypeVersion());
				jsonDataType.put("displayName", dataType.getDisplayName(themeDisplay.getLocale()));
				
				availableDataTypeJSONArray.put(jsonDataType);
			}
			
			result.put("availableDataTypeList", availableDataTypeJSONArray);
		}
		
		System.out.println("LoadDataSet result: " + result.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private  DataCommentLocalService _dataCommentLocalService;
	
}
