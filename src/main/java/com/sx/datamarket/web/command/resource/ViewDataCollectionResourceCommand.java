package com.sx.datamarket.web.command.resource;

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
import com.sx.icecap.model.CollectionSetLink;
import com.sx.icecap.model.DataCollection;
import com.sx.icecap.model.DataSet;
import com.sx.icecap.service.ActionHistoryLocalService;
import com.sx.icecap.service.CollectionSetLinkLocalService;
import com.sx.icecap.service.DataCollectionLocalService;
import com.sx.icecap.service.DataCommentLocalService;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(immediate = true,
    property = {"javax.portlet.name=" + WebPortletKey.SXDataCollectionViewerPortlet,
        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
        "mvc.command.name=" + MVCCommand.RESOURCE_VIEW_DATACOLLECTION},
    service = MVCResourceCommand.class)
public class ViewDataCollectionResourceCommand extends BaseMVCResourceCommand {

  @Override
  protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
      throws Exception {
    System.out.println("ViewDataCollectionResourceCommand: ");

    JSONObject result = JSONFactoryUtil.createJSONObject();

    long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);

    if (dataCollectionId == 0) {
      result.put("error",
          SXUtil.translate(resourceRequest, "datacollection-id-should-be-specified-to-be-viewed"));
      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    ThemeDisplay themeDisplay = (ThemeDisplay) resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);

    DataCollection dataCollection = _dataCollectionLocalService.getDataCollection(dataCollectionId);
    result = dataCollection.toJSON(themeDisplay.getLocale());

    // Construct information of linked DataSets
    List<CollectionSetLink> collectionSetLinkList = _collectionSetLinkLocalService
        .getCollectionSetLinkListByCollection(dataCollection.getGroupId(), dataCollectionId);

    JSONArray dataSetArray = JSONFactoryUtil.createJSONArray();
    Iterator<CollectionSetLink> listIter = collectionSetLinkList.iterator();
    while (listIter.hasNext()) {
      CollectionSetLink link = listIter.next();
      DataSet dataSet = _dataSetLocalService.getDataSet(link.getDataSetId());

      dataSetArray.put(dataSet.toJSON(themeDisplay.getLocale()));
    }

    if (dataSetArray.length() > 0) {
      result.put("dataSetList", dataSetArray);
    }

    // Construct Comments

    // Construct Histories

    // Construct Structured Data Statistics

    System.out.println("ViewDataCollection result: " + result.toString(4));

    SXPortletURLUtil.responeAjax(resourceResponse, result);
  }

  @Reference
  private DataCollectionLocalService _dataCollectionLocalService;

  @Reference
  private CollectionSetLinkLocalService _collectionSetLinkLocalService;

  @Reference
  private DataSetLocalService _dataSetLocalService;

  @Reference
  private DataCommentLocalService _dataCommentLocalService;

  @Reference
  private ActionHistoryLocalService _actionHistoryLocalService;

  @Reference
  private StructuredDataLocalService _structuredDataLocalService;

}
