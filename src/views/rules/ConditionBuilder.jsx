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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';

// core components
import { Select, Row, Col, Button, Input, Tooltip, Tag, message, Popover, Card } from 'antd';
import 'antd/dist/antd.css';

import { FactDataGenerator, FactSelect } from './BuilderTools.jsx';
import { ConfigurableParameter } from './RuleEditor';
import ArrayInputValues from '../common/ArrayInputValues';
// import './index.css';
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

const { Option } = Select;

class ValueSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            ajvErrors: null,
        };
    }

    validateAjv = null;

    handleValueChange = newValue => {
        if(this.props.selectedFact) {
            // TODO: The props propagation and state changes should be optimized. Currently this method is called when we update the value in props.
            // Its due to the hight level component in RulesCallback which is trying to re-render the whole page if any change in conditions detected.
            // this.validateAjv = ajv.compile(this.props.selectedFact);
            // const valid = this.validateAjv(newValue);
            // Disabling AJV validation as it is failing to validate for integer types in value
            const valid = true;
            if(valid || newValue.startsWith('{$environment')) {
                this.props.onChange(newValue);
                this.setState({ ajvErrors: '' });
            } else {
                this.props.onChange(newValue);
                this.setState({ ajvErrors: this.validateAjv.errors });
            }
        }
    };

    getValueInput = () => {
        if(this.props.selectedFact && this.props.selectedFact.enum) {
            return (
                <Select
                    onChange={this.handleValueChange}
                    value={this.props.value}
                    style={{ width: 220 }}
                >
                    {this.props.selectedFact.enum.map(item => {
                        return (
                            <Option key={item} value={item}>{item}</Option>
                        );
                    })}
                </Select>
            );
        } else if(this.props.selectedOperator === 'in' || this.props.selectedOperator === 'notIn') {
            return (
                <>
                    <ArrayInputValues
                        placeholder='Value'
                        values={this.props.value && this.props.value.split(',')}
                        onChange={newValue => {
                            this.handleValueChange(newValue.join(','));
                        }}
                    />
                </>
            );
        } else {
            return (
                <>
                    <Input
                        placeholder='Value'
                        value={this.props.value}
                        onChange={e => this.handleValueChange(e.target.value)}
                    />
                </>
            );
        }
    };

    getErrorMessage = () => {
        if(this.props.selectedFact && this.props.selectedFact.enum) {
            return (null);
        } else {
            if(this.state.ajvErrors && this.state.ajvErrors.length > 0) {
                return (
                    <>
                        <Tooltip title={ajv.errorsText(this.state.ajvErrors)}>
                            <Tag color='red'>errors found</Tag>
                        </Tooltip>
                    </>
                );
            }
        }
    };

    render() {
        return (
            <>
                {this.getValueInput()}
                {this.getErrorMessage()}
            </>
        );
    }
}

class Condition extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedFactType: null,
            selectedFact: null,
            selectedFactPath: null,
            factData: null,
            selectedOperator: null,
            allParameters: [],
        };
    }

    componentDidMount = async () => {
        const selectedFactType = this.allFactTypes.find(item => {
            return item.name === this.props.condition.fact;
        });
        const selectedFactPath = this.props.condition.path;
        let allParameters = [];
        if(this.props.rootParameters) {
            allParameters = allParameters.concat(this.props.rootParameters);
        }
        if(this.props.resourceDefinition && this.props.resourceDefinition.parameters) {
            allParameters = allParameters.concat(this.props.resourceDefinition.parameters);
        }

        await this.setState({ selectedFactType, selectedFactPath, allParameters });
        this.updateFactData();
    };

    // handleFactChange = (newValue) => {
    //   this.props.condition.fact = newValue
    //   this.props.onConditionChange()
    // }

    handleValueChange = newValue => {
        this.props.condition.value = newValue;
        this.props.onConditionChange();
    };

    handleDelete = () => {
        this.props.onDelete(this.props.index);
        this.props.onConditionChange();
    };

    factTypes = [
        {
            title: 'Request Body',
            name: 'body',
        },
        {
            title: 'Request Headers',
            name: 'headers',
        },
    ];

    allFactTypes = [
        {
            title: 'Request Body',
            name: 'body',
        },
        {
            title: 'Request Headers',
            name: 'headers',
        },
        {
            title: 'Request Path Parameters',
            name: 'pathParams',
        },
        {
            title: 'Request Query Parameters',
            name: 'queryParams',
        },
    ];

    havePathParams = () => {
        if(this.state.allParameters) {
            const firstPathItem = this.state.allParameters.find(item => {
                return item.in === 'path';
            });
            if(firstPathItem) {
                return true;
            }
        }
        return false;
    };

    haveQueryParams = () => {
        if(this.state.allParameters) {
            const firstQueryItem = this.state.allParameters.find(item => {
                return item.in === 'query';
            });
            if(firstQueryItem) {
                return true;
            }
        }
        return false;
    };

    getFactTypeItems = () => {
        const tempFactTypes = [...this.factTypes];
        if(this.havePathParams()) {
            tempFactTypes.push(
                {
                    title: 'Request Path Parameters',
                    name: 'pathParams',
                },
            );
        }
        if(this.haveQueryParams()) {
            tempFactTypes.push(
                {
                    title: 'Request Query Parameters',
                    name: 'queryParams',
                },
            );
        }
        return tempFactTypes.map(item => {
            return (<Option key={item.name} value={JSON.stringify(item)}>{item.title}</Option>);
        });
    };

    updateFactData = () => {
        if(this.state.selectedFactType) {
            switch (this.state.selectedFactType.name) {
                case 'body':
                    this.setState({ factData: (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition) });
                    break;
                case 'headers':
                    this.setState({ factData: (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters) });
                    break;
                case 'pathParams':
                    this.setState({ factData: (new FactDataGenerator()).getPathParametersFactData(this.state.allParameters) });
                    break;
                case 'queryParams':
                    this.setState({ factData: (new FactDataGenerator()).getQueryParametersFactData(this.state.allParameters) });
                    break;
                default:
                    this.setState({ factData: null });
            }
        } else {
            this.setState({ factData: null });
        }
    };

    handleFactTypeSelect = async value => {
        try {
            const selectedValueObject = JSON.parse(value);
            await this.setState({ selectedFactType: selectedValueObject, selectedFact: null, selectedFactPath: null });
            this.props.condition.fact = selectedValueObject.name;
            this.props.onConditionChange();
            this.updateFactData();
        } catch (err) {}
    };

    handleFactSelect = (value, factObject) => {
        // console.log('Selected', value, factObject)
        let selectedOperator = null;
        if(this.props.condition.path === value) {
            selectedOperator = this.props.condition.operator;
        }
        this.setState({ selectedFact: factObject, selectedOperator, selectedFactPath: value });
        this.props.condition.path = value;
        this.props.condition.operator = selectedOperator;
        this.props.onConditionChange();
    };

    handleOperatorSelect = operator => {
        try {
            this.setState({ selectedOperator: operator });
            this.props.condition.operator = operator;
            this.props.onConditionChange();
        } catch (err) {}
    };

    operatorDisplayNames = {
        numericEqual: 'Equal',
        numericNotEqual: 'Not Equal',
        numericLessThan: 'Less Than',
        numericGreaterThan: 'Greater Than',
        numericLessThanInclusive: 'Less Than or Equal to',
        numericGreaterThanInclusive: 'Greater Than or Equal to',
        dateBefore: 'Before',
        dateAfter: 'After',
    };

    propertyTitleOperators = {
        Amount: ['numericEqual', 'numericNotEqual', 'numericLessThan', 'numericGreaterThan', 'numericLessThanInclusive', 'numericGreaterThanInclusive'],
    };

    getOperatorItems = () => {
        const operatorList = [];
        if(this.state.selectedFact) {
            // Check the selectedFact is a string type
            if(this.state.selectedFact.type === 'string') {
                // Check the selectedFact title in openApi file and determine the list of operators
                if(this.propertyTitleOperators[this.state.selectedFact.title]) {
                    this.propertyTitleOperators[this.state.selectedFact.title].map(item => {
                        let displayName = item;
                        // Check whether the operator name is in display names, if found replace it
                        if(this.operatorDisplayNames[item]) {
                            displayName = this.operatorDisplayNames[item];
                        }
                        operatorList.push({ displayName, name: item });
                    });
                } else {
                    operatorList.push({ displayName: 'Equal', name: 'equal' });
                    operatorList.push({ displayName: 'Not Equal', name: 'notEqual' });
                    operatorList.push({ displayName: 'In', name: 'in' });
                    operatorList.push({ displayName: 'Not In', name: 'notIn' });
                }
            } else if(this.state.selectedFact.type === 'integer') {
                operatorList.push({ displayName: 'Equal', name: 'equal' });
                operatorList.push({ displayName: 'Not Equal', name: 'notEqual' });
                operatorList.push({ displayName: 'Less Than', name: 'lessThan' });
                operatorList.push({ displayName: 'Less Than or Equal to', name: 'lessThanInclusive' });
                operatorList.push({ displayName: 'Greater Than', name: 'greaterThan' });
                operatorList.push({ displayName: 'Greater Than or Equal to', name: 'greaterThanInclusive' });
            } else {
                operatorList.push({ displayName: 'Equal', name: 'equal' });
                operatorList.push({ displayName: 'Not Equal', name: 'notEqual' });
            }
        }

        return operatorList.map(item => {
            return (<Option key={item.name} value={item.name}>{item.displayName}</Option>);
        });
        // return []
    };

    render() {
        return (
            <Card>
                <Row>
                    <Col span={8}>
                        <label>
              Fact Type
                        </label>
                        <br />

                        <Select
                            value={JSON.stringify(this.state.selectedFactType)}
                            onChange={this.handleFactTypeSelect}
                            style={{ width: '100%' }}
                        >
                            {this.getFactTypeItems()}
                        </Select>
                    </Col>
                    <Col span={8} className='pl-2'>
                        <label>
              Fact
                        </label>
                        <br />
                        <FactSelect factData={this.state.factData} value={this.state.selectedFactPath} onSelect={this.handleFactSelect} />
                    </Col>
                    <Col span={8} className='pl-2'>
                        <label>
              Operator
                        </label>
                        <br />
                        <Select style={{ width: '100%' }} value={this.state.selectedOperator} onChange={this.handleOperatorSelect}>
                            {this.getOperatorItems()}
                        </Select>
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={8}>
                        <label>
              Value
                        </label>
                        <br />
                        <ValueSelector value={this.props.condition.value} selectedFact={this.state.selectedFact} selectedOperator={this.state.selectedOperator} onChange={this.handleValueChange} />

                    </Col>
                    <Col span={16}>
                        <br />
                        <Button
                            className='float-right'
                            type='primary'
                            danger
                            onClick={this.handleDelete}
                        >
              Delete
                        </Button>
                    </Col>
                </Row>
            </Card>

        );
    }
}

class Conditions extends React.Component {
    // componentDidUpdate = () => {
    //   console.log(this.props)
    // }

    handleConditionChange = condition => {
        this.props.onConditionsChange();
    };

    handleConditionDelete = index => {
        this.props.conditions.splice(index, 1);
    };

    render() {
        return (
            <>
                {
                    this.props.conditions.map((condition, index) => {
                        return (
                            <Row key={index} className='mt-2'>
                                <Col span={24}>
                                    <Condition
                                        condition={condition} index={index} resource={this.props.resource} resourceDefinition={this.props.resourceDefinition} rootParameters={this.props.rootParameters}
                                        onConditionChange={this.handleConditionChange}
                                        onDelete={this.handleConditionDelete}
                                    />
                                </Col>
                            </Row>
                        );
                    })
                }
            </>
        );
    }
}

class ConditionBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            configurableParameterSelected: '',
        };
    }

    // async componentWillMount() {
    //   // this.getData()
    //   // await this.getDefinition()
    // }

    newCondition = {
        fact: null,
        operator: null,
        value: null,
    };

    addCondition = () => {
        this.props.conditions.push({ ...this.newCondition });
        this.handleConditionsChange();
    };

    handleConditionsChange = () => {
        this.props.onChange({ conditions: this.props.conditions });
    };

    handleAddConfigParam = newValue => {
        this.setState({ configurableParameterSelected: `{$environment.${newValue}}` });
    };

    handleConfigParamCopyToClipboard = () => {
        navigator.clipboard.writeText(this.state.configurableParameterSelected);
        message.success('Copied to clipboard');
    };

    render() {
        const content = (
            <>
                <Row>
                    <Col>
                        <ConfigurableParameter
                            onChange={this.handleAddConfigParam}
                            environment={this.props.environment}
                        />
                    </Col>
                </Row>
                {
                    this.state.configurableParameterSelected
                        ? (
                            <Row className='mt-4 text-center'>
                                <Col>
                Click below to copy <br />
                                    <Tag color='geekblue'><a onClick={this.handleConfigParamCopyToClipboard}>{this.state.configurableParameterSelected}</a></Tag>
                                </Col>
                            </Row>
                        )
                        : null
                }
            </>
        );
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Conditions
                            conditions={this.props.conditions}
                            resource={this.props.resource}
                            resourceDefinition={this.props.resourceDefinition}
                            rootParameters={this.props.rootParameters}
                            onConditionsChange={this.handleConditionsChange}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={24} className='mt-2'>
                        <Button
                            type='primary'
                            onClick={() => this.addCondition()}
                            disabled={(!this.props.resource)}
                        >
              Add Condition
                        </Button>
                        <Popover className='ml-2' content={content} title='Select a Configurable Parameter' trigger='click'>
                            <Button color='secondary' size='sm'>Add Configurable Params</Button>
                        </Popover>
                    </Col>
                </Row>

            </>
        );
    }
}

export default ConditionBuilder;
