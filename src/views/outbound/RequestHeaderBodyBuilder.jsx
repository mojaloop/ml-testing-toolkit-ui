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

 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@infitx.com> (Original Author)
 --------------
 ******/
import React from 'react';
import _ from 'lodash';

import { Spin, Select, Input, Tooltip, Tag, Menu, Dropdown, Card, Popover, message, Row, Col, Switch, Button, Typography } from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';

// import './index.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import '../outbound/jsoneditor-react-compat';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import JsonEditor from './JsonEditor.jsx';
import { FetchUtils } from './FetchUtils';

const { Option } = Select;
const { Text } = Typography;

class RequestHeaderBodyBuilder extends React.Component {
    constructor() {
        super();
        this.bodyEditorRef = React.createRef();
        this.state = {
            configurableParameterSelected: '',
            allParamsFromDefinition: [],
            allParamsObject: {},
            addCustomHeaderDialogVisible: false,
            newCustomHeaderName: '',
            headersRawEditorEnable: false,
        };
    }

    bodySchema = {};

    componentDidMount = () => {
        // console.log(this.props.rootParameters)
        // console.log(this.props.resourceDefinition.parameters)
        this.bodySchema = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition);

        let allParamsFromDefinition = [];
        if(this.props.rootParameters) {
            allParamsFromDefinition = allParamsFromDefinition.concat(this.props.rootParameters);
        }
        if(this.props.resourceDefinition && this.props.resourceDefinition.parameters) {
            allParamsFromDefinition = allParamsFromDefinition.concat(this.props.resourceDefinition.parameters);
        }

        const allParamsObject = {};
        for(const k in allParamsFromDefinition) {
            allParamsObject[allParamsFromDefinition[k].name] = {
                description: allParamsFromDefinition[k].description,
            };
        }
        this.setState({ allParamsFromDefinition, allParamsObject });
    };

    componentDidUpdate = () => {
        // if(this.refs.bodyEditor) {
        //   this.refs.bodyEditor.jsonEditor.update(this.props.request.body? this.props.request.body : {})
        // }
        // console.log(this.props.resourceDefinition.parameters)
        // console.log(this.props.resourceDefinition)
    };

    addHeaderItemsFromDefinition = async (onlyRequired = false) => {
        this.state.allParamsFromDefinition.forEach(param => {
            if(param.in === 'header') {
                if(!onlyRequired || param.required) {
                    if(!this.props.request.headers) {
                        this.props.request.headers = {};
                        this.props.request.headers[param.name] = '';
                    } else if(!this.props.request.headers[param.name]) {
                        this.props.request.headers[param.name] = '';
                    }
                }
            }
        });
        this.updateChanges();
    };

    addHeaderItem = itemName => {
        if(!this.props.request.headers) {
            this.props.request.headers = {};
        }
        this.props.request.headers[itemName] = this.props.request.headers[itemName] ? this.props.request.headers[itemName] : '';
        this.updateChanges();
    };

    handleHeaderItemChange = (key, name, value) => {
        this.props.request.headers[name] = value;
        this.updateChanges();
    };

    handleHeaderItemDelete = async name => {
        delete this.props.request.headers[name];
        this.updateChanges();
    };

    handleBodyChange = bodyObject => {
        // console.log(ace.getCursorPosition())
        this.props.request.body = bodyObject;
        this.updateChanges();
    };

    handleAddHeaderClick = event => {
        this.addHeaderItem(event.item.props.eventKey);
    };

    handleRawHeadersChange = newHeaders => {
        this.props.request.headers = newHeaders;
        this.updateChanges();
    };

    headerItemsMenu = () => {
        const headerParams = this.state.allParamsFromDefinition.filter(item => {
            return item.in === 'header';
        });
        const menuItems = headerParams.map((item, key) => {
            return (
                <Menu.Item key={item.name}>{item.name}</Menu.Item>
            );
        });
        return (
            <Menu onClick={this.handleAddHeaderClick}>
                {menuItems}
            </Menu>
        );
    };

    updateChanges = () => {
        this.props.onChange(this.props.request);
    };

    updateBodyChanges = () => {
        if(this.bodyEditorRef.jsonEditor && this.props.request.body) {
            this.bodyEditorRef.jsonEditor.update(this.props.request.body);
        }
    };

    getHeaderItems = () => {
        // console.log(this.props.resourceDefinition)
        const headerItems = [];
        let k = 0;
        if(this.props.request) {
            for(const headerName in this.props.request.headers) {
                const item = {
                    name: headerName,
                    value: this.props.request.headers[headerName],
                };
                const key = k;
                k += 1;
                headerItems.push(
                    <HeaderInputComponent
                        key={key}
                        itemKey={item.name}
                        name={item.name}
                        value={item.value}
                        description={this.state.allParamsObject[item.name] ? this.state.allParamsObject[item.name].description : null} rootParameters={this.props.rootParameters}
                        resourceDefinition={this.props.resourceDefinition}
                        onChange={this.handleHeaderItemChange}
                        onDelete={this.handleHeaderItemDelete}
                        inputValues={this.props.inputValues}
                    />,
                );
            }
        }
        return headerItems;
    };

    handleAddConfigParam = newValue => {
        this.setState({ configurableParameterSelected: newValue });
    };

    handlePopulateSampleBodyClick = async () => {
        // const newBody = (new FactDataGenerator()).getBodySample(this.props.resourceDefinition)
        try {
            const newBody = await (new FactDataGenerator()).generateSample(this.bodySchema);
            if(newBody) {
                // if(this.props.callbackObject && this.props.callbackObject.bodyOverride) {
                //   _.merge(newBody, this.props.callbackObject.bodyOverride)
                // }
                this.props.request.body = newBody;
                this.updateBodyChanges();
                this.updateChanges();
            }
        } catch (err) {
            message.error('Can not generate sample body. Error: ' + err.message);
        }
    };

    handleConfigParamCopyToClipboard = () => {
        navigator.clipboard.writeText(this.state.configurableParameterSelected);
        message.success('Copied to clipboard');
    };

    render() {
        const content = (
            <>
                <Row>
                    <Col span={24}>
                        <ConfigurableParameter
                            onChange={this.handleAddConfigParam}
                            rootParameters={this.props.rootParameters}
                            resourceDefinition={this.props.resourceDefinition}
                            openApiDefinition={this.props.openApiDefinition}
                            callbackMap={this.props.callbackMap}
                            inputValues={this.props.inputValues}
                            allRequests={this.props.allRequests}
                        />
                    </Col>
                </Row>
                {
                    this.state.configurableParameterSelected
                        ? (
                            <Row className='mt-4 text-center'>
                                <Col span={24}>
                Click below to copy <br />
                                    <Tag color='geekblue'><a onClick={this.handleConfigParamCopyToClipboard}>{this.state.configurableParameterSelected}</a></Tag>
                                </Col>
                            </Row>
                        )
                        : null
                }
            </>
        );

        const addCustomHeaderDialogContent = (
            <>
                <Row>
                    <Col span={24}>
                        <Input
                            placeholder='Enter name'
                            type='text'
                            value={this.state.newCustomHeaderName}
                            onChange={e => { this.setState({ newCustomHeaderName: e.target.value }); }}
                        />
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={24}>
                        <Button
                            type='primary'
                            onClick={() => {
                                this.addHeaderItem(this.state.newCustomHeaderName);
                                this.setState({ addCustomHeaderDialogVisible: false });
                            }}
                        >
              Add
                        </Button>
                        <Button
                            className='ms-2'
                            type='default'
                            danger
                            onClick={() => {
                                this.setState({ addCustomHeaderDialogVisible: false });
                            }}
                        >
              Cancel
                        </Button>
                    </Col>
                </Row>
            </>
        );

        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card size='small' title='Headers'>
                            <Row>
                                <Col span={12}>
                                    <Popover content={content} title='Select a Configurable Parameter' trigger='click'>
                                        <Button type='dashed'>Add Configurable Params</Button>
                                    </Popover>
                                </Col>
                                <Col span={12} className='text-end'>
                                    <strong>Raw Editor</strong> <Switch checked={this.state.headersRawEditorEnable} onChange={checked => { this.setState({ headersRawEditorEnable: checked }); }} />
                                </Col>
                            </Row>
                            <Row className='mt-2'>
                                <Col span={24}>
                                    {
                                        this.state.headersRawEditorEnable
                                            ? (
                                                <div>
                                                    <Row>
                                                        <Col span={24} className='text-start mt-4'>
                                                            <JsonEditor
                                                                value={this.props.request.headers || {}}
                                                                onChange={this.handleRawHeadersChange}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )
                                            : (
                                                <>
                                                    <Row className='mb-2'>
                                                        <Col span={8}>
                                                            <Text strong>
                                Name
                                                            </Text>
                                                        </Col>
                                                        <Col span={8}>
                                                            <Text strong>
                                Value
                                                            </Text>
                                                        </Col>
                                                    </Row>
                                                    {this.getHeaderItems()}
                                                    <Row>
                                                        <Col span={24}>
                                                            <Dropdown overlay={this.headerItemsMenu()}>
                                                                <Button
                                                                    type='primary'
                                                                    onClick={e => e.preventDefault()}
                                                                >
                                  Add Header
                                                                </Button>
                                                            </Dropdown>
                                                            <Button
                                                                className='ms-2 float-end'
                                                                type='default'
                                                                danger
                                                                onClick={() => this.addHeaderItemsFromDefinition(true)}
                                                            >
                                Add Required Headers
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                    <Row className='mt-2'>
                                                        <Col span={24}>
                                                            <Button
                                                                className='float-end'
                                                                type='default'
                                                                onClick={() => this.addHeaderItemsFromDefinition(false)}
                                                            >
                                Add All Headers
                                                            </Button>
                                                            <Popover
                                                                content={addCustomHeaderDialogContent}
                                                                title='Enter name for the header'
                                                                trigger='click'
                                                                open={this.state.addCustomHeaderDialogVisible}
                                                                onOpenChange={visible => this.setState({ addCustomHeaderDialogVisible: true })}
                                                            >
                                                                <Button
                                                                    color='warning'
                                                                    size='sm'
                                                                >
                                  Add Custom Header
                                                                </Button>
                                                            </Popover>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )
                                    }
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
                {
                    this.props.resourceDefinition && this.props.resourceDefinition.requestBody
                        ? (
                            <Row className='mt-2'>
                                <Col span={24}>
                                    <Card size='small' title='Body'>
                                        <Row className='mb-2'>
                                            <Col span={12}>
                                                <Popover content={content} title='Select a Configurable Parameter' trigger='click'>
                                                    <Button type='dashed'>Add Configurable Params</Button>
                                                </Popover>
                                            </Col>
                                            <Col span={12} style={{ textAlign: 'right' }}>
                                                <Button type='default' onClick={this.handlePopulateSampleBodyClick}>Populate with sample body</Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col span={24}>
                                                <JsonEditor
                                                    ref={editor => {
                                                        this.bodyEditorRef = editor;
                                                    }}
                                                    value={this.props.request.body ? this.props.request.body : {}}
                                                    onChange={this.handleBodyChange}
                                                    schema={this.bodySchema}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        )
                        : null
                }
            </>
        );
    }
}

class HeaderInputComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            name: '',
            value: '',
        };
    }

    inputValue = null;

    componentDidMount = () => {
        this.inputValue = this.props.value;
    };

    componentDidUpdate = () => {
        this.inputValue = this.props.value;
    };

    getDynamicValue = () => {
        let dynamicValue = null;
        // Check if the path value is a configurable input parameter
        if(this.inputValue && this.inputValue.startsWith('{$inputs.')) {
            // Find the parameter name
            const paramName = this.inputValue.slice(9, this.inputValue.length - 1);
            // if (this.props.inputValues)
            const temp = _.get(this.props.inputValues, paramName);
            if(temp) {
                dynamicValue = (
                    <Tag style={{ borderStyle: 'dashed' }}>{temp}</Tag>
                );
            }
        }
        return dynamicValue;
    };

    handleNameChange = event => {
        // this.setState({name: event.target.value})
        this.props.onChange(this.props.itemKey, event.target.value, this.props.value);
    };

    handleValueChange = event => {
        this.inputValue = event.target.value;
        // console.log(event.target.value)
        // this.setState({value: event.target.value})
        this.props.onChange(this.props.itemKey, this.props.name, this.inputValue);
    };

    handleDelete = () => {
        this.props.onDelete(this.props.itemKey);
    };

    render() {
        return (
            <>
                <Row className='mb-2' gutter={16}>
                    <Col span={8}>
                        <Tooltip placement='topLeft' title={this.props.description}>
                            <Input
                                className='form-control-alternative'
                                placeholder='Name'
                                type='text'
                                defaultValue={this.props.name}
                                value={this.props.name}
                                onChange={this.handleNameChange}
                                disabled={false}
                                readOnly
                            />
                        </Tooltip>
                    </Col>

                    <Col span={14}>
                        <Input
                            className='form-control-alternative'
                            placeholder='Value'
                            type='text'
                            defaultValue={this.props.value}
                            value={this.props.value}
                            onChange={this.handleValueChange}
                            disabled={false}
                        />
                        {this.getDynamicValue()}
                    </Col>
                    <Col span={2}>
                        <DeleteTwoTone
                            twoToneColor='#eb2f96'
                            key={this.props.name}
                            onClick={this.handleDelete}
                        />
                    </Col>
                </Row>
            </>
        );
    }
}

class ConfigurableParameter extends React.Component {
    constructor() {
        super();
        this.state = {
            paramType: null,
            factData: null,
            selectedValueComponent: null,
            isLoading: false,
        };

        // Set paramTypes Array
        this.paramTypes[0] = 'Input Values';
        this.paramTypes[1] = 'Previous Request';
        this.paramTypes[2] = 'Previous Response';
        this.paramTypes[3] = 'Function';
        this.paramTypes[4] = 'Environment';
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

    // handleParamTypeChange = async (paramType) => {
    //   var factData = null
    //   switch(paramType) {
    //     case 0:
    //       factData = (new FactDataGenerator()).getPathParametersFactData(this.props.rootParameters)
    //       break
    //     case 1:
    //       factData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)
    //       break
    //     case 2:
    //       factData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters)
    //       break
    //     default:
    //       factData = null
    //   }
    //   await this.setState( {paramType: paramType, factData: factData} )
    //   this.updateChanges()
    // }
    handleParamTypeChange = async paramType => {
        this.setState({ paramType, factData: null, selectedValueComponent: null });
    };

    // getValueComponent = () => {
    //   switch(this.state.paramType) {
    //     case 0:
    //     case 1:
    //     case 2:
    //       return (
    //         <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
    //       )
    //       break
    //     case 3:
    //     default:
    //       return null
    //   }
    // }

    getRequestFactComponent = () => {
        if(this.state.factData) {
            return (
                <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
            );
        } else {
            return null;
        }
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
            case 2:
                let requestSelectionOptionItems = [];
                requestSelectionOptionItems = this.props.allRequests.map(request => {
                    return (
                        <Option key={request.id} value={request.id}>{request.description}</Option>
                    );
                });
                return (
                    <>
                        <Select
                            placeholder='Please Select'
                            style={{ width: 200 }}
                            value={this.state.selectedValueComponent}
                            onChange={async requestId => {
                                const request = this.props.allRequests.find(item => item.id === requestId);
                                // Fetch data here
                                try {
                                    this.setState({ isLoading: true });
                                    const fetchAllApiData = await FetchUtils.fetchAllApiData(request.apiVersion.type, request.apiVersion.majorVersion + '.' + request.apiVersion.minorVersion, request.apiVersion.asynchronous);
                                    this.setState({ isLoading: false });
                                    let resourceDefinition = null;
                                    let rootParams = null;
                                    if(this.state.paramType === 1) {
                                        resourceDefinition = fetchAllApiData.openApiDefinition.paths[request.operationPath][request.method];
                                        rootParams = fetchAllApiData.openApiDefinition.paths[request.operationPath].parameters;
                                    } else {
                                        const callbackObj = fetchAllApiData.callbackMap[request.operationPath][request.method].successCallback;
                                        resourceDefinition = fetchAllApiData.openApiDefinition.paths[callbackObj.path][callbackObj.method];
                                        rootParams = fetchAllApiData.openApiDefinition.paths[callbackObj.path].parameters;
                                    }
                                    const bodyFactData = (new FactDataGenerator()).getBodyFactData(resourceDefinition);
                                    const headerFactData = (new FactDataGenerator()).getHeadersFactData(resourceDefinition, rootParams);
                                    const factData = {
                                        properties: {
                                            body: bodyFactData,
                                            headers: { type: 'object', ...headerFactData },
                                        },
                                    };
                                    this.setState({ selectedValueComponent: requestId, factData });
                                } catch (err) {
                                    console.log('GVK', err.stack);
                                    message.error('Error fetching the data about the API resource');
                                    this.setState({ isLoading: false, factData: null });
                                }
                            }}
                        >
                            {requestSelectionOptionItems}
                        </Select>
                    </>
                );
                break;
            case 3:
                // TODO: Get the function list and type of functions from backend. Include another subtype to select
                const functionList = {
                    generateUUID: {
                        description: 'Generates unique id',
                    },
                    curDate: {
                        description: 'Get current date and time',
                    },
                };
                const functionOptionItems = [];
                for(const item in functionList) {
                    functionOptionItems.push(
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
                                this.handleParamSelect('{$function.generic.' + value + '}');
                            }}
                        >
                            {functionOptionItems}
                        </Select>
                    </>
                );
                break;
            case 4:
                return (
                    <>
                        <Input
                            placeholder='Enter environment variable name'
                            style={{ width: 200 }}
                            value={this.state.selectedValueComponent}
                            onChange={e => {
                                this.state.selectedValueComponent = e.target.value;
                                this.handleParamSelect('{$environment.' + e.target.value + '}');
                            }}
                        />
                    </>
                );
                break;
            default:
                return null;
        }
    };

    handleParamSelect = paramValue => {
        this.props.onChange(paramValue);
    };

    handleFactTypeSelect = async value => {
        try {
            const selectedValueObject = JSON.parse(value);
            await this.setState({ selectedFactType: selectedValueObject });
            this.props.condition.fact = selectedValueObject.name;
            this.props.onConditionChange();
            this.updateFactData();
        } catch (err) {}
    };

    handleFactSelect = (value, factObject) => {
        this.inputValue = value;
        this.handleParamSelect('{$prev.' + this.state.selectedValueComponent + '.' + (this.state.paramType === 1 ? 'request' : 'callback') + '.' + value + '}');
        // this.updateChanges()
    };

    updateChanges = () => {
        let finalValue = '';
        if(!this.inputValue) {
            this.inputValue = '';
        }
        switch (this.state.paramType) {
            case 0:
                finalValue = '{$request.params.' + this.inputValue + '}';
                break;
            case 1:
                finalValue = '{$request.body.' + this.inputValue + '}';
                break;
            case 2:
                finalValue = '{$request.headers.' + this.inputValue.toLowerCase() + '}';
                break;
            case 3:
                finalValue = '{$session.negotiatedContentType}';
                break;
            default:
                finalValue = this.inputValue;
        }

        this.props.onChange(finalValue);
    };

    handleValueChange = newValue => {
        this.inputValue = newValue;
        this.updateChanges();
    };

    render() {
        return (
            <Spin size='large' spinning={this.state.isLoading}>
                <Row>
                    <Col>
                        <Select
                            placeholder='Please Select'
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
                    <Col>
                        {this.getRequestFactComponent()}
                    </Col>
                </Row>
            </Spin>
        );
    }
}

export default RequestHeaderBodyBuilder;
