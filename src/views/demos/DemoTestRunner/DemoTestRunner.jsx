/* eslint-disable @typescript-eslint/naming-convention */
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
import socketIOClient from 'socket.io-client';
import { getServerConfig, fetchServerConfig, getConfig } from '../../../utils/getConfig';
import { Row, Col, Modal, Badge, message, Progress, Button, Card, Drawer, Layout } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import axios from 'axios';
import TestCaseViewer from '../../outbound/TestCaseViewer';
import FileManager from '../../outbound/FileManager.jsx';
import EnvironmentManager from '../../outbound/EnvironmentManager';
import Monitor from '../../monitor/Monitor';

import { FolderParser, TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib';

import { TTKColors } from '../../../utils/styleHelpers';
import { LocalDB } from '../../../services/localDB/LocalDB';

const { Sider, Content } = Layout;

function buildFileSelector(multi = false, directory = false) {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    if(multi) {
        fileSelector.setAttribute('multiple', 'multiple');
    }
    if(directory) {
        fileSelector.setAttribute('webkitdirectory', '');
    }
    return fileSelector;
}

class OutboundRequest extends React.Component {
    constructor() {
        super();
        this.fileManagerRef = React.createRef();
        const sessionId = TraceHeaderUtils.generateSessionId();
        this.state = {
            request: {},
            template: {},
            inputValues: {},
            additionalData: {
                selectedFiles: [],
            },
            showTestCaseIndex: null,
            totalPassedCount: 0,
            totalFailedCount: 0,
            totalAssertionsCount: 0,
            sessionId,
            testReport: null,
            userConfig: null,
            sendingOutboundRequestID: null,
            lastOutgoingRequestID: null,
            folderData: [],
            fileBrowserVisible: false,
            testCaseEditorLogs: [],
        };
    }

    socket = null;

    autoSave = false;

    autoSaveIntervalId = null;

    componentWillUnmount = () => {
        if(this.socket) {
            this.socket.disconnect();
        }
        if(this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
        }
    };

    componentDidMount = async () => {
        await fetchServerConfig();

        this.environmentFileSelector = buildFileSelector();
        this.environmentFileSelector.addEventListener('input', e => {
            if(e.target.files) {
                this.handleImportEnvironmentFile(e.target.files[0]);
                this.environmentFileSelector.value = null;
            }
        });

        // const sampleTemplate = require('./sample1.json')
        // this.setState({template: sampleTemplate})
        const { userConfigRuntime } = await getServerConfig();

        this.setState({ userConfig: userConfigRuntime });
        const { apiBaseUrl } = getConfig();
        this.socket = socketIOClient(apiBaseUrl);
        // this.socket.on("outboundProgress", this.handleIncomingProgress);
        if(getConfig().isAuthEnabled) {
            const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID');
            if(dfspId) {
                this.state.sessionId = dfspId;
            }
        }
        this.socket.on('outboundProgress/' + this.state.sessionId, this.handleIncomingProgress);

        const additionalData = this.restoreAdditionalData();
        const storedFolderData = await this.restoreSavedFolderData();

        if(storedFolderData) {
            this.state.folderData = storedFolderData;
            this.regenerateTemplate(additionalData.selectedFiles);
        }

        if(additionalData) {
            this.state.additionalData = additionalData;
        }

        if(storedFolderData || additionalData) {
            this.forceUpdate();
        }

        this.startAutoSaveTimer();
    };

    handleEnvironmentChange = newInputValues => {
        this.state.template.options = { ...newEnvironment.options };
        this.setState({ inputValues: newInputValues.inputValues });
    };

    handleIncomingProgress = progress => {
        if(progress.status === 'FINISHED') {
            message.success({ content: 'Test case finished', key: 'outboundSendProgress', duration: 2 });
            this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult });
        } else if(progress.status === 'TERMINATED') {
            message.success({ content: 'Test case terminated', key: 'outboundStopProgress', duration: 2 });
            this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult });
        } else {
            const testCase = this.state.template.test_cases.find(item => item.id === progress.testCaseId);
            if(testCase) {
                const request = testCase.requests.find(item => item.id === progress.requestId);
                if(request.status) {
                    // Update total passed count
                    // const passedCount = (progress.testResult) ? progress.testResult.passedCount : 0
                    // const failedCount = (progress.testResult && progress.testResult.results && progress.testResult.passedCount !== progress.testResult.results.length) ? Object.entries(progress.testResult.results).filter(item => item[1].status === 'FAILED').length : 0
                    // this.state.totalPassedCount += passedCount
                    // this.state.totalFailedCount += failedCount
                    this.state.totalPassedCount = progress.totalProgress.assertionsPassed;
                    this.state.totalFailedCount = progress.totalProgress.assertionsFailed;
                    request.status.progressStatus = progress.status;
                    if(progress.status === 'SUCCESS') {
                        request.status.state = 'finish';
                        request.status.response = progress.response;
                        request.status.callback = progress.callback;
                        request.status.requestSent = progress.requestSent;
                        request.status.additionalInfo = progress.additionalInfo;
                        request.status.testResult = progress.testResult;
                    } else if(progress.status === 'ERROR') {
                        request.status.state = 'error';
                        request.status.response = progress.response;
                        request.status.callback = progress.callback;
                        request.status.requestSent = progress.requestSent;
                        request.status.additionalInfo = progress.additionalInfo;
                        request.status.testResult = progress.testResult;
                        // Clear the waiting status of the remaining requests
                        for(const i in testCase.requests) {
                            if(!testCase.requests[i].status) {
                                testCase.requests[i].status = {};
                            }
                            if(testCase.requests[i].status.state === 'process') {
                                testCase.requests[i].status.state = 'wait';
                                testCase.requests[i].status.response = null;
                                testCase.requests[i].status.callback = null;
                                testCase.requests[i].status.requestSent = null;
                                testCase.requests[i].status.additionalInfo = {};
                                testCase.requests[i].status.testResult = null;
                            }
                        }
                        // message.error({ content: 'Test case failed', key: 'outboundSendProgress', duration: 3 });
                    } else if(progress.status === 'SKIPPED') {
                        request.status.state = 'error';
                        request.status.response = progress.response;
                        request.status.callback = progress.callback;
                        request.status.requestSent = progress.requestSent;
                        request.status.additionalInfo = progress.additionalInfo;
                        request.status.testResult = progress.testResult;
                    }
                    this.forceUpdate();
                }
            }
        }
    };

    // mockTypeSuccess = true
    handleSendTemplate = async (template = null) => {
        // Initialize counts to zero
        this.state.totalPassedCount = 0;
        this.state.totalFailedCount = 0;
        this.state.totalAssertionsCount = 0;
        this.state.testReport = null;

        const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix();
        this.state.currentEndToEndId = TraceHeaderUtils.generateEndToEndId();
        const traceId = traceIdPrefix + this.state.sessionId + this.state.currentEndToEndId;

        // const outboundRequestID = Math.random().toString(36).substring(7);
        message.loading({ content: 'Initilizing the test cases...', key: 'outboundSendProgress' });
        const { apiBaseUrl } = getConfig();
        const convertedTemplate = template ? this.convertTemplate(template) : this.convertTemplate(this.state.template);
        convertedTemplate.inputValues = this.state.inputValues;
        // await axios.post(apiBaseUrl + "/api/outbound/template/" + outboundRequestID, template ? template : this.state.template, { headers: { 'Content-Type': 'application/json' } })
        await axios.post(apiBaseUrl + '/api/outbound/template/' + traceId, convertedTemplate, { headers: { 'Content-Type': 'application/json' } });

        this.state.sendingOutboundRequestID = traceId;
        this.state.lastOutgoingRequestID = traceId;
        this.state.testCaseEditorLogs = [];
        message.loading({ content: 'Executing the test cases...', key: 'outboundSendProgress', duration: 10 });

        // Set the status to waiting for all the requests
        for(const i in this.state.template.test_cases) {
            for(const j in this.state.template.test_cases[i].requests) {
                const request = this.state.template.test_cases[i].requests[j];
                // console.log(request)
                // Also update the total assertion count
                this.state.totalAssertionsCount += (request.tests && request.tests.assertions) ? request.tests.assertions.length : 0;
                if(!request.status) {
                    request.status = {};
                }
                request.status.state = 'process';
            }
        }
        this.forceUpdate();
    };

    handleStopExecution = async outboundRequestID => {
        message.loading({ content: 'Terminating the execution...', key: 'outboundStopProgress' });
        const { apiBaseUrl } = getConfig();
        await axios.delete(apiBaseUrl + '/api/outbound/template/' + outboundRequestID);
    };

    handleSendStopClick = () => {
        if(this.state.sendingOutboundRequestID) {
            this.handleStopExecution(this.state.sendingOutboundRequestID);
        } else {
            this.handleSendTemplate();
        }
    };

    // Take the status property out from requests
    convertTemplate = (template, showAdvancedFeaturesAnyway = false) => {
        const { test_cases, ...remainingTestCaseProps } = template;
        let newTestCases = test_cases;
        if(test_cases) {
            newTestCases = test_cases.map(testCase => {
                if(testCase.requests) {
                    const { requests, ...remainingProps } = testCase;
                    const newRequests = requests.map(item => {
                        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                        const { status, scripts, ...newRequest } = item;
                        if((this.state.userConfig && this.state.userConfig.ADVANCED_FEATURES_ENABLED) || showAdvancedFeaturesAnyway) {
                            return { ...newRequest, scripts };
                        } else {
                            return newRequest;
                        }
                    });
                    return { ...remainingProps, requests: newRequests };
                } else {
                    return testCase;
                }
            });
        }
        return { ...remainingTestCaseProps, test_cases: newTestCases };
    };

    download = (content, fileName, contentType) => {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    };

    restoreSavedFolderData = async () => {
        // const storedFolderData = localStorage.getItem('folderData')
        const storedFolderData = await LocalDB.getItem('folderData');
        if(storedFolderData) {
            try {
                return JSON.parse(storedFolderData);
            } catch (err) { }
        }
        return null;
    };

    restoreAdditionalData = () => {
        const additionalData = localStorage.getItem('additionalData');
        if(additionalData) {
            try {
                return JSON.parse(additionalData);
            } catch (err) { }
        }
        return {};
    };

    startAutoSaveTimer = () => {
        this.autoSaveIntervalId = setInterval(() => {
            if(this.autoSave) {
                this.autoSave = false;
                this.autoSaveFolderData(this.state.folderData);
                this.autoSaveAdditionalData(this.state.additionalData);
            }
        },
        2000);
    };

    autoSaveFolderData = folderData => {
        // localStorage.setItem('folderData', JSON.stringify(folderData));
        LocalDB.setItem('folderData', JSON.stringify(folderData));
    };

    autoSaveAdditionalData = additionalData => {
        localStorage.setItem('additionalData', JSON.stringify(additionalData));
    };

    regenerateTemplate = async (selectedFiles = null) => {
        let testCases = [];
        testCases = FolderParser.getTestCases(this.state.folderData, selectedFiles);
        // this.state.template.test_cases = JSON.parse(JSON.stringify(testCases))
        this.state.template.test_cases = [];
        for(let i = 0; i < testCases.length; i++) {
            if(testCases[i].requests === undefined) {
                testCases[i].requests = [];
            }
            const testCaseRef = testCases[i];
            this.state.template.test_cases.push({ ...testCaseRef, id: i + 1 });
        }
        // this.state.template.test_cases = testCases.map((item, index) => { return { ...item, id: index + 1} })
        this.state.template.name = 'multi';
        this.state.additionalData = {
            importedFilename: 'Multiple Files',
            selectedFiles,
        };
        this.forceUpdate();
        // this.autoSave = true
    };

    getTestCaseItems = () => {
        if(this.state.template.test_cases) {
            return this.state.template.test_cases.map((testCase, testCaseIndex) => {
                return (
                    <Row className='mb-2'>
                        <Col span={24}>
                            <TestCaseViewer
                                testCase={testCase}
                                inputValues={this.state.inputValues}
                                noOptions
                            />
                        </Col>
                    </Row>
                );
            });
        }
        return null;
    };

    handleFileManagerContentChange = async (folderData, selectedFiles = null) => {
        this.state.folderData = folderData;
        if(selectedFiles != null) {
            this.state.additionalData.selectedFiles = selectedFiles;
        }
        this.regenerateTemplate(this.state.additionalData.selectedFiles);
        this.autoSave = true;
        this.forceUpdate();
    };

    getSingleFileSelected = () => {
        const selectedFiles = this.state.additionalData.selectedFiles;
        let fileSelected = null;
        for(let i = 0; i < selectedFiles.length; i++) {
            const fileNode = FolderParser.findNodeFromAbsolutePath(selectedFiles[i], this.state.folderData);
            if(fileNode.extraInfo.type === 'file') {
                if(fileSelected) {
                    return null;
                } else {
                    fileSelected = fileNode;
                }
            }
        }
        return fileSelected;
    };

    render() {
        return (
            <>
                <Drawer
                    title='Configuration'
                    placement='left'
                    width={600}
                    closable={false}
                    onClose={() => {
                        this.setState({ fileBrowserVisible: false });
                    }}
                    visible={this.state.fileBrowserVisible}
                >
                    <Row>
                        <Col span={24}>
                            <Button
                                className='float-right mr-2'
                                type='dashed'
                                onClick={() => { this.setState({ showTemplate: true }); }}
                            >
                Show Current Template
                            </Button>
                        </Col>
                    </Row>
                    <Row className='mt-2'>
                        <Col span={24}>
                            <Card title='Collection Manager' size='small'>
                                <FileManager
                                    folderData={this.state.folderData}
                                    selectedFiles={this.state.additionalData.selectedFiles}
                                    onChange={this.handleFileManagerContentChange}
                                    ref={this.fileManagerRef}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Row className='mt-4'>
                        <Col span={24}>
                            <Card title='Environment Manager' size='small'>
                                <EnvironmentManager
                                    onChange={this.handleEnvironmentChange}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Drawer>

                <Modal
                    centered
                    destroyOnClose
                    forceRender
                    title='Template'
                    className='w-50 p-3'
                    visible={!!this.state.showTemplate}
                    footer={null}
                    onCancel={() => { this.setState({ showTemplate: false }); }}
                >
                    <pre>{JSON.stringify(this.convertTemplate({ ...this.state.template, inputValues: this.state.inputValues }), null, 2)}</pre>
                </Modal>
                <Layout>
                    <Sider
                        width={500}
                        style={{
                            height: '100vh',
                            background: '#fff',
                        }}
                        className='shadow'
                    >
                        <Row className='m-2'>
                            <Col span={24}>
                                <Row>
                                    <Col span={4}>
                                        <SettingOutlined
                                            style={{ fontSize: '24px' }} onClick={() => {
                                                this.setState({ fileBrowserVisible: true });
                                            }}
                                        />
                                    </Col>
                                    <Col span={16} className='text-center'>
                                        {
                                            this.state.totalAssertionsCount > 0
                                                ? (
                                                    <>
                                                        <Row>
                                                            <Col span={24}>
                                                                <Progress percent={Math.round((this.state.totalPassedCount + this.state.totalFailedCount) * 100 / this.state.totalAssertionsCount)} width={50} format={() => (this.state.totalPassedCount + this.state.totalFailedCount) + ' / ' + this.state.totalAssertionsCount} />
                                                            </Col>
                                                        </Row>
                                                        <Row className='mt-4'>
                                                            <Col span={8}>
                                                                <Badge count='PASSED' style={{ backgroundColor: TTKColors.assertionPassed }}>
                                                                    <Progress type='circle' width={50} status='success' percent={100} format={() => this.state.totalPassedCount} />
                                                                </Badge>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Badge count='FAILED' style={{ backgroundColor: TTKColors.assertionFailed }}>
                                                                    <Progress type='circle' width={50} status='exception' percent={100} format={() => this.state.totalFailedCount} />
                                                                </Badge>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Badge count='TOTAL' style={{ backgroundColor: '#108ee9' }}>
                                                                    <Progress type='circle' width={50} status='normal' percent={100} format={() => this.state.totalAssertionsCount} />
                                                                </Badge>
                                                            </Col>
                                                        </Row>
                                                    </>
                                                )
                                                : null
                                        }
                                    </Col>
                                    <Col span={4}>
                                        <Row>
                                            <Col span='24'>
                                                <Button
                                                    className='float-right'
                                                    type='primary'
                                                    danger
                                                    onClick={this.handleSendStopClick}
                                                >
                                                    {this.state.sendingOutboundRequestID ? 'Stop' : 'Run'}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row className='mt-2'>
                            <Col span={24}>
                                <>
                                    {this.getTestCaseItems()}
                                </>
                            </Col>
                        </Row>
                    </Sider>
                    <Content
                        className='p-2'
                        style={{
                            background: '#fff',
                        }}
                    >
                        <Monitor />
                    </Content>
                </Layout>
            </>
        );
    }
}

export default OutboundRequest;
