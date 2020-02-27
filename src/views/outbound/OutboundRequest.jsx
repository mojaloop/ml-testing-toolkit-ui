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
import _ from 'lodash';
 
// reactstrap components
import {
  Card,
  CardBody,
  FormGroup,
  CardHeader,
  Form,
  Container,
  Button,
} from "reactstrap";
// core components

import socketIOClient from "socket.io-client";

import Header from "components/Headers/Header.jsx";


import { Select, Input, Row, Col, Affix, Steps, Descriptions, Switch, Tabs, Modal, Icon, Skeleton, message, Popover, Upload } from 'antd';

import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import RequestBuilder from './RequestBuilder'

const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;


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
                <Descriptions title="Input Values" bordered>
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



class ResourceSelector extends React.Component {

  constructor() {
    super();
    this.state = {
      selectedItem: null
    }
  }
  resourceOptions = []

  getResourceOptions = () => {
    this.resourceOptions = []
    if(this.props.openApiDefinition && this.props.openApiDefinition.paths) {
      let currentResourceGroup = ''
      for ( let pathKey in this.props.openApiDefinition.paths ) {
        for ( let methodKey in this.props.openApiDefinition.paths[pathKey]) {
          let itemKey = methodKey + " " + pathKey
          switch(methodKey) {
            case 'get':
            case 'post':
              this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{itemKey}</Option>)
              break
          }
        }
      }
    }
    return this.resourceOptions
  }

  getResourceValue = () => {
    // console.log(this.props.value)
    if(this.props.value) {
      return this.props.value.method + ' ' + this.props.value.path
    } else {
      return null
    }
    
  }

  render() {

    const resourceSelectHandler = (eventKey) => {
      const resourceArr = eventKey.split(' ')
      const resource = {
        method: resourceArr[0],
        path: resourceArr[1]
      }
      this.state.selectedItem = resource
      // this.state.selectedItem = JSON.parse(eventKey)
      this.props.onSelect(resource)
      // console.log(this.props.openApiDefinition.paths[selectedItem.path][selectedItem.method])
    }

    return(
      <Select onChange={resourceSelectHandler}
        disabled={(this.props.value? true : false)}
        style={{ width: 300 }}
        placeholder="Select a resource"
        value={this.getResourceValue()}
      >
      {this.getResourceOptions()}
      </Select>
    )
  }
}

class ApiVersionSelector extends React.Component {

  constructor() {
    super();
  }
  apiVersionOptions = []

  getApiVersionOptions = () => {
    this.apiVersionOptions = this.props.apiVersions.map((item, index) => {
      return (
        <Option key={index} value={JSON.stringify(item)}>{item.type} {item.majorVersion}.{item.minorVersion}</Option>
      )
    })
    return this.apiVersionOptions
  }

  getApiVersionValue = () => {
    if(this.props.value) {
      return JSON.stringify(this.props.value)
    } else {
      return null
    }
  }

  render() {

    const apiVersionSelectHandler = (eventKey) => {
      this.props.onSelect(JSON.parse(eventKey))
    }

    return(
      <>
      <Select onChange={apiVersionSelectHandler}
        disabled={(this.props.value? true : false)}
        style={{ width: 300 }}
        placeholder="Select an API"
        value={this.getApiVersionValue()}
      >
      {this.getApiVersionOptions()}
      </Select>
      </>
    )
  }
}

class RequestGenerator extends React.Component {

  constructor() {
    super();
    this.state = {
      origJson: [],
      curJson: {},
      description: '',
      request: {},
      conditions: [],
      pathMethodConditions: [],
      openApiDefinition: null,
      selectedResource: null,
      selectedApiVersion: null,
      callbackMap: {},
      apiVersions: []
    };
  }

  componentDidMount = async () => {

    const apiVersions = await this.getApiVersions()

    // Deep clone the input rule to a new object to work with (Copying without object references recursively)
    const inputRule = {}
    let selectedResource = null
    if (this.props.request && this.props.request.operationPath && this.props.request.method) {
      selectedResource = {
        path: this.props.request.operationPath,
        method: this.props.request.method
      }
    }

    let selectedApiVersion = null
    if(this.props.request && this.props.request.apiVersion) {
        selectedApiVersion = this.props.request.apiVersion
        await this.fetchAllApiData(selectedApiVersion.type, selectedApiVersion.majorVersion+'.'+selectedApiVersion.minorVersion)
    }

    this.setState({selectedResource, apiVersions, selectedApiVersion})
  }

  fetchAllApiData = async (apiType, version) => {

    const openApiDefinition = await this.getDefinition(apiType, version)
    let callbackMap = {}
    try {
      callbackMap = await this.getCallbackMap(apiType, version)
    } catch(err) {}

    let responseMap = {}
    try {
      responseMap = await this.getResponseMap(apiType, version)
    } catch(err) {}
    this.setState({openApiDefinition, callbackMap, responseMap})
  }

  getConditions = () => {
    return this.state.conditions
  }

  getPathMethodConditions = () => {
    return this.state.pathMethodConditions
  }

  getRequest = () => {
    return this.state.request
  }
  // async componentWillMount() {
  //   await this.getDefinition()
  //   await this.getCallbackMap()
  // }

  getRule = () => {
    const rule = {
      description: this.state.description,
      conditions: {
        "all": [...this.state.conditions, ...this.state.pathMethodConditions]
      },
      request: this.state.request,
    }
    return JSON.stringify(rule, null, 2)
  }

  handleConditionsChange = () => {
    this.forceUpdate()
    // this.setState({conditions});
  };

  handleRequestChange = (request) => {
    this.setState({request});
    this.props.onChange(request)
  };

  getApiVersions = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/api_versions")
    return response.data
  }

  getDefinition = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/definition/${apiType}/${version}`)
    // console.log(response.data)
    return response.data
    // this.setState(  { openApiDefinition: response.data } )
  }

  getResponseMap = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/response_map/${apiType}/${version}`)
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  getCallbackMap = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/callback_map/${apiType}/${version}`)
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  apiVersionSelectHandler = (apiVersion) => {
    this.fetchAllApiData(apiVersion.type, apiVersion.majorVersion+'.'+apiVersion.minorVersion)
    const request = this.props.request
    request.apiVersion = apiVersion
    this.props.onChange(request)
    this.setState({selectedApiVersion: apiVersion})
  }

  resourceSelectHandler = (resource) => {
    const request = this.props.request
    request.operationPath = resource.path
    request.path = resource.path
    request.method = resource.method
    this.props.onChange(request)
    this.setState({selectedResource: resource, request})
  }

  getResourceDefinition = () => {
    if (this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method) {
      return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method]
    }
    return null
  }
  getRootParameters = () => {
    var rootParams = []
    if (this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method) {
      rootParams = this.state.openApiDefinition.paths[this.state.selectedResource.path].parameters
    }
    return rootParams
  }

  getCallbackObject = () => {
      let callbackObj = null
      try {
        if(this.props.mode === 'validation') {
          callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['errorCallback']
        } else {
          callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['successCallback']
        }
      } catch(err){
      }
      return callbackObj
  }

  getCallbackRootParameters = () => {
      try {
        const callbackObj = this.getCallbackObject()
        return this.state.openApiDefinition.paths[callbackObj.path].parameters
      } catch(err) {
        return []
      }
 
  }

  getCallbackDefinition = () => {
    if (this.state.selectedResource) {
      try {
        const callbackObj = this.getCallbackObject()
        return this.state.openApiDefinition.paths[callbackObj.path][callbackObj.method]
      } catch(err) {
        return null
      }

    }
    return null
  }

  handleDescriptionChange = (newValue) => {
    this.setState({description: newValue})
  }


  render() {
    return (
      <>
          <Row>
            <Col span={24}>
                  <Row className="align-items-center">
                    <Col span={16}>
                      <table>
                        <tbody>
                        <tr>
                          <td align='right'><b>API:</b></td>
                          <td>
                            <ApiVersionSelector value={this.state.selectedApiVersion} apiVersions={this.state.apiVersions} onSelect={this.apiVersionSelectHandler} />
                          </td>
                        </tr>
                        <tr>
                          <td align='right'><b>Resource:</b></td>
                          <td>
                            <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.state.openApiDefinition} onSelect={this.resourceSelectHandler} />
                          </td>
                        </tr>
                        </tbody>
                      </table>
                    </Col>
                    <Col span={8}>
                      <Row className="text-right float-right">
                        <Col>
                          <Button
                            className="float-right"
                            color="danger"
                            size="sm"
                            onClick={() => {this.props.onDelete(this.props.request.id)}}
                          >
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form>
                        <RequestBuilder
                          request={this.props.request}
                          allRequests={this.props.allRequests}
                          inputValues={this.props.inputValues}
                          onChange={this.handleRequestChange}
                          resource={this.state.selectedResource}
                          resourceDefinition={this.getResourceDefinition()}
                          rootParameters={this.getRootParameters()}
                          openApiDefinition={this.state.openApiDefinition}
                          callbackMap={this.state.callbackMap}
                        />
                      </Form>
                    </Col>
                  </Row>
            </Col>
          </Row>
      </>
    );
  }
}

class OutboundRequest extends React.Component {

  constructor() {
    super();
    this.state = {
      request: {},
      template: {},
      addNewRequestDialogVisible: false,
      newRequestDescription: '',
      newTemplateName: '',
      createNewTemplateDialogVisible: false,
      saveTemplateFileName: '',
      saveTemplateDialogVisible: false,
    };
  }

  socket = null

  componentWillUnmount = () => {
    this.socket.disconnect()
  }
  
  componentDidMount = () => {
    // const sampleTemplate = require('./sample1.json')
    // this.setState({template: sampleTemplate})
    this.socket = socketIOClient('http://127.0.0.1:5050');
    this.socket.on("outboundProgress", this.handleIncomingProgress);
  }

  replaceInputValues = (inputObject, inputValues) => {
    var resultObject
    // Check whether inputObject is string or object. If it is object, then convert that to JSON string and parse it while return
    if (typeof inputObject === 'string') {
      resultObject = inputObject
    } else if (typeof inputObject === 'object') {
      resultObject = JSON.stringify(inputObject)
    } else {
      return inputObject
    }
  
    // Check the string for any inclusions like {$some_param}
    const matchedArray = resultObject.match(/{\$([^}]+)}/g)
    if (matchedArray) {
      matchedArray.forEach(element => {
        // Check for the function type of param, if its function we need to call a function in custom-functions and replace the returned value
        const splitArr = element.split('.')
        switch (splitArr[0]) {
          case '{$inputs':
          default:
            const paramName = element.slice(9,element.length-1)
            const temp = _.get(this.state.template.inputValues, paramName)
            if (temp) {
              resultObject = resultObject.replace(element, temp)
            }
        }
      })
    }
  
    if (typeof inputObject === 'object') {
      return JSON.parse(resultObject)
    } else {
      return resultObject
    }
  }

  getRequestGeneratorItems = () => {
    if (this.state.template.requests) {
      return this.state.template.requests.map(item => {
        return (
          <Col span={24 / (this.state.template.requests.length ? this.state.template.requests.length : 1)}>
            {
              item.status && (item.status.state === 'waiting' || item.status.state === 'process')
              ? (<Skeleton paragraph={ {rows: 10} } active />)
              : (
                <Tabs defaultActiveKey='1'>
                  <TabPane tab="Request" key="1">
                    {
                      item.headers
                      ? (
                        <>
                        <h4>Header</h4>
                        <pre>{JSON.stringify(this.replaceInputValues(item.headers),null,2)}</pre>
                        </>
                      )
                      : null
                    }
                    {
                      item.body
                      ? (
                        <>
                        <h4>Body</h4>
                        <pre>{JSON.stringify(this.replaceInputValues(item.body),null,2)}</pre>
                        </>
                      )
                      : null
                    }
                  </TabPane>
                  <TabPane tab="Editor" key="2">
                    <RequestGenerator
                      request={item}
                      allRequests={this.state.template.requests}
                      inputValues={this.state.template.inputValues}
                      onChange={this.handleRequestChange}
                      onDelete={this.handleRequestDelete}
                    />
                  </TabPane>
                  {
                    item.status && item.status.response
                    ? (
                      <TabPane tab="Response" key="3">
                        {
                          item.status.response.headers
                          ? (
                            <>
                              <h4>Header</h4>
                              <pre>{JSON.stringify(item.status.response.headers,null,2)}</pre>
                            </>
                          )
                          : null
                        }
                        {
                          item.status.response.body
                          ? (
                            <>
                              <h4>Body</h4>
                              <pre>{JSON.stringify(item.status.response.body,null,2)}</pre>
                            </>
                          )
                          : null
                        }
                      </TabPane>
                    )
                    : null
                  }
                </Tabs>
              )
            }

          </Col>
        )
      })
    } else {
      return null
    }
  }

  getStepItems = () => {
    if (this.state.template.requests) {
      const stepItems = this.state.template.requests.map(item => {
        return (
          <Step status={item.status? item.status.state : null} title={item.method} subTitle={item.operationPath} description={item.description} />
        )
      })
      const spanCol = stepItems.length < 3 ? stepItems.length * 8 : 24
      return (
        <Row>
          <Col span={spanCol}>
            <Steps current={-1} type="navigation" size="default">
              {stepItems}
            </Steps>
          </Col>
        </Row>
      )
      
    } else {
      return null
    }
  }

  handleRequestChange = (request) => {
    this.setState({request: request})
  }

  handleInputValuesChange = (name, value) => {
    this.state.template.inputValues[name] = value
    this.forceUpdate()
  }

  handleInputValuesDelete = (name) => {
    delete this.state.template.inputValues[name]
    this.forceUpdate()
  }

  handleAddNewRequestClick = (description) => {
    // Find highest request id to determine the new ID
    let maxId = +this.state.template.requests.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)

    this.state.template.requests.push({ id: maxId+1, description})
    this.forceUpdate()
  }

  handleRequestDelete = (requestId) => {
    const deleteIndex = this.state.template.requests.findIndex(item => item.id == requestId)
    this.state.template.requests.splice(deleteIndex,1)
    this.forceUpdate()
  }

  handleIncomingProgress = (progress) => {
    // console.log(progress)
    let request = this.state.template.requests.find(item => item.id === progress.id)
    if (request.status) {
      if (progress.status === 'SUCCESS') {
        console.log(request)
        request.status.state = 'finish'
        request.status.response = progress.response
      } else if (progress.status === 'ERROR') {
        request.status.state = 'error'
        request.status.response = { body: progress.error }
        // Clear the waiting status of the remaining requests
        for (let i in this.state.template.requests) {
          if (!this.state.template.requests[i].status) {
            this.state.template.requests[i].status = {}
          }
          if (this.state.template.requests[i].status.state === 'process') {
            this.state.template.requests[i].status.state = 'wait'
            this.state.template.requests[i].status.response = null
          }
          
        }
        message.error({ content: 'Test case failed', key: 'outboundSendProgress', duration: 3 });
      }
      this.forceUpdate()
    }
  }

  // mockTypeSuccess = true
  handleSendClick = async () => {

    const outboundRequestID = Math.random().toString(36).substring(7);
    message.loading({ content: 'Sending the outbound request...', key: 'outboundSendProgress' });
    await axios.post("http://localhost:5050/api/outbound/template/" + outboundRequestID, this.state.template, { headers: { 'Content-Type': 'application/json' } })
    message.success({ content: 'Test case Sent', key: 'outboundSendProgress', duration: 2 });

    // Set the status to waiting for all the requests
    for (let i in this.state.template.requests) {
      if (!this.state.template.requests[i].status) {
        this.state.template.requests[i].status = {}
      }
      this.state.template.requests[i].status.state = 'process'
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
    if (template.requests) {
      let { requests, ...remainingProps } = template
      const newRequests = requests.map(item => {
        const { status, ...newRequest } = item
        return newRequest
      })
      return { ...remainingProps, requests: newRequests }
    } else {
      return null
    }
  }

  handleCreateNewTemplateClick = (templateName) => {
    this.setState({template: {
      name: templateName,
      inputValues: {},
      requests: []
    }})
  }

  download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  handleTemplateSaveClick = (fileName) => {
    this.download(JSON.stringify(this.convertTemplate(this.state.template), null, 2), fileName, 'text/plain');
  }

  handleImportFile = (file_to_read) => {
    message.loading({ content: 'Reading the file...', key: 'importFileProgress' });
    var fileRead = new FileReader();
    fileRead.onload = (e) => {
      var content = e.target.result;
      try {
        var intern = JSON.parse(content);
        this.setState({template: intern})
        message.success({ content: 'File Loaded', key: 'importFileProgress', duration: 2 });
      } catch (err) {
        message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
      }
    };
    fileRead.readAsText(file_to_read);

  }

  render() {

    const addNewRequestDialogContent = (
      <>
      <Input 
        placeholder="Enter description"
        type="text"
        value={this.state.newRequestDescription}
        onChange={(e) => { this.setState({newRequestDescription: e.target.value })}}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.handleAddNewRequestClick(this.state.newRequestDescription)
            this.setState({addNewRequestDialogVisible: false})
          }}
          size="sm"
        >
          Add
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
                        </CardBody>
                        </Card>
                    </Col>
                  </Row>
                  </Affix>
                  <Row>
                    <Col span={24}>
                      <InputValues values={this.state.template.inputValues} onChange={this.handleInputValuesChange} onDelete={this.handleInputValuesDelete} />
                    </Col>
                  </Row>
                  <Row className="mt-4">
                    <Col span={24}>
                    <Card className="card-profile shadow">
                      <CardHeader>
                        {this.getStepItems()}
                        <Popover
                          content={addNewRequestDialogContent}
                          title="Enter a description for the request"
                          trigger="click"
                          visible={this.state.addNewRequestDialogVisible}
                          onVisibleChange={ (visible) => this.setState({addNewRequestDialogVisible: visible})}
                        >
                          <Button
                              className="text-right float-right"
                              color="primary"
                              size="sm"
                            >
                              Add New Request
                          </Button>
                        </Popover>
                      </CardHeader>
                      <CardBody>
                        <Row gutter={16} >
                          {this.getRequestGeneratorItems()}
                        </Row>
                      </CardBody>
                    </Card>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
          {/* <Row>
            <Col className="mt-4" span={24}>
              <Card className="card-profile shadow">
                <CardHeader>
                  <div className="d-flex float-right">
                    <Button
                      className="float-right"
                      color="danger"
                      size="sm"
                    >
                      Clear Logs
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <Logs />
                </CardBody>
              </Card>
            </Col>
          </Row> */}
        </Container>
      </>
    );
  }
}

export default OutboundRequest;
