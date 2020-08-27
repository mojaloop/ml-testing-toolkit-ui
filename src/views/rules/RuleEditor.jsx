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
import { Dropdown, DropdownButton, Tab } from 'react-bootstrap';

import { Select, message, Tabs, Collapse, Checkbox, Tag, Popover, Descriptions} from 'antd';

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
import getConfig from '../../utils/getConfig'
import AceEditor from "react-ace";
import { FactSelect } from './BuilderTools.jsx';

const { Option } = Select;

export class ConfigurableParameter extends React.Component {

  constructor() {
    super()
    this.state = {
      paramType: null,
      factData: null,
      selectedValueComponent: null
    }

    // Set paramTypes Array
    this.paramTypes[0]='Environment'
  }

  paramTypes = []
  inputValue = null

  getParamTypeMenu = () => {
    return this.paramTypes.map((item, key) => {
      return (
        <Option key={key} value={key}>
          {item}
        </Option>
      )
    })
  }

  handleParamTypeChange = async (paramType) => {
    this.setState( {paramType: paramType, factData: null, selectedValueComponent: null} )
  }

  getValueComponent = () => {
    switch(this.state.paramType) {
      case 0:
        let inputOptionItems = []
        for (let item in this.props.environment) {
          inputOptionItems.push(
            <Option key={item} value={item}>{item}</Option>
          )
        }
        return (
          <>
          <Select
            placeholder="Please Select"
            style={{ width: 200 }}
            value={this.state.selectedValueComponent}
            onChange={(value) => {
              this.state.selectedValueComponent = value
              this.handleParamSelect(value)
            }}
          >
            {inputOptionItems}
          </Select>
          </>
        )
        break
      default:
        return null
    }
  }
  handleParamSelect = (paramValue) => {
    this.props.onChange(paramValue)
  }

  getRequestFactComponent = () => {
    if (this.state.factData) {
      return (
        <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
      )
    } else {
      return null
    }

  }

  render() {

    return (
      <Row>
        <Col>
          <Select
            placeholder="Please Select"
            style={{ width: 200 }}
            value={this.paramTypes[this.state.paramType]}
            onSelect={this.handleParamTypeChange}
          >
            {this.getParamTypeMenu()}
          </Select>
        </Col>
        <Col>
          {this.getValueComponent()}
        </Col>
        <Col>
          {this.getRequestFactComponent()}
        </Col>
      </Row>
    )
  }
}
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
              if(this.props.mode === 'response') {
                this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>)
              } else {
                // if (pathKey === '/parties/{Type}/{ID}' || pathKey === '/quotes' || pathKey === '/transfers') {
                if (this.props.callbackMap[pathKey]) {
                  this.resourceOptions.push(<Option key={itemKey} value={itemKey}>{methodKey} {pathKey}</Option>)                
                }
              }
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
    let apiVersionsFiltered
    if (this.props.mode !== 'response') {
      apiVersionsFiltered = this.props.apiVersions.filter(item => item.asynchronous)
    } else {
      apiVersionsFiltered = this.props.apiVersions
    }
    this.apiVersionOptions = apiVersionsFiltered.map((item, index) => {
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
      event: {
        params: {}
      },
      scripts: null,
      conditions: [],
      pathMethodConditions: [],
      apiVersions: [],
      openApiDefinition: null,
      selectedResource: null,
      selectedApiVersion: null,
      callbackMap: {},
      responseMap: {},
      showConfigurableParameterDialog: false,
      configurableParameterSelected: '',
      environment: {}
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
    let scripts
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
      params: {
        scripts: {}
      }
    }
    if (inputRule.event) {
      event = inputRule.event
      if (event.params && event.params.scripts) {
        scripts = event.params.scripts.exec
      }
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

    let environment
    try {
      environment = await this.getEnvironment()
    } catch (err) {}

    this.setState({description, conditions, pathMethodConditions, event, selectedResource, apiVersions, selectedApiVersion, scripts, environment })
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
      event: {...this.state.event}
    }
    rule.event.params.scripts = {
      exec: (this.state.scripts && this.state.scripts.length === 1 && this.state.scripts[0].trim() === '') ? undefined : this.state.scripts
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
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/openapi/api_versions")
    return response.data
  }

  getDefinition = async (apiType, version) => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(`${apiBaseUrl}/api/openapi/definition/${apiType}/${version}`)
    // console.log(response.data)
    return response.data
    // this.setState(  { openApiDefinition: response.data } )
  }

  getResponseMap = async (apiType, version) => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(`${apiBaseUrl}/api/openapi/response_map/${apiType}/${version}`)
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  getCallbackMap = async (apiType, version) => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(`${apiBaseUrl}/api/openapi/callback_map/${apiType}/${version}`)
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  getEnvironment = async () => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(`${apiBaseUrl}/api/objectstore/inboundEnvironment`)
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  clearEnvironment = async () => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.delete(`${apiBaseUrl}/api/objectstore/inboundEnvironment`)
    this.setState({environment: {}})
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  handleSave = () => {
    // const newJson = this.refs.editor.jsonEditor.get()
    // // this.setState( { curJson: [ ...newJson ]} )
    const rule = JSON.parse(this.getRule())
    if (!rule.event.type) {
      message.error(({ content: 'rule event type is required', key: 'ruleSaveProgress', duration: 4 }));
      return;
    }
    this.props.onSave(rule)
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

  handleAddConfigParam = (newValue) => {
    this.setState({configurableParameterSelected: `pm.environment.get('${newValue}')`})
  }

  handleConfigParamCopyToClipboard = () => {
    navigator.clipboard.writeText(this.state.configurableParameterSelected)
    message.success('Copied to clipboard')
  }

  getEnvironmentStateDescriptions = () => {
    return Object.keys(this.state.environment).map((key, index) => {
      return (
        <Descriptions.Item key={index} label={key}>
          <pre>{JSON.stringify(this.state.environment[key], null, 2)}</pre>
        </Descriptions.Item>
      )
    })
  }

  render() {
    const content = (
      <>
      <Row>
        <Col>
        <ConfigurableParameter
          onChange={this.handleAddConfigParam}
          environment={this.state.environment}
        />
        </Col>
      </Row>
      {
        this.state.configurableParameterSelected ?
        (
          <Row className="mt-4 text-center">
            <Col>
              Click below to copy <br/>
              <Tag color="geekblue"><a onClick={this.handleConfigParamCopyToClipboard}>{this.state.configurableParameterSelected}</a></Tag>
            </Col>
          </Row>
        )
        : null
      }
      </>
    )
    return (
      <>
          <Row>
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
                            <ApiVersionSelector value={this.state.selectedApiVersion} apiVersions={this.state.apiVersions} mode={this.props.mode} onSelect={this.apiVersionSelectHandler} />
                          </td>
                        </tr>
                        <tr>
                          <td align='right'><b>Resource:</b></td>
                          <td>
                            <ResourceSelector value={this.state.selectedResource} openApiDefinition={this.state.openApiDefinition} mode={this.props.mode} callbackMap={this.state.callbackMap} onSelect={this.resourceSelectHandler} />
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
                    <Tabs defaultActiveKey='rules'>
                      <Tabs.TabPane tab="Rules" key="rules">
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
                            environment={this.state.environment}
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
                      </Tabs.TabPane>
                      <Tabs.TabPane tab="Scripts" key="scripts">
                        <div className="pl-lg-4">
                          <AceEditor
                            ref="preReqScriptAceEditor"
                            mode="javascript"
                            theme="eclipse"
                            width='100%'
                            value={ this.state.scripts ? this.state.scripts.join('\n') : '' }
                            onChange={ (newScript) => {
                              this.state.scripts = newScript.split('\n')
                            }}
                            name="UNIQUE_ID_OF_DIV"
                            wrapEnabled={true}
                            showPrintMargin={true}
                            showGutter={true}
                            tabSize={2}
                            enableBasicAutocompletion={true}
                            enableLiveAutocompletion={true}
                          />
                          <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                            <Button color="secondary" size="sm">Add Configurable Params</Button>
                          </Popover>
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane tab="Environment" disabled={Object.keys(this.state.environment).length === 0} key={Object.keys(this.state.environment).length === 0 ? undefined : "environment"} >
                        <Descriptions bordered column={1} size='small'>
                          {this.getEnvironmentStateDescriptions()}
                        </Descriptions>
                        <br/>
                        <Button color="danger" size="sm" onClick={() => {
                          this.clearEnvironment()
                          this.handleConditionsChange()
                        }}>Clear environment</Button>
                      </Tabs.TabPane>
                    </Tabs>
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
