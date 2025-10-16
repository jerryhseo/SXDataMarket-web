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
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.ParameterLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
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
		String associatedDataTypes = ParamUtil.getString(resourceRequest, "associatedDataTypes", "[]");
		
		System.out.println("dataSetCode: " + dataSetCode);
		System.out.println("dataSetVersion: " + dataSetVersion);
		System.out.println("displayName: " + displayName);
		System.out.println("description: " + description);
		System.out.println("associatedDataTypes: " + associatedDataTypes);
		
		ServiceContext dataSetSC = ServiceContextFactory.getInstance(DataSet.class.getName(), resourceRequest);
		
		DataSet dataSet = null;
		if( dataSetId == 0 ) {
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
		else {
			_dataSetLocalService.updateDataSet(
					dataSetId,
					dataSetCode, 
					dataSetVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description), 
					WorkflowConstants.STATUS_APPROVED, 
					dataSetSC);
		}
		
		JSONArray associated = JSONFactoryUtil.createJSONArray(associatedDataTypes);
		JSONArray linkIds = JSONFactoryUtil.createJSONArray();
		for(int i=0; i<associated.length(); i++) {
			JSONObject link = associated.getJSONObject(i);
			
			long setTypeLinkId = link.getLong("setTypeLinkId", 0);
			long dataTypeId = link.getLong("dataTypeId");
			
			SetTypeLink setTypeLink = null;
			if( setTypeLinkId > 0 ) {
				setTypeLink = _setTypeLinkLocalService.updateSetTypeLink(setTypeLinkId, dataSetId, dataTypeId);
			}
			else {
				setTypeLink = _setTypeLinkLocalService.addSetTypeLink(dataSetId, dataTypeId);
			}
			
			linkIds.put(setTypeLink.getPrimaryKey());
		}
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		result.put("dataSetId", dataSetId);
		result.put("setTypeLinkIds", linkIds);

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
}
