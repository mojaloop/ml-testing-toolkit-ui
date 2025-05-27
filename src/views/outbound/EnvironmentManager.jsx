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
import { getConfig, getUserConfig } from '../../utils/getConfig';
import axios from 'axios';
import { LocalDB } from '../../services/localDB/LocalDB';
import InputValues from './InputValues';
import TemplateOptions from './TemplateOptions';
import _ from 'lodash';

import { Row, Col, Table, Button, message, Input, Dropdown, Menu, Collapse, Popover, Tabs } from 'antd';
import { DownOutlined, FileOutlined } from '@ant-design/icons';
const { TabPane } = Tabs;
const { Panel } = Collapse;

const DEFAULT_OPTIONS = {
    breakOnError: false,
    transformerName: 'none',
    generateIDType: 'ulid',
};

function download(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

class EnvironmentManager extends React.Component {
    apiBaseUrl = null;

    DEFAULT_ENVIRONMENT_FILE_NAME = 'hub_local_environment.json';

    constructor() {
        super();
        const { apiBaseUrl } = getConfig();
        this.apiBaseUrl = apiBaseUrl;
    }

    state = {
        serverEnvironments: [],
        localEnvironments: [],
        selectedEnvironmentIndex: null,
        renameEnvironmentNewName: '',
        renameEnvironementDialogVisible: false,
        environmentOptionsVisible: false,
    };

    getServerEnvironments = async () => {
        const response = await axios.get(this.apiBaseUrl + '/api/samples/list/environments');
        return response.data && response.data.body;
    };

    componentDidMount = async () => {
        const userConfig = getUserConfig();
        this.DEFAULT_ENVIRONMENT_FILE_NAME = userConfig && userConfig.DEFAULT_ENVIRONMENT_FILE_NAME;

        await this.refreshServerEnvironments();
        await this.refreshLocalEnvironments();
        await this.invokeAutoEnvironmentDowloader();
        this.environmentFileSelector = document.createElement('input');
        this.environmentFileSelector.setAttribute('type', 'file');
        this.environmentFileSelector.addEventListener('input', e => {
            if(e.target.files) {
                this.handleImportEnvironmentFile(e.target.files[0]);
                this.environmentFileSelector.value = null;
            }
        });
        this.notifyChangeEnvironment();
        this.startAutoSaveTimer();
    };

    autoSave = false;

    autoSaveIntervalId = null;

    startAutoSaveTimer = () => {
        this.autoSaveIntervalId = setInterval(() => {
            if(this.autoSave) {
                this.autoSave = false;
                this.saveLocalEnvironments();
            }
        },
        2000);
    };

    componentWillUnmount = () => {
        if(this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
        }
    };

    refreshServerEnvironments = async () => {
        const serverEnvironments = await this.getServerEnvironments();
        await this.setState({ serverEnvironments });
    };

    refreshLocalEnvironments = async () => {
        const storedEnvironmentFilesRaw = await LocalDB.getItem('environmentFiles');
        if(storedEnvironmentFilesRaw) {
            try {
                await this.setState({ localEnvironments: JSON.parse(storedEnvironmentFilesRaw) });
            } catch (err) { }
        }
        const storedEnvironmentSelectedIndex = await LocalDB.getItem('environmentFilesSelectedIndex');
        if(storedEnvironmentSelectedIndex && storedEnvironmentSelectedIndex >= 0) {
            this.changeSelectedEnvironmentIndex(+storedEnvironmentSelectedIndex);
        } else {
            await this.setState({ environmentOptionsVisible: true });
        }
    };

    invokeAutoEnvironmentDowloader = async () => {
        if(this.state.selectedEnvironmentIndex === null) {
            const foundK8sEnv = this.state.serverEnvironments.findIndex(item => item.name.endsWith(this.DEFAULT_ENVIRONMENT_FILE_NAME));
            if(foundK8sEnv >= 0) {
                this.handleServerEnvironmentImport(foundK8sEnv);
            }
        }
    };

    saveLocalEnvironments = async () => {
        await LocalDB.setItem('environmentFiles', JSON.stringify(this.state.localEnvironments));
        await LocalDB.setItem('environmentFilesSelectedIndex', this.state.selectedEnvironmentIndex);
    };

    handleImportServer = () => {
        // this.refreshServerEnvironments()
        // console.log('Handle import server')
    };

    handleServerEnvironmentImport = async key => {
        if(this.state.serverEnvironments[key]) {
            const environmentFileName = this.state.serverEnvironments[key].name;
            const resp = await axios.get(this.apiBaseUrl + '/api/samples/load', {
                params: {
                    environment: environmentFileName,
                },
            });
            if(resp.data && resp.data.body && resp.data.body.inputValues) {
                this.addLocalEnvironment(environmentFileName, resp.data.body.inputValues, resp.data.body.options);
                this.changeSelectedEnvironmentIndex(this.state.localEnvironments.length - 1);
            }
        }
    };

    addLocalEnvironment = (environmentFileName, inputValues, options = {}) => {
        this.state.localEnvironments.push({
            name: environmentFileName,
            inputValues,
            options: _.merge(DEFAULT_OPTIONS, options),
        });
        this.autoSave = true;
        this.forceUpdate();
    };

    handleDeleteEnvironment = key => {
        this.state.localEnvironments.splice(key, 1);
        this.changeSelectedEnvironmentIndex(null);
        this.autoSave = true;
        this.forceUpdate();
    };

    handleDuplicateEnvironment = key => {
        const envCopy = JSON.parse(JSON.stringify(this.state.localEnvironments[key]));
        this.state.localEnvironments.push(envCopy);
        this.changeSelectedEnvironmentIndex(this.state.localEnvironments.length - 1);
        this.autoSave = true;
        this.forceUpdate();
    };

    handleRenameEnvironment = newName => {
        if(this.state.localEnvironments[this.state.selectedEnvironmentIndex]) {
            this.state.localEnvironments[this.state.selectedEnvironmentIndex].name = newName;
            this.autoSave = true;
            this.forceUpdate();
        }
    };

    handleDownloadEnvironment = key => {
        const contentObj = {
            inputValues: this.state.localEnvironments[key].inputValues,
            options: this.state.localEnvironments[key].options,
        };
        download(JSON.stringify(contentObj, null, 2), this.state.localEnvironments[key].name, 'text/plain');
    };

    handleImportEnvironmentFile = file_to_read => {
        message.loading({ content: 'Reading the file...', key: 'importFileProgress' });
        const fileRead = new FileReader();
        fileRead.onload = e => {
            const content = e.target.result;
            try {
                const templateContent = JSON.parse(content);
                if(templateContent.inputValues) {
                    this.addLocalEnvironment(file_to_read.name, templateContent.inputValues, templateContent.options);
                    message.success({ content: 'Environment Loaded', key: 'importFileProgress', duration: 2 });
                } else {
                    message.error({ content: 'Input Values not found in the file', key: 'importFileProgress', duration: 2 });
                }
            } catch (err) {
                message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
            }
        };
        fileRead.readAsText(file_to_read);
    };

    handleInputValuesChange = (name, value) => {
        this.state.localEnvironments[this.state.selectedEnvironmentIndex].inputValues[name] = value;
        this.notifyChangeEnvironment();
        this.autoSave = true;
        this.forceUpdate();
    };

    handleOptionsChange = (name, value) => {
        this.state.localEnvironments[this.state.selectedEnvironmentIndex].options[name] = value;
        this.notifyChangeEnvironment();
        this.autoSave = true;
        this.forceUpdate();
    };

    handleInputValuesDelete = name => {
        delete this.state.localEnvironments[this.state.selectedEnvironmentIndex].inputValues[name];
        this.notifyChangeEnvironment();
        this.autoSave = true;
        this.forceUpdate();
    };

    changeSelectedEnvironmentIndex = newIndex => {
        this.state.selectedEnvironmentIndex = newIndex;
        this.autoSave = true;
        this.setState({ selectedEnvironmentIndex: newIndex });
        this.notifyChangeEnvironment();
    };

    notifyChangeEnvironment = () => {
        if(this.state.localEnvironments[this.state.selectedEnvironmentIndex]) {
            this.props.onChange(this.state.localEnvironments[this.state.selectedEnvironmentIndex]);
        }
    };

    render() {
        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                this.changeSelectedEnvironmentIndex(selectedRowKeys[0]);
            },
            selectedRowKeys: [this.state.selectedEnvironmentIndex],
        };

        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
            },
            {
                title: '# of Values',
                dataIndex: 'valuesCount',
            },
        ];

        const data = this.state.localEnvironments.map((item, index) => {
            return {
                key: index,
                name: item.name,
                valuesCount: Object.entries(item.inputValues).length,
            };
        });

        const getMenuItems = () => {
            return this.state.serverEnvironments.map((item, index) => {
                return (
                    <Menu.Item key={index} icon={<FileOutlined />}>
                        {item.name}
                    </Menu.Item>
                );
            });
        };

        const menu = (
            <Menu
                onClick={menuItem => this.handleServerEnvironmentImport(menuItem.key)}
            >
                {getMenuItems()}
            </Menu>
        );

        const getRenameDialogContent = () => {
            return (
                <>
                    <Row>
                        <Col>
                            <Input
                                placeholder='File name'
                                type='text'
                                value={this.state.renameEnvironmentNewName}
                                onChange={e => { this.setState({ renameEnvironmentNewName: e.target.value }); }}
                                onKeyDown={e => {
                                    if(e.key === 'Escape') {
                                        this.setState({ renameEnvironementDialogVisible: false });
                                    }
                                }}
                                onPressEnter={() => {
                                    this.handleRenameEnvironment(this.state.renameEnvironmentNewName);
                                    this.setState({ renameEnvironementDialogVisible: false });
                                }}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Button
                                className='text-right mt-2'
                                color='success'
                                href='#pablo'
                                onClick={() => {
                                    this.handleRenameEnvironment(this.state.renameEnvironmentNewName);
                                    this.setState({ renameEnvironementDialogVisible: false });
                                }}
                                size='sm'
                            >
                Save
                            </Button>
                        </Col>
                    </Row>
                </>
            );
        };

        return (
            <>
                {/* Page content */}
                <Row className='mt--7 mb-4'>
                    <Col span={24}>
                        <Collapse
                            activeKey={this.state.environmentOptionsVisible ? ['1'] : []}
                            onChange={key => {
                                this.setState({ environmentOptionsVisible: (key[0] == 1) });
                            }}
                            items={[
                                {
                                    key: '1',
                                    label: this.state.localEnvironments[this.state.selectedEnvironmentIndex] ? this.state.localEnvironments[this.state.selectedEnvironmentIndex].name : 'Choose environment',
                                    children: (
                                        <>
                                            <Row>
                                                <Col span={24}>
                                                    <Button
                                                        type='default'
                                                        info
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            this.environmentFileSelector.click();
                                                        }}
                                                    >
                                  Import File
                                                    </Button>
                                                    <Button
                                                        className='ml-2'
                                                        type='primary'
                                                        onClick={() => {
                                                            this.handleDownloadEnvironment(this.state.selectedEnvironmentIndex);
                                                        }}
                                                        disabled={this.state.selectedEnvironmentIndex === null}
                                                    >
                                  Download
                                                    </Button>
                                                    <Dropdown
                                                        className='ml-2 float-right'
                                                        zIndex={1101}
                                                        overlay={menu}
                                                        trigger={['click']}
                                                        onVisibleChange={visible => {
                                                            if(visible) {
                                                                this.handleImportServer();
                                                            }
                                                        }}
                                                    >
                                                        <Button
                                                            type='primary'
                                                            shape='round'
                                                            danger
                                                        >
                                    Import from Server <DownOutlined />
                                                        </Button>
                                                    </Dropdown>
                                                </Col>
                                            </Row>
                                            <Row className='mt-2'>
                                                <Col span={24}>
                                                    <Button
                                                        type='primary'
                                                        danger
                                                        onClick={() => {
                                                            this.handleDeleteEnvironment(this.state.selectedEnvironmentIndex);
                                                            this.changeSelectedEnvironmentIndex(null);
                                                        }}
                                                        disabled={this.state.selectedEnvironmentIndex === null}
                                                    >
                                  Delete
                                                    </Button>
                                                    <Button
                                                        className='ml-2'
                                                        type='dashed'
                                                        onClick={() => {
                                                            this.handleDuplicateEnvironment(this.state.selectedEnvironmentIndex);
                                                        }}
                                                        disabled={this.state.selectedEnvironmentIndex === null}
                                                    >
                                  Duplicate
                                                    </Button>
                                                    <Popover
                                                        content={getRenameDialogContent()}
                                                        title='Enter new name'
                                                        trigger='click'
                                                        open={this.state.renameEnvironementDialogVisible}
                                                        zIndex={1101}
                                                        onOpenChange={visible => {
                                                            if(visible) {
                                                                this.setState({ renameEnvironmentNewName: this.state.localEnvironments[this.state.selectedEnvironmentIndex] && this.state.localEnvironments[this.state.selectedEnvironmentIndex].name });
                                                            }
                                                            this.setState({ renameEnvironementDialogVisible: visible });
                                                        }}
                                                    >
                                                        <Button
                                                            className='ml-2'
                                                            type='default'
                                                            disabled={this.state.selectedEnvironmentIndex === null}
                                                        >
                                    Rename
                                                        </Button>
                                                    </Popover>
                                                </Col>
                                            </Row>
                                            <Row className='mt-2'>
                                                <Col span={24}>
                                                    <Table
                                                        rowSelection={{
                                                            type: 'radio',
                                                            ...rowSelection,
                                                        }}
                                                        columns={columns}
                                                        dataSource={data}
                                                        pagination={false}
                                                    />
                                                </Col>
                                            </Row>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <Tabs 
                            defaultActiveKey='1' 
                            type='card'
                            items={[
                                {
                                    key: '1',
                                    label: 'Input Values',
                                    children: this.state.localEnvironments[this.state.selectedEnvironmentIndex]
                                        ? <InputValues values={this.state.localEnvironments[this.state.selectedEnvironmentIndex] ? this.state.localEnvironments[this.state.selectedEnvironmentIndex].inputValues : {}} onChange={this.handleInputValuesChange} onDelete={this.handleInputValuesDelete} />
                                        : null,
                                },
                                {
                                    key: '2',
                                    label: 'Options',
                                    children: this.state.localEnvironments[this.state.selectedEnvironmentIndex]
                                        ? <TemplateOptions values={this.state.localEnvironments[this.state.selectedEnvironmentIndex] ? this.state.localEnvironments[this.state.selectedEnvironmentIndex].options : {}} onChange={this.handleOptionsChange} />
                                        : null,
                                    theme: {
                                        token: {
                                            // Seed Token
                                            colorPrimary: '#00b96b',
                                            cardBg: 'red',
                                        },
                                    },
                                },
                            ]}
                        />
                    </Col>
                </Row>
            </>
        );
    }
}

export default EnvironmentManager;
