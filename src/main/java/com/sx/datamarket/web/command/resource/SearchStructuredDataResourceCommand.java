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
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.StructuredData;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
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
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataExplorerPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SEARCH_STRUCTURED_DATA
	    },
	    service = MVCResourceCommand.class
)
public class SearchStructuredDataResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, WebKey.DATACOLLECTION_ID, 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, WebKey.DATASET_ID, 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, WebKey.DATATYPE_ID, 0);
		
		int start = ParamUtil.getInteger(resourceRequest, StationXWebKeys.START, StationXConstants.DEFAULT_START);
		int delta = ParamUtil.getInteger(resourceRequest, StationXWebKeys.DELTA, StationXConstants.DEFAULT_DELTA);
		int end = start + delta - 1;
		long groupId = ParamUtil.getLong(resourceRequest, StationXWebKeys.GROUP_ID, themeDisplay.getScopeGroupId());
		long userId = ParamUtil.getLong(resourceRequest, StationXWebKeys.USER_ID, themeDisplay.getUserId());
		
		int status = ParamUtil.getInteger(resourceRequest, StationXWebKeys.STATUS, WorkflowConstants.STATUS_ANY);
		String filterBy = ParamUtil.getString(resourceRequest, "filterBy", "groupId");
		String groupBy = ParamUtil.getString(resourceRequest, "groupBy", "groupId");
		String keywords = ParamUtil.getString(resourceRequest, StationXWebKeys.KEYWORDS, "");
		
		Locale locale = themeDisplay.getLocale();
		
		System.out.println("--- Start SearchStructuredDataResourceCommand:  " );
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);
		
		List<StructuredData> dataList = null;
		
		if( dataCollectionId > 0 && dataSetId > 0 && dataTypeId > 0) { 
			dataList = _structuredDataLocalService.getStructuredDatasByCollectionSetType(groupId, dataCollectionId, dataSetId, dataTypeId, WorkflowConstants.STATUS_ANY);
		} else if( dataCollectionId > 0 && dataSetId > 0) {
			dataList = _structuredDataLocalService.getStructuredDatasByCollectionSet(groupId, dataCollectionId, dataSetId, WorkflowConstants.STATUS_ANY);
		} else if( dataCollectionId > 0 ) {
			dataList = _structuredDataLocalService.getStructuredDatasByDataCollectionId(groupId, dataCollectionId, WorkflowConstants.STATUS_ANY);
		} else if( dataSetId > 0 && dataTypeId > 0 ) {
			dataList = _structuredDataLocalService.getStructuredDatasBySetType(groupId, dataSetId, dataTypeId, WorkflowConstants.STATUS_ANY);
		} else if( dataSetId > 0  ) {
			dataList = _structuredDataLocalService.getStructuredDatasByDataSetId(groupId, dataSetId, WorkflowConstants.STATUS_ANY);
		}  else if( dataTypeId > 0  ) {
			dataList = _structuredDataLocalService.getStructuredDatasByDataTypeId(groupId, dataTypeId, WorkflowConstants.STATUS_ANY);
		} else {
			dataList = _structuredDataLocalService.getStructuredDatasByGroupId(groupId , WorkflowConstants.STATUS_ANY);
		}
		
		JSONArray dataArray = JSONFactoryUtil.createJSONArray();
		
		Iterator<StructuredData> iter = dataList.iterator();
		
		while( iter.hasNext() ) {
			StructuredData data = iter.next();
			DataType dataType = _dataTypeLocalService.getDataType(data.getDataTypeId());
			
			JSONObject jsonData = data.toJSON();
			jsonData.put("dataTypeCode", dataType.getDataTypeCode());
			jsonData.put("dataTypeVersion", dataType.getDataTypeVersion());
			jsonData.put("dataTypeLabel", dataType.getDisplayName(locale));

			DataSet dataSet = _dataSetLocalService.getDataSet(data.getDataSetId());
			
			jsonData.put("dataSetCode", dataSet.getDataSetCode());
			jsonData.put("dataSetVersion", dataSet.getDataSetVersion());
			jsonData.put("dataSetLabel", dataSet.getDisplayName(locale));
			
			dataArray.put(jsonData);
		}
		
		JSONObject jsonList = JSONFactoryUtil.createJSONObject();
		
		jsonList.put("structuredDataList", dataArray);
	
		DataCollection dataCollection = null;
		if( dataCollectionId > 0 ) {
			dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
		}
		if(Validator.isNotNull(dataCollection)) {
			jsonList.put("dataCollection", dataCollection.toJSON(locale));
		}
		
		DataSet dataSet = null;
		if( dataSetId > 0 ) {
			dataSet = _dataSetLocalService.getDataSet(dataSetId);
		}
		if(Validator.isNotNull(dataSet)) {
			jsonList.put("dataSet", dataSet.toJSON(locale));
		}
		
		DataType dataType = null;
		if( dataTypeId > 0 ) {
			dataType = _dataTypeLocalService.getDataType(dataTypeId);
		}
		if(Validator.isNotNull(dataType)) {
			jsonList.put("dataType", dataType.toJSON(locale));
		}
		//System.out.println("Result: " + dataList.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(jsonList.toJSONString());
		pw.flush();
		pw.close();
		
		//System.out.println("--- End SearchStructuredDataResourceCommand" );
	}
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
}
