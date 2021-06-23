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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com>
 --------------
 ******/
import React from "react";

import { Input, Select, Menu, Row, Col, Button, Card, Collapse, Modal, message, Typography } from 'antd';
import 'antd/dist/antd.css';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import axios from 'axios';
import RulesEditor from './RuleEditor'
import RuleViewer from './RuleViewer'
import { getConfig } from '../../utils/getConfig'
import {SortableContainer, SortableElement} from 'react-sortable-hoc'
import arrayMove from 'array-move'

const { Option } = Select;
const { SubMenu } = Menu;
const { Panel } = Collapse;
const { Title } = Typography;

class RulesForward extends React.Component {

  constructor() {
    super();
    this.state = {
      rulesFiles: [],
      activeRulesFile: null,
      selectedRuleFile: null,
      curRules: [],
      editRule: null,
      mode: null,
      reOrderingEnabled: false,
      curRulesUpdated: false
    };
  }

  componentDidMount() {
    this.getCallbackRulesFiles()
  }

  getCallbackRulesFiles = async () => {
    message.loading({ content: 'Getting rules files...', key: 'getFilesProgress' });
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/rules/files/forward")
    const activeRulesFile = response.data.activeRulesFile
    this.setState(  { rulesFiles: response.data.files, activeRulesFile } )
    message.success({ content: 'Loaded', key: 'getFilesProgress', duration: -1 });

    // Select the active rules file by default
    this.setState({selectedRuleFile: activeRulesFile, ruleItemActive: null})
    this.updateRulesFileDisplay()
  }

  getCallbackRulesFileContent = async (ruleFile) => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/rules/files/forward/" + ruleFile)
    let curRules = []
    if (response.data && Array.isArray(response.data)) {
      curRules = response.data
    }
    this.setState(  { curRules } )
  }

  getRulesFilesItems = () => {
    return this.state.rulesFiles.map(ruleFile => {
      const isActive = (ruleFile === this.state.activeRulesFile)
      return (
      <Menu.Item key={ruleFile}>{isActive?(<CheckOutlined />):''} {ruleFile}</Menu.Item>
      )
    })
  }

  handleRuleFileSelect = async (selectedItem) => {
    const selectedRuleFile = selectedItem.key
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
            <Col span={24} style={{textAlign: 'right'}}>
              <Button
                onClick={this.handleRuleClick(rule)}
              >
                Edit
              </Button>
              <Button
                className="ml-2"
                type="primary"
                danger
                onClick={this.handleRuleDelete(rule.ruleId)}
                size="sm"
              >
                Delete
              </Button>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <RuleViewer rule={rule} />
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
      await this.updateRules({editRule: null, curRules: updatedRules})
    }
  }

  updateRules = async (newState) => {
    message.loading({ content: 'Saving the rule...', key: 'ruleSaveProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.put(apiBaseUrl + "/api/rules/files/forward/" + this.state.selectedRuleFile, newState.curRules, { headers: { 'Content-Type': 'application/json' } })
    this.setState(newState)
    message.success({ content: 'Saved', key: 'ruleSaveProgress', duration: 2 });
  }

  onRulesSortEnd = ({oldIndex, newIndex}) => {
    // Change the position in array
    this.setState({curRulesUpdated: true})
    this.setState({curRules: arrayMove(this.state.curRules, oldIndex, newIndex)})
  }

  handleRuleDelete = (ruleId) => {
    return async () => {
      const updatedRules = this.state.curRules.filter(item => {
        return item.ruleId !== ruleId
      })
      if (updatedRules) {
        message.loading({ content: 'Deleting rule...', key: 'deleteProgress' });
        const { apiBaseUrl } = getConfig()
        await axios.put(apiBaseUrl + "/api/rules/files/forward/" + this.state.selectedRuleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } })
        message.success({ content: 'Deleted', key: 'deleteProgress', duration: 2 });
        this.setState({editRule: null, curRules: updatedRules})
      }
    }
  }

  handleNewRulesFileClick = async (fileName) => {
    message.loading({ content: 'Creating new file...', key: 'fileNewProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.put(apiBaseUrl + "/api/rules/files/forward/" + fileName)
    await this.getCallbackRulesFiles()
    await this.setState({selectedRuleFile: fileName, ruleItemActive: null})
    message.success({ content: 'Created', key: 'fileNewProgress', duration: 2 });
    this.updateRulesFileDisplay()
  }

  handleRuleFileDelete = async () => {
    message.loading({ content: 'Deleting file...', key: 'deleteFileProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.delete(apiBaseUrl + "/api/rules/files/forward/" + this.state.selectedRuleFile)
    await this.getCallbackRulesFiles()
    await this.setState({selectedRuleFile: null, ruleItemActive: null})
    message.success({ content: 'Deleted', key: 'deleteFileProgress', duration: 2 });
  }

  handleRuleFileSetActive = async () => {
    message.loading({ content: 'Activating rule file...', key: 'activateFileProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.put(apiBaseUrl + "/api/rules/files/forward", { type: 'activeRulesFile', fileName: this.state.selectedRuleFile }, { headers: { 'Content-Type': 'application/json' } })
    await this.getCallbackRulesFiles()
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

    const SortableRuleItem = SortableElement(({value}) => <Panel header={value.description}></Panel>)

    const SortableRuleList = SortableContainer(({items}) => {
      return (
        <Collapse>
        {items.map((value, index) => (
          <SortableRuleItem key={`item-${value.ruleId}`} index={index} value={value} />
        ))}
        </Collapse>
      )
    })

    return (
      <>
          <Modal
            centered
            destroyOnClose
            forceRender={false}
            title="Rule Builder"
            className="w-50 p-3"
            visible={this.state.editRule? true : false}
            footer={null}
            onCancel={this.handleRuleCancelClick}
            maskClosable={false}
          >
            <RulesEditor
              rule={this.state.editRule}
              onSave={this.handleRuleSave}
              mode='forward'
            />
          </Modal>

          <Row>
          <Col span={16}>
            {
              this.state.selectedRuleFile
              ? (
                <Card>
                  <Row className="align-items-center">
                      <Col span={12}>
                        <h3 >{this.state.selectedRuleFile}</h3>
                      </Col>
                      <Col span={12}>
                      <Button
                        className="float-right"
                        type="primary"
                        onClick={this.handleAddNewRuleClick}
                      >
                        Add a new Rule
                      </Button>
                      {
                          this.state.reOrderingEnabled
                          ? (
                            <Button
                              className="float-right mr-2"
                              type="dashed"
                              danger
                              onClick={async () => {
                                if (this.state.curRulesUpdated) {
                                  await this.updateRules({curRules: this.state.curRules})
                                } else {
                                  message.error({ content: 'No changes found', key: 'ruleSaveProgress', duration: 2 });
                                }
                                this.setState({curRulesUpdated: false})
                                this.setState({reOrderingEnabled: false})
                              }}
                            >
                              Apply Order
                            </Button>
                          )
                          : (
                            <Button
                              className="float-right mr-2"
                              type="default"
                              onClick={ () => {
                                this.setState({reOrderingEnabled: true})
                              }}
                            >
                              Change Order
                            </Button>
                          )
                        }
                      </Col>
                    </Row>
                    {
                      this.state.reOrderingEnabled
                      ? (
                        <SortableRuleList items={this.state.curRules} onSortEnd={this.onRulesSortEnd} />
                      )
                      : (
                        <Collapse onChange={this.handleRuleItemActivePanelChange}>
                          {this.getRulesFileContentItems()}
                        </Collapse>
                      )
                    }
                </Card>
              )
              : (
                <Card style={{minHeight: '300px'}}>
                  <Row className="mt-4">
                    <Col span={24} style={{textAlign: 'center'}}>
                      <Title level={4}>Please select a file</Title>
                    </Col>
                  </Row>
                </Card>
              )
            }
            </Col>
            <Col span={8} className="pl-2">
              <Card>
                <div className="d-flex justify-content-between">
                  <Button
                    className="mr-4"
                    type="primary"
                    onClick={() => {this.setState({ mode: 'newFile'})}}
                  >
                    New Rules File
                  </Button>
                  {
                    this.state.selectedRuleFile
                    ? (
                      <Button
                        onClick={this.handleRuleFileSetActive}
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
                        type="primary"
                        danger
                        onClick={this.handleRuleFileDelete}
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
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            this.setState({ mode: null})
                          }
                        }}
                        onPressEnter={newFileCreateConfirm}
                      />
                    </td>
                    <td>
                      <Button
                        className="float-right"
                        onClick={newFileCreateConfirm}
                      >
                        <CheckOutlined />
                      </Button>
                    </td>
                    <td>
                      <Button
                        className="float-right"
                        onClick={() => {this.setState({ mode: null})}}
                      >
                        <CloseOutlined />
                      </Button>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                  )
                  : null
                }
                <Row className="pt-0 pt-md-4">
                  <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={[this.state.selectedRuleFile]}
                    onSelect={this.handleRuleFileSelect}
                  >
                    {this.getRulesFilesItems()}
                  </Menu>
                </Row>
              </Card>
            </Col>
          </Row>
      </>
    );
  }
}

export default RulesForward;
