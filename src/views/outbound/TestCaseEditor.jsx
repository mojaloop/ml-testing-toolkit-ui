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

import { Select, Input, Row, Col, Steps, Tabs, Skeleton, message, Popover, Badge } from 'antd';

import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import RequestBuilder from './RequestBuilder'
import TestAssertions from './TestAssertions'

const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;

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
                          <Button
                            className="float-right mr-2"
                            color="primary"
                            size="sm"
                            onClick={() => {this.props.onDuplicate(this.props.request.id)}}
                          >
                            Duplicate
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


class TestCaseEditor extends React.Component {

  constructor() {
    super();
    this.state = {
      addNewRequestDialogVisible: false,
      newRequestDescription: '',
    };
  }

  componentWillUnmount = () => {
  }
  
  componentDidMount = () => {

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
            const temp = _.get(this.props.inputValues, paramName)
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
    if (this.props.testCase.requests) {
      return this.props.testCase.requests.map(item => {
        const testStatus = item.status && item.tests && item.status.testResult ? item.status.testResult.passedCount + '/' + item.tests.assertions.length : ''
        const testStatusColor = item.status && item.tests && item.status.testResult && item.status.testResult.passedCount===item.tests.assertions.length ? '#87d068' : '#f50'
        return (
          <Col span={24 / (this.props.testCase.requests.length ? this.props.testCase.requests.length : 1)}>
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
                      allRequests={this.props.testCase.requests}
                      inputValues={this.props.inputValues}
                      onChange={this.props.onChange}
                      onDelete={this.handleRequestDelete}
                      onDuplicate={this.handleRequestDuplicate}
                    />
                  </TabPane>
                  
                  <TabPane tab={(<Badge offset={[20,0]} style={{ backgroundColor: testStatusColor }} count={testStatus}>Tests</Badge>)} key="4">
                    <TestAssertions
                      request={item}
                      allRequests={this.props.testCase.requests}
                      inputValues={this.props.inputValues}
                      onChange={this.props.onChange}
                      onDelete={this.handleRequestDelete}
                    />
                  </TabPane>
                  {
                    item.status && item.status.response
                    ? (
                      <TabPane tab="Response" key="3">
                        {
                          item.status.response
                          ? (
                            <>
                              <h4>Synchronous Response</h4>
                              <pre>{JSON.stringify(item.status.response,null,2)}</pre>
                            </>
                          )
                          : null
                        }
                        {
                          item.status.callback
                          ? (
                            <>
                              <h4>Callback</h4>
                              <pre>{JSON.stringify(item.status.callback,null,2)}</pre>
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
    if (this.props.testCase.requests) {
      const stepItems = this.props.testCase.requests.map(item => {
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

  handleAddNewRequestClick = (description) => {
    // Find highest request id to determine the new ID
    let maxId = +this.props.testCase.requests.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)

    this.props.testCase.requests.push({ id: maxId+1, description})
    this.forceUpdate()
  }

  handleRequestDelete = (requestId) => {
    const deleteIndex = this.props.testCase.requests.findIndex(item => item.id == requestId)
    this.props.testCase.requests.splice(deleteIndex,1)
    this.forceUpdate()
  }

  handleRequestDuplicate = (requestId) => {
    // Find the request to duplicate
    const { id, description, ...otherProps } = this.props.testCase.requests.find(item => item.id == requestId)
    // Find maximum ID for creating a new request
    let maxId = +this.props.testCase.requests.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)
    const clonedProps = JSON.parse(JSON.stringify(otherProps))

    this.props.testCase.requests.push({ id: maxId+1, description: description + ' Copy', ...clonedProps})
    this.forceUpdate()
  }

  // handleIncomingProgress = (progress) => {
  //   let request = this.props.testCase.requests.find(item => item.id === progress.id)
  //   if (request.status) {
  //     if (progress.status === 'SUCCESS') {
  //       request.status.state = 'finish'
  //       request.status.response = progress.response
  //       request.status.callback = progress.callback
  //       request.status.testResult = progress.testResult
  //     } else if (progress.status === 'ERROR') {
  //       request.status.state = 'error'
  //       request.status.response = progress.response
  //       request.status.callback = progress.callback
  //       request.status.testResult = progress.testResult
  //       // Clear the waiting status of the remaining requests
  //       for (let i in this.props.testCase.requests) {
  //         if (!this.props.testCase.requests[i].status) {
  //           this.props.testCase.requests[i].status = {}
  //         }
  //         if (this.props.testCase.requests[i].status.state === 'process') {
  //           this.props.testCase.requests[i].status.state = 'wait'
  //           this.props.testCase.requests[i].status.response = null
  //           this.props.testCase.requests[i].status.callback = null
  //           this.props.testCase.requests[i].status.testResult = null
  //         }
          
  //       }
  //       message.error({ content: 'Test case failed', key: 'outboundSendProgress', duration: 3 });
  //     }
  //     this.forceUpdate()
  //   }
  // }

  // Take the status property out from requests
  // convertTemplate = (template) => {
  //   if (template.requests) {
  //     let { requests, ...remainingProps } = template
  //     const newRequests = requests.map(item => {
  //       const { status, ...newRequest } = item
  //       return newRequest
  //     })
  //     return { ...remainingProps, requests: newRequests }
  //   } else {
  //     return null
  //   }
  // }

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

    return (
      <>
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
      </>
    );
  }
}

export default TestCaseEditor;