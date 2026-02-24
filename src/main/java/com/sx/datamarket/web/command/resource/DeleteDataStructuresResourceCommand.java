package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.DataStructureProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.io.PrintWriter;
import java.util.Arrays;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
		property = {
				"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
				"javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
				"javax.portlet.name=" + WebPortletKey.SXDataStructureExplorerPortlet,
				"mvc.command.name=" + MVCCommand.RESOURCE_DELETE_DATASTRUCTURES
		},
		service = MVCResourceCommand.class
)
public class DeleteDataStructuresResourceCommand extends BaseMVCResourceCommand {
	@Reference
	DataStructureLocalService _dataStructureLocalService;
	
	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		System.out.println("DeleteDataStructuresResourceCommand");
		String strDataStructureIds = ParamUtil.getString(resourceRequest, "dataStructureIds", "");
		System.out.println("strDataStructureIds: " + strDataStructureIds);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		if( strDataStructureIds.isEmpty() ) {
			result.put("error", SXUtil.translate(resourceRequest, "there-is-nothing-to-delete"));
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		String[] strAryDataStructureIds = strDataStructureIds.split(",");
		long[] longAryDataStructureIds = Arrays.stream(strAryDataStructureIds).mapToLong(Long::parseLong).toArray();

		try {
			_dataStructureLocalService.removeDataStructures(longAryDataStructureIds);
			result.put("dataStructureList", strDataStructureIds );
		} catch ( PortalException e ) {
			result.put( "error", e.getLocalizedMessage() );
		}
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}

}
