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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import _ from 'lodash';

import { Input, Checkbox, Divider, Tooltip, message, Row, Col, Typography, Button, Modal, Table, Select, Tabs, Card } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';

import 'antd/dist/antd.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from 'axios';
import { getConfig, getServerConfig } from '../../utils/getConfig';
import FileDownload from 'js-file-download';
import TokenFetcher from './TokenFetcher';

const { Text } = Typography;

function buildFileSelector(multi = false) {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    return fileSelector;
}

const readFileAsync = (file, type) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        switch (type) {
            case 'readAsArrayBuffer':
                reader.readAsArrayBuffer(file);
                break;
            default:
                reader.readAsText(file);
        }
    });
};

class ParamInput extends React.Component {
    inputValue = null;

    handleValueChange = event => {
        if((typeof this.props.value) === 'boolean') {
            this.inputValue = event.target.checked;
        } else if((typeof this.props.value) === 'number') {
            this.inputValue = +event.target.value;
        } else {
            this.inputValue = event.target.value;
        }
        this.props.onChange(this.props.itemRef, this.props.itemKey, this.inputValue);
    };

    render() {
        const inputElement = (
            (typeof this.props.value) === 'boolean'
                ? (
                    <Checkbox checked={this.props.value} onChange={this.handleValueChange} />
                )
                : (
                    <Input
                        className='form-control-alternative'
                        type='text'
                        defaultValue={this.props.value}
                        value={this.props.value}
                        onChange={this.handleValueChange}
                        disabled={false}
                    />
                )
        );

        if(this.props.value !== undefined || _.isBoolean(this.props.value)) {
            return (
                <>
                    <Divider />
                    <Row className='mb-4'>
                        <Col span={8}>
                            <Text strong>{this.props.name}</Text>&nbsp;
                            {
                                this.props.tooltip
                                    ? (
                                        <Tooltip placement='topLeft' title={this.props.tooltip}>
                                            <QuestionCircleTwoTone style={{ fontSize: '18px' }} />
                                        </Tooltip>
                                    )
                                    : null
                            }
                        </Col>
                        <Col span={16}>
                            {inputElement}
                        </Col>
                    </Row>
                </>
            );
        } else {
            return null;
        }
    }
}

class EndpointInput extends React.Component {
    inputValue = null;

    handleValueChange = event => {
        this.inputValue = event.target.value;
        this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.value);
    };

    render() {
        const inputElement = (
            <Input
                className='form-control-alternative'
                type='text'
                defaultValue={this.props.value}
                value={this.props.value}
                onChange={event => {
                    this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.value);
                }}
                disabled={false}
            />
        );

        return (
            <Tooltip placement='topLeft' title={this.props.tooltip}>{inputElement}</Tooltip>
        );
    }
}

class CallbackResourceEndpointsInput extends React.Component {
    inputValue = null;

    handleValueChange = event => {
        this.inputValue = event.target.checked;
        this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.checked);
    };

    render() {
        if(this.props.config.CALLBACK_RESOURCE_ENDPOINTS) {
            const inputElement = (
                <Checkbox checked={this.props.value} onChange={this.handleValueChange} />
            );
            return (
                <>
                    <Divider />
                    <Row className='mb-4'>
                        <Col span={8}>
                            <Text strong>{this.props.name}</Text>
                        </Col>
                        <Col span={2}>
                            {
                                this.props.tooltip
                                    ? (
                                        <Tooltip placement='topLeft' title={this.props.tooltip}>{inputElement}</Tooltip>
                                    )
                                    : inputElement
                            }
                        </Col>
                        <Col span={2}>
                            <CallBackResourceEndpoints config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.props.handleParamValueChange} handleSave={this.props.handleSave} />
                        </Col>
                    </Row>
                </>
            );
        } else {
            return null;
        }
    }
}

class DFSPWiseEndpointsInput extends React.Component {
    render() {
        if(this.props.config.ENDPOINTS_DFSP_WISE) {
            return (
                <>
                    <Divider />
                    <Row className='mb-4'>
                        <Col span={8}>
                            <Text strong>{this.props.name}</Text>
                        </Col>
                        <Col span={2}>
                            <DFSPWiseEndpoints config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.props.handleParamValueChange} handleSave={this.props.handleSave} />
                        </Col>
                    </Row>
                </>
            );
        } else {
            return null;
        }
    }
}

class ConfigurationEditor extends React.Component {
    constructor() {
        super();
        this.state = {
            exportDialogVisible: false,
            importDialogVisible: false,
            importExportOptions: {
                rules_response: 'Sync Response Rules',
                rules_validation: 'Validation Rules (Error callbacks)',
                rules_callback: 'Callback Rules (Success Callback)',
                'user_config.json': 'Settings',
            },
            exportSelectedRowKeys: [],
            importSelectedRowKeys: [],
        };
    }

    componentDidMount() {
        this.specFilesSelector = buildFileSelector();
        this.specFilesSelector.addEventListener('input', async e => {
            if(e.target.files) {
                await this.handleImport(e.target.files[0]);
                await this.props.doRefresh();
                this.specFilesSelector.value = null;
            }
        });
    }

    handleParamValueChange = (itemRef, name, value) => {
        itemRef[name] = value;
        this.forceUpdate();
    };

    handleSave = () => {
        this.props.onSave(this.props.config);
    };

    handleImport = async file_to_read => {
        message.loading({ content: 'Importing ...', key: 'importProgress' });
        try {
            const { apiBaseUrl } = getConfig();
            if(this.state.importSelectedRowKeys.length === 1 && this.state.importSelectedRowKeys[0] === 'user_config.json' && file_to_read.name.endsWith('.json')) {
                const settings = JSON.parse(await readFileAsync(file_to_read));
                await axios.put(apiBaseUrl + '/api/config/user', settings, { headers: { 'Content-Type': 'application/json' } });
            } else {
                await axios.post(apiBaseUrl + '/api/settings/import',
                    { buffer: Buffer.from(await readFileAsync(file_to_read, 'readAsArrayBuffer')) },
                    { params: { options: this.state.importSelectedRowKeys }, headers: { 'Content-Type': 'application/json' } });
            }
            message.success({ content: 'Import completed', key: 'importProgress', duration: 2 });
        } catch (err) {
            message.error({ content: err.response ? err.response.data : err.message, key: 'importProgress', duration: 6 });
        }
        this.setState({ importSelectedRowKeys: [] });
    };

    handleExport = async () => {
        message.loading({ content: 'Export all rules and settings...', key: 'exportFileProgress' });
        try {
            let filename;
            let data;
            if(this.state.exportSelectedRowKeys.length === 1 && this.state.exportSelectedRowKeys[0] === 'user_config.json') {
                filename = `user_config_${new Date().toISOString()}.json`;
                data = JSON.stringify(this.props.config, null, 2);
            } else {
                const { apiBaseUrl } = getConfig();
                const exportRulesResponse = await axios.get(apiBaseUrl + '/api/settings/export', { params: { options: this.state.exportSelectedRowKeys } });
                filename = `${exportRulesResponse.data.body.namePrefix}_${new Date().toISOString()}.zip`;
                data = Buffer.from(Buffer.from(exportRulesResponse.data.body.buffer.data));
            }
            FileDownload(data, filename);
            message.success({ content: 'Export rules and settings completed', key: 'exportFileProgress', duration: 2 });
        } catch (err) {
            message.error({ content: err.response ? err.response.data : err.message, key: 'exportFileProgress', duration: 6 });
        }
    };

    generageTableRowData = obj => {
        const options = [];
        Object.keys(obj).forEach(element => {
            options.push({ key: element, option: obj[element] });
        });
        return options;
    };

    render() {
        return (
            <>
                <Row>
                    <Col className='mb-5' span={24}>
                        <Row className='mb-2'>
                            <Col span={24}>
                                <div className='d-flex float-right'>
                                    <Button
                                        className='mr-2' onClick={e => {
                                            this.setState({ exportDialogVisible: true });
                                        }}
                                    >
                    Export
                                    </Button>
                                    {
                                        this.state.exportDialogVisible
                                            ? <Modal
                                                title='Export'
                                                visible={this.state.exportDialogVisible}
                                                width='50%'
                                                onOk={async () => {
                                                    if(this.state.exportSelectedRowKeys.length !== 0) {
                                                        await this.handleExport();
                                                        this.setState({ exportDialogVisible: false });
                                                        this.setState({ exportSelectedRowKeys: [] });
                                                    } else {
                                                        message.error({ content: 'please select at least one option', key: 'importEmptySelection', duration: 6 });
                                                    }
                                                }}
                                                onCancel={() => {
                                                    this.setState({ exportDialogVisible: false });
                                                    this.setState({ exportSelectedRowKeys: [] });
                                                }}
                                            >
                                                <Table
                                                    rowSelection={{
                                                        type: 'checkbox',
                                                        selectedRowKeys: this.state.exportSelectedRowKeys,
                                                        onChange: selectedRowKeys => {
                                                            this.setState({ exportSelectedRowKeys: selectedRowKeys });
                                                        },
                                                    }}
                                                    columns={[{ title: 'Select all', dataIndex: 'option' }]}
                                                    dataSource={this.generageTableRowData(this.state.importExportOptions)}
                                                />
                                            </Modal>
                                            : null
                                    }
                                    <Button
                                        color='info' className='mr-2' size='sm' onClick={e => {
                                            this.setState({ importDialogVisible: true });
                                        }}
                                    >
                    Import
                                    </Button>
                                    {
                                        this.state.importDialogVisible
                                            ? <Modal
                                                title='Import'
                                                visible={this.state.importDialogVisible}
                                                width='50%'
                                                onOk={() => {
                                                    if(this.state.importSelectedRowKeys.length !== 0) {
                                                        this.specFilesSelector.click();
                                                        this.setState({ importDialogVisible: false });
                                                    } else {
                                                        message.error({ content: 'please select at least one option', key: 'importEmptySelection', duration: 6 });
                                                    }
                                                }}
                                                onCancel={() => {
                                                    this.setState({ importSelectedRowKeys: [] });
                                                    this.setState({ importDialogVisible: false });
                                                }}
                                            >
                                                <Table
                                                    rowSelection={{
                                                        type: 'checkbox',
                                                        selectedRowKeys: this.state.importSelectedRowKeys,
                                                        onChange: selectedRowKeys => {
                                                            this.setState({ importSelectedRowKeys: selectedRowKeys });
                                                        },
                                                    }}
                                                    columns={[{ title: 'Select all', dataIndex: 'option' }]}
                                                    dataSource={this.generageTableRowData(this.state.importExportOptions)}
                                                />
                                            </Modal>
                                            : null
                                    }
                                    <Button
                                        type='primary'
                                        danger
                                        href='#pablo'
                                        onClick={this.handleSave}
                                    >
                    Save
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Card>
                                    <ParamInput name='Callback URL' itemRef={this.props.config} itemKey='CALLBACK_ENDPOINT' value={this.props.config.CALLBACK_ENDPOINT} onChange={this.handleParamValueChange} />
                                    <ParamInput name='FSP ID' itemRef={this.props.config} itemKey='FSPID' value={this.props.config.FSPID} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Send Callback' itemRef={this.props.config} itemKey='SEND_CALLBACK_ENABLE' value={this.props.config.SEND_CALLBACK_ENABLE} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Enable Version Negotiation Support' itemRef={this.props.config} itemKey='VERSIONING_SUPPORT_ENABLE' value={this.props.config.VERSIONING_SUPPORT_ENABLE} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Validate Transfers with previous quote' itemRef={this.props.config} itemKey='TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES' value={this.props.config.TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Validate IlpPacket in transfers' itemRef={this.props.config} itemKey='TRANSFERS_VALIDATION_ILP_PACKET' value={this.props.config.TRANSFERS_VALIDATION_ILP_PACKET} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Validate Condition in transfers' itemRef={this.props.config} itemKey='TRANSFERS_VALIDATION_CONDITION' value={this.props.config.TRANSFERS_VALIDATION_CONDITION} onChange={this.handleParamValueChange} />
                                    <ParamInput name='ILP Secret' itemKey='ILP_SECRET' itemRef={this.props.config} value={this.props.config.ILP_SECRET} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Advanced Features' itemRef={this.props.config} itemKey='ADVANCED_FEATURES_ENABLED' value={this.props.config.ADVANCED_FEATURES_ENABLED} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Default Request Timeout' tooltip='Default time to wait for the response of an outbound request' itemRef={this.props.config} itemKey='DEFAULT_REQUEST_TIMEOUT' value={this.props.config.DEFAULT_REQUEST_TIMEOUT} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Script Timeout' tooltip='Time to wait for the pre-request and post-request scripts in test execution' itemRef={this.props.config} itemKey='SCRIPT_TIMEOUT' value={this.props.config.SCRIPT_TIMEOUT} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Callback Timeout' tooltip='Time to wait for the callback in test execution' itemRef={this.props.config} itemKey='CALLBACK_TIMEOUT' value={this.props.config.CALLBACK_TIMEOUT} onChange={this.handleParamValueChange} />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card>
                                    <ParamInput name='Enable Hub Only Mode' itemRef={this.props.config} itemKey='HUB_ONLY_MODE' value={this.props.config.HUB_ONLY_MODE} onChange={this.handleParamValueChange} />
                                    <CallbackResourceEndpointsInput name='Enable Callback resource endpoints' itemRef={this.props.config.CALLBACK_RESOURCE_ENDPOINTS} itemKey='enabled' value={this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled} onChange={this.handleParamValueChange} config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.handleParamValueChange} handleSave={this.handleSave} />
                                    <DFSPWiseEndpointsInput name='DFSP Wise endpoints' itemRef={this.props.config.ENDPOINTS_DFSP_WISE} onChange={this.handleParamValueChange} config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.handleParamValueChange} handleSave={this.handleSave} />
                                    <ParamInput name='Enable Inbound JWS Validation' itemRef={this.props.config} itemKey='VALIDATE_INBOUND_JWS' value={this.props.config.VALIDATE_INBOUND_JWS} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Enable Inbound JWS Validation for PUT /parties' itemRef={this.props.config} itemKey='VALIDATE_INBOUND_PUT_PARTIES_JWS' value={this.props.config.VALIDATE_INBOUND_PUT_PARTIES_JWS} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Enable Outbound JWS Signing' itemRef={this.props.config} itemKey='JWS_SIGN' value={this.props.config.JWS_SIGN} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Enable Outbound JWS Signing for PUT /parties' itemRef={this.props.config} itemKey='JWS_SIGN_PUT_PARTIES' value={this.props.config.JWS_SIGN_PUT_PARTIES} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Connection Manager API URL' itemRef={this.props.config} itemKey='CONNECTION_MANAGER_API_URL' value={this.props.config.CONNECTION_MANAGER_API_URL} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Inbound Mutual TLS' itemRef={this.props.config} itemKey='INBOUND_MUTUAL_TLS_ENABLED' value={this.props.config.INBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
                                    <ParamInput name='Outbound Mutual TLS' itemRef={this.props.config} itemKey='OUTBOUND_MUTUAL_TLS_ENABLED' value={this.props.config.OUTBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
                                </Card>
                            </Col>

                        </Row>
                    </Col>
                </Row>
            </>
        );
    }
}

class CallBackResourceEndpoints extends React.Component {
    constructor() {
        super();
        this.state = {
            endpoints: false,
            endpointsLocal: {},
            endpointsInputs: [],
            endpointsColumns: [
                { title: 'method', dataIndex: 'method', key: 'method', width: '10%' },
                { title: 'path', dataIndex: 'path', key: 'path', width: '40%' },
                { title: 'endpoint', dataIndex: 'endpoint', key: 'endpoint', width: '40%' },
                {
                    dataIndex: '',
                    key: 'delete',
                    width: '10%',
                    render: (text, record) => (
                        <Button
                            type='primary' danger onClick={e => {
                                this.setState({
                                    endpointsLocal: this.state.endpointsLocal.filter((local, index) => {
                                        return (+record.key !== index);
                                    }),
                                });
                            }}
                        >Delete
                        </Button>
                    ),
                },
            ],
        };
    }

    componentDidMount() {}

    endpointsLocal = () => {
        const local = [];
        this.props.config.CALLBACK_RESOURCE_ENDPOINTS.endpoints.forEach(endpoint => {
            local.push({ ...endpoint });
        });
        return local;
    };

    endpointsInputs = () => {
        const inputs = [];
        this.state.endpointsLocal.forEach((endpoint, index) => {
            const endpointInputs = {};
            Object.keys(endpoint).forEach(key => {
                endpointInputs[key] = (
                    <>
                        {
                            (key === 'method')
                                ? <Select
                                    style={{ width: '100px' }} defaultValue='put' onChange={value => {
                                        this.props.handleParamValueChange(endpoint, key, value);
                                    }}
                                >
                                    <Select.Option value='put'>put</Select.Option>
                                </Select>
                                : <EndpointInput itemRef={endpoint} itemKey={key} value={endpoint[key]} onChange={this.props.handleParamValueChange} />
                        }
                    </>
                );
            });
            inputs.push({ key: index + '', ...endpointInputs });
        });
        return inputs;
    };

    render() {
        return (
            <>
                {
                    this.props.config.CALLBACK_RESOURCE_ENDPOINTS && this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled
                        ? <>
                            <Button
                                color='info' size='sm' onClick={e => {
                                    this.setState({ endpointsLocal: this.endpointsLocal() });
                                    this.setState({ endpointsVisible: true });
                                }}
                            >
                Edit
                            </Button>
                            {
                                this.state.endpointsVisible
                                    ? <Modal
                                        title='Edit Callback resources endpoints'
                                        visible={this.state.endpointsVisible}
                                        width='70%'
                                        onOk={() => {
                                            this.props.config.CALLBACK_RESOURCE_ENDPOINTS.endpoints = this.state.endpointsLocal;
                                            if(!this.props.configRuntime.CALLBACK_RESOURCE_ENDPOINTS.enabled) {
                                                this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled = true;
                                            }
                                            this.props.handleSave();
                                            this.setState({ endpointsVisible: false });
                                        }}
                                        onCancel={() => {
                                            this.setState({ endpointsVisible: false });
                                        }}
                                    >
                                        <Row>
                                            <Col>
                                                <Button
                                                    type='primary' onClick={e => {
                                                        const newEndpoint = { method: 'put', path: null, endpoint: null };
                                                        this.setState({ endpointsLocal: [...this.state.endpointsLocal, newEndpoint] });
                                                    }}
                                                >Add Callback Resource Endpoint
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                <Table
                                                    columns={this.state.endpointsColumns}
                                                    dataSource={this.endpointsInputs()}
                                                />
                                            </Col>
                                        </Row>
                                    </Modal>
                                    : null
                            }
                        </>
                        : null
                }
            </>
        );
    }
}

class DFSPWiseEndpoints extends React.Component {
    constructor() {
        super();
        this.state = {
            endpointsLocal: {
                payer: {},
                payee: {},
            },
            dfspsEntries: {
                payer: '',
                payee: '',
            },
            dfsps: {
                payer: '',
                payee: '',
            },
            curRules: [],
        };
    }

    componentDidMount() {
    }

    updateRules = async () => {
        message.loading({ content: 'Saving the rule...', key: 'ruleSaveProgress' });
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(apiBaseUrl + '/api/rules/files/forward/default.json');
        if(response.data && Array.isArray(response.data)) {
            const rules = response.data;
            rules.forEach(rule => {
                const dfspId = Object.keys(this.state.endpointsLocal[rule.event.params.to])[0];
                rule.event.params.dfspId = dfspId;
                rule.conditions.all.forEach(condition => {
                    if(
                        (condition.fact === 'headers' && condition.path.toLowerCase() === 'fspiop-destination') ||
            (condition.fact === 'body' && condition.path === 'payeeFsp')
                    ) {
                        condition.value = dfspId;
                    }
                });
                if(rule.conditions.all.some(condition => condition.fact === 'operationPath' && condition.operator === 'equal' && condition.value === '/parties/{Type}/{ID}')) {
                    if(rule.conditions.all.some(condition => condition.fact === 'method' && condition.operator === 'equal' && condition.value === 'get')) {
                        const condition = rule.conditions.all.find(condition => condition.fact === 'headers' && condition.path.toLowerCase() === 'fspiop-source');
                        const newValue = rule.event.params.to === 'payer' ? this.state.dfsps.payee : this.state.dfsps.payer;
                        if(newValue) {
                            condition.value = newValue;
                        }
                    }
                }
            });
            await axios.put(apiBaseUrl + '/api/rules/files/forward/default.json', rules, { headers: { 'Content-Type': 'application/json' } });
        }
        message.success({ content: 'Saved', key: 'ruleSaveProgress', duration: 2 });
    };

    setDFSPWiseState = (local, dfspType, dfspId) => {
        const { endpoints, ...rest } = this.props.config.ENDPOINTS_DFSP_WISE.dfsps[dfspId];
        local[dfspType][dfspId] = { ...rest, endpoints: [] };
        this.state.dfspsEntries[dfspType] = dfspId;
        this.state.dfsps[dfspType] = dfspId;
        endpoints.forEach(endpoint => {
            local[dfspType][dfspId].endpoints.push({ ...endpoint });
        });
    };

    endpointsLocal = () => {
        const dfsps = Object.keys(this.props.config.ENDPOINTS_DFSP_WISE.dfsps);
        const local = {
            payer: {},
            payee: {},
        };

        if(dfsps) {
            this.setDFSPWiseState(local, 'payer', dfsps[0]);
            this.setDFSPWiseState(local, 'payee', dfsps[1] || dfsps[0]);
        }
        return local;
    };

    endpointsInputs = (dfspType, dfspId) => {
        const inputs = [];
        this.state.endpointsLocal[dfspType][dfspId].endpoints.forEach((endpoint, index) => {
            const endpointInputs = {};
            Object.keys(endpoint).forEach(key => {
                endpointInputs[key] = (
                    <>
                        {
                            (key === 'method')
                                ? <Select
                                    style={{ width: '100px' }} defaultValue={endpoint[key]} onChange={value => {
                                        this.props.handleParamValueChange(endpoint, key, value);
                                    }}
                                >
                                    <Select.Option value='get'>get</Select.Option>
                                    <Select.Option value='post'>post</Select.Option>
                                    <Select.Option value='put'>put</Select.Option>
                                </Select>
                                : <EndpointInput itemRef={endpoint} itemKey={key} value={endpoint[key]} onChange={this.props.handleParamValueChange} />
                        }
                    </>
                );
            });
            inputs.push({ key: index + '', ...endpointInputs });
        });
        return inputs;
    };

    endpointsColumns = (dfspType, dfspId) => {
        return [
            { title: 'method', dataIndex: 'method', key: 'method', width: '10%' },
            { title: 'path', dataIndex: 'path', key: 'path', width: '40%' },
            { title: 'endpoint', dataIndex: 'endpoint', key: 'endpoint', width: '40%' },
            {
                dataIndex: '',
                key: 'delete',
                width: '10%',
                render: (text, record, key) => (
                    <Button
                        type='primary' danger size='sm' onClick={e => {
                            this.state.endpointsLocal[dfspType][dfspId].endpoints = this.state.endpointsLocal[dfspType][dfspId].endpoints.filter((local, index) => {
                                return (key !== index);
                            });
                            this.forceUpdate();
                        }}
                    >Delete
                    </Button>
                ),
            },
        ];
    };

    getTabs = () => {
        const tabs = [];
        for(const [dfspType, dfspId] of Object.entries(this.state.dfspsEntries)) {
            tabs.push(
                <Tabs.TabPane tab={dfspType} key={dfspType}>
                    <Row>
                        <Col span={12}>
                            <label
                                className='form-control-label'
                                htmlFor='input-country'
                            >
                dfspId
                            </label>
                        </Col>
                        <Col span={12}>
                            <Input
                                value={this.state.dfsps[dfspType]} onChange={e => {
                                    this.state.dfsps[dfspType] = e.target.value;
                                    this.setState({ dfsps: this.state.dfsps });
                                }}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <label
                                className='form-control-label'
                                htmlFor='input-country'
                            >
                default endpoint
                            </label>
                        </Col>
                        <Col span={12}>
                            <Input
                                value={this.state.endpointsLocal[dfspType][dfspId].defaultEndpoint} onChange={e => {
                                    this.state.endpointsLocal[dfspType][dfspId].defaultEndpoint = e.target.value;
                                    this.forceUpdate();
                                }}
                            />
                        </Col>
                    </Row>
                    <Row className='mt-2'>
                        <Col span={24}>
                            <Button
                                type='dashed' onClick={e => {
                                    if(!this.state.endpointsLocal[dfspType][dfspId].endpoints) {
                                        this.state.endpointsLocal[dfspType][dfspId].endpoints = [];
                                    }
                                    this.state.endpointsLocal[dfspType][dfspId].endpoints.push({ method: 'put', path: null, endpoint: null });
                                    this.forceUpdate();
                                }}
                            >Add DFSP Wise Endpoint
                            </Button>
                        </Col>
                    </Row>
                    {
                        this.state.endpointsLocal[dfspType][dfspId].endpoints && this.state.endpointsLocal[dfspType][dfspId].endpoints.length > 0
                            ? <Table
                                columns={this.endpointsColumns(dfspType, dfspId)}
                                dataSource={this.endpointsInputs(dfspType, dfspId)}
                            />
                            : null
                    }
                </Tabs.TabPane>,
            );
        }
        return (
            <Tabs defaultActiveKey={this.state.dfspsEntries.payer}>
                {tabs}
            </Tabs>
        );
    };

    render() {
        return (
            <>
                <Button
                    color='info' size='sm' onClick={e => {
                        this.setState({ endpointsLocal: this.endpointsLocal() });
                        this.setState({ endpointsVisible: true });
                    }}
                >
          Edit
                </Button>
                {
                    this.state.endpointsVisible
                        ? <Modal
                            title='Edit DFSP wise endpoints'
                            width='50%'
                            visible={this.state.endpointsVisible}
                            onOk={async () => {
                                const payerKey = Object.keys(this.state.endpointsLocal.payer)[0];
                                const payeeKey = Object.keys(this.state.endpointsLocal.payee)[0];

                                if(this.state.dfsps.payer !== payerKey) {
                                    const temp = { ...this.state.endpointsLocal.payer[payerKey] };
                                    this.state.endpointsLocal.payer[this.state.dfsps.payer] = temp;
                                    delete this.state.endpointsLocal.payer[payerKey];
                                }
                                if(this.state.dfsps.payee !== payeeKey) {
                                    const temp = { ...this.state.endpointsLocal.payee[payeeKey] };
                                    this.state.endpointsLocal.payee[this.state.dfsps.payee] = temp;
                                    delete this.state.endpointsLocal.payee[payeeKey];
                                }
                                this.state.dfspsEntries = { ...this.state.dfsps };
                                const updatedDfsps = { ...this.state.endpointsLocal.payer, ...this.state.endpointsLocal.payee };
                                this.props.config.ENDPOINTS_DFSP_WISE.dfsps = updatedDfsps;
                                this.props.handleSave();
                                await this.updateRules(Object.keys(updatedDfsps));
                                this.setState({ endpointsVisible: false });
                            }}
                            onCancel={() => {
                                this.setState({ endpointsVisible: false });
                            }}
                        >
                            <Row>
                                <Col span={24}>
                                    {this.getTabs()}
                                </Col>
                            </Row>
                        </Modal>
                        : null
                }
            </>
        );
    }
}

class Settings extends React.Component {
    constructor() {
        super();
        this.state = {
            userConfigRuntime: {
                CALLBACK_RESOURCE_ENDPOINTS: {
                    enabled: false,
                    endpoints: [],
                },
                ENDPOINTS_DFSP_WISE: {
                    usersdfsp1: {
                        endpoints: [],
                    },
                },
            },
            userConfigStored: {
                CALLBACK_RESOURCE_ENDPOINTS: {
                    enabled: false,
                    endpoints: [],
                },
                ENDPOINTS_DFSP_WISE: {
                    usersdfsp1: {
                        endpoints: [],
                    },
                },
            },
            tokenFetcherEnabled: false,
        };
    }

    componentDidMount() {
        this.getUserConfiguration();
    }

    getUserConfiguration = async () => {
        message.loading({ content: 'Getting user config ...', key: 'getUserConfigProgress' });
        const { userConfigRuntime, userConfigStored } = await getServerConfig();
        await this.setState({ userConfigRuntime, userConfigStored });
        message.success({ content: 'Loaded', key: 'getUserConfigProgress', duration: -1 });
    };

    handleSaveUserConfig = async newConfig => {
        message.loading({ content: 'Saving user config ...', key: 'saveUserConfigProgress' });
        const { apiBaseUrl } = getConfig();
        await axios.put(apiBaseUrl + '/api/config/user', newConfig, { headers: { 'Content-Type': 'application/json' } });
        await this.getUserConfiguration();
        message.success({ content: 'Saved', key: 'saveUserConfigProgress', duration: 2 });
    };

    render() {
        return (
            <>
                {
                    getConfig().isAuthEnabled
                        ? (
                            <Modal
                                title='Token Information'
                                className='w-50'
                                destroyOnClose
                                footer={null}
                                visible={this.state.tokenFetcherEnabled}
                                onCancel={e => {
                                    this.setState({ tokenFetcherEnabled: false });
                                }}
                            >
                                <TokenFetcher />
                            </Modal>
                        )
                        : null
                }
                {
                    getConfig().isAuthEnabled
                        ? (
                            <Button
                                type='primary'
                                shape='round'
                                onClick={() => {
                                    this.setState({ tokenFetcherEnabled: true });
                                }}
                            >
                Token Info
                            </Button>
                        )
                        : null
                }
                <ConfigurationEditor config={this.state.userConfigStored} configRuntime={this.state.userConfigRuntime} onSave={this.handleSaveUserConfig} doRefresh={this.getUserConfiguration} />
            </>
        );
    }
}

export default Settings;
