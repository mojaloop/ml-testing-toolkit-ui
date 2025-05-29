/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
// Import components and icons separately
import RulesResponse from './views/rules/RulesResponse.jsx';
import RulesValidation from './views/rules/RulesValidation.jsx';
import RulesCallback from './views/rules/RulesCallback.jsx';
// import RulesForward from "./views/rules/RulesForward.jsx";
import OutboundRequest from './views/outbound/OutboundRequest.jsx';
import Monitor from './views/monitor/Monitor.jsx';
import Dashboard from './views/dashboard/Dashboard.jsx';
import Settings from './views/settings/Settings.jsx';
import ReportHistory from './views/outbound/ReportHistory.jsx';
import APIManagement from './views/apis/APIManagement.jsx';
import Demos from './views/demos/Demos.jsx';

import {
    DashboardOutlined,
    MonitorOutlined,
    FileDoneOutlined,
    ApiOutlined,
    SettingOutlined,
    FileSyncOutlined,
    FileSearchOutlined,
    SendOutlined,
    ExperimentOutlined,
    ReadOutlined,
} from '@ant-design/icons';

// Create route definitions without JSX
const routes = [
    {
        path: '/index',
        name: 'Dashboard',
        iconType: 'DashboardOutlined',
        component: Dashboard,
        layout: '/admin',
    },
    {
        path: '/monitoring',
        name: 'Monitoring',
        iconType: 'MonitorOutlined',
        component: Monitor,
        layout: '/admin',
    },
    {
        path: '/rules_response',
        name: 'Sync Response Rules',
        iconType: 'FileSyncOutlined',
        component: RulesResponse,
        layout: '/admin',
    },
    {
        path: '/rules_validation',
        name: 'Validation Rules',
        iconType: 'FileSearchOutlined',
        component: RulesValidation,
        layout: '/admin',
    },
    // {
    //   path: "/rules_forward",
    //   name: "Forward Rules",
    //   iconType: "UnorderedListOutlined",
    //   component: RulesForward,
    //   layout: "/admin"
    // },
    {
        path: '/rules_callback',
        name: 'Callback Rules',
        iconType: 'FileDoneOutlined',
        component: RulesCallback,
        layout: '/admin',
    },
    {
        path: '/outbound_request',
        name: 'Test Runner',
        iconType: 'SendOutlined',
        component: OutboundRequest,
        layout: '/admin',
    },
    {
        path: '/reports',
        name: 'Reports',
        iconType: 'ReadOutlined',
        component: ReportHistory,
        layout: '/admin',
    },
    {
        path: '/settings',
        name: 'Settings',
        iconType: 'SettingOutlined',
        component: Settings,
        layout: '/admin',
    },
    // {
    //   path: "/apidocs",
    //   name: "API Documentation",
    //   iconType: "ReadOutlined",
    //   component: APIDocs,
    //   layout: "/admin"
    // },
    {
        path: '/apimgmt',
        name: 'API Management',
        iconType: 'ApiOutlined',
        component: APIManagement,
        layout: '/admin',
    },
    {
        path: '/demo',
        name: 'Demos',
        iconType: 'ExperimentOutlined',
        component: Demos,
        layout: '/admin',
    },
];

// Export the routes
export default routes;
