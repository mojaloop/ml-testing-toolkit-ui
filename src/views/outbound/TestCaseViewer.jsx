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
import React from 'react';
import _ from 'lodash';

import { Row, Col, Tag, Dropdown, Menu, message, Input, Collapse, Card, Button, Typography, Switch } from 'antd';
import { MoreOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import MetadataEditor from './MetadataEditor';
import SortableList from '../../components/SortableList';
import { arrayMoveImmutable as arrayMove } from 'array-move';

import { TTKColors } from '../../utils/styleHelpers';

const { Panel } = Collapse;
const { Title, Text } = Typography;

class TestCaseViewer extends React.Component {
    constructor() {
        super();
        this.state = {
            addNewRequestDialogVisible: false,
            newRequestDescription: '',
            renameTestCase: false,
            testCaseName: '',
            testCaseRequestsReorderingEnabled: false,
            testCaseIdEditDisabled: true,
            testCaseIdValidationError: '',
            testCaseId: '',
        };
    }

    componentWillUnmount = () => {
    };

    componentDidMount = () => {
        if(!this.props.testCase.meta) {
            this.props.testCase.meta = {
                info: this.props.testCase.name,
            };
        }
        this.setState({
            testCaseName: this.props.testCase.name,
            testCaseId: this.props.testCase.id,
        });
    };

    componentDidUpdate = () => {
        if(this.state.testCaseIdEditDisabled && this.props.testCase.id !== this.state.testCaseId) {
            this.setState({ testCaseId: this.props.testCase.id });
        }
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
                                <Switch
                                    size='small'
                                    checked={!item.disabled}
                                    className='mt-1'
                                    onChange={enabled => {
                                        const disabled = !enabled;
                                        this.handleDisableRequests(disabled, index);
                                    }}
                                />
                            </td>
                            <td>
                                <Row>
                                    <Col>
                                        <Title level={5}>{item.method.toUpperCase() + ' ' + item.operationPath}</Title>
                                    </Col>
                                </Row>
                                <Row>
                                    <Text>{item.description}</Text>
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

    handleTestCaseRename = newTestCaseName => {
        this.props.testCase.name = newTestCaseName;
        this.props.onRename(newTestCaseName);
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

    handleTestCaseIdChange = e => {
        const testCaseId = e.target.value;
        // Validate the testCase ID to be a string with only alphanumeric characters, underscore and dash
        if(!/^[a-zA-Z0-9_-]*$/.test(e.target.value)) {
            this.setState({ testCaseId, testCaseIdValidationError: 'TestCase ID should contain only alphanumeric characters, underscore and dash' });
        } else {
            this.setState({ testCaseId, testCaseIdValidationError: '' });
        }
    };

    handleTestCaseIdEditClick = () => {
        this.setState({ testCaseIdEditDisabled: false });
    };

    handleTestCaseIdSaveClick = () => {
        if(this.state.testCaseId !== this.props.testCase.id) {
            this.props.testCase.id = this.state.testCaseId;
            this.state.testCaseIdEditDisabled = true;
            this.props.onChange();
        }
        this.setState({ testCaseIdEditDisabled: true });
    };

    onTestCaseRequestsSortEnd = ({ oldIndex, newIndex }) => {
        // Change the position in array
        this.props.testCase.requests = arrayMove(this.props.testCase.requests, oldIndex, newIndex);
        this.setState({ curTestCasesRequestsUpdated: true });
        this.props.onChange();
    };

    getTestCaseLabelsTags = () => {
        const output = this.props.testCase.fileInfo.labels.map(selectedLabel => {
            const label = this.props.labelsManager.labels.find(label => label.name === selectedLabel);
            if(label) {
                return (
                    <Tag
                        color={label.color}
                        onMouseDown={event => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        style={{ marginRight: 3 }}
                    >
                        {label.name}
                    </Tag>
                );
            } else {
                return (
                    null
                );
            }
        });
        return (
            <>
                {output}
            </>
        );
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

        const testCaseRenaming = (
            <Title
                level={4}
            >
                <Switch
                    size='small'
                    checked={this.props.testCase.requests.every(request => !request.disabled)}
                    className='mr-2'
                    onChange={enableAllRequests => {
                        const disableAllRequests = !enableAllRequests;
                        this.handleDisableRequests(disableAllRequests);
                    }}
                />
                {this.props.testCase.name}
            </Title>
        );

        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card>
                            {
                                this.props.noOptions
                                    ? (
                                        <Row>
                                            <Col span={24}>
                                                {testCaseRenaming}
                                            </Col>
                                        </Row>
                                    )
                                    : (
                                        <Row>
                                            <Col span={16}>
                                                {
                                                    this.state.renameTestCase
                                                        ? (
                                                            <table width='100%'>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>
                                                                            <Input
                                                                                value={this.state.testCaseName}
                                                                                onChange={e => { this.setState({ testCaseName: e.target.value }); }}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <Button
                                                                                className='ml-2'
                                                                                type='primary'
                                                                                danger
                                                                                onClick={() => {
                                                                                    this.setState({ renameTestCase: false });
                                                                                    this.handleTestCaseRename(this.state.testCaseName);
                                                                                }}
                                                                                size='sm'
                                                                            >
                                Done
                                                                            </Button>
                                                                            <Button
                                                                                className='ml-2'
                                                                                type='default'
                                                                                onClick={() => {
                                                                                    this.setState({ renameTestCase: false });
                                                                                    this.setState({ testCaseName: this.props.testCase.name });
                                                                                }}
                                                                            >
                                Cancel
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        )
                                                        : testCaseRenaming
                                                }
                                            </Col>
                                            <Col span={8}>
                                                <Dropdown overlay={menu} trigger={['click']} className='ml-4 mt-2 float-right'>
                                                    <MoreOutlined />
                                                </Dropdown>
                                                <Button
                                                    className='ml-2 float-right'
                                                    type='default'
                                                    onClick={() => {
                                                        this.props.onEdit();
                                                    }}
                                                >
                      Edit
                                                </Button>,
                                                {
                                                    this.state.testCaseRequestsReorderingEnabled && (this.props.testCase.requests && this.props.testCase.requests.length > 0)
                                                        ? (
                                                            <Button
                                                                className='ml-2 float-right'
                                                                type='dashed'
                                                                danger
                                                                onClick={async () => {
                                                                    if(this.state.curTestCasesRequestsUpdated) {
                                                                        this.setState({ curTestCasesRequestsUpdated: false });
                                                                    } else {
                                                                        message.error({ content: 'no changes found', key: 'TestCaseRequestsReordering', duration: 3 });
                                                                    }
                                                                    this.setState({ testCaseRequestsReorderingEnabled: false });
                                                                }}
                                                            >
                        Apply Reorder
                                                            </Button>
                                                        )
                                                        : null
                                                }
                                            </Col>
                                        </Row>
                                    )
                            }
                            {
                                this.props.testCase.id
                                    ? (
                                        <Row>
                                            <Col span={24}>
                                                <Text>Testcase ID: </Text>
                                                <Input
                                                    placeholder="Testcase ID"
                                                    size="small"
                                                    style={{ width: '300px' }}
                                                    disabled={this.state.testCaseIdEditDisabled}
                                                    value={this.state.testCaseId}
                                                    addonAfter={
                                                        this.state.testCaseIdEditDisabled ? (
                                                            <EditOutlined
                                                                onClick={this.handleTestCaseIdEditClick}
                                                            />
                                                        ) : (
                                                            <SaveOutlined
                                                                style={{ visibility: this.state.testCaseIdValidationError ? 'hidden' : 'visible' }}
                                                                onClick={this.handleTestCaseIdSaveClick}
                                                            />
                                                        )
                                                    }
                                                    onChange={this.handleTestCaseIdChange}
                                                />
                                                <Text type='danger'>{this.state.testCaseIdValidationError}</Text>
                                            </Col>
                                        </Row>
                                    )
                                    : null
                            }
                            {
                                this.props.testCase.fileInfo.path
                                    ? (
                                        <Row>
                                            <Col span={24}>
                                                <Text>File path: {this.props.testCase.fileInfo.path.toString()}</Text>
                                            </Col>
                                        </Row>
                                    )
                                    : null
                            }
                            {
                                this.props.testCase.fileInfo.labels && this.props.testCase.fileInfo.labels.length > 0
                                    ? (
                                        <Row>
                                            <Col span={24}>
                                                <Text strong>Labels: {this.getTestCaseLabelsTags()}</Text>
                                            </Col>
                                        </Row>
                                    )
                                    : null
                            }
                            <Row>
                                <Col span={24}>
                                    <MetadataEditor
                                        values={this.props.testCase.meta}
                                        onChange={this.props.onChange}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                {
                                    this.state.testCaseRequestsReorderingEnabled
                                        ? (
                                            <SortableList
                                                items={this.props.testCase.requests.map((request, index) => ({
                                                    ...request,
                                                    id: request.id || `request-${index}`,
                                                }))}
                                                onSortEnd={this.onTestCaseRequestsSortEnd}
                                                renderItem={item => (
                                                    <Panel header={item.description} />
                                                )}
                                            />
                                        )
                                        : (
                                            <>
                                                {this.getTestCaseItems()}
                                            </>
                                        )
                                }
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default TestCaseViewer;
