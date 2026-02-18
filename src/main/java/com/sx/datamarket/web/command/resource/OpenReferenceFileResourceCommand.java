package com.sx.datamarket.web.command.resource;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.sx.icecap.constant.MVCCommand;
import com.sx.icecap.constant.WebPortletKey;
import com.sx.util.SXPortalUtil;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import javax.portlet.PortletException;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.osgi.service.component.annotations.Component;

@Component(
	    immediate = true,
	    property = {
	        "javax.portlet.name=" + WebPortletKey.SXCollectionManagementPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXStructuredDataEditorPortlet,
	        "javax.portlet.name=" + WebPortletKey.SXDataStructureBuilderPortlet,
	        "mvc.command.name="+MVCCommand.RESOURCE_OPEN_REFERENCE__FILE
	    },
	    service = MVCResourceCommand.class
)
public class OpenReferenceFileResourceCommand extends BaseMVCResourceCommand{

	@Override
	protected void doServeResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse)
			throws Exception {

		System.out.println("OpenReferenceFileResourceCommand");
		String strFilePath = ParamUtil.getString(resourceRequest, "filePath", "");
		String fileType = ParamUtil.getString(resourceRequest, "fileType", "");
		String disposition = ParamUtil.getString(resourceRequest, "disposition", "inline"); // inline or attachement
		
		
		System.out.println("filePath: " + strFilePath);
		System.out.println("fileType: " + fileType);
		System.out.println("disposition: " + disposition);
		
		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(WebKeys.THEME_DISPLAY);
		Path filePath = SXPortalUtil.getDataDirPath(
				themeDisplay.getCompanyId(), 
				themeDisplay.getScopeGroupId(), 
				"referenceFiles/" + strFilePath);
		
		System.out.println("filePath: " + filePath.toString());
		
		if( !Files.exists(filePath) ) {
			throw new FileNotFoundException(filePath.toString());
		}
		
		try {
            resourceResponse.setContentType(fileType);

            OutputStream out = resourceResponse.getPortletOutputStream();
            Files.copy(filePath, out);
            out.flush();
        } catch (IOException e) {
            throw new PortletException("Unable to download file", e);
        }
	}
}
