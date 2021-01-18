/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import RulesResponse from "./views/rules/RulesResponse.jsx";
import RulesValidation from "./views/rules/RulesValidation.jsx";
import RulesCallback from "./views/rules/RulesCallback.jsx";
// import RulesForward from "./views/rules/RulesForward.jsx";
import OutboundRequest from "./views/outbound/OutboundRequest.jsx";
import Monitor from "./views/monitor/Monitor.jsx";
import MonitorDiagram from "./views/monitor/MonitorDiagram.jsx";
import Settings from "./views/settings/Settings.jsx";
import APIManagement from "./views/apis/APIManagement.jsx";
import Demos from "./views/demos/Demos.jsx";

import {
  DashboardOutlined,
  MonitorOutlined,
  FileDoneOutlined,
  ReadOutlined,
  ApiOutlined,
  SettingOutlined,
  FileSyncOutlined,
  FileSearchOutlined,
  SendOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

var routes = [
  {
    path: "/index",
    name: "Dashboard",
    icon: <DashboardOutlined />,
    component: MonitorDiagram,
    layout: "/admin"
  },
  {
    path: "/monitoring",
    name: "Monitoring",
    icon: <MonitorOutlined />,
    component: Monitor,
    layout: "/admin"
  },
  {
    path: "/rules_response",
    name: "Sync Response Rules",
    icon: <FileSyncOutlined />,
    component: RulesResponse,
    layout: "/admin"
  },
  {
    path: "/rules_validation",
    name: "Validation Rules",
    icon: <FileSearchOutlined />,
    component: RulesValidation,
    layout: "/admin"
  },
  // {
  //   path: "/rules_forward",
  //   name: "Forward Rules",
  //   icon: <UnorderedListOutlined />,
  //   component: RulesForward,
  //   layout: "/admin"
  // },
  {
    path: "/rules_callback",
    name: "Callback Rules",
    icon: <FileDoneOutlined />,
    component: RulesCallback,
    layout: "/admin"
  },
  {
    path: "/outbound_request",
    name: "Outbound Request",
    icon: <SendOutlined />,
    component: OutboundRequest,
    layout: "/admin"
  },
  {
    path: "/settings",
    name: "Settings",
    icon: <SettingOutlined />,
    component: Settings,
    layout: "/admin"
  },
  // {
  //   path: "/apidocs",
  //   name: "API Documentation",
  //   icon: <ReadOutlined />,
  //   component: APIDocs,
  //   layout: "/admin"
  // },
  {
    path: "/apimgmt",
    name: "API Management",
    icon: <ApiOutlined />,
    component: APIManagement,
    layout: "/admin"
  },
  {
    path: "/demo",
    name: "Demos",
    icon: <ExperimentOutlined />,
    component: Demos,
    layout: "/admin"
  },
];
export default routes;
