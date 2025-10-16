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
	        "javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
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
		
		List<CollectionSetLink> collectionSetLinkList = null;
		if( dataCollectionId > 0 ) {
			result = _dataCollectionLocalService.getDataCollectionInfo(dataCollectionId, themeDisplay.getLocale());
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
				jsonDataSet.put("displayName", 
						SXLocalizationUtil.mapToLocalizedJSON(dataSet.getDisplayNameMap()));
				
				availableDataSetJSONArray.put(jsonDataSet);
			}
			
			result.put("availableDataSetList", availableDataSetJSONArray);
		}
		
		System.out.println("LoadDataCollection result: " + result.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
}
