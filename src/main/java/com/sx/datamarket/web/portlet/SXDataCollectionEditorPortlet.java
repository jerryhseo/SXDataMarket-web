package com.sx.datamarket.web.portlet;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCPortlet;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.ActionKey;
import com.sx.icecap.constant.WebKey;
import com.sx.icecap.constant.WebPortletKey;

import java.io.IOException;
import java.lang.reflect.Field;

import javax.portlet.Portlet;
import javax.portlet.PortletException;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;

import org.osgi.service.component.annotations.Component;

/**
 * @author jerry
 */
@Component(
	immediate = true,
	property = {
		"com.liferay.portlet.display-category=category.sx.datamarket",
		"com.liferay.portlet.header-portlet-css=/css/index.css",
		"com.liferay.portlet.instanceable=true",
		"com.liferay.portlet.add-default-resource=true",
		"javax.portlet.display-name=Data Collection Editor",
		"javax.portlet.init-param.template-path=/",
		"javax.portlet.init-param.view-template=/jsp/datacollection-editor.jsp",
		"javax.portlet.name=" + WebPortletKey.SXDataCollectionEditorPortlet,
		"javax.portlet.resource-bundle=content.Language",
		"javax.portlet.security-role-ref=power-user,user"
	},
	service = Portlet.class
)
public class SXDataCollectionEditorPortlet extends MVCPortlet {

	@Override
	public void doView(
			RenderRequest renderRequest, RenderResponse renderResponse)
		throws IOException, PortletException {
		
		long dataCollectionId = ParamUtil.getLong(renderRequest, WebKey.DATACOLLECTION_ID, 0);
		System.out.println("SXDataCollectionEditorPortlet - dataCollectionId: " + dataCollectionId);

		ThemeDisplay themeDisplay = (ThemeDisplay)renderRequest.getAttribute(WebKeys.THEME_DISPLAY);

		PermissionChecker permissionChecker = themeDisplay.getPermissionChecker();
		
		JSONArray permissions = JSONFactoryUtil.createJSONArray();
		Field[] fields = ActionKey.class.getDeclaredFields();
		for(int i=0; i<fields.length; i++) {
			Field field = fields[i];
			
			boolean hasPermission = true; //DataTypeResourcePermissionHelper.contains(permissionChecker, themeDisplay.getScopeGroupId(), field.getName());
			if (hasPermission) {
				permissions.put(field.getName());
			}
		}
		
		renderRequest.setAttribute("permissions", permissions);
		
		super.doView(renderRequest, renderResponse);
	}
}