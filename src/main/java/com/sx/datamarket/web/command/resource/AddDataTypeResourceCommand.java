package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.ServiceContextUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.DuplicatedDataTypeNameException;
import com.sx.icecap.exception.InvalidDataTypeCodeException;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.Date;
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
				"javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
				"mvc.command.name=" + MVCCommand.RESOURCE_ADD_DATATYPE 
		}, 
		service = MVCResourceCommand.class)
public class AddDataTypeResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("AddDataTypeResourceCommand");
		String strFormData = ParamUtil.getString(resourceRequest, "formData", "{}");
		JSONObject formData = JSONFactoryUtil.createJSONObject(strFormData);
		System.out.println("[AddDataTypeResourceCommand] JSON Form Data: " + formData.toString(4));

		JSONObject jsonDataType = formData.getJSONObject("dataType");

		String code = jsonDataType.getString(DataTypeProperties.DATATYPE_CODE);
		String version = jsonDataType.getString(DataTypeProperties.DATATYPE_VERSION);
		String extension = jsonDataType.getString(DataTypeProperties.EXTENSION);
		JSONObject displayName = jsonDataType.getJSONObject((DataTypeProperties.DISPLAY_NAME));
		JSONObject description = jsonDataType.getJSONObject((DataTypeProperties.DESCRIPTION));
		JSONObject tooltip = jsonDataType.getJSONObject((DataTypeProperties.TOOLTIP));

		ServiceContext dataTypeSC = ServiceContextFactory.getInstance(DataType.class.getName(), resourceRequest);

		DataType dataType = _dataTypeLocalService.addDataType(code, version, extension,
				SXLocalizationUtil.jsonToLocalizedMap(displayName), SXLocalizationUtil.jsonToLocalizedMap(description),
				SXLocalizationUtil.jsonToLocalizedMap(tooltip), WorkflowConstants.STATUS_APPROVED, dataTypeSC);
		
		System.out.println("dataTypeAdded: "+dataType.getDataTypeId());

		JSONObject jsonStructureLink = formData.getJSONObject("structureLink");
		if (Validator.isNotNull(jsonStructureLink)) {
			ServiceContext structureLinkSC = ServiceContextFactory.getInstance(TypeStructureLink.class.getName(),
					resourceRequest);

			long structureLinkId = jsonStructureLink.getLong("typeStructureLinkId", 0);
			long linkDataTypeId = jsonStructureLink.getLong("dataTypeId", 0);
			long dataStructureId = jsonStructureLink.getLong("dataStructureId", 0);
			boolean commentable = jsonStructureLink.getBoolean("commentable", false);
			boolean verifiable = jsonStructureLink.getBoolean("verifiable", false);
			boolean freezable = jsonStructureLink.getBoolean("freezable", false);
			boolean freezed = jsonStructureLink.getBoolean("freezed", false);
			boolean verified = jsonStructureLink.getBoolean("verified", false);
			boolean inputStatus=jsonStructureLink.getBoolean("inputStatus", false);
			boolean jumpTo=jsonStructureLink.getBoolean("jumpTo", false);

			if (structureLinkId > 0) {
				_typeStructureLinkLocalService.updateTypeDataStructureLink(linkDataTypeId, dataStructureId, commentable,
						verifiable, freezable, verified, freezed, inputStatus, jumpTo, structureLinkSC);
			} else {
				_typeStructureLinkLocalService.addTypeDataStructureLink(linkDataTypeId, dataStructureId, commentable,
						verifiable, freezable, verified, freezed, inputStatus, jumpTo, structureLinkSC);
			}
		}

		JSONArray jsonVisualizers = formData.getJSONArray("visualizers");
		
		for( int i=0; i<jsonVisualizers.length(); i++) {
			JSONObject visualizer = jsonVisualizers.getJSONObject(i);
			long visualizerId = visualizer.getLong("value");
			
			_typeVisualizerLinkLocalService.addTypeVisualizerLink(dataType.getDataTypeId(), visualizerId);
		}
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		result.put("dataTypeId", dataType.getDataTypeId());

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush(); 
		pw.close();
	}

	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;

	@Reference
	private TypeVisualizerLinkLocalService _typeVisualizerLinkLocalService;
}
