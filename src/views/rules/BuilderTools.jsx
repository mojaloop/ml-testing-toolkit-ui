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
import jsf from 'json-schema-faker';
// import './index.css';
import Ajv from 'ajv';
const ajv = new Ajv({allErrors: true});

const { Option } = Select;

jsf.option('alwaysFakeOptionals', true);

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

      let value = undefined
      if (this.props.value) {
        value = this.props.value
        const selectedFact = this.findValueInFactData(value, this.props.factData)
        this.props.onSelect(value, selectedFact)
      }

      this.setState({treeData: factTreeData, factData: this.props.factData, value})
    }
  }

  findValueInFactData = (value, factData) => {
    
    const valueArr = value.split('.')
    let tFactData = this.props.factData
    
    for(let i=0; i<valueArr.length; i++) {
      const factTreeData = this.getNodeFacts(tFactData);
      const tFact = factTreeData.find(item => {
        return item.value === valueArr[i]
      })
      if(!tFact) {
        return null
      }
      tFactData = tFact.nodeObject
    }
    return tFactData

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
      factTreeData.push({ id: random, pId: parentId, value: valuePrefix + property, nodeObject: fact, title: property, isLeaf, disabled: !isLeaf && !this.props.enableNodesSelection });
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

  getBodySample = (resourceDefinition) => {
    let bodySample = null
    try {
      bodySample = resourceDefinition['x-examples']['application/json']
    } catch(err) {
    }
    return bodySample
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

  getCustomFactData = (inputArr) => {
    let customSchema = {
      properties: {}
    }
    try {
      inputArr.forEach((item) => {
        customSchema.properties[item] = {
          type: 'string'
        }
      })
    } catch(err) {
      console.log(err)
    }
    return customSchema
  }

  getPathParametersFactData = (parameters) => {
    // Convert path parameters array in openapi file to object like requestBody
    let pathParametersSchema = {
      properties: {}
    }
    try {
      parameters.forEach((item) => {
        if (item.in === 'path') {
          pathParametersSchema.properties[item.name] = item.schema
        }
      })
    } catch(err) {
      console.log(err)
    }
    return pathParametersSchema
  }

  getQueryParametersFactData = (parameters) => {
    // Convert path parameters array in openapi file to object like requestBody
    let queryParametersSchema = {
      properties: {}
    }
    try {
      parameters.forEach((item) => {
        if (item.in === 'query') {
          queryParametersSchema.properties[item.name] = item.schema
        }
      })
    } catch(err) {
      console.log(err)
    }
    return queryParametersSchema
  }

  getSelectedResponseBodySchema = (responses, statusCode) => {
    let bodySchema = {}
    try {
      bodySchema = responses[statusCode].content['application/json'].schema
    } catch(err) {
    }
    return bodySchema
  }

  getSelectedResponseHeaders = (responses) => {
    let headers = {}
    try {
      const successCode = this.pickSuccessCodeFromResponsesObject(responses)
      headers = responses[successCode].headers
    } catch(err) {
    }
    return headers
  }

  pickSuccessCodeFromResponsesObject = (responses) => {
    let successCode
    for (let responseCode in responses) {
      if(responseCode >= 200 && responseCode <=299) {
        successCode = responseCode
        break
      }
    }
    if(successCode) {
      return successCode
    } else {
      return 'default'
    }
  }

  generateSample = async (schema) => {
    const sample = await jsf.resolve(schema,)
    return sample
  }
}


