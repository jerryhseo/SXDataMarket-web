package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.DataStructureProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.service.DataStructureLocalService;

import java.io.PrintWriter;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
		property = {
				"javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
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
		String strDataStructureIds = ParamUtil.getString(resourceRequest, "dataStructureIds", "[]");
		System.out.println("strDataStructureIds: " + strDataStructureIds);
		
		_dataStructureLocalService.removeDataStructures(strDataStructureIds);
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(strDataStructureIds);
		pw.flush();
		pw.close();
		
	}

}
