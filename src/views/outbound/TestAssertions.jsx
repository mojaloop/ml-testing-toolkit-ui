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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import _ from 'lodash';

// core components
import axios from 'axios';
// import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Select, Input, Tooltip, Tag, Popover, message, Row, Col, Collapse, Modal, Switch, Button, Typography } from 'antd';

import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable as arrayMove } from 'array-move';

import 'antd/dist/antd.css';
// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import AceEditor from 'react-ace';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-eclipse';
import { getConfig } from '../../utils/getConfig';
import { TTKColors } from '../../utils/styleHelpers';

import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

export class ConfigurableParameter extends React.Component {
    constructor() {
        super();
        this.state = {
            paramType: null,
            factData: null,
            selectedValueComponent: null,
        };

        // Set paramTypes Array
        this.paramTypes[0] = 'Input Values';
        this.paramTypes[1] = 'Request';
    }

    paramTypes = [];

    inputValue = null;

    getParamTypeMenu = () => {
        return this.paramTypes.map((item, key) => {
            return (
                <Option key={key} value={key}>
                    {item}
                </Option>
            );
        });
    };

    handleParamTypeChange = async paramType => {
        this.setState({ paramType, factData: null, selectedValueComponent: null });
    };

    getValueComponent = () => {
        switch (this.state.paramType) {
            case 0:
                const inputOptionItems = [];
                for(const item in this.props.inputValues) {
                    inputOptionItems.push(
                        <Option key={item} value={item}>{item}</Option>,
                    );
                }
                return (
                    <>
                        <Select
                            placeholder='Please Select'
                            style={{ width: 200 }}
                            value={this.state.selectedValueComponent}
                            onChange={value => {
                                this.state.selectedValueComponent = value;
                                this.handleParamSelect('{$inputs.' + value + '}');
                            }}
                        >
                            {inputOptionItems}
                        </Select>
                    </>
                );
                break;
            case 1:
                const bodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition);
                const headerFactData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters);
                const factData = {
                    properties: {
                        body: bodyFactData,
                        headers: { type: 'object', ...headerFactData },
                    },
                };
                if(factData) {
                    return (
                        <FactSelect key={this.props.name} factData={factData} onSelect={this.handleFactSelect} />
                    );
                } else {
                    return null;
                }
                break;
            default:
                return null;
        }
    };

    handleParamSelect = paramValue => {
        this.props.onChange(paramValue);
    };

    handleFactSelect = (value, factObject) => {
        // Special case for headers fact
        if(value.startsWith('headers.')) {
            value = value.replace(/^headers\.(.*)/, 'headers[\'$1\']');
        }

        this.inputValue = value;
        this.handleParamSelect('{$request.' + value + '}');
    };

    render() {
        return (
            <Row>
                <Col span={12}>
                    <Select
                        placeholder='Please Select'
                        style={{ width: 200 }}
                        value={this.paramTypes[this.state.paramType]}
                        onSelect={this.handleParamTypeChange}
                    >
                        {this.getParamTypeMenu()}
                    </Select>
                </Col>
                <Col span={12}>
                    {this.getValueComponent()}
                </Col>
            </Row>
        );
    }
}

export class OperatorSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedOperatorIndex: null,
        };
        // Set operators Array
        this.operators[0] = { name: 'to.equal', description: 'Equal to' };
        this.operators[1] = { name: 'to.not.equal', description: 'Not Equal to' };
        this.operators[2] = { name: 'to.have.property', description: 'Have Property' };
        this.operators[3] = { name: 'to.not.have.property', description: 'Not to have property' };
    }

    operators = [];

    handleOperatorChange = async operatorIndex => {
        await this.setState({ selectedOperatorIndex: operatorIndex });
        this.props.onChange(this.operators[operatorIndex].name);
    };

    getOperatorsMenu = () => {
        return this.operators.map((item, key) => {
            return (
                <Option key={key} value={key}>
                    {item.description}
                </Option>
            );
        });
    };

    render() {
        return (
            <Select
                placeholder='Please Select'
                style={{ width: 200 }}
                value={this.state.selectedOperatorIndex}
                onSelect={this.handleOperatorChange}
            >
                {this.getOperatorsMenu()}
            </Select>
        );
    }
}

export class FactSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            factType: null,
            factData: null,
            selectedFact: null,
        };

        // Set factTypes Array
        this.factTypes[0] = 'Response';
        this.factTypes[1] = 'Callback';
        this.factTypes[2] = 'Environment';
    }

    factTypes = [];

    inputValue = null;

    getFactTypeMenu = () => {
        return this.factTypes.map((item, key) => {
            return (
                <Option key={key} value={key}>
                    {item}
                </Option>
            );
        });
    };

    handleFactTypeChange = async factType => {
        let factData = null;
        switch (factType) {
            case 0:
                const errorResponseFactData = (new FactDataGenerator()).getErrorResponseFactData(this.props.resourceDefinition);
                factData = (new FactDataGenerator()).getCustomFactData(['status', 'statusText']);
                _.merge(factData, errorResponseFactData);
                break;
            case 1:
                const headerFactData = (new FactDataGenerator()).getHeadersFactData(this.props.successCallbackDefinition, this.props.successCallbackRootParameters);
                const bodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.successCallbackDefinition);
                // const errorHeaderFactData = (new FactDataGenerator()).getHeadersFactData(this.props.errorCallbackDefinition, this.props.errorCallbackRootParameters)
                const errorBodyFactData = (new FactDataGenerator()).getBodyFactData(this.props.errorCallbackDefinition);
                _.merge(bodyFactData, errorBodyFactData);
                factData = { type: 'object', properties: { headers: { type: 'object', ...headerFactData }, body: bodyFactData } };
                break;
            case 2:
                factData = { type: 'input', properties: { placeHolder: 'Enter variable name' } };
                break;
            default:
                factData = null;
        }
        await this.setState({ factType, factData });
        // this.updateChanges()
    };

    getRequestFactComponent = () => {
        if(this.state.factData) {
            if(this.state.factData.type === 'object') {
                return (
                    <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} enableNodesSelection />
                );
            } else if(this.state.factData.type === 'input') {
                return (
                    <Input
                        placeholder={this.state.factData.properties.placeHolder}
                        style={{ width: 200 }}
                        onChange={e => {
                            this.handleFactSelect('environment.' + e.target.value);
                        }}
                    />
                );
            } else {
                return null;
            }
        } else {
            return null;
        }
    };

    handleFactSelect = async (value, factObject) => {
        // Special case for headers fact
        if(value.startsWith('headers.')) {
            value = value.replace(/^headers\.(.*)/, 'headers[\'$1\']');
        }

        await this.setState({ selectedFact: value });
        this.updateChanges();
    };

    updateChanges = () => {
        let finalValue = '';
        switch (this.state.factType) {
            case 0:
                finalValue = 'response.' + this.state.selectedFact;
                break;
            case 1:
                finalValue = 'callback.' + this.state.selectedFact;
                break;
            default:
                finalValue = this.state.selectedFact;
        }

        this.props.onChange(finalValue);
    };

    render() {
        return (
            <Row>
                <Col>
                    <Select
                        placeholder='Please Select'
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
        );
    }
}

export class AssertionEditorSimple extends React.Component {
    constructor() {
        super();
        this.state = {
            fact: null,
            operator: null,
            value: null,
        };
    }

    getAssertionProps = inputText => {
        const assertionRE = new RegExp('^expect\\((.*)\\)\\.(.*)\\((.*)\\)$');
        const parsedArray = assertionRE.exec(inputText);
        if(!parsedArray) {
            return null;
        }
        return {
            fact: parsedArray[1],
            operator: parsedArray[2],
            value: parsedArray[3],
        };
    };

    handleFactChange = selectedFact => {
        this.setState({
            fact: selectedFact,
        });
    };

    handleOperatorChange = selectedOperator => {
        this.setState({
            operator: selectedOperator,
        });
    };

    handleValueChange = selectedValue => {
        this.setState({
            value: selectedValue,
        });
    };

    handleOnSave = () => {
        if(this.state.fact && this.state.operator && this.state.value) {
            let assertionLine;
            if(this.state.fact === 'response.status') {
                assertionLine = 'expect(' + this.state.fact + ').' + this.state.operator + '(' + this.state.value + ')';
            } else {
                assertionLine = 'expect(' + this.state.fact + ').' + this.state.operator + '(\'' + this.state.value + '\')';
            }
            this.props.onSave(assertionLine);
        }
    };

    render() {
        return (
            <>
                <Row>
                    {/* <td>
          <p>{this.state.fact} {this.state.operator} {this.state.value}</p>
        </td> */}
                    <Col span={8}>
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
                    <Col span={8}>
                        <OperatorSelector
                            onChange={this.handleOperatorChange}
                        />
                    </Col>
                    <Col span={8}>
                        <Input
                            placeholder='Enter value'
                            type='text'
                            value={this.state.value}
                            onChange={e => { this.handleValueChange(e.target.value); }}
                        />
                    </Col>
                </Row>
                <Row className='mt-4'>
                    <Col span={24} className='text-center'>
                        <Button
                            type='primary'
                            danger
                            onClick={() => { this.handleOnSave(); }}
                        >
              Save
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }
}

class AssertionEditor extends React.Component {
    constructor() {
        super();
        this.state = {
            openApiDefinition: null,
            callbackMap: null,
            responseMap: null,
            selectedResource: null,
            showAddExpectationDialog: false,
            showConfigurableParameterDialog: false,
            configurableParameterSelected: false,
            renameAssertionDialogVisible: false,
            assertionDescription: '',
            assertionRawEditorEnable: false,
            reOrderingEnabled: false,
            assertionIdEditDisabled: true,
            assertionIdValidationError: '',
            assertionId: '',
        };
    }

    componentDidMount = async () => {
        let selectedApiVersion = null;
        let selectedResource = null;
        if(this.props.request && this.props.request.operationPath && this.props.request.method) {
            selectedResource = {
                path: this.props.request.operationPath,
                method: this.props.request.method,
            };
        }
        if(this.props.request && this.props.request.apiVersion) {
            selectedApiVersion = this.props.request.apiVersion;
            await this.fetchAllApiData(selectedApiVersion.type, selectedApiVersion.majorVersion + '.' + selectedApiVersion.minorVersion);
        }
        const assertionDescription = this.props.assertion.description;
        this.setState({ selectedResource, selectedApiVersion, assertionDescription, assertionId: this.props.assertion.id });
    };

    fetchAllApiData = async (apiType, version) => {
        const openApiDefinition = await this.getDefinition(apiType, version);
        let callbackMap = {};
        try {
            callbackMap = await this.getCallbackMap(apiType, version);
        } catch (err) {}

        let responseMap = {};
        try {
            responseMap = await this.getResponseMap(apiType, version);
        } catch (err) {}
        this.setState({ openApiDefinition, callbackMap, responseMap });
    };

    getDefinition = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/definition/${apiType}/${version}`);
        return response.data;
    };

    getResponseMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/response_map/${apiType}/${version}`);
        return response.data;
    };

    getCallbackMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/callback_map/${apiType}/${version}`);
        return response.data;
    };

    getResourceDefinition = () => {
        if(this.state.selectedResource && this.state.openApiDefinition && this.state.selectedResource.path && this.state.selectedResource.method) {
            return this.state.openApiDefinition.paths[this.state.selectedResource.path][this.state.selectedResource.method];
        }
        return null;
    };

    getCallbackObject = (isErrorCallback = false) => {
        let callbackObj = null;
        if(isErrorCallback) {
            callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method].errorCallback;
        } else {
            callbackObj = this.state.callbackMap[this.state.selectedResource.path][this.state.selectedResource.method].successCallback;
        }
        return callbackObj;
    };

    getCallbackRootParameters = (isErrorCallback = false) => {
        try {
            const callbackObj = this.getCallbackObject(isErrorCallback);
            return this.state.openApiDefinition.paths[callbackObj.path].parameters;
        } catch (err) {
            return [];
        }
    };

    getCallbackDefinition = (isErrorCallback = false) => {
        if(this.state.selectedResource) {
            try {
                const callbackObj = this.getCallbackObject(isErrorCallback);
                return this.state.openApiDefinition.paths[callbackObj.path][callbackObj.method];
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    onEditorChange = newValue => {
        const exec = newValue.split('\n');
        this.props.onChange(this.props.itemKey, { ...this.props.assertion, exec });
    };

    handleAddExpectationSave = newExpectation => {
        if(!this.props.assertion.exec) {
            this.props.assertion.exec = [];
        }
        this.props.assertion.exec.push(newExpectation);
        this.setState({ showAddExpectationDialog: false });
    };

    handleAddConfigParam = newValue => {
        this.setState({ configurableParameterSelected: newValue });
    };

    handleConfigParamCopyToClipboard = () => {
        navigator.clipboard.writeText(this.state.configurableParameterSelected);
        message.success('Copied to clipboard');
    };

    handleConfigParamInsertIntoEditor = () => {
        this.replaceEditorSelection(this.state.configurableParameterSelected);
        message.success('Pasted to editor');
    };

    replaceEditorSelection = newText => {
        const editor = this.refs.assertionAceEditor.editor;
        const selection = editor.selection.getRange();
        editor.session.replace(selection, newText);
    };

    handleAssertionIdChange = e => {
        const assertionId = e.target.value;
        // Validate the assertion ID to be a string with only alphanumeric characters, underscore and dash
        if(!/^[a-zA-Z0-9_-]*$/.test(e.target.value)) {
            this.setState({ assertionId, assertionIdValidationError: 'Assertion ID should contain only alphanumeric characters, underscore and dash' });
        } else {
            this.setState({ assertionId, assertionIdValidationError: '' });
        }
    }

    handleAssertionIdEditClick = () => {
        this.setState({ assertionIdEditDisabled: false });
    }

    handleAssertionIdSaveClick = () => {
        if(this.state.assertionId !== this.props.assertion.id) {
            this.props.assertion.id = this.state.assertionId;
            this.state.assertionIdEditDisabled = true;
            this.props.onChange(this.props.itemKey, { ...this.props.assertion, id: this.props.assertion.id });
        }
        this.setState({ assertionIdEditDisabled: true });
    }

    render() {
        const renameAssertionDialogContent = (
            <>
                <Input
                    placeholder='Description'
                    type='text'
                    value={this.state.assertionDescription}
                    onChange={e => { this.setState({ assertionDescription: e.target.value }); }}
                />
                <Button
                    className='text-right mt-2'
                    type='primary'
                    danger
                    onClick={() => {
                        this.setState({ renameAssertionDialogVisible: false });
                        this.props.onRename(this.props.itemKey, this.state.assertionDescription);
                    }}
                >
          Save
                </Button>
            </>
        );

        return (
            <>
                <Modal
                    centered
                    destroyOnClose
                    forceRender
                    title='Expectation'
                    className='w-50 p-3'
                    visible={!!this.state.showAddExpectationDialog}
                    footer={null}
                    onCancel={() => { this.setState({ showAddExpectationDialog: false }); }}
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
                    title='Configurable Parameter'
                    className='w-30 p-3'
                    visible={!!this.state.showConfigurableParameterDialog}
                    footer={null}
                    onCancel={() => { this.setState({ showConfigurableParameterDialog: false }); }}
                >
                    {
                        this.state.selectedResource
                            ? (
                                <>
                                    <Row>
                                        <Col span={24}>
                                            <ConfigurableParameter
                                                onChange={this.handleAddConfigParam}
                                                rootParameters={this.getCallbackRootParameters(false)}
                                                resourceDefinition={this.getResourceDefinition()}
                                                inputValues={this.props.inputValues}
                                            />
                                        </Col>
                                    </Row>
                                    {
                                        this.state.configurableParameterSelected
                                            ? (
                                                <>
                                                    <Row className='mt-4 text-center'>
                                                        <Col span={24}>
                                                            <Tag color='geekblue'>{this.state.configurableParameterSelected}</Tag>
                                                        </Col>
                                                    </Row>
                                                    <Row className='mt-2 text-center'>
                                                        <Col span={24}>
                                                            <Button
                                                                className='ml-2'
                                                                type='default'
                                                                onClick={this.handleConfigParamCopyToClipboard}
                                                            >
                          Copy to clipboard
                                                            </Button>
                                                            <Button
                                                                className='ml-2'
                                                                type='dashed'
                                                                danger
                                                                onClick={this.handleConfigParamInsertIntoEditor}
                                                            >
                          Insert into editor
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )
                                            : null
                                    }
                                </>
                            )
                            : null
                    }
                </Modal>
                <Row>
                    <Col span={24}>
                        <Input
                            className='float-left mb-2'
                            placeholder="Assertion ID"
                            size="small"
                            style={{ width: '300px' }}
                            disabled={this.state.assertionIdEditDisabled}
                            value={this.state.assertionId}
                            addonAfter={
                                this.state.assertionIdEditDisabled ? (
                                    <EditOutlined
                                        onClick={this.handleAssertionIdEditClick}
                                    />
                                ) : (
                                    <SaveOutlined
                                        style={{ visibility: this.state.assertionIdValidationError ? 'hidden' : 'visible' }}
                                        onClick={this.handleAssertionIdSaveClick}
                                    />
                                )
                            }
                            onChange={this.handleAssertionIdChange}
                        />
                        <Text type='danger'>{this.state.assertionIdValidationError}</Text>
                    </Col>
                </Row>

                <Popover
                    className='float-left mb-2'
                    content={renameAssertionDialogContent}
                    title='Enter new description'
                    trigger='click'
                    visible={this.state.renameAssertionDialogVisible}
                    onVisibleChange={visible => this.setState({ renameAssertionDialogVisible: visible })}
                >
                    <Button
                        className='float-left'
                        type='default'
                    >
            Rename
                    </Button>
                </Popover>
                <Button
                    className='float-right mb-2'
                    type='primary'
                    danger
                    onClick={() => { this.props.onDelete(this.props.itemKey); }}
                >
          Delete
                </Button>
                <Button
                    className='float-right mb-2 mr-2'
                    type='dashed'
                    onClick={() => { this.props.onDuplicate(this.props.itemKey); }}
                >
          Duplicate
                </Button>

                <AceEditor
                    ref='assertionAceEditor'
                    mode='javascript'
                    theme='eclipse'
                    width='100%'
                    height='100px'
                    value={this.props.assertion.exec ? this.props.assertion.exec.join('\n') : ''}
                    onChange={this.onEditorChange}
                    name='UNIQUE_ID_OF_DIV'
                    wrapEnabled
                    showPrintMargin
                    showGutter
                    tabSize={2}
                    enableBasicAutocompletion
                    enableLiveAutocompletion
                />
                <Button
                    className='float-left mt-2'
                    type='primary'
                    onClick={() => { this.setState({ showAddExpectationDialog: true }); }}
                >
          Add Expectation
                </Button>
                <Button
                    className='float-right mt-2'
                    type='dashed'
                    onClick={() => { this.setState({ showConfigurableParameterDialog: true }); }}
                >
          Configurable Parameter
                </Button>
            </>
        );
    }
}

export class TestAssertions extends React.Component {
    constructor() {
        super();
        this.state = {
            newAssertionDescription: null,
            addNewAssertionDialogVisible: false,
        };
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

        this.props.request.tests.assertions[key] = newAssertion;
        this.props.onChange(this.props.request);
    };

    getAssertionItems = () => {
        const results = this.props.request.status && this.props.request.status.testResult && this.props.request.status.testResult.results ? this.props.request.status.testResult.results : {};
        return this.props.request.tests.assertions.map((assertion, key) => {
            let status = null;
            let color = TTKColors.assertionPassed;
            if(results[assertion.id]) {
                if(results[assertion.id].status == 'FAILED') {
                    color = TTKColors.assertionFailed;
                } else if(results[assertion.id].status == 'SKIPPED') {
                    color = TTKColors.assertionSkipped;
                }
                status = (
                    <Tooltip placement='topLeft' title={results[assertion.id].message}>
                        <Tag color={color}>
                            {results[assertion.id].status}
                        </Tag>
                    </Tooltip>
                );
            }

            return (
                <Panel header={assertion.description} key={assertion.id} extra={status}>
                    <Row>
                        <Col span={24}>
                            <AssertionEditor
                                itemKey={key} assertion={assertion} request={this.props.request} inputValues={this.props.inputValues}
                                onChange={this.handleAssertionChange}
                                onRename={this.handleRenameAssertion}
                                onDelete={this.handleDeleteAssertionClick}
                                onDuplicate={this.handleDuplicateAssertionClick}
                            />
                        </Col>
                    </Row>
                </Panel>
            );
        });
    };

    handleAddNewAssertionClick = description => {
        // Find highest request id to determine the new ID
        if(!this.props.request.tests) {
            this.props.request.tests = {
                assertions: [],
            };
        }
        const maxId = +this.props.request.tests.assertions.reduce(function (m, k) { return k.id > m ? k.id : m; }, 0);
        this.props.request.tests.assertions.push({ id: maxId + 1, description });
        this.props.onChange(this.props.request);
    };

    handleDeleteAssertionClick = index => {
        this.props.request.tests.assertions.splice(index, 1);
        this.props.onChange(this.props.request);
    };

    handleDuplicateAssertionClick = index => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const { id, description, ...otherProps } = this.props.request.tests.assertions[index];
        // Find highest request id to determine the new ID
        const maxId = +this.props.request.tests.assertions.reduce(function (m, k) { return k.id > m ? k.id : m; }, 0);
        // Deep copy other properties
        const clonedProps = JSON.parse(JSON.stringify(otherProps));

        this.props.request.tests.assertions.push({ id: maxId + 1, description: description + ' Copy', ...clonedProps });

        this.props.onChange(this.props.request);
    };

    handleRenameAssertion = (index, newDescription) => {
        this.props.request.tests.assertions[index].description = newDescription;
        this.props.onChange(this.props.request);
    };

    handleRawAssertionsChange = newAssertions => {
        if(!this.props.request.tests) {
            this.props.request.tests = {};
        }
        this.props.request.tests.assertions = newAssertions;
        this.props.onChange(this.props.request);
    };

    onAssertionSortEnd = ({ oldIndex, newIndex }) => {
        // Change the position in array
        this.props.request.tests.assertions = arrayMove(this.props.request.tests.assertions, oldIndex, newIndex);
        this.props.onChange(this.props.request);
    };

    render() {
        const SortableAssertionItem = SortableElement(({ value }) => {
            const assertion = value;
            return (
                <Panel header={assertion.description} />
            );
        });

        const SortableAssertionList = SortableContainer(({ items }) => {
            return (
                <Collapse>
                    {items.map((value, index) => (
                        <SortableAssertionItem key={`item-${value.id}`} index={index} value={value} />
                    ))}
                </Collapse>
            );
        });

        const addNewTestDialogContent = (
            <>
                <Input
                    placeholder='Enter description'
                    type='text'
                    value={this.state.newAssertionDescription}
                    onChange={e => { this.setState({ newAssertionDescription: e.target.value }); }}
                    onKeyDown={e => {
                        if(e.key === 'Escape') {
                            this.setState({ addNewAssertionDialogVisible: false });
                        }
                    }}
                    onPressEnter={() => {
                        this.handleAddNewAssertionClick(this.state.newAssertionDescription);
                        this.setState({ addNewAssertionDialogVisible: false });
                    }}
                />
                <Button
                    className='text-right mt-2'
                    color='success'
                    href='#pablo'
                    onClick={() => {
                        this.handleAddNewAssertionClick(this.state.newAssertionDescription);
                        this.setState({ addNewAssertionDialogVisible: false });
                    }}
                    size='sm'
                >
          Add
                </Button>
            </>
        );
        return (
            <>
                <Row>
                    <Col span={12}>
                        {
                            this.state.reOrderingEnabled
                                ? (
                                    <Button
                                        type='dashed'
                                        danger
                                        onClick={() => {
                                            this.setState({ reOrderingEnabled: false });
                                        }}
                                    >
                Done
                                    </Button>
                                )
                                : (
                                    <Button
                                        className='text-right'
                                        color='success'
                                        href='#pablo'
                                        onClick={() => {
                                            this.setState({ reOrderingEnabled: true });
                                        }}
                                        size='sm'
                                    >
                Change Order
                                    </Button>
                                )
                        }
                    </Col>
                    <Col span={12} className='text-right'>
                        <strong>Raw Editor</strong> <Switch checked={this.state.assertionRawEditorEnable} onChange={checked => { this.setState({ assertionRawEditorEnable: checked }); }} />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        {
                            this.state.reOrderingEnabled
                                ? (
                                    <div>
                                        <Row>
                                            <Col className='text-left mt-4'>
                                                <SortableAssertionList items={this.props.request.tests.assertions} onSortEnd={this.onAssertionSortEnd} />
                                            </Col>
                                        </Row>
                                    </div>
                                )
                                : !this.state.assertionRawEditorEnable
                                    ? (
                                        <div>
                                            <Row>
                                                <Col span={24} className='text-right'>
                                                    <Popover
                                                        content={addNewTestDialogContent}
                                                        title='Enter a description for the assertion'
                                                        trigger='click'
                                                        visible={this.state.addNewAssertionDialogVisible}
                                                        onVisibleChange={visible => this.setState({ addNewAssertionDialogVisible: visible })}
                                                    >
                                                        <Button
                                                            className='text-right float-right'
                                                            type='primary'
                                                        >
                            Add New Assertion
                                                        </Button>
                                                    </Popover>
                                                </Col>
                                            </Row>
                                            <Row className='mt-2'>
                                                <Col span={24}>
                                                    {
                                                        this.props.request.tests
                                                            ? (
                                                                <>
                                                                    <Collapse
                                                                        onChange={this.handleRuleItemActivePanelChange}
                                                                    >
                                                                        {this.getAssertionItems()}
                                                                    </Collapse>
                                                                </>
                                                            )
                                                            : null
                                                    }

                                                </Col>
                                            </Row>
                                        </div>
                                    )
                                    : (
                                        <div>
                                            <Row>
                                                <Col span={24} className='text-left mt-4'>
                                                    <Editor
                                                        ref='bodyEditor'
                                                        value={this.props.request.tests ? this.props.request.tests.assertions : []}
                                                        ace={ace}
                                                        ajv={ajv}
                                                        theme='ace/theme/tomorrow_night_blue'
                                                        mode='code'
                                                        search={false}
                                                        statusBar={false}
                                                        navigationBar={false}
                                                        onChange={this.handleRawAssertionsChange}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>
                                    )
                        }
                    </Col>
                </Row>
            </>
        );
    }
}

export default TestAssertions;
