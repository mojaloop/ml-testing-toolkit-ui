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
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card, Popover, Checkbox, message } from 'antd';
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
const ajv = new Ajv({allErrors: true});

const { Option } = Select;

class PathBuilder extends React.Component {

  constructor() {
    super()
    this.state = {
      params: {}
    }
  }

  handleValueChange = async (name, value) => {
    let params = this.state.params
    params[name] = value
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
    if (!this.props.rootParameters) {
      return null
    }
    const pathItems = this.props.rootParameters.filter(item => {
      return item.in === 'path'
    })
    return pathItems.map(item => {
      return (
        <Row className="mb-2" key={item.name}>
          <Col lg="4">
            <label
              className="form-control-label"
              htmlFor="input-city"
            >
              {item.name}
            </label>
          </Col>
          <Col lg="8">
            { this.getValueInput(item) }
          </Col>
        </Row>
      )
    })

  }

  getValueInput = (pathParam) => {
    if(pathParam.schema && pathParam.schema.enum) {
      return (
        <Select
          onChange={(value) => this.handleValueChange(pathParam.name, value)}
        >
        { pathParam.schema.enum.map(item => {
          return (
            <Option key={item} value={item}>{item}</Option>
          )
        })}
        </Select>
      )
    } else {
      return (
        <>
          <Input placeholder="Value" 
          onChange={(e) => this.handleValueChange(pathParam.name, e.target.value)}  />
        </>
      )
    }
  }

  render() {

    return (
      <Row className="mb-2">
        <Col>
          <Card size="small" title="Path Parameters">
            <Row>
              <Col lg="12">
                <FormGroup>
                  { this.getPathItems() }
                </FormGroup>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    )
  }
}

class HeaderBodyBuilder extends React.Component {
  constructor() {
    super()
    this.state = {
      configurableParameterSelected: ''
    }
  }

  bodySchema = {}

  componentDidMount = () => {
    // console.log(this.props.rootParameters)
    // console.log(this.props.resourceDefinition.parameters)
    // console.log(this.props.resourceDefinition)
    this.bodySchema = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)
  }
  // componentDidUpdate = () => {
  //   // console.log(this.props.rootParameters)
  //   // console.log(this.props.resourceDefinition.parameters)
  //   // console.log(this.props.resourceDefinition)
    


  // }


  addHeaderItemsFromDefinition = async (onlyRequired=false) => {
    let allParamsFromDefinition = []
    if (this.props.rootParameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.rootParameters)
    }
    if (this.props.resourceDefinition.parameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.resourceDefinition.parameters)
    }

    allParamsFromDefinition.forEach((param) => {
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

  headerItemsMenu = () => {
    let allParamsFromDefinition = []
    if (this.props.rootParameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.rootParameters)
    }
    if (this.props.resourceDefinition.parameters) {
      allParamsFromDefinition = allParamsFromDefinition.concat(this.props.resourceDefinition.parameters)
    }
    
    allParamsFromDefinition = allParamsFromDefinition.filter(item => {
      return item.in === 'header'
    })
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
          <HeaderInputComponent key={key} itemKey={item.name} name={item.name} value={item.value} rootParameters={this.props.rootParameters} resourceDefinition={this.props.resourceDefinition} onChange={this.handleHeaderItemChange} onDelete={this.handleHeaderItemDelete} />
        )
      }
    }
    return headerItems

  }

  handleAddConfigParam = (newValue) => {
    this.setState({configurableParameterSelected: newValue})
  }


  handlePopulateSampleBodyClick = async () => {
    const newBody = (new FactDataGenerator()).getBodySample(this.props.resourceDefinition)
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
                <Col lg="12" style={{textAlign: 'right'}}>
                  <Button color="success" size="sm" onClick={this.handlePopulateSampleBodyClick} >Populate with sample body</Button>
                </Col>
              </Row>
              <Row >
                <Col lg="12">
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
    console.log(this.props.selectedResource)
    this.inputValue = this.props.value
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
      <Row className="mb-2">
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
      <div className="pl-lg-4">
        <Row className='mt-3'>
          <Col>
          {
            this.props.resource
            ? (
              <>
              <PathBuilder
                request={this.props.request}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
              />
              <HeaderBodyBuilder
                request={this.props.request}
                onChange={this.handleRequestChange}
                resourceDefinition={this.props.resourceDefinition}
                rootParameters = {this.props.rootParameters}
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
