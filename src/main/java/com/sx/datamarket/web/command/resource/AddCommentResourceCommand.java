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
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataComment;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.Parameter;
import com.sx.icecap.service.DataCommentLocalService;
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
				"mvc.command.name=" + MVCCommand.RESOURCE_ADD_COMMENT 
		}, 
		service = MVCResourceCommand.class)
public class AddCommentResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("AddCommentResourceCommand");
		
		String commentModel = ParamUtil.getString(resourceRequest, "commentModel");
		long dataId = ParamUtil.getLong(resourceRequest, "dataId");
		String paramCode = ParamUtil.getString(resourceRequest, "paramCode");
		long parentId = ParamUtil.getLong(resourceRequest, "parentId");
		String comment = ParamUtil.getString(resourceRequest, "comment");
		
		/* For test*/
		System.out.println("commentModel: " + commentModel);
		System.out.println("dataId: " + dataId);
		System.out.println("paramCode: " + paramCode);
		System.out.println("parentId: " + parentId);
		System.out.println("comment: " + comment);
		
		if( !(dataId > 0)) {
			throw new Exception("Data ID should be specified to add a comment : " + comment);
		}
			
		ServiceContext dataCommentSC = ServiceContextFactory.getInstance(DataComment.class.getName(), resourceRequest);

		DataComment dataComment = _dataCommentLocalService.addDataComment(
				commentModel, 
				dataId, 
				paramCode, 
				parentId, 
				comment,
				WorkflowConstants.STATUS_APPROVED,
				dataCommentSC)	;
		
		JSONObject result = dataComment.toJSON();
		System.out.println("dataComment Added: "+ result.toString(4));

		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush(); 
		pw.close();
	}

	@Reference
	private DataCommentLocalService _dataCommentLocalService;
}
