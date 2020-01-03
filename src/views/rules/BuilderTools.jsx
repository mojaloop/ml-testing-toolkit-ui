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
// import './index.css';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;


export class ValueSelector extends React.Component {

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
        <Select onChange={this.handleValueChange}>
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

export class FactSelect extends React.Component {
  constructor () {
    super()
    this.state = {
      value: undefined,
      treeData: [],
      factData: null
    };
  }

  componentDidMount = () => {
    this.componentDidUpdate()
  }

  componentDidUpdate = () => {
    if (this.state.factData !== this.props.factData) {
      let factTreeData = []
      if (this.props.factData) {
        factTreeData = this.getNodeFacts(this.props.factData);
      }
      this.setState({treeData: factTreeData, factData: this.props.factData, value: undefined})
      this.props.onSelect(undefined, null)
    }
  }

  getNodeFacts = (nodeData, parentId=0, valuePrefix='') => {
    let factTreeData = [];
    for (let property in nodeData.properties) {
      let isLeaf = true;
      const fact = nodeData.properties[property];
      if (fact.type === 'object') {
        isLeaf = false;
      }
      let random = Math.random()
      .toString(36)
      .substring(2, 6);
      factTreeData.push({ id: random, pId: parentId, value: valuePrefix + property, nodeObject: fact, title: property, isLeaf, disabled: !isLeaf });
    }
    return factTreeData;
  }

  onLoadData = treeNode =>
    new Promise(resolve => {
      const { id, nodeObject, value } = treeNode.props;
      setImmediate(() => {
        this.setState({
          treeData: this.state.treeData.concat(this.getNodeFacts(nodeObject, id, value + '.')),
        });
        resolve();
      });
    });

  onChange = (value, label, extra) => {
    this.setState({ value });
    this.props.onSelect(value, extra.triggerNode.props.nodeObject)
  };



  render() {
    const { treeData } = this.state;
    return (
      <TreeSelect
        treeDataSimpleMode
        style={{ width: '100%', minWidth: '200px' }}
        value={this.state.value}
        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        placeholder="Please select"
        onChange={this.onChange}
        loadData={this.onLoadData}
        treeData={treeData}
      />
    );
  }
}

export class FactDataGenerator {

  getBodyFactData = (resourceDefinition) => {
    let bodySchema = {}
    try {
      bodySchema = resourceDefinition.requestBody.content['application/json'].schema
    } catch(err) {
    }
    return bodySchema
  }

  getHeadersFactData = (resourceDefinition, rootParameters) => {
    // Convert header array in openapi file to object like requestBody
    let headerSchema = {
      properties: {}
    }
    let totalParameters
    if(rootParameters) {
      totalParameters = [...rootParameters]
    } else {
      totalParameters = []
    }
    try {
      totalParameters.concat(resourceDefinition.parameters).forEach((item) => {
        if (item.in === 'header') {
          headerSchema.properties[item.name] = item.schema
        }
      })
    } catch(err) {
      console.log(err)
    }
    return headerSchema
  }

  getPathParametersFactData = (rootParameters) => {
    // Convert path parameters array in openapi file to object like requestBody
    let pathParametersSchema = {
      properties: {}
    }
    try {
      rootParameters.forEach((item) => {
        if (item.in === 'path') {
          pathParametersSchema.properties[item.name] = item.schema
        }
      })
    } catch(err) {
      console.log(err)
    }
    return pathParametersSchema
  }
}


