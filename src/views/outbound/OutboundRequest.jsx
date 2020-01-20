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


import { Select, Input, Row, Col, Affix, Steps, Descriptions, Switch, Tabs, Modal, Icon, Skeleton, message } from 'antd';

import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import RequestBuilder from './RequestBuilder'
import { Logs } from '../Index'

const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;


class InputValues extends React.Component {

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
              <Icon type="delete" theme="filled" />
            </Col>
          </Row>
          
        </Descriptions.Item>
        </>
      )
    }
    return inputItems
  }

  render () {
    return (
      <>
      <Row gutter={16}>
        <Col span={24}>
          <Card className="bg-white shadow">
            <CardBody>
              <Button
                  className="text-right float-right"
                  color="primary"
                  href="#pablo"
                  onClick={e => e.preventDefault()}
                  size="sm"
                >
                  Add Input Value
              </Button>
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
    if(this.props.openApiDefinition.paths) {
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
      openApiDefinition: {},
      selectedResource: null,
      callbackMap: {}
    };
  }

  componentDidMount = async () => {
    const openApiDefinition = await this.getDefinition()
    const callbackMap = await this.getCallbackMap()
    // Deep clone the input rule to a new object to work with (Copying without object references recursively)
    const inputRule = {}
    let selectedResource = null
    if (this.props.request) {
      selectedResource = {
        path: this.props.request.operationPath,
        method: this.props.request.method
      }
    }

    this.setState({selectedResource, openApiDefinition, callbackMap})
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

  getDefinition = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/definition/1.1")
    // console.log(response.data)
    return response.data
    // this.setState(  { openApiDefinition: response.data } )
  }

  getCallbackMap = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/callback_map/1.1")
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  resourceSelectHandler = (resource) => {
    const request = this.state.request
    request.operationPath = resource.path
    request.path = resource.path
    request.method = resource.method
    this.props.onChange(request)
    this.setState({selectedResource: resource, request})
  }

  getResourceDefinition = () => {
    if (this.state.selectedResource && this.state.openApiDefinition) {
      return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method]
    }
    return null
  }
  getRootParameters = () => {
    var rootParams = []
    if (this.state.selectedResource && this.state.openApiDefinition) {
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
                      <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.state.openApiDefinition} onSelect={this.resourceSelectHandler} />
                    </Col>
                    <Col span={8}>
                      <Row className="text-right float-right">
                        <Col>
                          <Switch defaultChecked />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form>
                        <RequestBuilder
                          request={this.props.request}
                          inputValues={this.props.inputValues}
                          onChange={this.handleRequestChange}
                          resource={this.state.selectedResource}
                          resourceDefinition={this.getResourceDefinition()}
                          rootParameters={this.getRootParameters()}
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
      template: {}
    };
  }

  componentDidMount = () => {
    const sampleTemplate = require('./sample1.json')
    this.setState({template: sampleTemplate})
    const socket = socketIOClient('http://127.0.0.1:5050');
    socket.on("outboundProgress", this.handleIncomingProgress);
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
          <Col span={8}>
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
                      inputValues={this.state.template.inputValues}
                      onChange={this.handleRequestChange}
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

  handleIncomingProgress = (progress) => {
    // console.log(progress)
    let request = this.state.template.requests.find(item => item.id === progress.id)
    if (progress.status === 'SUCCESS') {
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

  render() {

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
          <pre>{JSON.stringify(this.state.template, null, 2)}</pre>
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
                          <Button
                            color="success"
                            size="sm"
                            onClick={e => e.preventDefault()}
                          >
                            Import Template
                          </Button>

                          <Button
                            className="float-right"
                            color="danger"
                            size="sm"
                            onClick={this.handleSendClick}
                          >
                            Send
                          </Button>
                          <Button
                            className="float-right"
                            color="info"
                            size="sm"
                            onClick={() => { this.setState({showTemplate: true})}}
                          >
                            Show Template
                          </Button>
                          <Button
                            className="float-right"
                            color="primary"
                            size="sm"
                            onClick={e => e.preventDefault()}
                          >
                            Create Template
                          </Button>
                        </CardBody>
                        </Card>
                    </Col>
                  </Row>
                  </Affix>
                  <Row>
                    <Col span={24}>
                      <InputValues values={this.state.template.inputValues} onChange={this.handleInputValuesChange} />
                    </Col>
                  </Row>
                  <Row className="mt-4">
                    <Col span={24}>
                    <Card className="card-profile shadow">
                      <CardHeader>
                        {this.getStepItems()}
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
