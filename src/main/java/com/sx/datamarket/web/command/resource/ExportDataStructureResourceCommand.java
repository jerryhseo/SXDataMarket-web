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
import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.ParameterLocalService;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.portlet.SXPortletURLUtil;
import java.util.ArrayList;
import java.util.List;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
			immediate = true,
			property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
					"javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
					"mvc.command.name=" + MVCCommand.RESOURCE_EXPORT_DATASTRUCTURE},
			service = MVCResourceCommand.class
)
public class ExportDataStructureResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource ( ResourceRequest resourceRequest, ResourceResponse resourceResponse )
				throws Exception {

		System.out.println ( "ExportDataStructureResourceCommand" );
		JSONObject result = JSONFactoryUtil.createJSONObject ();

		// Export data structure
		String dataStructureCode = ParamUtil.getString ( resourceRequest, "dataStructureCode", "" );
		String dataStructureVersion = ParamUtil.getString ( resourceRequest, "dataStructureVersion", "" );

		System.out.println ( "dataStructureCode: " + dataStructureCode );
		System.out.println ( "dataStructureVersion: " + dataStructureVersion );

		// Check duplicated
		boolean duplicated = _dataStructureLocalService.checkDuplicated ( dataStructureCode, dataStructureVersion );

		if ( duplicated ) {
			result.put (
						"error",
						SXLocalizationUtil.translate (
									resourceRequest,
									"datastructure-is-duplicated",
									dataStructureCode,
									dataStructureVersion
						)
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		String strDisplayName = ParamUtil.getString ( resourceRequest, "displayName", "" );
		System.out.println ( "strDisplayName: " + strDisplayName );
		String strDescription = ParamUtil.getString ( resourceRequest, "description", "" );
		System.out.println ( "strDescription: " + strDescription );

		String strDataStructure = ParamUtil.getString ( resourceRequest, "dataStructure", "{}" );
		System.out.println ( "strDataStructure: " + strDataStructure );

		if ( strDataStructure.isEmpty () ) {
			result.put ( "error", SXLocalizationUtil.translate ( resourceRequest, "nothing-to-export" ) );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		JSONObject jsonDataStructure = null;

		try {
			jsonDataStructure = JSONFactoryUtil.createJSONObject ( strDataStructure );

			jsonDataStructure.put ( "paramCode", dataStructureCode );
			jsonDataStructure.put ( "paramVersion", dataStructureVersion );
			jsonDataStructure.put ( "displayName", JSONFactoryUtil.createJSONObject ( strDisplayName ) );
			if ( !strDescription.isEmpty () ) {
				jsonDataStructure.put ( "description", JSONFactoryUtil.createJSONObject ( strDescription ) );
			}
		} catch ( JSONException e ) {
			result.put (
						"error",
						SXLocalizationUtil.translate ( resourceRequest, "json-format-mismatched", strDataStructure )
			);

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		ServiceContext dataStructureSC =
					ServiceContextFactory.getInstance ( DataStructure.class.getName (), resourceRequest );

		DataStructure dataStructure = _dataStructureLocalService.addDataStructure (
					dataStructureCode,
					dataStructureVersion,
					SXLocalizationUtil.jsonToLocalizedMap ( strDisplayName ),
					strDescription.isEmpty () ? null : SXLocalizationUtil.jsonToLocalizedMap ( strDescription ),
					strDataStructure,
					WorkflowConstants.STATUS_APPROVED,
					dataStructureSC
		);

		//
		String strFileFields = ParamUtil.getString ( resourceRequest, "fileFields", "" );

		String[] fileFields = strFileFields.isEmpty () ? new String[] {} : strFileFields.split ( "," );

		UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest ( resourceRequest );

		System.out.println ( "strFileFields: " + strFileFields );

		result.put ( "message", SXLocalizationUtil.translate ( resourceRequest, "datastructure-is-exported", 12345
		// dataStructure.getDataStructureId ()
		) );

		SXPortletURLUtil.responeAjax ( resourceResponse, result );
	}

	private List<JSONObject> _getAllReferencedFieldList ( JSONArray members ) {
		List<JSONObject> fieldList = new ArrayList<> ();

		return fieldList;
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
