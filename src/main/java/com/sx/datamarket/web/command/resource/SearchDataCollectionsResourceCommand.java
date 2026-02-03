package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.model.ResourceAction;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.service.ResourceActionLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.Constant;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.IcecapModelNames;
import com.sx.icecap.constant.MVCCommand;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.security.permission.resource.datatype.DataTypeModelPermissionHelper;
import com.sx.icecap.security.permission.resource.datatype.DataTypeResourcePermissionHelper;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataCollectionExplorerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SEARCH_DATACOLLECTIONS
	    },
	    service = MVCResourceCommand.class
)
public class SearchDataCollectionsResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("SearchDataCollectionsResourceCommand");
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);

		long dataCollectionId = ParamUtil.getLong(resourceRequest,  "dataCollectionId", 0);
		//long dataSetId = ParamUtil.getLong(resourceRequest,  "dataSetId", 0);
		//long dataTypeId = ParamUtil.getLong(resourceRequest,  "dataTypeId", 0);
		
		int start = ParamUtil.getInteger(resourceRequest, StationXWebKeys.START, StationXConstants.DEFAULT_START);
		int delta = ParamUtil.getInteger(resourceRequest, StationXWebKeys.DELTA, StationXConstants.DEFAULT_DELTA);
		int end = start + delta - 1;
		long groupId = ParamUtil.getLong(resourceRequest, StationXWebKeys.GROUP_ID, themeDisplay.getScopeGroupId());
		long userId = ParamUtil.getLong(resourceRequest, StationXWebKeys.USER_ID, themeDisplay.getUserId());
		
		int status = ParamUtil.getInteger(resourceRequest, StationXWebKeys.STATUS, WorkflowConstants.STATUS_ANY);
		String filterBy = ParamUtil.getString(resourceRequest, "filterBy", "groupId");
		String groupBy = ParamUtil.getString(resourceRequest, "groupBy", "groupId");
		String keywords = ParamUtil.getString(resourceRequest, StationXWebKeys.KEYWORDS, "");

		/*
		System.out.println("groupId: " + groupId);
		System.out.println("dataCollectionId: " + dataCollectionId);
		*/
		
		JSONArray result = JSONFactoryUtil.createJSONArray();
		List<DataCollection> dataCollectionList = null;
		//List<DataType> dataTypeList = null;
		//if( dataTypeId > 0) {
			dataCollectionList = _dataCollectionLocalService.getDataCollectionListByGroupId(groupId);
			
			Iterator<DataCollection> collectionIter = dataCollectionList.iterator();
			while( collectionIter.hasNext()) {
				DataCollection collection = collectionIter.next();
				JSONObject jsonCollection = collection.toJSON(themeDisplay.getLocale());
				
				jsonCollection.put(
						"dataSets", 
						_getDataSetJSONArray(
								groupId, 
								collection.getDataCollectionId(), 
								themeDisplay.getLocale())
				);
				
				result.put(jsonCollection);
			}
		//}

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	private JSONArray _getDataSetJSONArray( long groupId, long collectionId, Locale locale )
			throws PortalException {
		JSONArray jsonSetArray = JSONFactoryUtil.createJSONArray();
		
		List<CollectionSetLink> setLinkList = 
				_collectionSetLinkLocalService.getCollectionSetLinkListByCollection(
						groupId, collectionId);
		
		if( setLinkList.size() > 0 ) {
			Iterator<CollectionSetLink> collectionSetLinkIter = setLinkList.iterator();
			while( collectionSetLinkIter.hasNext()) {
				CollectionSetLink collectionSetLink = collectionSetLinkIter.next();
				
				DataSet dataSet = _dataSetLocalService.getDataSet(collectionSetLink.getDataSetId());
				JSONObject jsonSet = dataSet.toJSON(locale);
				jsonSet.put("linkId", collectionSetLink.getCollectionSetLinkId());
				//System.out.println("jsonSet: " + jsonSet.toString(4));
				jsonSet.put("dataTypes",  _getDataTypeJSONArray(groupId, collectionId, dataSet.getDataSetId(), locale) );
				
				jsonSetArray.put(jsonSet);
			}
		}
		
		//System.out.println("jsonSetArray: " + jsonSetArray.toString(4));
		
		return jsonSetArray;
	}
	
	private JSONArray _getDataTypeJSONArray( long groupId, long collectionId, long setId, Locale locale )
			throws PortalException{
		JSONArray jsonTypeArray = JSONFactoryUtil.createJSONArray();
		
		List<SetTypeLink> setTypeLinkList = _setTypeLinkLocalService.getSetTypeLinkListByCollectionSet(groupId, collectionId, setId);
		Iterator<SetTypeLink> setTypeLinkIter = setTypeLinkList.iterator();
		while( setTypeLinkIter.hasNext()) {
			SetTypeLink setTypeLink = setTypeLinkIter.next();
			
			DataType dataType = _dataTypeLocalService.getDataType(setTypeLink.getDataTypeId());
			JSONObject jsonDataType = dataType.toJSON(locale);
			jsonDataType.put("linkId", setTypeLink.getSetTypeLinkId());
			
			jsonTypeArray.put(jsonDataType);
		}
		
		//System.out.println("jsonTypeArray: " + jsonTypeArray.toString(4));
		
		return jsonTypeArray;
	}
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
}
