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
  CardBody,
  Table,
  Button
} from "reactstrap";
// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card, Popover, Checkbox, message, Row, Col, Collapse, Modal } from 'antd';
import 'antd/dist/antd.css';
// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-eclipse";

const { Option } = Select;
const { Panel } = Collapse;

export class ConfigurableParameter extends React.Component {

  constructor() {
    super()
    this.state = {
      paramType: null,
      factData: null,
      selectedValueComponent: null
    }

    // Set paramTypes Array
    this.paramTypes[0]='Input Values'
    this.paramTypes[1]='Request'
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
        const bodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)
        const headerFactData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters)
        const factData = {
          properties: {
            body: bodyFactData,
            headers: { type: 'object', ...headerFactData }
          }
        }
        if (factData) {
          return (
            <FactSelect key={this.props.name} factData={factData} onSelect={this.handleFactSelect} />
          )
        } else {
          return null
        }
        break
      default:
        return null
    }
  }

  handleParamSelect = (paramValue) => {
    this.props.onChange(paramValue)
  }

  handleFactSelect = (value, factObject) => {
    //Special case for headers fact
    if (value.startsWith('headers.')) {
      value = value.replace(/^headers\.(.*)/, "headers['$1']")
    }

    this.inputValue = value
    this.handleParamSelect('{$request.'+value+'}')
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
      </Row>
    )
  }
}

export class OperatorSelector extends React.Component {

  constructor() {
    super()
    this.state = {
      selectedOperatorIndex: null
    }
    // Set operators Array
    this.operators[0] = { name: 'to.equal', description: 'Equal to' }
    this.operators[1] = { name: 'to.not.equal', description: 'Not Equal to' }
    this.operators[2] = { name: 'to.have.property', description: 'Have Property' }
    this.operators[3] = { name: 'to.not.have.property', description: 'Not to have property' }
  }
  operators = []

  handleOperatorChange = async (operatorIndex) => {
    await this.setState( {selectedOperatorIndex: operatorIndex} )
    this.props.onChange(this.operators[operatorIndex].name)
  }

  getOperatorsMenu = () => {
    return this.operators.map((item, key) => {
      return (
        <Option key={key} value={key}>
          {item.description}
        </Option>
      )
    })
  }

  render() {

    return (
      <Select
        placeholder="Please Select"
        style={{ width: 200 }}
        value={this.state.selectedOperatorIndex}
        onSelect={this.handleOperatorChange}
      >
        {this.getOperatorsMenu()}
      </Select>
    )
  }
  
}

export class FactSelector extends React.Component {

  constructor() {
    super()
    this.state = {
      factType: null,
      factData: null,
      selectedFact: null,
    }

    // Set factTypes Array
    this.factTypes[0]='Response'
    this.factTypes[1]='Callback'
  }

  factTypes = []
  inputValue = null

  getFactTypeMenu = () => {
    return this.factTypes.map((item, key) => {
      return (
        <Option key={key} value={key}>
          {item}
        </Option>
      )
    })
  }
  
  handleFactTypeChange = async (factType) => {
    var factData = null
    switch(factType) {
      case 0:
        factData = (new FactDataGenerator()).getCustomFactData(['status', 'statusText'])
        break
      case 1:
        const headerFactData = (new FactDataGenerator()).getHeadersFactData(this.props.successCallbackDefinition, this.props.successCallbackRootParameters)
        const bodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.successCallbackDefinition)
        // const errorHeaderFactData = (new FactDataGenerator()).getHeadersFactData(this.props.errorCallbackDefinition, this.props.errorCallbackRootParameters)
        const errorBodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.errorCallbackDefinition)
        factData = {type: 'object', properties: { headers: { type: 'object', ...headerFactData }, body: { ...bodyFactData, ...errorBodyFactData } }}
        break
      default:
        factData = null
    }
    await this.setState( {factType: factType, factData: factData} )
    // this.updateChanges()
  }

  getRequestFactComponent = () => {
    if (this.state.factData) {
      return (
        <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} enableNodesSelection={true} />
      )
    } else {
      return null
    }

  }

  handleFactSelect = async (value, factObject) => {
    //Special case for headers fact
    if (value.startsWith('headers.')) {
      value = value.replace(/^headers\.(.*)/, "headers['$1']")
    }

    await this.setState({selectedFact: value})
    this.updateChanges()
  }

  updateChanges = () => {
    let finalValue = ''
    switch(this.state.factType) {
      case 0:
        finalValue = 'response.' + this.state.selectedFact
        break
      case 1:
        finalValue = 'callback.' + this.state.selectedFact
        break
      default:
        finalValue = this.state.selectedFact
    }
  
    this.props.onChange(finalValue)
  }

  render() {

    return (
      <Row>
        <Col>
          <Select
            placeholder="Please Select"
            style={{ width: 200 }}
            value={this.factTypes[this.state.factType]}
            onSelect={this.handleFactTypeChange}
          >
            {this.getFactTypeMenu()}
          </Select>
        </Col>
        <Col>
          {this.getRequestFactComponent()}
        </Col>
      </Row>
    )
  }
}

export class AssertionEditorSimple extends React.Component {

  constructor () {
    super()
    this.state = {
      fact: null,
      operator: null,
      value: null
    }
  }

  getAssertionProps = (inputText) => {
    const assertionRE = new RegExp('^expect\\((.*)\\)\\.(.*)\\((.*)\\)$')
    const parsedArray = assertionRE.exec(inputText)
    if (!parsedArray) {
      return null
    }
    return {
      fact: parsedArray[1],
      operator: parsedArray[2],
      value: parsedArray[3]
    }
  }

  handleFactChange = (selectedFact) => {
    this.setState({
      fact: selectedFact
    })
  }
  handleOperatorChange = (selectedOperator) => {
    this.setState({
      operator: selectedOperator
    })
  }

  handleValueChange = (selectedValue) => {
    this.setState({
      value: selectedValue
    })
  }

  handleOnSave = () => {
    if(this.state.fact && this.state.operator && this.state.value) {
      let assertionLine
      if(this.state.fact==='response.status') {
        assertionLine = 'expect(' + this.state.fact + ').' + this.state.operator + '(' + this.state.value + ')'
      } else {
        assertionLine = 'expect(' + this.state.fact + ').' + this.state.operator + '(\'' + this.state.value + '\')'
      }
      this.props.onSave(assertionLine)
    }
  }

  render () {
    return (
      <Row>
        {/* <td>
          <p>{this.state.fact} {this.state.operator} {this.state.value}</p>
        </td> */}
        <Col span={6}>
          <FactSelector
            value={this.state.selectedFact}
            resourceDefinition={this.props.resourceDefinition}
            successCallbackDefinition={this.props.successCallbackDefinition}
            errorCallbackDefinition={this.props.errorCallbackDefinition}
            successCallbackRootParameters={this.props.successCallbackRootParameters}
            errorCallbackRootParameters={this.props.errorCallbackRootParameters}
            onChange={this.handleFactChange}
          />
        </Col>
        <Col span={6}>
          <OperatorSelector
            onChange={this.handleOperatorChange}
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="Enter value"
            type="text"
            value={this.state.value}
            onChange={e => {this.handleValueChange(e.target.value)}}
          />
        </Col>
        <Col span={6}>
          <Button
            color="success"
            size="sm"
            onClick={() => { this.handleOnSave() }}
          >
            Save
          </Button>
        </Col>
      </Row>
    )
  }
}

class AssertionEditor extends React.Component {

  constructor() {
    super()
    this.state ={
      openApiDefinition: null,
      callbackMap: null,
      responseMap: null,
      selectedResource: null,
      showAddExpectationDialog: false,
      showConfigurableParameterDialog: false,
      configurableParameterSelected: false
    }
  }

  componentDidMount = async () => {
    let selectedApiVersion = null
    let selectedResource = null
    if (this.props.request && this.props.request.operationPath && this.props.request.method) {
      selectedResource = {
        path: this.props.request.operationPath,
        method: this.props.request.method
      }
    }
    if(this.props.request && this.props.request.apiVersion) {
        selectedApiVersion = this.props.request.apiVersion
        await this.fetchAllApiData(selectedApiVersion.type, selectedApiVersion.majorVersion+'.'+selectedApiVersion.minorVersion)
    }
    this.setState({selectedResource, selectedApiVersion})
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

  getDefinition = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/definition/${apiType}/${version}`)
    return response.data
  }

  getResponseMap = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/response_map/${apiType}/${version}`)
    return response.data
  }

  getCallbackMap = async (apiType, version) => {
    const response = await axios.get(`http://localhost:5050/api/openapi/callback_map/${apiType}/${version}`)
    return response.data
  }

  getResourceDefinition = () => {
    if (this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method) {
      return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method]
    }
    return null
  }

  getCallbackObject = (isErrorCallback=false) => {
    let callbackObj = null
    if(isErrorCallback) {
      callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['errorCallback']
    } else {
      callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method]['successCallback']
    }
    return callbackObj
  }

  getCallbackRootParameters = (isErrorCallback=false) => {
    try {
      const callbackObj = this.getCallbackObject(isErrorCallback)
      return this.state.openApiDefinition.paths[callbackObj.path].parameters
    } catch(err) {
      return []
    }
  }

  getCallbackDefinition = (isErrorCallback=false) => {

    if (this.state.selectedResource) {
      try {
        const callbackObj = this.getCallbackObject(isErrorCallback)
        return this.state.openApiDefinition.paths[callbackObj.path][callbackObj.method]
      } catch(err) {
        return null
      }
    }
    return null
  }

  onEditorChange = (newValue) => {
    const execArray = newValue.split('\n')
    this.props.onChange(this.props.itemKey, execArray)
  }

  handleAddExpectationSave = (newExpectation) => {
    if(this.props.assertion.exec) {
      this.props.assertion.exec.push(newExpectation)
    }
    this.setState({showAddExpectationDialog: false})
  }

  handleAddConfigParam = (newValue) => {
    this.setState({configurableParameterSelected: newValue})
  }

  handleConfigParamCopyToClipboard = () => {
    navigator.clipboard.writeText(this.state.configurableParameterSelected)
    message.success('Copied to clipboard')
  }

  handleConfigParamInsertIntoEditor = () => {
    this.replaceEditorSelection(this.state.configurableParameterSelected)
    message.success('Pasted to editor')
  }

  replaceEditorSelection = (newText) => {
    const editor = this.refs.assertionAceEditor.editor
    const selection = editor.selection.getRange()
    editor.session.replace(selection, newText)
  }

  render() {
    return (
      <>
      <Modal
        centered
        destroyOnClose
        forceRender
        title="Expectation"
        className="w-50 p-3"
        visible={this.state.showAddExpectationDialog? true : false}
        footer={null}
        onCancel={() => { this.setState({showAddExpectationDialog: false})}}
      >
        {
          this.state.selectedResource
          ? (
            <AssertionEditorSimple
              resourceDefinition={this.getResourceDefinition()}
              successCallbackDefinition={this.getCallbackDefinition(false)}
              successCallbackRootParameters={this.getCallbackRootParameters(false)}
              errorCallbackDefinition={this.getCallbackDefinition(true)}
              errorCallbackRootParameters={this.getCallbackRootParameters(true)}
              onSave={this.handleAddExpectationSave}
            />
          )
          : null
        }
      </Modal>
      <Modal
        centered
        destroyOnClose
        forceRender
        title="Configurable Parameter"
        className="w-50 p-3"
        visible={this.state.showConfigurableParameterDialog? true : false}
        footer={null}
        onCancel={() => { this.setState({showConfigurableParameterDialog: false})}}
      >
        {
          this.state.selectedResource
          ? (
            <>
            <Row>
              <Col>
                <ConfigurableParameter
                  onChange={this.handleAddConfigParam}
                  rootParameters={this.getCallbackRootParameters(false)}
                  resourceDefinition={this.getResourceDefinition()}
                  inputValues={this.props.inputValues}
                />
              </Col>
            </Row>
            {
              this.state.configurableParameterSelected ?
              (
                <Row className="mt-4 text-center">
                  <Col>
                    <Tag color="geekblue">{this.state.configurableParameterSelected}</Tag>
                    <Button
                      className="ml-2"
                      color="info"
                      size="sm"
                      onClick={this.handleConfigParamCopyToClipboard}
                    >
                      Copy to clipboard
                    </Button>
                    <Button
                      className="ml-2"
                      color="danger"
                      size="sm"
                      onClick={this.handleConfigParamInsertIntoEditor}
                    >
                      Insert into editor
                    </Button>
                  </Col>
                </Row>
              )
              : null
            }
            </>
          )
          : null
        }
      </Modal>

      <AceEditor
        ref="assertionAceEditor"
        mode="javascript"
        theme="eclipse"
        width='100%'
        height='100px'
        value={ this.props.assertion.exec? this.props.assertion.exec.join('\n') : '' }
        onChange={this.onEditorChange}
        name="UNIQUE_ID_OF_DIV"
        wrapEnabled={true}
        showPrintMargin={true}
        showGutter={true}
        tabSize={2}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
      />
      <Button
        className="float-left mt-2"
        color="info"
        size="sm"
        onClick={() => { this.setState({showAddExpectationDialog: true})}}
      >
        Add Expectation
      </Button>
      <Button
        className="float-right mt-2"
        color="secondary"
        size="sm"
        onClick={() => { this.setState({showConfigurableParameterDialog: true})}}
      >
        Configurable Parameter
      </Button>
      </>
    )
  }
}

export class TestAssertions extends React.Component {

  constructor() {
    super()
    this.state = {
      newAssertionDescription: null,
      addNewAssertionDialogVisible: false
    }
  }

  // componentDidMount = () => {
  //   if (this.props.eventParams) {
  //     if (this.props.request.headers || this.props.request.body) {
  //       this.setState({overrideChecked: true})
  //     }
  //   }
    
  // }

  handleAssertionChange = (key, newAssertion) => {
    // if (newParams) {
    //   this.props.request.params = newParams
    // } else {
    //   delete this.props.request.params
    // }

    this.props.request.tests.assertions[key].exec = newAssertion
    this.props.onChange(this.props.request)
  }


  getAssertionItems = () => {
    const results = this.props.request.status && this.props.request.status.testResult && this.props.request.status.testResult.results ? this.props.request.status.testResult.results : {}
    return this.props.request.tests.assertions.map((assertion, key) => {
      let status = null
      if (results[assertion.id]) {
        status = (
          <Tooltip placement="topLeft" title={results[assertion.id].message}>
            <Tag color={results[assertion.id].status=='FAILED'?'#f50':'#87d068'}>
              {results[assertion.id].status}
            </Tag>
          </Tooltip>
        )
      }

      return (
        <Panel header={assertion.description} key={key} extra={status}>
          <Row className="mb-2">
            <Col>
              <Button
                className="float-right"
                color="danger"
                size="sm"
                onClick={() => { this.handleDeleteAssertionClick(key) }}
              >
                Delete
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <AssertionEditor itemKey={key} assertion={assertion} request={this.props.request} inputValues={this.props.inputValues} onChange={this.handleAssertionChange} />
            </Col>
          </Row>
        </Panel>
      )
    })
  }

  handleAddNewAssertionClick = (description) => {
    // Find highest request id to determine the new ID
    let maxId = +this.props.request.tests.assertions.reduce(function(m, k){ return k.id > m ? k.id : m }, 0)
    this.props.request.tests.assertions.push({ id: maxId+1, description})
    this.props.onChange(this.props.request)
  }

  handleDeleteAssertionClick = (index) => {
    this.props.request.tests.assertions.splice(index, 1)
    this.props.onChange(this.props.request)
  }


  render () {

    const addNewTestDialogContent = (
      <>
      <Input 
        placeholder="Enter description"
        type="text"
        value={this.state.newAssertionDescription}
        onChange={(e) => { this.setState({newAssertionDescription: e.target.value })}}
      />
      <Button
        className="text-right mt-2"
        color="success"
        href="#pablo"
        onClick={ () => {
          this.handleAddNewAssertionClick(this.state.newAssertionDescription)
          this.setState({addNewAssertionDialogVisible: false})
        }}
        size="sm"
      >
        Add
      </Button>
      </>
    )
  
    return (
      <>
      <div>
        <Row>
          <Col className="text-left">
            <Popover
              content={addNewTestDialogContent}
              title="Enter a description for the assertion"
              trigger="click"
              visible={this.state.addNewAssertionDialogVisible}
              onVisibleChange={ (visible) => this.setState({addNewAssertionDialogVisible: visible})}
            >
              <Button
                  className="text-right float-right"
                  color="primary"
                  size="sm"
                >
                  Add New Assertion
              </Button>
            </Popover>
          </Col>
          
        </Row>
        <Row className='mt-2'>
          <Col>
          {
            this.props.request.tests
            ? (
              <>
              <Collapse
                onChange={this.handleRuleItemActivePanelChange}
              >
                {this.getAssertionItems()}
              </Collapse>              
              {/* <p><pre>{JSON.stringify(this.props.request.tests, null, 2)}</pre></p> */}
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

export default TestAssertions;
