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
import java.util.HashMap;
import java.util.Iterator;
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

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		System.out.println("SaveDataCollectionResourceCommand");
		
		// Save data structure
		String cmd = ParamUtil.getString(resourceRequest, "cmd", "add");
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		String strDataCollection = ParamUtil.getString(resourceRequest, "dataCollection", "{}");
		JSONObject jsonDataCollection = JSONFactoryUtil.createJSONObject(strDataCollection);
		System.out.println("Data Collection: " + jsonDataCollection.toString(4));
		
		String dataCollectionCode = jsonDataCollection.getString("dataCollectionCode");
		String dataCollectionVersion = jsonDataCollection.getString("dataCollectionVersion");
		JSONObject displayName = jsonDataCollection.getJSONObject("displayName");
		JSONObject description = jsonDataCollection.getJSONObject("description");

		ServiceContext dataCollectionSC = ServiceContextFactory.getInstance(DataCollection.class.getName(), resourceRequest);
		
		if( dataCollectionId == 0 ) {
			DataCollection dataCollection = _dataCollectionLocalService.addDataCollection(
					dataCollectionCode, 
					dataCollectionVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description), 
					WorkflowConstants.STATUS_APPROVED, 
					dataCollectionSC);
			
			dataCollectionId = dataCollection.getDataCollectionId();
		}
		else {
			_dataCollectionLocalService.updateDataCollection(
					dataCollectionId, 
					dataCollectionCode, 
					dataCollectionVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description), 
					WorkflowConstants.STATUS_APPROVED, 
					dataCollectionSC);
		}
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		result.put("dataCollectionId", dataCollectionId);

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
}
