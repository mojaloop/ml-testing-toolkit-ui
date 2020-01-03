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
  FormGroup,
  Row,
  Button,
  Col,
  CardBody
} from "reactstrap";
// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card, Popover, Checkbox } from 'antd';
import 'antd/dist/antd.css';
// import './index.css';
import { FactDataGenerator, FactSelect } from './BuilderTools.jsx';

import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;

class ConfigurableParameter extends React.Component {

  constructor() {
    super()
    this.state = {
      mode: null,
      factData: null,
    }

    // Set Modes Array
    this.modes[0]='Request Path Parameter'
    this.modes[1]='Request Body Parameter'
    this.modes[2]='Request Header Parameter'
    this.modes[3]='Negotiated Content Type'
  }

  modes = []
  inputValue = null

  getModeMenu = () => {
    return this.modes.map((item, key) => {
      return (
        <Option key={key} value={key}>
          {item}
        </Option>
      )
    })
  }
  
  handleModeChange = async (mode) => {
    var factData = null
    switch(mode) {
      case 0:
        factData = (new FactDataGenerator()).getPathParametersFactData(this.props.rootParameters)
        break
      case 1:
        factData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)
        break
      case 2:
        factData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters)
        break
      default:
        factData = null
    }
    await this.setState( {mode: mode, factData: factData} )
    this.updateChanges()
  }

  getValueComponent = () => {
    switch(this.state.mode) {
      case 0:
      case 1:
      case 2:
        return (
          <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
        )
        break
      case 3:
      default:
        return null
    }
  }

  handleFactTypeSelect = async (value) => {
    try {
      const selectedValueObject = JSON.parse(value)
      await this.setState( {selectedFactType:  selectedValueObject} )
      this.props.condition.fact = selectedValueObject.name
      this.props.onConditionChange()
      this.updateFactData()
    } catch(err) {}
  }

  handleFactSelect = (value, factObject) => {
    this.inputValue = value
    this.updateChanges()
  }

  updateChanges = () => {
    let finalValue = ''
    if (!this.inputValue) {
      this.inputValue = ''
    }
    switch(this.state.mode) {
      case 0:
        finalValue = '{$request.params.' + this.inputValue + '}'
        break
      case 1:
        finalValue = '{$request.body.' + this.inputValue + '}'
        break
      case 2:
        finalValue = '{$request.header.' + this.inputValue + '}'
        break
      case 3:
        finalValue = '{$session.negotiatedContentType}'
        break
      default:
        finalValue = this.inputValue
    }
    

    this.props.onChange(finalValue)
  }

  handleValueChange = (newValue) => {
    this.inputValue = newValue
    this.updateChanges()
  }

  render() {

    return (
      <Row>
        <Col>
          <Select
            placeholder="Please Select"
            style={{ width: 200 }}
            value={this.modes[this.state.mode]}
            onSelect={this.handleModeChange}
          >
            {this.getModeMenu()}
          </Select>
        </Col>
        <Col>
          {this.getValueComponent()}
        </Col>
      </Row>
    )
  }
}

class FixedCallbackBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      headers: [],
      body: {}
    }
  }

  bodySchema = {}

  componentDidMount = () => {
    // console.log(this.props.callbackRootParameters)
    // console.log(this.props.resourceDefinition.parameters)
    // console.log(this.props.callbackDefinition)
    this.bodySchema = (new FactDataGenerator()).getBodyFactData(this.props.callbackDefinition)
  }
  // componentDidUpdate = () => {
  //   console.log(this.props.callbackRootParameters)
  //   // console.log(this.props.resourceDefinition.parameters)
  //   console.log(this.props.callbackDefinition)

  // }


  addHeaderItemsFromDefinition = async (onlyRequired=false) => {
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
    await this.setState({headers: newHeaders})
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

  handleBodyChange = (bodyObject) => {
    // console.log(ace.getCursorPosition())
    this.state.body = bodyObject
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
        <HeaderInputComponent key={key} itemKey={key} name={item.name} value={item.value} rootParameters={this.props.rootParameters} resourceDefinition={this.props.resourceDefinition} onChange={this.handleHeaderItemChange} onDelete={this.handleHeaderItemDelete} />
      )
    })
  }

  handleAddConfigParam = async (newValue) => {
    const newBody = {...this.state.body, '': newValue}
    await this.setState({body: newBody})
    this.refs.bodyEditor.jsonEditor.update(this.state.body)
    this.updateChanges()
  }

  handlePopulateSampleBodyClick = async () => {
    const newBody = (new FactDataGenerator()).getBodySample(this.props.callbackDefinition)
    if(newBody) {
      if(this.props.successCallback && this.props.successCallback.bodyOverride) {
        _.merge(newBody, this.props.successCallback.bodyOverride)
      }
      
      await this.setState({body: newBody})
      this.refs.bodyEditor.jsonEditor.update(this.state.body)
      this.updateChanges()
    }
  }

  render() {

    const content = (
      <ConfigurableParameter
        onChange={this.handleAddConfigParam}
        rootParameters={this.props.rootParameters}
        resourceDefinition={this.props.resourceDefinition}
      />
    )

    return (
      <>
        <Row>
          <Col>
            <Card size="small" title="Headers">
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
        <Row className='mt-2'>
          <Col>
            <Card size="small" title="Body">
              <Row className='mb-2'>
                <Col lg="6">
                  <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                    <Button color="secondary" size="sm">Add Configurable Params</Button>
                  </Popover>
                </Col>
                <Col lg="6" style={{textAlign: 'right'}}>
                  <Button color="success" size="sm" onClick={this.handlePopulateSampleBodyClick} >Populate with sample body</Button>
                </Col>
              </Row>
              <Row >
                <Col lg="12">
                  <Editor
                    ref="bodyEditor"
                    value={ this.state.body }
                    ace={ace}
                    ajv={ajv}
                    theme="ace/theme/tomorrow_night_blue"
                    mode="code"
                    search={false}
                    statusBar={false}
                    navigationBar={false}
                    onChange={this.handleBodyChange}
                    schema={this.bodySchema}
                    // onError={this.handleError}
                  />
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
  inputValue = null

  componentDidMount = () => {
    this.inputValue = this.props.value
  }

  componentDidUpdate = () => {
    this.inputValue = this.props.value
  }

  handleNameChange = (event) => {
    // this.setState({name: event.target.value})
    this.props.onChange(this.props.itemKey, event.target.value, this.props.value)
  }
  handleAddConfigParam = (newValue) => {
    this.inputValue = newValue
    // this.setState({value: event.target.value})
    this.props.onChange(this.props.itemKey, this.props.name, this.inputValue)
  }
  handleValueChange = (event) => {
    this.inputValue = event.target.value
    // console.log(event.target.value)
    // this.setState({value: event.target.value})
    this.props.onChange(this.props.itemKey, this.props.name, this.inputValue)
  }

  handleDelete = () => {
    this.props.onDelete(this.props.itemKey)
  }

  
  render() {

    const content = (
      <ConfigurableParameter
        name={this.props.name}
        value={this.props.value}
        onChange={this.handleAddConfigParam}
        rootParameters={this.props.rootParameters}
        resourceDefinition={this.props.resourceDefinition}
      />
    )

    
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
        
        <Col lg="6">
          <Input
            className="form-control-alternative"
            placeholder="Name"
            type="text"
            defaultValue={this.props.value}
            value={this.props.value}
            onChange={this.handleValueChange}
            disabled={false}
          />
          <Popover content={content} title="Select a Configurable Parameter" trigger="click">
            <Button color="secondary" size="sm">Add Configurable Params</Button>
          </Popover>

        </Col>
        <Col lg="2">
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

  constructor() {
    super()
    this.state = {
      overrideChecked: false
    }
  }

  handleOverrideChecked = (event) => {
    this.setState({overrideChecked: event.target.checked})
    if (!event.target.checked) {
      this.handleOverrideValuesChange(null)
    }
  }

  handleOverrideValuesChange = (paramsObject) => {
    // const paramsObject = {}
    // paramsObject.header = this.getHeaderObject()
    // paramsObject.body = this.state.body
  
    this.props.onChange(paramsObject)
  }

  render () {
    return (
      <>
      <Row>
        <Col>
          <Checkbox checked={this.state.overrideChecked} onChange={this.handleOverrideChecked}>Override some parameters</Checkbox>
        </Col>
      </Row>
      { this.state.overrideChecked?
            <Row className='mt-3'>
            <Col>
              <FixedCallbackBuilder onChange={this.handleOverrideValuesChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
                callbackDefinition={this.props.callbackDefinition}
                callbackRootParameters={this.props.callbackRootParameters}
                successCallback={this.props.successCallback}
              />
            </Col>
          </Row>
        : null
      }

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
          rootParameters = {this.props.rootParameters}
          callbackDefinition={this.props.callbackDefinition}
          callbackRootParameters={this.props.callbackRootParameters}
          successCallback={this.props.successCallback}
        />
      )
    }
    else if (this.props.eventType === 'MOCK_CALLBACK') {
      return (
        <MockCallbackBuilder onChange={this.props.onChange}
          resourceDefinition={this.props.resourceDefinition}
          rootParameters = {this.props.rootParameters}
          callbackDefinition={this.props.callbackDefinition}
          callbackRootParameters={this.props.callbackRootParameters}
          successCallback={this.props.successCallback}
        />
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

  componentDidMount = () => {
    console.log(this.props)
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
    if (newParams) {
      this.state.eventData.params = newParams
    } else {
      delete this.state.eventData.params
    }
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
                <Select onChange={this.handleEventTypeSelect} disabled={(this.props.resource? false : true)}>
                  {this.getEventTypes()}
                </Select>
              </FormGroup>
            </Col>
          </Row>
          <ParamsBuilder eventType={this.state.selectedEventType} onChange={this.handleParamsChange}
            resourceDefinition={this.props.resourceDefinition}
            rootParameters = {this.props.rootParameters}
            callbackDefinition={this.props.callbackDefinition}
            callbackRootParameters={this.props.callbackRootParameters}
            successCallback={this.props.successCallback}
          />
        </div>
      </>
    );
  }
}

export default EventBuilder;
