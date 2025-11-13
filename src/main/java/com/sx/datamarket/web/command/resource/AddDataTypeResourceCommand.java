package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.Arrays;

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
		
		String code = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_CODE);
		String version = ParamUtil.getString(resourceRequest, DataTypeProperties.DATATYPE_VERSION);
		String extension = ParamUtil.getString(resourceRequest, DataTypeProperties.EXTENSION);
		String displayName = ParamUtil.getString(resourceRequest, DataTypeProperties.DISPLAY_NAME, "{}");
		String description = ParamUtil.getString(resourceRequest, DataTypeProperties.DESCRIPTION, "{}");
		String tooltip = ParamUtil.getString(resourceRequest, DataTypeProperties.TOOLTIP, "{}");

		String strStructureLink = ParamUtil.getString(resourceRequest, "typeStructureLink", "");
		JSONObject jsonStructureLink = null;
		if ( !strStructureLink.isEmpty() ) {
			jsonStructureLink = JSONFactoryUtil.createJSONObject(strStructureLink);
		}
		
		String strVisualizers = ParamUtil.getString(resourceRequest, "visualizers", "");
		
		String[] strAryVisualizers = 	new String[] {};
		long[] longAryVisualizers = new long[] {};
		
		if( !strVisualizers.isEmpty() ) {
			strAryVisualizers = strVisualizers.split(",");
		
			longAryVisualizers = Arrays.stream(strAryVisualizers).mapToLong(Long::parseLong).toArray();
		}
			
		ServiceContext dataTypeSC = ServiceContextFactory.getInstance(DataType.class.getName(), resourceRequest);

		JSONObject result = _dataTypeLocalService.addDataType(
				code, 
				version, 
				extension,
				SXLocalizationUtil.jsonToLocalizedMap(displayName), 
				SXLocalizationUtil.jsonToLocalizedMap(description),
				SXLocalizationUtil.jsonToLocalizedMap(tooltip), 
				WorkflowConstants.STATUS_APPROVED,
				jsonStructureLink,
				longAryVisualizers,
				dataTypeSC);
		
		System.out.println("dataTypeAdded: "+ result.toString(4));

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush(); 
		pw.close();
	}

	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
}
