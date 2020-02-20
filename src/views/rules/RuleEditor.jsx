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
import ConditionBuilder from './ConditionBuilder'
import EventBuilder from './EventBuilder'
import EventResponseBuilder from './EventResponseBuilder'

const { Option } = Select;

class ResourceSelector extends React.Component {

  constructor() {
    super();
  }
  resourceOptions = []

  getResourceOptions = () => {
    this.resourceOptions = []
    if(this.props.openApiDefinition) {
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
              // if (pathKey === '/parties/{Type}/{ID}' || pathKey === '/quotes' || pathKey === '/transfers') {
                this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>)                
              // }
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
      this.props.onSelect(JSON.parse(eventKey))
    }

    return(
      <>
      <Select onChange={resourceSelectHandler}
        disabled={(this.props.value? true : false)}
        style={{ width: 300 }}
        placeholder="Select a resource"
        value={this.getResourceValue()}
      >
      {this.getResourceOptions()}
      </Select>
      </>
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

class RulesEditor extends React.Component {

  constructor() {
    super();
    this.state = {
      origJson: [],
      curJson: {},
      description: '',
      event: {},
      conditions: [],
      pathMethodConditions: [],
      apiVersions: [],
      openApiDefinition: null,
      selectedResource: null,
      selectedApiVersion: null,
      callbackMap: {},
      responseMap: {}
    };
  }

  componentDidMount = async () => {
    const apiVersions = await this.getApiVersions()

    
    // Deep clone the input rule to a new object to work with (Copying without object references recursively)
    const inputRule = JSON.parse(JSON.stringify(this.props.rule))
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

    let event = {
      method: null,
      path: null,
      params: {},
      delay: 0
    }
    if (inputRule.event) {
      event = inputRule.event
    }

    let description = ''
    if (inputRule.description) {
      description = inputRule.description
    }

    let selectedApiVersion = null
    if(inputRule.apiVersion) {
        selectedApiVersion = inputRule.apiVersion
        await this.fetchAllApiData(inputRule.apiVersion.type, inputRule.apiVersion.majorVersion+'.'+inputRule.apiVersion.minorVersion)
    }

    this.setState({description, conditions, pathMethodConditions, event, selectedResource, apiVersions, selectedApiVersion})
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

  getEvent = () => {
    return this.state.event
  }
  // async componentWillMount() {
  //   await this.getDefinition()
  //   await this.getCallbackMap()
  // }

  getRule = () => {
    const rule = {
      description: this.state.description ? this.state.description : this.state.selectedResource.method + ' ' + this.state.selectedResource.path,
      apiVersion: this.state.selectedApiVersion,
      conditions: {
        "all": [...this.state.conditions, ...this.state.pathMethodConditions]
      },
      event: this.state.event,
    }
    return JSON.stringify(rule, null, 2)
  }

  handleConditionsChange = () => {
    this.forceUpdate()
    // this.setState({conditions});
  };

  handleEventChange = (event) => {
    this.setState({event});
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

  handleSave = () => {
    // const newJson = this.refs.editor.jsonEditor.get()
    // // this.setState( { curJson: [ ...newJson ]} )
    // axios.put("http://localhost:5050/api/rules/callback", newJson, { headers: { 'Content-Type': 'application/json' } })
    this.props.onSave(JSON.parse(this.getRule()))
  }

  apiVersionSelectHandler = (apiVersion) => {
    this.fetchAllApiData(apiVersion.type, apiVersion.majorVersion+'.'+apiVersion.minorVersion)
    // this.state.pathMethodConditions = []
    // this.state.pathMethodConditions.push({
    //   fact: 'operationPath',
    //   operator: 'equal',
    //   value: apiVersion.path
    // })
    // this.state.pathMethodConditions.push({
    //   fact: 'method',
    //   operator: 'equal',
    //   value: apiVersion.method
    // })
    // const newApiVersion = {
    //   type: apiVersion.type,
    //   version: apiVersion.majorVersion+'.'+apiVersion.minorVersion
    // }
    this.setState({selectedApiVersion: apiVersion})
  }

  resourceSelectHandler = (resource) => {
    this.state.pathMethodConditions = []
    this.state.pathMethodConditions.push({
      fact: 'operationPath',
      operator: 'equal',
      value: resource.path
    })
    this.state.pathMethodConditions.push({
      fact: 'method',
      operator: 'equal',
      value: resource.method
    })
    this.setState({selectedResource: resource})
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

  getResponseObject = () => {
    let responseObj = null
    try {
      responseObj = this.state.responseMap[this.state.selectedResource.path][this.state.selectedResource.method]['response']
    } catch(err){
    }
    return responseObj
  }

  getResponses = () => {
    if (this.state.selectedResource) {
      try {
        const responseObj = this.getResponseObject()
        return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method].responses
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
                    <Col xs="2">
                      <h3 className="mb-0">Rule #{this.props.rule.ruleId}</h3>
                    </Col>
                    <Col xs="6" className="text-center">
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
                            color="primary"
                            href="#pablo"
                            onClick={this.handleSave}
                            size="sm"
                          >
                            Save
                          </Button>
                        </Col>
                      </Row>

                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Form>
                    <h6 className="heading-small text-muted mb-4">
                      Conditions
                    </h6>
                    <div className="pl-lg-4">

                      <ConditionBuilder
                        conditions={this.getConditions()}
                        pathMethodConditions={this.getPathMethodConditions()}
                        onChange={this.handleConditionsChange} 
                        openApiDefinition={this.state.openApiDefinition}
                        resource={this.state.selectedResource}
                        resourceDefinition={this.getResourceDefinition()}
                        rootParameters={this.getRootParameters()}
                      />
                    </div>
                    <hr className="my-4" />
                    {/* Address */}
                    <h6 className="heading-small text-muted mb-4">
                      Event
                    </h6>
                    {
                      this.props.mode === 'response'
                      ? (
                        <EventResponseBuilder
                          event={this.getEvent()}
                          onChange={this.handleEventChange}
                          resource={this.state.selectedResource}
                          resourceDefinition={this.getResourceDefinition()}
                          rootParameters={this.getRootParameters()}
                          responses={this.getResponses()}
                          callbackRootParameters={this.getCallbackRootParameters()}
                          responseObject={this.getResponseObject()}
                          mode={this.props.mode}
                        />
                      )
                      : (
                        <EventBuilder
                          event={this.getEvent()}
                          onChange={this.handleEventChange}
                          resource={this.state.selectedResource}
                          resourceDefinition={this.getResourceDefinition()}
                          rootParameters={this.getRootParameters()}
                          callbackDefinition={this.getCallbackDefinition()}
                          callbackRootParameters={this.getCallbackRootParameters()}
                          callbackObject={this.getCallbackObject()}
                          mode={this.props.mode}
                        />
                      )
                    }

                    <hr className="my-4" />
                    {/* Description */}
                    <h6 className="heading-small text-muted mb-4">Rule Details</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <label>Rule Description</label>
                        <Input
                          className="form-control-alternative"
                          placeholder="A few words about the rule ..."
                          onChange={(e) => this.handleDescriptionChange(e.target.value)}
                          rows="4"
                          value={this.state.description}
                          type="textarea"
                        />
                      </FormGroup>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
      </>
    );
  }
}

export default RulesEditor;
