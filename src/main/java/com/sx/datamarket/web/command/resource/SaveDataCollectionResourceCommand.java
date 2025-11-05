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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.ParameterLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
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
	    		"javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
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
		String strDataSets = ParamUtil.getString(resourceRequest, "associatedDataSetList");
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataCollectionCode: " + dataCollectionCode);
		System.out.println("dataCollectionVersion: " + dataCollectionVersion);
		System.out.println("strDisplayName: " + strDisplayName);
		System.out.println("strDescription: " + strDescription);
		System.out.println("strDataSets: " + strDataSets);
		
		String[] strAryAssociatedDataSets = strDataSets.split(",");
		long[] assoicatedDataSets = Arrays.stream(strAryAssociatedDataSets).mapToLong(Long::parseLong).toArray();
		
		ServiceContext dataCollectionSC = ServiceContextFactory.getInstance(DataCollection.class.getName(), resourceRequest);
		
		if( dataCollectionId == 0 ) {
			DataCollection dataCollection = _dataCollectionLocalService.addDataCollection(
					dataCollectionCode, 
					dataCollectionVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(strDisplayName), 
					SXLocalizationUtil.jsonToLocalizedMap(strDescription), 
					WorkflowConstants.STATUS_APPROVED, 
					dataCollectionSC);
			
			dataCollectionId = dataCollection.getDataCollectionId();
		}
		else {
			_dataCollectionLocalService.updateDataCollection(
					dataCollectionId, 
					dataCollectionCode, 
					dataCollectionVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(strDisplayName), 
					SXLocalizationUtil.jsonToLocalizedMap(strDescription), 
					WorkflowConstants.STATUS_APPROVED, 
					dataCollectionSC);
		}
		
		//Delete CollectionSetLink un-selected
		List<CollectionSetLink> collectionSetLinkList = 
				_collectionSetLinkLocalService.getCollectionSetLinkListByCollection(dataCollectionId);
		
		Iterator<CollectionSetLink> iter = collectionSetLinkList.iterator();
		while( iter.hasNext()) {
			CollectionSetLink collectionSetLink = iter.next();
			
			boolean selected = Arrays.asList(collectionSetLinkList).contains(collectionSetLink.getDataSetId());
			
			if( !selected ) {
				_collectionSetLinkLocalService.deleteCollectionSetLink(collectionSetLink.getPrimaryKey());
			}
		}
		
		//Add CollectionSetLink if it is new or update it if it exists.
		if(assoicatedDataSets.length > 0) {
			for( int order=0; order<assoicatedDataSets.length; order++) {
				long dataSetId = assoicatedDataSets[order];
				
				System.out.println("collectionSetLink: " + dataCollectionId + ", "+dataSetId);
				
				CollectionSetLink collectionSetLink = 
						_collectionSetLinkLocalService.getCollectionSetLink(dataCollectionId, dataSetId);
				
				if( Validator.isNotNull(collectionSetLink)) {
					collectionSetLink.setDataCollectionId(dataCollectionId);
					collectionSetLink.setDataSetId(dataSetId);
					collectionSetLink.setOrder(order);;
					
					_collectionSetLinkLocalService.updateCollectionSetLink(
							collectionSetLink);
				}
				else {
					collectionSetLink = 
							_collectionSetLinkLocalService.addCollectionSetLink(dataCollectionId, dataSetId, order);
				}
			}
		}
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		result.put("dataCollectionId", dataCollectionId);

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush();
		pw.close();
	}
}
