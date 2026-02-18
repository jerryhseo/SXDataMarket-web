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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.spyglass.service.ScienceAppLocalService;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadDataTypeResourceCommand: " );
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		boolean loadVisualizers = ParamUtil.getBoolean(resourceRequest, "loadVisualizers", false);
		boolean loadAvailableVisualizers = ParamUtil.getBoolean(resourceRequest, "loadAvailableVisualizers", false);
		boolean loadAvailableStructures = ParamUtil.getBoolean(resourceRequest, "loadAvailableStructures", false);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		boolean hasDataStructure = false;
		
		if( dataTypeId > 0 ) {
			DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
			JSONObject jsonDataType = dataType.toJSON();
			hasDataStructure = _dataTypeLocalService.hasDataStructure(dataTypeId);
			jsonDataType.put("hasStructure", hasDataStructure);
			
			result.put("dataType", jsonDataType);
			
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
		
		if( loadAvailableStructures == true ) {
			JSONArray availableStructures = JSONFactoryUtil.createJSONArray();
			
			List<DataStructure> dataStructureList = _dataStructureLocalService.getAllDataStructureList();
			
			Iterator<DataStructure> iterator = dataStructureList.iterator();
			while(iterator.hasNext()) {
				DataStructure dataStructure = iterator.next();
				
				JSONObject item = JSONFactoryUtil.createJSONObject();
				item.put("id", dataStructure.getDataStructureId());
				item.put("label", 
						dataStructure.getDisplayName(themeDisplay.getLocale()) + " v."+dataStructure.getDataStructureVersion());
				
				availableStructures.put(item);
			}
			
			result.put("availableDataStructures", availableStructures);
		}
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private TypeVisualizerLinkLocalService _typeVisualizerLinkLocalService;
	
	@Reference
	private ScienceAppLocalService _scienceAppLocalService;
}
