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
  Card,
  CardBody,
  CardHeader,
  Container,
  Row,
  Button,
  Col,
} from "reactstrap";

import { Select, Menu, Collapse, Modal } from 'antd';
import 'antd/dist/antd.css';

import Header from "components/Headers/Header.jsx";
import axios from 'axios';
import RulesEditor from './RuleEditor'

const { Option } = Select;
const { SubMenu } = Menu;
const { Panel } = Collapse;


class RulesCallback extends React.Component {

  constructor() {
    super();
    this.state = {
      callbackRulesFiles: [],
      selectedRuleFile: null,
      curRules: [],
      editRule: null
    };
  }

  componentDidMount() {
    this.getCallbackRulesFiles()
  }

  getCallbackRulesFiles = async () => {
    const response = await axios.get("http://localhost:5050/api/rules/files/callback")
    this.setState(  { callbackRulesFiles: response.data } )
  }

  getCallbackRulesFileContent = async (ruleFile) => {
    const response = await axios.get("http://localhost:5050/api/rules/files/callback/" + ruleFile)
    this.setState(  { curRules: response.data } )
  }

  getRulesFilesItems = () => {
    return this.state.callbackRulesFiles.map(ruleFile => {
      return (
        <Menu.Item>{ruleFile}</Menu.Item>
      )
    })
  }

  handleRuleFileSelect = async (selectedItem) => {
    const selectedRuleFile = selectedItem.item.props.children
    await this.setState({selectedRuleFile, ruleItemActive: null})
    this.updateRulesFileDisplay()
  }

  updateRulesFileDisplay = () => {
    this.getCallbackRulesFileContent(this.state.selectedRuleFile)
  }

  getRulesFileContentItems = () => {
    return this.state.curRules.map((rule, key) => {
      return (
        <Panel header={rule.description} key={key}>
          <Row>
            <Col xs="12" style={{textAlign: 'right'}}>
              <Button
                color="primary"
                href="#pablo"
                onClick={this.handleNewRuleClick(rule)}
                size="sm"
              >
                Edit
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <pre>{JSON.stringify(rule, null, 2)}</pre>
            </Col>
          </Row>
        </Panel>
      )
    })
  }

  handleNewRuleClick = (tRule={}) => {
    // console.log(rule)
    return () => {
      this.setState({editRule: tRule})
    }
  }

  handleNewRuleCancelClick = () => {
    this.setState({editRule: null})
  }

  render() {
    return (
      <>
          <Modal
            centered
            destroyOnClose
            forceRender
            title="Basic Modal"
            className="w-100 p-3"
            visible={this.state.editRule? true : false}
            onCancel={this.handleNewRuleCancelClick}
          >
            <RulesEditor rule={this.state.editRule} />
          </Modal>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
              <Card className="card-profile shadow">
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
                  <div className="d-flex justify-content-between">
                    <Button
                      className="mr-4"
                      color="success"
                      href="#pablo"
                      onClick={e => e.preventDefault()}
                      size="sm"
                    >
                      New Rules File
                    </Button>
                    {
                      this.state.selectedRuleFile
                      ? (
                        <Button
                          className="float-right"
                          color="danger"
                          onClick={e => e.preventDefault()}
                          size="sm"
                        >
                          Delete
                        </Button>
                      )
                      : null
                    }
                  </div>
                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <Menu
                    mode="inline"
                    theme="light"
                    onSelect={this.handleRuleFileSelect}
                  >
                    {this.getRulesFilesItems()}
                  </Menu>
                </CardBody>
              </Card>
            </Col>
            <Col className="order-xl-1" xl="8">
            {
              this.state.selectedRuleFile
              ? (
                <Card className="bg-secondary shadow">
                  <CardHeader className="bg-white border-0">
                    <Row className="align-items-center">
                      <Col xs="6">
                        <h3 className="mb-0">{this.state.selectedRuleFile}</h3>
                      </Col>
                      <Col className="text-right" xs="6">
                        <Button
                          color="info"
                          href="#pablo"
                          onClick={this.handleNewRuleClick()}
                          size="sm"
                        >
                          Add a new Rule
                        </Button>
                      </Col>
                    </Row>
                  </CardHeader>
                  <CardBody>
                    <Collapse
                      onChange={this.handleRuleItemActivePanelChange}
                    >
                      {this.getRulesFileContentItems()}
                    </Collapse>
                  </CardBody>
                </Card>
              )
              : (
                <Card className="bg-secondary shadow" style={{minHeight: '300px'}}>
                  <CardHeader className="bg-white border-0"></CardHeader>
                  <CardBody>
                  <Row>
                    <Col xs="12" style={{textAlign: 'center'}}>
                      <p>Please select a file</p>
                    </Col>
                  </Row>
                  </CardBody>
                </Card>
              )
            }
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default RulesCallback;
