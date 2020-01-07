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

import { Input, Select, Menu, Collapse, Modal, Icon, message } from 'antd';
import 'antd/dist/antd.css';

import Header from "components/Headers/Header.jsx";
import axios from 'axios';
import RulesEditor from './RuleEditor'

const { Option } = Select;
const { SubMenu } = Menu;
const { Panel } = Collapse;


class RulesValidation extends React.Component {

  constructor() {
    super();
    this.state = {
      validationRulesFiles: [],
      activeRulesFile: null,
      selectedRuleFile: null,
      curRules: [],
      editRule: null,
      mode: null
    };
  }

  componentDidMount() {
    this.getValidationRulesFiles()
  }

  getValidationRulesFiles = async () => {
    message.loading({ content: 'Getting rules files...', key: 'getFilesProgress' });
    const response = await axios.get("http://localhost:5050/api/rules/files/validation")
    const activeRulesFile = response.data.activeRulesFile
    await this.setState(  { validationRulesFiles: response.data.files, activeRulesFile } )
    message.success({ content: 'Loaded', key: 'getFilesProgress', duration: -1 });
  }

  getValidationRulesFileContent = async (ruleFile) => {
    const response = await axios.get("http://localhost:5050/api/rules/files/validation/" + ruleFile)
    let curRules = []
    if (response.data && Array.isArray(response.data)) {
      curRules = response.data
    }
    this.setState(  { curRules } )
  }

  getRulesFilesItems = () => {
    return this.state.validationRulesFiles.map(ruleFile => {
      const isActive = (ruleFile === this.state.activeRulesFile)
      return (
      <Menu.Item key={ruleFile}>{isActive?(<Icon type="check" />):''} {ruleFile}</Menu.Item>
      )
    })
  }

  handleRuleFileSelect = async (selectedItem) => {
    const selectedRuleFile = selectedItem.key
    await this.setState({selectedRuleFile, ruleItemActive: null})
    this.updateRulesFileDisplay()
  }

  updateRulesFileDisplay = () => {
    this.getValidationRulesFileContent(this.state.selectedRuleFile)
  }

  getRulesFileContentItems = () => {
    return this.state.curRules.map((rule, key) => {
      return (
        <Panel header={rule.description} key={key}>
          <Row>
            <Col xs="12" style={{textAlign: 'right'}}>
              <Button
                color="info"
                onClick={this.handleRuleClick(rule)}
                size="sm"
              >
                Edit
              </Button>
              <Button
                color="danger"
                onClick={this.handleRuleDelete(rule.ruleId)}
                size="sm"
              >
                Delete
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

  handleRuleClick = (tRule={}) => {
    // console.log(rule)
    return () => {
      this.setState({editRule: tRule, mode: 'edit'})
    }
  }

  handleAddNewRuleClick = () => {
    // Calculate the new rule ID which is the next number of the highest rule ID in the list
    const highestRule = this.state.curRules.reduce((prevItem, item) => {
      return (prevItem.ruleId > item.ruleId ? prevItem : item)
    }, this.state.curRules[0])

    let newRuleId = 1
    if (highestRule) {
      newRuleId = highestRule.ruleId + 1
    }
    
    const tRule = {
      ruleId: newRuleId,
      priority: 1
    }

    this.setState({editRule: tRule, mode: 'create'})
  }

  handleRuleCancelClick = () => {
    this.setState({editRule: null})
  }

  handleRuleSave = async (newRule) => {
    const newRuleFull = {
      ruleId: this.state.editRule.ruleId,
      priority: this.state.editRule.priority,
      ...newRule
    }

    let updatedRules = null
    if(this.state.mode == 'create') {
      updatedRules = this.state.curRules.concat(newRuleFull)
    } else if(this.state.mode == 'edit') {
      updatedRules = this.state.curRules.map(item => {
        if (item.ruleId === newRuleFull.ruleId) {
          return newRuleFull
        } else {
          return item
        }
      })
    }

    if (updatedRules) {
      message.loading({ content: 'Saving the rule...', key: 'ruleSaveProgress' });
      await axios.put("http://localhost:5050/api/rules/files/validation/" + this.state.selectedRuleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } })
      await this.setState({editRule: null, curRules: updatedRules})
      message.success({ content: 'Saved', key: 'ruleSaveProgress', duration: 2 });
    }
  }

  handleRuleDelete = (ruleId) => {
    return async () => {
      const updatedRules = this.state.curRules.filter(item => {
        return item.ruleId !== ruleId
      })
      if (updatedRules) {
        message.loading({ content: 'Deleting rule...', key: 'deleteProgress' });
        await axios.put("http://localhost:5050/api/rules/files/validation/" + this.state.selectedRuleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } })
        message.success({ content: 'Deleted', key: 'deleteProgress', duration: 2 });
        this.setState({editRule: null, curRules: updatedRules})
      }
    }
  }

  handleNewRulesFileClick = async (fileName) => {
    message.loading({ content: 'Creating new file...', key: 'fileNewProgress' });
    await axios.put("http://localhost:5050/api/rules/files/validation/" + fileName)
    await this.getValidationRulesFiles()
    await this.setState({selectedRuleFile: fileName, ruleItemActive: null})
    message.success({ content: 'Created', key: 'fileNewProgress', duration: 2 });
    this.updateRulesFileDisplay()
  }

  handleRuleFileDelete = async () => {
    message.loading({ content: 'Deleting file...', key: 'deleteFileProgress' });
    await axios.delete("http://localhost:5050/api/rules/files/validation/" + this.state.selectedRuleFile)
    await this.getValidationRulesFiles()
    await this.setState({selectedRuleFile: null, ruleItemActive: null})
    message.success({ content: 'Deleted', key: 'deleteFileProgress', duration: 2 });
  }

  handleRuleFileSetActive = async () => {
    message.loading({ content: 'Activating rule file...', key: 'activateFileProgress' });
    await axios.put("http://localhost:5050/api/rules/files/validation", { type: 'activeRulesFile', fileName: this.state.selectedRuleFile }, { headers: { 'Content-Type': 'application/json' } })
    await this.getValidationRulesFiles()
    this.updateRulesFileDisplay()
    message.success({ content: 'Activated', key: 'activateFileProgress', duration: 2 });
  }


  render() {
    var newFileName = ''
    var newFileNameErrorMessage = ''
    const newFileCreateConfirm = () => {
      // Validate filename format
      // TODO: Some additional validation for the filename format
      if (!newFileName.endsWith('.json')) {
        message.error('Filename should be ended with .json');
        return
      }

      if (/\s/.test(newFileName)) {
        message.error('Filename contains spaces');
        return
      }

      this.setState({ mode: null})
      this.handleNewRulesFileClick(newFileName)
    }

    return (
      <>
          <Modal
            centered
            destroyOnClose
            forceRender
            title="Rule Builder"
            className="w-50 p-3"
            visible={this.state.editRule? true : false}
            footer={null}
            onCancel={this.handleRuleCancelClick}
          >
            <RulesEditor
              rule={this.state.editRule}
              onSave={this.handleRuleSave}
              mode='validation'
            />
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
                      color="info"
                      onClick={() => {this.setState({ mode: 'newFile'})}}
                      size="sm"
                    >
                      New Rules File
                    </Button>
                    {
                      this.state.selectedRuleFile
                      ? (
                        <Button
                          color="success"
                          onClick={this.handleRuleFileSetActive}
                          size="sm"
                        >
                          Set as active
                        </Button>
                      )
                      : null
                    }
                    {
                      this.state.selectedRuleFile
                      ? (
                        <Button
                          className="float-right"
                          color="danger"
                          onClick={this.handleRuleFileDelete}
                          size="sm"
                        >
                          Delete
                        </Button>
                      )
                      : null
                    }
                  </div>
                  {
                    (this.state.mode === 'newFile') ?
                    (
                      <table className="mt-2">
                      <tbody>
                      <tr><td>
                        <Input
                          placeholder="File Name"
                          type="text"
                          onChange={(e) => { newFileName = e.target.value }}
                        />
                      </td>
                      <td>
                        <Button
                          className="float-right"
                          color="secondary"
                          onClick={newFileCreateConfirm}
                          size="sm"
                        >
                          <Icon type="check" />
                        </Button>
                      </td>
                      <td>
                        <Button
                          className="float-right"
                          color="secondary"
                          onClick={() => {this.setState({ mode: null})}}
                          size="sm"
                        >
                          <Icon type="close" />
                        </Button>
                      </td>
                      </tr>
                      </tbody>
                      </table>
                    )
                    : null
                  }

                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={[this.state.selectedRuleFile]}
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
                          onClick={this.handleAddNewRuleClick}
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

export default RulesValidation;
