package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.servlet.HttpHeaders;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.PropsUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.util.SXPortalUtil;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.portlet.PortletException;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_DOWNLOAD_FIELD_ATTACHED_FILE
	    },
	    service = MVCResourceCommand.class
)
public class DownloadFieldAttachedFileResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("DownloadFieldAttachedFileResourceCommand");
		long dataCollectionId = ParamUtil.getLong(resourceRequest, WebKey.DATACOLLECTION_ID, 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, WebKey.DATASET_ID, 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, WebKey.DATATYPE_ID, 0);
		long structuredDataId = ParamUtil.getLong(resourceRequest, WebKey.STRUCTURED_DATA_ID, 0);
		String paramCode = ParamUtil.getString(resourceRequest, "paramCode", "");
		String paramVersion = ParamUtil.getString(resourceRequest, "paramVersion", "");
		String fileName = ParamUtil.getString(resourceRequest, "fileName", "");
		String fileType = ParamUtil.getString(resourceRequest, "fileType", "");
		String disposition = ParamUtil.getString(resourceRequest, "disposition", "attachment");
		
		
		if( !(
				dataCollectionId > 0 && dataSetId > 0 && dataTypeId > 0 && 
				structuredDataId > 0 && 
				!paramCode.isEmpty() && !fileName.isEmpty() && !fileType.isEmpty()) ) {
			
			System.out.println("dataCollectionId: " + dataCollectionId);
			System.out.println("dataSetId: " + dataSetId);
			System.out.println("dataTypeId: " + dataTypeId);
			System.out.println("structuredDataId: " + structuredDataId);
			System.out.println("paramCode: " + paramCode);
			System.out.println("paramVersion: " + paramVersion);
			System.out.println("fileName: " + fileName);
			System.out.println("fileType: " + fileType);
			System.out.println("fileType: " + fileType);
			throw new PortalException("Cannot specify a file to download.");
		}
		
		System.out.println("Can read: " + new File("d:/stationx").canRead());
		
		DataCollection dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
		DataSet dataSet = _dataSetLocalService.getDataSet(dataSetId);
		DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		Path filePath = SXPortalUtil.getDataDirPath(
				themeDisplay.getCompanyId(), 
				themeDisplay.getScopeGroupId(), 
				dataCollection.getDataCollectionCode()+"/"+
						dataSet.getDataSetCode()+"/"+
						dataType.getDataTypeCode()+"/"+
						structuredDataId+"/"+
						paramCode+"/"+fileName);
		
		System.out.println("filePath: " + filePath.toString());
		
		if( !Files.exists(filePath) ) {
			throw new FileNotFoundException(filePath.toString());
		}
		
		try {
            resourceResponse.setContentType(fileType);
            resourceResponse.addProperty(
                HttpHeaders.CONTENT_DISPOSITION,
                disposition+"; filename=\"" + fileName + "\"");

            OutputStream out = resourceResponse.getPortletOutputStream();
            Files.copy(filePath, out);
            out.flush();
        } catch (IOException e) {
            throw new PortletException("Unable to download file", e);
        }
	}
	
	@Reference
	private DataCollectionLocalService _dataCollectionLocalService;
	
	@Reference
	private DataSetLocalService _dataSetLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
}
