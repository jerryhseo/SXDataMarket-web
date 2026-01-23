package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataComment;
import com.sx.icecap.service.DataCommentLocalService;

import java.io.PrintWriter;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
		immediate = true, 
		property = { 
				"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
				"javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
				"mvc.command.name=" + MVCCommand.RESOURCE_DELETE_REFERENCE_FILES 
		}, 
		service = MVCResourceCommand.class)
public class DeleteReferenceFilesResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DeleteReferenceFilesResourceCommand");
		
		String dataStructureCode = ParamUtil.getString(resourceRequest, "dataStructureCode", "");
		String dataStructureVersion = ParamUtil.getString(resourceRequest, "dataStructureVersion", "");
		String paramCode = ParamUtil.getString(resourceRequest, "paramCode", "");
		String paramVersion = ParamUtil.getString(resourceRequest, "paramVersion", "");
		String fileName = ParamUtil.getString(resourceRequest, "fileName", "");
		
		System.out.println("dataStructureCode: " + dataStructureCode);
		System.out.println("dataStructureVersion: " + dataStructureVersion);
		System.out.println("paramCode: " + paramCode);
		System.out.println("paramVersion: " + paramVersion);
		System.out.println("fileName: " + fileName);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush(); 
		pw.close();
	}

	@Reference
	private DataCommentLocalService _dataCommentLocalService;
}
