package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataStructureException;
import com.sx.icecap.exception.NoSuchTypeStructureLinkException;
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataComment;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.model.SetTypeLink;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.model.TypeVisualizerLink;
import com.sx.icecap.service.ActionHistoryLocalService;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.SetTypeLinkLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.sx.icecap.service.TypeVisualizerLinkLocalService;
import com.sx.spyglass.model.ScienceApp;
import com.sx.spyglass.service.ScienceAppLocalService;
import com.sx.util.SXLocalizationUtil;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.portlet.PortletException;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXDataTypeViewerPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_VIEW_DATATYPE
	    },
	    service = MVCResourceCommand.class
)
public class ViewDataTypeResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		System.out.println("ViewDataTypeResourceCommand: " );
		
		JSONObject result = null;
		
		long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
		long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
		long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
		
		System.out.println("dataCollectionId: " + dataCollectionId);
		System.out.println("dataSetId: " + dataSetId);
		System.out.println("dataTypeId: " + dataTypeId);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		
		if( dataCollectionId > 0 && dataTypeId > 0 && dataTypeId > 0) {
			DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);
			result = dataType.toJSON(themeDisplay.getLocale());
			
			// Construct information of linked DataTypes
			TypeStructureLink typeStructureLink =  
					_typeStructureLinkLocalService.getTypeStructureLink(dataTypeId);
			
			result.put("linkId", typeStructureLink.getPrimaryKey());
			
			DataStructure dataStructure = 
					_dataStructureLocalService.getDataStructure(typeStructureLink.getDataStructureId());
			
			JSONArray jsonStructureArray = JSONFactoryUtil.createJSONArray();

			JSONObject jsonStructure = dataStructure.toJSON(themeDisplay.getLocale());
			
			String[] keys = {"dataStructureId", "paramCode", "paramVersion", "displayName", "description"};
			
			for( int i=0; i<keys.length; i++) {
				String key = keys[i];
				
				if(jsonStructure.has(key)) {
					JSONObject element = JSONFactoryUtil.createJSONObject();
					
					String fieldValue = jsonStructure.getString(key);
					if( !fieldValue.isEmpty()) {
						String fieldName = "";
						if(i == 0)	fieldName = "id";
						else if(i == 1)	fieldName = "code";
						else if(i == 2)	fieldName = "version";
						else if(i == 3)	fieldName = "display-name";
						else if(i == 4)	fieldName = "description";
						
						element.put("fieldName", fieldName);
						element.put("fieldValue", fieldValue);
						
						jsonStructureArray.put(element);
					}
				}
			}
				
			result.put("dataStructure",  jsonStructureArray);
			// Construct Comments 
			
			// Construct Histories
			
			// Construct Structured Data Statistics
			
			System.out.println("ViewDataType result: " + result.toString(4));
		}

		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(result.toJSONString());
		pw.flush();
		pw.close();
	}
	
	@Reference
	private TypeStructureLinkLocalService _typeStructureLinkLocalService;
	
	@Reference
	private DataTypeLocalService _dataTypeLocalService;
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
	
	@Reference
	private DataCommentLocalService _dataCommentLocalService;
	
	@Reference
	private ActionHistoryLocalService _actionHistoryLocalService;
	
	@Reference
	private StructuredDataLocalService _structuredDataLocalService;
	
}
