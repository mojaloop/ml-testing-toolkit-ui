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

import Header from "components/Headers/Header.jsx";
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
      >
      {this.getResourceOptions()}
      </Select>
      // <DropdownButton onSelect={resourceSelectHandler}
      //   disabled={(this.state.selectedItem? true : false)}
      //   variant="success" id="dropdown-basic"
      //   title={(this.state.selectedItem? this.state.selectedItem.method+' '+this.state.selectedItem.path : 'Select')}
      // >
      //     {this.getResourceOptions()}
      // </DropdownButton>

    )
  }
}

class RulesCallback extends React.Component {

  constructor() {
    super();
    this.state = {
      origJson: [],
      curJson: {},
      rule: {},
      conditions: {},
      event: {},
      openApiDefinition: {},
      selectedResource: null,
      callbackMap: {}
    };
  }

  async componentWillMount() {
    // this.getData()
    await this.getDefinition()
    await this.getCallbackMap()
  }

  getRule = () => {
    const rule = {
      conditions: this.state.conditions,
      event: this.state.event
    }
    return JSON.stringify(rule, null, 2)
  }

  handleConditionsChange = (conditions) => {
    this.setState({conditions});
  };

  handleEventChange = (event) => {
    this.setState({event});
  };

  getData = async () => {
    const response = await axios.get("http://localhost:5050/api/rules/callback")
      this.setState(  { origJson: [ ...response.data ] } )
      // this.refs.editor.jsonEditor.update(this.state.origJson)
  }

  getDefinition = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/definition/1.1")
    // console.log(response.data)
    this.setState(  { openApiDefinition: response.data } )
  }

  getCallbackMap = async () => {
    const response = await axios.get("http://localhost:5050/api/openapi/callback_map/1.1")
    this.setState(  { callbackMap: response.data } )
  }

  // handleChange = (json) => {
  //   // this.setState( { curJson: json } )
  // }
  // handleError = (error) => {
  //   console.log(error)
  // }
  handleSave = () => {
    const newJson = this.refs.editor.jsonEditor.get()
    // this.setState( { curJson: [ ...newJson ]} )
    axios.put("http://localhost:5050/api/rules/callback", newJson, { headers: { 'Content-Type': 'application/json' } })
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
    if (this.state.selectedResource) {
      return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method]
    }
    return null
  }
  getRootParameters = () => {
    var rootParams = []
    if (this.state.selectedResource) {
      rootParams = this.state.openApiDefinition.paths[this.state.selectedResource.path].parameters
    }
    return rootParams
  }
  getCallbackRootParameters = () => {
      try {
        const callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['successCallback']
        return this.state.openApiDefinition.paths[callbackObj.path].parameters
      } catch(err) {
        return []
      }
 
  }

  getCallbackDefinition = () => {
    if (this.state.selectedResource) {
      try {
        const callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['successCallback']
        return this.state.openApiDefinition.paths[callbackObj.path][callbackObj.method]
      } catch(err) {
        return null
      }

    }
    return null
  }


  logrule = (rule) => {
    console.log(rule)
  }

  render() {
    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7"  fluid>
          {/* <Editor
            ref="editor"
            value={ this.state.origJson }
            ace={ace}
            theme="ace/theme/tomorrow_night_blue"
            mode="code"
            search={false}
            statusBar={false}
            navigationBar={false}
            // onChange={this.handleChange}
            // onError={this.handleError}
            
          />
          <Button
            className="mt-2" 
            color="info"
            href="#pablo"
            onClick={this.handleSave}
          >
            Save
          </Button>  */}
        </Container>
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="6">
              <Card className="card-profile shadow">
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
                  <div className="d-flex justify-content-between">
                    <Button
                      className="mr-4"
                      color="info"
                      href="#pablo"
                      onClick={e => e.preventDefault()}
                      size="sm"
                    >
                      Validate
                    </Button>
                    <Button
                      className="float-right"
                      color="default"
                      href="#pablo"
                      onClick={e => e.preventDefault()}
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
            </Col>
            <Col className="order-xl-1" xl="6">
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <Row className="align-items-center">
                    <Col xs="2">
                      <h3 className="mb-0">Rule #1</h3>
                    </Col>
                    <Col xs="8" className="text-center">
                      <ResourceSelector openApiDefinition={this.state.openApiDefinition} onSelect={this.resourceSelectHandler} />
                    </Col>
                    <Col className="text-right" xs="2">
                      <Button
                        color="danger"
                        href="#pablo"
                        onClick={e => e.preventDefault()}
                        size="sm"
                      >
                        Reset
                      </Button>
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
                    <EventBuilder
                      onChange={this.handleEventChange}
                      resource={this.state.selectedResource}
                      resourceDefinition={this.getResourceDefinition()}
                      rootParameters={this.getRootParameters()}
                      callbackDefinition={this.getCallbackDefinition()}
                      callbackRootParameters={this.getCallbackRootParameters()}
                    />
                    <hr className="my-4" />
                    {/* Description */}
                    <h6 className="heading-small text-muted mb-4">Rule Details</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <label>Rule Description</label>
                        <Input
                          className="form-control-alternative"
                          placeholder="A few words about the rule ..."
                          rows="4"
                          defaultValue="This is sample description about this rule"
                          type="textarea"
                        />
                      </FormGroup>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default RulesCallback;
