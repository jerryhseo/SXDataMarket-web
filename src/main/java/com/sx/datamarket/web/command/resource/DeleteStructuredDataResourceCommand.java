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
import com.liferay.portal.kernel.util.PropsUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.DataTypeProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.model.DataType;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        "javax.portlet.name=" + WebPortletKey.SXDataTypeExplorerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataSetExplorerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXDataCollectionExplorerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXStructuredDataExplorerPortlet,
        "mvc.command.name=" + MVCCommand.RESOURCE_DELETE_STRUCTURED_DATA},
    service = MVCResourceCommand.class)
public class DeleteStructuredDataResourceCommand extends BaseMVCResourceCommand {

  @Override
  protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
      throws Exception {

    System.out.println("DeleteStructuredDataResourceCommand");
    long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
    long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
    long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
    String strDataIds = ParamUtil.getString(resourceRequest, "structuredDataIdList", "");
    System.out.println("dataCollectionId: " + dataCollectionId);
    System.out.println("dataSetId: " + dataSetId);
    System.out.println("dataTypeId: " + dataTypeId);
    System.out.println("strDataIds: " + strDataIds);

    JSONObject result = JSONFactoryUtil.createJSONObject();
    if (strDataIds.isEmpty()) {
      result.put("error",
          SXUtil.translate(resourceRequest, "data-id-should-be-specified-to-be-deleted"));

      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    DataCollection dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
    DataSet dataSet = _dataSetLocalService.getDataSet(dataSetId);
    DataType dataType = _dataTypeLocalService.getDataType(dataTypeId);

    ThemeDisplay themeDisplay = (ThemeDisplay) resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
    long companyId = themeDisplay.getCompanyId();
    String stationXDataDir = PropsUtil.get("stationx-data-dir");
    Path sxDataFolderPath =
        Paths.get(stationXDataDir + "/" + companyId + "/" + themeDisplay.getScopeGroupId());

    if (Validator.isNotNull(dataCollection)) {
      sxDataFolderPath = sxDataFolderPath.resolve(
          dataCollection.getDataCollectionCode() + "/" + dataCollection.getDataCollectionVersion());
    }

    if (Validator.isNotNull(dataSet)) {
      sxDataFolderPath =
          sxDataFolderPath.resolve(dataSet.getDataSetCode() + "/" + dataSet.getDataSetVersion());
    }

    if (Validator.isNotNull(dataType)) {
      sxDataFolderPath = sxDataFolderPath
          .resolve(dataType.getDataTypeCode() + "/" + dataType.getDataTypeVersion());
    }

    String[] strAryDataIds = strDataIds.split(",");

    for (int i = 0; i < strAryDataIds.length; i++) {
      sxDataFolderPath = sxDataFolderPath.resolve("structuredDataId");
      _structuredDataLocalService.removeStructuredData(Long.parseLong(strAryDataIds[i]),
          sxDataFolderPath);
    }

    result.put("message",
        SXUtil.translate(resourceRequest, "data-were-deleted-successfully", strAryDataIds));

    SXPortletURLUtil.responeAjax(resourceResponse, result);
  }

  @Reference
  private StructuredDataLocalService _structuredDataLocalService;


  @Reference
  DataCollectionLocalService _dataCollectionLocalService;

  @Reference
  DataSetLocalService _dataSetLocalService;

  @Reference
  DataTypeLocalService _dataTypeLocalService;

}
