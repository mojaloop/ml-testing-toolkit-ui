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
      openApiDefinition: {},
      selectedResource: null,
      callbackMap: {}
    };
  }

  componentDidMount = async () => {
    const openApiDefinition = await this.getDefinition()
    let callbackMap = {}
    try {
      callbackMap = await this.getCallbackMap()
    } catch(err) {}
    
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
    this.setState({description, conditions, pathMethodConditions, event, selectedResource, openApiDefinition, callbackMap})
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
      description: this.state.description,
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

  getDefinition = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/definition/1.0")
    // console.log(response.data)
    return response.data
    // this.setState(  { openApiDefinition: response.data } )
  }

  getCallbackMap = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/callback_map/1.0")
    return response.data
    // this.setState(  { callbackMap: response.data } )
  }

  handleSave = () => {
    // const newJson = this.refs.editor.jsonEditor.get()
    // // this.setState( { curJson: [ ...newJson ]} )
    // axios.put("http://localhost:5050/api/rules/callback", newJson, { headers: { 'Content-Type': 'application/json' } })
    this.props.onSave(JSON.parse(this.getRule()))
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
                      this.props.mode === 'resonse'
                      ? (
                        <EventResponseBuilder
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
