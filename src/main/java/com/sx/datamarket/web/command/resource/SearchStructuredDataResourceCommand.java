package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.UserLocalService;
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
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.StructuredData;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;

import java.io.PrintWriter;
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
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataExplorerPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SEARCH_STRUCTURED_DATA
	    },
	    service = MVCResourceCommand.class
)
public class SearchStructuredDataResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, WebKey.DATACOLLECTION_ID, 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, WebKey.DATASET_ID, 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, WebKey.DATATYPE_ID, 0);
		
		System.out.println("--- Start SearchStructuredDataResourceCommand:  " );
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);

		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		JSONObject dataList = 
				_structuredDataLocalService.getStructuredDataListWithInfo( 
						dataCollectionId, dataSetId, dataTypeId, themeDisplay.getLocale());
		System.out.println("Result: " + dataList.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(dataList.toJSONString());
		pw.flush();
		pw.close();
		
		System.out.println("--- End SearchStructuredDataResourceCommand" );
	}
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
}
