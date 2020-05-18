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
  Button,
  CardBody,
  CardHeader
} from "reactstrap";
// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card, Popover, Checkbox, message, Row, Col, Switch } from 'antd';
import 'antd/dist/antd.css';
// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import Ajv from 'ajv';

const parseCurl = require('../../utils/curlParser').default

const ajv = new Ajv({allErrors: true});

const { Option } = Select;
const { TextArea } = Input;

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
    this.handleParamSelect('{$prev.'+this.state.selectedValueComponent+'.'+(this.state.paramType===1?'request':'response')+'.'+value+'}')
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
        <Col>
          <Card size="small" title="Path Parameters">
            <Row>
              <Col span={24}>
                <FormGroup>
                  {(
                    pathItems.map(item => {
                      return (
                        <Row className="mb-2" key={item.name}>
                          <Col span={8}>
                            <label
                              className="form-control-label"
                              htmlFor="input-city"
                            >
                              {item.name}
                            </label>
                          </Col>
                          <Col span={16}>
                            { this.getValueInput(item) }
                          </Col>
                        </Row>
                      )
                    })
                  )}
                </FormGroup>
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

class UrlBuilder extends React.Component {

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

  handleValueChange = async (value) => {
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
        <Col>
          <Card size="small" title="URL">
            <Row className="mt-2">
              <Col span={24}>
                <Checkbox
                  checked={this.state.overrideCheckboxSelected}
                  onChange={(e) => {
                    this.handleValueChange(null)
                    this.setState({overrideCheckboxSelected: e.target.checked})
                  }}
                />
                <label
                  className="form-control-label ml-2"
                  htmlFor="input-city"
                >
                  Override with Custom URL
                </label>
              </Col>
            </Row>
            {
              this.state.overrideCheckboxSelected
              ? (
                <Row className="mt-2">
                  <Col span={8}>
                    <label
                      className="form-control-label"
                      htmlFor="input-city"
                    >
                      Enter Base URL
                    </label>
                  </Col>
                  <Col span={16}>
                    <Input
                      placeholder="URL" value={this.props.request.url}
                      onChange={(e) => this.handleValueChange(e.target.value)}
                    />
                    {dynamicPathValue}
                  </Col>
                </Row>
              )
              : null
            }
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}

class HeaderBodyBuilder extends React.Component {
  constructor() {
    super()
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
    console.log(this.props)
    if(this.refs.bodyEditor) {
      this.refs.bodyEditor.jsonEditor.update(this.props.request.body? this.props.request.body : {})
    }
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
    this.addHeaderItem(event.item.props.children);
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
    this.props.onChange(this.props.request)
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
      this.refs.bodyEditor.jsonEditor.update(this.props.request.body)
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

    const addCustomHeaderDialogContent = (
      <>
      <Input 
        placeholder="Enter name"
        type="text"
        value={this.state.newCustomHeaderName}
        onChange={(e) => { this.setState({newCustomHeaderName: e.target.value })}}
      />
      <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={ () => {
            this.addHeaderItem(this.state.newCustomHeaderName)
            this.setState({addCustomHeaderDialogVisible: false})
          }}
          size="sm"
        >
          Add
      </Button>
      </>
    )

    return (
      <>
        <Row>
          <Col>
            <Card size="small" title="Headers">
              <Row>
                <Col className="float-right">
                  <strong>Raw Editor</strong> <Switch value={this.state.headersRawEditorEnable} onChange={(checked) => { this.setState({headersRawEditorEnable: checked}) }} />
                </Col>
                <Col span={24}>
                  {
                    this.state.headersRawEditorEnable
                    ? (
                      <div>
                        <Row>
                          <Col className="text-left mt-4">
                            <Editor
                              ref="headersEditor"
                              value={ this.props.request.headers }
                              ace={ace}
                              ajv={ajv}
                              theme="ace/theme/tomorrow_night_blue"
                              mode="code"
                              search={false}
                              statusBar={false}
                              navigationBar={false}
                              onChange={this.handleRawHeadersChange}
                            />
                          </Col>
                        </Row>
                      </div>
                    )
                    : (
                      <>
                      <FormGroup>
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
                        {this.getHeaderItems()}
                      </FormGroup>
                      <Row>
                        <Col>
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
                        <Col className="mt-2">
                          <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                            <Button color="secondary" size="sm">Add Configurable Params</Button>
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
              <Col>
                <Card size="small" title="Body">
                  <Row className='mb-2'>
                    <Col span={12}>
                      <Popover content={content} title="Select a Configurable Parameter" trigger="click">
                        <Button color="secondary" size="sm">Add Configurable Params</Button>
                      </Popover>
                    </Col>
                    <Col span={12} style={{textAlign: 'right'}}>
                      <Button color="success" size="sm" onClick={this.handlePopulateSampleBodyClick} >Populate with sample body</Button>
                    </Col>
                  </Row>
                  <Row >
                    <Col span={24}>
                      <Editor
                        ref="bodyEditor"
                        value={ this.props.request.body? this.props.request.body : {} }
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
          <Icon type="delete" theme="twoTone" twoToneColor="#eb2f96"
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

    this.props.onChange(this.props.request)
  }

  render () {
    return (
      <>
      <div>
        <Row className='mt-2'>
          <Col>
          {
            this.props.resource
            ? (
              <>
              <CurlImporter
                request={this.props.request}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
              />
              <UrlBuilder 
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
              <HeaderBodyBuilder
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
