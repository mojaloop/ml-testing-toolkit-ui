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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";
import socketIOClient from "socket.io-client";
import mermaid from 'mermaid'
import { getServerConfig } from '../../utils/getConfig'
import { Input, Row, Col, Affix, Descriptions, Modal, Badge, message, Popover, Progress, Menu, Dropdown, Button, Card, Tabs, Table, Collapse, Drawer, Typography, Checkbox, Radio} from 'antd';
import { WarningTwoTone, DeleteTwoTone, CaretRightFilled, CaretLeftFilled } from '@ant-design/icons';
import 'antd/dist/antd.css';
import axios from 'axios';
import TestCaseEditor from './TestCaseEditor'
import TestCaseViewer from './TestCaseViewer'
import IterationRunner from './IterationRunner'
import { getConfig } from '../../utils/getConfig'
import FileDownload from 'js-file-download'
import FileManager from "./FileManager.jsx";
import ServerLogsViewer from './ServerLogsViewer'
import EnvironmentManager from './EnvironmentManager'

import { FolderParser, TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib'

import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import arrayMove from 'array-move'
import { extendObservable, trace } from "mobx";

import { TTKColors } from '../../utils/styleHelpers'
import { LocalDB } from '../../services/localDB/LocalDB';

let ipcRenderer = null

if (window && window.require) {
  ipcRenderer = window.require('electron').ipcRenderer
  ipcRenderer.send('mainAction', JSON.stringify({ action: 'ping' }))
}

const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

function buildFileSelector(multi = false, directory = false) {
  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  if (multi) {
    fileSelector.setAttribute('multiple', 'multiple');
  }
  if (directory) {
    fileSelector.setAttribute('webkitdirectory', '');
  }
  return fileSelector;
}

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  })
}

class OutboundRequest extends React.Component {

  constructor() {
    super();
    this.fileManagerRef = React.createRef();
    this.iterationRunnerRef = React.createRef();
    const sessionId = TraceHeaderUtils.generateSessionId()
    this.state = {
      request: {},
      template: {},
      inputValues: {},
      additionalData: {
        selectedFiles: []
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
      sessionId: sessionId,
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
          dataIndex: '', key: 'download', width: '10%', render: (text, record) => (
            <Dropdown overlay={this.downloadReportMenu(record)}>
              <Button className="float-right" color="info" size="sm" onClick={e => e.preventDefault()}>
                Download
            </Button>
            </Dropdown>
          )
        }
      ],
      testCaseReorderingEnabled: false,
      curTestCasesUpdated: false,
      testCaseRequestsReorderingEnabled: false,
      curTestCasesRequestsUpdated: false,
      tempReorderedTestCases: [],
      serverLogsVisible: true,
      testCaseEditorLogs: [],
      environmentManagerVisible: false
    };
  }

  socket = null
  autoSave = false
  autoSaveIntervalId = null

  componentWillUnmount = () => {
    if (this.socket) {
      this.socket.disconnect()
    }
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId)
    }
  }

  componentDidMount = async () => {
    this.environmentFileSelector = buildFileSelector();
    this.environmentFileSelector.addEventListener('input', (e) => {
      if (e.target.files) {
        this.handleImportEnvironmentFile(e.target.files[0])
        this.environmentFileSelector.value = null
      }
    })

    // const sampleTemplate = require('./sample1.json')
    // this.setState({template: sampleTemplate})
    const { userConfigRuntime } = await getServerConfig()

    this.setState({ userConfig: userConfigRuntime })
    const { apiBaseUrl } = getConfig()
    this.socket = socketIOClient(apiBaseUrl);
    // this.socket.on("outboundProgress", this.handleIncomingProgress);
    if (getConfig().isAuthEnabled) {
      const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID')
      if (dfspId) {
        this.state.sessionId = dfspId
      }
    }
    this.socket.on("outboundProgress/" + this.state.sessionId, this.handleIncomingProgress);

    const additionalData = this.restoreAdditionalData()
    const storedFolderData = await this.restoreSavedFolderData()

    if (storedFolderData) {
      this.state.folderData = storedFolderData
      this.regenerateTemplate(additionalData.selectedFiles)
    }

    if (additionalData) {
      this.state.additionalData = additionalData
    }

    if (storedFolderData || additionalData) {
      this.forceUpdate()
    }

    this.startAutoSaveTimer()

  }

  handleInputValuesChange = (newInputValues) => {
    this.setState({inputValues: newInputValues})
  }

  handleIncomingProgress = (progress) => {
    if (progress.status === 'FINISHED') {
      message.success({ content: 'Test case finished', key: 'outboundSendProgress', duration: 2 });
      this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult })
    } else if (progress.status === 'TERMINATED') {
      message.success({ content: 'Test case terminated', key: 'outboundStopProgress', duration: 2 });
      this.setState({ sendingOutboundRequestID: null, testReport: progress.totalResult })
    } else if (progress.status.startsWith('ITERATION')) {
      this.iterationRunnerRef.current.handleIncomingProgress(progress)
    } else {
      let testCase = this.state.template.test_cases.find(item => item.id === progress.testCaseId)
      if (testCase) {
        let request = testCase.requests.find(item => item.id === progress.requestId)
        if (request.status) {
          // Update total passed count
          const passedCount = (progress.testResult) ? progress.testResult.passedCount : 0
          const failedCount = (progress.testResult && progress.testResult.results && progress.testResult.passedCount !== progress.testResult.results.length) ? Object.entries(progress.testResult.results).filter(item => item[1].status === 'FAILED').length : 0
          this.state.totalPassedCount += passedCount
          this.state.totalFailedCount += failedCount
          request.status.progressStatus = progress.status
          if (progress.status === 'SUCCESS') {
            request.status.state = 'finish'
            request.status.response = progress.response
            request.status.callback = progress.callback
            request.status.requestSent = progress.requestSent
            request.status.additionalInfo = progress.additionalInfo
            request.status.testResult = progress.testResult
          } else if (progress.status === 'ERROR') {
            request.status.state = 'error'
            request.status.response = progress.response
            request.status.callback = progress.callback
            request.status.requestSent = progress.requestSent
            request.status.additionalInfo = progress.additionalInfo
            request.status.testResult = progress.testResult
            // Clear the waiting status of the remaining requests
            for (let i in testCase.requests) {
              if (!testCase.requests[i].status) {
                testCase.requests[i].status = {}
              }
              if (testCase.requests[i].status.state === 'process') {
                testCase.requests[i].status.state = 'wait'
                testCase.requests[i].status.response = null
                testCase.requests[i].status.callback = null
                testCase.requests[i].status.requestSent = null
                testCase.requests[i].status.additionalInfo = {}
                testCase.requests[i].status.testResult = null
              }
            }
            // message.error({ content: 'Test case failed', key: 'outboundSendProgress', duration: 3 });
          } else if (progress.status === 'SKIPPED') {
            request.status.state = 'error'
            request.status.response = progress.response
            request.status.callback = progress.callback
            request.status.requestSent = progress.requestSent
            request.status.additionalInfo = progress.additionalInfo
            request.status.testResult = progress.testResult
          }
          this.forceUpdate()
        }
      }
    }
  }

  // mockTypeSuccess = true
  handleSendTemplate = async (template = null) => {
    // Initialize counts to zero
    this.state.totalPassedCount = 0
    this.state.totalFailedCount = 0
    this.state.totalAssertionsCount = 0
    this.state.testReport = null

    const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix()
    this.state.currentEndToEndId = TraceHeaderUtils.generateEndToEndId()
    const traceId = traceIdPrefix + this.state.sessionId + this.state.currentEndToEndId

    // const outboundRequestID = Math.random().toString(36).substring(7);
    message.loading({ content: 'Initilizing the test cases...', key: 'outboundSendProgress' });
    const { apiBaseUrl } = getConfig()
    const convertedTemplate = template ? this.convertTemplate(template) : this.convertTemplate(this.state.template)
    convertedTemplate.inputValues = this.state.inputValues
    // await axios.post(apiBaseUrl + "/api/outbound/template/" + outboundRequestID, template ? template : this.state.template, { headers: { 'Content-Type': 'application/json' } })
    await axios.post(apiBaseUrl + "/api/outbound/template/" + traceId, convertedTemplate, { headers: { 'Content-Type': 'application/json' } })

    this.state.sendingOutboundRequestID = traceId
    this.state.lastOutgoingRequestID = traceId
    this.state.testCaseEditorLogs = []
    message.loading({ content: 'Executing the test cases...', key: 'outboundSendProgress', duration: 10 });

    // Set the status to waiting for all the requests
    for (let i in this.state.template.test_cases) {
      for (let j in this.state.template.test_cases[i].requests) {
        const request = this.state.template.test_cases[i].requests[j]
        // console.log(request)
        // Also update the total assertion count
        this.state.totalAssertionsCount += (request.tests && request.tests.assertions) ? request.tests.assertions.length : 0
        if (!request.status) {
          request.status = {}
        }
        request.status.state = 'process'
      }
    }
    this.forceUpdate()
  }

  handleStopExecution = async (outboundRequestID) => {
    message.loading({ content: 'Terminating the execution...', key: 'outboundStopProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.delete(apiBaseUrl + "/api/outbound/template/" + outboundRequestID)
  }

  handleSendStopClick = () => {
    if (this.state.sendingOutboundRequestID) {
      this.handleStopExecution(this.state.sendingOutboundRequestID)
    } else {
      this.handleSendTemplate()
    }
  }

  handleSendSingleTestCase = async (testCaseIndex) => {
    const { test_cases, ...remainingProps } = this.state.template
    const testCaseToSend = { test_cases: [test_cases[testCaseIndex]], ...remainingProps }
    this.handleSendTemplate(testCaseToSend)
  }

  // Take the status property out from requests
  convertTemplate = (template, showAdvancedFeaturesAnyway = false) => {
    let { test_cases, ...remainingTestCaseProps } = template
    let newTestCases = test_cases
    if (test_cases) {
      newTestCases = test_cases.map(testCase => {
        if (testCase.requests) {
          let { requests, ...remainingProps } = testCase
          const newRequests = requests.map(item => {
            const { status, scripts, ...newRequest } = item
            if ((this.state.userConfig && this.state.userConfig.ADVANCED_FEATURES_ENABLED) || showAdvancedFeaturesAnyway) {
              return { ...newRequest, scripts }
            } else {
              return newRequest
            }
          })
          return { ...remainingProps, requests: newRequests }
        } else {
          return testCase
        }
      })
    }
    return { ...remainingTestCaseProps, test_cases: newTestCases }
  }

  handleCreateNewTestCaseClick = (testCaseName) => {
    const fileSelected = this.getSingleFileSelected()
    if (fileSelected) {
      const fileTemplate = fileSelected.content
      if (!fileTemplate.test_cases) {
        fileTemplate.test_cases = []
      }
      // Find highest request id to determine the new ID
      let maxId = +fileTemplate.test_cases.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)
      fileTemplate.test_cases.push({ id: maxId+1, name: testCaseName, requests: [] })
      this.regenerateTemplate(this.state.additionalData.selectedFiles)
      this.forceUpdate()
      this.autoSave = true
    } else {
      message.error('ERROR: no file selected or multiple files are selected');
    }
  }

  download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  restoreSavedFolderData = async () => {
    // const storedFolderData = localStorage.getItem('folderData')
    const storedFolderData = await LocalDB.getItem('folderData')
    if(storedFolderData) {
      try {
        return JSON.parse(storedFolderData)
      } catch (err) { }
    }
    return null
  }

  restoreAdditionalData = () => {
    const additionalData = localStorage.getItem('additionalData')
    if (additionalData) {
      try {
        return JSON.parse(additionalData)
      } catch (err) { }
    }
    return {}
  }

  startAutoSaveTimer = () => {
    this.autoSaveIntervalId = setInterval(() => {
      if (this.autoSave) {
        this.autoSave = false
        this.autoSaveFolderData(this.state.folderData)
        this.autoSaveAdditionalData(this.state.additionalData)
      }
    },
      2000)
  }

  autoSaveFolderData = (folderData) => {
    // localStorage.setItem('folderData', JSON.stringify(folderData));
    LocalDB.setItem('folderData', JSON.stringify(folderData))
  }

  autoSaveAdditionalData = (additionalData) => {
    localStorage.setItem('additionalData', JSON.stringify(additionalData));
  }

  handleTemplateSaveClick = (fileName, saveTemplateOption) => {
    if (!fileName.endsWith('.json')) {
      message.error('Filename should be ended with .json');
      return
    }
    let downloadContent = {}
    if (saveTemplateOption === 1) {
      downloadContent = this.state.template
    } else if (saveTemplateOption === 2) {
      downloadContent = this.state.inputValues
    }
    this.download(JSON.stringify(this.convertTemplate(downloadContent), null, 2), fileName, 'text/plain');
  }

  regenerateTemplate = async (selectedFiles = null) => {
    var testCases = []
    testCases = FolderParser.getTestCases(this.state.folderData, selectedFiles)
    // this.state.template.test_cases = JSON.parse(JSON.stringify(testCases))
    this.state.template.test_cases = []
    for (let i=0; i < testCases.length; i++) {
      if (testCases[i].requests === undefined) {
        testCases[i].requests = []
      }
      const testCaseRef = testCases[i]
      this.state.template.test_cases.push({ ...testCaseRef, id: i + 1})
    }
    // this.state.template.test_cases = testCases.map((item, index) => { return { ...item, id: index + 1} })
    this.state.template.name = 'multi'
    this.state.additionalData = {
      importedFilename: 'Multiple Files',
      selectedFiles: selectedFiles
    }
    this.forceUpdate()
    // this.autoSave = true
  }

  handleDownloadReport = async (event, report) => {
    const testReport = report || this.state.testReport
    switch (event.key) {
      case 'json':
        const jsonReportFileName = testReport.name + (testReport.runtimeInformation ? '-' + testReport.runtimeInformation.completedTimeISO : '') + '.json'
        FileDownload(JSON.stringify(testReport, null, 2), jsonReportFileName)
        break
      case 'printhtml':
      case 'html':
      default:
        message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
        const { apiBaseUrl } = getConfig()
        const reportFormat = event.key
        const response = await axios.post(apiBaseUrl + "/api/reports/testcase/" + reportFormat, testReport, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' })
        let downloadFilename = "test." + reportFormat
        if (response.headers['content-disposition']) {
          const disposition = response.headers['content-disposition']
          if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              downloadFilename = matches[1].replace(/['"]/g, '');
            }
          }
        }
        FileDownload(response.data, downloadFilename)
        message.success({ content: 'Report Generated', key: 'downloadReportProgress', duration: 2 });
    }

  }

  handleTestCaseChange = () => {
    this.autoSave = true
    this.forceUpdate()
  }

  handleTestCaseDelete = (testCaseIndex) => {
    const fileSelected = this.getSingleFileSelected()
    if(fileSelected) {
      const fileTemplate = fileSelected.content
      fileTemplate.test_cases.splice(testCaseIndex,1)
      this.regenerateTemplate(this.state.additionalData.selectedFiles)
      this.forceUpdate()
      this.autoSave = true
    } else {
      message.error('ERROR: no file selected or multiple files are selected');
    }
  }

  handleTestCaseDuplicate = (testCaseIndex) => {
    const fileSelected = this.getSingleFileSelected()
    if(fileSelected) {
      const fileTemplate = fileSelected.content

      // Find highest request id to determine the new ID
      let maxId = +fileTemplate.test_cases.reduce(function (m, k) { return k.id > m ? k.id : m }, 0)

      const { id, name, ...otherProps } = fileTemplate.test_cases[testCaseIndex]
      // Deep copy other properties
      const clonedProps = JSON.parse(JSON.stringify(otherProps))

      fileTemplate.test_cases.push({ id: maxId + 1, name: name + ' Copy', ...clonedProps })

      this.regenerateTemplate(this.state.additionalData.selectedFiles)
      this.forceUpdate()
      this.autoSave = true
    } else {
      message.error('ERROR: no file selected or multiple files are selected');
    }
  }

  getTestCaseItems = () => {
    if (this.state.template.test_cases) {
      return this.state.template.test_cases.map((testCase, testCaseIndex) => {
        return (
          <Row className="mb-2">
            <Col span={24}>
              <TestCaseViewer
                testCase={testCase}
                onChange={this.handleTestCaseChange}
                inputValues={this.state.inputValues}
                onEdit={() => {this.setState({showTestCaseIndex: testCaseIndex})}}
                onDelete={() => { this.handleTestCaseDelete(testCaseIndex) } }
                onDuplicate={() => { this.handleTestCaseDuplicate(testCaseIndex) } }
                onRename={this.handleTestCaseChange}
                onShowSequenceDiagram={this.handleShowSequenceDiagram}
                onSend={() => { this.handleSendSingleTestCase(testCaseIndex) }}
                
              />
            </Col>
          </Row>
        )
      })
    }
    return null
  }

  downloadReportMenu = (record) => {
    const report = record ? this.state.historyReportsLocal.find(report => report._id === record.key) : undefined
    return (
      <Menu onClick={(event) => this.handleDownloadReport(event, report)}>
        <Menu.Item key='json'>JSON format</Menu.Item>
        <Menu.Item key='html'>HTML report</Menu.Item>
        <Menu.Item key='printhtml'>Printer Friendly HTML report</Menu.Item>
      </Menu>
    )
  }

  handleShowSequenceDiagram = async (testCase) => {
    await this.setState({ sequenceDiagramVisible: true })
    this.seqDiagContainer.removeAttribute('data-processed')
    let seqSteps = ''
    const rowCount = testCase.requests.length
    for (let i = 0; i < rowCount; i++) {
      let transactionBegan = false
      if (testCase.requests[i].status && testCase.requests[i].status.requestSent) {
        const stepStr = testCase.requests[i].status.requestSent.method + ' ' + testCase.requests[i].status.requestSent.path
        seqSteps += 'Note over TTK,PEER: ' + testCase.requests[i].status.requestSent.description + '\n'
        seqSteps += 'TTK->>PEER: [HTTP REQ] ' + stepStr + '\n'
        transactionBegan = true
        seqSteps += 'activate PEER\n'
      }
      if (testCase.requests[i].status && testCase.requests[i].status.response) {
        const stepStr = testCase.requests[i].status.response.status + ' ' + testCase.requests[i].status.response.statusText + ' ' + testCase.requests[i].status.state
        if (testCase.requests[i].status.state === 'error') {
          seqSteps += 'PEER--xTTK: [HTTP RESP] ' + stepStr + '\n'
        } else {
          seqSteps += 'PEER-->>TTK: [HTTP RESP] ' + stepStr + '\n'
        }
      }
      if (testCase.requests[i].status && testCase.requests[i].status.callback) {
        const stepStr = testCase.requests[i].status.callback.url
        seqSteps += 'PEER-->>TTK: [ASYNC CALLBACK] ' + stepStr + '\n'
      }
      if (transactionBegan) {
        seqSteps += 'deactivate PEER\n'
      }
    }
    if (seqSteps) {
      // return 'sequenceDiagram\n' + seqSteps
      const code = 'sequenceDiagram\n' + seqSteps
      try {
        mermaid.parse(code)
        this.seqDiagContainer.innerHTML = code
        mermaid.init(undefined, this.seqDiagContainer)
      } catch (e) {
        // {str, hash}
        // const base64 = Base64.encodeURI(e.str || e.message)
        // history.push(`${url}/error/${base64}`)
        console.log('Diagram generation error', e.str || e.message)
      }
    } else {
      console.log('No data')
    }
  }

  handleFileManagerContentChange = async (folderData, selectedFiles = null) => {
    this.state.folderData = folderData
    if (selectedFiles != null) {
      this.state.additionalData.selectedFiles = selectedFiles
    }
    this.regenerateTemplate(this.state.additionalData.selectedFiles)
    this.autoSave = true
    this.forceUpdate()
  }

  historyReportsLocal = async () => {
    const { apiBaseUrl } = getConfig()
    const reports = await axios.get(apiBaseUrl + "/api/history/reports")
    return reports.data
  }

  historyReportsDataSource = () => {
    const dataSource = []
    this.state.historyReportsLocal.forEach((report) => {
      const historyReportsDataSource = {
        key: report._id,
        name: report.name,
        timestamp: report.runtimeInformation.completedTimeISO,
        duration: report.runtimeInformation.runDurationMs,
        successRate: `${report.runtimeInformation.totalPassedAssertions}/${report.runtimeInformation.totalAssertions}`,
        status: report.runtimeInformation.totalPassedAssertions === report.runtimeInformation.totalAssertions ? 'PASSED' : 'FAILED'
      }
      dataSource.push(historyReportsDataSource)
    })
    return dataSource
  }

  onTestCaseSortEnd = ({ oldIndex, newIndex }) => {
    // Change the position in array
    this.state.tempReorderedTestCases = arrayMove(this.state.tempReorderedTestCases, oldIndex, newIndex)
    this.setState({ curTestCasesUpdated: true })
  }

  getSingleFileSelected = () => {
    const selectedFiles = this.state.additionalData.selectedFiles
    let fileSelected = null
    for (let i = 0; i < selectedFiles.length; i++) {
      const fileNode = FolderParser.findNodeFromAbsolutePath(selectedFiles[i], this.state.folderData)
      if (fileNode.extraInfo.type === 'file') {
        if (fileSelected) {
          return null
        } else {
          fileSelected = fileNode
        }
      }
    }
    return fileSelected
  }

  render() {

    const createNewTestCaseDialogContent = (
      <>
        <Input
          placeholder="Test case name"
          type="text"
          value={this.state.newTestCaseName}
          onChange={(e) => { this.setState({ newTestCaseName: e.target.value }) }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              this.setState({ createNewTestCaseDialogVisible: false })
            }
          }}
          onPressEnter={() => {
            this.handleCreateNewTestCaseClick(this.state.newTestCaseName)
            this.setState({ createNewTestCaseDialogVisible: false })
          }}
        />
        <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={() => {
            this.handleCreateNewTestCaseClick(this.state.newTestCaseName)
            this.setState({ createNewTestCaseDialogVisible: false })
          }}
          size="sm"
        >
          Create
      </Button>
      </>
    )

    const getSaveTemplateDialogContent = (templateOption) => {
      return (
        <>
          <Row>
            <Col>
              <Input
                placeholder="File name"
                type="text"
                value={this.state.saveTemplateFileName}
                onChange={(e) => { this.setState({ saveTemplateFileName: e.target.value }) }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (templateOption == 1) {
                      this.setState({ saveTemplateTestcasesDialogVisible: false })
                    } else {
                      this.setState({ saveTemplateEnvironemntDialogVisible: false })
                    }
                  }
                }}
                onPressEnter={() => {
                  this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption)
                  if (templateOption == 1) {
                    this.setState({ saveTemplateTestcasesDialogVisible: false })
                  } else {
                    this.setState({ saveTemplateEnvironemntDialogVisible: false })
                  }
                }}
              />
            </Col>
          </Row>

          <Row>
            <Col>
              <Button
                className="text-right mt-2"
                color="success"
                href="#pablo"
                onClick={() => {
                  this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption)
                  if (templateOption == 1) {
                    this.setState({ saveTemplateTestcasesDialogVisible: false })
                  } else {
                    this.setState({ saveTemplateEnvironemntDialogVisible: false })
                  }
                }}
                size="sm"
              >
                Create
            </Button>
            </Col>
          </Row>
        </>
      )
    }

    const SortableRuleItem = SortableElement(({ value }) => <Panel header={value.name}></Panel>)

    const SortableRuleList = SortableContainer(({ items }) => {
      return (
        <Collapse>
          {items.map((value, index) => (
            <SortableRuleItem key={`item-${value.id}`} index={index} value={value} />
          ))}
        </Collapse>
      )
    })

      return (
      <>
        <Drawer
          title="File Browser"
          placement="left"
          width={600}
          closable={false}
          onClose={() => {
            this.setState({ fileBrowserVisible: false })
          }}
          visible={this.state.fileBrowserVisible}
        >
          <FileManager
            folderData={this.state.folderData}
            selectedFiles={this.state.additionalData.selectedFiles}
            onChange={this.handleFileManagerContentChange}
            ref={this.fileManagerRef}
            ipcRenderer={ipcRenderer}
          />
        </Drawer>
        <Drawer
          title="Environment Manager"
          forceRender
          placement="right"
          width={800}
          closable={false}
          onClose={() => {
            this.setState({ environmentManagerVisible: false })
          }}
          visible={this.state.environmentManagerVisible}
        >
          <EnvironmentManager
            onChange={this.handleInputValuesChange}
          />
        </Drawer>

        <Modal
          centered
          destroyOnClose
          forceRender
          title="Template"
          className="w-50 p-3"
          visible={this.state.showTemplate ? true : false}
          footer={null}
          onCancel={() => { this.setState({ showTemplate: false }) }}
        >
          <pre>{JSON.stringify(this.convertTemplate({...this.state.template, inputValues: this.state.inputValues}), null, 2)}</pre>
        </Modal>
        <Modal
          style={{ top: 20 }}
          destroyOnClose
          forceRender
          width='90%'
          title="Iteration Runner"
          visible={this.state.showIterationRunner ? true : false}
          footer={null}
          onCancel={() => { this.setState({ showIterationRunner: false }) }}
        >
          <IterationRunner
            template={this.convertTemplate({...this.state.template, inputValues: this.state.inputValues})}
            sessionId={this.state.sessionId}
            ref={this.iterationRunnerRef}
          />
        </Modal>
        <Modal
          centered
          destroyOnClose
          forceRender
          title="Sequence Diagram"
          className="w-50 p-3"
          visible={this.state.sequenceDiagramVisible ? true : false}
          footer={null}
          onCancel={() => { this.seqDiagContainer.innerHTML = ''; this.setState({ sequenceDiagramVisible: false }) }}
        >
          <div
            ref={div => {
              this.seqDiagContainer = div
            }}
          >
          </div>
        </Modal>
        <Modal
          style={{ top: 20 }}
          bodyStyle={{ height: '85vh', 'overflow-y': 'auto' }}
          destroyOnClose
          forceRender
          title="Test Case Editor"
          width='90%'
          visible={this.state.showTestCaseIndex != null ? true : false}
          footer={null}
          keyboard={false}
          onCancel={() => { this.setState({ showTestCaseIndex: null }) }}
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
                  onSend={() => { this.handleSendSingleTestCase(this.state.showTestCaseIndex) }}
                  traceID={this.state.lastOutgoingRequestID}
                  onOpenEnvironmentManager={() => {this.setState({environmentManagerVisible: true})}}
                />
              )
              : null
          }
        </Modal>

        <Row>
          <Col span={24}>
            <Affix offsetTop={2}>
              <Row align="top">
                <Col span={12}>                
                  <Button type='primary' className='mt-2' style={ {height: '40px', backgroundColor: '#718ebc'} } onClick={() => {
                    this.setState({ fileBrowserVisible: true })
                  }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Collections Manager</Text> <CaretRightFilled style={ {fontSize: '18px'} }/>
                  </Button>
                </Col>
                <Col span={12}>       
                  <Button type='primary' className='mt-2 float-right' style={ {height: '40px', backgroundColor: '#718ebc'} } onClick={() => {
                      this.setState({ environmentManagerVisible: true })
                    }}>
                    <CaretLeftFilled style={ {fontSize: '18px'} }/> <Text style={{color: 'white', fontWeight: 'bold'}}>Environment Manager</Text>
                  </Button>            
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Card className="mb-4">
                    <Row>
                      <Col span={10}></Col>
                      <Col span={4} className="text-center">
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
                              <Badge count="PASSED" style={{ backgroundColor: TTKColors.assertionPassed }}>
                                <Progress type="circle" width={50} status="success" percent={100} format={() => this.state.totalPassedCount} />
                              </Badge>
                            </Col>
                            <Col span={8}>
                              <Badge count="FAILED" style={{ backgroundColor: TTKColors.assertionFailed }}>
                                <Progress type="circle" width={50} status="exception" percent={100} format={() => this.state.totalFailedCount} />
                              </Badge>
                            </Col>
                            <Col span={8}>
                              <Badge count="TOTAL" style={{ backgroundColor: '#108ee9' }}>
                                <Progress type="circle" width={50} status="normal" percent={100} format={() => this.state.totalAssertionsCount} />
                              </Badge>
                            </Col>
                          </Row>
                          </>
                        )
                        : null
                      }
                      </Col>
                      <Col span={10}>
                        <Button
                          className="float-right"
                          type="primary"
                          danger
                          onClick={this.handleSendStopClick}
                        >
                          {this.state.sendingOutboundRequestID ? 'Stop' : 'Run'}
                        </Button>
                        <Button
                          className="float-right mr-2"
                          type="dashed"
                          danger
                          onClick={() => { this.setState({ showIterationRunner: true }) }}
                        >
                          Iteration Runner
                        </Button>
                        <Button
                          className="float-right mr-2"
                          type="dashed"
                          onClick={() => { this.setState({ showTemplate: true }) }}
                        >
                          Show Current Template
                        </Button>
                        {
                          getConfig().isAuthEnabled ?
                            <>
                              <Button className="float-right" type="primary" danger onClick={async (e) => {
                                this.setState({ historyReportsLocal: await this.historyReportsLocal() })
                                this.setState({ historyReportsVisible: true })
                              }}>
                                Reports History
                            </Button>
                              {
                                this.state.historyReportsVisible
                                  ?
                                  <Modal
                                    title="Reports History"
                                    visible={this.state.historyReportsVisible}
                                    width='70%'
                                    onOk={() => {
                                      this.setState({ historyReportsVisible: false })
                                    }}
                                    onCancel={() => {
                                      this.setState({ historyReportsVisible: false })
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
                                  :
                                  null
                              }
                            </>
                            :
                            null
                        }
                        {
                          this.state.testReport
                            ?
                            <Dropdown overlay={this.downloadReportMenu()}>
                              <Button
                                className="float-right mr-2"
                                type="primary"
                                danger
                                onClick={e => e.preventDefault()}
                              >
                                Download Report
                            </Button>
                            </Dropdown>
                            : null
                        }
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Affix>
            {
              this.state.lastOutgoingRequestID
              ?  <Row>
                  <Col span={24}>
                    <ServerLogsViewer traceID={this.state.lastOutgoingRequestID} userConfig={this.state.userConfig} /> 
                  </Col>
                </Row> 
              : null
            }
            <Row>
              <Col span={24}>
                <Tabs defaultActiveKey='1'>
                  <TabPane tab="Test Cases" key="1">
                    <Row className="mb-2">
                      <Col span={24}>
                        <Popover
                          className="float-right"
                          content={getSaveTemplateDialogContent(1)}
                          title="Enter filename to save"
                          trigger="click"
                          visible={this.state.saveTemplateTestcasesDialogVisible}
                          onVisibleChange={(visible) => this.setState({ saveTemplateTestcasesDialogVisible: visible })}
                        >
                          <Button
                            className="float-right"
                            type="default"
                          >
                            Export Loaded Testcases
                        </Button>
                        </Popover>
                        <Popover
                          content={createNewTestCaseDialogContent}
                          className="mr-2"
                          title="Enter a name for the template"
                          trigger="click"
                          visible={this.state.createNewTestCaseDialogVisible}
                          onVisibleChange={(visible) => this.setState({ createNewTestCaseDialogVisible: visible })}
                        >
                          <Button
                            type="primary"
                          >
                            Add Test Case
                        </Button>
                        </Popover>
                        {
                          this.state.testCaseReorderingEnabled
                            ? (
                              <>
                                <Button
                                  className="text-right"
                                  type="dashed"
                                  danger
                                  onClick={async () => {
                                    if (this.state.curTestCasesUpdated) {
                                      const fileSelected = this.getSingleFileSelected()
                                      fileSelected.content.test_cases = this.state.tempReorderedTestCases
                                      this.regenerateTemplate(this.state.additionalData.selectedFiles)
                                      this.setState({ curTestCasesUpdated: false, tempReorderedTestCases: [] })
                                      this.autoSaveFolderData(this.state.folderData)
                                    } else {
                                      message.error({ content: 'No changes found', key: 'TestCaseRequestsReordering', duration: 3 });
                                    }
                                    this.setState({ testCaseReorderingEnabled: false })
                                  }}
                                >
                                  Apply Reordering
                            </Button>
                                <Button
                                  className="text-right ml-2"
                                  type="dashed"
                                  onClick={async () => {
                                    this.setState({ curTestCasesUpdated: false, testCaseReorderingEnabled: false, tempReorderedTestCases: [] })
                                  }}
                                >
                                  Cancel Reordering
                            </Button>
                              </>
                            )
                            : (
                              this.state.additionalData && this.state.additionalData.selectedFiles
                                ?
                                <Button
                                  className="text-right"
                                  type="default"
                                  onClick={() => {
                                    const fileSelected = this.getSingleFileSelected()
                                    if (fileSelected) {
                                      this.setState({ tempReorderedTestCases: [...this.state.template.test_cases], testCaseReorderingEnabled: true })
                                    } else {
                                      message.error('ERROR: Only one file should be selected to reorder the testcases')
                                    }
                                  }}
                                >
                                  Reorder Test Cases
                            </Button>
                                :
                                null
                            )
                        }
                      </Col>
                    </Row>
                    {
                      this.state.testCaseReorderingEnabled
                        ? (
                          <SortableRuleList items={this.state.tempReorderedTestCases} onSortEnd={this.onTestCaseSortEnd} />
                        )
                        : (
                          <>
                            {this.getTestCaseItems()}
                          </>
                        )
                    }
                  </TabPane>
                </Tabs>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  }
}

export default OutboundRequest;
