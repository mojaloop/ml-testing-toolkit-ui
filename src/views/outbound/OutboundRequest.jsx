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

import { Input, Row, Col, Affix, Descriptions, Modal, Icon, message, Popover, Progress, Menu, Dropdown, Radio, Tabs, Table, Collapse } from 'antd';

import axios from 'axios';
import TestCaseEditor from './TestCaseEditor'
import TestCaseViewer from './TestCaseViewer'
import SampleFilesViewer from './SampleFilesViewer'
import getConfig from '../../utils/getConfig'
import FileDownload from 'js-file-download'

const traceHeaderUtilsObj = new TraceHeaderUtils()

function buildFileSelector( multi = false ){
  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  if (multi) {
    fileSelector.setAttribute('multiple', 'multiple');
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
    const sessionId = traceHeaderUtilsObj.generateSessionId()
    this.state = {
      request: {},
      template: {},
      additionalData: {},
      addNewRequestDialogVisible: false,
      newRequestDescription: '',
      newTemplateName: '',
      newTestCaseName: '',
      createNewTestCaseDialogVisible: false,
      saveTemplateFileName: '',
      saveTemplateDialogVisible: false,
      saveTemplateOption: 1,
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
      sequenceDiagramVisible: false
    };
  }

  socket = null
  autoSave = false
  autoSaveIntervalId = null

  componentWillUnmount = () => {
    this.socket.disconnect()
    if(this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId)
    }
  }
  
  componentDidMount = async () => {
    this.collectionFileSelector = buildFileSelector(true);
    this.environmentFileSelector = buildFileSelector();
    this.collectionFileSelector.addEventListener ('input', (e) => {
      if (e.target.files) {
        if (e.target.files.length == 1) {
          this.handleImportCollectionFile(e.target.files[0])
        } else if (e.target.files.length > 1) {
          this.handleImportCollectionFileMulti(e.target.files)
        }
        this.collectionFileSelector.value = null
      }
    })
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
    this.socket.on("outboundProgress/" + this.state.sessionId, this.handleIncomingProgress);

    const storedTemplate = this.restoreSavedTemplate()
    if (storedTemplate) {
      this.setState({template: storedTemplate})
    }
    const additionalData = this.restoreAdditionalData()
    if (additionalData) {
      this.setState({additionalData: additionalData})
    }

    this.startAutoSaveTemplateTimer()

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
    // Find highest request id to determine the new ID
    let maxId = +this.state.template.test_cases.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)

    this.state.template.test_cases.push({ id: maxId+1, name: testCaseName })
    this.forceUpdate()
    this.autoSave = true
  }

  handleCreateNewTemplateClick = (templateName) => {
    const newTemplate = {
      name: templateName,
      inputValues: {},
      test_cases: []
    }
    this.setState({template: newTemplate, additionalData: { importedFilename: '' }})
    this.autoSave = true
  }

  download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  restoreSavedTemplate = () => {
    const storedTemplate = localStorage.getItem('template')
    if(storedTemplate) {
      try {
        return JSON.parse(storedTemplate)
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

  startAutoSaveTemplateTimer = () => {
    this.autoSaveIntervalId = setInterval ( () => {
      if (this.autoSave) {
        this.autoSave = false
        this.autoSaveTemplate(this.convertTemplate(this.state.template, true))
        this.autoSaveAdditionalData( this.state.additionalData )
      }
    },
    2000)
  }

  autoSaveTemplate = (template) => {
    localStorage.setItem('template', JSON.stringify(template));
  }

  autoSaveAdditionalData = (additionalData) => {
    localStorage.setItem('additionalData', JSON.stringify(additionalData));
  }

  handleTemplateSaveClick = (fileName) => {
    if (!fileName.endsWith('.json')) {
      message.error('Filename should be ended with .json');
      return
    }
    let templateContent = {}
    const { inputValues, ...remainingTemplateContent } = this.state.template
    if (this.state.saveTemplateOption === 1) {
      templateContent = { ...remainingTemplateContent }
    } else if (this.state.saveTemplateOption === 2) {
      templateContent = { inputValues }
    }
    this.download(JSON.stringify(this.convertTemplate(templateContent), null, 2), fileName, 'text/plain');
  }

  handleImportCollectionFile = (file_to_read) => {
    message.loading({ content: 'Reading the file...', key: 'importFileProgress' });
    var fileRead = new FileReader();
    fileRead.onload = (e) => {
      var content = e.target.result;
      try {
        var templateContent = JSON.parse(content);
        this.state.template.name = templateContent.name ? templateContent.name : file_to_read.name 
        this.state.template.test_cases = templateContent.test_cases
        this.state.additionalData = {
          importedFilename: file_to_read.name
        }
        this.forceUpdate()
        this.autoSave = true
        message.success({ content: 'File Loaded', key: 'importFileProgress', duration: 2 });
      } catch (err) {
        message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
      }
    };
    fileRead.readAsText(file_to_read);
  }

  handleImportCollectionFileMulti = async (fileList) => {
    message.loading({ content: 'Reading the selected files...', key: 'importFileProgress' });
    let testCases = []
    let startIndex = 0
    for (var i = 0; i < fileList.length; i++) {
      const file_to_read = fileList.item(i)
      const fileRead = new FileReader();
      try {
        const content = await readFileAsync(file_to_read)
        const templateContent = JSON.parse(content);
        
        templateContent.test_cases = templateContent.test_cases.map((testCase, index) => {
          const { id, ...remainingProps } = testCase
          return {
            id: startIndex + index + 1,
            ...remainingProps
          }
        })
        startIndex = startIndex + templateContent.test_cases.length
        testCases = testCases.concat(templateContent.test_cases)
      } catch(err) {
        message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
        break;
      }
    }
    this.state.template.test_cases = JSON.parse(JSON.stringify(testCases))
    this.state.template.name = 'multi'
    this.state.additionalData = {
      importedFilename: 'Multiple Files'
    }
    this.forceUpdate()
    this.autoSave = true
    message.success({ content: 'Collections Loaded', key: 'importFileProgress', duration: 2 });

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

  handleDownloadReport = async (event) => {
    switch(event.key) {
      case 'json':
        const jsonReportFileName = this.state.testReport.name + (this.state.testReport.runtimeInformation ? '-' + this.state.testReport.runtimeInformation.completedTimeISO : '') + '.json'
        FileDownload(JSON.stringify(this.state.testReport, null, 2), jsonReportFileName)
        break
      case 'printhtml':
      case 'html':
      default:
        message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
        const { apiBaseUrl } = getConfig()
        const reportFormat = event.key
        const response = await axios.post(apiBaseUrl + "/api/reports/testcase/" + reportFormat, this.state.testReport, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' })
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
    const deleteIndex = this.state.template.test_cases.findIndex(item => item.id == testCaseId)
    this.state.template.test_cases.splice(deleteIndex,1)
    this.handleTestCaseChange()
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

  downloadReportMenu = () => {
    return (
      <Menu onClick={this.handleDownloadReport}>
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
      const resp = await axios.get(apiBaseUrl + '/api/samples/load', {
        params: this.state.loadSampleChecked
      })
      if (resp.data.body.name) {
        this.state.template.name = resp.data.body.name
      }
      if (resp.data.body.inputValues) { 
        this.state.template.inputValues = resp.data.body.inputValues
      }
      if (resp.data.body.test_cases) {
        this.state.template.test_cases = resp.data.body.test_cases
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
        console.log('Sequence Diagram generated')
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

  render() {

    const createNewTestCaseDialogContent = (
      <>
      <Input 
        placeholder="Test case name"
        type="text"
        value={this.state.newTestCaseName}
        onChange={(e) => { this.setState({newTestCaseName: e.target.value })}}
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

    const createNewTemplateDialogContent = (
      <>
      <Input 
        placeholder="Template name"
        type="text"
        value={this.state.newTemplateName}
        onChange={(e) => { this.setState({newTemplateName: e.target.value })}}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.handleCreateNewTemplateClick(this.state.newTemplateName)
            this.setState({createNewTemplateDialogVisible: false})
          }}
          size="sm"
        >
          Create
      </Button>
      </>
    )

    const saveTemplateDialogContent = (
      <>
      <Row>
        <Col>
          <Input 
            placeholder="File name"
            type="text"
            value={this.state.saveTemplateFileName}
            onChange={(e) => { this.setState({saveTemplateFileName: e.target.value })}}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <Radio.Group
            onChange={e => {
              this.setState({saveTemplateOption: e.target.value})
            }}
            value={this.state.saveTemplateOption}
          >
            <Radio value={1}>Collection</Radio>
            <Radio value={2}>Environment</Radio>
          </Radio.Group>      
        </Col>
      </Row>
      <Row>
        <Col>
          <Button
              className="text-right mt-2"
              color="success"
              href="#pablo"
              onClick={ () => {
                this.handleTemplateSaveClick(this.state.saveTemplateFileName)
                this.setState({saveTemplateDialogVisible: false})
              }}
              size="sm"
            >
              Create
          </Button>
        </Col>
      </Row>
      </>
    )

    return (
      <>
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
                              <Button
                                color="success"
                                size="sm"
                                onClick={ e => {
                                  e.preventDefault();
                                  this.collectionFileSelector.click();
                                }}
                              >
                                Import Collection
                              </Button>
                              <Button
                                color="info"
                                size="sm"
                                onClick={ e => {
                                  e.preventDefault();
                                  this.environmentFileSelector.click();
                                }}
                              >
                                Import Environment
                              </Button>
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
                              <Popover
                                className="float-right"
                                content={saveTemplateDialogContent}
                                title="Enter filename to save"
                                trigger="click"
                                visible={this.state.saveTemplateDialogVisible}
                                onVisibleChange={ (visible) => this.setState({saveTemplateDialogVisible: visible})}
                              >
                                <Button
                                    className="text-right float-right"
                                    color="success"
                                    size="sm"
                                  >
                                    Save
                                </Button>
                              </Popover>
                              <Button
                                className="float-right"
                                color="info"
                                size="sm"
                                onClick={() => { this.setState({showTemplate: true})}}
                              >
                                Show Template
                              </Button>
                              <Popover
                                className="float-right"
                                content={createNewTemplateDialogContent}
                                title="Enter a name for the template"
                                trigger="click"
                                visible={this.state.createNewTemplateDialogVisible}
                                onVisibleChange={ (visible) => this.setState({createNewTemplateDialogVisible: visible})}
                              >
                                <Button
                                    className="text-right float-right"
                                    color="primary"
                                    size="sm"
                                  >
                                    New Template
                                </Button>
                              </Popover>
                              {
                                this.state.testReport
                                ? (
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
                                )
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
                    <Col span={14}>
                      <Row>
                        <Popover
                          className="float-right"
                          content={createNewTestCaseDialogContent}
                          title="Enter a name for the template"
                          trigger="click"
                          visible={this.state.createNewTestCaseDialogVisible}
                          onVisibleChange={ (visible) => this.setState({createNewTestCaseDialogVisible: visible})}
                        >
                          <Button
                              className="text-right float-right mb-2"
                              color="primary"
                              size="sm"
                            >
                              Add Test Case
                          </Button>
                        </Popover>
                      </Row>
                      <Row>
                        { this.getTestCaseItems() }
                      </Row>
                    </Col>
                    <Col span={10} className='pl-2'>
                      <InputValues values={this.state.template.inputValues} onChange={this.handleInputValuesChange} onDelete={this.handleInputValuesDelete} />
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
