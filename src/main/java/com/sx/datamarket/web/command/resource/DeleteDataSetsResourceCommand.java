package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.ServiceContextUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(immediate = true,
    property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataSetExplorerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataSetEditorPortlet,
        "mvc.command.name=" + MVCCommand.RESOURCE_DELETE_DATASETS},
    service = MVCResourceCommand.class)
public class DeleteDataSetsResourceCommand extends BaseMVCResourceCommand {

  @Override
  protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
      throws Exception {

    System.out.println("DeleteDataSetsResourceCommand");
    String strDataSetIds = ParamUtil.getString(resourceRequest, "dataSetIds", "");
    System.out.println("strDataSetIds: " + strDataSetIds);

    JSONObject result = JSONFactoryUtil.createJSONObject();

    if (strDataSetIds.isEmpty()) {
      result.put("error", SXUtil.translate(resourceRequest, "dataset-ids-should-be-provided"));

      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    String[] strAryDataSetIds = strDataSetIds.split(",");

    ThemeDisplay themeDisplay = (ThemeDisplay) resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);

    JSONArray deletedDataSets = JSONFactoryUtil.createJSONArray();
    JSONArray failedDataSets = JSONFactoryUtil.createJSONArray();

    for (int i = 0; i < strAryDataSetIds.length; i++) {
      long dataSetId = Long.parseLong(strAryDataSetIds[i]);

      try {
        _dataSetLocalService.removeDataSet(dataSetId);

        deletedDataSets.put(dataSetId);
      } catch (PortalException e) {
        failedDataSets.put(dataSetId);
      }
    }

    if (deletedDataSets.length() > 0) {
      result.put("deletedDataSets", deletedDataSets);
    }

    if (failedDataSets.length() > 0) {
      result.put("failedDataSets", failedDataSets);
    }

    result.put("message",
        SXUtil.translate(resourceRequest, "datasets-are-deleted-successfully", strDataSetIds));

    SXPortletURLUtil.responeAjax(resourceResponse, result);
  }

  @Reference
  private DataSetLocalService _dataSetLocalService;

}
