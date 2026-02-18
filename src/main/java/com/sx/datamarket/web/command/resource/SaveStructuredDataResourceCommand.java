package com.sx.datamarket.web.command.resource;

import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.PropsUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.StructuredData;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.SXPortalUtil;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SAVE_STRUCTURED_DATA
	    },
	    service = MVCResourceCommand.class
)
public class SaveStructuredDataResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		System.out.println("SaveStructuredDataResourceCommand");

		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		long structuredDataId = ParamUtil.getLong(resourceRequest, "structuredDataId", 0);
		String strFileFields = ParamUtil.getString(resourceRequest, "fileFields", "");
		String strData = ParamUtil.getString(resourceRequest, "data", "{}");
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);
		System.out.println("structuredDataId: " + structuredDataId);
		System.out.println("fileFields: " + strFileFields);
		System.out.println("Data: " + strData);
		
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		DataCollection dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
		DataSet dataSet = _dataSetLocalService.getDataSet(dataSetId);
		DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);

		if( Validator.isNull(dataCollection) || Validator.isNull(dataSet) || Validator.isNull(dataType)) {
			result.put("error", 
					SXUtil.translate(
							resourceRequest, 
							"datacollection-id-dataset-id-datatype-id-should-be-provided-to-save-structured-data"));
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		if( strData.isEmpty() ) {
			result.put("error", SXUtil.translate( resourceRequest, "there-is-no-data-to-be-saved"));
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		String dataTypeCode = dataType.getDataTypeCode();
		String dataTypeVersion = dataType.getDataTypeVersion();
		
		ServiceContext dataSC = ServiceContextFactory.getInstance(StructuredData.class.getName(), resourceRequest);

		StructuredData structuredData = null;
		
		if( structuredDataId > 0 ) {
			structuredData = _structuredDataLocalService.updateStructuredData(
					structuredDataId, 
					dataCollectionId, 
					dataSetId, 
					dataTypeId, 
					false, 0, 0, 
					strData, 
					WorkflowConstants.STATUS_APPROVED, 
					dataSC);
		}
		else {
				structuredData = _structuredDataLocalService.addStructuredData(
						dataCollectionId, 
						dataSetId, 
						dataTypeId, 
						false, 0, 0, 
						strData, 
						WorkflowConstants.STATUS_DRAFT, 
						dataSC);
		}
		
		result.put("message", SXUtil.translate(resourceRequest, "data-saved-as", structuredData.getStructuredDataId()));
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		long companyId = themeDisplay.getCompanyId();
		String stationXDataDir = PropsUtil.get("stationx-data-dir");
		Path sxDataFolderPath = Paths.get( 
						stationXDataDir + "/" + 
						companyId + "/" + 
						themeDisplay.getScopeGroupId() + "/" +
						dataCollection.getDataCollectionCode() + "/" +
						dataCollection.getDataCollectionVersion() + "/" +
						dataSet.getDataSetCode() + "/" +
						dataSet.getDataSetVersion()
		);
		
		Path dataTypeCodeFolderPath = sxDataFolderPath.resolve(dataTypeCode);
		Path dataTypeVersionFolderPath = dataTypeCodeFolderPath.resolve(dataTypeVersion);

		if( strFileFields.isEmpty() ) {
			SXPortalUtil.deleteFolder(dataTypeCodeFolderPath);
		} else {
			String[] fileFields = strFileFields.split(",");
			
			JSONObject jsonData =null;
			
			try {
				jsonData = JSONFactoryUtil.createJSONObject(strData);
				System.out.println("JSON Data: " + jsonData.toString(4));
			} catch ( JSONException e ) {
				result.put("error", "wrong-json-format-of-the-data");
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest(resourceRequest);
			JSONArray errorFiles = JSONFactoryUtil.createJSONArray();
			
			Iterator< String> keys = jsonData.keys();
			while( keys.hasNext() ) {
				String paramCode = keys.next();
				Path paramCodeFolderPath = dataTypeVersionFolderPath.resolve(paramCode);
				
				if( SXUtil.contains(fileFields, paramCode) ) {
					SXPortalUtil.emptyFolder(paramCodeFolderPath, true);
					
					errorFiles = SXPortalUtil.saveUploadFieldFiles(uploadRequest, paramCode, paramCodeFolderPath);
				} else {
					SXPortalUtil.deleteFolder(paramCodeFolderPath);
				}
			}
			
			if( errorFiles.length() > 0 ) {
				result.put("errorFiles", errorFiles);
			}
		}
		
		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	StructuredDataLocalService _structuredDataLocalService;
	
	@Reference
	DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	DataSetLocalService _dataSetLocalService;
	
	@Reference
	DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	DLAppLocalService _dlAppLocalService;
	
}
