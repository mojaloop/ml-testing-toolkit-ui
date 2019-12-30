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
  FormGroup,
  Row,
  Button,
  Col
} from "reactstrap";
// core components
import axios from 'axios';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio } from 'antd';
import 'antd/dist/antd.css';
// import './index.css';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;

class AssistedCallbackBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      headers: [],
      body: null
    }
  }

  componentDidMount = () => {
    console.log(this.props.callbackRootParameters)
  }
  componentDidUpdate = () => {
    console.log(this.props.callbackRootParameters)
  }

  addHeaderItem = () => {
    this.state.headers.push({})
  }
  handleHeaderItemChange = (key, name, value) => {
    // this.state.headers[event]
    this.state.headers[key] = {name, value}
    this.updateChanges()
  }

  handleBodyChange = (event) => {
    this.state.body = event.target.value
    this.updateChanges()
  }

  updateChanges = () => {
    const paramsObject = {}
    paramsObject.header = this.getHeaderObject()
    paramsObject.body = this.state.body
    this.props.onChange(paramsObject)
  }

  getHeaderObject = () => {
    let headerObject = {}
    for( let key in this.state.headers ) {
      headerObject[this.state.headers[key].name] = this.state.headers[key].value
    }
    return headerObject
  }

  getHeaderItems = () => {
    return this.state.headers.map((item, key) => {
      return (
        <HeaderInputComponent itemKey={key} onChange={this.handleHeaderItemChange} />
      )
    })
  }

  render() {
    return (
      <>
        <Row>
          <Col lg="12">
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-city"
              >
                Headers
              </label>
              <Row>
                <Col lg="6">
                  <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                    Name
                  </label>
                </Col>
                <Col lg="6">
                  <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                    Value
                  </label>
                </Col>
              </Row>
              { this.getHeaderItems() }
            </FormGroup>
            <Button
              color="primary"
              href="#pablo"
              onClick={() => this.addHeaderItem()}
              size="sm"
            >
              Add Header
            </Button>
          </Col>
        </Row>
        <Row >
          <Col lg="12">
            <FormGroup>
              <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                Callback Body
              </label>
              
              <Input.TextArea
                className="form-control-alternative"
                placeholder="Callback Body"
                defaultValue="{}"
                onChange={this.handleBodyChange}
                rows="8"
              />
            </FormGroup>
          </Col>
        </Row>  
      </>
    )
  }
}


class HeaderInputComponent extends React.Component {

  constructor() {
    super()
    this.state = {
      name: '',
      value: ''
    }
  }
  handleNameChange = (event) => {
    this.setState({name: event.target.value})
    this.props.onChange(this.props.itemKey, event.target.value, this.state.value)
  }
  handleValueChange = (event) => {
    this.setState({value: event.target.value})
    this.props.onChange(this.props.itemKey, this.state.name, event.target.value)
  }

  
  render() {
    return (
      <>
      <Row>
        <Col lg="6">
          <Input
            className="form-control-alternative"
            defaultValue=""
            placeholder="Name"
            type="text"
            onChange={this.handleNameChange}
          />
        </Col>
        
        <Col lg="6">
          <Input
            className="form-control-alternative"
            defaultValue=""
            placeholder="Value"
            type="text"
            onChange={this.handleValueChange}
          />
        </Col>
      </Row>
      </>
    )
  }
}

class ManualCallbackBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      headers: [],
      body: null
    }
  }

  addHeaderItem = () => {
    this.state.headers.push({})
  }
  handleHeaderItemChange = (key, name, value) => {
    // this.state.headers[event]
    this.state.headers[key] = {name, value}
    this.updateChanges()
  }

  handleBodyChange = (event) => {
    this.state.body = event.target.value
    this.updateChanges()
  }

  updateChanges = () => {
    const paramsObject = {}
    paramsObject.header = this.getHeaderObject()
    paramsObject.body = this.state.body
    this.props.onChange(paramsObject)
  }

  getHeaderObject = () => {
    let headerObject = {}
    for( let key in this.state.headers ) {
      headerObject[this.state.headers[key].name] = this.state.headers[key].value
    }
    return headerObject
  }

  getHeaderItems = () => {
    return this.state.headers.map((item, key) => {
      return (
        <HeaderInputComponent itemKey={key} onChange={this.handleHeaderItemChange} />
      )
    })
  }

  render() {
    return (
      <>
        <Row>
          <Col lg="12">
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-city"
              >
                Headers
              </label>
              <Row>
                <Col lg="6">
                  <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                    Name
                  </label>
                </Col>
                <Col lg="6">
                  <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                    Value
                  </label>
                </Col>
              </Row>
              { this.getHeaderItems() }
            </FormGroup>
            <Button
              color="primary"
              href="#pablo"
              onClick={() => this.addHeaderItem()}
              size="sm"
            >
              Add Header
            </Button>
          </Col>
        </Row>
        <Row >
          <Col lg="12">
            <FormGroup>
              <label
                    className="form-control-label"
                    htmlFor="input-city"
                  >
                Callback Body
              </label>
              
              <Input.TextArea
                className="form-control-alternative"
                placeholder="Callback Body"
                defaultValue="{}"
                onChange={this.handleBodyChange}
                rows="8"
              />
            </FormGroup>
          </Col>
        </Row>  
      </>
    )
  }
}

class FixedCallbackBuilder extends React.Component {

  constructor() {
    super()
    this.state = {
      bodyJson: {},
      mode: 2
    }
  }

  onModeChange = (event) => {
    this.setState( {mode: event.target.value} )
  }



  render () {
    return (
      <>
        <Row>
          <Col lg="12"> 
            <FormGroup>
              <Radio.Group onChange={this.onModeChange} value={this.state.mode}>
                <Radio value={1}>Assisted</Radio>
                <Radio value={2}>Manual</Radio>
              </Radio.Group>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col lg="12">  
            {
              this.state.mode === 1
              ? <AssistedCallbackBuilder onChange={this.props.onChange} resourceDefinition={this.props.resourceDefinition} callbackDefinition={this.props.callbackDefinition} callbackRootParameters={this.props.callbackRootParameters} />
              : <ManualCallbackBuilder onChange={this.props.onChange} />
            }
          </Col>
        </Row>
      </>
    )
  }
}

class MockCallbackBuilder extends React.Component {

  render () {
    return (
      <>
    
        <FormGroup>
          <label>About Me</label>
          <Input.TextArea
            className="form-control-alternative"
            placeholder="A few words about you ..."
            rows="4"
            defaultValue="A beautiful Dashboard for Bootstrap 4. It is Free and
            Open Source."
            type="textarea"
          />
        </FormGroup>
      </>
    )
  }
}

class ParamsBuilder extends React.Component {
  
  render() {
    if (this.props.eventType === 'FIXED_CALLBACK') {
      return (
        <FixedCallbackBuilder onChange={this.props.onChange}
          resourceDefinition={this.props.resourceDefinition}
          callbackDefinition={this.props.callbackDefinition}
          callbackRootParameters={this.props.callbackRootParameters}
        />
      )
    }
    else if (this.props.eventType === 'MOCK_CALLBACK') {
      return (
        <MockCallbackBuilder />
      )
    } else {
      return null
    }
  }
}

class EventBuilder extends React.Component {

  constructor() {
    super();
    this.state = {
      selectedEventType: null,
      eventData: {},
      selectedResource: null
    };
  }

  eventTypes = [
    {
      name: 'FIXED_CALLBACK',
      title: 'Fixed Callback'
    },
    {
      name: 'MOCK_CALLBACK',
      title: 'Mock Callback'
    }
  ]

  handleEventTypeSelect = (eventType) => {
    this.setState({selectedEventType: eventType})
    this.state.eventData.type = eventType
    this.handleEventChange()
  }

  handleEventChange = () => {
    this.props.onChange(this.state.eventData)
  }

  getEventTypes = () => {
    return this.eventTypes.map(item => {
      return (
        <Option key={item.name} value={item.name}>{item.title}</Option>
      )
    })
  }

  handleParamsChange = (newParams) => {
    this.state.eventData.params = newParams
    this.handleEventChange()
  }

  render() {

    return (
      <>
        <div className="pl-lg-4">
          <Row>
            <Col md="12">
              <FormGroup>
                <label
                  className="form-control-label"
                  htmlFor="input-address"
                >
                  Event Type
                </label>
                <Select onChange={this.handleEventTypeSelect}>
                  {this.getEventTypes()}
                </Select>
              </FormGroup>
            </Col>
          </Row>
          <ParamsBuilder eventType={this.state.selectedEventType} onChange={this.handleParamsChange}
            resourceDefinition={this.props.resourceDefinition}
            callbackDefinition={this.props.callbackDefinition}
            callbackRootParameters={this.props.callbackRootParameters}
          />
        </div>
      </>
    );
  }
}

export default EventBuilder;
