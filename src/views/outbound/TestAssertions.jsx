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
  CardBody
} from "reactstrap";
// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, TreeSelect, Input, Tooltip, Tag, Radio, Icon, Menu, Dropdown, Card, Popover, Checkbox, message, Row, Col, Collapse } from 'antd';
import 'antd/dist/antd.css';
// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-eclipse";

const { Option } = Select;
const { Panel } = Collapse;


class AssertionEditor extends React.Component {

  constructor() {
    super()
  }

  onEditorChange = (newValue) => {
    console.log("change", newValue);
    const execArray = newValue.split('\n')
    this.props.onChange(this.props.itemKey, execArray)
  }

  render() {
    return (
      <AceEditor
        mode="javascript"
        theme="eclipse"
        width='100%'
        height='100px'
        value={ this.props.testCase.exec? this.props.testCase.exec.join('\n') : '' }
        onChange={this.onEditorChange}
        name="UNIQUE_ID_OF_DIV"
        wrapEnabled={true}
        showPrintMargin={true}
        showGutter={true}
        tabSize={2}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
      />
    )
  }
}

class TestAssertions extends React.Component {

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

  handleTestCaseChange = (key, newTestCase) => {
    // if (newParams) {
    //   this.props.request.params = newParams
    // } else {
    //   delete this.props.request.params
    // }

    this.props.request.tests.assertions[key].exec = newTestCase
    // console.log(this.props.request)
    this.props.onChange(this.props.request)
  }


  handleRuleClick = (test_case={}) => {
    // console.log(rule)
    // return () => {
    //   this.setState({editRule: tRule, mode: 'edit'})
    // }
  }

  handleRuleDelete = (test_case) => {
    // return async () => {
    //   const updatedRules = this.state.curRules.filter(item => {
    //     return item.ruleId !== ruleId
    //   })
    //   if (updatedRules) {
    //     message.loading({ content: 'Deleting rule...', key: 'deleteProgress' });
    //     ResponseRulesServiceObj.updateResponseRulesFileContent(this.state.selectedRuleFile, updatedRules)
    //     message.success({ content: 'Deleted', key: 'deleteProgress', duration: 2 });
    //     this.setState({editRule: null, curRules: updatedRules})
    //   }
    // }
  }


  getTestCaseItems = () => {
    const results = this.props.request.status && this.props.request.status.testResult && this.props.request.status.testResult.results ? this.props.request.status.testResult.results : {}
    return this.props.request.tests.assertions.map((testCase, key) => {
      let status = null
      if (results[testCase.id]) {
        status = (
          <Tag color={results[testCase.id].status=='FAILED'?'#f50':'#87d068'}>
            {results[testCase.id].status}
          </Tag>
        )
      }

      return (
        <Panel header={testCase.description} key={key} extra={status}>
          {/* <Row>
            <Col xs="12" style={{textAlign: 'right'}}>
              <Button
                color="info"
                onClick={this.handleRuleClick(testCase)}
                size="sm"
              >
                Edit
              </Button>
              <Button
                color="danger"
                onClick={this.handleRuleDelete(testCase)}
                size="sm"
              >
                Delete
              </Button>
            </Col>
          </Row> */}
          <Row>
            <Col>
              <AssertionEditor itemKey={key} testCase={testCase} onChange={this.handleTestCaseChange} />
            </Col>
          </Row>
        </Panel>
      )
    })
  }

  render () {
    return (
      <>
      <div>
        <Row className='mt-2'>
          <Col>
          {
            this.props.request.tests
            ? (
              <>
              <Collapse
                onChange={this.handleRuleItemActivePanelChange}
              >
                {this.getTestCaseItems()}
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
