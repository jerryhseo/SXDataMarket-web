package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.StructuredData;
import com.sx.icecap.service.DataSetLocalService;
import com.sx.icecap.service.DataTypeLocalService;
import com.sx.icecap.service.StructuredDataLocalService;
import com.sx.util.SXUtil;
import com.sx.util.portlet.SXPortletURLUtil;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(immediate = true,
    property = {"javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
        "javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
        "mvc.command.name=" + MVCCommand.RESOURCE_LOAD_STRUCTURED_DATA},
    service = MVCResourceCommand.class)
public class LoadStructuredDataResourceCommand extends BaseMVCResourceCommand {

  @Override
  protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
      throws Exception {

    long structuredDataId = ParamUtil.getLong(resourceRequest, WebKey.STRUCTURED_DATA_ID, 0);

    System.out.println("--- Start LoadStructuredDataResourceCommand:  ");
    System.out.println("structuredDataId: " + structuredDataId);

    JSONObject result = JSONFactoryUtil.createJSONObject();

    if (structuredDataId == 0) {
      result.put("error",
          SXUtil.translate(resourceRequest, "structured-data-id-should-be-specified"));
      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    StructuredData structuredData = _structuredDataLocalService.getStructuredData(structuredDataId);
    if (Validator.isNull(structuredData)) {
      result.put("error", SXUtil.translate(resourceRequest, "cannot-find-structured-data",
          new long[] {structuredDataId}));
      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }
    
    long dataCollectionId = ParamUtil.getLong(resourceRequest, "dataCollectionId", 0);
    long dataSetId = ParamUtil.getLong(resourceRequest, "dataSetId", 0);
    long dataTypeId = ParamUtil.getLong(resourceRequest, "dataTypeId", 0);
    System.out.println("dataCollectionId: " + dataCollectionId);
    System.out.println("dataSetId: " + dataSetId);
    System.out.println("dataTypeId: " + dataTypeId);

    if (!(dataCollectionId == structuredData.getDataCollectionId()
        && dataSetId == structuredData.getDataSetId()
        && dataTypeId == structuredData.getDataTypeId())) {

      result.put("error", SXUtil.translate(resourceRequest, "structured-data-info-mismatch-to-load",
          dataCollectionId, dataSetId, dataTypeId));
      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }

    JSONObject dataStructure = null;

    if (_dataTypeLocalService.hasDataStructure(dataTypeId)) {
      dataStructure = _dataTypeLocalService.getDataStructureJSON(dataTypeId);

      if (Validator.isNull(dataStructure)) {
        result.put("error", SXUtil.translate(resourceRequest,
            "datatype-structure-doesnt-exist-for-the-data", new long[] {structuredDataId}));
        SXPortletURLUtil.responeAjax(resourceResponse, result);

        return;
      }

      result.put("structuredData", structuredData.toJSON());
      result.put("dataStructure", dataStructure);
    } else {
      result.put("error", SXUtil.translate(resourceRequest, "datatype-doesnt-exist-for-the-data",
          new long[] {structuredDataId}));
      SXPortletURLUtil.responeAjax(resourceResponse, result);

      return;
    }
    
    if( dataSetId == 0 ) {
      
    }

    System.out.println("Result: " + result.toString(4));
    SXPortletURLUtil.responeAjax(resourceResponse, result);

    // System.out.println("--- End LoadStructuredDataResourceCommand" );
  }

  @Reference
  private StructuredDataLocalService _structuredDataLocalService;

  @Reference
  private DataSetLocalService _dataSetLocalService;
  
  @Reference
  private DataTypeLocalService _dataTypeLocalService;

}
