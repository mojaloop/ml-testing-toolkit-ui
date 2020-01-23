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
  FormGroup,
  Form,
  Row,
  Button,
  Col,
  Table
} from "reactstrap";
// core components
import axios from 'axios';
import { Select, TreeSelect, Input, Tooltip, Tag } from 'antd';
import 'antd/dist/antd.css';

import { FactDataGenerator, FactSelect } from './BuilderTools.jsx';
// import './index.css';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;


class ValueSelector extends React.Component {

  constructor() {
    super();
    this.state = {
      ajvErrors: null
    }
  }
  validateAjv = null

  handleValueChange = (newValue) => {
    if (this.props.selectedFact) {
      // TODO: The props propagations and state changes should be optimized. Currently this method is called when we update the vlaue in props.
      // Its due to the hight level component in RulesCallback which is trying to re-render the whole page if any change in conditions detected.
      this.validateAjv = ajv.compile(this.props.selectedFact);
      const valid = this.validateAjv(newValue);
      if (valid) {
        this.props.onChange(newValue)
        this.setState({ajvErrors: ''})
      } else {
        this.setState({ajvErrors: this.validateAjv.errors})
      }
    }
  }


  getValueInput = () => {
    if(this.props.selectedFact && this.props.selectedFact.enum) {
      return (
        <Select
          onChange={this.handleValueChange}
          value={this.props.value}
        >
        { this.props.selectedFact.enum.map(item => {
          return (
            <Option key={item} value={item}>{item}</Option>
          )
        })}
        </Select>
      )
    } else {
      return (
        <>
          <Input placeholder="Value" 
          value={this.props.value}
          onChange={(e) => this.handleValueChange(e.target.value)}  />
        </>
      )
    }
  }

  getErrorMessage = () => {
    if(this.props.selectedFact && this.props.selectedFact.enum) {
      return (null)
    } else {
      if(this.state.ajvErrors && this.state.ajvErrors.length > 0) {
        return (
          <>
            <Tooltip title={ajv.errorsText(this.state.ajvErrors)}>
              <Tag color="red">errors found</Tag>
            </Tooltip>
          </>
        )
      }
    }
  }

  render() {
    return(
      <>
        { this.getValueInput() }
        { this.getErrorMessage() }
      </>
    )
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
      selectedOperator: null
    }
  }

  componentDidMount = async () => {
    const selectedFactType = this.allFactTypes.find(item => {
      return item.name === this.props.condition.fact
    })
    const selectedFactPath = this.props.condition.path
    await this.setState({ selectedFactType, selectedFactPath })
    this.updateFactData()
  }

  // handleFactChange = (newValue) => {
  //   this.props.condition.fact = newValue
  //   this.props.onConditionChange()
  // }

  handleValueChange = (newValue) => {
    this.props.condition.value = newValue
    this.props.onConditionChange()
  }

  handleDelete = () => {
    this.props.onDelete(this.props.index)
    this.props.onConditionChange()
  }

  factTypes = [
    {
      title: 'Request Body',
      name: 'body'
    },
    {
      title: 'Request Headers',
      name: 'headers'
    },
  ]

  allFactTypes = [
    {
      title: 'Request Body',
      name: 'body'
    },
    {
      title: 'Request Headers',
      name: 'headers'
    },
    {
      title: 'Request Path Parameters',
      name: 'pathParams'
    }
  ]

  havePathParams = () => {
    if (this.props.rootParameters) {
      const firstPathItem = this.props.rootParameters.find(item => {
        return item.in === 'path'
      })
      if (firstPathItem) {
        return true
      }
    }
    return false
  }

  getFactTypeItems = () => {
    let tempFactTypes = [...this.factTypes]
    if (this.havePathParams()) {
      tempFactTypes.push(
        {
          title: 'Request Path Parameters',
          name: 'pathParams'
        }
      )
    }
    return tempFactTypes.map((item) => {
      return(<Option key={item.name} value={JSON.stringify(item)}>{item.title}</Option>)
    })    
  }

  updateFactData = () => {
    if (this.state.selectedFactType) {
      switch(this.state.selectedFactType.name) {
        case 'body':
          this.setState( {factData: (new FactDataGenerator()).getBodyFactData(this.props.resourceDefinition)} )
          break
        case 'headers':
          this.setState( {factData: (new FactDataGenerator()).getHeadersFactData(this.props.resourceDefinition, this.props.rootParameters)} )
          break
        case 'pathParams':
          this.setState( {factData: (new FactDataGenerator()).getPathParametersFactData(this.props.rootParameters)} )
          break
        default:
          this.setState( {factData: null} )
      }
    } else {
      this.setState( {factData: null} )
    }
  }

  handleFactTypeSelect = async (value) => {
    try {
      const selectedValueObject = JSON.parse(value)
      await this.setState( {selectedFactType:  selectedValueObject, selectedFact: null, selectedFactPath: null} )
      this.props.condition.fact = selectedValueObject.name
      this.props.onConditionChange()
      this.updateFactData()
    } catch(err) {}
  }

  handleFactSelect = (value, factObject) => {
    // console.log('Selected', value, factObject)
    let selectedOperator = null
    if (this.props.condition.path === value) {
      selectedOperator = this.props.condition.operator
    }
    this.setState( { selectedFact: factObject, selectedOperator, selectedFactPath: value } )
    this.props.condition.path = value
    this.props.condition.operator = selectedOperator
    this.props.onConditionChange()
  }

  handleOperatorSelect = (operator) => {
    try {
      this.setState( {selectedOperator:  operator} )
      this.props.condition.operator = operator
      this.props.onConditionChange()
    } catch(err) {}
  }

  operatorDisplayNames = {
    numericEqual: 'Equal',
    numericNotEqual: 'Not Equal',
    numericLessThan: 'Less Than',
    numericGreaterThan: 'Greater Than',
    numericLessThanInclusive: 'Less Than or Equal to',
    numericGreaterThanInclusive: 'Greater Than or Equal to',
    dateBefore: 'Before',
    dateAfter: 'After',
  }
  propertyTitleOperators = {
    Amount: [ 'numericEqual', 'numericNotEqual', 'numericLessThan', 'numericGreaterThan', 'numericLessThanInclusive', 'numericGreaterThanInclusive' ],
  }
  getOperatorItems = () => {
    let operatorList = []
    if (this.state.selectedFact) {
      // Check the selectedFact is a string type
      if (this.state.selectedFact.type === 'string') {
        // Check the selectedFact title in openApi file and determine the list of operators
        if(this.propertyTitleOperators[this.state.selectedFact.title]) {
          this.propertyTitleOperators[this.state.selectedFact.title].map(item => {
            let displayName = item
            // Check whether the operator name is in display names, if found replace it
            if(this.operatorDisplayNames[item]) {
              displayName = this.operatorDisplayNames[item]
            }
            operatorList.push({ displayName, name: item })
          })
        } else {
          operatorList.push({displayName: 'Equal', name: 'equal'})
          operatorList.push({displayName: 'Not Equal', name: 'notEqual'})
        }
      }
    }


    return operatorList.map(item => {
      return(<Option key={item.name} value={item.name}>{item.displayName}</Option>)
    })
    // return []
  }

  render() {

    return (
      <>
        <Table className="shadow">
          <tbody>
          <tr>
          <td>
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-country"
              >
                Fact Type
              </label>
              <br />

              <Select 
                value={JSON.stringify(this.state.selectedFactType)}
                onChange={this.handleFactTypeSelect}
                style={{minWidth: '150px'}}
              >
                {this.getFactTypeItems()} 
              </Select>
            </FormGroup>
          </td>
          <td>
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-city"
              >
                Fact
              </label>
              <br />
              <FactSelect factData={this.state.factData} value={this.state.selectedFactPath} onSelect={this.handleFactSelect} />
            </FormGroup>
          </td>
          <td>
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-country"
              >
                Operator
              </label>
              <br />
              <Select style={{ width: 180 }} value={this.state.selectedOperator} onChange={this.handleOperatorSelect}>
                {this.getOperatorItems()}
              </Select>
            </FormGroup>
          </td>
        </tr>
        <tr>
          <td colSpan='2'>
            <FormGroup>
              <label
                className="form-control-label"
                htmlFor="input-country"
              >
                Value
              </label>
              <br />
              <ValueSelector value={this.props.condition.value} selectedFact={this.state.selectedFact} onChange={this.handleValueChange} />

            </FormGroup>
          </td>
          <td align='right'>
            <br />
            <Button
              color="danger"
              onClick={this.handleDelete}
              size="sm"
            >
              Delete
            </Button>
          </td>
          </tr>
          </tbody>
        </Table>
      </>

    )
  }
}

class Conditions extends React.Component {

  // componentDidUpdate = () => {
  //   console.log(this.props)
  // }

  handleConditionChange = (condition) => {
    this.props.onConditionsChange()
  }

  handleConditionDelete = (index) => {
    this.props.conditions.splice(index, 1)
  }

  render() {
    return(
      <>
      {
        this.props.conditions.map((condition, index) => {
          return (
            <Row key={index}>
              <Condition condition={condition} index={index} resource={this.props.resource} resourceDefinition={this.props.resourceDefinition} rootParameters={this.props.rootParameters}
                onConditionChange={this.handleConditionChange}
                onDelete={this.handleConditionDelete}
              />
            </Row>
          )
        })
      }
      </>
    )
  }
}



class ConditionBuilder extends React.Component {

  constructor() {
    super();
    this.state = {
    };
  }

  // async componentWillMount() {
  //   // this.getData()
  //   // await this.getDefinition()
  // }

  newCondition = {
    fact: null,
    operator: null,
    value: null
  }

  addCondition = () => {
    this.props.conditions.push({...this.newCondition})
    this.handleConditionsChange()
  }

  handleConditionsChange = () => {
    this.props.onChange({ conditions: this.props.conditions })
  }

  render() {

    return (
      <>
        <Conditions 
          conditions={this.props.conditions} 
          resource={this.props.resource}
          resourceDefinition={this.props.resourceDefinition}
          rootParameters={this.props.rootParameters}
          onConditionsChange={this.handleConditionsChange}
        />
        <Button
          color="primary"
          onClick={() => this.addCondition()}
          disabled={(this.props.resource? false : true)}
          size="sm"
        >
          Add Condition
        </Button>
      </>
    );
  }
}

export default ConditionBuilder;
