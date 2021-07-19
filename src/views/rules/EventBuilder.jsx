/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";
import _ from 'lodash';
import axios from 'axios';
import { Select, Row, Col, Button, Input, Tooltip, Tag, Menu, Dropdown, Card, Popover, Checkbox, message, Typography } from 'antd';
import 'antd/dist/antd.css';
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
const { Text } = Typography;

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
        finalValue = '{$request.headers.' + this.inputValue.toLowerCase() + '}'
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
      configurableParameterSelected: '',
      allParamsFromDefinition: [],
      allParamsObject: {}
    }
  }

  bodySchema = {}

  componentDidMount = () => {
    // console.log(this.props.callbackRootParameters)
    // console.log(this.props.resourceDefinition.parameters)
    // console.log(this.props.callbackDefinition)
    this.bodySchema = (new FactDataGenerator()).getBodyFactData(this.props.callbackDefinition)


    let allParamsFromDefinition = []
    if (this.props.callbackRootParameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.callbackRootParameters)
    }
    if (this.props.callbackDefinition.parameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.callbackDefinition.parameters)
    }

    let allParamsObject = {}
    for (let k in allParamsFromDefinition) {
      allParamsObject[allParamsFromDefinition[k].name] = {
        description: allParamsFromDefinition[k].description
      }
    }
    this.setState({allParamsFromDefinition, allParamsObject})

  }
  // componentDidUpdate = () => {
  //   // console.log(this.props.callbackRootParameters)
  //   // console.log(this.props.resourceDefinition.parameters)
  //   // console.log(this.props.callbackDefinition)



  // }


  addHeaderItemsFromDefinition = async (onlyRequired=false) => {
    this.state.allParamsFromDefinition.forEach((param) => {
      if (param.in==='header') {
        if (!onlyRequired || param.required) {
          if (!this.props.eventParams.headers) {
            this.props.eventParams.headers = {}
            this.props.eventParams.headers[param.name] = ''
          }
          else if (!this.props.eventParams.headers[param.name]) {
            this.props.eventParams.headers[param.name] = ''
          }
        }
      }
    })
    this.updateChanges()
  }

  addHeaderItem = (itemName) => {
    if (!this.props.eventParams.headers) {
      this.props.eventParams.headers = {}
    }
    this.props.eventParams.headers[itemName] = this.props.eventParams.headers[itemName] ? this.props.eventParams.headers[itemName] : ""
    this.updateChanges()
  }
  handleHeaderItemChange = (key, name, value) => {
    this.props.eventParams.headers[name] = value
    this.updateChanges()
  }
  handleHeaderItemDelete = async (name) => {
    delete this.props.eventParams.headers[name]
    this.updateChanges()
  }

  handleBodyChange = (bodyObject) => {
    // console.log(ace.getCursorPosition())
    this.props.eventParams.body = bodyObject
    this.updateChanges()
  }

  handleAddHeaderClick = (event) => {
    this.addHeaderItem(event.item.props.children);
  };

  headerItemsMenu = () => {
    const headerParams = this.state.allParamsFromDefinition.filter(item => {
      return item.in === 'header'
    })
    const menuItems = headerParams.map((item, key) => {
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
    paramsObject.headers = this.props.eventParams.headers
    paramsObject.body = this.props.eventParams.body
    this.props.onChange(paramsObject)
  }

  getHeaderItems = () => {
    let headerItems = []
    let k=0
    if (this.props.eventParams) {
      for( let headerName in this.props.eventParams.headers ) {
        const item = {
          name: headerName,
          value: this.props.eventParams.headers[headerName]
        }
        const key = k++
        headerItems.push(
          <HeaderInputComponent key={key} itemKey={item.name} name={item.name} value={item.value} description={this.state.allParamsObject[item.name]? this.state.allParamsObject[item.name].description: null} rootParameters={this.props.rootParameters} resourceDefinition={this.props.resourceDefinition} onChange={this.handleHeaderItemChange} onDelete={this.handleHeaderItemDelete} />
        )
      }
    }
    return headerItems

  }

  handleAddConfigParam = (newValue) => {
    this.setState({configurableParameterSelected: newValue})
  }


  handlePopulateSampleBodyClick = async () => {
    const newBody = (new FactDataGenerator()).getBodySample(this.props.callbackDefinition)
    if(newBody) {
      if(this.props.callbackObject && this.props.callbackObject.bodyOverride) {
        _.merge(newBody, this.props.callbackObject.bodyOverride)
      }
      this.props.eventParams.body = newBody
      this.refs.bodyEditor.jsonEditor.update(this.props.eventParams.body)
      this.updateChanges()
    }
  }

  handleConfigParamCopyToClipboard = () => {
    navigator.clipboard.writeText(this.state.configurableParameterSelected)
    message.success('Copied to clipboard');
  }

  render() {

    const content = (
      <>
      <Row>
        <Col>
          <ConfigurableParameter
            onChange={this.handleAddConfigParam}
            rootParameters={this.props.rootParameters}
            resourceDefinition={this.props.resourceDefinition}
          />
        </Col>
      </Row>
      {
        this.state.configurableParameterSelected ?
        (
          <Row className="mt-4 text-center">
            <Col>
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
          <Col span={24}>
            <Card size="small" title="Headers">
              <Row>
                <Col span={24}>
                    <Row>
                      <Col span={8}>
                        <label
                          className="form-control-label"
                          htmlFor="input-city"
                        >
                          Name
                        </label>
                      </Col>
                      <Col span={8}>
                        <label
                          className="form-control-label"
                          htmlFor="input-city"
                        >
                          Value
                        </label>
                      </Col>
                    </Row>
                    { this.getHeaderItems() }
                    <Row className="mt-2">
                      <Col span={24}>
                        <Dropdown overlay={this.headerItemsMenu()}>
                          <Button
                            type="primary"
                            onClick={e => e.preventDefault()}
                          >
                            Add Header
                          </Button>

                        </Dropdown>
                        <Button
                          className="ml-2"
                          type="default"
                          danger
                          onClick={() => this.addHeaderItemsFromDefinition(true)}
                        >
                          Add Required Headers
                        </Button>
                        <Button
                          className="ml-2"
                          type="default"
                          onClick={() => this.addHeaderItemsFromDefinition(false)}
                        >
                          Add All Headers
                        </Button>
                      </Col>
                    </Row>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row className='mt-2'>
          <Col span={24}>
            <Card size="small" title="Body">
              <Row className='mb-2'>
                <Col span={24}>
                  <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                    <Button type="dashed">Add Configurable Params</Button>
                  </Popover>
                  <Button className="ml-2" type="default" onClick={this.handlePopulateSampleBodyClick} >Populate with sample body</Button>
                </Col>
              </Row>
              <Row >
                <Col span={24}>
                  <Editor
                    ref="bodyEditor"
                    value={ this.props.eventParams.body? this.props.eventParams.body : {} }
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
        <Col span={8}>
          <Tooltip placement="topLeft" title={this.props.description}>
            <Input
              placeholder="Name"
              type="text"
              defaultValue={this.props.name}
              value={this.props.name}
              onChange={this.handleNameChange}
              disabled={false}
            />
          </Tooltip>
        </Col>

        <Col span={12} className="pl-2">
          <Input
            placeholder="Name"
            type="text"
            defaultValue={this.props.value}
            value={this.props.value}
            onChange={this.handleValueChange}
            disabled={false}
          />
          <Popover className="mt-1" content={content} title="Select a Configurable Parameter" trigger="click">
            <Button type="dashed">Add Configurable Params</Button>
          </Popover>

        </Col>
        <Col span={4} className="pl-2">
          <Button
            type="primary"
            danger
            key={this.props.name}
            onClick={this.handleDelete}
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

  componentDidMount = () => {
    if (this.props.eventParams) {
      if (this.props.eventParams.headers || this.props.eventParams.body) {
        this.setState({overrideChecked: true})
      }
    }

  }

  handleOverrideChecked = (event) => {
    this.setState({overrideChecked: event.target.checked})
    if (!event.target.checked) {
      this.handleOverrideValuesChange({})
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
        <Col span={24}>
          <Checkbox checked={this.state.overrideChecked} onChange={this.handleOverrideChecked}>Override some parameters</Checkbox>
        </Col>
      </Row>
      { this.state.overrideChecked?
            <Row className='mt-3'>
            <Col span={24}>
              <FixedCallbackBuilder
                eventParams={this.props.eventParams}
                onChange={this.handleOverrideValuesChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
                callbackDefinition={this.props.callbackDefinition}
                callbackRootParameters={this.props.callbackRootParameters}
                callbackObject={this.props.callbackObject}
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
    if (this.props.eventType === 'FIXED_CALLBACK' || this.props.eventType === 'FIXED_ERROR_CALLBACK') {
      return (
        <FixedCallbackBuilder
          eventParams={this.props.eventParams}
          onChange={this.props.onChange}
          resourceDefinition={this.props.resourceDefinition}
          rootParameters = {this.props.rootParameters}
          callbackDefinition={this.props.callbackDefinition}
          callbackRootParameters={this.props.callbackRootParameters}
          callbackObject={this.props.callbackObject}
        />
      )
    }
    else if (this.props.eventType === 'MOCK_CALLBACK' || this.props.eventType === 'MOCK_ERROR_CALLBACK') {
      return (
        <MockCallbackBuilder
          eventParams={this.props.eventParams}
          onChange={this.props.onChange}
          resourceDefinition={this.props.resourceDefinition}
          rootParameters = {this.props.rootParameters}
          callbackDefinition={this.props.callbackDefinition}
          callbackRootParameters={this.props.callbackRootParameters}
          callbackObject={this.props.callbackObject}
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
      selectedResource: null
    };
  }

  // componentDidMount = () => {
  //   console.log(this.props)
  // }

  // componentDidUpdate = () => {
  //   console.log(this.props.event)
  // }

  successEventTypes = [
    {
      name: 'FIXED_CALLBACK',
      title: 'Fixed Callback'
    },
    {
      name: 'MOCK_CALLBACK',
      title: 'Mock Callback'
    }
  ]

  errorEventTypes = [
    {
      name: 'FIXED_ERROR_CALLBACK',
      title: 'Fixed Error Callback'
    },
    {
      name: 'MOCK_ERROR_CALLBACK',
      title: 'Mock Error Callback'
    }
  ]

  handleEventTypeSelect = (eventType) => {
    this.props.event.type = eventType
    this.handleEventChange()
  }

  handleEventChange = () => {
    if (this.props.callbackObject) {
      this.props.event.method = this.props.callbackObject.method
      this.props.event.path = this.props.callbackObject.path
    }

    this.props.onChange(this.props.event)
  }

  getEventTypes = () => {
    let eventTypes = this.successEventTypes
    if (this.props.mode === 'validation') {
      eventTypes = this.errorEventTypes
    }
    return eventTypes.map(item => {
      return (
        <Option key={item.name} value={item.name}>{item.title}</Option>
      )
    })
  }

  handleParamsChange = (newParams) => {
    if (newParams) {
      this.props.event.params = newParams
    } else {
      delete this.props.event.params
    }
    this.handleEventChange()
  }

  render() {

    return (
      <>
        <Row>
          <Col span={24}>
            <Row>
              <Col><Text>Delay in milliseconds</Text></Col>
              <Col className="pl-2">
                <Input placeholder="0" value={this.props.event.params.delay} onChange={(e) => {
                    const newValue = parseInt(e.target.value)
                    this.props.event.params.delay = (isNaN(newValue)) || newValue <= 0 ? undefined : newValue
                    this.handleEventChange()
                  }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col span={24}>
            <Row>
              <Col><Text>Event Type</Text></Col>
              <Col className="pl-2">
                <Select
                  value={this.props.event.type}
                  onChange={this.handleEventTypeSelect}
                  disabled={(this.props.resource? false : true)}
                  placeholder="Select Event Type"
                >
                  {this.getEventTypes()}
                </Select>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col span={24}>
            <ParamsBuilder
              eventType={this.props.event.type}
              eventParams={this.props.event.params}
              onChange={this.handleParamsChange}
              resourceDefinition={this.props.resourceDefinition}
              rootParameters = {this.props.rootParameters}
              callbackDefinition={this.props.callbackDefinition}
              callbackRootParameters={this.props.callbackRootParameters}
              callbackObject={this.props.callbackObject}
            />
          </Col>
        </Row>
      </>
    );
  }
}

export default EventBuilder;
