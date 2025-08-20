package com.sx.datamarket.web.command.resource.datatype.editor;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.spyglass.model.ScienceApp;
import com.sx.spyglass.service.ScienceAppLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
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
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class LoadDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadDataTypeResourceCommand");
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		
		if( dataTypeId > 0 ) {
			DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
			result.put("dataType", dataType.toJSON());
			
			if( dataType.getDataStructureId() > 0) {
				TypeStructureLink structureLink = _typeStructureLinkLocalService.getTypeStructureLink(dataTypeId);
				result.put("structureLink", structureLink.toJSON());
			}
			
			List<TypeVisualizerLink> visualizerLinkList = _typeVisualizerLinkLocalService.getTypeVisualizerLinkList(dataTypeId);
			JSONArray visualizers = JSONFactoryUtil.createJSONArray();
			Iterator<TypeVisualizerLink> iterator = visualizerLinkList.iterator();
			while(iterator.hasNext()) {
				TypeVisualizerLink link = iterator.next();
				
				ScienceApp app = _scienceAppLocalService.getScienceApp(link.getVisualizerId());
				
				JSONObject visualizer = JSONFactoryUtil.createJSONObject();
				visualizer.put("id", app.getScienceAppId());
				visualizer.put("displayName", SXLocalizationUtil.mapToLocalizedJSON(app.getDisplayNameMap()));
				
				visualizers.put(visualizer);
			}
			
			result.put("visualizers", visualizers);
		}
		else {
			result.put("dataType", "{}");
			result.put("structureLink", "{}");
			result.put("visualizers", "{}");
		}
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private TypeVisualizerLinkLocalService _typeVisualizerLinkLocalService;
	
	@Reference
	private ScienceAppLocalService _scienceAppLocalService;
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;
}
