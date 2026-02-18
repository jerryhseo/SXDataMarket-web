package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;

import java.io.PrintWriter;
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
	        "javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_LOAD_ASSOCIATED_DATATYPES
	    },
	    service = MVCResourceCommand.class
)
public class LoadAssociatedDataTypesResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("LoadAssociatedDataTypesResourceCommand: " );
		
		JSONArray jsonAssociatedDataTypes = JSONFactoryUtil.createJSONArray();
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		System.out.println("DataCollectionId: " + dataCollectionId);
		System.out.println("DataSetId: " + dataSetId);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		List<SetTypeLink> setTypeLinkList = null;
		if( dataCollectionId > 0  && dataSetId > 0) {
			setTypeLinkList = 
					_setTypeLinkLocalService.getSetTypeLinkListByCollectionSet(
							themeDisplay.getScopeGroupId(), dataCollectionId, dataSetId);
		}
		else {
			new Exception("[ERROR] LoadAssociatedDataTypes needs dataCollectionId and dataSetId ");
		}

		Iterator<SetTypeLink> iter = setTypeLinkList.iterator();
		while( iter.hasNext() ) {
			SetTypeLink link = iter.next();
			
			DataType dataType = _dataTypeLocalService.getDataType(link.getDataTypeId());
			
			JSONObject jsonDataType = JSONFactoryUtil.createJSONObject();
			
			jsonDataType.put("setTypeLinkId", link.getSetTypeLinkId());
			jsonDataType.put("dataTypeId", dataType.getDataTypeId());
			jsonDataType.put("dataTypeCode", dataType.getDataTypeCode());
			jsonDataType.put("dataTypeVersion", dataType.getDataTypeVersion());
			jsonDataType.put("displayName", dataType.getDisplayName(themeDisplay.getLocale()));
			
			jsonAssociatedDataTypes.put(jsonDataType);
		}
		
		
		System.out.println("LoadAssociatedDataTypesResourceCommand result: " + jsonAssociatedDataTypes.toString(4));
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(jsonAssociatedDataTypes.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private SetTypeLinkLocalService _setTypeLinkLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
}
