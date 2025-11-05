package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.DuplicatedDataTypeNameException;
import com.sx.icecap.exception.InvalidDataTypeCodeException;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.lang.reflect.Array;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_UPDATE_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class UpdateDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("UpdateDataTypeResourceCommand");
		long dataTypeId = ParamUtil.getLong(resourceRequest, DataTypeProperties.DATATYPE_ID, 0);
		
		/*
		JSONObject formData = JSONFactoryUtil.createJSONObject(ParamUtil.getString(resourceRequest, "formData", "{}"));
		System.out.println("JSON DataType: " + formData.toString(4));
		
		JSONObject jsonDataType = formData.getJSONObject("dataType");
		
		String code = jsonDataType.getString(DataTypeProperties.DATATYPE_CODE);
		String version = jsonDataType.getString(DataTypeProperties.DATATYPE_VERSION);
		String extension = jsonDataType.getString(DataTypeProperties.EXTENSION);
		JSONObject displayName =jsonDataType.getJSONObject((DataTypeProperties.DISPLAY_NAME));
		JSONObject description =jsonDataType.getJSONObject((DataTypeProperties.DESCRIPTION));
		JSONObject tooltip =jsonDataType.getJSONObject((DataTypeProperties.TOOLTIP));
		//JSONObject visualizers =jsonDataType.getJSONObject((DataTypeProperty.VISUALIZERS));
		long dataStructureId = jsonDataType.getLong(DataTypeProperties.DATA_STRUCTURE_ID, 0);
		*/
		String dataTypeCode = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_CODE);
		String dataTypeVersion = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_VERSION);
		String extension = ParamUtil.getString(resourceRequest, DataTypeProperties.EXTENSION);
		String displayName = ParamUtil.getString(resourceRequest, DataTypeProperties.DISPLAY_NAME);
		String description = ParamUtil.getString(resourceRequest, DataTypeProperties.DESCRIPTION);
		String tooltip = ParamUtil.getString(resourceRequest, DataTypeProperties.TOOLTIP);
		String strVisualizers = ParamUtil.getString(resourceRequest, "visualizers");
		long dataStructureId = ParamUtil.getLong(resourceRequest, DataTypeProperties.DATA_STRUCTURE_ID, 0);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		ServiceContext sc = ServiceContextFactory.getInstance(DataType.class.getName(), resourceRequest);
		
		System.out.println("dataTypeId: " + dataTypeId);
		System.out.println("dataTypeCode: " + dataTypeCode);
		System.out.println("dataTypeVersion: " + dataTypeVersion);
		System.out.println("extension: " + extension);
		System.out.println("displayName: " + displayName);
		System.out.println("description: " + description);
		System.out.println("tooltip: " + tooltip);
		System.out.println("visualizers: " + strVisualizers);
		
		DataType dataType =_dataTypeLocalService.updateDataType(
				dataTypeId,
				dataTypeCode, 
				dataTypeVersion, 
				extension, 
				SXLocalizationUtil.jsonToLocalizedMap(displayName), 
				SXLocalizationUtil.jsonToLocalizedMap(description), 
				SXLocalizationUtil.jsonToLocalizedMap(tooltip), 
				WorkflowConstants.STATUS_APPROVED,
				sc
		);
		
		result.put("dataTypeId", dataType.getDataTypeId());
		
		String[] visualizersStrAry = strVisualizers.split(",");
		long[] visualizers = Arrays.stream(visualizersStrAry).mapToLong(Long::parseLong).toArray();
		
		for( long visualizer : visualizers ) {
			System.out.println("visualizer ID: " + visualizer);
		}
		/*
		JSONArray selectedVisualizers = formData.getJSONArray("visualizers");
		*/
		
		//Delete TypeVisualizerLink un-selected
		List<TypeVisualizerLink> visualizerLinkList = _typeVisualizerLinkLocalService.getTypeVisualizerLinkList(dataTypeId);
		
		Iterator<TypeVisualizerLink> linkIterator = visualizerLinkList.iterator();
		while(linkIterator.hasNext()) {
			TypeVisualizerLink link = linkIterator.next();
			
			boolean selected = Arrays.asList(visualizers).contains(link.getVisualizerId());
			
			if( !selected ) {
				_typeVisualizerLinkLocalService.deleteTypeVisualizerLink(link.getTypeVisualizerLinkId());
			}
		}
		
		//Add TypeVisualizerLink if it is new or update it if it exists.
		for(long visualizerId : visualizers) {
			TypeVisualizerLink typeVisualizerLink = _typeVisualizerLinkLocalService.getTypeVisualizerLink(dataTypeId, visualizerId);
			
			if( Validator.isNull(typeVisualizerLink)) {
				_typeVisualizerLinkLocalService.addTypeVisualizerLink(dataTypeId, visualizerId);
			}
			else {
					_typeVisualizerLinkLocalService.updateTypeVisualizerLink(
							typeVisualizerLink.getPrimaryKey(), 
							dataTypeId, 
							visualizerId);
			}
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
}
