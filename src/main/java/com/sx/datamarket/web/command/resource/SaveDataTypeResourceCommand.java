package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

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
				"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
				"javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
				"mvc.command.name=" + MVCCommand.RESOURCE_SAVE_DATATYPE 
		}, 
		service = MVCResourceCommand.class)
public class SaveDataTypeResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("SaveDataTypeResourceCommand");
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, DataTypeProperties.DATATYPE_ID, 0);
		
		String dataTypeCode = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_CODE);
		String dataTypeVersion = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_VERSION);
		String extension = ParamUtil.getString(resourceRequest, DataTypeProperties.EXTENSION);
		String displayName = ParamUtil.getString(resourceRequest, DataTypeProperties.DISPLAY_NAME, "{}");
		String description = ParamUtil.getString(resourceRequest, DataTypeProperties.DESCRIPTION, "{}");

		String strVisualizers = ParamUtil.getString(resourceRequest, "visualizers", "");
		long dataStructureId = ParamUtil.getLong(resourceRequest, "dataStructureId", 0);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		long groupId = ParamUtil.getLong(resourceRequest, "groupId", themeDisplay.getScopeGroupId());
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);
		System.out.println("dataTypeCode: " + dataTypeCode);
		System.out.println("dataTypeVersion: " + dataTypeVersion);
		System.out.println("extension: " + extension);
		System.out.println("displayName: " + displayName);
		System.out.println("description: " + description);
		System.out.println("strVisualizers: " + strVisualizers);
		System.out.println("dataStructureId: " + dataStructureId);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		DataType dataType = null;
		
		
		ServiceContext dataTypeSC = ServiceContextFactory.getInstance(DataType.class.getName(), resourceRequest);
		if( dataTypeId > 0 ) {
			dataType = _dataTypeLocalService.updateDataType(
					dataTypeId, 
					dataTypeCode, 
					dataTypeVersion, 
					extension, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description),
					WorkflowConstants.STATUS_APPROVED, 
					dataTypeSC);
		} else {
			dataType = _dataTypeLocalService.getDataType(dataTypeCode, dataTypeVersion);
			
			// check duplicated
			if( Validator.isNotNull(dataType) ) {
				result.put("error", 
						LanguageUtil.format(
								resourceRequest.getLocale(), 
								"datatype-is-duplicated", 
								new Object[] {dataTypeCode,  dataTypeVersion}, false));
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			dataType = _dataTypeLocalService.addDataType(
					dataTypeCode, 
					dataTypeVersion, 
					extension, 
					SXLocalizationUtil.jsonToLocalizedMap(displayName), 
					SXLocalizationUtil.jsonToLocalizedMap(description),
					WorkflowConstants.STATUS_APPROVED, 
					dataTypeSC);
			
			dataTypeId = dataType.getDataTypeId();
		}
		
		result.put( "dataType", dataType.toJSON(themeDisplay.getLocale()));
		
		if( dataSetId > 0 ) {
			SetTypeLink setTypeLink = _setTypeLinkLocalService.getSetTypeLink(groupId, dataCollectionId, dataSetId, dataTypeId);
			
			if( Validator.isNull(setTypeLink) ) {
				ServiceContext linkSC = ServiceContextFactory.getInstance(SetTypeLink.class.getName(), resourceRequest);
				int order = _setTypeLinkLocalService.countSetTypeLinkListByCollectionSet(groupId, dataCollectionId, dataSetId);
				
				_setTypeLinkLocalService.addSetTypeLink(
						dataCollectionId, 
						dataSetId, 
						dataTypeId, 
						order, 
						linkSC);
			}
		}
		
		if( dataStructureId > 0 ) {
			_dataTypeLocalService.importDataStructure(dataTypeId, dataStructureId);
		}
		
		String[] strAryVisualizers = 	new String[] {};
		long[] longAryVisualizers = new long[] {};
		
		if( !strVisualizers.isEmpty() ) {
			strAryVisualizers = strVisualizers.split(",");
		
			longAryVisualizers = Arrays.stream(strAryVisualizers).mapToLong(Long::parseLong).toArray();
		}
		
		List<TypeVisualizerLink> linkedVisualizerList = 
				_typeVisualizerLinkLocalService.getTypeVisualizerLinkList(dataTypeId);
		
		// Delete unselected visualizers
		Iterator<TypeVisualizerLink> iter = linkedVisualizerList.iterator();
		while( iter.hasNext() ) {
			TypeVisualizerLink link = iter.next();
			
			if( !SXUtil.contains(longAryVisualizers, link.getVisualizerId()) ) {
				System.out.println("visualizer deleted: " + dataTypeId);
				_typeVisualizerLinkLocalService.deleteTypeVisualizerLink(link.getTypeVisualizerLinkId());
			}
		}
		
		for( long visualizerId : longAryVisualizers ) {
			TypeVisualizerLink link = _typeVisualizerLinkLocalService.getTypeVisualizerLink(dataTypeId, visualizerId);
			
			if( Validator.isNull(link) ) {
				_typeVisualizerLinkLocalService.addTypeVisualizerLink(dataTypeId, visualizerId);
				System.out.println("visualizer [" + visualizerId + "] added to: " + dataTypeId);
			}
		}
		
		System.out.println("dataTypeAdded: "+ result.toString(4));

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}

	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private TypeVisualizerLinkLocalService _typeVisualizerLinkLocalService;
	
}
