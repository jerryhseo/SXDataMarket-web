package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.sx.icecap.constant.MVCCommand;
import com.sx.constant.StationXConstants;
import com.sx.constant.StationXWebKeys;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.util.portlet.SXPortletURLUtil;

import java.util.Iterator;
import java.util.List;
import java.util.Locale;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataStructureExplorerPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_SEARCH_DATASTRUCTURES
	    },
	    service = MVCResourceCommand.class
)
public class SearchDataStructuresResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("SearchDataStructuresResourceCommand");
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);

		int start = ParamUtil.getInteger(resourceRequest, StationXWebKeys.START, StationXConstants.DEFAULT_START);
		int delta = ParamUtil.getInteger(resourceRequest, StationXWebKeys.DELTA, StationXConstants.DEFAULT_DELTA);
		int end = start + delta - 1;
		long groupId = ParamUtil.getLong(resourceRequest, StationXWebKeys.GROUP_ID, themeDisplay.getScopeGroupId());
		long userId = ParamUtil.getLong(resourceRequest, StationXWebKeys.USER_ID, themeDisplay.getUserId());
		Locale locale = resourceRequest.getLocale();
		
		int status = ParamUtil.getInteger(resourceRequest, StationXWebKeys.STATUS, WorkflowConstants.STATUS_ANY);
		String filterBy = ParamUtil.getString(resourceRequest, "filterBy", "groupId");
		String keywords = ParamUtil.getString(resourceRequest, StationXWebKeys.KEYWORDS, "");
		
		List<DataStructure> dataStructureList = _dataStructureLocalService.getAllDataStructureList();
		
		//JSONArray result = JSONFactoryUtil.createJSONArray(dataStructureList);
		JSONObject result = JSONFactoryUtil.createJSONObject();
		
		JSONArray jsonDataStructureList = JSONFactoryUtil.createJSONArray();
		Iterator<DataStructure> iter = dataStructureList.iterator();
		while(iter.hasNext()) {
			DataStructure dataStructure = iter.next();
			
			jsonDataStructureList.put(dataStructure.toJSON(locale));
		}
		
		result.put("dataStructureList", jsonDataStructureList);

		SXPortletURLUtil.responeAjax(resourceResponse, result);
	}
	
	@Reference
	private DataStructureLocalService _dataStructureLocalService;
}
