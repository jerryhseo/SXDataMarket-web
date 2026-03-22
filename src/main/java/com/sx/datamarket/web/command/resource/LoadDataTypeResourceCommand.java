package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
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
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.spyglass.service.ScienceAppLocalService;
import com.sx.util.portlet.SXPortletURLUtil;
import java.util.Iterator;
import java.util.List;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
			immediate = true,
			property = {"javax.portlet.name=" + WebPortletKey.SXDataTypeEditorPortlet,
					"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
					"mvc.command.name=" + MVCCommand.RESOURCE_LOAD_DATATYPE},
			service = MVCResourceCommand.class
)
public class LoadDataTypeResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource ( ResourceRequest resourceRequest, ResourceResponse resourceResponse )
				throws Exception {
		System.out.println ( "LoadDataTypeResourceCommand: " );

		long dataTypeId = ParamUtil.getLong ( resourceRequest, "dataTypeId", 0 );
		boolean loadAvailableStructures = ParamUtil.getBoolean ( resourceRequest, "loadAvailableStructures", false );

		ThemeDisplay themeDisplay = ( ThemeDisplay ) resourceRequest.getAttribute ( WebKeys.THEME_DISPLAY );

		JSONObject result = JSONFactoryUtil.createJSONObject ();

		if ( dataTypeId == 0 ) {
			result.put ( "error", "datatype-id-should-be-specified-to-be-loaded" );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		boolean hasDataStructure = false;

		try {
			DataType dataType = _dataTypeLocalService.getDataType ( dataTypeId );

			JSONObject jsonDataType = dataType.toJSON ();
			hasDataStructure = _dataTypeLocalService.hasDataStructure ( dataTypeId );
			jsonDataType.put ( "hasStructure", hasDataStructure );

			result.put ( "dataType", jsonDataType );
		} catch ( PortalException e ) {
			result.put ( "error", e.getLocalizedMessage () );
			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		if ( loadAvailableStructures == true ) {
			JSONArray availableStructures = JSONFactoryUtil.createJSONArray ();

			List<DataStructure> dataStructureList = _dataStructureLocalService.getAllDataStructureList ();

			Iterator<DataStructure> iterator = dataStructureList.iterator ();
			while ( iterator.hasNext () ) {
				DataStructure dataStructure = iterator.next ();

				JSONObject item = JSONFactoryUtil.createJSONObject ();
				item.put ( "id", dataStructure.getDataStructureId () );
				item.put (
							"label",
							dataStructure.getDisplayName ( themeDisplay.getLocale () ) + " v."
										+ dataStructure.getDataStructureVersion ()
				);

				availableStructures.put ( item );
			}

			result.put ( "availableDataStructures", availableStructures );
		}

		SXPortletURLUtil.responeAjax ( resourceResponse, result );
	}

	@Reference
	private DataTypeLocalService _dataTypeLocalService;

	@Reference
	private DataStructureLocalService _dataStructureLocalService;

	@Reference
	private ScienceAppLocalService _scienceAppLocalService;
}
