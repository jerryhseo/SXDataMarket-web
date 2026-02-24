package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.UserLocalService;
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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.ParameterLocalService;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.SXPortalUtil;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.nio.file.Path;
import java.nio.file.Paths;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_UPDATE_DATASTRUCTURE
	    },
	    service = MVCResourceCommand.class
)
public class SaveDataStructureResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		//System.out.println("SaveDataStructureResourceCommand");
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		// Save data structure
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		long dataStructureId = ParamUtil.getLong(resourceRequest, "dataStructureId", 0);
		
		String strDataStructure = ParamUtil.getString(resourceRequest, "dataStructure", "{}");
		if(strDataStructure.isEmpty() ) {
			result.put( "error", SXUtil.translate(resourceRequest, "nothing-to-save") );
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
		
		JSONObject jsonDataStructure = null;
		String dataStructureCode = "";
		String dataStructureVersion = "";
		JSONObject jsonDataStructureDisplayName = null;
		JSONObject jsonDataStructureDescription = null;

		try {
			jsonDataStructure = JSONFactoryUtil.createJSONObject(strDataStructure);
			
			dataStructureCode = jsonDataStructure.getString("paramCode", "");
			dataStructureVersion = jsonDataStructure.getString("paramVersion", "");
			jsonDataStructureDisplayName = jsonDataStructure.getJSONObject("displayName");
			jsonDataStructureDescription = jsonDataStructure.getJSONObject("description");
		}  catch (JSONException e) {
			result.put( "error", SXUtil.translate(resourceRequest, "json-format-mismatched", new String[] {strDataStructure}) );
			
			SXPortletURLUtil.responeAjax(resourceResponse, result);
			
			return;
		}
			
		DataType dataType = null;
		
		String strFileFields = ParamUtil.getString(resourceRequest, "fileFields", "");
		//System.out.println("fileFields: " + strFileFields);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		long companyId = themeDisplay.getCompanyId();
		
		ServiceContext dataStructureSC = 
				ServiceContextFactory.getInstance(DataStructure.class.getName(), resourceRequest);
		if( dataTypeId > 0 ) {
			dataType = _dataTypeLocalService.getDataType(dataTypeId);
			
			if( Validator.isNotNull(dataType) ) {
				_dataTypeLocalService.setDataTypeStructure(dataTypeId, strDataStructure);
				
				result.put("message",SXUtil.translate(resourceRequest, "datastructure-for-the-datatype-is-saved", dataTypeId));
			} else {
				result.put("error", SXUtil.translate(resourceRequest, "cannot-find-datatype-to-save-datastructure", dataTypeId));
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
		} else if ( dataStructureId > 0 ) {
			_dataStructureLocalService.updateDataStructure(
					dataStructureId, 
					dataStructureCode, 
					dataStructureVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(jsonDataStructureDisplayName),
					SXLocalizationUtil.jsonToLocalizedMap(jsonDataStructureDescription), 
					strDataStructure, 
					WorkflowConstants.STATUS_APPROVED, 
					dataStructureSC);
			
			result.put("message",SXUtil.translate(resourceRequest, "datastructure-is-saved"));
		} else {
			// Check duplicated
			boolean duplicated = 
					_dataStructureLocalService.checkDuplicated(dataStructureCode, dataStructureVersion);
			
			if( duplicated ) {
				result.put( 
						"error", 
						SXUtil.translate(
								resourceRequest, 
								"datastructure-is-duplicated", 
								dataStructureCode, dataStructureVersion)
				);
				
				SXPortletURLUtil.responeAjax(resourceResponse, result);
				
				return;
			}
			
			DataStructure dataStructure = _dataStructureLocalService.addDataStructure(
					dataStructureCode, 
					dataStructureVersion, 
					SXLocalizationUtil.jsonToLocalizedMap(jsonDataStructureDisplayName), 
					SXLocalizationUtil.jsonToLocalizedMap(jsonDataStructureDescription), 
					strDataStructure, 
					WorkflowConstants.STATUS_APPROVED, 
					dataStructureSC);
			
			dataStructureId = dataStructure.getDataStructureId();
			
			result.put("message",SXUtil.translate(resourceRequest, "datastructure-is-added", new long[] {dataStructureId}));
		}
		
		String[] fileFields = strFileFields.isEmpty() ? new String[] {} : strFileFields.split(",");
		
		//Check and manage folders to save the data files
		UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest(resourceRequest);

		String stationXDataDir = PropsUtil.get("stationx-data-dir");
		//System.out.println("StationX Data Dir: " + stationXDataDir);
		
		Path referencePath = Paths.get( stationXDataDir+"/" + companyId + "/" +
				themeDisplay.getScopeGroupId() + "/referenceFiles");
		
		Path structurePath = Validator.isNotNull(dataType) ? 
					referencePath.resolve( dataType.getDataTypeCode() + "/"+dataType.getDataTypeVersion() )
					:
					referencePath.resolve(jsonDataStructure.getString("dataStructureCode") + "/" +
								jsonDataStructure.getString("dataStructureVersion") );
					
		JSONArray parameters = jsonDataStructure.getJSONArray("members");
		
		for(int i=0; i<parameters.length(); i++) {
			JSONObject parameter = parameters.getJSONObject(i);
			
			String paramCode = parameter.getString("paramCode");
			String paramVersion = parameter.getString("paramVersion");
			
			Path codeFolderPath = structurePath.resolve( paramCode );
			Path versionFolderPath = codeFolderPath.resolve( paramVersion );
			boolean hasReferenceFile = parameter.has("referenceFile");
			
			if(  hasReferenceFile ) {
				if( SXUtil.contains(fileFields, paramCode) ) {
					
					SXPortalUtil.emptyFolder(versionFolderPath, true);
					
					//JSONObject referenceFile = parameter.getJSONObject("referenceFile");
					
					//Path filePath = versionFolderPath.resolve(referenceFile.getString("name"));
					//System.out.println("Parameter has Reference File and changed to: " + filePath.toString());
					
					JSONArray errorFiles =  SXPortalUtil.saveUploadFieldFiles(uploadRequest, paramCode, versionFolderPath);
					
					if( errorFiles.length() > 0 ) {
						result.put("errorFiles", errorFiles);
						
						//System.out.println("Error files: " + errorFiles.toString(4));
					}
				}
				//else {
				//	System.out.println("Parameter has a reference file but not changed.");
				//}
			} else {
				//System.out.println("Parameter has not Reference File: " + paramCode);
				SXPortalUtil.deleteFolder(codeFolderPath);
			}
		}

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private ParameterLocalService _parameterLocalService;
	
	@Reference
	private UserLocalService _userLocalService;
}
