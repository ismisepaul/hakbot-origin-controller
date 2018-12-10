/*
 * This file is part of Hakbot Origin Controller.
 *
 * Hakbot Origin Controller is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * Hakbot Origin Controller is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Hakbot Origin Controller. If not, see http://www.gnu.org/licenses/.
 */
package io.hakbot.providers.appspider;

import javax.xml.namespace.QName;

public abstract class AppSpiderConstants {

    static final QName SERVICE_NAME = new QName("http://ntobjectives.com/webservices/", "NTOService");
    static final String PROP_INSTANCE_ALIAS = "appspider.instance.alias";
    static final String PLUGIN_ID = "appspider";
    static final String APPSPIDER_PROPERTIES = "src/main/resources/appspider.properties";

}
