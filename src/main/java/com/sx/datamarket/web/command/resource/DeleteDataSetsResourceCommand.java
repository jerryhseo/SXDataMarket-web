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
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataSetExplorerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_DELETE_DATASETS
	    },
	    service = MVCResourceCommand.class
)
public class DeleteDataSetsResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DeleteDataSetsResourceCommand");
		String strDataSetIds = ParamUtil.getString(resourceRequest, "dataSetIds", "[]");
		System.out.println("strDataSetIds: " + strDataSetIds);
		
		JSONArray jsonDataSetIds = JSONFactoryUtil.createJSONArray(strDataSetIds);
		long[]  dataSetIds = new long[jsonDataSetIds.length()];
		for( int i=0; i<jsonDataSetIds.length(); i++) {
			dataSetIds[i] = jsonDataSetIds.getLong(i);
		}
		
		_dataSetLocalService.removeDataSets(dataSetIds);
		
		PrintWriter pw = resourceResponse.getWriter();
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		result.put("dataSetIds", dataSetIds);
		
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
}
