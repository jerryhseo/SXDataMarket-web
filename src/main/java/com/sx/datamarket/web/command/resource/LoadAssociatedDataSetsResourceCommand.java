package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
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
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataStructureException;
import com.sx.icecap.exception.NoSuchTypeStructureLinkException;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataComment;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.spyglass.model.ScienceApp;
import com.sx.spyglass.service.ScienceAppLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.portlet.PortletException;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	    		"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataCollectionEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_ASSOCIATED_DATASETS
	    },
	    service = MVCResourceCommand.class
)
public class LoadAssociatedDataSetsResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadAssociatedDataSetsResourceCommand: " );
		
		JSONArray jsonAssociatedDataSets = JSONFactoryUtil.createJSONArray();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		System.out.println("DataCollectionId: " + dataCollectionId);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		List<CollectionSetLink> collectionSetLinkList = null;
		if( dataCollectionId > 0 ) {
			collectionSetLinkList = 
					_collectionSetLinkLocalService.getCollectionSetLinkListByCollection(
							themeDisplay.getScopeGroupId(), dataCollectionId);
		}
		else {
			new Exception("[ERROR] LoadAssociatedDataSets needs dataCollectionId");
		}

		Iterator<CollectionSetLink> iter = collectionSetLinkList.iterator();
		while( iter.hasNext() ) {
			CollectionSetLink link = iter.next();
			
			DataSet dataSet = _dataSetLocalService.getDataSet(link.getDataSetId());
			
			JSONObject jsonDataSet = JSONFactoryUtil.createJSONObject();
			
			jsonDataSet.put("dataSetId", dataSet.getDataSetId());
			jsonDataSet.put("dataSetCode", dataSet.getDataSetCode());
			jsonDataSet.put("dataSetVersion", dataSet.getDataSetVersion());
			jsonDataSet.put("displayName", dataSet.getDisplayName(themeDisplay.getLocale()));
			
			jsonAssociatedDataSets.put(jsonDataSet);
		}
		
		
		System.out.println("LoadAssociatedDataSetsResourceCommand result: " + jsonAssociatedDataSets.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(jsonAssociatedDataSets.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private CollectionSetLinkLocalService _collectionSetLinkLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
}
