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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadDataTypeResourceCommand: " + resourceResponse.getContentType());
		resourceResponse.setContentType("text/html;charset=UTF-8");
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		boolean loadStructure = ParamUtil.getBoolean(resourceRequest, "loadStructure", false);
		boolean loadVisualizers = ParamUtil.getBoolean(resourceRequest, "loadVisualizers", false);
		boolean loadAvailableVisualizers = ParamUtil.getBoolean(resourceRequest, "loadAvailableVisualizers", false);
		boolean loadDataTypeAutoCompleteItems = ParamUtil.getBoolean(resourceRequest, "loadDataTypeAutoCompleteItems", false);
		boolean loadDataStructureAutoCompleteItems = ParamUtil.getBoolean(resourceRequest, "loadDataStructureAutoCompleteItems", false);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		if( dataTypeId > 0 ) {
			DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
			result.put("dataType", dataType.toJSON());
			
			if( loadStructure == true) {
				try {
					TypeStructureLink structureLink = _typeStructureLinkLocalService.getTypeStructureLink(dataTypeId);
					result.put("structureLink", structureLink.toJSON());
					
					DataStructure dataStructure = _dataStructureLocalService.getDataStructure(structureLink.getDataStructureId());
					result.put("dataStructure", dataStructure.toJSON());
				} catch( NoSuchTypeStructureLinkException e) {
					System.out.println(e.getMessage());
				} catch( NoSuchDataStructureException e) {
					System.out.println(e.getMessage());
				}
			}
			
			if( loadVisualizers == true ) {
				List<TypeVisualizerLink> visualizerLinkList = _typeVisualizerLinkLocalService.getTypeVisualizerLinkList(dataTypeId);
				JSONArray visualizers = JSONFactoryUtil.createJSONArray();
				Iterator<TypeVisualizerLink> iterator = visualizerLinkList.iterator();
				while(iterator.hasNext()) {
					TypeVisualizerLink link = iterator.next();
					
					JSONObject visualizer = _scienceAppLocalService.getPseudoScienceApp((int)link.getVisualizerId());
					visualizer.put("typeVisualizerLinkId", link.getTypeVisualizerLinkId());
					
					visualizers.put(visualizer);
				}
				
				if( visualizerLinkList.size() > 0) {
					result.put("visualizers", visualizers);
				}
			}
			
		}
		
		if(loadAvailableVisualizers == true) {
			JSONArray availables = _scienceAppLocalService.getScienceAppList("visualizer");
			JSONArray visualizers = result.getJSONArray("visualizers");
			
			if( Validator.isNotNull(visualizers)) {
				for(int i=0; i<visualizers.length(); i++) {
					JSONObject visualizer = visualizers.getJSONObject(i);
					
					for( int j=0; j<availables.length(); j++) {
						JSONObject avail = availables.getJSONObject(j);
						
						if( avail.getLong("id") == visualizer.getLong("id")) {
							avail.put("typeVisualizerLinkId", visualizer.getLong("typeVisualizerLinkId"));
						}
					}
				}
			}
			
			result.put("availableVisualizers", availables);
		}
		
		if( loadDataTypeAutoCompleteItems == true ) {
			JSONArray dataTypeAutoCompleteItems = JSONFactoryUtil.createJSONArray();
			
			List<DataType> dataTypeList = _dataTypeLocalService.getAllDataTypes();
			Iterator<DataType> iterator = dataTypeList.iterator();
			while(iterator.hasNext()) {
				DataType dataType = iterator.next();
				
				JSONObject item = JSONFactoryUtil.createJSONObject();
				item.put("dataTypeId", dataType.getDataTypeId());
				item.put("dataTypeCode", dataType.getDataTypeCode()+ " v."+dataType.getDataTypeVersion());
				item.put("displayName", dataType.getDisplayName(themeDisplay.getLocale()) + " v."+dataType.getDataTypeVersion());
				
				dataTypeAutoCompleteItems.put(item);
			}
			
			result.put("dataTypeAutoCompleteItems", dataTypeAutoCompleteItems);
		}
		
		if( loadDataStructureAutoCompleteItems == true ) {
			JSONArray dataStructureAutoCompleteItems = JSONFactoryUtil.createJSONArray();
			
			List<DataStructure> dataStructureList = _dataStructureLocalService.getAllDataStructureList();
			Iterator<DataStructure> iterator = dataStructureList.iterator();
			while(iterator.hasNext()) {
				DataStructure dataStructure = iterator.next();
				
				JSONObject item = JSONFactoryUtil.createJSONObject();
				item.put("dataStructureId", dataStructure.getDataStructureId());
				item.put("dataStructureCode", dataStructure.getDataStructureCode()+ " v."+dataStructure.getDataStructureVersion());
				item.put("displayName", dataStructure.getDisplayName(themeDisplay.getLocale()) + " v."+dataStructure.getDataStructureVersion());
				
				dataStructureAutoCompleteItems.put(item);
			}
			
			result.put("dataStructureAutoCompleteItems", dataStructureAutoCompleteItems);
		}
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private TypeVisualizerLinkLocalService _typeVisualizerLinkLocalService;
	
	@Reference
	private ScienceAppLocalService _scienceAppLocalService;
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;
}
