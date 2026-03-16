package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.Validator;
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
import com.sx.util.SXFileUtil;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.List;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * 
 */
@Component(
			immediate = true,
			property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
					"javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
					"mvc.command.name=" + MVCCommand.RESOURCE_SAVE_STRUCTURED_DATA},
			service = MVCResourceCommand.class
)
public class SaveStructuredDataResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource ( ResourceRequest resourceRequest, ResourceResponse resourceResponse )
				throws Exception {

		System.out.println ( "SaveStructuredDataResourceCommand" );

		long dataCollectionId = ParamUtil.getLong ( resourceRequest, "dataCollectionId", 0 );
		long dataSetId = ParamUtil.getLong ( resourceRequest, "dataSetId", 0 );
		long dataTypeId = ParamUtil.getLong ( resourceRequest, "dataTypeId", 0 );
		long structuredDataId = ParamUtil.getLong ( resourceRequest, "structuredDataId", 0 );
		String strFileFields = ParamUtil.getString ( resourceRequest, "fileFields", "" );
		String strData = ParamUtil.getString ( resourceRequest, "data", "{}" );
		System.out.println ( "dataCollectionId: " + dataCollectionId );
		System.out.println ( "dataSetId: " + dataSetId );
		System.out.println ( "dataTypeId: " + dataTypeId );
		System.out.println ( "structuredDataId: " + structuredDataId );
		System.out.println ( "fileFields: " + strFileFields );
		System.out.println ( "Data: " + strData );

		JSONObject result = JSONFactoryUtil.createJSONObject ();

		if ( dataCollectionId == 0 || dataSetId == 0 || dataTypeId == 0 ) {
			result.put (
						"error",
						SXLocalizationUtil.translate (
									resourceRequest,
									"datacollection-id-dataset-id-datatype-id-should-be-provided-to-save-structured-data"
						)
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		DataCollection dataCollection = null;
		try {
			dataCollection = _dataCollectionLocalService.getDataCollection ( dataCollectionId );
		} catch ( PortalException e ) {
			result.put (
						"error",
						SXLocalizationUtil.translate ( resourceRequest, "cannot-find-datacollection", dataCollectionId )
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		DataSet dataSet = null;
		try {
			dataSet = _dataSetLocalService.getDataSet ( dataSetId );
		} catch ( PortalException e ) {
			result.put ( "error", SXLocalizationUtil.translate ( resourceRequest, "cannot-find-dataset", dataSetId ) );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		DataType dataType = null;
		try {
			dataType = _dataTypeLocalService.getDataType ( dataTypeId );
		} catch ( PortalException e ) {
			result.put (
						"error",
						SXLocalizationUtil.translate ( resourceRequest, "cannot-find-datatype", dataTypeId )
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		JSONObject dataStructure = null;
		try {
			dataStructure = _dataTypeLocalService.getDataStructureJSON ( dataTypeId );
		} catch ( JSONException e ) {
			result.put (
						"error",
						SXLocalizationUtil.translate ( resourceRequest, "cannot-find-datatype", dataTypeId )
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		JSONObject jsonData = null;
		if ( strData.isEmpty () ) {
			result.put ( "error", SXLocalizationUtil.translate ( resourceRequest, "there-is-no-data-to-be-saved" ) );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		try {
			jsonData = JSONFactoryUtil.createJSONObject ( strData );
			// System.out.println ( "JSON Data: " + jsonData.toString ( 4 ) );
		} catch ( JSONException e ) {
			result.put ( "error", "wrong-json-format-of-the-data" );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		String dataTypeCode = dataType.getDataTypeCode ();
		String dataTypeVersion = dataType.getDataTypeVersion ();

		ServiceContext dataSC = ServiceContextFactory.getInstance ( StructuredData.class.getName (), resourceRequest );

		StructuredData structuredData = null;

		if ( structuredDataId > 0 ) {
			structuredData = _structuredDataLocalService.updateStructuredData (
						structuredDataId,
						dataCollectionId,
						dataSetId,
						dataTypeId,
						false,
						0,
						0,
						strData,
						WorkflowConstants.STATUS_APPROVED,
						dataSC
			);
		} else {
			structuredData = _structuredDataLocalService.addStructuredData (
						dataCollectionId,
						dataSetId,
						dataTypeId,
						false,
						0,
						0,
						strData,
						WorkflowConstants.STATUS_DRAFT,
						dataSC
			);

			structuredDataId = structuredData.getDataCollectionId ();
		}

		Path sxDataFolderPath = SXFileUtil.getDataGroupFolderPath ( resourceRequest );
		sxDataFolderPath = sxDataFolderPath.resolve (
					dataCollection.getDataCollectionCode () + "/" + dataCollection.getDataCollectionVersion () + "/"
								+ dataSet.getDataSetCode () + "/" + dataSet.getDataSetVersion ()
		);

		Path dataFolderPath =
					sxDataFolderPath.resolve ( dataTypeCode + "/" + dataTypeVersion + "/" + structuredDataId );

		List<String> fileFieldNames = _dataTypeLocalService.getParamCodeList ( dataTypeId, new String[] {"File"} );

		if ( fileFieldNames.size () > 0 ) {
			List<String> groupFieldNames =
						_dataTypeLocalService.getParamCodeList ( dataTypeId, new String[] {"Group", "Grid"} );

			_refreshDataFiles ( dataFolderPath, fileFieldNames, groupFieldNames, jsonData );
		}

		if ( !strFileFields.isEmpty () ) {
			String[] fileFields = strFileFields.split ( "," );

			UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest ( resourceRequest );
			JSONArray errorFiles = JSONFactoryUtil.createJSONArray ();

			Iterator<String> keys = jsonData.keys ();
			while ( keys.hasNext () ) {
				String paramCode = keys.next ();

				Path paramCodeFolderPath = dataFolderPath.resolve ( paramCode );

				if ( SXUtil.contains ( fileFields, paramCode ) ) {
					SXFileUtil.emptyFolder ( paramCodeFolderPath, true );

					errorFiles = SXFileUtil.saveUploadFieldFiles ( uploadRequest, paramCode, paramCodeFolderPath );
				} else {
					SXFileUtil.deleteFolder ( paramCodeFolderPath );
				}
			}

			if ( errorFiles.length () > 0 ) {
				result.put ( "errorFiles", errorFiles );
			}
		}

		result.put ( "structuredDataId", structuredData.getStructuredDataId () );
		result.put (
					"message",
					SXLocalizationUtil
								.translate ( resourceRequest, "data-saved-as", structuredData.getStructuredDataId () )
		);

		SXPortletURLUtil.responeAjax ( resourceResponse, result );
	}

	private JSONObject _getFileFieldData ( JSONObject data, List<String> fileFieldNames, List<String> groupFieldNames )
				throws JSONException {
		JSONObject fieldDataList = JSONFactoryUtil.createJSONObject ();

		Iterator<String> keysIter = data.keys ();
		while ( keysIter.hasNext () ) {
			String paramCode = keysIter.next ();

			JSONObject fieldData = data.getJSONObject ( paramCode );

			if ( fileFieldNames.contains ( paramCode ) ) {
				fieldDataList.put ( paramCode, fieldData );
			} else if ( groupFieldNames.contains ( paramCode ) ) {
				JSONObject subFieldDataList = _getFileFieldData ( fieldData, fileFieldNames, groupFieldNames );

				if ( subFieldDataList.length () > 0 ) {
					fieldDataList = JSONUtil.merge ( fieldDataList, subFieldDataList );
				}
			}
		}

		return fieldDataList;
	}

	private void _refreshDataFiles (
				Path path, List<String> fileParamCodes, List<String> groupParamCodes, JSONObject data
	) throws JSONException {
		JSONObject fileFieldDataList = _getFileFieldData ( data, fileParamCodes, groupParamCodes );

		Iterator<String> iter = fileFieldDataList.keys ();
		while ( iter.hasNext () ) {
			String paramCode = iter.next ();

			Path fileFolderPath = path.resolve ( paramCode );

			List<String> files = SXFileUtil.lookUpFolder ( fileFolderPath );

			System.out.println (
						"[file field value " + paramCode + "]"
									+ fileFieldDataList.getJSONObject ( paramCode ).toString ( 4 )
			);
			System.out.println ( "--- files " );
			Iterator<String> fileIter = files.iterator ();
			while ( fileIter.hasNext () ) {
				String fileName = fileIter.next ();
				System.out.println ( "------ " + fileName );
			}
		}
	}

	private JSONObject _getValue ( JSONObject data, String paramCode, List<String> groupParamCodes ) {
		JSONObject value = null;

		Iterator<String> keyIter = data.keys ();
		while ( keyIter.hasNext () ) {
			String key = keyIter.next ();

			if ( groupParamCodes.contains ( key ) ) {
				JSONObject subData = data.getJSONObject ( key );
				value = _getValue ( subData, paramCode, groupParamCodes );

				if ( Validator.isNotNull ( value ) ) {
					return value;
				}
			} else {
				value = data.getJSONObject ( key );
			}
		}

		return value;
	}

	@Reference
	StructuredDataLocalService _structuredDataLocalService;

	@Reference
	DataCollectionLocalService _dataCollectionLocalService;

	@Reference
	DataSetLocalService _dataSetLocalService;

	@Reference
	DataTypeLocalService _dataTypeLocalService;
}
