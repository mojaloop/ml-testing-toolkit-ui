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
import { QuestionCircleOutlined } from '@ant-design/icons';

import { arrayMoveImmutable as arrayMove } from 'array-move';

import { TTKColors } from '../../../utils/styleHelpers';

const { Title, Text } = Typography;

class DemoTestCaseViewer extends React.Component {
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
                        <tr>
                            <td className='align-text-top' width='25px'>
                                <Checkbox
                                    size='small'
                                    checked={!item.disabled}
                                    className='mt-1'
                                    onChange={enabled => {
                                        const disabled = !enabled.target.checked;
                                        this.handleDisableRequests(disabled, index);
                                    }}
                                />
                            </td>
                            <td>
                                <Row>
                                    <Text strong>{item.description}</Text>
                                    <Button
                                        icon={<QuestionCircleOutlined />}
                                        style={{ border: 'none', marginTop: '-4px' }}
                                        onClick={ ()=> { this.props.onRequestClicked(item); }}
                                    ></Button>
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
                            </td>
                            <td className='text-right align-top'>
                                {
                                    item.status && (item.status.state === 'finish' || item.status.state === 'error')
                                        ? (
                                            <Tag color={testStatusColor} className='ml-2'>
                                                {testStatus}
                                            </Tag>
                                        )
                                        : null
                                }
                            </td>
                        </tr>
                    );
                } else {
                    return (
                        <tr>
                            <td>
                                <p>{item.description}</p>
                            </td>
                        </tr>
                    );
                }
            });
            return (
                <table width='100%' cellPadding='5px'>
                    <tbody>
                        {requestRows}
                    </tbody>
                </table>
            );
        } else {
            return null;
        }
    };

    handleDisableRequests = (disabled, requestIndex) => {
        if(_.isUndefined(requestIndex)) {
            this.props.testCase.requests.forEach(request => {
                request.disabled = disabled;
            });
        } else {
            this.props.testCase.requests[requestIndex].disabled = disabled;
        }
        this.props.onDisableRequests(disabled, requestIndex);
    };

    render() {
        const onClick = ({ key }) => {
            switch (key) {
                case 'delete':
                    this.props.onDelete();
                    break;
                case 'rename':
                    this.setState({ renameTestCase: true, testCaseName: this.props.testCase.name });
                    break;
                case 'duplicate':
                    this.props.onDuplicate();
                    break;
                case 'send':
                    this.props.onSend();
                    break;
                case 'reorderRequests': {
                    if(this.props.testCase.requests && this.props.testCase.requests.length > 1) {
                        this.setState({ testCaseRequestsReorderingEnabled: true });
                    } else {
                        message.error({ content: 'there must be at least 2 requests to change the order', key: 'TestCaseRequestsReordering', duration: 3 });
                    }
                }
                    break;
                case 'showseqdiag':
                    this.props.onShowSequenceDiagram(this.props.testCase);
                    break;
            }
        };

        const menu = (
            <Menu onClick={onClick}>
                <Menu.Item key='rename'>Rename</Menu.Item>
                <Menu.Item key='duplicate'>Duplicate</Menu.Item>
                <Menu.Item key='delete'>Delete</Menu.Item>
                <Menu.Item key='send'>Run this test case</Menu.Item>
                {
                    this.props.testCase && this.props.testCase.requests && this.props.testCase.requests.length > 1
                        ? <Menu.Item key='reorderRequests'>Reorder requests</Menu.Item>
                        : null
                }
                {
                    this.props.testCase && this.props.testCase.requests && this.props.testCase.requests[0] && this.props.testCase.requests[0].status && this.props.testCase.requests[0].status.requestSent
                        ? <Menu.Item key='showseqdiag'>Show Sequence Diagram</Menu.Item>
                        : null
                }
            </Menu>
        );

        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card>
                            <Row>
                                <Col span={24}>
                                    <Title level={4} >
                                        <Checkbox
                                            size='small'
                                            checked={this.props.testCase.requests.every(request => !request.disabled)}
                                            className='mr-2'
                                            onChange={enableAllRequests => {
                                                const disableAllRequests = !enableAllRequests.target.checked;
                                                this.handleDisableRequests(disableAllRequests);
                                            }}
                                        />
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
                                <>
                                    {this.getTestCaseItems()}
                                </>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default DemoTestCaseViewer;
