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

import Header from "../../components/Headers/Header.jsx";


import { Input, Row, Col, Affix, Descriptions, Modal, Icon, message, Popover, Upload, Progress } from 'antd';

import axios from 'axios';
import TestCaseEditor from './TestCaseEditor'
import TestCaseViewer from './TestCaseViewer'
import getConfig from '../../utils/getConfig'

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
      showTestCaseIndex: null,
      renameTestCase: false,
      totalPassedCount: 0,
      totalAssertionsCount: 0
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
  
  componentDidMount = () => {
    // const sampleTemplate = require('./sample1.json')
    // this.setState({template: sampleTemplate})
    this.socket = socketIOClient('http://127.0.0.1:5050');
    this.socket.on("outboundProgress", this.handleIncomingProgress);

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
    } else {
      let testCase = this.state.template.test_cases.find(item => item.id === progress.testCaseId)
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
          request.status.testResult = progress.testResult
        } else if (progress.status === 'ERROR') {
          request.status.state = 'error'
          request.status.response = progress.response
          request.status.callback = progress.callback
          request.status.requestSent = progress.requestSent
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
              testCase.requests[i].status.testResult = null
            }
            
          }
          // message.error({ content: 'Test case failed', key: 'outboundSendProgress', duration: 3 });
        }
        this.forceUpdate()
      }
    }
  }

  // mockTypeSuccess = true
  handleSendClick = async () => {
    // Initialize counts to zero
    this.state.totalPassedCount = 0
    this.state.totalAssertionsCount = 0

    const outboundRequestID = Math.random().toString(36).substring(7);
    message.loading({ content: 'Sending the outbound request...', key: 'outboundSendProgress' });
    const { apiBaseUrl } = getConfig()
    this.state.template = this.convertTemplate(this.state.template)
    await axios.post(apiBaseUrl + "/api/outbound/template/" + outboundRequestID, this.state.template, { headers: { 'Content-Type': 'application/json' } })
    message.success({ content: 'Test case initiated', key: 'outboundSendProgress', duration: 2 });

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




    // // Mock status changes to simulate the outbound transfer in UI
    // // Loop through the requests and set the status to waiting for each for some particular time
    // const waitForSomeTime = () => {
    //   return new Promise(function(resolve, reject) {
    //     setTimeout(resolve, 800, 'one');
    //   });
    // }

    // for (let i in this.state.template.requests) {
    //   await waitForSomeTime()
    //   this.state.template.requests[i].status.state = 'finish'
    //   this.state.template.requests[i].status.response = { body: 'This is a sample response' }
    //   if (!this.mockTypeSuccess && i==1) {
    //     this.state.template.requests[i].status.state = 'error'
    //     this.forceUpdate()
    //     break;
    //   }
    //   this.forceUpdate()
    // }
    // this.mockTypeSuccess = !this.mockTypeSuccess

  }

  // Take the status property out from requests
  convertTemplate = (template) => {
    let { test_cases, ...remainingTestCaseProps } = template
    let newTestCases = test_cases
    if(test_cases) {
      newTestCases = test_cases.map(testCase => {
        if (testCase.requests) {
          let { requests, ...remainingProps } = testCase
          const newRequests = requests.map(item => {
            const { status, ...newRequest } = item
            return newRequest
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
        this.autoSaveTemplate(this.convertTemplate(this.state.template))
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
    this.download(JSON.stringify(this.convertTemplate(this.state.template), null, 2), fileName, 'text/plain');
  }

  handleImportFile = (file_to_read) => {
    message.loading({ content: 'Reading the file...', key: 'importFileProgress' });
    var fileRead = new FileReader();
    fileRead.onload = (e) => {
      var content = e.target.result;
      try {
        var intern = JSON.parse(content);
        console.log(file_to_read)
        this.setState({template: intern, additionalData: { importedFilename: file_to_read.name }})
        this.autoSave = true
        message.success({ content: 'File Loaded', key: 'importFileProgress', duration: 2 });
      } catch (err) {
        message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
      }
    };
    fileRead.readAsText(file_to_read);

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
              />
            </Col>
          </Row>
        )
      })
    }
    return null
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
      <Input 
        placeholder="File name"
        type="text"
        value={this.state.saveTemplateFileName}
        onChange={(e) => { this.setState({saveTemplateFileName: e.target.value })}}
      />
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
          title="Test Case Editor"
          width='90%'
          visible={this.state.showTestCaseIndex!=null? true : false}
          footer={null}
          onCancel={() => { this.setState({showTestCaseIndex: null})}}
        >
          {
            this.state.showTestCaseIndex!=null
            ? (
              <TestCaseEditor testCase={this.state.template.test_cases[this.state.showTestCaseIndex]} onChange={this.handleTestCaseChange} inputValues={this.state.template.inputValues} />
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
                              <Upload 
                                accept = '.json'
                                showUploadList = {false}
                                beforeUpload = {file => {
                                  this.handleImportFile(file)
                                  return false;
                                }}
                              >
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={e => e.preventDefault()}
                                >
                                  Import Template
                                </Button>
                              </Upload>
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
                                onClick={this.handleSendClick}
                              >
                                Send
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
