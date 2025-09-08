package com.sx.datamarket.web.portlet;

import com.sx.icecap.constant.WebPortletKey;
import com.sx.icecap.exception.NoSuchDataStructureException;
import com.sx.icecap.exception.NoSuchTypeStructureLinkException;
import com.sx.icecap.model.DataStructure;
import com.sx.icecap.model.TypeStructureLink;
import com.sx.icecap.service.DataStructureLocalService;
import com.sx.icecap.service.TypeStructureLinkLocalService;
import com.liferay.frontend.js.loader.modules.extender.npm.NPMResolver;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCPortlet;
import com.liferay.portal.kernel.util.Localization;
import com.liferay.portal.kernel.util.LocalizationUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Validator;

import java.io.IOException;

import javax.portlet.Portlet;
import javax.portlet.PortletException;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author jerry
 */
@Component(
	immediate = true,
	property = {
		"com.liferay.portlet.display-category=category.sx.visualizers",
		"com.liferay.portlet.header-portlet-css=/css/index.css",
		"com.liferay.portlet.instanceable=true",
		"com.liferay.portlet.add-default-resource=true",
		"javax.portlet.display-name=Structured Data Editor",
		"javax.portlet.init-param.template-path=/",
		"javax.portlet.init-param.view-template=/jsp/structured-data-editor.jsp",
		"javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
		"javax.portlet.resource-bundle=content.Language",
		"javax.portlet.security-role-ref=power-user,user"
	},
	service = Portlet.class
)
public class SXStructuredDataEditorPortlet extends MVCPortlet {

	@Override
	public void doView(
			RenderRequest renderRequest, RenderResponse renderResponse)
		throws IOException, PortletException {
		
		long dataTypeId = ParamUtil.getLong(renderRequest, "dataTypeId", 0);
		long dataStructureId = ParamUtil.getLong(renderRequest, "dataStructureId", 0);
		
		try {
			TypeStructureLink typeStructureLink = _typeStructureLinkLocalService.getTypeStructureLink(dataTypeId);
			renderRequest.setAttribute("typeStructureLink", typeStructureLink);
			
			if( dataStructureId == 0 ) {
				dataStructureId = typeStructureLink.getDataStructureId();
			}
		} catch (PortalException e) {
			System.out.println("Manifest SXStructuredDataEditor without typeStructureLink.");
		}
		
		try {
			DataStructure dataStructure = _dataStructureLocalService.getDataStructure(dataStructureId);
			renderRequest.setAttribute("dataStructure", dataStructure);
		} catch (PortalException e) {
			System.out.println("Can't manifest SXStructuredDataEditor without DataStructure: " + dataStructureId);
			e.printStackTrace();
			
			throw new IOException(e.getMessage());
		}
		
		super.doView(renderRequest, renderResponse);
	}

	@Reference
	TypeStructureLinkLocalService _typeStructureLinkLocalService;
	
	@Reference
	DataStructureLocalService _dataStructureLocalService;

}