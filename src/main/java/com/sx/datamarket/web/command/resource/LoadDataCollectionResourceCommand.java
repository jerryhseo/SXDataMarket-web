package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataSetLocalService;
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
	    		"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataCollectionEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATACOLLECTION
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataCollectionResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadDataCollectionResourceCommand: " );
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		boolean loadAvailableDataSets = ParamUtil.getBoolean(resourceRequest, "loadAvailableDataSets", false);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		long groupId = ParamUtil.getLong(resourceRequest, "groupId", themeDisplay.getScopeGroupId());
		
		List<CollectionSetLink> collectionSetLinkList = null;
		if( dataCollectionId > 0 ) {
			DataCollection dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
			
			if( Validator.isNull(dataCollection) ) {
				result.put("error", "cannot-find-datacollection");
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			result.put("dataCollection", dataCollection.toJSON());
			
			collectionSetLinkList = 
					_collectionSetLinkLocalService.getCollectionSetLinkListByCollection(groupId, dataCollectionId);
			
			if( Validator.isNotNull(collectionSetLinkList)) {
				JSONArray jsonDataSetList = JSONFactoryUtil.createJSONArray();
				
				Iterator<CollectionSetLink> iter = collectionSetLinkList.iterator();
				while(iter.hasNext()) {
					CollectionSetLink link = iter.next();
					System.out.println("order: " + link.getOrder());
					
					DataSet dataSet = _dataSetLocalService.getDataSet(link.getDataSetId());
					
					JSONObject jsonDataSet = dataSet.toJSON(themeDisplay.getLocale());
					
					jsonDataSet.put("collectionSeLinktId", link.getCollectionSetLinkId());
					jsonDataSet.put("order", link.getOrder());
					jsonDataSet.put("verified", link.getVerified());
					jsonDataSet.put("verifiedUserId", link.getVerifiedUserId());
					jsonDataSet.put("verifiedUserName", link.getVerifiedUserName());
					jsonDataSet.put("verifiedDate", link.getVerifiedDate());
					jsonDataSet.put("freezed", link.getVerified());
					jsonDataSet.put("freezedUserId", link.getVerifiedUserId());
					jsonDataSet.put("freezedUserName", link.getVerifiedUserName());
					jsonDataSet.put("freezedDate", link.getVerifiedDate());
					
					/*
					int commentCount = 
							_dataCommentLocalService.countDataComments(groupId, DataSet.class.getName(), dataSet.getDataSetId());
					jsonDataSet.put("commentCount", commentCount);
					*/
					
					jsonDataSetList.put(jsonDataSet);
				}
				
				result.put("associatedDataSetList", jsonDataSetList);
			}
		}

		if(loadAvailableDataSets == true) {
			List<DataSet> availableDataSetList = _dataSetLocalService.getDataSetsByGroupId(themeDisplay.getScopeGroupId());
			JSONArray availableDataSetJSONArray = JSONFactoryUtil.createJSONArray();
			
			Iterator<DataSet> iter = availableDataSetList.iterator();
			while(iter.hasNext()) {
				DataSet dataSet = iter.next();
				
				JSONObject jsonDataSet = JSONFactoryUtil.createJSONObject();
				
				jsonDataSet.put("dataSetId", dataSet.getDataSetId());
				jsonDataSet.put("dataSetCode", dataSet.getDataSetCode());
				jsonDataSet.put("dataSetVersion", dataSet.getDataSetVersion());
				jsonDataSet.put("displayName", dataSet.getDisplayName(themeDisplay.getLocale()));
				
				availableDataSetJSONArray.put(jsonDataSet);
			}
			
			result.put("availableDataSetList", availableDataSetJSONArray);
		}
		
		System.out.println("LoadDataCollection result: " + result.toString(4));
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private DataCommentLocalService _dataCommentLocalService;
	
}
