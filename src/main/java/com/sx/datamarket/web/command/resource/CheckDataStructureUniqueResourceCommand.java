package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.DataStructureProperties;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataStructureException;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.service.DataStructureLocalService;

import java.io.PrintWriter;

import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
		property = {
				"javax.portlet.name=" + WebPortletKey.SXDataWorkbenchPortlet,
				"javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
				"mvc.command.name=" + MVCCommand.RESOURCE_CHECK_DATASTRUCTURE_UNIQUE
		},
		service = MVCResourceCommand.class
)
public class CheckDataStructureUniqueResourceCommand extends BaseMVCResourceCommand {
	@Reference
	DataStructureLocalService _dataStructureLocalService;
	
	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {
		
		String dataStructureCode = ParamUtil.getString(resourceRequest, "dataStructureCode", "");
		String dataStructureVersion = ParamUtil.getString(resourceRequest, "dataStructureVersion", "");
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		JSONObject response = null;
		DataStructure dataStructure = null;
		try{
			dataStructure =_dataStructureLocalService.getDataStructure(dataStructureCode, dataStructureVersion);
			
			response = dataStructure.toJSON(themeDisplay.getLocale());
		} catch( NoSuchDataStructureException e) {
			response = JSONFactoryUtil.createJSONObject();
		}
		
		PrintWriter pw = resourceResponse.getWriter();
		pw.write(response.toString());
		pw.flush();
		pw.close();
		
	}

}
