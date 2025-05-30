 
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
import socketIOClient from 'socket.io-client';
import mermaid from 'mermaid';
import { getServerConfig, getConfig } from '../../utils/getConfig';
import { Input, Row, Col, Affix, Modal, Badge, message, Popover, Progress, Menu, Dropdown, Button, Card, Tabs, Table, Collapse, Drawer, Typography, Checkbox, App, ConfigProvider } from 'antd';
import { CaretRightFilled, CaretLeftFilled } from '@ant-design/icons';
import axios from 'axios';
import TestCaseEditor from './TestCaseEditor';
import TestCaseViewer from './TestCaseViewer';
import TestCaseDemoViewer from './TestCaseDemoViewer';
import IterationRunner from './IterationRunner';
import FileDownload from 'js-file-download';
import FileManager from './FileManager.jsx';
import EnvironmentManager from './EnvironmentManager';
import { generateShortName } from '../../utils/nameConversions';

import { FolderParser, TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib';

import SortableList from '../../components/SortableList';

import { arrayMoveImmutable as arrayMove } from 'array-move';

import { TTKColors } from '../../utils/styleHelpers';
import { LocalDB } from '../../services/localDB/LocalDB';
import { isUndefined } from 'lodash';

let ipcRenderer = null;

if(window && window.require) {
    ipcRenderer = window.require('electron').ipcRenderer;
    ipcRenderer.send('mainAction', JSON.stringify({ action: 'ping' }));
}

const { Panel } = Collapse;
const { Text } = Typography;

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

// function readFileAsync(file) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();

//         reader.onload = () => {
//             resolve(reader.result);
//         };

//         reader.onerror = reject;

//         reader.readAsText(file);
//     });
// }

class OutboundRequest extends React.Component {
    constructor() {
        super();
        this.fileManagerRef = React.createRef();
        this.iterationRunnerRef = React.createRef();
        const sessionId = TraceHeaderUtils.generateSessionId();
        this.state = {
            request: {},
            template: {
                options: {},
            },
            inputValues: {},
            additionalData: {
                selectedFiles: [],
            },
            labelsManager: {
                mapping: null,
                labels: [],
                selectedLabels: [],
                selectedFiles: [],
            },
            addNewRequestDialogVisible: false,
            newRequestDescription: '',
            newTemplateName: '',
            newTestCaseName: '',
            createNewTestCaseDialogVisible: false,
            saveTemplateFileName: '',
            saveTemplateTestcasesDialogVisible: false,
            saveTemplateEnvironmentDialogVisible: false,
            showTestCaseIndex: null,
            renameTestCase: false,
            totalPassedCount: 0,
            totalFailedCount: 0,
            totalAssertionsCount: 0,
            sessionId,
            testReport: null,
            userConfig: null,
            sendingOutboundRequestID: null,
            lastOutgoingRequestID: null,
            sequenceDiagramVisible: false,
            folderData: [],
            fileBrowserVisible: false,
            historyReportsVisible: false,
            historyReportsColumns: [
                { title: 'Name', dataIndex: 'name', key: 'name', width: '50%' },
                { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: '20%' },
                { title: 'Run duration in ms', dataIndex: 'duration', key: 'duration', width: '10%' },
                { title: 'Passed / Total', dataIndex: 'successRate', key: 'successRate', width: '10%' },
                { title: 'Status', dataIndex: 'status', key: 'status', width: '10%' },
                {
                    dataIndex: '',
                    key: 'download',
                    width: '10%',
                    render: (text, record) => (
                        <Dropdown overlay={this.downloadReportMenu(record)}>
                            <Button className='float-right' color='info' size='sm' onClick={e => e.preventDefault()}>
                Download
                            </Button>
                        </Dropdown>
                    ),
                },
            ],
            testCaseReorderingEnabled: false,
            curTestCasesUpdated: false,
            testCaseRequestsReorderingEnabled: false,
            curTestCasesRequestsUpdated: false,
            tempReorderedTestCases: [],
            testCaseEditorLogs: [],
            environmentManagerVisible: false,
            resetExecutionOptionEnabled: false,
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
        if(getConfig().isAuthEnabled) {
            const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID');
            if(dfspId) {
                this.state.sessionId = dfspId;
            }
        }
        this.socket.on('outboundProgress/' + this.state.sessionId, this.handleIncomingProgress);
        const additionalData = this.restoreAdditionalData();
        if(additionalData) {
            this.state.additionalData = additionalData;
        }

        const labelsManager = this.restoreLabelsManager();
        if(labelsManager) {
            this.state.labelsManager.mapping = labelsManager.mapping;
            this.state.labelsManager.labels = labelsManager.labels;
            this.state.labelsManager.selectedLabels = labelsManager.selectedLabels;
            this.state.labelsManager.selectedFiles = labelsManager.selectedFiles;
        }
        if(this.state.labelsManager.labels.length === 0 && this.state.userConfig && this.state.userConfig.LABELS && this.state.userConfig.LABELS.length > 0) {
            this.state.labelsManager.labels.push(...this.state.userConfig.LABELS);
        }
        if(!this.state.labelsManager.mapping && this.state.folderData) {
            this.state.labelsManager.mapping = this.getDataLabelsMapping(this.state.folderData);
        }

        const storedFolderData = await this.restoreSavedFolderData();
        if(storedFolderData) {
            this.state.folderData = storedFolderData;
            this.regenerateTemplate(this.state.additionalData);
        }

        if(storedFolderData || additionalData || labelsManager) {
            this.forceUpdate();
        }

        this.startAutoSaveTimer();
    };

    handleEnvironmentChange = newEnvironment => {
        this.state.template.options = { ...newEnvironment.options };
        this.setState({ inputValues: newEnvironment.inputValues });
    };

    handleIncomingProgress = progress => {
        if(!this.state.sendingOutboundRequestID) {
            return null;
        }
        if(progress.status === 'FINISHED') {
            message.success({ content: 'Test case finished', key: 'outboundSendProgress', duration: 2 });
            this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult });
        } else if(progress.status === 'TERMINATED') {
            message.success({ content: 'Test case terminated', key: 'outboundSendProgress', duration: 2 });
            message.success({ content: 'Test case terminated', key: 'outboundStopProgress', duration: 2 });
            this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult });
        } else if(progress.status.startsWith('ITERATION')) {
            this.iterationRunnerRef.current.handleIncomingProgress(progress);
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
                        request.status.transformedRequest = progress.transformedRequest;
                        request.status.additionalInfo = progress.additionalInfo;
                        request.status.testResult = progress.testResult;
                    } else if(progress.status === 'ERROR') {
                        request.status.state = 'error';
                        request.status.response = progress.response;
                        request.status.callback = progress.callback;
                        request.status.requestSent = progress.requestSent;
                        request.status.transformedRequest = progress.transformedRequest;
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

        this.state.resetExecutionOptionEnabled = false;
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
                request.status = {};
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

    handleResetExecution = async () => {
        message.error({ content: 'Execution has been reset', key: 'outboundSendProgress', duration: 2 });
        message.error({ content: 'Execution has been reset', key: 'outboundStopProgress', duration: 2 });
        this.setState({ sendingOutboundRequestID: null, resetExecutionOptionEnabled: false });
    };

    handleSendStopClick = () => {
        if(this.state.sendingOutboundRequestID) {
            if(this.state.resetExecutionOptionEnabled) {
                this.handleResetExecution(this.state.sendingOutboundRequestID);
            } else {
                this.handleStopExecution(this.state.sendingOutboundRequestID);
                this.setState({ resetExecutionOptionEnabled: true });
            }
        } else {
            this.handleSendTemplate();
        }
    };

    handleSendSingleTestCase = async testCaseIndex => {
        const { test_cases, ...remainingProps } = this.state.template;
        const testCaseToSend = { test_cases: [test_cases[testCaseIndex]], ...remainingProps };
        this.handleSendTemplate(testCaseToSend);
    };

    handleReportFileName = event => {
        this.state.template.name = event.target.value;
        this.forceUpdate();
    };

    handleReportSaveToDB = event => {
        this.state.template.saveReport = event.target.checked ? true : false;
        this.forceUpdate();
    };

    // Take the status property out from requests
    convertTemplate = (template, showAdvancedFeaturesAnyway = false) => {
        const { test_cases, ...remainingTestCaseProps } = template;
        let newTestCases = test_cases;
        if(test_cases) {
            const testCaseIds = new Set();
            let i = 0;
            newTestCases = test_cases.map(testCase => {
                // Check if testCase.id is unique, append a suffix if not
                let testCaseId = testCase.id;
                if(testCaseIds.has(testCase.id)) {
                    testCaseId = testCase.id + '-' + i;
                    i = i + 1;
                }
                testCaseIds.add(testCaseId);
                if(testCase.requests) {
                    const { requests, ...remainingProps } = testCase;
                    const newRequests = requests.map(item => {
                        const { status, scripts, ...newRequest } = item;
                        if((this.state.userConfig && this.state.userConfig.ADVANCED_FEATURES_ENABLED) || showAdvancedFeaturesAnyway) {
                            return { ...newRequest, scripts };
                        } else {
                            return newRequest;
                        }
                    });
                    return { ...remainingProps, requests: newRequests, id: testCaseId };
                } else {
                    return { ...testCase, id: testCaseId };
                }
            });
        }
        return { ...remainingTestCaseProps, test_cases: newTestCases };
    };

    handleCreateNewTestCaseClick = testCaseName => {
        const fileSelected = this.getSingleFileSelected();
        if(fileSelected) {
            const fileTemplate = fileSelected.content;
            if(!fileTemplate.test_cases) {
                fileTemplate.test_cases = [];
            }
            const shortName = generateShortName(testCaseName);
            fileTemplate.test_cases.push({ id: shortName, name: testCaseName, requests: [] });
            this.regenerateTemplate(this.state.additionalData);
            this.forceUpdate();
            this.autoSave = true;
        } else {
            message.error('ERROR: no file selected or multiple files are selected');
        }
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
        return null;
    };

    restoreLabelsManager = () => {
        const labelsManager = localStorage.getItem('labelsManager');
        if(labelsManager) {
            try {
                return JSON.parse(labelsManager);
            } catch (err) { }
        }
        return null;
    };

    startAutoSaveTimer = () => {
        this.autoSaveIntervalId = setInterval(() => {
            if(this.autoSave) {
                this.autoSave = false;
                this.autoSaveFolderData(this.state.folderData);
                this.autoSaveAdditionalData(this.state.additionalData);
                this.autoSaveLabelsManager(this.state.labelsManager);
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

    autoSaveLabelsManager = labelsManager => {
        localStorage.setItem('labelsManager', JSON.stringify(labelsManager));
    };

    handleTemplateSaveClick = (fileName, saveTemplateOption) => {
        if(!fileName.endsWith('.json')) {
            message.error('Filename should be ended with .json');
            return;
        }
        let downloadContent = {};
        if(saveTemplateOption === 1) {
            downloadContent = this.state.template;
        } else if(saveTemplateOption === 2) {
            downloadContent = this.state.inputValues;
        }
        this.download(JSON.stringify(this.convertTemplate(downloadContent), null, 2), fileName, 'text/plain');
    };

    regenerateTemplate = async (additionalData = {}) => {
        let testCases = [];
        testCases = FolderParser.getTestCases(this.state.folderData, additionalData.selectedFiles || []);
        // this.state.template.test_cases = JSON.parse(JSON.stringify(testCases))
        this.state.template.test_cases = [];
        for(let i = 0; i < testCases.length; i++) {
            if(testCases[i].requests === undefined) {
                testCases[i].requests = [];
            }
            this.state.template.test_cases.push(testCases[i]);
        }
        // this.state.template.test_cases = testCases.map((item, index) => { return { ...item, id: index + 1} })
        const folders = additionalData.selectedFiles.filter(x => x.slice((x.lastIndexOf('.') - 1 >>> 0) + 2) == '');
        if(additionalData.selectedFiles.length == 1) {
            this.state.template.name = additionalData.selectedFiles[0]
                .replace(/\.[^/.]+$/, '') // Remove extension
                .replace(/^.+\.\//, '') // Remove relative paths
                .replace(/\\|\//g, '_'); // Convert path to snake case
        } else if(folders.length == 1 && additionalData.selectedFiles.every(filePath => filePath.includes(folders[0]))) {
            this.state.template.name = folders[0]
                .replace(/^.+\.\//, '') // Remove relative paths
                .replace(/\\|\//g, '_'); // Convert path to snake case
        } else {
            this.state.template.name = 'multi';
        }

        this.state.additionalData = {
            importedFilename: 'Multiple Files',
            selectedFiles: additionalData.selectedFiles || [],
        };
        this.forceUpdate();
        // this.autoSave = true
    };

    handleDownloadReport = async (event, report) => {
        const testReport = report || this.state.testReport;
        switch (event.key) {
            case 'json':
                const jsonReportFileName = testReport.name + (testReport.runtimeInformation ? '-' + testReport.runtimeInformation.completedTimeISO : '') + '.json';
                FileDownload(JSON.stringify(testReport, null, 2), jsonReportFileName);
                break;
            case 'printhtml':
            case 'html':
            default:
                message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
                const { apiBaseUrl } = getConfig();
                const reportFormat = event.key;
                const response = await axios.post(apiBaseUrl + '/api/reports/testcase/' + reportFormat, testReport, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' });
                let downloadFilename = 'test.' + reportFormat;
                if(response.headers['content-disposition']) {
                    const disposition = response.headers['content-disposition'];
                    if(disposition && disposition.indexOf('attachment') !== -1) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if(matches != null && matches[1]) {
                            downloadFilename = matches[1].replace(/['"]/g, '');
                        }
                    }
                }
                FileDownload(response.data, downloadFilename);
                message.success({ content: 'Report Generated', key: 'downloadReportProgress', duration: 2 });
        }
    };

    handleDownloadDefinition = async event => {
        switch (event.key) {
            case 'printhtml':
            case 'html':
            default:
                message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
                const { apiBaseUrl } = getConfig();
                const reportFormat = event.key;
                const response = await axios.post(apiBaseUrl + '/api/reports/testcase_definition/' + reportFormat, this.state.template, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' });
                let downloadFilename = 'test.' + reportFormat;
                if(response.headers['content-disposition']) {
                    const disposition = response.headers['content-disposition'];
                    if(disposition && disposition.indexOf('attachment') !== -1) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if(matches != null && matches[1]) {
                            downloadFilename = matches[1].replace(/['"]/g, '');
                        }
                    }
                }
                FileDownload(response.data, downloadFilename);
                message.success({ content: 'Report Generated', key: 'downloadReportProgress', duration: 2 });
        }
    };

    handleTestCaseChange = () => {
        this.autoSave = true;
        this.forceUpdate();
    };

    handleTestCaseDelete = testCaseIndex => {
        const fileSelected = this.getSingleFileSelected();
        if(fileSelected) {
            const fileTemplate = fileSelected.content;
            fileTemplate.test_cases.splice(testCaseIndex, 1);
            this.regenerateTemplate(this.state.additionalData);
            this.forceUpdate();
            this.autoSave = true;
        } else {
            message.error('ERROR: no file selected or multiple files are selected');
        }
    };

    handleTestCaseDuplicate = testCaseIndex => {
        const fileSelected = this.getSingleFileSelected();
        if(fileSelected) {
            const fileTemplate = fileSelected.content;

             
            const { id, name, ...otherProps } = fileTemplate.test_cases[testCaseIndex];
            // Deep copy other properties
            const clonedProps = JSON.parse(JSON.stringify(otherProps));

            fileTemplate.test_cases.push({ id: id + '-copy', name: name + ' Copy', ...clonedProps });

            this.regenerateTemplate(this.state.additionalData);
            this.forceUpdate();
            this.autoSave = true;
        } else {
            message.error('ERROR: no file selected or multiple files are selected');
        }
    };

    handleTestCaseRename = (testCaseIndex, newTitle) => {
        const fileSelected = this.getSingleFileSelected();
        if(fileSelected) {
            fileSelected.content.test_cases[testCaseIndex].name = newTitle;
            this.autoSaveFolderData(this.state.folderData);
            this.forceUpdate();
        } else {
            message.error('ERROR: no file selected or multiple files are selected');
        }
    };

    handleBreakOnErrorChange = (breakOnError, testCaseIndex) => {
        this.state.template.options.breakOnError = breakOnError;
        this.regenerateTemplate(this.state.additionalData);
        this.forceUpdate();
    };

    handleDisableRequests = (disabled, testCaseIndex, requestIndex) => {
        const fileSelected = this.getSingleFileSelected();
        if(fileSelected) {
            if(isUndefined(requestIndex)) {
                for(let i = 0; i < fileSelected.content.test_cases[testCaseIndex].requests.length; i++) {
                    fileSelected.content.test_cases[testCaseIndex].requests[i].disabled = disabled;
                }
            } else {
                fileSelected.content.test_cases[testCaseIndex].requests[requestIndex].disabled = disabled;
            }
            this.autoSaveFolderData(this.state.folderData);
            this.regenerateTemplate(this.state.additionalData);
            this.forceUpdate();
        } else {
            message.error('ERROR: multiple files are selected');
        }
    };

    getTestCaseItems = () => {
        if(this.state.template.test_cases) {
            return this.state.template.test_cases.map((testCase, testCaseIndex) => {
                return (
                    <Row className='mb-2'>
                        <Col span={24}>
                            <TestCaseViewer
                                testCase={testCase}
                                labelsManager={this.state.labelsManager}
                                onChange={this.handleTestCaseChange}
                                inputValues={this.state.inputValues}
                                onEdit={() => { this.setState({ showTestCaseIndex: testCaseIndex }); }}
                                onDelete={() => { this.handleTestCaseDelete(testCaseIndex); }}
                                onDuplicate={() => { this.handleTestCaseDuplicate(testCaseIndex); }}
                                onRename={newTestCaseName => { this.handleTestCaseRename(testCaseIndex, newTestCaseName); }}
                                onShowSequenceDiagram={this.handleShowSequenceDiagram}
                                onSend={() => { this.handleSendSingleTestCase(testCaseIndex); }}
                                onDisableRequests={(disabled, requestIndex) => { this.handleDisableRequests(disabled, testCaseIndex, requestIndex); }}
                            />
                        </Col>
                    </Row>
                );
            });
        }
        return null;
    };

    getTestCaseDemoItems = () => {
        if(this.state.template.test_cases) {
            return this.state.template.test_cases.map((testCase, testCaseIndex) => {
                return (
                    <Row className='mb-2'>
                        <Col span={24}>
                            <TestCaseDemoViewer
                                testCase={testCase}
                                labelsManager={this.state.labelsManager}
                                inputValues={this.state.inputValues}
                                onShowSequenceDiagram={this.handleShowSequenceDiagram}
                            />
                        </Col>
                    </Row>
                );
            });
        }
        return null;
    };

    downloadReportMenu = record => {
        const report = record ? this.state.historyReportsLocal.find(report => report._id === record.key) : undefined;
        return (
            <Menu onClick={event => this.handleDownloadReport(event, report)}>
                <Menu.Item key='json'>JSON format</Menu.Item>
                <Menu.Item key='html'>HTML report</Menu.Item>
                <Menu.Item key='printhtml'>Printer Friendly HTML report</Menu.Item>
            </Menu>
        );
    };

    downloadDefinitionMenu = () => {
        return (
            <Menu onClick={event => this.handleDownloadDefinition(event)}>
                <Menu.Item key='html'>HTML format</Menu.Item>
            </Menu>
        );
    };

    handleShowSequenceDiagram = async testCase => {
        await this.setState({ sequenceDiagramVisible: true });
        this.seqDiagContainer.removeAttribute('data-processed');
        let seqSteps = '';
        const rowCount = testCase.requests.length;
        for(let i = 0; i < rowCount; i++) {
            let transactionBegan = false;
            if(testCase.requests[i].status && testCase.requests[i].status.requestSent) {
                const stepStr = testCase.requests[i].status.requestSent.method + ' ' + testCase.requests[i].status.requestSent.path;
                seqSteps += 'Note over TTK,PEER: ' + testCase.requests[i].status.requestSent.description + '\n';
                seqSteps += 'TTK->>PEER: [HTTP REQ] ' + stepStr + '\n';
                transactionBegan = true;
                seqSteps += 'activate PEER\n';
            }
            if(testCase.requests[i].status && testCase.requests[i].status.response) {
                const stepStr = testCase.requests[i].status.response.status + ' ' + testCase.requests[i].status.response.statusText + ' ' + testCase.requests[i].status.state;
                if(testCase.requests[i].status.state === 'error') {
                    seqSteps += 'PEER--xTTK: [HTTP RESP] ' + stepStr + '\n';
                } else {
                    seqSteps += 'PEER-->>TTK: [HTTP RESP] ' + stepStr + '\n';
                }
            }
            if(testCase.requests[i].status && testCase.requests[i].status.callback) {
                const stepStr = testCase.requests[i].status.callback.url;
                seqSteps += 'PEER-->>TTK: [ASYNC CALLBACK] ' + stepStr + '\n';
            }
            if(transactionBegan) {
                seqSteps += 'deactivate PEER\n';
            }
        }
        if(seqSteps) {
            // return 'sequenceDiagram\n' + seqSteps
            const code = 'sequenceDiagram\n' + seqSteps;
            try {
                mermaid.parse(code);
                this.seqDiagContainer.innerHTML = code;
                mermaid.init(undefined, this.seqDiagContainer);
            } catch (e) {
                // {str, hash}
                // const base64 = Base64.encodeURI(e.str || e.message)
                // history.push(`${url}/error/${base64}`)
                console.log('Diagram generation error', e.str || e.message);
            }
        } else {
            console.log('No data');
        }
    };

    handleFileManagerContentChange = async (folderData, selectedFiles) => {
        if(folderData) {
            this.state.folderData = folderData;
            this.state.labelsManager.mapping = this.getDataLabelsMapping(folderData);
        }
        if(selectedFiles != null) {
            if(selectedFiles.length === 0) {
                this.state.labelsManager.selectedFiles = [];
                this.state.labelsManager.selectedLabels = [];
            }
            this.state.additionalData.selectedFiles = selectedFiles;
        }
        this.regenerateTemplate(this.state.additionalData);
        this.autoSave = true;
        this.forceUpdate();
    };

    historyReportsLocal = async () => {
        const { apiBaseUrl } = getConfig();
        const reports = await axios.get(apiBaseUrl + '/api/history/reports');
        return reports.data;
    };

    historyReportsDataSource = () => {
        const dataSource = [];
        this.state.historyReportsLocal.forEach(report => {
            const historyReportsDataSource = {
                key: report._id,
                name: report.name,
                timestamp: report.runtimeInformation.completedTimeISO,
                duration: report.runtimeInformation.runDurationMs,
                successRate: `${report.runtimeInformation.totalPassedAssertions}/${report.runtimeInformation.totalAssertions}`,
                status: report.runtimeInformation.totalPassedAssertions === report.runtimeInformation.totalAssertions ? 'PASSED' : 'FAILED',
            };
            dataSource.push(historyReportsDataSource);
        });
        return dataSource;
    };

    onSortEnd = ({ oldIndex, newIndex }) => {
        const newItems = arrayMove(this.state.tempReorderedTestCases, oldIndex, newIndex);
        this.setState({
            curTestCasesUpdated: true,
            tempReorderedTestCases: newItems,
        });
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

    getDataLabelsMapping = (folderData = [], result = {}, parentLabels = []) => {
        for(let i = 0; i < folderData.length; i++) {
            const data = folderData[i];
            const currentParentLabels = [...parentLabels, ...(data.extraInfo.labels || [])];
            for(let j = 0; j < currentParentLabels.length; j++) {
                const label = currentParentLabels[j];
                if(!result[label]) {
                    result[label] = [];
                }
                result[label].push(data.key);
            }
            if(data.extraInfo.type === 'folder') {
                this.getDataLabelsMapping(data.children, result, currentParentLabels);
            }
        }
        return result;
    };

    renderItem = item => (
        <div className="test-case-item">
            {item.name}
        </div>
    );

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

        const createNewTestCaseDialogContent = (
            <>
                <Input
                    placeholder='Test case name'
                    type='text'
                    value={this.state.newTestCaseName}
                    onChange={e => { this.setState({ newTestCaseName: e.target.value }); }}
                    onKeyDown={e => {
                        if(e.key === 'Escape') {
                            this.setState({ createNewTestCaseDialogVisible: false });
                        }
                    }}
                    onPressEnter={() => {
                        this.handleCreateNewTestCaseClick(this.state.newTestCaseName);
                        this.setState({ createNewTestCaseDialogVisible: false });
                    }}
                />
                <Button
                    className='text-right mt-2'
                    color='success'
                    href='#pablo'
                    onClick={() => {
                        this.handleCreateNewTestCaseClick(this.state.newTestCaseName);
                        this.setState({ createNewTestCaseDialogVisible: false });
                    }}
                    size='sm'
                >
          Create
                </Button>
            </>
        );

        const getSaveTemplateDialogContent = templateOption => {
            return (
                <>
                    <Row>
                        <Col>
                            <Input
                                placeholder='File name'
                                type='text'
                                value={this.state.saveTemplateFileName}
                                onChange={e => { this.setState({ saveTemplateFileName: e.target.value }); }}
                                onKeyDown={e => {
                                    if(e.key === 'Escape') {
                                        if(templateOption == 1) {
                                            this.setState({ saveTemplateTestcasesDialogVisible: false });
                                        } else {
                                            this.setState({ saveTemplateEnvironemntDialogVisible: false });
                                        }
                                    }
                                }}
                                onPressEnter={() => {
                                    this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption);
                                    if(templateOption == 1) {
                                        this.setState({ saveTemplateTestcasesDialogVisible: false });
                                    } else {
                                        this.setState({ saveTemplateEnvironemntDialogVisible: false });
                                    }
                                }}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Button
                                className='text-right mt-2'
                                color='success'
                                href='#pablo'
                                onClick={() => {
                                    this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption);
                                    if(templateOption == 1) {
                                        this.setState({ saveTemplateTestcasesDialogVisible: false });
                                    } else {
                                        this.setState({ saveTemplateEnvironemntDialogVisible: false });
                                    }
                                }}
                                size='sm'
                            >
                Create
                            </Button>
                        </Col>
                    </Row>
                </>
            );
        };

        return (
            <ConfigProvider
                theme={{
                    components: {
                        ResizeObserver: {
                            // Enable ResizeObserver.Collection
                            collection: true,
                        },
                    },
                }}
            >
                <App>
                    <Drawer
                        title='File Browser'
                        placement='left'
                        width={600}
                        closable={false}
                        onClose={() => {
                            this.setState({ fileBrowserVisible: false });
                        }}
                        open={this.state.fileBrowserVisible}
                    >
                        <FileManager
                            folderData={this.state.folderData}
                            selectedFiles={this.state.additionalData.selectedFiles}
                            labelsManager={this.state.labelsManager}
                            onChange={this.handleFileManagerContentChange}
                            ref={this.fileManagerRef}
                            ipcRenderer={ipcRenderer}
                        />
                    </Drawer>
                    <Drawer
                        title='Environment Manager'
                        forceRender
                        placement='right'
                        width={800}
                        closable={false}
                        zIndex={1100}
                        onClose={() => {
                            this.setState({ environmentManagerVisible: false });
                        }}
                        open={this.state.environmentManagerVisible}
                    >
                        <EnvironmentManager
                            onChange={this.handleEnvironmentChange}
                        />
                    </Drawer>

                    <Modal
                        centered
                        destroyOnHidden
                        forceRender
                        title='Template'
                        className='w-50 p-3'
                        open={!!this.state.showTemplate}
                        footer={null}
                        onCancel={() => { this.setState({ showTemplate: false }); }}
                    >
                        <pre>{JSON.stringify(this.convertTemplate({ ...this.state.template, inputValues: this.state.inputValues }), null, 2)}</pre>
                    </Modal>
                    <Modal
                        style={{ top: 20 }}
                        styles={{ body: { height: '85vh', overflowY: 'auto' } }}
                        destroyOnHidden
                        forceRender
                        title='Iteration Runner'
                        open={!!this.state.showIterationRunner}
                        footer={null}
                        onCancel={() => { this.setState({ showIterationRunner: false }); }}
                    >
                        <IterationRunner
                            template={this.convertTemplate({ ...this.state.template, inputValues: this.state.inputValues })}
                            sessionId={this.state.sessionId}
                            ref={this.iterationRunnerRef}
                        />
                    </Modal>
                    <Modal
                        centered
                        destroyOnHidden
                        forceRender
                        title='Sequence Diagram'
                        className='w-50 p-3'
                        open={!!this.state.sequenceDiagramVisible}
                        footer={null}
                        onCancel={() => { this.seqDiagContainer.innerHTML = ''; this.setState({ sequenceDiagramVisible: false }); }}
                    >
                        <div
                            ref={div => {
                                this.seqDiagContainer = div;
                            }}
                        />
                    </Modal>
                    <Modal
                        style={{ top: 20 }}
                        styles={{ body: { height: '85vh', overflowY: 'auto' } }}
                        destroyOnHidden
                        forceRender
                        title={this.state.showTestCaseIndex != null ? this.state.template.test_cases[this.state.showTestCaseIndex].name : ''}
                        width='90%'
                        open={this.state.showTestCaseIndex != null}
                        footer={null}
                        keyboard={false}
                        maskClosable={false}
                        onCancel={() => { this.setState({ showTestCaseIndex: null }); }}
                    >
                        {
                            this.state.showTestCaseIndex != null
                                ? (
                                    <TestCaseEditor
                                        testCase={this.state.template.test_cases[this.state.showTestCaseIndex]}
                                        inputValues={this.state.inputValues}
                                        userConfig={this.state.userConfig}
                                        logs={this.state.testCaseEditorLogs}
                                        onChange={this.handleTestCaseChange}
                                        onSend={() => { this.handleSendSingleTestCase(this.state.showTestCaseIndex); }}
                                        traceID={this.state.lastOutgoingRequestID}
                                        onOpenEnvironmentManager={() => { this.setState({ environmentManagerVisible: true }); }}
                                    />
                                )
                                : null
                        }
                    </Modal>

                    <Row>
                        <Col span={24}>
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Affix: {
                                            // Configure Affix-specific settings
                                            className: 'custom-affix-wrapper',
                                        },
                                    },
                                }}
                            >
                                <App>
                                    <Affix offsetTop={2}>
                                        <Row align='top'>
                                            <Col span={12}>
                                                <Button
                                                    type='primary' className='mt-2' style={{ height: '40px', backgroundColor: '#718ebc' }} onClick={() => {
                                                        this.setState({ fileBrowserVisible: true });
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Collections Manager</Text> <CaretRightFilled style={{ fontSize: '18px' }} />
                                                </Button>
                                            </Col>
                                            <Col span={12}>
                                                <Button
                                                    type='primary' className='mt-2 float-right' style={{ height: '40px', backgroundColor: '#718ebc' }} onClick={() => {
                                                        this.setState({ environmentManagerVisible: true });
                                                    }}
                                                >
                                                    <CaretLeftFilled style={{ fontSize: '18px' }} /> <Text style={{ color: 'white', fontWeight: 'bold' }}>Environment Manager</Text>
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col span={24}>
                                                <Card className='mb-4'>
                                                    <Row>
                                                        <Col span={10} />
                                                        <Col span={4} className='text-center'>
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
                                                        <Col span={10}>
                                                            <Row>
                                                                <Col span='24'>
                                                                    <Button
                                                                        className='float-right'
                                                                        type='primary'
                                                                        danger
                                                                        onClick={this.handleSendStopClick}
                                                                    >
                                                                        {this.state.sendingOutboundRequestID ? (this.state.resetExecutionOptionEnabled ? 'Reset' : 'Stop') : 'Run'}
                                                                    </Button>
                                                                    <Button
                                                                        className='float-right mr-2'
                                                                        type='dashed'
                                                                        danger
                                                                        onClick={() => { this.setState({ showIterationRunner: true }); }}
                                                                    >
                                                                      Iteration Runner
                                                                    </Button>
                                                                    <Button
                                                                        className='float-right mr-2'
                                                                        type='dashed'
                                                                        onClick={() => { this.setState({ showTemplate: true }); }}
                                                                    >
                                                                      Show Current Template
                                                                    </Button>,
                                                                    {
                                                                        getConfig().isAuthEnabled
                                                                            ? <>
                                                                                <Button
                                                                                    className='float-right' type='primary' danger onClick={async e => {
                                                                                        this.setState({ historyReportsLocal: await this.historyReportsLocal() });
                                                                                        this.setState({ historyReportsVisible: true });
                                                                                    }}
                                                                                >
                                                                    Reports History
                                                                                </Button>
                                                                                {
                                                                                    this.state.historyReportsVisible
                                                                                        ? <Modal
                                                                                            title='Reports History'
                                                                                            open={this.state.historyReportsVisible}
                                                                                            width='70%'
                                                                                            destroyOnHidden
                                                                                            onOk={() => {
                                                                                                this.setState({ historyReportsVisible: false });
                                                                                            }}
                                                                                            onCancel={() => {
                                                                                                this.setState({ historyReportsVisible: false });
                                                                                            }}
                                                                                        >
                                                                                            <Row>
                                                                                                <Col>
                                                                                                    <Table
                                                                                                        columns={this.state.historyReportsColumns}
                                                                                                        dataSource={this.historyReportsDataSource()}
                                                                                                    />
                                                                                                </Col>
                                                                                            </Row>
                                                                                        </Modal>
                                                                                        : null
                                                                                }
                                                                            </>
                                                                            : null
                                                                    }
                                                                    {
                                                                        this.state.template.test_cases
                                                                            ? (
                                                                                <Checkbox
                                                                                    className='ml-2 mt-1 float-right'
                                                                                    onClick={e => {
                                                                                        this.handleBreakOnErrorChange(e.target.checked);
                                                                                    }}
                                                                                    checked={this.state.template.options?.breakOnError}
                                                                                >
                                                                                    Break test run on error
                                                                                </Checkbox>
                                                                            )
                                                                            : null
                                                                    }
                                                                </Col>
                                                            </Row>
                                                            <Row className='mt-2' justify="end">
                                                                <Col span='6'>
                                                                    <Checkbox
                                                                        className='ml-2 mt-1 float-right'
                                                                        onChange={this.handleReportSaveToDB}
                                                                        checked={this.state.template.saveReport}
                                                                    >
                                                                    Save Report to DB
                                                                    </Checkbox>
                                                                </Col>
                                                                <Col span='12'>
                                                                    {
                                                                        this.state.template.saveReport
                                                                            ? (
                                                                                <Input
                                                                                    className='mr-2'
                                                                                    defaultValue="multi"
                                                                                    value={this.state.template.name}
                                                                                    onChange={this.handleReportFileName}
                                                                                    addonBefore="Report Name"
                                                                                />
                                                                            ) : null
                                                                    }
                                                                </Col>
                                                            </Row>
                                                            <Row className='mt-2'>
                                                                <Col span='24'>
                                                                    {
                                                                        this.state.testReport
                                                                            ? <Dropdown overlay={this.downloadReportMenu()}>
                                                                                <Button
                                                                                    className='float-right'
                                                                                    type='primary'
                                                                                    shape='round'
                                                                                    onClick={e => e.preventDefault()}
                                                                                >
                                                                    Download Report
                                                                                </Button>
                                                                            </Dropdown>
                                                                            : null
                                                                    }
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Affix>
                                </App>
                            </ConfigProvider>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Tabs defaultActiveKey='1' items={[
                                {
                                    key: '1',
                                    label: 'Test Cases',
                                    children: (
                                        <>
                                            <Row className='mb-2'>
                                                <Col span={24}>
                                                    {
                                                        this.state.template.test_cases && this.state.template.test_cases.length > 0
                                                            ? <Dropdown overlay={this.downloadDefinitionMenu()}>
                                                                <Button
                                                                    className='float-right'
                                                                    type='primary'
                                                                    shape='round'
                                                                    onClick={e => e.preventDefault()}
                                                                >
                                                    Download Definition
                                                                </Button>
                                                            </Dropdown>
                                                            : null
                                                    }
                                                    <Popover
                                                        className='float-right mr-2'
                                                        content={getSaveTemplateDialogContent(1)}
                                                        title='Enter filename to save'
                                                        trigger='click'
                                                        open={this.state.saveTemplateTestcasesDialogVisible}
                                                        onOpenChange={visible => this.setState({ saveTemplateTestcasesDialogVisible: visible })}
                                                    >
                                                        <Button
                                                            className='float-right'
                                                            type='default'
                                                        >
                                                    Export Loaded Testcases
                                                        </Button>
                                                    </Popover>
                                                    <Popover
                                                        content={createNewTestCaseDialogContent}
                                                        className='mr-2'
                                                        title='Enter a name for the template'
                                                        trigger='click'
                                                        open={this.state.createNewTestCaseDialogVisible}
                                                        onOpenChange={visible => this.setState({ createNewTestCaseDialogVisible: visible })}
                                                    >
                                                        <Button
                                                            type='primary'
                                                        >
                                                    Add Test Case
                                                        </Button>
                                                    </Popover>
                                                    {
                                                        this.state.testCaseReorderingEnabled
                                                            ? (
                                                                <>
                                                                    <Button
                                                                        className='text-right'
                                                                        type='dashed'
                                                                        danger
                                                                        onClick={async () => {
                                                                            if(this.state.curTestCasesUpdated) {
                                                                                const fileSelected = this.getSingleFileSelected();
                                                                                fileSelected.content.test_cases = this.state.tempReorderedTestCases;
                                                                                this.regenerateTemplate(this.state.additionalData);
                                                                                this.setState({ curTestCasesUpdated: false, tempReorderedTestCases: [] });
                                                                                this.autoSaveFolderData(this.state.folderData);
                                                                            } else {
                                                                                message.error({ content: 'No changes found', key: 'TestCaseRequestsReordering', duration: 3 });
                                                                            }
                                                                            this.setState({ testCaseReorderingEnabled: false });
                                                                        }}
                                                                    >
                                                      Apply Reordering
                                                                    </Button>
                                                                    <Button
                                                                        className='text-right ml-2'
                                                                        type='dashed'
                                                                        onClick={async () => {
                                                                            this.setState({ curTestCasesUpdated: false, testCaseReorderingEnabled: false, tempReorderedTestCases: [] });
                                                                        }}
                                                                    >
                                                      Cancel Reordering
                                                                    </Button>
                                                                </>
                                                            )
                                                            : (
                                                                this.state.additionalData && this.state.additionalData.selectedFiles
                                                                    ? <Button
                                                                        className='text-right'
                                                                        type='default'
                                                                        onClick={() => {
                                                                            const fileSelected = this.getSingleFileSelected();
                                                                            if(fileSelected) {
                                                                                this.setState({ tempReorderedTestCases: [...this.state.template.test_cases], testCaseReorderingEnabled: true });
                                                                            } else {
                                                                                message.error('ERROR: Only one file should be selected to reorder the testcases');
                                                                            }
                                                                        }}
                                                                    >
                                                      Reorder Test Cases
                                                                    </Button>
                                                                    : null
                                                            )
                                                    }
                                                </Col>
                                            </Row>
                                            {
                                                this.state.testCaseReorderingEnabled
                                                    ? (
                                                        <SortableList
                                                            items={this.state.tempReorderedTestCases.map((testCase, index) => ({
                                                                ...testCase,
                                                                id: testCase.id || `testcase-${index}`,
                                                            }))}
                                                            onSortEnd={this.onSortEnd}
                                                            renderItem={this.renderItem}
                                                        />
                                                    )
                                                    : (
                                                        <>
                                                            {this.getTestCaseItems()}
                                                        </>
                                                    )
                                            }
                                        </>
                                    ),
                                },
                                {
                                    key: '2',
                                    label: 'Demo View',
                                    children: this.getTestCaseDemoItems(),
                                },
                            ]} />
                        </Col>
                    </Row>
                </App>
            </ConfigProvider>
        );
    }
}

export default OutboundRequest;
