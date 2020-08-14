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
  Card,
  CardBody,
  CardHeader,
  Button,
} from "reactstrap";
// core components

import { Row, Col, Steps, Tag, Dropdown, Menu, message, Icon, Input } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

const { Step } = Steps;


class TestCaseViewer extends React.Component {

  constructor() {
    super();
    this.state = {
      addNewRequestDialogVisible: false,
      newRequestDescription: '',
      renameTestCase: false,
      testCaseName: ''
    };
  }

  componentWillUnmount = () => {
  }
  
  componentDidMount = () => {
    this.setState({testCaseName: this.props.testCase.name})
  }

  getTestCaseItems = () => {
    if (this.props.testCase.requests) {
      const requestRows = this.props.testCase.requests.map(item => {
        if (item.method && item.operationPath) {
          const testStatus = item.status && item.tests && item.status.testResult ? item.status.testResult.passedCount + ' / ' + item.tests.assertions.length : ''
          const testStatusColor = item.status && item.tests && item.status.testResult && item.status.testResult.passedCount===item.tests.assertions.length ? '#87d068' : '#f50'
          return (
              <tr>
                <td className="align-text-top" width='25px'>
                    <Icon type="double-right" style={{ fontSize: '20px', color: '#08c' }}></Icon>
                </td>
                <td>
                  <h3>{item.method.toUpperCase()+' '+item.operationPath}</h3> <p>{item.description}</p>
                </td>
                <td className='text-right align-top'>
                  {
                    item.status && (item.status.state === 'finish' || item.status.state === 'error')
                    ? (
                      <Tag color={testStatusColor} className='ml-2'>
                        {testStatus}
                      </Tag>
                    )
                    : null
                  }
                </td>
              </tr>
          )
        } else {
          return (
            <tr>
              <td>
                <p>{item.description}</p>
              </td>
            </tr>
          )
        }
      })
      return (
        <table width='100%' cellPadding="5px">
          <tbody>
            {requestRows}
          </tbody>
        </table>
      )
    } else {
      return null
    }
  }

  handleTestCaseRename = (newTestCaseName) => {
    this.props.testCase.name = newTestCaseName
    this.props.onRename()
  }


  render() {

    const onClick = ({ key }) => {
      switch(key) {
        case 'delete':
          this.props.onDelete(this.props.testCase.id)
          break
        case 'rename':
          this.setState({renameTestCase: true, testCaseName: this.props.testCase.name})
          break
        case 'duplicate':
          this.props.onDuplicate(this.props.testCase.id)
          break
        case 'send':
          this.props.onSend()
          break
        case 'showseqdiag':
          this.props.onShowSequenceDiagram(this.props.testCase)
          break
      }
    };
    
    const menu = (
      <Menu onClick={onClick}>
        <Menu.Item key="rename">Rename</Menu.Item>
        <Menu.Item key="duplicate">Duplicate</Menu.Item>
        <Menu.Item key="delete">Delete</Menu.Item>
        <Menu.Item key="send">Send this test case</Menu.Item>
        {
          this.props.testCase && this.props.testCase.requests && this.props.testCase.requests[0] && this.props.testCase.requests[0].status && this.props.testCase.requests[0].status.requestSent
          ? <Menu.Item key="showseqdiag">Show Sequence Diagram</Menu.Item>
          : null
        }
      </Menu>
    );

    return (
      <>
        <Row className="mb-2">
          <Col span={24}>
          <Card className="card-profile shadow">
            <CardHeader>
              <Row>
                <Col span={18}>
                  {
                    this.state.renameTestCase
                    ? (
                      <table width='100%'>
                        <tbody>
                        <tr>
                          <td>
                            <Input 
                              value={this.state.testCaseName}
                              onChange={(e) => { this.setState({testCaseName: e.target.value })}}
                            />
                          </td>
                          <td>
                            <Button
                              className="ml-2"
                              color="success"
                              href="#pablo"
                              onClick={ () => {
                                this.setState({renameTestCase: false})
                                this.handleTestCaseRename(this.state.testCaseName)
                              }}
                              size="sm"
                            >
                              Done
                            </Button>
                            <Button
                              className="ml-2"
                              color="info"
                              href="#pablo"
                              onClick={ () => {
                                this.setState({renameTestCase: false})
                                this.setState({testCaseName: this.props.testCase.name })
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </td>
                        </tr>
                        </tbody>
                      </table>
                    )
                    : this.props.testCase.name
                  }
                </Col>
                <Col span={6}>
                  <Dropdown overlay={menu} trigger={['click']} className="ml-4 mt-2 float-right">
                    <MoreOutlined />
                  </Dropdown>
                  <Button
                    className="ml-2 float-right"
                    color="info"
                    href="#pablo"
                    onClick={ () => {
                      this.props.onEdit()
                    }}
                    size="sm"
                  >
                    Edit
                  </Button>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              {this.getTestCaseItems()}
              {/* {this.getStepItems()}
              {this.getTestCaseDetailItems()} */}
            </CardBody>
          </Card>
          </Col>
        </Row>
      </>
    );
  }
}

export default TestCaseViewer;