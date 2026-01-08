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
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;

import java.io.PrintWriter;
import java.util.Arrays;
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
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeExplorerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataSetExplorerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataCollectionExplorerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataExplorerPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_DELETE_STRUCTURED_DATA
	    },
	    service = MVCResourceCommand.class
)
public class DeleteStructuredDataResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DeleteStructuredDataResourceCommand");
		String strDataIds = ParamUtil.getString(resourceRequest, "structuredDataIdList", "[]");
		System.out.println("strDataIds: " + strDataIds);
		
		String[] strAryDataIds = strDataIds.split(",");
		long[] longAryDataIds = Arrays.stream(strAryDataIds).mapToLong(Long::parseLong).toArray();
		
		for(int i=0; i< longAryDataIds.length; i++) {
			_structuredDataLocalService.deleteStructuredData(longAryDataIds[i]);
		}
		
		PrintWriter pw = resourceResponse.getWriter();
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		result.put("deleted", longAryDataIds);
		
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
}
