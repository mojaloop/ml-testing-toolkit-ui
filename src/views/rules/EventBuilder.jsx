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
  Col,
  CardBody
} from "reactstrap";
// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card } from 'antd';
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

class FixedCallbackBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      headers: [],
      body: null
    }
  }


  // componentDidMount = () => {
  //   console.log(this.props.callbackRootParameters)
  //   console.log(this.props.resourceDefinition.parameters)

  // }
  // componentDidUpdate = () => {
  //   console.log(this.props.callbackRootParameters)
  //   console.log(this.props.resourceDefinition.parameters)

  // }


  addHeaderItemsFromDefinition = (onlyRequired=false) => {
    const allParamsFromDefinition = this.props.callbackRootParameters.concat(this.props.resourceDefinition.parameters)
    let newHeaders = [...this.state.headers]
    allParamsFromDefinition.forEach((param) => {
      if (param.in==='header') {
        if (!onlyRequired || param.required) {
          const itemFound = newHeaders.find(item => {
            return item.name===param.name
          })
          if (!itemFound) {
            newHeaders.push({name: param.name, value: ''})
          }
        }
      }
    })
    this.setState({headers: newHeaders})
    this.updateChanges()
  }

  addHeaderItem = (itemName) => {
    const newHeaders = [...this.state.headers]
    newHeaders.push({ name: itemName })
    this.setState({headers: newHeaders})
  }
  handleHeaderItemChange = (key, name, value) => {
    // this.state.headers[event]
    this.state.headers[key] = {name, value}
    this.updateChanges()
  }
  handleHeaderItemDelete = async (key) => {
    // this.state.headers[event]
    const newHeaders = [...this.state.headers]
    newHeaders.splice(key,1)
    await this.setState({headers: newHeaders})
    this.updateChanges()
  }

  handleBodyChange = (event) => {
    this.state.body = event.target.value
    this.updateChanges()
  }

  handleAddHeaderClick = (event) => {
    this.addHeaderItem(event.item.props.children);
  };

  headerItemsMenu = () => {
    const allParamsFromDefinition = this.props.callbackRootParameters.concat(this.props.resourceDefinition.parameters)
    const menuItems = allParamsFromDefinition.map((item, key) => {
      return (
        <Menu.Item key={key}>{item.name}</Menu.Item>
      )
    })
    return (
      <Menu onClick={this.handleAddHeaderClick}>
        {menuItems}
      </Menu>
    )
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
        <HeaderInputComponent key={key} itemKey={key} name={item.name} value={item.value} onChange={this.handleHeaderItemChange} onDelete={this.handleHeaderItemDelete} />
      )
    })
  }

  render() {
    return (
      <>
        <Row>
          <Col>
            <Card title="Headers">
              <Row>
                <Col lg="12">
                  <FormGroup>
                    <Row>
                      <Col lg="4">
                        <label
                          className="form-control-label"
                          htmlFor="input-city"
                        >
                          Name
                        </label>
                      </Col>
                      <Col lg="4">
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
                  <Dropdown overlay={this.headerItemsMenu()}>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={e => e.preventDefault()}
                    >
                      Add Header
                    </Button>

                  </Dropdown>
                  <Button
                    color="danger"
                    onClick={() => this.addHeaderItemsFromDefinition(true)}
                    size="sm"
                  >
                    Add Required Headers
                  </Button>
                  <Button
                    color="info"
                    onClick={() => this.addHeaderItemsFromDefinition(false)}
                    size="sm"
                  >
                    Add All Headers
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card title="Body">
              <Row >
                <Col lg="12">
                  <FormGroup>
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
            </Card>
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
    // this.setState({name: event.target.value})
    this.props.onChange(this.props.itemKey, event.target.value, this.props.value)
  }
  handleValueChange = (event) => {
    // this.setState({value: event.target.value})
    this.props.onChange(this.props.itemKey, this.props.name, event.target.value)
  }

  handleDelete = () => {
    this.props.onDelete(this.props.itemKey)
  }

  
  render() {
    return (
      <>
      <Row>
        <Col lg="4">
          <Input
            className="form-control-alternative"
            placeholder="Name"
            type="text"
            defaultValue={this.props.name}
            value={this.props.name}
            onChange={this.handleNameChange}
            disabled={false}
          />
        </Col>
        
        <Col lg="4">
          <Input
            className="form-control-alternative"
            placeholder="Value"
            type="text"
            defaultValue={this.props.value}
            value={this.props.value}
            onChange={this.handleValueChange}
          />
        </Col>
        <Col lg="4">
          <Button
            color="danger"
            key={this.props.name}
            onClick={this.handleDelete}
            size="sm"
          >
            Delete
          </Button>
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
