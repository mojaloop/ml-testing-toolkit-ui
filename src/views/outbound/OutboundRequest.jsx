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
  FormGroup,
  CardHeader,
  Form,
  Input,
  Container,
  Row,
  Button,
  Col,
} from "reactstrap";
// core components

import Header from "components/Headers/Header.jsx";

import { Dropdown, DropdownButton } from 'react-bootstrap'; 

import { Select } from 'antd';

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
          let itemKey = JSON.stringify({
            method: methodKey,
            path: pathKey
          })
          switch(methodKey) {
            case 'get':
            case 'post':
              this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>)
              break
          }
        }
      }
    }
    return this.resourceOptions
  }

  getResourceValue = () => {
    if(this.props.value) {
      return JSON.stringify(this.props.value)
    } else {
      return null
    }
    
  }

  render() {

    const resourceSelectHandler = (eventKey) => {
      this.state.selectedItem = JSON.parse(eventKey)
      this.props.onSelect(this.state.selectedItem)
      // console.log(this.props.openApiDefinition.paths[selectedItem.path][selectedItem.method])
    }

    return(
      <Select onChange={resourceSelectHandler}
        disabled={(this.state.selectedItem? true : false)}
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
    try {
      const pathObject = inputRule.conditions.all.find(item => (item.fact === 'operationPath'))
      const methodObject = inputRule.conditions.all.find(item => (item.fact === 'method'))
      if(pathObject && methodObject) {
        selectedResource = {
          method: methodObject.value,
          path: pathObject.value
        }
      }
    } catch(err) {}

    let pathMethodConditions = []
    let conditions = []
    try {
      pathMethodConditions = inputRule.conditions.all.filter(item => {
        if(item.fact === 'method' || item.fact === 'operationPath') {
          return true
        } else {
          return false
        }
      })
      conditions = inputRule.conditions.all.filter(item => {
        if(item.fact === 'method' || item.fact === 'operationPath') {
          return false
        } else {
          return true
        }
      })
    } catch(err){}

    let request = {
      method: null,
      path: null,
      body: null,
      headers: null
    }
    if (inputRule.request) {
      request = inputRule.request
    }

    let description = ''
    if (inputRule.description) {
      description = inputRule.description
    }
    this.setState({description, conditions, pathMethodConditions, request, selectedResource, openApiDefinition, callbackMap})
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

  handleSend = () => {
    // const newJson = this.refs.editor.jsonEditor.get()
    // // this.setState( { curJson: [ ...newJson ]} )
    axios.post("http://localhost:5050/api/outbound/request", this.state.request, { headers: { 'Content-Type': 'application/json' } })
    // this.props.onSave(JSON.parse(this.getRule()))
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
            {/* <Col className="order-xl-2 mb-5 mb-xl-0" xl="6">
              <Card className="card-profile shadow">
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
                  <div className="d-flex float-right">
                    <Button
                      className="float-right"
                      color="primary"
                      href="#pablo"
                      onClick={this.handleSave}
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <div className="text-left">
                    <pre>{this.getRule()}</pre>
                  </div>
                </CardBody>
              </Card>
            </Col> */}
            <Col className="order-xl-1" xl="12">
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <Row className="align-items-center">
                    <Col xs="8" className="text-center">
                      <b>Resource:</b> <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.state.openApiDefinition} onSelect={this.resourceSelectHandler} />
                    </Col>
                    <Col xs="4">
                      <Row className="text-right float-right">
                        <Col>
                          <Button
                            color="danger"
                            href="#pablo"
                            onClick={e => e.preventDefault()}
                            size="sm"
                          >
                            Reset
                          </Button>
                        </Col>
                        <Col>
                          <Button
                            className="float-right"
                            color="success"
                            href="#pablo"
                            onClick={this.handleSend}
                            size="sm"
                          >
                            Send
                          </Button>
                        </Col>
                      </Row>

                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Form>
                    <RequestBuilder
                      request={this.getRequest()}
                      onChange={this.handleRequestChange}
                      resource={this.state.selectedResource}
                      resourceDefinition={this.getResourceDefinition()}
                      rootParameters={this.getRootParameters()}
                    />
                  </Form>
                </CardBody>
              </Card>
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
      request: {}
    };
  }

  handleRequestChange = (request) => {
    this.setState({request: request})
  }

  render() {

    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="6">
              <Card className="card-profile shadow">
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
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
                  {/* <pre>{JSON.stringify(this.state.request, null, 2)}</pre> */}
                  <Logs />
                </CardBody>
              </Card>
            </Col>
            <Col className="order-xl-1" xl="6">
              <RequestGenerator
                onChange={this.handleRequestChange}
              />
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default OutboundRequest;
