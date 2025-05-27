/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';

import { Input, Menu, Row, Col, Button, Card, Collapse, Modal, message, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import axios from 'axios';
import RulesEditor from './RuleEditor';
import RuleViewer from './RuleViewer';
import ResponseRulesService from '../../services/rules/response';
import { getConfig } from '../../utils/getConfig';
import SortableList from '../../components/SortableList';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import fileDownload from 'js-file-download';
import { buildFileSelector, readFileAsync } from '../../utils/fileSelector';

const ResponseRulesServiceObj = new ResponseRulesService();
const { Panel } = Collapse;
const { Title } = Typography;

class RulesResponse extends React.Component {
    constructor() {
        super();
        this.state = {
            responseRulesFiles: [],
            activeRulesFile: null,
            selectedRuleFile: null,
            curRules: [],
            editRule: null,
            mode: null,
            reOrderingEnabled: false,
            curRulesUpdated: false,
        };
    }

    componentDidMount() {
        this.getResponseRulesFiles();
        this.specFilesSelector = buildFileSelector();
        this.specFilesSelector.addEventListener('input', async e => {
            if(e.target.files) {
                const file = e.target.files[0];
                await this.handleImport(file);
                this.getResponseRulesFiles(file.name);
                this.specFilesSelector.value = null;
            }
        });
    }

    getResponseRulesFiles = async (selectedRuleFile = null) => {
        message.loading({ content: 'Getting rules files...', key: 'getFilesProgress' });
        const responseData = await ResponseRulesServiceObj.fetchResponseRulesFiles();
        if(responseData) {
            const activeRulesFile = responseData.activeRulesFile;
            await this.setState({ responseRulesFiles: responseData.files, activeRulesFile });
            message.success({ content: 'Loaded', key: 'getFilesProgress', duration: 1 });
            if(selectedRuleFile) {
                await this.setState({ selectedRuleFile, ruleItemActive: null });
            } else {
                await this.setState({ selectedRuleFile: activeRulesFile, ruleItemActive: null });
            }
        }
        this.updateRulesFileDisplay();
    };

    getResponseRulesFileContent = async ruleFile => {
        const curRules = await ResponseRulesServiceObj.fetchResponseRulesFileContent(ruleFile);
        await this.setState({ curRules });
    };

    getRulesFilesItems = () => {
        return this.state.responseRulesFiles.map(ruleFile => {
            const isActive = (ruleFile === this.state.activeRulesFile);
            return {
                key: ruleFile,
                label: <>{isActive ? (<CheckOutlined />) : ''} {ruleFile}</>,
            };
        });
    };

    handleImport = async file_to_read => {
        message.loading({ content: 'Importing ...', key: 'importProgress' });
        try {
            const { apiBaseUrl } = getConfig();
            await axios.post(apiBaseUrl + '/api/rules/files/response/import',
                { buffer: Buffer.from(await readFileAsync(file_to_read, 'readAsArrayBuffer')) },
                { params: { rulesFilename: file_to_read.name }, headers: { 'Content-Type': 'application/json' } });
            message.success({ content: 'Import completed', key: 'importProgress', duration: 2 });
        } catch (err) {
            message.error({ content: err.response ? err.response.data : err.message, key: 'importProgress', duration: 6 });
        }
    };

    handleExport = async () => {
        message.loading({ content: 'Export response rules...', key: 'exportFileProgress' });
        try {
            let data;
            const { apiBaseUrl } = getConfig();
            const exportRulesResponse = await axios.get(apiBaseUrl + `/api/rules/files/response/${this.state.selectedRuleFile}/export`);
            data = Buffer.from(Buffer.from(exportRulesResponse.data.body.buffer.data));
            const parsedMessage = JSON.stringify(JSON.parse(data), null, 2);
            fileDownload(parsedMessage, this.state.selectedRuleFile);
            message.success({ content: 'Export response rules', key: 'exportFileProgress', duration: 2 });
        } catch (err) {
            message.error({ content: err.response ? err.response.data : err.message, key: 'exportFileProgress', duration: 6 });
        }
    };

    handleRuleFileSelect = async selectedItem => {
        const selectedRuleFile = selectedItem.key;
        await this.setState({ selectedRuleFile, ruleItemActive: null });
        this.updateRulesFileDisplay();
    };

    updateRulesFileDisplay = () => {
        this.getResponseRulesFileContent(this.state.selectedRuleFile);
    };

    getRulesFileContentItems = () => {
        return this.state.curRules.map((rule, key) => {
            return {
                key: key,
                label: rule.description,
                children: (
                    <>
                        <Row>
                            <Col span={24} style={{ textAlign: 'right' }}>
                                <Button
                                    onClick={this.handleRuleClick(rule)}
                                >
                Edit
                                </Button>
                                <Button
                                    className='ml-2'
                                    type='primary'
                                    danger
                                    onClick={this.handleRuleDelete(rule.ruleId)}
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
                    </>
                ),
            };
        });
    };

    handleRuleClick = (tRule = {}) => {
        // console.log(rule)
        return () => {
            this.setState({ editRule: tRule, mode: 'edit' });
        };
    };

    handleAddNewRuleClick = () => {
        // Calculate the new rule ID which is the next number of the highest rule ID in the list
        const highestRule = this.state.curRules.reduce((prevItem, item) => {
            return (prevItem.ruleId > item.ruleId ? prevItem : item);
        }, this.state.curRules[0]);

        let newRuleId = 1;
        if(highestRule) {
            newRuleId = highestRule.ruleId + 1;
        }

        const tRule = {
            ruleId: newRuleId,
            priority: 1,
        };

        this.setState({ editRule: tRule, mode: 'create' });
    };

    handleRuleCancelClick = () => {
        this.setState({ editRule: null });
    };

    handleRuleSave = async newRule => {
        const newRuleFull = {
            ruleId: this.state.editRule.ruleId,
            priority: this.state.editRule.priority,
            ...newRule,
        };

        let updatedRules = null;
        if(this.state.mode == 'create') {
            updatedRules = this.state.curRules.concat(newRuleFull);
        } else if(this.state.mode == 'edit') {
            updatedRules = this.state.curRules.map(item => {
                if(item.ruleId === newRuleFull.ruleId) {
                    return newRuleFull;
                } else {
                    return item;
                }
            });
        }

        if(updatedRules) {
            await this.updateRules({ editRule: null, curRules: updatedRules });
        }
    };

    updateRules = async newState => {
        message.loading({ content: 'Saving the rule...', key: 'ruleSaveProgress' });
        const { apiBaseUrl } = getConfig();
        await axios.put(apiBaseUrl + '/api/rules/files/response/' + this.state.selectedRuleFile, newState.curRules, { headers: { 'Content-Type': 'application/json' } });
        this.setState(newState);
        message.success({ content: 'Saved', key: 'ruleSaveProgress', duration: 2 });
    };

    onRulesSortEnd = ({ oldIndex, newIndex }) => {
        const newItems = arrayMove(this.state.curRules, oldIndex, newIndex);
        this.setState({ curRulesUpdated: true });
        this.setState({ curRules: newItems });
    };

    handleRuleDelete = ruleId => {
        return async () => {
            const updatedRules = this.state.curRules.filter(item => {
                return item.ruleId !== ruleId;
            });
            if(updatedRules) {
                message.loading({ content: 'Deleting rule...', key: 'deleteProgress' });
                ResponseRulesServiceObj.updateResponseRulesFileContent(this.state.selectedRuleFile, updatedRules);
                message.success({ content: 'Deleted', key: 'deleteProgress', duration: 2 });
                this.setState({ editRule: null, curRules: updatedRules });
            }
        };
    };

    handleNewRulesFileClick = async fileName => {
        message.loading({ content: 'Creating new file...', key: 'fileNewProgress' });
        const { apiBaseUrl } = getConfig();
        await axios.put(apiBaseUrl + '/api/rules/files/response/' + fileName);
        await this.getResponseRulesFiles();
        await this.setState({ selectedRuleFile: fileName, ruleItemActive: null });
        message.success({ content: 'Created', key: 'fileNewProgress', duration: 2 });
        this.updateRulesFileDisplay();
    };

    handleRuleFileDelete = async () => {
        try {
            message.loading({ content: 'Deleting file...', key: 'deleteFileProgress' });
            const { apiBaseUrl } = getConfig();
            await axios.delete(apiBaseUrl + '/api/rules/files/response/' + this.state.selectedRuleFile);
            await this.getResponseRulesFiles();
            await this.setState({ selectedRuleFile: null, ruleItemActive: null });
            message.success({ content: 'Deleted', key: 'deleteFileProgress', duration: 2 });
        } catch (err) {
            console.log(err);
            message.error({ content: err.response ? err.response.data.error : err.message, key: 'deleteFileProgress', duration: 6 });
        }
    };

    handleRuleFileSetActive = async () => {
        message.loading({ content: 'Activating rule file...', key: 'activateFileProgress' });
        const { apiBaseUrl } = getConfig();
        await axios.put(apiBaseUrl + '/api/rules/files/response', { type: 'activeRulesFile', fileName: this.state.selectedRuleFile }, { headers: { 'Content-Type': 'application/json' } });
        await this.getResponseRulesFiles();
        this.updateRulesFileDisplay();
        message.success({ content: 'Activated', key: 'activateFileProgress', duration: 2 });
    };

    render() {
        let newFileName = '';
        const newFileCreateConfirm = () => {
            // Validate filename format
            // TODO: Some additional validation for the filename format
            if(!newFileName.endsWith('.json')) {
                message.error('Filename should be ended with .json');
                return;
            }

            if(/\s/.test(newFileName)) {
                message.error('Filename contains spaces');
                return;
            }

            this.setState({ mode: null });
            this.handleNewRulesFileClick(newFileName);
        };

        return (
            <>
                <Modal
                    centered
                    destroyOnHidden
                    forceRender={false}
                    title='Rule Builder'
                    className='w-50 p-3'
                    open={!!this.state.editRule}
                    footer={null}
                    onCancel={this.handleRuleCancelClick}
                    maskClosable={false}
                >
                    <RulesEditor
                        rule={this.state.editRule}
                        onSave={this.handleRuleSave}
                        mode='response'
                    />
                </Modal>

                <Row>
                    <Col span={16}>
                        {
                            this.state.selectedRuleFile
                                ? (
                                    <Card>
                                        <Row className='align-items-center'>
                                            <Col span={12}>
                                                <h3>{this.state.selectedRuleFile}</h3>
                                            </Col>
                                            <Col span={12}>
                                                <Button
                                                    className='float-right'
                                                    type='primary'
                                                    onClick={this.handleAddNewRuleClick}
                                                >
                          Add a new Rule
                                                </Button>
                                                {
                                                    this.state.reOrderingEnabled
                                                        ? (
                                                            <Button
                                                                className='float-right mr-2'
                                                                type='dashed'
                                                                danger
                                                                onClick={async () => {
                                                                    if(this.state.curRulesUpdated) {
                                                                        await this.updateRules({ curRules: this.state.curRules });
                                                                    } else {
                                                                        message.error({ content: 'No changes found', key: 'ruleSaveProgress', duration: 2 });
                                                                    }
                                                                    this.setState({ curRulesUpdated: false });
                                                                    this.setState({ reOrderingEnabled: false });
                                                                }}
                                                            >
                              Apply Order
                                                            </Button>
                                                        )
                                                        : (
                                                            <Button
                                                                className='float-right mr-2'
                                                                type='default'
                                                                onClick={() => {
                                                                    this.setState({ reOrderingEnabled: true });
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
                                                    <SortableList
                                                        items={this.state.curRules.map((rule, index) => ({
                                                            ...rule,
                                                            id: rule.ruleId || `rule-${index}`,
                                                        }))}
                                                        onSortEnd={this.onRulesSortEnd}
                                                        renderItem={item => ({
                                                            key: item.id,
                                                            label: item.description,
                                                            children: null,
                                                        })}
                                                    />
                                                )
                                                : (
                                                    <Collapse 
                                                        onChange={this.handleRuleItemActivePanelChange}
                                                        items={this.getRulesFileContentItems()}
                                                    />
                                                )
                                        }
                                    </Card>
                                )
                                : (
                                    <Card style={{ minHeight: '300px' }}>
                                        <Row className='mt-4'>
                                            <Col span={24} style={{ textAlign: 'center' }}>
                                                <Title level={4}>Please select a file</Title>
                                            </Col>
                                        </Row>
                                    </Card>
                                )
                        }
                    </Col>
                    <Col span={8} className='pl-2'>
                        <Card>
                            <div className='d-flex justify-content-between mb-2 '>
                                <Button
                                    className='mr-2'
                                    type='primary'
                                    onClick={() => {
                                        this.specFilesSelector.click();
                                    }}
                                >
                  Import rules
                                </Button>
                                {
                                    this.state.selectedRuleFile
                                        ? (
                                            <Button
                                                className='mr-2'
                                                type='primary'
                                                onClick={this.handleExport}
                                            >
                          Export rules
                                            </Button>
                                        )
                                        : null
                                }
                            </div>
                            <div className='d-flex justify-content-between'>
                                <Button
                                    className='mr-4'
                                    type='primary'
                                    onClick={() => { this.setState({ mode: 'newFile' }); }}
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
                                                className='float-right'
                                                type='primary'
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
                                (this.state.mode === 'newFile')
                                    ? (
                                        <table className='mt-2'>
                                            <tbody>
                                                <tr><td>
                                                    <Input
                                                        placeholder='File Name'
                                                        type='text'
                                                        onChange={e => { newFileName = e.target.value; }}
                                                        onKeyDown={e => {
                                                            if(e.key === 'Escape') {
                                                                this.setState({ mode: null });
                                                            }
                                                        }}
                                                        onPressEnter={newFileCreateConfirm}
                                                    />
                                                </td>
                                                <td>
                                                    <Button
                                                        className='float-right'
                                                        onClick={newFileCreateConfirm}
                                                    >
                                                        <CheckOutlined />
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Button
                                                        className='float-right'
                                                        onClick={() => { this.setState({ mode: null }); }}
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
                            <Row className='pt-0 pt-md-4'>
                                <Menu
                                    mode='inline'
                                    theme='light'
                                    selectedKeys={[this.state.selectedRuleFile]}
                                    onSelect={this.handleRuleFileSelect}
                                    items={this.getRulesFilesItems()}
                                >
                                </Menu>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default RulesResponse;
