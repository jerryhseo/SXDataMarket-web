package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataTypeException;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataTypeLocalService;

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
	        "javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_CHECK_DATATYPE_UNIQUE
	    },
	    service = MVCResourceCommand.class
)
public class CheckDataTypeUniqueResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("CheckDataTypeNameUniqueResourceCommand");
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		String dataTypeCode = ParamUtil.getString(resourceRequest, "dataTypeCode", "");
		String dataTypeVersion = ParamUtil.getString(resourceRequest, "dataTypeVersion", "");
		String validationCode = ParamUtil.getString(resourceRequest, "validationCode", "code");
		
		String result = "true";
		if(validationCode.equalsIgnoreCase("code")) {
			List<DataType> dataTypeList = _dataTypeLocalService.getDataTypesByCode( dataTypeCode );
			
			if( dataTypeId > 0 ) {
				Iterator<DataType> iterator = dataTypeList.iterator();
				while(iterator.hasNext()) {
					DataType dataType = iterator.next();
					
					if( dataTypeId != dataType.getDataTypeId()) {
						if( dataTypeCode.equalsIgnoreCase(dataType.getDataTypeCode())) {
							result = "false";
							break;
						}
					}
				}
			}
			else {
				int dataTypeCount = dataTypeList.size();
				System.out.println("dataTypeCount: "+dataTypeCount);
				result = (dataTypeCount > 0) ? "false" : "true";
			}
		}
		else {
			try {
				DataType dataType = _dataTypeLocalService.getDataType(dataTypeCode, dataTypeVersion);
				
				result = dataTypeId == dataType.getDataTypeId() ? "true" : "false";
			} catch( NoSuchDataTypeException e) {
				result = "true";
			}
		}
		
		System.out.println("CheckDataTypeUniqueResourceCommand result: " + result);
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result);
		pw.flush();
		pw.close();
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
}
