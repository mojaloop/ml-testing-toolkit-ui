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

 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@infitx.com> (Original Author)
 --------------
 ******/
import React from 'react';
import _ from 'lodash';

import { Select, Input, Tag, Card, Popover, Row, Col, Button, Typography } from 'antd';
import 'antd/dist/antd.css';
import RequestOptionsBuilder from './RequestOptionsBuilder.jsx';
import RequestHeaderBodyBuilder from './RequestHeaderBodyBuilder.jsx';
import RequestQueryParamsBuilder from './RequestQueryParamsBuilder.jsx';

// import './index.css';
import 'jsoneditor-react/es/editor.min.css';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseCurl = require('../../utils/curlParser').default;

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

class PathBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            params: {},
        };
    }

    componentDidMount() {
        this.state.params = { ...this.props.request.params };
    }

    handleValueChange = async (name, value) => {
        const params = this.state.params;
        params[name] = value;
        this.props.request.params = params;
        await this.setState({ params });
        this.updatePath();
    };

    updatePath = () => {
        let operationPath = this.props.request.operationPath;
        for(const k in this.state.params) {
            operationPath = operationPath.replace('{' + k + '}', this.state.params[k]);
        }
        this.props.request.path = operationPath;
        this.props.onChange();
    };

    getPathItems = () => {
        // TODO: read the path parameters from resource parameters also
        // Currently only rootParameters are considered
        let allParameters = [];
        if(this.props.rootParameters) {
            allParameters = allParameters.concat(this.props.rootParameters);
        }
        if(this.props.resourceDefinition && this.props.resourceDefinition.parameters) {
            allParameters = allParameters.concat(this.props.resourceDefinition.parameters);
        }
        if(!allParameters) {
            return null;
        }
        const pathItems = allParameters.filter(item => {
            return item.in === 'path';
        });
        if(pathItems.length <= 0) {
            return null;
        }
        return (
            <Row className='mb-2'>
                <Col span={24}>
                    <Card size='small' title='Path Parameters'>
                        <Row>
                            <Col span={24}>
                                {(
                                    pathItems.map(item => {
                                        return (
                                            <Row className='mb-2' key={item.name}>
                                                <Col span={8}>
                                                    <Text strong>
                                                        {item.name}
                                                    </Text>
                                                </Col>
                                                <Col span={16}>
                                                    {this.getValueInput(item)}
                                                </Col>
                                            </Row>
                                        );
                                    })
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        );
    };

    getValueInput = pathParam => {
        if(!this.props.request.params) {
            this.props.request.params = {};
        }
        if(!this.props.request.params[pathParam.name]) {
            this.props.request.params[pathParam.name] = '';
        }
        const pathValue = this.props.request.params[pathParam.name];
        let dynamicPathValue = null;
        // Check if the path value is a configurable input parameter
        if(pathValue.startsWith('{$inputs.')) {
            // Find the parameter name
            const paramName = pathValue.slice(9, pathValue.length - 1);
            // if (this.props.inputValues)
            const temp = _.get(this.props.inputValues, paramName);
            if(temp) {
                dynamicPathValue = (
                    <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
                );
            }
        }
        if(pathParam.schema && pathParam.schema.enum) {
            return (
                <>
                    <Select
                        onChange={value => this.handleValueChange(pathParam.name, value)}
                        value={this.props.request.params[pathParam.name]}
                        style={{ width: '100%' }}
                    >
                        {pathParam.schema.enum.map(item => {
                            return (
                                <Option key={item} value={item}>{item}</Option>
                            );
                        })}
                    </Select>
                    {dynamicPathValue}
                </>
            );
        } else {
            return (
                <>
                    <Input
                        placeholder='Value' value={this.props.request.params[pathParam.name]}
                        onChange={e => this.handleValueChange(pathParam.name, e.target.value)}
                    />
                    {dynamicPathValue}
                </>
            );
        }
    };

    render() {
        return (
            <>
                {this.getPathItems()}
            </>
        );
    }
}

class CurlImporter extends React.Component {
    constructor() {
        super();
        this.state = {
            importCurlCommandDialogVisible: false,
            curlCommand: '',
            displayErrorMessage: '',
        };
    }

    handleImportClick = () => {
        try {
            const decodedCurl = parseCurl(this.state.curlCommand);
            this.props.request.headers = JSON.parse(JSON.stringify(decodedCurl.headers));
            if(this.props.resourceDefinition && this.props.resourceDefinition.requestBody) {
                this.props.request.body = JSON.parse(JSON.stringify(decodedCurl.body));
            }
            this.setState({ importCurlCommandDialogVisible: false });
            this.props.onChange();
        } catch (err) {
            this.setState({ displayErrorMessage: 'Wrong CURL syntax: Parsing Error' });
        }
    };

    render() {
        const importCurlCommandDialogContent = (
            <>
                <Row>
                    <Col>
                        <TextArea
                            rows={8}
                            placeholder='Enter name'
                            size='large'
                            type='text'
                            value={this.state.curlCommand}
                            onChange={e => { this.setState({ curlCommand: e.target.value }); }}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button
                            className='text-right mt-2'
                            color='success'
                            href='#pablo'
                            onClick={this.handleImportClick}
                            size='sm'
                        >
              Import
                        </Button>
                        <Button
                            className='text-right mt-2'
                            color='danger'
                            href='#pablo'
                            onClick={() => {
                                this.setState({ importCurlCommandDialogVisible: false });
                            }}
                            size='sm'
                        >
              Cancel
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {this.state.displayErrorMessage}
                    </Col>
                </Row>
            </>
        );

        return (
            <Popover
                content={importCurlCommandDialogContent}
                title='Paste the CURL command here'
                trigger='click'
                visible={this.state.importCurlCommandDialogVisible}
                onVisibleChange={visible => this.setState({ importCurlCommandDialogVisible: true })}
            >
                <Button
                    className='mt-2 mb-2 mr-2'
                    color='info'
                    size='sm'
                >
          Import Curl
                </Button>
        (Experimental)
            </Popover>
        );
    }
}

class RequestBuilder extends React.Component {
    constructor() {
        super();
        this.headerBodyBuilderRef = React.createRef();
        this.state = {
        };
    }

    // componentDidMount = () => {
    //   if (this.props.eventParams) {
    //     if (this.props.request.headers || this.props.request.body) {
    //       this.setState({overrideChecked: true})
    //     }
    //   }

    // }

    handleRequestChange = () => {
        // if (newParams) {
        //   this.props.request.params = newParams
        // } else {
        //   delete this.props.request.params
        // }
        // https://github.com/mojaloop/project/issues/3031
        // Commenting this out since it's likely that this is causing issues
        // with the JSON editor
        // this.headerBodyBuilderRef.current.updateBodyChanges();
        this.props.onChange(this.props.request);
    };

    render() {
        return (
            <>
                <div>
                    <Row className='mt-2'>
                        <Col span={24}>
                            {
                                this.props.resource
                                    ? (
                                        <>
                                            <CurlImporter
                                                request={this.props.request}
                                                onChange={this.handleRequestChange}
                                                resourceDefinition={this.props.resourceDefinition}
                                            />
                                            <RequestOptionsBuilder
                                                request={this.props.request}
                                                inputValues={this.props.inputValues}
                                                onChange={this.handleRequestChange}
                                            />
                                            <PathBuilder
                                                request={this.props.request}
                                                inputValues={this.props.inputValues}
                                                onChange={this.handleRequestChange}
                                                resourceDefinition={this.props.resourceDefinition}
                                                rootParameters={this.props.rootParameters}
                                            />
                                            <RequestQueryParamsBuilder
                                                request={this.props.request}
                                                inputValues={this.props.inputValues}
                                                allRequests={this.props.allRequests}
                                                onChange={this.handleRequestChange}
                                                resourceDefinition={this.props.resourceDefinition}
                                                rootParameters={this.props.rootParameters}
                                                openApiDefinition={this.props.openApiDefinition}
                                                callbackMap={this.props.callbackMap}
                                            />
                                            <RequestHeaderBodyBuilder
                                                ref={this.headerBodyBuilderRef}
                                                request={this.props.request}
                                                inputValues={this.props.inputValues}
                                                allRequests={this.props.allRequests}
                                                onChange={this.handleRequestChange}
                                                resourceDefinition={this.props.resourceDefinition}
                                                rootParameters={this.props.rootParameters}
                                                openApiDefinition={this.props.openApiDefinition}
                                                callbackMap={this.props.callbackMap}
                                            />
                                        </>
                                    )
                                    : null
                            }

                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}

export default RequestBuilder;
