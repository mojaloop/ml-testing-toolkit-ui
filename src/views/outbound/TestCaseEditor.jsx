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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import _ from 'lodash';

// core components

import { Spin, Select, Input, Row, Col, Steps, Tabs, Popover, Badge, Descriptions, Card, Button, Radio, Affix, Typography, Alert, Switch } from 'antd';

import { RightCircleOutlined, CodeFilled, HistoryOutlined, CaretLeftFilled } from '@ant-design/icons';
import 'jsoneditor-react/es/editor.min.css';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import RequestBuilder from './RequestBuilder';
import { FetchUtils } from './FetchUtils';
import TestAssertions from './TestAssertions';
import ServerLogsViewer from './ServerLogsViewer';
import { getConfig } from '../../utils/getConfig';
import { TTKColors } from '../../utils/styleHelpers';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-terminal';
import 'ace-builds/src-noconflict/theme-dracula';
import MetadataEditor from './MetadataEditor';

const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Text, Paragraph } = Typography;

class ResourceSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedItem: null,
        };
    }

    resourceOptions = [];

    getResourceOptions = () => {
        this.resourceOptions = [];
        if(this.props.openApiDefinition && this.props.openApiDefinition.paths) {
            for(const pathKey in this.props.openApiDefinition.paths) {
                for(const methodKey in this.props.openApiDefinition.paths[pathKey]) {
                    const itemKey = methodKey + ' ' + pathKey;
                    // Filter the methods based on the api type
                    switch (methodKey) {
                        case 'get':
                        case 'post':
                        case 'put':
                        case 'delete':
                        case 'update':
                            this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{itemKey}</Option>);
                            break;
                        default:
                            if(!(this.props.selectedApiVersion && this.props.selectedApiVersion.asynchronous)) {
                                this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{itemKey}</Option>);
                            }
                            break;
                    }
                }
            }
        }
        return this.resourceOptions;
    };

    getResourceValue = () => {
        // console.log(this.props.value)
        if(this.props.value) {
            return this.props.value.method + ' ' + this.props.value.path;
        } else {
            return null;
        }
    };

    render() {
        const resourceSelectHandler = eventKey => {
            const resourceArr = eventKey.split(' ');
            const resource = {
                method: resourceArr[0],
                path: resourceArr[1],
            };
            this.state.selectedItem = resource;
            // this.state.selectedItem = JSON.parse(eventKey)
            this.props.onSelect(resource);
            // console.log(this.props.openApiDefinition.paths[selectedItem.path][selectedItem.method])
        };

        return (
            <Select
                onChange={resourceSelectHandler}
                disabled={(!!this.props.value)}
                style={{ width: 300 }}
                placeholder='Select a resource'
                value={this.getResourceValue()}
            >
                {this.getResourceOptions()}
            </Select>
        );
    }
}

class ApiVersionSelector extends React.Component {
    apiVersionOptions = [];

    getApiVersionOptions = () => {
        this.apiVersionOptions = this.props.apiVersions.map((item, index) => {
            return (
                <Option key={index} value={JSON.stringify(item)}>{item.type + (item.caption ? ' ' + item.caption : '')} {item.majorVersion}.{item.minorVersion}</Option>
            );
        });
        return this.apiVersionOptions;
    };

    getApiVersionValue = () => {
        if(this.props.value) {
            return JSON.stringify(this.props.value);
        } else {
            return null;
        }
    };

    render() {
        const apiVersionSelectHandler = eventKey => {
            this.props.onSelect(JSON.parse(eventKey));
        };

        return (
            <>
                <Select
                    onChange={apiVersionSelectHandler}
                    disabled={(!!this.props.value)}
                    style={{ width: 300 }}
                    placeholder='Select an API'
                    value={this.getApiVersionValue()}
                >
                    {this.getApiVersionOptions()}
                </Select>
            </>
        );
    }
}

class RequestGenerator extends React.Component {
    constructor() {
        super();
        this.state = {
            origJson: [],
            curJson: {},
            description: '',
            request: {},
            conditions: [],
            pathMethodConditions: [],
            openApiDefinition: null,
            selectedResource: null,
            selectedApiVersion: null,
            callbackMap: {},
            apiVersions: [],
            renameRequestDialogVisible: false,
            newRequestDescription: '',
            isLoading: false,
            fetchDataFailed: false,
        };
    }

    componentDidMount = async () => {
        const apiVersions = await this.getApiVersions();
        this.state.apiVersions = apiVersions;
        this.fetchRequest();
    };

    fetchRequest = async () => {
        // Deep clone the input rule to a new object to work with (Copying without object references recursively)
        let selectedResource = null;
        if(this.props.request && this.props.request.operationPath && this.props.request.method) {
            selectedResource = {
                path: this.props.request.operationPath,
                method: this.props.request.method,
            };
        }

        let selectedApiVersion = null;
        let fetchAllApiData = {};
        let fetchDataFailed = false;
        if(this.props.request && this.props.request.apiVersion) {
            selectedApiVersion = this.props.request.apiVersion;
            this.onLoadingStart();
            try {
                fetchAllApiData = await FetchUtils.fetchAllApiData(selectedApiVersion.type, selectedApiVersion.majorVersion + '.' + selectedApiVersion.minorVersion, selectedApiVersion.asynchronous);
            } catch (err) {
                fetchDataFailed = true;
            }
            this.onLoadingEnd();
        }
        const newRequestDescription = this.props.request.description;
        this.setState({ fetchDataFailed, selectedResource, selectedApiVersion, newRequestDescription, ...fetchAllApiData });
    };

    getConditions = () => {
        return this.state.conditions;
    };

    getPathMethodConditions = () => {
        return this.state.pathMethodConditions;
    };

    getRequest = () => {
        return this.state.request;
    };
    // async componentWillMount() {
    //   await this.getDefinition()
    //   await this.getCallbackMap()
    // }

    getRule = () => {
        const rule = {
            description: this.state.description,
            conditions: {
                all: [...this.state.conditions, ...this.state.pathMethodConditions],
            },
            request: this.state.request,
        };
        return JSON.stringify(rule, null, 2);
    };

    handleConditionsChange = () => {
        this.forceUpdate();
        // this.setState({conditions});
    };

    handleRequestChange = request => {
        this.setState({ request });
        this.props.onChange(request);
    };

    getApiVersions = async () => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(apiBaseUrl + '/api/openapi/api_versions');
        return response.data;
    };

    apiVersionSelectHandler = async apiVersion => {
        const fetchAllApiData = await FetchUtils.fetchAllApiData(apiVersion.type, apiVersion.majorVersion + '.' + apiVersion.minorVersion, apiVersion.asynchronous);
        const request = this.props.request;
        request.apiVersion = apiVersion;
        this.props.onChange(request);
        this.setState({ selectedApiVersion: apiVersion, ...fetchAllApiData });
    };

    resourceSelectHandler = resource => {
        const request = this.props.request;
        request.operationPath = resource.path;
        request.path = resource.path;
        request.method = resource.method;
        this.props.onChange(request);
        this.setState({ selectedResource: resource, request });
    };

    getResourceDefinition = () => {
        if(this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method && this.state.openApiDefinition.paths[this.state.selectedResource.path]) {
            return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method];
        }
        return null;
    };

    getRootParameters = () => {
        let rootParams = [];
        if(this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method && this.state.openApiDefinition.paths[this.state.selectedResource.path]) {
            rootParams = this.state.openApiDefinition.paths[this.state.selectedResource.path].parameters;
        }
        return rootParams;
    };

    getCallbackObject = () => {
        let callbackObj = null;
        try {
            if(this.props.mode === 'validation') {
                callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method].errorCallback;
            } else {
                callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method].successCallback;
            }
        } catch (err) {
        }
        return callbackObj;
    };

    getCallbackRootParameters = () => {
        try {
            const callbackObj = this.getCallbackObject();
            return this.state.openApiDefinition.paths[callbackObj.path].parameters;
        } catch (err) {
            return [];
        }
    };

    getCallbackDefinition = () => {
        if(this.state.selectedResource) {
            try {
                const callbackObj = this.getCallbackObject();
                return this.state.openApiDefinition.paths[callbackObj.path][callbackObj.method];
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    handleDescriptionChange = newValue => {
        this.setState({ description: newValue });
    };

    onLoadingStart = () => {
        this.setState({ isLoading: true, fetchDataFailed: false });
    };

    onLoadingEnd = () => {
        this.setState({ isLoading: false });
    };

    render() {
        const renameRequestDialogContent = (
            <>
                <Input
                    placeholder='Description'
                    type='text'
                    value={this.state.newRequestDescription}
                    onChange={e => { this.setState({ newRequestDescription: e.target.value }); }}
                />
                <Button
                    className='text-right mt-2'
                    color='success'
                    href='#pablo'
                    onClick={() => {
                        this.props.request.description = this.state.newRequestDescription;
                        this.setState({ description: this.state.newRequestDescription, renameRequestDialogVisible: false });
                        this.props.onChange(this.props.request);
                    }}
                    size='sm'
                >
          Save
                </Button>
            </>
        );

        return (
            <Spin size='large' spinning={this.state.isLoading}>
                <Row>
                    <Col span={24}>
                        <Button
                            className='float-right'
                            type='primary'
                            danger
                            onClick={async () => {
                                await this.props.onDelete(this.props.request.id);
                                await this.fetchRequest();
                            }}
                        >
              Delete
                        </Button>
                        <Popover
                            className='float-right mr-2'
                            content={renameRequestDialogContent}
                            title='Enter new description'
                            trigger='click'
                            visible={this.state.renameRequestDialogVisible}
                            onVisibleChange={visible => this.setState({ renameRequestDialogVisible: visible })}
                        >
                            <Button>Rename</Button>
                        </Popover>
                        <Button
                            className='float-right mr-2'
                            type='dashed'
                            onClick={() => { this.props.onDuplicate(this.props.request.id); }}
                        >
              Duplicate
                        </Button>

                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={24}>
                        {
                            this.state.fetchDataFailed ? (
                                <Alert
                                    message="Error fetching the data about the API resource."
                                    description={
                                        <span>
                                            <Text strong>{this.state.selectedApiVersion.type + ':' + this.state.selectedApiVersion.majorVersion + '.' + this.state.selectedApiVersion.minorVersion}</Text>
                                            <Text class='ml-2' code>{this.state.selectedResource.method + ' ' + this.state.selectedResource.path}</Text>
                                        </span>
                                    }
                                    type="warning"
                                    showIcon
                                />
                            ) : (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td align='right'><b>API:</b></td>
                                            <td>
                                                <ApiVersionSelector value={this.state.selectedApiVersion} apiVersions={this.state.apiVersions} onSelect={this.apiVersionSelectHandler} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align='right'><b>Resource:</b></td>
                                            <td>
                                                <ResourceSelector value={this.state.selectedResource} selectedApiVersion={this.state.selectedApiVersion} openApiDefinition={this.state.openApiDefinition} onSelect={this.resourceSelectHandler} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )
                        }

                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={24}>
                        <RequestBuilder
                            request={this.props.request}
                            allRequests={this.props.allRequests}
                            inputValues={this.props.inputValues}
                            onChange={this.handleRequestChange}
                            resource={this.state.selectedResource}
                            resourceDefinition={this.getResourceDefinition()}
                            rootParameters={this.getRootParameters()}
                            openApiDefinition={this.state.openApiDefinition}
                            callbackMap={this.state.callbackMap}
                        />
                    </Col>
                </Row>
            </Spin>
        );
    }
}

class TestCaseEditor extends React.Component {
    constructor() {
        super();
        this.containerRef = React.createRef();
        this.state = {
            addNewRequestDialogVisible: false,
            newRequestDescription: '',
        };
    }

    componentWillUnmount = () => {
    };

    componentDidMount = () => {

    };

    replaceInputValues = (inputObject, inputValues) => {
        let resultObject;
        // Check whether inputObject is string or object. If it is object, then convert that to JSON string and parse it while return
        if(typeof inputObject === 'string') {
            resultObject = inputObject;
        } else if(typeof inputObject === 'object') {
            resultObject = JSON.stringify(inputObject);
        } else {
            return inputObject;
        }

        // Check the string for any inclusions like {$some_param}
        const matchedArray = resultObject.match(/{\$([^}]+)}/g);
        if(matchedArray) {
            matchedArray.forEach(element => {
                // Check for the function type of param, if its function we need to call a function in custom-functions and replace the returned value
                const splitArr = element.split('.');
                switch (splitArr[0]) {
                    case '{$inputs':
                    default:
                        const paramName = element.slice(9, element.length - 1);
                        const temp = _.get(this.props.inputValues, paramName);
                        if(temp) {
                            resultObject = resultObject.replace(element, temp);
                        }
                }
            });
        }

        if(typeof inputObject === 'object') {
            return JSON.parse(resultObject);
        } else {
            return resultObject;
        }
    };

    getObjectAsDescriptions = inputObject => {
        const inputItems = [];
        for(const key in inputObject) {
            inputItems.push(
                <>
                    <Descriptions.Item label={key}>
                        {inputObject[key]}
                    </Descriptions.Item>
                </>,
            );
        }
        return inputItems;
    };

    getPreRequestScriptConsoleLog = item => {
        if(item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution && item.status.additionalInfo.scriptsExecution.preRequest && item.status.additionalInfo.scriptsExecution.preRequest.consoleLog) {
            return item.status.additionalInfo.scriptsExecution.preRequest.consoleLog;
        }
        return null;
    };

    getPostRequestScriptConsoleLog = item => {
        if(item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution && item.status.additionalInfo.scriptsExecution.postRequest && item.status.additionalInfo.scriptsExecution.postRequest.consoleLog) {
            return item.status.additionalInfo.scriptsExecution.postRequest.consoleLog;
        }
        return null;
    };

    printConsoleLog = consoleLogArr => {
        let consoleLogText = '';
        if(consoleLogArr) {
            consoleLogArr.forEach(logItem => {
                if(logItem.length >= 3) {
                    if(logItem[1] == 'log') {
                        const outLog = logItem.slice(2);
                        consoleLogText += '\n/**** console.log ****/\n';
                        outLog.forEach(outObject => {
                            consoleLogText += JSON.stringify(outObject, null, 2) + '\n';
                        });
                    } else if(logItem[1] == 'executionError') {
                        consoleLogText += '\n/**** error ****/\n';
                        consoleLogText += JSON.stringify(logItem[2], null, 2) + '\n';
                    }
                }
            });
        }
        return consoleLogText;
    };

    prettyPrintCURL = curlCommand => {
        let outCURL = curlCommand;
        outCURL = outCURL.replace(/\s-/g, '\r\n  -');
        return outCURL;
    };

    getPreRequestScriptEnvironmentState = item => {
        if(item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution && item.status.additionalInfo.scriptsExecution.preRequest && item.status.additionalInfo.scriptsExecution.preRequest.environment) {
            return item.status.additionalInfo.scriptsExecution.preRequest.environment;
        }
        return null;
    };

    getPostRequestScriptEnvironmentState = item => {
        if(item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution && item.status.additionalInfo.scriptsExecution.postRequest && item.status.additionalInfo.scriptsExecution.postRequest.environment) {
            return item.status.additionalInfo.scriptsExecution.postRequest.environment;
        }
        return null;
    };

    getEnvironmentStateDescriptions = environmentArr => {
        return Object.entries(environmentArr || {}).map((item, index) => {
            return (
                <Descriptions.Item key={index} label={item[0]}>
                    <pre>{JSON.stringify(item[1], null, 2)}</pre>
                </Descriptions.Item>
            );
        });
    };

    getRequestGeneratorItems = (startIndex, endIndex) => {
        if(this.props.testCase.requests) {
            return this.props.testCase.requests.slice(startIndex, endIndex).map((item, index) => {
                const testStatus = item.status && item.tests && item.status.testResult && item.tests.assertions ? item.status.testResult.passedCount + '/' + item.tests.assertions.length : '';
                let testStatusColor = TTKColors.assertionFailed;
                if(item.status && item.status.progressStatus == 'SKIPPED') {
                    testStatusColor = TTKColors.assertionSkipped;
                } else if(item.status && item.tests && item.status.testResult && item.tests.assertions && item.status.testResult.passedCount === item.tests.assertions.length) {
                    testStatusColor = TTKColors.assertionPassed;
                }
                let requestShow;
                let suffixRequestBody = '';
                if(item.status && item.status.requestSent) {
                    requestShow = item.status.requestSent;
                    suffixRequestBody = ' Sent';
                } else {
                    requestShow = item;
                }
                return (
                    <Col span={24 / (this.props.testCase.requests.length ? (endIndex - startIndex) : 1)}>
                        <Tabs defaultActiveKey='1'>
                            <TabPane tab='Request' key='1'>
                                <>
                                    <Card size='small' title='Enabled' className='mb-2'>
                                        <Switch
                                            size='default'
                                            checked={!item.disabled}
                                            className='mt-1'
                                            onChange={enabled => {
                                                const disabled = !enabled;
                                                console.log(startIndex);
                                                console.log(index);
                                                console.log(disabled);
                                                this.props.testCase.requests[startIndex + index].disabled = disabled;
                                                this.forceUpdate();
                                            }}
                                        />
                                    </Card>
                                    <Card size='small' title='Meta Data' className='mb-2'>
                                        <MetadataEditor
                                            values={item.meta}
                                            onChange={this.props.onChange}
                                        />
                                    </Card>
                                    {
                                        item.status && item.status.progressStatus == 'SKIPPED'
                                            ? (
                                                <Alert
                                                    message='Request Skipped'
                                                    type='warning'
                                                    showIcon
                                                    className='mb-2'
                                                />
                                            )
                                            : null
                                    }
                                    {
                                        requestShow.headers
                                            ? (
                                                <Card size='small' title={'Header' + suffixRequestBody} className='mb-2'>
                                                    <Descriptions bordered column={1} size='small'>
                                                        {this.getObjectAsDescriptions(requestShow.headers)}
                                                    </Descriptions>
                                                </Card>
                                            )
                                            : null
                                    }
                                    {
                                        requestShow.body
                                            ? (
                                                <Card size='small' className='mb-2' title={'Body' + suffixRequestBody}>
                                                    <Text>
                                                        <pre style={{ overflow: 'scroll', 'white-space': 'pre-wrap' }}>
                                                            {JSON.stringify(requestShow.body, null, 2)}
                                                        </pre>
                                                    </Text>
                                                </Card>
                                            )
                                            : null
                                    }
                                    {
                                        item.status && item.status.additionalInfo && item.status.additionalInfo.curlRequest
                                            ? (
                                                <>
                                                    <Card size='small' className='mb-2' title='CURL command'>
                                                        <Paragraph
                                                            copyable={
                                                                {
                                                                    text: item.status.additionalInfo.curlRequest,
                                                                }
                                                            }
                                                        >
                                                            <pre
                                                                style={
                                                                    {
                                                                        overflow: 'scroll',
                                                                        'white-space': 'pre-wrap',
                                                                        backgroundColor: '#111111',
                                                                        color: 'white',
                                                                        minHeight: '50px',
                                                                        maxHeight: '300px',
                                                                    }
                                                                }
                                                            >
                                                                {this.prettyPrintCURL(item.status.additionalInfo.curlRequest)}
                                                            </pre>
                                                        </Paragraph>
                                                    </Card>
                                                </>
                                            )
                                            : null
                                    }
                                </>
                            </TabPane>
                            <TabPane tab='Editor' key='2'>
                                <RequestGenerator
                                    request={item}
                                    allRequests={this.props.testCase.requests}
                                    inputValues={this.props.inputValues}
                                    onChange={this.props.onChange}
                                    onDelete={this.handleRequestDelete}
                                    onDuplicate={this.handleRequestDuplicate}
                                />
                            </TabPane>
                            {
                                this.props.userConfig && this.props.userConfig.ADVANCED_FEATURES_ENABLED
                                    ? (
                                        <TabPane tab='Scripts' key='3'>
                                            <Row>
                                                <Col span={24}>
                                                    <Radio.Group
                                                        onChange={e => {
                                                            item.scriptingEngine = e.target.value;
                                                            this.props.onChange(item);
                                                        }}
                                                        value={item.scriptingEngine || 'postman'}
                                                    >
                                                        <Radio value='javascript'>Javascript</Radio>
                                                        <Radio value='postman'>Postman-script</Radio>
                                                    </Radio.Group>
                                                </Col>
                                            </Row>
                                            <Row className='mt-2'>
                                                <Col span={24}>
                                                    <Tabs type='card' defaultActiveKey='1'>
                                                        <TabPane tab='Pre-request' key='1'>
                                                            <AceEditor
                                                                ref='preReqScriptAceEditor'
                                                                mode='javascript'
                                                                theme='eclipse'
                                                                width='100%'
                                                                value={item.scripts && item.scripts.preRequest ? item.scripts.preRequest.exec.join('\n') : ''}
                                                                onChange={newScript => {
                                                                    if(!item.scripts) {
                                                                        item.scripts = {};
                                                                    }
                                                                    if(!item.scripts.preRequest) {
                                                                        item.scripts.preRequest = {};
                                                                    }
                                                                    item.scripts.preRequest.exec = newScript.split('\n');
                                                                    this.props.onChange(item);
                                                                }}
                                                                name='UNIQUE_ID_OF_DIV'
                                                                wrapEnabled
                                                                showPrintMargin
                                                                showGutter
                                                                tabSize={2}
                                                                enableBasicAutocompletion
                                                                enableLiveAutocompletion
                                                            />
                                                        </TabPane>
                                                        <TabPane tab='Post-request' key='2'>
                                                            <AceEditor
                                                                ref='postReqScriptAceEditor'
                                                                mode='javascript'
                                                                theme='eclipse'
                                                                width='100%'
                                                                value={item.scripts && item.scripts.postRequest ? item.scripts.postRequest.exec.join('\n') : ''}
                                                                onChange={newScript => {
                                                                    if(!item.scripts) {
                                                                        item.scripts = {};
                                                                    }
                                                                    if(!item.scripts.postRequest) {
                                                                        item.scripts.postRequest = {};
                                                                    }
                                                                    item.scripts.postRequest.exec = newScript.split('\n');
                                                                    this.props.onChange(item);
                                                                }}
                                                                name='UNIQUE_ID_OF_DIV'
                                                                wrapEnabled
                                                                showPrintMargin
                                                                showGutter
                                                                tabSize={2}
                                                                enableBasicAutocompletion
                                                                enableLiveAutocompletion
                                                            />
                                                        </TabPane>
                                                        {
                                                            item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution
                                                                ? (
                                                                    <TabPane
                                                                        tab={
                                                                            <span>
                                                                                <CodeFilled />
                                        Console Logs
                                                                            </span>
                                                                        } key='3'
                                                                    >
                                                                        <strong>Pre Request Log:</strong>
                                                                        <br />
                                                                        <Text>
                                                                            <pre
                                                                                style={
                                                                                    {
                                                                                        overflow: 'scroll',
                                                                                        'white-space': 'pre-wrap',
                                                                                        backgroundColor: '#111111',
                                                                                        color: 'yellow',
                                                                                        minHeight: '50px',
                                                                                        maxHeight: '300px',
                                                                                    }
                                                                                }
                                                                            >
                                                                                {this.printConsoleLog(this.getPreRequestScriptConsoleLog(item))}
                                                                            </pre>
                                                                        </Text>
                                                                        <br /><br />
                                                                        <strong>Post Request Log:</strong>
                                                                        <br />
                                                                        <Text>
                                                                            <pre
                                                                                style={
                                                                                    {
                                                                                        overflow: 'scroll',
                                                                                        'white-space': 'pre-wrap',
                                                                                        backgroundColor: '#111111',
                                                                                        color: 'yellow',
                                                                                        minHeight: '50px',
                                                                                        maxHeight: '300px',
                                                                                    }
                                                                                }
                                                                            >
                                                                                {this.printConsoleLog(this.getPostRequestScriptConsoleLog(item))}
                                                                            </pre>
                                                                        </Text>
                                                                    </TabPane>
                                                                )
                                                                : null
                                                        }
                                                        {
                                                            item.status && item.status.additionalInfo && item.status.additionalInfo.scriptsExecution
                                                                ? (
                                                                    <TabPane
                                                                        tab={
                                                                            <span>
                                                                                <HistoryOutlined />
                                        Environment State
                                                                            </span>
                                                                        } key='4'
                                                                    >
                                                                        <strong>Pre Request Environment State:</strong>
                                                                        <br />
                                                                        <Card className='mb-2'>
                                                                            {
                                                                                this.getPreRequestScriptEnvironmentState(item)
                                                                                    ? (
                                                                                        <Descriptions bordered column={1} size='small'>
                                                                                            {this.getEnvironmentStateDescriptions(this.getPreRequestScriptEnvironmentState(item))}
                                                                                        </Descriptions>
                                                                                    )
                                                                                    : (
                                                                                        <span>There are no items</span>
                                                                                    )
                                                                            }
                                                                        </Card>
                                                                        <br /><br />
                                                                        <strong>Post Request Environment State:</strong>
                                                                        <br />
                                                                        <Card className='mb-2'>
                                                                            {
                                                                                this.getPostRequestScriptEnvironmentState(item)
                                                                                    ? (
                                                                                        <Descriptions bordered column={1} size='small'>
                                                                                            {this.getEnvironmentStateDescriptions(this.getPostRequestScriptEnvironmentState(item))}
                                                                                        </Descriptions>
                                                                                    )
                                                                                    : (
                                                                                        <span>There are no items</span>
                                                                                    )
                                                                            }
                                                                        </Card>
                                                                    </TabPane>
                                                                )
                                                                : null
                                                        }
                                                    </Tabs>
                                                </Col>
                                            </Row>
                                        </TabPane>
                                    )
                                    : null
                            }
                            <TabPane tab={(<Badge offset={[20, 0]} style={{ backgroundColor: testStatusColor }} count={testStatus}>Tests</Badge>)} key='4'>
                                <TestAssertions
                                    request={item}
                                    allRequests={this.props.testCase.requests}
                                    inputValues={this.props.inputValues}
                                    onChange={this.props.onChange}
                                    onDelete={this.handleRequestDelete}
                                />
                            </TabPane>
                            {
                                item.status && item.status.response
                                    ? (
                                        <TabPane tab='Response' key='5'>
                                            {
                                                item.status.response
                                                    ? (
                                                        <>
                                                            <h4>Synchronous Response</h4>
                                                            <pre>{JSON.stringify(item.status.response, null, 2)}</pre>
                                                        </>
                                                    )
                                                    : null
                                            }
                                            {
                                                item.status.callback
                                                    ? (
                                                        <>
                                                            <h4>Callback</h4>
                                                            <pre>{JSON.stringify(item.status.callback, null, 2)}</pre>
                                                        </>
                                                    )
                                                    : null
                                            }
                                        </TabPane>
                                    )
                                    : null
                            }
                        </Tabs>
                        {/* {
              item.status && (item.status.state === 'waiting' || item.status.state === 'process')
              ? (<Skeleton paragraph={ {rows: 10} } active />)
              : (

              )
            } */}

                    </Col>
                );
            });
        } else {
            return null;
        }
    };

    getStepItems = (startIndex, endIndex) => {
        if(this.props.testCase.requests) {
            const stepItems = this.props.testCase.requests.slice(startIndex, endIndex).map(item => {
                return (
                    <Step status={item.status ? item.status.state : null} title={item.method} subTitle={item.operationPath} description={item.description} icon={<RightCircleOutlined />} disabled={item.disabled} />
                );
            });
            const spanCol = stepItems.length < 3 ? stepItems.length * 8 : 24;
            return (
                <Row>
                    <Col span={spanCol}>
                        <Steps current={-1} type='default' size='default'>
                            {stepItems}
                        </Steps>
                    </Col>
                </Row>
            );
        } else {
            return null;
        }
    };

    handleAddNewRequestClick = description => {
        if(!this.props.testCase.requests) {
            this.props.testCase.requests = [];
        }
        // Find highest request id to determine the new ID
        const maxId = +this.props.testCase.requests.reduce(function (m, k) { return k.id > m ? k.id : m; }, 0);

        this.props.testCase.requests.push({ id: maxId + 1, description });
        this.forceUpdate();
    };

    handleRequestDelete = requestId => {
        const deleteIndex = this.props.testCase.requests.findIndex(item => item.id == requestId);
        this.props.testCase.requests.splice(deleteIndex, 1);
        this.forceUpdate();
    };

    handleRequestDuplicate = requestId => {
        // Find the request to duplicate
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const { id, description, ...otherProps } = this.props.testCase.requests.find(item => item.id == requestId);
        // Find maximum ID for creating a new request
        const maxId = +this.props.testCase.requests.reduce(function (m, k) { return k.id > m ? k.id : m; }, 0);
        const clonedProps = JSON.parse(JSON.stringify(otherProps));

        this.props.testCase.requests.push({ id: maxId + 1, description: description + ' Copy', ...clonedProps });
        this.forceUpdate();
    };

    render() {
        const addNewRequestDialogContent = (
            <>
                <Input
                    placeholder='Enter description'
                    type='text'
                    value={this.state.newRequestDescription}
                    onChange={e => { this.setState({ newRequestDescription: e.target.value }); }}
                    onKeyDown={e => {
                        if(e.key === 'Escape') {
                            this.setState({ addNewRequestDialogVisible: false });
                        }
                    }}
                    onPressEnter={() => {
                        this.handleAddNewRequestClick(this.state.newRequestDescription);
                        this.setState({ addNewRequestDialogVisible: false });
                    }}
                />
                <Button
                    className='text-right mt-2'
                    color='success'
                    href='#pablo'
                    onClick={() => {
                        this.handleAddNewRequestClick(this.state.newRequestDescription);
                        this.setState({ addNewRequestDialogVisible: false });
                    }}
                    size='sm'
                >
          Add
                </Button>
            </>
        );

        const perRowContent = (startIndex, endIndex) => {
            return (
                <Row className='mt-4'>
                    <Col span={24}>
                        <Card title={this.getStepItems(startIndex, endIndex)}>
                            <Row gutter={16}>
                                {this.getRequestGeneratorItems(startIndex, endIndex)}
                            </Row>
                        </Card>
                    </Col>
                </Row>
            );
        };

        const getHorizontalGroups = () => {
            const rows = [];
            if(this.props.testCase.requests) {
                const rowCount = Math.abs(this.props.testCase.requests.length / 3);
                for(let i = 0; i < rowCount; i++) {
                    rows.push(perRowContent(i * 3, i * 3 + 3));
                }
            } else {
                return (<span>There are no requests</span>);
            }
            return rows;
        };

        return (
            <div
                style={{ height: '100%', 'overflow-y': 'auto' }}
                ref={div => {
                    this.containerRef = div;
                }}
            >
                <Row>
                    <Col span={24}>
                        <Affix target={() => this.containerRef}>
                            <Row>
                                <Col span={24}>
                                    <Card size='small'>
                                        <Row align='top'>
                                            <Col span={18}>
                                                <MetadataEditor
                                                    values={this.props.testCase.meta}
                                                    onChange={this.props.onChange}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Button
                                                    type='primary' className='mt-2 float-right' style={{ height: '40px', backgroundColor: '#718ebc' }} onClick={() => {
                                                        this.props.onOpenEnvironmentManager();
                                                    }}
                                                >
                                                    <CaretLeftFilled style={{ fontSize: '18px' }} /> <Text style={{ color: 'white', fontWeight: 'bold' }}>Environment Manager</Text>
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row align='top'>
                                            <Col span={24}>
                                                <div className='float-right'>
                                                    <Button
                                                        className='ml-2'
                                                        type='primary'
                                                        danger
                                                        onClick={() => {
                                                            this.props.onSend();
                                                        }}
                                                    >
                            Send
                                                    </Button>
                                                </div>
                                                <Popover
                                                    content={addNewRequestDialogContent}
                                                    title='Enter a description for the request'
                                                    trigger='click'
                                                    visible={this.state.addNewRequestDialogVisible}
                                                    onVisibleChange={visible => this.setState({ addNewRequestDialogVisible: visible })}
                                                >
                                                    <Button
                                                        type='primary'
                                                    >
                            Add New Request
                                                    </Button>
                                                </Popover>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </Affix>
                    </Col>
                </Row>
                {
                    this.props.traceID
                        ? <Row>
                            <Col span={24}>
                                <ServerLogsViewer traceID={this.props.traceID} userConfig={this.props.userConfig} />
                            </Col>
                        </Row>
                        : null
                }
                {
                    this.props.logs.length
                        ? <Row className='mt-4'>
                            <Col span={24}>
                                <Card>
                                    <ServerLogsViewer logs={this.props.logs} />
                                </Card>
                            </Col>
                        </Row>
                        : null
                }
                <Row>
                    <Col span={24}>
                        {getHorizontalGroups()}
                    </Col>
                </Row>
            </div>
        );
    }
}

export default TestCaseEditor;
