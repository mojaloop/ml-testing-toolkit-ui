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

import { Input, InputNumber, Tooltip, Tag, Card, Checkbox, Row, Col, Typography } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';

import 'jsoneditor-react/es/editor.min.css';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';

const { Text } = Typography;


class RequestOptionsBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            overrideCheckboxSelected: false,
        };
    }

    componentDidMount() {
        if(this.props.request.url) {
            this.setState({ overrideCheckboxSelected: true });
        }
    // this.state.params = { ...this.props.request.params }
    }

    handleUrlChange = async value => {
        this.props.request.url = value;
        this.props.onChange();
    };

    render() {
        let dynamicPathValue = null;
        // Check if the path value is a configurable input parameter
        if(this.props.request.url && this.props.request.url.startsWith('{$inputs.')) {
            // Find the parameter name
            const paramName = this.props.request.url.slice(9, this.props.request.url.length - 1);
            const temp = _.get(this.props.inputValues, paramName);
            if(temp) {
                dynamicPathValue = (
                    <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
                );
            }
        }

        return (
            <>
                <Row className='mb-2'>
                    <Col span={24}>
                        <Card size='small' title='Options'>
                            <Row className='mt-2'>
                                <Col span={8}>
                                    <Text strong>Number of retries</Text>
                                    <Tooltip placement='topLeft' title='Idempotent requests can be retried until the assertions pass. Specify the number of times the request will be retried.'>
                                        <QuestionCircleTwoTone style={{ paddingLeft: '4px', fontSize: '20px' }} />
                                    </Tooltip>
                                </Col>
                                <Col span={16}>
                                    <InputNumber
                                        min={0}
                                        placeholder='retries' value={this.props.request.retries}
                                        onChange={value => {
                                            this.props.request.retries = value;
                                            this.props.onChange();
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row className='mt-2'>
                                <Col span={24}>
                                    <Checkbox
                                        checked={this.state.overrideCheckboxSelected}
                                        onChange={e => {
                                            this.handleUrlChange(null);
                                            this.setState({ overrideCheckboxSelected: e.target.checked });
                                        }}
                                    />
                                    <Text strong className='ml-2'>
                                        Override with Custom URL
                                        <Tooltip placement='topLeft' title='If there is no custom URL specified, the requests go to CALLBACK_ENDPOINT in user settings'>
                                            <QuestionCircleTwoTone style={{ paddingLeft: '4px', fontSize: '20px' }} />
                                        </Tooltip>
                                    </Text>
                                </Col>
                            </Row>
                            {
                                this.state.overrideCheckboxSelected
                                    ? (
                                        <Row className='mt-2'>
                                            <Col span={8}>
                                                <Text strong>
                        Enter Base URL
                                                </Text>
                                            </Col>
                                            <Col span={16}>
                                                <Input
                                                    placeholder='URL' value={this.props.request.url}
                                                    onChange={e => this.handleUrlChange(e.target.value)}
                                                />
                                                {dynamicPathValue}
                                            </Col>
                                        </Row>
                                    )
                                    : null
                            }
                            <Row className='mt-2'>
                                <Col span={24}>
                                    <Checkbox
                                        checked={this.props.request.ignoreCallbacks}
                                        onChange={e => {
                                            this.props.request.ignoreCallbacks = e.target.checked;
                                            this.props.onChange();
                                        }}
                                    />
                                    <Text strong className='ml-2'>
                    Ignore Callbacks
                                    </Text>
                                </Col>
                            </Row>
                            <Row className='mt-2'>
                                <Col span={24}>
                                    <Checkbox
                                        checked={this.state.delayCheckboxSelected || this.props.request.delay}
                                        onChange={e => {
                                            if(!e.target.checked) {
                                                delete this.props.request.delay;
                                            } else {
                                                this.props.request.delay = '0';
                                            }
                                            this.props.onChange();
                                            this.setState({ delayCheckboxSelected: e.target.checked });
                                        }}
                                    />
                                    <Text strong className='ml-2'>
                    Use delay
                                    </Text>
                                </Col>
                                {
                                    this.state.delayCheckboxSelected || this.props.request.delay
                                        ? (
                                            <Row className='mt-2'>
                                                <Col span={8}>
                                                    <Text strong>
                            Enter Delay in milliseconds
                                                    </Text>
                                                </Col>
                                                <Col span={16}>
                                                    <Input
                                                        placeholder='delay' value={this.props.request.delay}
                                                        onChange={e => {
                                                            this.props.request.delay = e.target.value;
                                                            this.props.onChange();
                                                        }}
                                                    />
                                                </Col>
                                            </Row>
                                        )
                                        : null
                                }
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default RequestOptionsBuilder;
