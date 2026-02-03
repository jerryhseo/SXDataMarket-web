package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.util.Arrays;
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
	    		"javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
	    		"mvc.command.name="+MVCCommand.RESOURCE_SAVE_DATASET
	    },
	    service = MVCResourceCommand.class
)
public class SaveDataSetResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		System.out.println("SaveDataSetResourceCommand");
		
		// Save DataSet
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		
		String dataSetCode = ParamUtil.getString(resourceRequest, "dataSetCode", "");
		String dataSetVersion = ParamUtil.getString(resourceRequest, "dataSetVersion", "");
		String displayName = ParamUtil.getString(resourceRequest, "displayName", "{}");
		String description = ParamUtil.getString(resourceRequest, "description", "{}");
		String associatedDataTypes = ParamUtil.getString(resourceRequest, "associatedDataTypes", "");
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetCode: " + dataSetCode);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataSetVersion: " + dataSetVersion);
		System.out.println("displayName: " + displayName);
		System.out.println("description: " + description);
		System.out.println("associatedDataTypes: " + associatedDataTypes);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		ServiceContext dataSetSC = ServiceContextFactory.getInstance(DataSet.class.getName(), resourceRequest);
		
		if( dataSetId == 0 && _dataSetLocalService.checkDuplicated( dataSetCode, dataSetVersion ) ) {
			result.put("error", "dataset-is-duplicated");
			
			SXPortletURLUtil.responeAjax( resourceResponse, result);
			
			return;
		} 
		
		DataSet dataSet = null;
		if( dataSetId > 0 ) {
			dataSet = _dataSetLocalService.updateDataSet(
					dataSetId,
					dataSetCode, 
					dataSetVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description), 
					WorkflowConstants.STATUS_APPROVED, 
					dataSetSC);
		} 
		else {
			dataSet = _dataSetLocalService.addDataSet (
					dataSetCode, 
					dataSetVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description), 
					WorkflowConstants.STATUS_APPROVED, 
					dataSetSC
			);
			
			dataSetId = dataSet.getDataSetId();
		}
		
		long groupId = dataSetSC.getScopeGroupId();
		
		CollectionSetLink collectionSetLink = null;
				_collectionSetLinkLocalService.getCollectionSetLink(groupId, dataCollectionId, dataSetId);
		if( dataCollectionId > 0 ) {
			collectionSetLink = 
					_collectionSetLinkLocalService.getCollectionSetLink(groupId, dataCollectionId, dataSetId);
			
			if( Validator.isNull(collectionSetLink) ) {
				System.out.println("Create Collection-Set link: " + dataCollectionId);
				
				int linkCount = _collectionSetLinkLocalService.countCollectionSetLinkListByCollection(groupId, dataCollectionId);
				
				ServiceContext collectionSetLinkSC = 
						ServiceContextFactory.getInstance(CollectionSetLink.class.getName(), resourceRequest);
				collectionSetLink = _collectionSetLinkLocalService.addCollectionSetLink(
						dataCollectionId, 
						dataSetId,
						linkCount,
						collectionSetLinkSC);
				}
		}
		
		String[] strAryAssociatedDataTypes = 
				associatedDataTypes.isEmpty() ? new String[0] : associatedDataTypes.split(",");
		System.out.println("strAryAssociatedDataTypes: " + strAryAssociatedDataTypes.length);
		
		//Delete SetTypeLink un-selected
		List<SetTypeLink> setTypeLinkList = 
				_setTypeLinkLocalService.getSetTypeLinkListByCollectionSet(groupId, dataCollectionId, dataSetId);
		
		Iterator<SetTypeLink> iter = setTypeLinkList.iterator();
		while( iter.hasNext()) {
			SetTypeLink setTypeLink = iter.next();
			
			boolean selected = Arrays.stream(strAryAssociatedDataTypes).anyMatch(
					n-> {
						System.out.print(n + ", " + setTypeLink.getDataTypeId());
						return Long.parseLong(n) == setTypeLink.getDataTypeId();
					}
			);
			
			System.out.println("selected: " + selected);
			
			if( !selected ) {
				_setTypeLinkLocalService.deleteSetTypeLink(setTypeLink.getPrimaryKey());
			}
		}
		
		//Add SetTypeLink if it is new or update it if it exists.
		ServiceContext setTypeLinkSC = 
				ServiceContextFactory.getInstance(SetTypeLink.class.getName(), resourceRequest);
		
		for(int order = 0; order < strAryAssociatedDataTypes.length; order++) {
			long dataTypeId = Long.parseLong(strAryAssociatedDataTypes[order]);
			
			SetTypeLink setTypeLink = 
					_setTypeLinkLocalService.getSetTypeLink(groupId, dataCollectionId, dataSetId, dataTypeId);
			if( Validator.isNull(setTypeLink)) {
				/*
				System.out.println("Save DataSet dataSetId: " + dataSetId);
				System.out.println("Save DataSet dataTypeId: " + dataTypeId);
				System.out.println("Save DataSet Osrder: " + order);
				*/
				_setTypeLinkLocalService.addSetTypeLink(dataCollectionId, dataSetId, dataTypeId, order, setTypeLinkSC);
			} 
			/* else {
				System.out.println("Save DataSet Link found dataSetId: " + setTypeLink.getDataSetId());
				System.out.println("Save DataSet Link found dataTypeId: " + setTypeLink.getDataTypeId());
				System.out.println("Save DataSet Link found order: " + setTypeLink.getOrder());
			} */
		}
		
		
		result.put("dataSet", dataSet.toJSON(dataSetSC.getLocale()));

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
}
