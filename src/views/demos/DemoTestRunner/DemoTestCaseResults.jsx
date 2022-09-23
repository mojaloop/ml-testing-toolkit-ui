/* eslint-disable @typescript-eslint/indent,indent */
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

import { Row, Col, Tag, Dropdown, Menu, message, Input, Card, Button, Typography, Switch, Checkbox } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

import { arrayMoveImmutable as arrayMove } from 'array-move';

import { TTKColors } from '../../../utils/styleHelpers';

const { Title, Text } = Typography;

class DemoTestCaseResults extends React.Component {
    constructor() {
        super();
        this.state = {
            testCaseName: '',
        };
    }

    componentWillUnmount = () => {
    };

    componentDidMount = () => {
        this.setState({ testCaseName: this.props.testCase.name });
    };

    getTestCaseItems = () => {
        if(this.props.testCase.requests) {
            const requestRows = this.props.testCase.requests.map((item, index) => {
                if(item.method && item.operationPath) {
                    const testStatus = item.status && item.tests && item.status.testResult && item.tests.assertions ? item.status.testResult.passedCount + ' / ' + item.tests.assertions.length : '';
                    let testStatusColor = TTKColors.assertionFailed;
                    if(item.status && item.status.progressStatus == 'SKIPPED') {
                        testStatusColor = TTKColors.assertionSkipped;
                    } else if(item.status && item.tests && item.status.testResult && item.tests.assertions && item.status.testResult.passedCount === item.tests.assertions.length) {
                        testStatusColor = TTKColors.assertionPassed;
                    }
                    return (
                        <Row>
                            <Col span={1} className='text-right pr-2'><Text strong>{ index + 1 }.</Text></Col>
                            <Col span={23}>
                                <Row>
                                    <Col span={24}>
                                        <Text strong>{item.description}</Text>
                                    </Col>
                                </Row>                                
                                <Row>
                                    <Col>
                                        <Text code level={5}>{item.method.toUpperCase() + ' ' + item.operationPath}</Text>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col span={24}>
                                        <Text type="secondary" italic>{item.meta?.info}</Text>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col span={12}>
                                        <Card size='small' className='mb-2' title={'Request Body Sent'}>
                                            { item.status.requestSent?.body ? (
                                            <Text>
                                                <pre style={{ overflow: 'scroll', 'white-space': 'pre-wrap' }}>
                                                    {JSON.stringify(item.status.requestSent?.body, null, 2)}
                                                </pre>
                                            </Text>
                                            ) : 'Nil'}
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card size='small' className='mb-2' title={'Response Body Received'}>
                                            { item.status.response?.body ? (
                                            <Text>
                                                <pre style={{ overflow: 'scroll', 'white-space': 'pre-wrap' }}>
                                                    {JSON.stringify(item.status.response?.body, null, 2)}
                                                </pre>
                                            </Text>
                                            ) : 'Nil'}
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    );
                } else {
                    return (
                        <Row>
                            <Col span={24}>
                                <Row>
                                    <Col span={24}>
                                        <Text strong>{item.description}</Text>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    );
                }
            });
            return requestRows;
        } else {
            return null;
        }
    };

    render() {

        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card title='Test Results'>

                            <Row>
                                <Col span={24}>
                                    <Title level={4} >
                                        {this.props.testCase.name}
                                    </Title>
                                </Col>
                            </Row>

                            <Row className="mb-2">
                                <Col span={24}>
                                    <Text type="secondary" italic>{this.props.testCase.meta?.info}</Text>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    {this.getTestCaseItems()}
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default DemoTestCaseResults;
