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

import { Input, Tooltip, Tag, Card, Popover, Row, Col, Switch, Button, Typography } from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';

// import './index.css';
import '../outbound/jsoneditor-react-compat';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import JsonEditor from './JsonEditor.jsx';

const { Text } = Typography;

class RequestQueryParamsBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            addQueryParamDialogVisible: false,
            newQueryParamName: '',
            queryParamRawEditorEnable: false,
        };
    }

    addQueryParamItem = itemName => {
        if(!this.props.request.queryParams) {
            this.props.request.queryParams = {};
        }
        this.props.request.queryParams[itemName] = this.props.request.queryParams[itemName] ? this.props.request.queryParams[itemName] : '';
        this.updateChanges();
    };

    handleQueryParamChange = (key, name, value) => {
        this.props.request.queryParams[name] = value;
        this.updateChanges();
    };

    handleQueryParamDelete = async name => {
        delete this.props.request.queryParams[name];
        this.updateChanges();
    };

    handleRawQueryParamsChange = newParams => {
        this.props.request.queryParams = newParams;
        this.updateChanges();
    };

    updateChanges = () => {
        this.props.onChange(this.props.request);
    };

    getQueryParamItems = () => {
        // console.log(this.props.resourceDefinition)
        const paramItems = [];
        let k = 0;
        if(this.props.request) {
            for(const paramName in this.props.request.queryParams) {
                const item = {
                    name: paramName,
                    value: this.props.request.queryParams[paramName],
                };
                const key = k;
                k += 1;
                paramItems.push(
                    <QueryParamsInputComponent
                        key={key}
                        itemKey={item.name}
                        name={item.name}
                        value={item.value}
                        resourceDefinition={this.props.resourceDefinition}
                        onChange={this.handleQueryParamChange}
                        onDelete={this.handleQueryParamDelete}
                        inputValues={this.props.inputValues}
                    />,
                );
            }
        }
        return paramItems;
    };

    render() {
        const addQueryParamDialogContent = (
            <>
                <Input
                    placeholder='Enter name'
                    type='text'
                    value={this.state.newQueryParamName}
                    onChange={e => { this.setState({ newQueryParamName: e.target.value }); }}
                />
                <Button
                    className='text-end mt-2'
                    color='success'
                    href='#pablo'
                    onClick={() => {
                        this.addQueryParamItem(this.state.newQueryParamName);
                        this.setState({ addQueryParamDialogVisible: false });
                    }}
                    size='sm'
                >
          Add
                </Button>
            </>
        );

        return (
            <>
                <Row className='mb-2'>
                    <Col span={24}>
                        <Card size='small' title='Query Parameters'>
                            <Row>
                                <Col span={12}>
                                    {
                                        !this.state.queryParamRawEditorEnable
                                            ? <Popover
                                                content={addQueryParamDialogContent}
                                                title='Enter name for the parameter'
                                                trigger='click'
                                                open={this.state.addQueryParamDialogVisible}
                                                onOpenChange={visible => this.setState({ addQueryParamDialogVisible: true })}
                                            >
                                                <Button
                                                    type='primary'
                                                >
                          Add Param
                                                </Button>
                                            </Popover>
                                            : null
                                    }
                                </Col>
                                <Col span={12} className='text-end'>
                                    <strong>Raw Editor</strong> <Switch checked={this.state.queryParamRawEditorEnable} onChange={checked => { this.setState({ queryParamRawEditorEnable: checked }); }} />
                                </Col>
                            </Row>
                            <Row className='mt-2'>
                                <Col span={24}>
                                    {
                                        this.state.queryParamRawEditorEnable
                                            ? (
                                                <div>
                                                    <Row>
                                                        <Col span={24} className='text-start mt-4'>
                                                            <JsonEditor
                                                                value={this.props.request.queryParams || {}}
                                                                onChange={this.handleRawQueryParamsChange}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )
                                            : (
                                                <>
                                                    <Row>
                                                        <Col span={8}>
                                                            <Text strong>
                                Name
                                                            </Text>
                                                        </Col>
                                                        <Col span={8}>
                                                            <Text strong>
                                Value
                                                            </Text>
                                                        </Col>
                                                    </Row>
                                                    {this.getQueryParamItems()}
                                                </>
                                            )
                                    }
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

class QueryParamsInputComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            name: '',
            value: '',
        };
    }

    inputValue = null;

    componentDidMount = () => {
        this.inputValue = this.props.value;
    };

    componentDidUpdate = () => {
        this.inputValue = this.props.value;
    };

    getDynamicValue = () => {
        let dynamicValue = null;
        // Check if the path value is a configurable input parameter
        if(this.inputValue && this.inputValue.startsWith('{$inputs.')) {
            // Find the parameter name
            const paramName = this.inputValue.slice(9, this.inputValue.length - 1);
            // if (this.props.inputValues)
            const temp = _.get(this.props.inputValues, paramName);
            if(temp) {
                dynamicValue = (
                    <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
                );
            }
        }
        return dynamicValue;
    };

    handleNameChange = event => {
        // this.setState({name: event.target.value})
        this.props.onChange(this.props.itemKey, event.target.value, this.props.value);
    };

    handleValueChange = event => {
        this.inputValue = event.target.value;
        // console.log(event.target.value)
        // this.setState({value: event.target.value})
        this.props.onChange(this.props.itemKey, this.props.name, this.inputValue);
    };

    handleDelete = () => {
        this.props.onDelete(this.props.itemKey);
    };

    render() {
        return (
            <>
                <Row className='mb-2' gutter={16}>
                    <Col span={8}>
                        <Tooltip placement='topLeft' title={this.props.description}>
                            <Input
                                className='form-control-alternative'
                                placeholder='Name'
                                type='text'
                                defaultValue={this.props.name}
                                value={this.props.name}
                                onChange={this.handleNameChange}
                                disabled={false}
                                readOnly
                            />
                        </Tooltip>
                    </Col>

                    <Col span={14}>
                        <Input
                            className='form-control-alternative'
                            placeholder='Value'
                            type='text'
                            defaultValue={this.props.value}
                            value={this.props.value}
                            onChange={this.handleValueChange}
                            disabled={false}
                        />
                        {this.getDynamicValue()}
                    </Col>
                    <Col span={2}>
                        <DeleteTwoTone
                            twoToneColor='#eb2f96'
                            key={this.props.name}
                            onClick={this.handleDelete}
                        />
                    </Col>
                </Row>
            </>
        );
    }
}

export default RequestQueryParamsBuilder;
