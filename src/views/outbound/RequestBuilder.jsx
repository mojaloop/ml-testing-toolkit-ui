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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";
import _ from 'lodash';

import axios from 'axios';
import { Select, Input, Tooltip, Tag, Menu, Dropdown, Card, Popover, Checkbox, message, Row, Col, Switch, Button, Typography } from 'antd';
import 'antd/dist/antd.css';
import { DeleteTwoTone } from '@ant-design/icons';

// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import Ajv from 'ajv';
import JsonEditor from "./JsonEditor.jsx";

const parseCurl = require('../../utils/curlParser').default

const ajv = new Ajv({allErrors: true});

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

class ConfigurableParameter extends React.Component {

  constructor() {
    super()
    this.state = {
      paramType: null,
      factData: null,
      selectedValueComponent: null
    }

    // Set paramTypes Array
    this.paramTypes[0]='Input Values'
    this.paramTypes[1]='Previous Request'
    this.paramTypes[2]='Previous Response'
    this.paramTypes[3]='Function'
    this.paramTypes[4]='Environment'
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

  // handleParamTypeChange = async (paramType) => {
  //   var factData = null
  //   switch(paramType) {
  //     case 0:
  //       factData = (new FactDataGenerator()).getPathParametersFactData(this.props.rootParameters)
  //       break
  //     case 1:
  //       factData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)
  //       break
  //     case 2:
  //       factData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters)
  //       break
  //     default:
  //       factData = null
  //   }
  //   await this.setState( {paramType: paramType, factData: factData} )
  //   this.updateChanges()
  // }
  handleParamTypeChange = async (paramType) => {
    this.setState( {paramType: paramType, factData: null, selectedValueComponent: null} )
  }

  // getValueComponent = () => {
  //   switch(this.state.paramType) {
  //     case 0:
  //     case 1:
  //     case 2:
  //       return (
  //         <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
  //       )
  //       break
  //     case 3:
  //     default:
  //       return null
  //   }
  // }

  getRequestFactComponent = () => {
    if (this.state.factData) {
      return (
        <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
      )
    } else {
      return null
    }

  }

  getValueComponent = () => {
    switch(this.state.paramType) {
      case 0:
        let inputOptionItems = []
        for (let item in this.props.inputValues) {
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
              this.handleParamSelect('{$inputs.'+value+'}')
            }}
          >
            {inputOptionItems}
          </Select>
          </>
        )
        break
      case 1:
      case 2:
        let requestSelectionOptionItems = []
        requestSelectionOptionItems = this.props.allRequests.map(request => {
          return (
            <Option key={request.id} value={request.id}>{request.description}</Option>
          )
        })
        return (
          <>
          <Select
            placeholder="Please Select"
            style={{ width: 200 }}
            value={this.state.selectedValueComponent}
            onChange={(requestId) => {
              const request = this.props.allRequests.find(item => item.id === requestId)
              let resourceDefinition = null
              let rootParams = null
              if (this.state.paramType === 1) {
                resourceDefinition = this.props.openApiDefinition.paths[request.operationPath][request.method]
                rootParams = this.props.openApiDefinition.paths[request.operationPath].parameters
              } else {
                const callbackObj = this.props.callbackMap[request.operationPath][request.method]['successCallback']
                resourceDefinition = this.props.openApiDefinition.paths[callbackObj.path][callbackObj.method]
                rootParams = this.props.openApiDefinition.paths[callbackObj.path].parameters
              }
              const bodyFactData = (new FactDataGenerator()).getBodyFactData(resourceDefinition)
              const headerFactData = (new FactDataGenerator()).getHeadersFactData(resourceDefinition, rootParams)
              const factData = {
                properties: {
                  body: bodyFactData,
                  headers: { type: 'object', ...headerFactData }
                }
              }
              this.setState({selectedValueComponent: requestId, factData})
            }}
          >
            {requestSelectionOptionItems}
          </Select>
          </>
        )
        break
      case 3:
        // TODO: Get the function list and type of functions from backend. Include another subtype to select
        let functionList = {
          generateUUID: {
            description: 'Generates unique id'
          },
          curDate: {
            description: 'Get current date and time'
          }
        }
        let functionOptionItems = []
        for (let item in functionList) {
          functionOptionItems.push(
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
              this.handleParamSelect('{$function.generic.'+value+'}')
            }}
          >
            {functionOptionItems}
          </Select>
          </>
        )
        break
      case 4:
        return (
          <>
          <Input
            placeholder="Enter environment variable name"
            style={{ width: 200 }}
            value={this.state.selectedValueComponent}
            onChange={(e) => {
              this.state.selectedValueComponent = e.target.value
              this.handleParamSelect('{$environment.'+e.target.value+'}')
            }}
          />
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
    this.handleParamSelect('{$prev.'+this.state.selectedValueComponent+'.'+(this.state.paramType===1?'request':'callback')+'.'+value+'}')
    // this.updateChanges()
  }

  updateChanges = () => {
    let finalValue = ''
    if (!this.inputValue) {
      this.inputValue = ''
    }
    switch(this.state.paramType) {
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

class PathBuilder extends React.Component {

  constructor() {
    super()
    this.state = {
      params: {}
    }
  }

  componentDidMount() {
    this.state.params = { ...this.props.request.params }
  }

  handleValueChange = async (name, value) => {
    let params = this.state.params
    params[name] = value
    this.props.request.params = params
    await this.setState({params})
    this.updatePath()
  }

  updatePath = () => {
    let operationPath = this.props.request.operationPath
    for (let k in this.state.params) {
      operationPath = operationPath.replace('{'+k+'}', this.state.params[k])
    }
    this.props.request.path = operationPath
    this.props.onChange()
  }

  getPathItems = () => {
    // TODO: read the path parameters from resource parameters also
    // Currently only rootParameters are considered
    let allParameters = []
    if(this.props.rootParameters) {
      allParameters = allParameters.concat(this.props.rootParameters)
    }
    if(this.props.resourceDefinition && this.props.resourceDefinition.parameters) {
      allParameters = allParameters.concat(this.props.resourceDefinition.parameters)
    }
    if (!allParameters) {
      return null
    }
    const pathItems = allParameters.filter(item => {
      return item.in === 'path'
    })
    if (pathItems.length<=0) {
      return null
    }
    return (
      <Row className="mb-2">
        <Col span={24}>
          <Card size="small" title="Path Parameters">
            <Row>
              <Col span={24}>
                {(
                  pathItems.map(item => {
                    return (
                      <Row className="mb-2" key={item.name}>
                        <Col span={8}>
                          <Text strong>
                            {item.name}
                          </Text>
                        </Col>
                        <Col span={16}>
                          { this.getValueInput(item) }
                        </Col>
                      </Row>
                    )
                  })
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    )

  }

  getValueInput = (pathParam) => {
    if (!this.props.request.params) {
      this.props.request.params = {}
    }
    if(!this.props.request.params[pathParam.name]) {
      this.props.request.params[pathParam.name] = ''
    }
    const pathValue = this.props.request.params[pathParam.name]
    let dynamicPathValue = null
    //Check if the path value is a configurable input parameter
    if (pathValue.startsWith('{$inputs.')) {
      // Find the parameter name
      const paramName = pathValue.slice(9,pathValue.length-1)
      // if (this.props.inputValues)
      const temp = _.get(this.props.inputValues, paramName)
      if (temp) {
        dynamicPathValue = (
          <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
        )
      }
    }
    if(pathParam.schema && pathParam.schema.enum) {
      return (
        <>
        <Select
          onChange={(value) => this.handleValueChange(pathParam.name, value)}
          value={this.props.request.params[pathParam.name]}
          style={{width:"100%"}}
        >
        { pathParam.schema.enum.map(item => {
          return (
            <Option key={item} value={item}>{item}</Option>
          )
        })}
        </Select>
        {dynamicPathValue}
        </>
      )
    } else {
      return (
        <>
          <Input placeholder="Value" value={this.props.request.params[pathParam.name]}
          onChange={(e) => this.handleValueChange(pathParam.name, e.target.value)}  />
          {dynamicPathValue}
        </>
      )
    }
  }

  render() {

    return (
      <>
      { this.getPathItems() }
      </>
    )
  }
}

class OptionsBuilder extends React.Component {

  constructor() {
    super()
    this.state = {
      overrideCheckboxSelected: false
    }
  }

  componentDidMount() {
    if (this.props.request.url) {
      this.setState({overrideCheckboxSelected: true})
    }
    // this.state.params = { ...this.props.request.params }
  }

  handleUrlChange = async (value) => {
    this.props.request.url = value
    this.props.onChange()
  }

  render() {

    let dynamicPathValue = null
    //Check if the path value is a configurable input parameter
    if (this.props.request.url && this.props.request.url.startsWith('{$inputs.')) {
      // Find the parameter name
      const paramName = this.props.request.url.slice(9,this.props.request.url.length-1)
      const temp = _.get(this.props.inputValues, paramName)
      if (temp) {
        dynamicPathValue = (
          <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
        )
      }
    }

    return (
      <>
      <Row className="mb-2">
        <Col span={24}>
          <Card size="small" title="Options">
            <Row className="mt-2">
              <Col span={24}>
                <Checkbox
                  checked={this.state.overrideCheckboxSelected}
                  onChange={(e) => {
                    this.handleUrlChange(null)
                    this.setState({overrideCheckboxSelected: e.target.checked})
                  }}
                />
                <Text strong className="ml-2">
                  Override with Custom URL
                </Text>
              </Col>
            </Row>
            {
              this.state.overrideCheckboxSelected
              ? (
                <Row className="mt-2">
                  <Col span={8}>
                    <Text strong>
                      Enter Base URL
                    </Text>
                  </Col>
                  <Col span={16}>
                    <Input
                      placeholder="URL" value={this.props.request.url}
                      onChange={(e) => this.handleUrlChange(e.target.value)}
                    />
                    {dynamicPathValue}
                  </Col>
                </Row>
              )
              : null
            }
            <Row className="mt-2">
              <Col span={24}>
                <Checkbox
                  checked={this.props.request.ignoreCallbacks}
                  onChange={(e) => {
                    this.props.request.ignoreCallbacks = e.target.checked
                    this.props.onChange()
                  }}
                />
                <Text strong className="ml-2">
                  Ignore Callbacks
                </Text>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col span={24}>
                <Checkbox
                  checked={this.state.delayCheckboxSelected || this.props.request.delay}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      delete this.props.request.delay
                    } else {
                      this.props.request.delay = "0"
                    }
                    this.props.onChange()
                    this.setState({delayCheckboxSelected: e.target.checked})
                  }}
                />
                <Text strong className="ml-2">
                  Use delay
                </Text>
              </Col>
              {
                  this.state.delayCheckboxSelected || this.props.request.delay
                  ? (
                    <Row className="mt-2">
                      <Col span={8}>
                        <Text strong>
                          Enter Delay in milliseconds
                        </Text>
                      </Col>
                      <Col span={16}>
                        <Input
                          placeholder="delay" value={this.props.request.delay}
                          onChange={(e) => {
                            this.props.request.delay = e.target.value
                            this.props.onChange()
                          }}
                        />
                      </Col>
                    </Row>
                  )
                  : null
                }
            </Row>
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}

class QueryParamsBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      addQueryParamDialogVisible: false,
      newQueryParamName: '',
      queryParamRawEditorEnable: false
    }
  }

  addQueryParamItem = (itemName) => {
    if (!this.props.request.queryParams) {
      this.props.request.queryParams = {}
    }
    this.props.request.queryParams[itemName] = this.props.request.queryParams[itemName] ? this.props.request.queryParams[itemName] : ""
    this.updateChanges()
  }
  handleQueryParamChange = (key, name, value) => {
    this.props.request.queryParams[name] = value
    this.updateChanges()
  }
  handleQueryParamDelete = async (name) => {
    delete this.props.request.queryParams[name]
    this.updateChanges()
  }

  handleRawQueryParamsChange = (newParams) => {
    this.props.request.queryParams = newParams
    this.updateChanges()
  }

  updateChanges = () => {
    this.props.onChange(this.props.request)
  }

  getQueryParamItems = () => {
    // console.log(this.props.resourceDefinition)
    let paramItems = []
    let k=0
    if (this.props.request) {
      for( let paramName in this.props.request.queryParams ) {
        const item = {
          name: paramName,
          value: this.props.request.queryParams[paramName]
        }
        const key = k++
        paramItems.push(
          <QueryParamsInputComponent
            key={key}
            itemKey={item.name}
            name={item.name}
            value={item.value}
            resourceDefinition={this.props.resourceDefinition}
            onChange={this.handleQueryParamChange}
            onDelete={this.handleQueryParamDelete}
            inputValues={this.props.inputValues}
          />
        )
      }
    }
    return paramItems

  }

  render() {

    const addQueryParamDialogContent = (
      <>
      <Input
        placeholder="Enter name"
        type="text"
        value={this.state.newQueryParamName}
        onChange={(e) => { this.setState({newQueryParamName: e.target.value })}}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.addQueryParamItem(this.state.newQueryParamName)
            this.setState({addQueryParamDialogVisible: false})
          }}
          size="sm"
        >
          Add
      </Button>
      </>
    )

    return (
      <>
        <Row className="mb-2">
          <Col span={24}>
            <Card size="small" title="Query Parameters">
              <Row>
                <Col span={12}>
                  {
                    !this.state.queryParamRawEditorEnable
                    ? <Popover
                        content={addQueryParamDialogContent}
                        title="Enter name for the parameter"
                        trigger="click"
                        visible={this.state.addQueryParamDialogVisible}
                        onVisibleChange={ (visible) => this.setState({addQueryParamDialogVisible: true})}
                      >
                        <Button
                          type="primary"
                        >
                          Add Param
                        </Button>
                      </Popover>
                    : null
                  }
                </Col>
                <Col span={12} className="text-right">
                  <strong>Raw Editor</strong> <Switch checked={this.state.queryParamRawEditorEnable} onChange={(checked) => { this.setState({queryParamRawEditorEnable: checked}) }} />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col span={24}>
                  {
                    this.state.queryParamRawEditorEnable
                    ? (
                      <div>
                        <Row>
                          <Col span={24} className="text-left mt-4">
                            <JsonEditor
                              value={ this.props.request.queryParams || {} }
                              onChange={this.handleRawQueryParamsChange}
                            />
                          </Col>
                        </Row>
                      </div>
                    )
                    : (
                      <>
                      <Row>
                        <Col span={8}>
                          <Text strong>
                            Name
                          </Text>
                        </Col>
                        <Col span={8}>
                          <Text strong>
                            Value
                          </Text>
                        </Col>
                      </Row>
                      {this.getQueryParamItems()}
                      </>
                    )
                  }
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </>
    )
  }
}


class QueryParamsInputComponent extends React.Component {

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

  getDynamicValue = () => {
    let dynamicValue = null
    //Check if the path value is a configurable input parameter
    if (this.inputValue && this.inputValue.startsWith('{$inputs.')) {
      // Find the parameter name
      const paramName = this.inputValue.slice(9,this.inputValue.length-1)
      // if (this.props.inputValues)
      const temp = _.get(this.props.inputValues, paramName)
      if (temp) {
        dynamicValue = (
          <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
        )
      }
    }
    return dynamicValue
  }

  handleNameChange = (event) => {
    // this.setState({name: event.target.value})
    this.props.onChange(this.props.itemKey, event.target.value, this.props.value)
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
    return (
      <>
      <Row className="mb-2" gutter={16}>
        <Col span={8}>
          <Tooltip placement="topLeft" title={this.props.description}>
            <Input
              className="form-control-alternative"
              placeholder="Name"
              type="text"
              defaultValue={this.props.name}
              value={this.props.name}
              onChange={this.handleNameChange}
              disabled={false}
              readOnly={true}
            />
          </Tooltip>
        </Col>

        <Col span={14}>
          <Input
            className="form-control-alternative"
            placeholder="Value"
            type="text"
            defaultValue={this.props.value}
            value={this.props.value}
            onChange={this.handleValueChange}
            disabled={false}
          />
          {this.getDynamicValue()}
        </Col>
        <Col span={2}>
          <DeleteTwoTone twoToneColor="#eb2f96"
            key={this.props.name}
            onClick={this.handleDelete}
          />
        </Col>
      </Row>
      </>
    )
  }
}

class HeaderBodyBuilder extends React.Component {
  constructor() {
    super()
    this.bodyEditorRef = React.createRef()
    this.state = {
      configurableParameterSelected: '',
      allParamsFromDefinition: [],
      allParamsObject: {},
      addCustomHeaderDialogVisible: false,
      newCustomHeaderName: '',
      headersRawEditorEnable: false
    }
  }

  bodySchema = {}

  componentDidMount = () => {
    // console.log(this.props.rootParameters)
    // console.log(this.props.resourceDefinition.parameters)
    this.bodySchema = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)

    let allParamsFromDefinition = []
    if (this.props.rootParameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.rootParameters)
    }
    if (this.props.resourceDefinition && this.props.resourceDefinition.parameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.resourceDefinition.parameters)
    }

    let allParamsObject = {}
    for (let k in allParamsFromDefinition) {
      allParamsObject[allParamsFromDefinition[k].name] = {
        description: allParamsFromDefinition[k].description
      }
    }
    this.setState({allParamsFromDefinition, allParamsObject})
  }

  componentDidUpdate = () => {
    // if(this.refs.bodyEditor) {
    //   this.refs.bodyEditor.jsonEditor.update(this.props.request.body? this.props.request.body : {})
    // }
    // console.log(this.props.resourceDefinition.parameters)
    // console.log(this.props.resourceDefinition)
  }


  addHeaderItemsFromDefinition = async (onlyRequired=false) => {
    this.state.allParamsFromDefinition.forEach((param) => {
      if (param.in==='header') {
        if (!onlyRequired || param.required) {
          if (!this.props.request.headers) {
            this.props.request.headers = {}
            this.props.request.headers[param.name] = ''
          }
          else if (!this.props.request.headers[param.name]) {
            this.props.request.headers[param.name] = ''
          }
        }
      }
    })
    this.updateChanges()
  }

  addHeaderItem = (itemName) => {
    if (!this.props.request.headers) {
      this.props.request.headers = {}
    }
    this.props.request.headers[itemName] = this.props.request.headers[itemName] ? this.props.request.headers[itemName] : ""
    this.updateChanges()
  }
  handleHeaderItemChange = (key, name, value) => {
    this.props.request.headers[name] = value
    this.updateChanges()
  }
  handleHeaderItemDelete = async (name) => {
    delete this.props.request.headers[name]
    this.updateChanges()
  }

  handleBodyChange = (bodyObject) => {
    // console.log(ace.getCursorPosition())
    this.props.request.body = bodyObject
    this.updateChanges()
  }

  handleAddHeaderClick = (event) => {
    this.addHeaderItem(event.item.props.eventKey);
  };

  handleRawHeadersChange = (newHeaders) => {
    this.props.request.headers = newHeaders
    this.updateChanges()
  }

  headerItemsMenu = () => {
    const headerParams = this.state.allParamsFromDefinition.filter(item => {
      return item.in === 'header'
    })
    const menuItems = headerParams.map((item, key) => {
      return (
        <Menu.Item key={item.name}>{item.name}</Menu.Item>
      )
    })
    return (
      <Menu onClick={this.handleAddHeaderClick}>
        {menuItems}
      </Menu>
    )
  }

  updateChanges = () => {
    this.props.onChange(this.props.request)
  }

  updateBodyChanges = () => {
    if (this.bodyEditorRef.jsonEditor &&  this.props.request.body) {
      this.bodyEditorRef.jsonEditor.update(this.props.request.body)
    }
  }

  getHeaderItems = () => {
    // console.log(this.props.resourceDefinition)
    let headerItems = []
    let k=0
    if (this.props.request) {
      for( let headerName in this.props.request.headers ) {
        const item = {
          name: headerName,
          value: this.props.request.headers[headerName]
        }
        const key = k++
        headerItems.push(
          <HeaderInputComponent
            key={key}
            itemKey={item.name}
            name={item.name}
            value={item.value}
            description={this.state.allParamsObject[item.name]? this.state.allParamsObject[item.name].description: null} rootParameters={this.props.rootParameters}
            resourceDefinition={this.props.resourceDefinition}
            onChange={this.handleHeaderItemChange}
            onDelete={this.handleHeaderItemDelete}
            inputValues={this.props.inputValues}
          />
        )
      }
    }
    return headerItems

  }

  handleAddConfigParam = (newValue) => {
    this.setState({configurableParameterSelected: newValue})
  }


  handlePopulateSampleBodyClick = async () => {
    // const newBody = (new FactDataGenerator()).getBodySample(this.props.resourceDefinition)
    const newBody = await (new FactDataGenerator()).generateSample(this.bodySchema)
    if(newBody) {
      // if(this.props.callbackObject && this.props.callbackObject.bodyOverride) {
      //   _.merge(newBody, this.props.callbackObject.bodyOverride)
      // }
      this.props.request.body = newBody
      this.updateBodyChanges()
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
        <Col span={24}>
          <ConfigurableParameter
            onChange={this.handleAddConfigParam}
            rootParameters={this.props.rootParameters}
            resourceDefinition={this.props.resourceDefinition}
            openApiDefinition={this.props.openApiDefinition}
            callbackMap={this.props.callbackMap}
            inputValues={this.props.inputValues}
            allRequests={this.props.allRequests}
          />
        </Col>
      </Row>
      {
        this.state.configurableParameterSelected ?
        (
          <Row className="mt-4 text-center">
            <Col span={24}>
              Click below to copy <br/>
              <Tag color="geekblue"><a onClick={this.handleConfigParamCopyToClipboard}>{this.state.configurableParameterSelected}</a></Tag>
            </Col>
          </Row>
        )
        : null
      }
      </>
    )

    const addCustomHeaderDialogContent = (
      <>
      <Row>
        <Col span={24}>
          <Input
            placeholder="Enter name"
            type="text"
            value={this.state.newCustomHeaderName}
            onChange={(e) => { this.setState({newCustomHeaderName: e.target.value })}}
          />
        </Col>
      </Row>
      <Row className="mt-2">
        <Col span={24}>
          <Button
              type="primary"
              onClick={ () => {
                this.addHeaderItem(this.state.newCustomHeaderName)
                this.setState({addCustomHeaderDialogVisible: false})
              }}
            >
              Add
          </Button>
          <Button
              className="ml-2"
              type="default"
              danger
              onClick={ () => {
                this.setState({addCustomHeaderDialogVisible: false})
              }}
            >
              Cancel
          </Button>
        </Col>
      </Row>
      </>
    )

    return (
      <>
        <Row>
          <Col span={24}>
            <Card size="small" title="Headers">
              <Row>
                <Col span={12}>
                  <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                    <Button type="dashed">Add Configurable Params</Button>
                  </Popover>
                </Col>
                <Col span={12} className="text-right">
                  <strong>Raw Editor</strong> <Switch checked={this.state.headersRawEditorEnable} onChange={(checked) => { this.setState({headersRawEditorEnable: checked}) }} />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col span={24}>
                  {
                    this.state.headersRawEditorEnable
                    ? (
                      <div>
                        <Row>
                          <Col span={24} className="text-left mt-4">
                            <JsonEditor
                              value={ this.props.request.headers || {}}
                              onChange={this.handleRawHeadersChange}
                            />
                          </Col>
                        </Row>
                      </div>
                    )
                    : (
                      <>
                      <Row className="mb-2">
                        <Col span={8}>
                          <Text strong>
                            Name
                          </Text>
                        </Col>
                        <Col span={8}>
                          <Text strong>
                            Value
                          </Text>
                        </Col>
                      </Row>
                      {this.getHeaderItems()}
                      <Row>
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
                            className="ml-2 float-right"
                            type="default"
                            danger
                            onClick={() => this.addHeaderItemsFromDefinition(true)}
                          >
                            Add Required Headers
                          </Button>
                        </Col>
                      </Row>
                      <Row className="mt-2">
                        <Col span={24}>
                          <Button
                            className="float-right"
                            type="default"
                            onClick={() => this.addHeaderItemsFromDefinition(false)}
                          >
                            Add All Headers
                          </Button>
                          <Popover
                            content={addCustomHeaderDialogContent}
                            title="Enter name for the header"
                            trigger="click"
                            visible={this.state.addCustomHeaderDialogVisible}
                            onVisibleChange={ (visible) => this.setState({addCustomHeaderDialogVisible: true})}
                          >
                            <Button
                                color="warning"
                                size="sm"
                              >
                                Add Custom Header
                            </Button>
                          </Popover>
                        </Col>
                      </Row>
                      </>
                    )
                  }
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        {
          this.props.resourceDefinition && this.props.resourceDefinition.requestBody
          ? (
            <Row className='mt-2'>
              <Col span={24}>
                <Card size="small" title="Body">
                  <Row className='mb-2'>
                    <Col span={12}>
                      <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                        <Button type="dashed">Add Configurable Params</Button>
                      </Popover>
                    </Col>
                    <Col span={12} style={{textAlign: 'right'}}>
                      <Button type="default" onClick={this.handlePopulateSampleBodyClick} >Populate with sample body</Button>
                    </Col>
                  </Row>
                  <Row >
                    <Col span={24}>
                      <JsonEditor
                        ref={editor => {
                          this.bodyEditorRef = editor
                        }}
                        value={ this.props.request.body? this.props.request.body : {} }
                        onChange={this.handleBodyChange}
                        schema={this.bodySchema}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )
          : null
        }
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

  getDynamicValue = () => {
    let dynamicValue = null
    //Check if the path value is a configurable input parameter
    if (this.inputValue && this.inputValue.startsWith('{$inputs.')) {
      // Find the parameter name
      const paramName = this.inputValue.slice(9,this.inputValue.length-1)
      // if (this.props.inputValues)
      const temp = _.get(this.props.inputValues, paramName)
      if (temp) {
        dynamicValue = (
          <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
        )
      }
    }
    return dynamicValue
  }

  handleNameChange = (event) => {
    // this.setState({name: event.target.value})
    this.props.onChange(this.props.itemKey, event.target.value, this.props.value)
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
    return (
      <>
      <Row className="mb-2" gutter={16}>
        <Col span={8}>
          <Tooltip placement="topLeft" title={this.props.description}>
            <Input
              className="form-control-alternative"
              placeholder="Name"
              type="text"
              defaultValue={this.props.name}
              value={this.props.name}
              onChange={this.handleNameChange}
              disabled={false}
              readOnly={true}
            />
          </Tooltip>
        </Col>

        <Col span={14}>
          <Input
            className="form-control-alternative"
            placeholder="Value"
            type="text"
            defaultValue={this.props.value}
            value={this.props.value}
            onChange={this.handleValueChange}
            disabled={false}
          />
          {this.getDynamicValue()}
        </Col>
        <Col span={2}>
          <DeleteTwoTone twoToneColor="#eb2f96"
            key={this.props.name}
            onClick={this.handleDelete}
          />
        </Col>
      </Row>
      </>
    )
  }
}

class CurlImporter extends React.Component {
  constructor() {
    super()
    this.state = {
      importCurlCommandDialogVisible: false,
      curlCommand: '',
      displayErrorMessage: ''
    }
  }

  handleImportClick = () => {
    try {
      const decodedCurl = parseCurl(this.state.curlCommand);
      this.props.request.headers = JSON.parse(JSON.stringify(decodedCurl.headers))
      if (this.props.resourceDefinition && this.props.resourceDefinition.requestBody) {
        this.props.request.body = JSON.parse(JSON.stringify(decodedCurl.body))
      }
      this.setState({importCurlCommandDialogVisible: false})
      this.props.onChange()
    } catch(err) {
      this.setState({displayErrorMessage: 'Wrong CURL syntax: Parsing Error'})
    }
  }
  render () {

    const importCurlCommandDialogContent = (
      <>
      <Row>
      <Col>
        <TextArea rows={8}
          placeholder="Enter name"
          size="large"
          type="text"
          value={this.state.curlCommand}
          onChange={(e) => { this.setState({curlCommand: e.target.value })}}
        />
      </Col>
      </Row>
      <Row>
      <Col>
        <Button
            className="text-right mt-2"
            color="success"
            href="#pablo"
            onClick={this.handleImportClick}
            size="sm"
          >
            Import
        </Button>
        <Button
            className="text-right mt-2"
            color="danger"
            href="#pablo"
            onClick={() => {
              this.setState({importCurlCommandDialogVisible: false})
            }}
            size="sm"
          >
            Cancel
        </Button>
      </Col>
      </Row>
      <Row>
        <Col>
          {this.state.displayErrorMessage}
        </Col>
      </Row>
      </>
    )

    return (
      <Popover
        content={importCurlCommandDialogContent}
        title="Paste the CURL command here"
        trigger="click"
        visible={this.state.importCurlCommandDialogVisible}
        onVisibleChange={ (visible) => this.setState({importCurlCommandDialogVisible: true})}
      >
        <Button
          className="mt-2 mb-2 mr-2"
          color="info"
          size="sm"
        >
          Import Curl
        </Button>
        (Experimental)
      </Popover>
    )
  }
}


class RequestBuilder extends React.Component {

  constructor() {
    super()
    this.headerBodyBuilderRef = React.createRef()
    this.state = {
    }
  }

  // componentDidMount = () => {
  //   if (this.props.eventParams) {
  //     if (this.props.request.headers || this.props.request.body) {
  //       this.setState({overrideChecked: true})
  //     }
  //   }

  // }

  handleRequestChange = () => {
    // if (newParams) {
    //   this.props.request.params = newParams
    // } else {
    //   delete this.props.request.params
    // }
    this.headerBodyBuilderRef.current.updateBodyChanges()
    this.props.onChange(this.props.request)
  }

  render () {
    return (
      <>
      <div>
        <Row className='mt-2'>
          <Col span={24}>
          {
            this.props.resource
            ? (
              <>
              <CurlImporter
                request={this.props.request}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
              />
              <OptionsBuilder
                request={this.props.request}
                inputValues={this.props.inputValues}
                onChange={this.handleRequestChange}
              />
              <PathBuilder
                request={this.props.request}
                inputValues={this.props.inputValues}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
              />
              <QueryParamsBuilder
                request={this.props.request}
                inputValues={this.props.inputValues}
                allRequests={this.props.allRequests}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
                openApiDefinition={this.props.openApiDefinition}
                callbackMap={this.props.callbackMap}
              />
              <HeaderBodyBuilder
                ref={this.headerBodyBuilderRef}
                request={this.props.request}
                inputValues={this.props.inputValues}
                allRequests={this.props.allRequests}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
                openApiDefinition={this.props.openApiDefinition}
                callbackMap={this.props.callbackMap}
              />
              </>
            )
            : null
          }

          </Col>
        </Row>
      </div>
      </>
    )
  }
}

export default RequestBuilder;
