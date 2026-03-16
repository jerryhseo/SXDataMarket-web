package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.util.SXLocalizationUtil;
import com.sx.util.portlet.SXPortletURLUtil;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
			immediate = true,
			property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
					"javax.portlet.name=" + WebPortletKey.SXDataSetExplorerPortlet,
					"javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
					"mvc.command.name=" + MVCCommand.RESOURCE_DELETE_DATASETS},
			service = MVCResourceCommand.class
)
public class DeleteDataSetsResourceCommand extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource ( ResourceRequest resourceRequest, ResourceResponse resourceResponse )
				throws Exception {

		System.out.println ( "DeleteDataSetsResourceCommand" );
		String strDataSetIds = ParamUtil.getString ( resourceRequest, "dataSetIds", "" );
		System.out.println ( "strDataSetIds: " + strDataSetIds );

		JSONObject result = JSONFactoryUtil.createJSONObject ();

		if ( strDataSetIds.isEmpty () ) {
			result.put ( "error", SXLocalizationUtil.translate ( resourceRequest, "dataset-ids-should-be-provided" ) );

			SXPortletURLUtil.responeAjax ( resourceResponse, result );

			return;
		}

		String[] strAryDataSetIds = strDataSetIds.split ( "," );

		JSONArray deletedDataSets = JSONFactoryUtil.createJSONArray ();
		JSONArray failedDataSets = JSONFactoryUtil.createJSONArray ();

		for ( int i = 0; i < strAryDataSetIds.length; i++ ) {
			long dataSetId = Long.parseLong ( strAryDataSetIds[i] );

			try {
				_dataSetLocalService.removeDataSet ( dataSetId );

				deletedDataSets.put ( dataSetId );
			} catch ( PortalException e ) {
				failedDataSets.put ( dataSetId );
			}
		}

		if ( deletedDataSets.length () > 0 ) {
			result.put ( "deletedDataSets", deletedDataSets );
		}

		if ( failedDataSets.length () > 0 ) {
			result.put ( "failedDataSets", failedDataSets );
		}

		result.put (
					"message",
					SXLocalizationUtil.translate ( resourceRequest, "datasets-are-deleted-successfully", strDataSetIds )
		);

		SXPortletURLUtil.responeAjax ( resourceResponse, result );
	}

	@Reference
	private DataSetLocalService _dataSetLocalService;

}
