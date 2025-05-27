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
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { App } from 'antd';

import AdminLayout from './layouts/Admin.jsx';
import { getConfig } from './utils/getConfig';

import './index.css';
import 'antd/dist/reset.css';

import Login from './views/login/Login.jsx';
import MobileSimulator from './views/demos/MobileSimulator/MobileSimulator.jsx';
import PayeeAppSimulator from './views/demos/PayeeAppSimulator/PayeeApp';
import PayeeMobileSimulator from './views/demos/PayeeAppSimulator/PayeeMobile';
import PayerMobileSimulator from './views/demos/PayerAppSimulator/PayerMobile';
import DemoTestRunner from './views/demos/DemoTestRunner/DemoTestRunner.jsx';
import DemoMonitoring from './views/demos/DemoMonitoring/DemoMonitoring.jsx';
import PISPDemo from './views/demos/PISPDemo/MobileSimulator';

import axios from 'axios';

// Add this before any other React code
if(process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if(typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
            return;
        }
        originalConsoleError(...args);
    };
}

console.log('Mojaloop Testing Toolkit UI is loading...');

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <App>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/mobile-simulator" element={<MobileSimulator />} />
                    <Route path="/payee-app-simulator" element={<PayeeAppSimulator />} />
                    <Route path="/payee-mobile-simulator" element={<PayeeMobileSimulator />} />
                    <Route path="/payer-mobile-simulator" element={<PayerMobileSimulator />} />
                    <Route path="/demo-test-runner" element={<DemoTestRunner />} />
                    <Route path="/demo-monitoring" element={<DemoMonitoring />} />
                    <Route path="/pisp-demo" element={<PISPDemo />} />
                    <Route path="/admin/*" element={<AdminLayout />} />
                    <Route path="/" element={<Navigate to="/admin/outbound_request" replace />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </Router>
        </App>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
