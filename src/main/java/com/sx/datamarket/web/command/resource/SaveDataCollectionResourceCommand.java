package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.ParameterType;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.ParameterLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
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
	    		"javax.portlet.name=" + WebPortletKey.SXDataCollectionEditorPortlet,
	    		"mvc.command.name="+MVCCommand.RESOURCE_SAVE_DATACOLLECTION
	    },
	    service = MVCResourceCommand.class
)
public class SaveDataCollectionResourceCommand extends BaseMVCResourceCommand {
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	


	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		System.out.println("SaveDataCollectionResourceCommand");
		
		// Save data structure
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		String dataCollectionCode = ParamUtil.getString(resourceRequest, "dataCollectionCode", "");
		String dataCollectionVersion = ParamUtil.getString(resourceRequest, "dataCollectionVersion", "");
		String strDisplayName = ParamUtil.getString(resourceRequest, "displayName", "{}");
		String strDescription = ParamUtil.getString(resourceRequest, "description", "{}");
		String associatedDataSets = ParamUtil.getString(resourceRequest, "associatedDataSetList");
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataCollectionCode: " + dataCollectionCode);
		System.out.println("dataCollectionVersion: " + dataCollectionVersion);
		System.out.println("strDisplayName: " + strDisplayName);
		System.out.println("strDescription: " + strDescription);
		System.out.println("strAssociatedDataSets: " + associatedDataSets);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		ServiceContext dataCollectionSC = ServiceContextFactory.getInstance(DataCollection.class.getName(), resourceRequest);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		DataCollection dataCollection = null;
		String error = "";
		if( dataCollectionId == 0 ) {
			boolean duplicated = _dataCollectionLocalService.checkDuplicated(dataCollectionCode, dataCollectionVersion);
			
			if( duplicated ) {
				error = "duplidated";
			} else {
				dataCollection = _dataCollectionLocalService.addDataCollection(
						dataCollectionCode, 
						dataCollectionVersion, 
						SXLocalizationUtil.jsonToLocalizedMap(strDisplayName), 
						SXLocalizationUtil.jsonToLocalizedMap(strDescription), 
						WorkflowConstants.STATUS_APPROVED, 
						dataCollectionSC);
				
				dataCollectionId = dataCollection.getDataCollectionId();
			}
		}
		else {
			dataCollection = _dataCollectionLocalService.updateDataCollection(
					dataCollectionId, 
					dataCollectionCode, 
					dataCollectionVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(strDisplayName), 
					SXLocalizationUtil.jsonToLocalizedMap(strDescription), 
					WorkflowConstants.STATUS_APPROVED, 
					dataCollectionSC);
		}
		
		if( error.isEmpty() ) {
			long groupId = dataCollectionSC.getScopeGroupId();
			
			String[] strAryAssociatedDataSets = associatedDataSets.isEmpty() ? new String[0] : associatedDataSets.split(",");
			List<Long> longAryAssoicatedDataSets = new ArrayList<Long>();
			System.out.println("strAryAssociatedDataSets: " + strAryAssociatedDataSets.length);
			
			for( int i=0; i< strAryAssociatedDataSets.length; i++) {
				longAryAssoicatedDataSets.add(Long.parseLong(strAryAssociatedDataSets[i]));
			}
			
			JSONObject jsonDataCollection = dataCollection.toJSON(themeDisplay.getLocale());
			
			//Delete CollectionSetLink un-selected
			List<CollectionSetLink> collectionSetLinkList = 
					_collectionSetLinkLocalService.getCollectionSetLinkListByCollection(groupId, dataCollectionId);
			
			System.out.println("Linked Data Sets: " + collectionSetLinkList.toString());
			Iterator<CollectionSetLink> iter = collectionSetLinkList.iterator();
			while( iter.hasNext()) {
				CollectionSetLink collectionSetLink = iter.next();
				
				boolean selected = false;
				for( long dataSetId : longAryAssoicatedDataSets) {
					System.out.println("dataSetId: " + dataSetId);
					System.out.println("collectionSetLink.dataSetId: " + collectionSetLink.getDataSetId());
					if( dataSetId == collectionSetLink.getDataSetId() ) {
						selected = true;
						break;
					}
				}
				
				if( !selected ) {
					System.out.println("Collection Set Link deleted: " + collectionSetLink.getPrimaryKey());
					_collectionSetLinkLocalService.deleteCollectionSetLink(collectionSetLink.getPrimaryKey());
				}
			}
			
			//Add CollectionSetLink if it is new or update it if it exists.
			JSONArray jsonAssociatedDataSets = JSONFactoryUtil.createJSONArray();
			
			ServiceContext collectionSetLinkSC = 
					ServiceContextFactory.getInstance(CollectionSetLink.class.getName(), resourceRequest);
			
			if(longAryAssoicatedDataSets.size() > 0) {
				for( int order=0; order<longAryAssoicatedDataSets.size(); order++) {
					long dataSetId = longAryAssoicatedDataSets.get(order); 
					
					System.out.println("collectionSetLink: " + dataCollectionId + ", "+dataSetId);
					
					CollectionSetLink collectionSetLink = 
							_collectionSetLinkLocalService.getCollectionSetLink(
									themeDisplay.getScopeGroupId(), dataCollectionId, dataSetId);
					
					if( Validator.isNotNull(collectionSetLink)) {
						collectionSetLink.setDataCollectionId(dataCollectionId);
						collectionSetLink.setDataSetId(dataSetId);
						collectionSetLink.setOrder(order);;
						
						_collectionSetLinkLocalService.updateCollectionSetLink(
								collectionSetLink);
					}
					else {
						collectionSetLink = 
								_collectionSetLinkLocalService.addCollectionSetLink(
										dataCollectionId, dataSetId, order, collectionSetLinkSC);
					}
					
					DataSet dataSet = _dataSetLocalService.getDataSet(dataSetId);
					JSONObject jsonDataSet = dataSet.toJSON(themeDisplay.getLocale());
					jsonDataSet.put("linkId",  collectionSetLink.getCollectionSetLinkId());
					
					jsonAssociatedDataSets.put(jsonDataSet);
				}
			}
	
			result.put("dataCollection", jsonDataCollection);
			result.put("associatedDataSets", jsonAssociatedDataSets);
		} else {
			result.put("error", error);
		}

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush();
		pw.close();
	}
}
