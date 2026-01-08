package com.sx.datamarket.web.command.resource;

import com.liferay.bookmarks.exception.NoSuchFolderException;
import com.liferay.document.library.kernel.model.DLFolderConstants;
import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.document.library.kernel.store.DLStoreUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.repository.model.Folder;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.kernel.util.FileUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.PropsUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.ParameterType;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataCollectionException;
import com.sx.icecap.exception.NoSuchDataSetException;
import com.sx.icecap.exception.NoSuchDataTypeException;
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
import com.sx.icecap.service.ParameterLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
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
		
		DataCollection dataCollection = null;
		DataSet dataSet = null;
		DataType dataType = null;
		
		try{
			dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
			dataSet = _dataSetLocalService.getDataSet(dataSetId);
			dataType = _dataTypeLocalService.getDataType(dataTypeId);
		} catch(NoSuchDataCollectionException | NoSuchDataSetException | NoSuchDataTypeException e) {
			throw e;
		}
		
		JSONObject jsonData = JSONFactoryUtil.createJSONObject(strData);
		System.out.println("JSON Data: " + jsonData.toString(4));
		
		
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
		
		result = structuredData.toJSON();

		if( !strFileFields.isEmpty() ) {
			String[] fileFields = strFileFields.split(",");
			
			//Check and manage folders to save the data files
			UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest(resourceRequest);
	

			String stationXDataDir = PropsUtil.get("stationx-data-dir");
			System.out.println("StationX Data Dir: " + stationXDataDir);
			
			ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
			long companyId = themeDisplay.getCompanyId();
			Path folderPath = 
					Paths.get( stationXDataDir+"/" + companyId + "/" +
											themeDisplay.getScopeGroupId() + "/" + 
											dataCollection.getDataCollectionCode() + "/" +
											dataSet.getDataSetCode() + "/" +
											dataType.getDataTypeCode() + "/" +
											structuredData.getStructuredDataId());

			if( Files.exists(folderPath) ) {
				System.out.println("Path exists: " + folderPath.toString());
			} else {
				System.out.println(("Path doesn't exist: " + folderPath.toString()));
				Files.createDirectories(folderPath);
			}
			
			JSONArray errorFiles = JSONFactoryUtil.createJSONArray();
			
			for(String fileField : fileFields) {
				String[] fileNames = uploadRequest.getFileNames(fileField);
				String contentType = uploadRequest.getContentType(fileField);
				File[] files = uploadRequest.getFiles(fileField);
				
				if( Validator.isNotNull(files)) {
					for(int i=0; i<files.length; i++) {
						File file = files[i];
						String fileName = fileNames[i];
						System.out.println("FileName: " + file.getName());
						System.out.println("fileField: "+fileField + ",  : " + fileName +", "+contentType+", "+file.length() );
						
						// Choose where to save it
						Path destinationPath = folderPath.resolve( fileName);
	
						// Copy file to destination
						try ( InputStream in = new FileInputStream(file) ){
							Files.copy(in, destinationPath);
						} catch ( FileAlreadyExistsException e ) {
							JSONObject errorFile = JSONFactoryUtil.createJSONObject();
							errorFile.put("fileName", file.getName());
							errorFile.put("error", "duplicated");
							errorFiles.put(errorFile);
						}
					}
				}
			}
			
			if( errorFiles.length() > 0 ) {
				result.put("errorFiles", errorFiles);
			}
		}
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toString());
		pw.flush();
		pw.close();
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
