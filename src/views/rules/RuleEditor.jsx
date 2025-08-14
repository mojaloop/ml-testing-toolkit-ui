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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Select, message, Row, Col, Button, Typography, Input, Tabs, Tag, Popover, Descriptions, Radio } from 'antd';
import '../outbound/jsoneditor-react-compat';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import ConditionBuilder from './ConditionBuilder';
import EventBuilder from './EventBuilder';
import EventResponseBuilder from './EventResponseBuilder';
import { getConfig } from '../../utils/getConfig';
import AceEditor from 'react-ace';
import { FactSelect } from './BuilderTools.jsx';

const { Option } = Select;
const { Title } = Typography;

export class ConfigurableParameter extends React.Component {
    constructor() {
        super();
        this.state = {
            paramType: null,
            factData: null,
            selectedValueComponent: null,
        };

        // Set paramTypes Array
        this.paramTypes[0] = 'Environment';
    }

    paramTypes = [];

    inputValue = null;

    getParamTypeMenu = () => {
        return this.paramTypes.map((item, key) => {
            return (
                <Option key={key} value={key}>
                    {item}
                </Option>
            );
        });
    };

    handleParamTypeChange = async paramType => {
        this.setState({ paramType, factData: null, selectedValueComponent: null });
    };

    getValueComponent = () => {
        switch (this.state.paramType) {
            case 0:
                const inputOptionItems = [];
                for(const item in this.props.environment) {
                    inputOptionItems.push(
                        <Option key={item} value={item}>{item}</Option>,
                    );
                }
                return (
                    <>
                        <Select
                            placeholder='Please Select'
                            style={{ width: 200 }}
                            value={this.state.selectedValueComponent}
                            onChange={value => {
                                this.state.selectedValueComponent = value;
                                this.handleParamSelect(value);
                            }}
                        >
                            {inputOptionItems}
                        </Select>
                    </>
                );
                break;
            default:
                return null;
        }
    };

    handleParamSelect = paramValue => {
        this.props.onChange(paramValue);
    };

    getRequestFactComponent = () => {
        if(this.state.factData) {
            return (
                <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
            );
        } else {
            return null;
        }
    };

    render() {
        return (
            <Row>
                <Col>
                    <Select
                        placeholder='Please Select'
                        style={{ width: 200 }}
                        value={this.paramTypes[this.state.paramType]}
                        onSelect={this.handleParamTypeChange}
                    >
                        {this.getParamTypeMenu()}
                    </Select>
                </Col>
                <Col>
                    {this.getValueComponent()}
                </Col>
                <Col>
                    {this.getRequestFactComponent()}
                </Col>
            </Row>
        );
    }
}
class ResourceSelector extends React.Component {

    resourceOptions = [];

    getResourceOptions = () => {
        this.resourceOptions = [];
        if(this.props.openApiDefinition) {
            for(const pathKey in this.props.openApiDefinition.paths) {
                for(const methodKey in this.props.openApiDefinition.paths[pathKey]) {
                    const itemKey = JSON.stringify({
                        method: methodKey,
                        path: pathKey,
                    });
                    switch (methodKey) {
                        case 'get':
                        case 'post':
                            if(this.props.mode === 'response') {
                                this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>);
                            } else {
                                // if (pathKey === '/parties/{Type}/{ID}' || pathKey === '/quotes' || pathKey === '/transfers') {
                                if(this.props.callbackMap[pathKey]) {
                                    this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>);
                                }
                            }
                            break;
                        default:
                            if(this.props.mode === 'response') {
                                this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>);
                            }
                    }
                }
            }
        }
        return this.resourceOptions;
    };

    getResourceValue = () => {
        if(this.props.value) {
            return JSON.stringify(this.props.value);
        } else {
            return null;
        }
    };

    render() {
        const resourceSelectHandler = eventKey => {
            this.props.onSelect(JSON.parse(eventKey));
        };

        return (
            <>
                <Select
                    onChange={resourceSelectHandler}
                    disabled={(!!this.props.value)}
                    style={{ width: 300 }}
                    placeholder='Select a resource'
                    value={this.getResourceValue()}
                >
                    {this.getResourceOptions()}
                </Select>
            </>
        );
    }
}

class ApiVersionSelector extends React.Component {

    apiVersionOptions = [];

    getApiVersionOptions = () => {
        let apiVersionsFiltered;
        if(this.props.mode !== 'response') {
            apiVersionsFiltered = this.props.apiVersions.filter(item => item.asynchronous);
        } else {
            apiVersionsFiltered = this.props.apiVersions;
        }
        this.apiVersionOptions = apiVersionsFiltered.map((item, index) => {
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

class RulesEditor extends React.Component {
    constructor() {
        super();
        this.state = {
            origJson: [],
            curJson: {},
            description: '',
            event: {
                params: {},
            },
            scripts: null,
            scriptingEngine: null,
            conditions: [],
            pathMethodConditions: [],
            apiVersions: [],
            openApiDefinition: null,
            selectedResource: null,
            selectedApiVersion: null,
            callbackMap: {},
            responseMap: {},
            showConfigurableParameterDialog: false,
            configurableParameterSelected: '',
            environment: {},
            reloadEnvironmentLoading: false,
        };
    }

    componentDidMount = async () => {
        const apiVersions = await this.getApiVersions();

        // Deep clone the input rule to a new object to work with (Copying without object references recursively)
        const inputRule = JSON.parse(JSON.stringify(this.props.rule));
        let selectedResource = null;
        try {
            const pathObject = inputRule.conditions.all.find(item => (item.fact === 'operationPath'));
            const methodObject = inputRule.conditions.all.find(item => (item.fact === 'method'));
            if(pathObject && methodObject) {
                selectedResource = {
                    method: methodObject.value,
                    path: pathObject.value,
                };
            }
        } catch (err) {}

        let pathMethodConditions = [];
        let conditions = [];
        let scripts;
        let scriptingEngine;
        try {
            pathMethodConditions = inputRule.conditions.all.filter(item => {
                if(item.fact === 'method' || item.fact === 'operationPath') {
                    return true;
                } else {
                    return false;
                }
            });
            conditions = inputRule.conditions.all.filter(item => {
                if(item.fact === 'method' || item.fact === 'operationPath') {
                    return false;
                } else {
                    return true;
                }
            });
        } catch (err) {}

        let event = {
            method: null,
            path: null,
            params: {
                scripts: {},
            },
        };
        if(inputRule.event) {
            event = inputRule.event;
            if(event.params && event.params.scripts) {
                scripts = event.params.scripts.exec;
                scriptingEngine = event.params.scripts.scriptingEngine;
            }
        }

        let description = '';
        if(inputRule.description) {
            description = inputRule.description;
        }

        let selectedApiVersion = null;
        if(inputRule.apiVersion) {
            selectedApiVersion = inputRule.apiVersion;
            await this.fetchAllApiData(inputRule.apiVersion.type, inputRule.apiVersion.majorVersion + '.' + inputRule.apiVersion.minorVersion);
        }

        let environment;
        try {
            environment = await this.getEnvironment();
        } catch (err) {}

        this.setState({ description, conditions, pathMethodConditions, event, selectedResource, apiVersions, selectedApiVersion, scripts, scriptingEngine, environment });
    };

    handleReloadEnvironment = async () => {
        try {
            this.setState({ reloadEnvironmentLoading: true });
            const environment = await this.getEnvironment();
            this.setState({ environment, reloadEnvironmentLoading: false });
        } catch (err) {}
    };

    fetchAllApiData = async (apiType, version) => {
        const openApiDefinition = await this.getDefinition(apiType, version);
        let callbackMap = {};
        try {
            callbackMap = await this.getCallbackMap(apiType, version);
        } catch (err) {}

        let responseMap = {};
        try {
            responseMap = await this.getResponseMap(apiType, version);
        } catch (err) {}

        this.setState({ openApiDefinition, callbackMap, responseMap });
    };

    getConditions = () => {
        return this.state.conditions;
    };

    getPathMethodConditions = () => {
        return this.state.pathMethodConditions;
    };

    getEvent = () => {
        return this.state.event;
    };
    // async componentWillMount() {
    //   await this.getDefinition()
    //   await this.getCallbackMap()
    // }

    getRule = () => {
        const rule = {
            description: this.state.description ? this.state.description : this.state.selectedResource.method + ' ' + this.state.selectedResource.path,
            apiVersion: this.state.selectedApiVersion,
            conditions: {
                all: [...this.state.conditions, ...this.state.pathMethodConditions],
            },
            event: { ...this.state.event },
        };
        rule.event.params.scripts = {
            exec: (this.state.scripts && this.state.scripts.length === 1 && this.state.scripts[0].trim() === '') ? undefined : this.state.scripts,
            scriptingEngine: this.state.scriptingEngine || 'postman',
        };
        return JSON.stringify(rule, null, 2);
    };

    handleConditionsChange = () => {
        this.forceUpdate();
        // this.setState({conditions});
    };

    handleEventChange = event => {
        this.setState({ event });
    };

    getApiVersions = async () => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(apiBaseUrl + '/api/openapi/api_versions');
        return response.data;
    };

    getDefinition = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/definition/${apiType}/${version}`);
        // console.log(response.data)
        return response.data;
        // this.setState(  { openApiDefinition: response.data } )
    };

    getResponseMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/response_map/${apiType}/${version}`);
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };

    getCallbackMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/callback_map/${apiType}/${version}`);
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };

    getEnvironment = async () => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/objectstore/inboundEnvironment`);
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };

    clearEnvironment = async () => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.delete(`${apiBaseUrl}/api/objectstore/inboundEnvironment`);
        this.setState({ environment: {} });
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };

    handleSave = () => {
        // const newJson = this.refs.editor.jsonEditor.get()
        // // this.setState( { curJson: [ ...newJson ]} )
        const rule = JSON.parse(this.getRule());
        if(!rule.event.type) {
            message.error(({ content: 'rule event type is required', key: 'ruleSaveProgress', duration: 4 }));
            return;
        }
        this.props.onSave(rule);
    };

    apiVersionSelectHandler = apiVersion => {
        this.fetchAllApiData(apiVersion.type, apiVersion.majorVersion + '.' + apiVersion.minorVersion);
        // this.state.pathMethodConditions = []
        // this.state.pathMethodConditions.push({
        //   fact: 'operationPath',
        //   operator: 'equal',
        //   value: apiVersion.path
        // })
        // this.state.pathMethodConditions.push({
        //   fact: 'method',
        //   operator: 'equal',
        //   value: apiVersion.method
        // })
        // const newApiVersion = {
        //   type: apiVersion.type,
        //   version: apiVersion.majorVersion+'.'+apiVersion.minorVersion
        // }
        this.setState({ selectedApiVersion: apiVersion });
    };

    resourceSelectHandler = resource => {
        this.state.pathMethodConditions = [];
        this.state.pathMethodConditions.push({
            fact: 'operationPath',
            operator: 'equal',
            value: resource.path,
        });
        this.state.pathMethodConditions.push({
            fact: 'method',
            operator: 'equal',
            value: resource.method,
        });
        this.setState({ selectedResource: resource });
    };

    getResourceDefinition = () => {
        if(this.state.selectedResource && this.state.openApiDefinition) {
            return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method];
        }
        return null;
    };

    getRootParameters = () => {
        let rootParams = [];
        if(this.state.selectedResource && this.state.openApiDefinition) {
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

    getResponseObject = () => {
        let responseObj = null;
        try {
            responseObj = this.state.responseMap[this.state.selectedResource.path][this.state.selectedResource.method].response;
        } catch (err) {
        }
        return responseObj;
    };

    getResponses = () => {
        if(this.state.selectedResource) {
            try {
                return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method].responses;
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    handleDescriptionChange = newValue => {
        this.setState({ description: newValue });
    };

    handleAddConfigParam = newValue => {
        this.setState({ configurableParameterSelected: `pm.environment.get('${newValue}')` });
    };

    handleConfigParamCopyToClipboard = () => {
        navigator.clipboard.writeText(this.state.configurableParameterSelected);
        message.success('Copied to clipboard');
    };

    getEnvironmentStateDescriptions = () => {
        return Object.keys(this.state.environment).map((key, index) => {
            return (
                <Descriptions.Item key={index} label={key}>
                    <pre>{JSON.stringify(this.state.environment[key], null, 2)}</pre>
                </Descriptions.Item>
            );
        });
    };

    render() {
        const content = (
            <>
                <Row>
                    <Col>
                        <ConfigurableParameter
                            onChange={this.handleAddConfigParam}
                            environment={this.state.environment}
                        />
                    </Col>
                </Row>
                {
                    this.state.configurableParameterSelected
                        ? (
                            <Row className='mt-4 text-center'>
                                <Col>
                Click below to copy <br />
                                    <Tag color='geekblue'><a onClick={this.handleConfigParamCopyToClipboard}>{this.state.configurableParameterSelected}</a></Tag>
                                </Col>
                            </Row>
                        )
                        : null
                }
            </>
        );
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Row className='bg-white border-0 align-items-center'>
                            <Col span={4}>
                                <Title level={4} className='mb-0'>Rule #{this.props.rule && this.props.rule.ruleId}</Title>
                            </Col>
                            <Col span={12} className='text-center'>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td align='right'><b>API:</b></td>
                                            <td>
                                                <ApiVersionSelector value={this.state.selectedApiVersion} apiVersions={this.state.apiVersions} mode={this.props.mode} onSelect={this.apiVersionSelectHandler} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align='right'><b>Resource:</b></td>
                                            <td>
                                                <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.state.openApiDefinition} mode={this.props.mode} callbackMap={this.state.callbackMap} onSelect={this.resourceSelectHandler} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Col>
                            <Col span={8}>
                                <Button
                                    className='float-right'
                                    type='primary'
                                    onClick={this.handleSave}
                                >
                  Save
                                </Button>
                            </Col>
                        </Row>
                        <Row className='mt-2'>
                            <Col span={24}>
                                <Tabs defaultActiveKey='rules'>
                                    <Tabs.TabPane tab='Rules' key='rules'>
                                        <Title level={4} className='text-muted'>
                      Conditions
                                        </Title>
                                        <div className='ps-4'>
                                            <ConditionBuilder
                                                conditions={this.getConditions()}
                                                pathMethodConditions={this.getPathMethodConditions()}
                                                onChange={this.handleConditionsChange}
                                                openApiDefinition={this.state.openApiDefinition}
                                                resource={this.state.selectedResource}
                                                resourceDefinition={this.getResourceDefinition()}
                                                rootParameters={this.getRootParameters()}
                                                environment={this.state.environment}
                                            />
                                        </div>
                                        <hr className='mt-4' />
                                        <Title level={4} className='text-muted mb-4'>
                      Event
                                        </Title>
                                        <div className='ps-4'>
                                            {
                                                this.props.mode === 'response'
                                                    ? (
                                                        <EventResponseBuilder
                                                            event={this.getEvent()}
                                                            onChange={this.handleEventChange}
                                                            resource={this.state.selectedResource}
                                                            resourceDefinition={this.getResourceDefinition()}
                                                            rootParameters={this.getRootParameters()}
                                                            responses={this.getResponses()}
                                                            callbackRootParameters={this.getCallbackRootParameters()}
                                                            responseObject={this.getResponseObject()}
                                                            mode={this.props.mode}
                                                        />
                                                    )
                                                    : (
                                                        <EventBuilder
                                                            event={this.getEvent()}
                                                            onChange={this.handleEventChange}
                                                            resource={this.state.selectedResource}
                                                            resourceDefinition={this.getResourceDefinition()}
                                                            rootParameters={this.getRootParameters()}
                                                            callbackDefinition={this.getCallbackDefinition()}
                                                            callbackRootParameters={this.getCallbackRootParameters()}
                                                            callbackObject={this.getCallbackObject()}
                                                            mode={this.props.mode}
                                                        />
                                                    )
                                            }
                                        </div>

                                        <hr className='mt-4' />
                                        {/* Description */}
                                        <Title level={4} className='text-muted mb-4'>Rule Details</Title>
                                        <div className='ps-lg-4'>
                                            <label>Rule Description</label>
                                            <Input.TextArea
                                                className='form-control-alternative'
                                                placeholder='A few words about the rule ...'
                                                onChange={e => this.handleDescriptionChange(e.target.value)}
                                                rows='4'
                                                value={this.state.description}
                                                type='textarea'
                                            />
                                        </div>
                                    </Tabs.TabPane>
                                    <Tabs.TabPane tab='Scripts' key='scripts'>
                                        <Row>
                                            <Col span={24}>
                                                <Radio.Group
                                                    onChange={e => {
                                                        this.setState({ scriptingEngine: e.target.value });
                                                    }}
                                                    value={this.state.scriptingEngine || 'postman'}
                                                >
                                                    <Radio value='javascript'>Javascript</Radio>
                                                    <Radio value='postman'>Postman-script</Radio>
                                                </Radio.Group>
                                            </Col>
                                        </Row>
                                        <Row className='mt-2'>
                                            <Col span={24}>
                                                <div className='ps-lg-4'>
                                                    <AceEditor
                                                        ref={ref => { this.refs['preReqScriptAceEditor'] = ref; }}
                                                        mode='javascript'
                                                        theme='eclipse'
                                                        width='100%'
                                                        value={this.state.scripts ? this.state.scripts.join('\n') : ''}
                                                        onChange={newScript => {
                                                            this.state.scripts = newScript.split('\n');
                                                        }}
                                                        name='UNIQUE_ID_OF_DIV'
                                                        wrapEnabled
                                                        showPrintMargin
                                                        showGutter
                                                        tabSize={2}
                                                        enableBasicAutocompletion
                                                        enableLiveAutocompletion
                                                    />
                                                    <Popover content={content} title='Select a Configurable Parameter' trigger='click'>
                                                        <Button color='secondary' size='sm'>Add Configurable Params</Button>
                                                    </Popover>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Tabs.TabPane>
                                    <Tabs.TabPane tab='Environment' disabled={Object.keys(this.state.environment).length === 0} key={Object.keys(this.state.environment).length === 0 ? undefined : 'environment'}>
                                        <Descriptions bordered column={1} size='small'>
                                            {this.getEnvironmentStateDescriptions()}
                                        </Descriptions>
                                        <br />
                                        <Button type='default' loading={this.state.reloadEnvironmentLoading} className='me-2' size='sm' onClick={this.handleReloadEnvironment}>
                      Reload environment
                                        </Button>
                                        <Button
                                            type='primary' danger size='sm' onClick={() => {
                                                this.clearEnvironment();
                                                this.handleConditionsChange();
                                            }}
                                        >Clear environment
                                        </Button>
                                    </Tabs.TabPane>
                                </Tabs>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>
        );
    }
}

export default RulesEditor;
