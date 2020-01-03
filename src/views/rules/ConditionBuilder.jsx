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

import { FactDataGenerator, FactSelect, ValueSelector } from './BuilderTools.jsx';
// import './index.css';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;


class Condition extends React.Component {

  constructor() {
    super();
    this.state = {
      selectedFactType: null,
      selectedFact: null,
      factData: null,
      selectedOperator: null
    }
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
          name: 'pathParameters'
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
        case 'pathParameters':
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
      await this.setState( {selectedFactType:  selectedValueObject} )
      this.props.condition.fact = selectedValueObject.name
      this.props.onConditionChange()
      this.updateFactData()
    } catch(err) {}
  }

  handleFactSelect = (value, factObject) => {
    // console.log('Selected', value, factObject)
    this.setState( { selectedFact: factObject, selectedOperator: null } )
    this.props.condition.path = value
    this.props.condition.operator = null
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
    dateBefore: 'Before',
    dateAfter: 'After',
  }
  propertyTitleOperators = {
    Amount: [ 'numericEqual', 'numericNotEqual', 'numericLessThan', 'numericGreaterThan' ],
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
              <FactSelect factData={this.state.factData} onSelect={this.handleFactSelect} />
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
              <Select style={{ width: 120 }} value={this.state.selectedOperator} onChange={this.handleOperatorSelect}>
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
              <ValueSelector selectedFact={this.state.selectedFact} onChange={this.handleValueChange} />

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
      conditions: [],
      pathMethodConditions: [],
    };
  }

  async componentWillMount() {
    // this.getData()
    // await this.getDefinition()
  }

  newCondition = {
    fact: null,
    operator: null,
    value: null
  }

  addCondition = () => {
    this.state.conditions.push({...this.newCondition})
    this.handleConditionsChange()
  }

  handleConditionsChange = () => {
    this.props.onChange({ all: this.state.pathMethodConditions.concat(this.state.conditions) })
  }

  render() {

    return (
      <>
        <Conditions 
          conditions={this.state.conditions} 
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
