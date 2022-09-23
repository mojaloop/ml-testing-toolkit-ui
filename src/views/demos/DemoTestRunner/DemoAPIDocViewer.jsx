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
import React from 'react';
import _ from 'lodash';
import 'rapidoc';
import axios from 'axios';


// import { Row, Col, Tag, Dropdown, Menu, message, Input, Card, Button, Typography, Switch, Checkbox } from 'antd';

import { getConfig } from '../../../utils/getConfig';

// const { Title, Text } = Typography;

class DemoAPIDocViewer extends React.Component {
    constructor() {
        super();
        this.rapiDocRef = React.createRef();
        this.state = {
            apiVersion: {},
            openApiDefinition: null,
        };
    }

    componentWillUnmount = () => {
    };

    componentDidMount = async () => {
        // this.setState({ testCaseName: this.props.testCase.name });
        if(this.props.request && this.props.request.apiVersion) {
            await this.loadDocForRequest(this.props.request);
        }
    };

    loadDocForRequest = async request => {
        const apiVersion = request.apiVersion;
        const openApiDefinition = await this.getDefinition(apiVersion.type, apiVersion.majorVersion + '.' + apiVersion.minorVersion);
        await this.setState({ apiVersion, openApiDefinition });
        await this.rapiDocRef.current.loadSpec(openApiDefinition);
    }

    showDocForRequest = async request => {
        if(!_.isEqual(this.state.apiVersion, request.apiVersion)) {
            await this.loadDocForRequest(request);
        }
        const resourceLocation = request.method + '-' + request.operationPath.replaceAll('{', '-').replaceAll('}', '-');
        this.rapiDocRef.current.scrollTo(resourceLocation);
    }

    getDefinition = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/definition/${apiType}/${version}`);
        return response.data;
    };

    render() {
        return (
            <>
                <rapi-doc
                    ref={this.rapiDocRef}
                    render-style = 'view'
                    theme = 'light'
                    style = {{ height: '100vh', width: '100%' }}
                    allow-try = {false}
                    show-header	= {false}
                    show-info = {false}
                    allow-server-selection = {false}
                    allow-authentication = {false}
                    show-components = {true}
                    allow-search = {false}
                    allow-advanced-search = {false}
                    allow-spec-file-load = {false}
                />
            </>
        );
    }
}

export default DemoAPIDocViewer;
