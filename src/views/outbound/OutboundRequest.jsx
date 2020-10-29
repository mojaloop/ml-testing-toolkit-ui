/*!

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
 
// reactstrap components
import {
  Card,
  CardBody,
  CardHeader,
  Form,
  Container,
  Button,
} from "reactstrap";
// core components

import socketIOClient from "socket.io-client";
import mermaid from 'mermaid'

import Header from "../../components/Headers/Header.jsx";
import TraceHeaderUtils from "../../utils/traceHeaderUtils"

import { getServerConfig } from '../../utils/getConfig'

import { Input, Row, Col, Affix, Descriptions, Modal, Badge, Icon, message, Popover, Progress, Menu, Dropdown, Radio, Tabs, Table, Collapse, Drawer } from 'antd';
import { WarningTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';
import axios from 'axios';
import TestCaseEditor from './TestCaseEditor'
import TestCaseViewer from './TestCaseViewer'
import SampleFilesViewer from './SampleFilesViewer'
import getConfig from '../../utils/getConfig'
import FileDownload from 'js-file-download'
import FileManager from "./FileManager.jsx";
import { FolderParser } from 'ml-testing-toolkit-shared-lib'

import {SortableContainer, SortableElement} from 'react-sortable-hoc'
import arrayMove from 'array-move'

const { Panel } = Collapse;
const { TabPane } = Tabs;

const traceHeaderUtilsObj = new TraceHeaderUtils()

function buildFileSelector( multi = false, directory = false ){
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

class InputValues extends React.Component {

  state = {
    addInputValueDialogVisible: false,
    newInputValueName: ''
  };

  handleDeleteClick = (inputValueName) => {
    this.props.onDelete(inputValueName)
  }

  getInputItems = () => {
    let inputItems = []
    let i = 0
    for (let inputValueName in this.props.values) {
      inputItems.push(
        <>
        <Descriptions.Item label={inputValueName}>
          <Row gutter={8}>
            <Col span={23}>
              <Input
                value={this.props.values[inputValueName]}
                onChange={(e) => this.props.onChange(inputValueName, e.target.value)}
              />
            </Col>
            <Col span={1}>
              <Icon key={inputValueName} type="delete" theme="filled"
                onClick={ () => this.handleDeleteClick(inputValueName) }
              />
            </Col>
          </Row>
          
        </Descriptions.Item>
        </>
      )
    }
    return inputItems
  }

  handleAddInputValue = (inputValueName) => {
    // Check if the input value name already exists
    if (this.props.values.hasOwnProperty(inputValueName)) {
      message.error({ content: 'The input value name already exists', key: 'InputValueNameExists', duration: 3 });
    } else {
      // Save the input value
      this.props.onChange(inputValueName, '')
      this.state.newInputValueName = ''
    }
  }


  render () {
    const addInputValueDialogContent = (
      <>
      <Input 
        placeholder="Input Value Name"
        type="text"
        value={this.state.newInputValueName}
        onChange={(e) => { this.setState({newInputValueName: e.target.value })}}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            this.setState({addInputValueDialogVisible: false})
          }
        }}
        onPressEnter={ () => {
          this.handleAddInputValue(this.state.newInputValueName)
          this.setState({addInputValueDialogVisible: false})
        }}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.handleAddInputValue(this.state.newInputValueName)
            this.setState({addInputValueDialogVisible: false})
          }}
          size="sm"
        >
          Add
      </Button>
      </>
    )

    return (
      <>
      <Row gutter={16}>
        <Col span={24}>
          <Card className="bg-white shadow">
            <CardBody>
              <Popover
                content={addInputValueDialogContent}
                title="Enter a new name"
                trigger="click"
                visible={this.state.addInputValueDialogVisible}
                onVisibleChange={ (visible) => this.setState({addInputValueDialogVisible: visible})}
              >
                <Button
                    className="text-right float-right"
                    color="primary"
                    size="sm"
                  >
                    Add Input Value
                </Button>
              </Popover>

              <Form>
                <Descriptions title="Input Values" bordered column={1} size='small'>
                  {this.getInputItems()}
                </Descriptions>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}


class OutboundRequest extends React.Component {

  constructor() {
    super();
    this.fileManagerRef = React.createRef();
    const sessionId = traceHeaderUtilsObj.generateSessionId()
    this.state = {
      request: {},
      template: {},
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
      totalAssertionsCount: 0,
      sessionId: sessionId,
      testReport: null,
      userConfig: null,
      sendingOutboundRequestID: null,
      loadSampleDialogVisible: false,
      loadSampleFiles: {},
      loadSampleChecked: {},
      loadSampleCollectionTypes: ['hub','dfsp','provisioning'],
      sequenceDiagramVisible: false,
      folderData: [],
      fileBrowserVisible: false,
      historyReportsVisible: false,
      historyReportsColumns: [
        { title: 'Name', dataIndex: 'name', key: 'name', width: '50%'},
        { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: '20%'},
        { title: 'Run duration in ms', dataIndex: 'duration', key: 'duration', width: '10%'},
        { title: 'Passed / Total', dataIndex: 'successRate', key: 'successRate', width: '10%'},
        { title: 'Status', dataIndex: 'status', key: 'status', width: '10%'},
        { dataIndex: '', key: 'download', width: '10%', render: (text, record) => (
          <Dropdown overlay={this.downloadReportMenu(record)}>
            <Button className="float-right" color="info" size="sm" onClick={e => e.preventDefault()}>
              Download
            </Button>
          </Dropdown>
        )}
      ],
      testCaseReorderingEnabled: false,
      curTestCasesUpdated: false,
      testCaseRequestsReorderingEnabled: false,
      curTestCasesRequestsUpdated: false,
      tempReorderedTestCases: [],
    };
  }

  socket = null
  autoSave = false
  autoSaveIntervalId = null

  componentWillUnmount = () => {
    if (this.socket) {
      this.socket.disconnect()
    }
    if(this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId)
    }
  }
  
  componentDidMount = async () => {
    this.environmentFileSelector = buildFileSelector();
    this.environmentFileSelector.addEventListener ('input', (e) => {
      if (e.target.files) {
        this.handleImportEnvironmentFile(e.target.files[0])
        this.environmentFileSelector.value = null
      }
    })

    // const sampleTemplate = require('./sample1.json')
    // this.setState({template: sampleTemplate})
    const { userConfigRuntime } = await getServerConfig()
    
    this.setState({userConfig: userConfigRuntime})
    const { apiBaseUrl } = getConfig()
    this.socket = socketIOClient(apiBaseUrl);
    // this.socket.on("outboundProgress", this.handleIncomingProgress);
    if (getConfig().isAuthEnabled) {
      const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID')
      if (dfspId) {
        this.state.sessionId  =  dfspId
      }
    }
    this.socket.on("outboundProgress/" + this.state.sessionId, this.handleIncomingProgress);
    
    const additionalData = this.restoreAdditionalData()
    const storedFolderData = this.restoreSavedFolderData()
    const storedEnvironmentData = this.restoreSavedEnvironmentData()

    if (storedFolderData) {
      this.state.folderData = storedFolderData
      this.regenerateTemplate(additionalData.selectedFiles)
    }
    if (storedEnvironmentData) {
      this.state.template.inputValues = storedEnvironmentData
    }

    if (additionalData) {
      this.state.additionalData = additionalData
    }

    if(storedFolderData || storedEnvironmentData || additionalData) {
      this.forceUpdate()
    }

    this.startAutoSaveTimer()

  }

  handleInputValuesChange = (name, value) => {
    this.state.template.inputValues[name] = value
    this.autoSave = true
    this.forceUpdate()
  }

  handleInputValuesDelete = (name) => {
    delete this.state.template.inputValues[name]
    this.autoSave = true
    this.forceUpdate()
  }

  handleIncomingProgress = (progress) => {
    if (progress.status === 'FINISHED') {
      message.success({ content: 'Test case finished', key: 'outboundSendProgress', duration: 2 });
      this.setState({sendingOutboundRequestID: null, testReport: progress.totalResult})
    } else if (progress.status === 'TERMINATED') {
      message.success({ content: 'Test case terminated', key: 'outboundStopProgress', duration: 2 });
      this.setState({sendingOutboundRequestID: null, testReport: progress.totalResult})
    } else {
      let testCase = this.state.template.test_cases.find(item => item.id === progress.testCaseId)
      if (testCase) {
        let request = testCase.requests.find(item => item.id === progress.requestId)
        if (request.status) {
          // Update total passed count
          const passedCount = (progress.testResult) ? progress.testResult.passedCount : 0
          this.state.totalPassedCount += passedCount
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
    this.state.totalAssertionsCount = 0
    this.state.testReport = null

    const traceIdPrefix = traceHeaderUtilsObj.getTraceIdPrefix()
    this.state.currentEndToEndId = traceHeaderUtilsObj.generateEndToEndId()
    const traceId = traceIdPrefix + this.state.sessionId + this.state.currentEndToEndId

    // const outboundRequestID = Math.random().toString(36).substring(7);
    message.loading({ content: 'Sending the outbound request...', key: 'outboundSendProgress' });
    const { apiBaseUrl } = getConfig()
    this.state.template = this.convertTemplate(this.state.template)
    // await axios.post(apiBaseUrl + "/api/outbound/template/" + outboundRequestID, template ? template : this.state.template, { headers: { 'Content-Type': 'application/json' } })
    await axios.post(apiBaseUrl + "/api/outbound/template/" + traceId, template ? template : this.state.template, { headers: { 'Content-Type': 'application/json' } })

    this.state.sendingOutboundRequestID = traceId
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
    const testCaseToSend = { test_cases: [ test_cases[testCaseIndex] ], ...remainingProps }
    this.handleSendTemplate(testCaseToSend)
  }

  // Take the status property out from requests
  convertTemplate = (template, showAdvancedFeaturesAnyway=false) => {
    let { test_cases, ...remainingTestCaseProps } = template
    let newTestCases = test_cases
    if(test_cases) {
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
    if(fileSelected) {
      const fileTemplate = fileSelected.content
      // Find highest request id to determine the new ID
      let maxId = +fileTemplate.test_cases.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)
      fileTemplate.test_cases.push({ id: maxId+1, name: testCaseName })
      this.regenerateTemplate(this.state.additionalData.selectedFiles)
      this.forceUpdate()
      this.autoSave = true
    } else {
      message.error('ERROR: no file selected or multiple files are selected');
    }
  }

  download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  restoreSavedFolderData = () => {
    const storedFolderData = localStorage.getItem('folderData')
    if(storedFolderData) {
      try {
        return JSON.parse(storedFolderData)
      } catch(err) {}
    }
    return null
  }

  restoreSavedEnvironmentData = () => {
    const storedEnvironmentData = localStorage.getItem('environmentData')
    if(storedEnvironmentData) {
      try {
        return JSON.parse(storedEnvironmentData)
      } catch(err) {}
    }
    return null
  }

  restoreAdditionalData = () => {
    const additionalData = localStorage.getItem('additionalData')
    if(additionalData) {
      try {
        return JSON.parse(additionalData)
      } catch(err) {}
    }
    return {}
  }

  startAutoSaveTimer = () => {
    this.autoSaveIntervalId = setInterval ( () => {
      if (this.autoSave) {
        this.autoSave = false
        // this.autoSaveTemplate(this.convertTemplate(this.state.template, true))
        this.autoSaveFolderData(this.state.folderData)
        this.autoSaveEnvironmentData( this.state.template.inputValues )
        this.autoSaveAdditionalData( this.state.additionalData )
      }
    },
    2000)
  }

  autoSaveFolderData = (folderData) => {
    localStorage.setItem('folderData', JSON.stringify(folderData));
  }

  autoSaveEnvironmentData = (environmentData) => {
    localStorage.setItem('environmentData', JSON.stringify(environmentData));
  }

  autoSaveAdditionalData = (additionalData) => {
    localStorage.setItem('additionalData', JSON.stringify(additionalData));
  }

  handleTemplateSaveClick = (fileName, saveTemplateOption) => {
    if (!fileName.endsWith('.json')) {
      message.error('Filename should be ended with .json');
      return
    }
    let templateContent = {}
    const { inputValues, ...remainingTemplateContent } = this.state.template
    if (saveTemplateOption === 1) {
      templateContent = { ...remainingTemplateContent }
    } else if (saveTemplateOption === 2) {
      templateContent = { inputValues }
    }
    this.download(JSON.stringify(this.convertTemplate(templateContent), null, 2), fileName, 'text/plain');
  }

  regenerateTemplate = async (selectedFiles = null) => {
    var testCases = []
    testCases = FolderParser.getTestCases(this.state.folderData, selectedFiles)
    FolderParser.sequenceTestCases(testCases)
    // console.log(testCases)
    // this.state.template.test_cases = JSON.parse(JSON.stringify(testCases))
    this.state.template.test_cases = testCases
    this.state.template.name = 'multi'
    this.state.additionalData = {
      importedFilename: 'Multiple Files',
      selectedFiles: selectedFiles
    }
    this.forceUpdate()
    // this.autoSave = true
  }

  handleImportEnvironmentFile = (file_to_read) => {
    message.loading({ content: 'Reading the file...', key: 'importFileProgress' });
    var fileRead = new FileReader();
    fileRead.onload = (e) => {
      var content = e.target.result;
      try {
        var templateContent = JSON.parse(content);
        if (templateContent.inputValues) {
          this.state.template.inputValues = templateContent.inputValues
          this.forceUpdate()
          this.autoSave = true
          message.success({ content: 'Environment Loaded', key: 'importFileProgress', duration: 2 });
        } else {
          message.error({ content: 'Input Values not found in the file', key: 'importFileProgress', duration: 2 });
        }
      } catch (err) {
        message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
      }
    };
    fileRead.readAsText(file_to_read);
  }

  handleDownloadReport = async (event, report) => {
    const testReport = report || this.state.testReport
    switch(event.key) {
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

  handleTestCaseDelete = (testCaseId) => {
    const fileSelected = this.getSingleFileSelected()
    if(fileSelected) {
      // const fileTemplate = this.state.template
      const fileTemplate = fileSelected.content
      const deleteIndex = fileTemplate.test_cases.findIndex(item => item.id == testCaseId)
      fileTemplate.test_cases.splice(deleteIndex,1)
      this.regenerateTemplate(this.state.additionalData.selectedFiles)
      this.forceUpdate()
      this.autoSave = true
      // this.handleTestCaseChange()
    } else {
      message.error('ERROR: no file selected or multiple files are selected');
    }
  }

  handleTestCaseDuplicate = (testCaseId) => {
    const { id, name, ...otherProps } = this.state.template.test_cases.find(item => item.id == testCaseId)
    // Find highest request id to determine the new ID
    let maxId = +this.state.template.test_cases.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)
    // Deep copy other properties
    const clonedProps = JSON.parse(JSON.stringify(otherProps))

    this.state.template.test_cases.push({ id: maxId+1, name: name + ' Copy', ...clonedProps })
    this.handleTestCaseChange()
  }

  getTestCaseItems = () => {
    if (this.state.template.test_cases) {
      return this.state.template.test_cases.map((testCase, testCaseIndex) => {
        return (
          <Row>
            <Col>
              <TestCaseViewer
                testCase={testCase}
                onChange={this.handleTestCaseChange}
                inputValues={this.state.template.inputValues}
                onEdit={() => {this.setState({showTestCaseIndex: testCaseIndex})}}
                onDelete={this.handleTestCaseDelete}
                onDuplicate={this.handleTestCaseDuplicate}
                onRename={this.handleTestCaseChange}
                onShowSequenceDiagram={this.handleShowSequenceDiagram}
                onSend={() => { this.handleSendSingleTestCase(testCaseIndex) } }
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

  handleLoadSample = async () => {
    message.loading({ content: 'Loading Sample...', key: 'loadSampleProgress' });
    try {
      if (this.state.loadSampleChecked.collections) {
        this.state.additionalData.importedFilename = (this.state.loadSampleChecked.collections.length > 1) ? 'Multiple Files' : this.state.loadSampleChecked.collections[0]
      }
      if (this.state.loadSampleChecked.environment === 'none') {
        this.state.loadSampleChecked.environment = null
      }
      const { apiBaseUrl } = getConfig()
      const resp = await axios.get(apiBaseUrl + '/api/samples/loadFolderWise', {
        params: this.state.loadSampleChecked
      })
      if (resp.data.body.name) {
        this.state.template.name = resp.data.body.name
      }
      if (Object.keys(resp.data.body.environment || {}).length !== 0) { 
        this.state.template.inputValues = resp.data.body.environment
      }
      if (resp.data.body.test_cases) {
        this.state.template.test_cases = resp.data.body.test_cases
      }
      if (resp.data.body.collections && resp.data.body.collections.length > 0) {
        await this.setState({fileBrowserVisible: true})
        this.fileManagerRef.current.updateFoldersAndFiles(resp.data.body.collections)
      }
      
      this.forceUpdate()
      this.autoSave = true
    } catch (err) {
      message.error({ content: ((err.response) ? err.response.data : err.message), key: 'loadSampleProgress', duration: 2 });
      return
    }
    message.success({ content: 'Sample Loaded', key: 'loadSampleProgress', duration: 2 });
  }

  loadSampleContent = async () => {
    const { apiBaseUrl } = getConfig()
    if (!this.state.loadSampleCollections) {
      this.state.loadSampleCollections = {}
      for (const index in this.state.loadSampleCollectionTypes) {
        const resp = await axios.get(apiBaseUrl + `/api/samples/list/collections?type=${this.state.loadSampleCollectionTypes[index]}`)
        this.state.loadSampleCollections[this.state.loadSampleCollectionTypes[index]] = resp.data.body
      }
    }
    if (!this.state.loadSampleEnvironments) {
      const resp = await axios.get(apiBaseUrl + `/api/samples/list/environments`)
      resp.data.body.push({name: 'none'})
      this.state.loadSampleEnvironments = resp.data.body.map(file => file.name)
    }
  }

  loadSampleCollections = (type) => {
    const collections = []
    if (this.state.loadSampleCollections && this.state.loadSampleCollections[type]) {
      for (const i in this.state.loadSampleCollections[type]) {
        collections.push({key: i, collection: this.state.loadSampleCollections[type][i]})
      }
    }
    return collections
  }

  loadSampleCollectionsAsFilesArray = (type) => {
    if (this.state.loadSampleCollections && this.state.loadSampleCollections[type]) {
      return this.state.loadSampleCollections[type].map((file) => {
        return {
          key: file.name,
          size: file.size,
        }
      })
    } else {
      return []
    }
  }

  loadSampleEnvironments = () => {
    const environments = []
    if (this.state.loadSampleEnvironments) {
      for (const i in this.state.loadSampleEnvironments) {
        environments.push({key: i, environment: this.state.loadSampleEnvironments[i]})
      }
    }
    return environments
  }

  loadSampleCollectionsTabContent = () => {
    return this.state.loadSampleCollectionTypes.map(type => {
      return (
        <Tabs.TabPane tab={type} key={type}>
          <SampleFilesViewer files={this.loadSampleCollectionsAsFilesArray(type)} prefix={'examples/collections/' + type + '/'} onChange={ (selectedCollections) => {
            // this.setState({selectedCollections: selectedRowKeys})
            this.state.loadSampleChecked.collections = selectedCollections
          }} />
        </Tabs.TabPane>
      )
    })
  }

  clearSampleSelectionState = () => {
    this.setState({selectedCollections: [], selectedEnvironments: [], loadSampleChecked: {}})
  }

  loadSampleTabContent = () => {
    return this.state.loadSampleTypes.map(type => {
      return (
        <Tabs.TabPane tab={type} key={type}>
          <Col span={11}>
            <Table
              rowSelection={{type: 'checkbox', selectedRowKeys: this.state.selectedCollections, onChange: (selectedRowKeys, selectedRows) => {
                this.setState({selectedCollections: selectedRowKeys})
                this.state.loadSampleChecked.collections = selectedRows.map(selectedRow => {return selectedRow.collection})
              }}}
              columns={[{title: 'Collections', dataIndex: 'collection', render: text => <a>{text}</a>}]}
              dataSource={this.loadSampleCollections(type)}
            />
          </Col>
          <Col span={2}/>
          <Col span={11}>
            <Table
              rowSelection={{type: 'radio', disabled: true, selectedRowKeys: this.state.selectedEnvironments, onChange: (selectedRowKeys, selectedRows) => {
                this.setState({selectedEnvironments: selectedRowKeys})
                this.state.loadSampleChecked.environment = selectedRows[0].environment
              }}}
              columns={[{title: 'Environments', dataIndex: 'environment', render: text => <a>{text}</a>}]}
              dataSource={this.loadSampleEnvironments(type)}
            />
          </Col>
        </Tabs.TabPane>
      )
    })
  }

  handleShowSequenceDiagram = async (testCase) => {
    await this.setState({sequenceDiagramVisible: true})  
    this.seqDiagContainer.removeAttribute('data-processed')
    let seqSteps = ''
    const rowCount = testCase.requests.length
    for (let i=0; i<rowCount; i++) {
      let transactionBegan = false
      if ( testCase.requests[i].status && testCase.requests[i].status.requestSent ) {
        const stepStr = testCase.requests[i].status.requestSent.method + ' ' + testCase.requests[i].status.requestSent.path
        seqSteps += 'Note over TTK,PEER: ' + testCase.requests[i].status.requestSent.description + '\n'
        seqSteps += 'TTK->>PEER: [HTTP REQ] ' + stepStr + '\n'
        transactionBegan  = true
        seqSteps += 'activate PEER\n'
      }
      if ( testCase.requests[i].status && testCase.requests[i].status.response ) {
        const stepStr = testCase.requests[i].status.response.status + ' ' + testCase.requests[i].status.response.statusText + ' ' +testCase.requests[i].status.state
        if (testCase.requests[i].status.state === 'error') {
          seqSteps += 'PEER--xTTK: [HTTP RESP] ' + stepStr + '\n'
        } else {
          seqSteps += 'PEER-->>TTK: [HTTP RESP] ' + stepStr + '\n'
        }
      }
      if ( testCase.requests[i].status && testCase.requests[i].status.callback ) {
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

  handleFileManagerContentChange = async (folderData, selectedFiles=null) => {
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

  onTestCaseSortEnd = ({oldIndex, newIndex}) => {
    // Change the position in array
    this.state.tempReorderedTestCases = arrayMove(this.state.tempReorderedTestCases, oldIndex, newIndex) 
    this.setState({curTestCasesUpdated: true})
  }

  getSingleFileSelected = () => {
    const selectedFiles = this.state.additionalData.selectedFiles
    let fileSelected = null
    for(let i=0; i<selectedFiles.length; i++) {
      const fileNode = FolderParser.findNodeFromAbsolutePath(selectedFiles[i], this.state.folderData)
      if (fileNode.extraInfo.type === 'file') {
        if(fileSelected) {
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
        onChange={(e) => { this.setState({newTestCaseName: e.target.value })}}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            this.setState({createNewTestCaseDialogVisible: false})
          }
        }}
        onPressEnter={ () => {
          this.handleCreateNewTestCaseClick(this.state.newTestCaseName)
          this.setState({createNewTestCaseDialogVisible: false})
        }}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.handleCreateNewTestCaseClick(this.state.newTestCaseName)
            this.setState({createNewTestCaseDialogVisible: false})
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
              onChange={(e) => { this.setState({saveTemplateFileName: e.target.value })}}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if(templateOption==1) {
                    this.setState({saveTemplateTestcasesDialogVisible: false})
                  } else {
                    this.setState({saveTemplateEnvironemntDialogVisible: false})
                  }
                }
              }}
              onPressEnter={ () => {
                this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption)
                  if(templateOption==1) {
                    this.setState({saveTemplateTestcasesDialogVisible: false})
                  } else {
                    this.setState({saveTemplateEnvironemntDialogVisible: false})
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
                onClick={ () => {
                  this.handleTemplateSaveClick(this.state.saveTemplateFileName, templateOption)
                    if(templateOption==1) {
                    this.setState({saveTemplateTestcasesDialogVisible: false})
                  } else {
                    this.setState({saveTemplateEnvironemntDialogVisible: false})
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

    const SortableRuleItem = SortableElement(({value}) => <Panel header={value.name}></Panel>)

    const SortableRuleList = SortableContainer(({items}) => {
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
          width={500}
          closable={false}
          onClose={ () => {
            this.setState({fileBrowserVisible: false})
          }}
          visible={this.state.fileBrowserVisible}
        >
          <FileManager 
            folderData={this.state.folderData}
            selectedFiles={this.state.additionalData.selectedFiles}
            onChange={this.handleFileManagerContentChange}
            ref={this.fileManagerRef}
          />
        </Drawer>

        <Modal
          centered
          destroyOnClose
          forceRender
          title="Template"
          className="w-50 p-3"
          visible={this.state.showTemplate? true : false}
          footer={null}
          onCancel={() => { this.setState({showTemplate: false})}}
        >
          <pre>{JSON.stringify(this.convertTemplate(this.state.template), null, 2)}</pre>
        </Modal>
        <Modal
          centered
          destroyOnClose
          forceRender
          title="Sequence Diagram"
          className="w-50 p-3"
          visible={this.state.sequenceDiagramVisible? true : false}
          footer={null}
          onCancel={() => { this.seqDiagContainer.innerHTML = ''; this.setState({sequenceDiagramVisible: false})}}
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
          destroyOnClose
          forceRender
          title="Test Case Editor"
          width='90%'
          visible={this.state.showTestCaseIndex!=null? true : false}
          footer={null}
          keyboard={false}
          onCancel={() => { this.setState({showTestCaseIndex: null})}}
        >
          {
            this.state.showTestCaseIndex!=null
            ? (
              <TestCaseEditor
                testCase={this.state.template.test_cases[this.state.showTestCaseIndex]}
                inputValues={this.state.template.inputValues}
                userConfig={this.state.userConfig}
                onChange={this.handleTestCaseChange}
                onSend={() => { this.handleSendSingleTestCase(this.state.showTestCaseIndex) } }
              />
            )
            : null
          }
        </Modal>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row>
            <Col span={24}>
              <Card className="card-profile shadow">
                <CardBody>
                  <Affix offsetTop={2}>
                  <Row>
                    <Col span={24}>
                      <Card className="bg-white shadow mb-4">
                        <CardBody>
                          <Row className="mb-2">
                            <Button
                              className="text-right float-left mb-2"
                              color="success"
                              size="sm"
                              onClick={ () => {
                                this.setState({fileBrowserVisible: true})
                              }}
                            >
                              Collections Manager
                            </Button>
                            <span>
                              {
                                this.state.template.name
                                ? (
                                  <>
                                  <b>Template Name:</b> { this.state.template.name }
                                  </>
                                )
                                : ''
                              }
                              </span>
                              <span className='ml-4'>
                              { 
                                this.state.additionalData.importedFilename
                                ?  (
                                  <>
                                  <b>Imported File Name:</b> { this.state.additionalData.importedFilename }
                                  </>
                                )
                                : ''
                              }
                            </span>
                          </Row>
                          <Row>
                            <Col span={8}>
                              <Button color="primary" size="sm" onClick={async (e) => {

                                await this.loadSampleContent()
                                this.setState({loadSampleDialogVisible: true})
                              }}>
                                Load Sample
                              </Button>
                              <Modal
                                title="Loaded Samples"
                                visible={this.state.loadSampleDialogVisible}
                                width='50%'
                                onOk={async () => {
                                  await this.handleLoadSample()
                                  this.clearSampleSelectionState()
                                  this.setState({loadSampleDialogVisible: false})
                                }}
                                onCancel={() => {
                                  this.clearSampleSelectionState()
                                  this.setState({loadSampleDialogVisible: false})
                                }}
                              >
                                <Collapse defaultActiveKey={['1']}>
                                  <Collapse.Panel header="Collections" key="1">
                                    <Tabs defaultActiveKey={this.state.loadSampleCollectionTypes[0]} onChange={() => {
                                      this.setState({selectedCollections: []})
                                    }}>
                                      {this.loadSampleCollectionsTabContent()}
                                    </Tabs>
                                  </Collapse.Panel>
                                  <Collapse.Panel header="Environments" key="2">
                                    <Table
                                      rowSelection={{type: 'radio', disabled: true, selectedRowKeys: this.state.selectedEnvironments, onChange: (selectedRowKeys, selectedRows) => {
                                        this.setState({selectedEnvironments: selectedRowKeys})
                                        this.state.loadSampleChecked.environment = selectedRows[0].environment
                                      }}}
                                      columns={[{dataIndex: 'environment', render: text => <a>{text}</a>}]}
                                      dataSource={this.loadSampleEnvironments()}
                                    />
                                  </Collapse.Panel>
                                </Collapse>
                              </Modal>
                            </Col>
                            <Col span={8} className="text-center">
                            {
                              this.state.totalAssertionsCount > 0
                              ? (
                                <>
                                <Progress type="circle" percent={Math.round(this.state.totalPassedCount * 100 / this.state.totalAssertionsCount)} width={50} />

                                <h3 color="primary">{this.state.totalPassedCount} / {this.state.totalAssertionsCount}</h3>
                                </>
                              )
                              : null
                            }
                            </Col>
                            <Col span={8}>
                              <Button
                                className="float-right"
                                color="danger"
                                size="sm"
                                onClick={this.handleSendStopClick}
                              >
                                { this.state.sendingOutboundRequestID ? 'Stop' : 'Send' }
                              </Button>
                              <Button
                                className="float-right mr-2"
                                color="info"
                                size="sm"
                                onClick={() => { this.setState({showTemplate: true})}}
                              >
                                Show Current Template
                              </Button>
                              {
                                getConfig().isAuthEnabled ?
                                <>
                                  <Button className="float-right" color="success" size="sm" onClick={ async (e) => {
                                    this.setState({historyReportsLocal: await this.historyReportsLocal()})
                                    this.setState({historyReportsVisible: true})
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
                                        this.setState({historyReportsVisible: false})
                                      }}
                                      onCancel={() => {
                                        this.setState({historyReportsVisible: false})
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
                                    className="float-right"
                                    color="danger"
                                    size="sm"
                                    onClick={e => e.preventDefault()}
                                  >
                                    Download Report
                                  </Button>
                                </Dropdown>
                                : null
                              }
                            </Col>
                          </Row>
                        </CardBody>
                        </Card>
                    </Col>
                  </Row>
                  </Affix>
                  <Row>
                    <Col>
                      <Tabs defaultActiveKey='1'>
                        <TabPane tab="Test Cases" key="1">
                          <Row className="mb-2">
                            <Popover
                              className="float-right"
                              content={getSaveTemplateDialogContent(1)}
                              title="Enter filename to save"
                              trigger="click"
                              visible={this.state.saveTemplateTestcasesDialogVisible}
                              onVisibleChange={ (visible) => this.setState({saveTemplateTestcasesDialogVisible: visible})}
                            >
                              <Button
                                  className="text-right float-right"
                                  color="success"
                                  size="sm"
                                >
                                  Export Loaded Testcases
                              </Button>
                            </Popover>
                            <Popover
                              content={createNewTestCaseDialogContent}
                              title="Enter a name for the template"
                              trigger="click"
                              visible={this.state.createNewTestCaseDialogVisible}
                              onVisibleChange={ (visible) => this.setState({createNewTestCaseDialogVisible: visible})}
                            >
                              <Button
                                  color="primary"
                                  size="sm"
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
                                    color="success"
                                    href="#pablo"
                                    onClick={async () => {
                                      if (this.state.curTestCasesUpdated) {
                                        const fileSelected = this.getSingleFileSelected()
                                        fileSelected.content.test_cases = this.state.tempReorderedTestCases
                                        this.regenerateTemplate(this.state.additionalData.selectedFiles)
                                        this.setState({curTestCasesUpdated: false, tempReorderedTestCases: []})
                                        this.autoSaveFolderData(this.state.folderData)
                                      } else {
                                        message.error({ content: 'No changes found', key: 'TestCaseRequestsReordering', duration: 3 });
                                      }
                                      this.setState({testCaseReorderingEnabled: false})
                                    }}
                                    size="sm"
                                  >
                                    Apply Reordering
                                  </Button>
                                  <Button
                                    className="text-right"
                                    color="danger"
                                    href="#pablo"
                                    onClick={async () => {
                                      this.setState({curTestCasesUpdated: false, testCaseReorderingEnabled: false, tempReorderedTestCases: []})
                                    }}
                                    size="sm"
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
                                    color="info"
                                    href="#pablo"
                                    onClick={ () => {
                                      const fileSelected = this.getSingleFileSelected()
                                      if(fileSelected) {
                                        this.setState({tempReorderedTestCases: [...this.state.template.test_cases], testCaseReorderingEnabled: true})
                                      } else {
                                        message.error('ERROR: Only one file should be selected to reorder the testcases')
                                      }
                                    }}
                                    size="sm"
                                  >
                                    Reorder Test Cases
                                  </Button>
                                  :
                                  null
                                )
                              }
                          </Row>
                          {
                            this.state.testCaseReorderingEnabled
                            ? (
                              <SortableRuleList items={this.state.tempReorderedTestCases} onSortEnd={this.onTestCaseSortEnd} />
                            )
                            : (
                              <Row>
                                { this.getTestCaseItems() }
                              </Row>
                            )
                          }
                        </TabPane>
                        <TabPane key="2" tab={this.state.template.inputValues && Object.keys(this.state.template.inputValues).length ? 'Input Values' : (<Badge offset={[20,0]} count={<WarningTwoTone twoToneColor="#f5222d" />}>Input Values</Badge>)}>
                          <Row>
                            <Popover
                              className="float-right"
                              content={getSaveTemplateDialogContent(2)}
                              title="Enter filename to save"
                              trigger="click"
                              visible={this.state.saveTemplateEnvironementDialogVisible}
                              onVisibleChange={ (visible) => this.setState({saveTemplateEnvironementDialogVisible: visible})}
                            >
                              <Button
                                  className="text-right float-right"
                                  color="success"
                                  size="sm"
                                >
                                  Export Current Environment
                              </Button>
                            </Popover>
                            <Button
                              color="info"
                              size="sm"
                              className='float-right mr-2' 
                              onClick={ e => {
                                e.preventDefault();
                                this.environmentFileSelector.click();
                              }}
                            >
                              Import Environment
                            </Button>
                          </Row>
                          <Row className='mt-2'>
                            <InputValues values={this.state.template.inputValues} onChange={this.handleInputValuesChange} onDelete={this.handleInputValuesDelete} />
                          </Row>
                        </TabPane>
                      </Tabs>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default OutboundRequest;
