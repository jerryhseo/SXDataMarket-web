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
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(immediate = true,
    property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataCollectionExplorerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataCollectionEditorPortlet,
        "mvc.command.name=" + MVCCommand.RESOURCE_DELETE_DATACOLLECTIONS},
    service = MVCResourceCommand.class)
public class DeleteDataCollectionsResourceCommand extends BaseMVCResourceCommand {

  @Override
  protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
      throws Exception {

    System.out.println("DeleteDataCollectionsResourceCommand");
    String strDataCollectionIds = ParamUtil.getString(resourceRequest, "dataCollectionIds", "");
    System.out.println("strDataCollectionIds: " + strDataCollectionIds);

    JSONObject result = JSONFactoryUtil.createJSONObject();

    if (strDataCollectionIds.isEmpty()) {
      result.put("error",
          SXUtil.translate(resourceRequest, "datacollection-ids-should-be-provided"));

      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    String[] strAryDataCollectionIds = strDataCollectionIds.split(",");

    ThemeDisplay themeDisplay = (ThemeDisplay) resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);

    JSONArray deletedDataCollections = JSONFactoryUtil.createJSONArray();
    JSONArray failedDataCollections = JSONFactoryUtil.createJSONArray();

    for (int i = 0; i < strAryDataCollectionIds.length; i++) {
      long dataCollectionId = Long.parseLong(strAryDataCollectionIds[i]);

      try {
        _dataCollectionLocalService.removeDataCollection(themeDisplay.getScopeGroupId(),
            dataCollectionId);

        deletedDataCollections.put(dataCollectionId);
      } catch (PortalException e) {
        failedDataCollections.put(dataCollectionId);
      }
    }

    if (deletedDataCollections.length() > 0) {
      result.put("deletedDataCollections", deletedDataCollections);
    }

    if (failedDataCollections.length() > 0) {
      result.put("failedDataCollections", failedDataCollections);
    }

    result.put("message", SXUtil.translate(resourceRequest,
        "datacollections-are-deleted-successfully", strDataCollectionIds));

    SXPortletURLUtil.responeAjax(resourceResponse, result);
  }

  @Reference
  private DataCollectionLocalService _dataCollectionLocalService;

}
