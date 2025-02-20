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
import { Select, Row, Col, Button, Input, Tooltip, Popover, Checkbox } from 'antd';
import 'antd/dist/antd.css';
import { FactDataGenerator, FactSelect } from '../rules/BuilderTools.jsx';
import { FixedCallbackBuilder } from '../rules/EventBuilder';

import 'jsoneditor-react/es/editor.min.css';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';

const { Option } = Select;

export class ConfigurableParameter extends React.Component {
    constructor() {
        super();
        this.state = {
            mode: null,
            factData: null,
        };

        // Set Modes Array
        this.modes[0] = 'Request Path Parameter';
        this.modes[1] = 'Request Body Parameter';
        this.modes[2] = 'Request Header Parameter';
        this.modes[3] = 'Negotiated Content Type';
    }

    modes = [];

    inputValue = null;

    getModeMenu = () => {
        return this.modes.map((item, key) => {
            return (
                <Option key={key} value={key}>
                    {item}
                </Option>
            );
        });
    };

    handleModeChange = async mode => {
        let factData = null;
        switch (mode) {
            case 0:
                factData = (new FactDataGenerator()).getPathParametersFactData(this.props.rootParameters);
                break;
            case 1:
                factData = (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition);
                break;
            case 2:
                factData = (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters);
                break;
            default:
                factData = null;
        }
        await this.setState({ mode, factData });
        this.updateChanges();
    };

    getValueComponent = () => {
        switch (this.state.mode) {
            case 0:
            case 1:
            case 2:
                return (
                    <FactSelect key={this.props.name} factData={this.state.factData} onSelect={this.handleFactSelect} />
                );
                break;
            case 3:
            default:
                return null;
        }
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
        this.updateChanges();
    };

    updateChanges = () => {
        let finalValue = '';
        if(!this.inputValue) {
            this.inputValue = '';
        }
        switch (this.state.mode) {
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
            <Row>
                <Col>
                    <Select
                        placeholder='Please Select'
                        style={{ width: 200 }}
                        value={this.modes[this.state.mode]}
                        onSelect={this.handleModeChange}
                    >
                        {this.getModeMenu()}
                    </Select>
                </Col>
                <Col>
                    {this.getValueComponent()}
                </Col>
            </Row>
        );
    }
}

export class HeaderInputComponent extends React.Component {
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

    handleNameChange = event => {
        // this.setState({name: event.target.value})
        this.props.onChange(this.props.itemKey, event.target.value, this.props.value);
    };

    handleAddConfigParam = newValue => {
        this.inputValue = newValue;
        // this.setState({value: event.target.value})
        this.props.onChange(this.props.itemKey, this.props.name, this.inputValue);
    };

    handleValueChange = event => {
        this.inputValue = event.target.value;
        // this.setState({value: event.target.value})
        this.props.onChange(this.props.itemKey, this.props.name, this.inputValue);
    };

    handleDelete = () => {
        this.props.onDelete(this.props.itemKey);
    };

    render() {
        const content = (
            <ConfigurableParameter
                name={this.props.name}
                value={this.props.value}
                onChange={this.handleAddConfigParam}
                rootParameters={this.props.rootParameters}
                resourceDefinition={this.props.resourceDefinition}
            />
        );

        return (
            <>
                <Row>
                    <Col span={8}>
                        <Tooltip placement='topLeft' title={this.props.description}>
                            <Input
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

                    <Col span={12} className='pl-2'>
                        <Input
                            placeholder='Value'
                            type='text'
                            defaultValue={this.props.value}
                            value={this.props.value}
                            onChange={this.handleValueChange}
                            disabled={false}
                        />
                        <Popover className='mt-1' content={content} title='Select a Configurable Parameter' trigger='click'>
                            <Button type='dashed'>Add Configurable Params</Button>
                        </Popover>

                    </Col>
                    <Col span={4} className='pl-2'>
                        <Button
                            type='primary'
                            danger
                            key={this.props.name}
                            onClick={this.handleDelete}
                        >
              Delete
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }
}

export class MockBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            overrideChecked: false,
        };
    }

    componentDidMount = () => {
        if(this.props.eventParams) {
            if(this.props.eventParams.headers || this.props.eventParams.body) {
                this.setState({ overrideChecked: true });
            }
        }
    };

    handleOverrideChecked = event => {
        this.setState({ overrideChecked: event.target.checked });
        if(!event.target.checked) {
            this.handleOverrideValuesChange({});
        }
    };

    handleOverrideValuesChange = paramsObject => {
        this.props.eventParams.body = paramsObject.body;
        this.props.eventParams.headers = paramsObject.headers;
        this.forceUpdate();
    };

    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Checkbox checked={this.state.overrideChecked} onChange={this.handleOverrideChecked}>Override some parameters</Checkbox>
                    </Col>
                </Row>
                {this.state.overrideChecked
                    ? <Row className='mt-3'>
                        <Col span={24}>
                            {this.props.mockType === 'callback'
                                ? (
                                    <FixedCallbackBuilder
                                        eventParams={this.props.eventParams}
                                        resourceDefinition={this.props.resourceDefinition}
                                        rootParameters={this.props.rootParameters}
                                        callbackDefinition={this.props.callbackDefinition}
                                        callbackRootParameters={this.props.callbackRootParameters}
                                        callbackObject={this.props.callbackObject}
                                    />
                                )
                                : null}
                        </Col>
                    </Row>
                    : null}

            </>
        );
    }
}
