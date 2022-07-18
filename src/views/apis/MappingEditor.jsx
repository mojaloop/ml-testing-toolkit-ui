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
 --------------
 ******/
import React from 'react';
import _ from 'lodash';
import { Select, Row, Col, Button, Typography, Input, Tabs } from 'antd';
import 'jsoneditor-react/es/editor.min.css';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import '../rules/fixAce.css';
import EventBuilder from '../rules/EventBuilder';

const { Option } = Select;
const { Title } = Typography;

class ResourceSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            disabled: false,
        };
    }

    resourceOptions = [];

    componentDidMount = () => {

    };

    getResourceOptions = () => {
        this.resourceOptions = [];
        if(this.props.value && this.props.value.path && this.props.value.method) {
            const itemKey = JSON.stringify({
                method: this.props.value.method,
                path: this.props.value.path,
            });
            this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{itemKey.method} {itemKey.path}</Option>);
        } else if(this.props.openApiDefinition) {
            if(this.props.mappingType) {
                for(const pathKey in this.props.openApiDefinition.paths) {
                    for(const methodKey in this.props.openApiDefinition.paths[pathKey]) {
                        const itemKey = JSON.stringify({
                            method: methodKey,
                            path: pathKey,
                        });
                        if(methodKey === 'put' && (pathKey.startsWith(this.props.selectedResource.path))) {
                            switch (this.props.mappingType) {
                                case 'successCallback':
                                    if(!pathKey.endsWith('/error')) {
                                        this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>);
                                    }
                                    break;
                                case 'errorCallback':
                                    if(pathKey.endsWith('/error')) {
                                        this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            } else {
                Object.keys(this.props.openApiDefinition.paths).forEach(path => {
                    if(!path.endsWith('/error')) {
                        Object.keys(this.props.openApiDefinition.paths[path]).forEach(method => {
                            if(method != 'put' && method != 'parameters') {
                                if(this.props.callbackMap && this.props.callbackMap[path] && this.props.callbackMap[path][method]) {

                                } else {
                                    const itemKey = JSON.stringify({
                                        method,
                                        path,
                                    });
                                    this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{method} {path}</Option>);
                                }
                            }
                        });
                    }
                });
            }
        } else {
            console.log('ERROR');
        }
        return this.resourceOptions;
    };

    getResourceValue = () => {
        const value = (this.props.value && this.props.value.method && this.props.value.path) ? (this.props.value.method + ' ' + this.props.value.path) : null;
        this.state.disabled = !!value;
        return value;
    };

    render() {
        const resourceSelectHandler = eventKey => {
            this.props.onSelect(JSON.parse(eventKey), this.props.mappingType || 'successCallback');
        };

        return (
            <>
                <Select
                    onChange={resourceSelectHandler}
                    disabled={this.state.disabled}
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

class MappingEditor extends React.Component {
    constructor() {
        super();
        this.state = {
            mode: null,
            description: '',
            selectedResource: {
                data: {},
            },
            showConfigurableParameterDialog: false,
            configurableParameterSelected: '',
            selectedCallbackResource: {},
            event: {
                successCallback: {
                    params: {},
                },
                errorCallback: {
                    params: {},
                },
            },
        };
    }

    componentDidMount = () => {
        const selectedResource = JSON.parse(JSON.stringify(this.props.selectedResource));

        const mapping = this.props.mapping;

        const description = this.props.description || '';

        const fspid = selectedResource.data.fspid;

        this.setState({ selectedResource, mapping, description, fspid });
    };

    getEvent = callbackType => {
        const event = this.state.event[callbackType] || {};

        if(!event.params) {
            event.params = {};
        }

        if(_.isEmpty(this.state.selectedResource.data)) {
            return event;
        }

        switch (callbackType) {
            case 'successCallback': {
                event.type = 'FIXED_CALLBACK';
                break;
            }
            case 'errorCallback': {
                event.type = 'FIXED_ERROR_CALLBACK';
                break;
            }
            default:
        }
        let mappingEvent;
        if(this.state.selectedResource && this.state.selectedResource.data && this.state.selectedResource.data[callbackType]) {
            mappingEvent = JSON.parse(JSON.stringify(this.state.selectedResource.data[callbackType]));
        } else {
            mappingEvent = {};
        }

        event.method = mappingEvent.method;
        event.path = mappingEvent.path;
        event.pathPattern = mappingEvent.pathPattern;
        event.params.body = mappingEvent.bodyOverride;
        event.params.headers = mappingEvent.headerOverride;

        return event;
    };

    handleEventChange = (event, mappingType) => {
        this.state.event[mappingType] = event;
        this.forceUpdate();
    };

    handleSave = () => {
        this.state.selectedResource.data.fspid = this.state.fspid;
        Object.keys(this.state.event).forEach(mappingType => {
            if(!_.isEmpty(this.state.event[mappingType].params)) {
                const params = JSON.parse(JSON.stringify(this.state.event[mappingType].params));
                this.state.selectedResource.data[mappingType].bodyOverride = params.body;
                this.state.selectedResource.data[mappingType].headerOverride = params.headers;
            }
        });
        this.props.onSave(this.state.selectedResource);
    };

    resourceSelectHandler = newSelectedResource => {
        const selectedResource = {
            method: newSelectedResource.method,
            path: newSelectedResource.path,
            data: {
                fspid: '',
                successCallback: {},
                errorCallback: {},
            },
        };
        this.setState({ selectedResource });
        this.forceUpdate();
    };

    callbackResourceSelectHandler = (selectedCallbackResource, mappingType) => {
        this.state.selectedResource.data[mappingType] = {
            method: selectedCallbackResource.method,
            path: selectedCallbackResource.path,
        };
        this.forceUpdate();
    };

    getResourceDefinition = () => {
        if(this.state.selectedResource && this.state.selectedResource.path && this.state.selectedResource.method && this.props.openApiDefinition) {
            return this.props.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method];
        }
        return null;
    };

    getRootParameters = () => {
        let rootParams = [];
        if(this.state.selectedResource && this.state.selectedResource.path && this.props.openApiDefinition) {
            rootParams = this.props.openApiDefinition.paths[this.state.selectedResource.path].parameters;
        }
        return rootParams;
    };

    getResourceMappingByType = mappingType => {
        if(this.state.selectedResource && this.state.selectedResource.data) {
            return this.state.selectedResource.data[mappingType];
        }
        return {};
    };

    getCallbackRootParameters = callbackType => {
        try {
            const callbackObj = this.state.selectedResource.data[callbackType];
            return this.props.openApiDefinition.paths[callbackObj.path].parameters;
        } catch (err) {
            return [];
        }
    };

    getCallbackDefinition = callbackType => {
        try {
            const callbackObj = this.state.selectedResource.data[callbackType];
            return this.props.openApiDefinition.paths[callbackObj.path][callbackObj.method];
        } catch (err) {
            return {};
        }
    };

    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Row className='bg-white border-0 align-items-center'>
                            <Col span={16} className='text-center'>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td align='right'><b>Resource:</b></td>
                                            <td>
                                                <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.props.openApiDefinition} mode={this.props.mode} callbackMap={this.state.mapping} onSelect={this.resourceSelectHandler} />
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
                        <Row className='bg-white border-0 align-items-center'>
                            <Col span={24}>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td align='right'><b>FSPID:</b></td>
                                            <td>
                                                <Input
                                                    className='float-left'
                                                    placeholder='Value'
                                                    value={this.state.fspid}
                                                    onChange={e => {
                                                        this.setState({ fspid: e.target.value });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Col>
                        </Row>
                        {
                            (this.state.selectedResource)
                                ? (
                                    <Row className='mt-2'>
                                        <Col span={24}>
                                            {
                                                (this.props.mode === 'callback' && this.state.selectedResource.data.successCallback)
                                                    ? (
                                                        <Tabs defaultActiveKey='successCallback'>
                                                            <Tabs.TabPane tab='Success Callback' key='successCallback'>
                                                                <Title level={4} className='text-muted mb-4'>
                                  Success Callback
                                                                </Title>
                                                                <div className='pl-4'>
                                                                    <table>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align='right'><b>Callback Resource:</b></td>
                                                                                <td>
                                                                                    <ResourceSelector value={this.state.selectedResource.data.successCallback} openApiDefinition={this.props.openApiDefinition} mode={this.props.mode} callbackMap={this.state.mapping} onSelect={this.callbackResourceSelectHandler} mappingType='successCallback' selectedResource={this.state.selectedResource} />
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td align='right'><b>Path Pattern:</b></td>
                                                                                <td>
                                                                                    <Input
                                                                                        className='float-left'
                                                                                        placeholder='pathPattern'
                                                                                        value={this.state.selectedResource.data.successCallback.pathPattern}
                                                                                        onChange={e => {
                                                                                            this.state.selectedResource.data.successCallback.pathPattern = e.target.value;
                                                                                            this.forceUpdate();
                                                                                        }}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <EventBuilder
                                                                        event={this.getEvent('successCallback')}
                                                                        disableEventSelect
                                                                        onChange={event => { this.handleEventChange(event, 'successCallback'); }}
                                                                        resource={this.state.selectedResource}
                                                                        resourceDefinition={this.getResourceDefinition()}
                                                                        rootParameters={this.getRootParameters()}
                                                                        callbackDefinition={this.getCallbackDefinition('successCallback')}
                                                                        callbackRootParameters={this.getCallbackRootParameters('successCallback')}
                                                                        callbackObject={this.getResourceMappingByType('successCallback')}
                                                                        mode='callback'
                                                                        isMappingEditor
                                                                    />
                                                                </div>
                                                            </Tabs.TabPane>
                                                            <Tabs.TabPane tab='Error Callback' key='errorCallback'>
                                                                <Title level={4} className='text-muted mb-4'>
                                  Error Callback
                                                                </Title>
                                                                <div className='pl-4'>
                                                                    <table>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align='right'><b>Callback Resource:</b></td>
                                                                                <td>
                                                                                    <ResourceSelector value={this.state.selectedResource.data.errorCallback} openApiDefinition={this.props.openApiDefinition} mode={this.props.mode} callbackMap={this.state.mapping} onSelect={this.callbackResourceSelectHandler} mappingType='errorCallback' selectedResource={this.state.selectedResource} />
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td align='right'><b>Path Pattern:</b></td>
                                                                                <td>
                                                                                    <Input
                                                                                        className='float-left'
                                                                                        placeholder='pathPattern'
                                                                                        value={this.state.selectedResource.data.errorCallback.pathPattern}
                                                                                        onChange={e => {
                                                                                            this.state.selectedResource.data.errorCallback.pathPattern = e.target.value;
                                                                                            this.forceUpdate();
                                                                                        }}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <EventBuilder
                                                                        event={this.getEvent('errorCallback')}
                                                                        onChange={event => { this.handleEventChange(event, 'errorCallback'); }}
                                                                        resource={this.state.selectedResource}
                                                                        resourceDefinition={this.getResourceDefinition()}
                                                                        rootParameters={this.getRootParameters()}
                                                                        callbackDefinition={this.getCallbackDefinition('errorCallback')}
                                                                        callbackRootParameters={this.getCallbackRootParameters('errorCallback')}
                                                                        callbackObject={this.getResourceMappingByType('errorCallback')}
                                                                        mode='validation'
                                                                        isMappingEditor
                                                                    />
                                                                </div>
                                                            </Tabs.TabPane>
                                                        </Tabs>
                                                    )
                                                    : null
                                            }
                                        </Col>
                                    </Row>
                                )
                                : null
                        }
                    </Col>
                </Row>
            </>
        );
    }
}

export default MappingEditor;
