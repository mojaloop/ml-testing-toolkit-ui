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

import React from "react";
import { Input, Row, Col, Descriptions, message, Popover, Button, Card, Checkbox, Radio, Typography } from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';

const {Text, Title} = Typography

class InputValues extends React.Component {

  state = {
    addInputValueDialogVisible: false,
    newInputValueName: '',
    newInputValueType: 'string'
  };

  handleDeleteClick = (inputValueName) => {
    this.props.onDelete(inputValueName)
  }
  getInputItemType = (inputValueName) => {
    if (typeof this.props.values[inputValueName] === 'boolean') {
      return (
        <Checkbox
          checked={this.props.values[inputValueName]}
          onChange={(e) => this.props.onChange(inputValueName, e.target.checked)}
        />
      )
    } else if (typeof this.props.values[inputValueName] === 'number') {
      return (
        <Input
          value={this.props.values[inputValueName]}
          onChange={(e) => this.props.onChange(inputValueName, +e.target.value)}
        />
      )
    } else {
      return (
        <Input
          value={this.props.values[inputValueName]}
          onChange={(e) => this.props.onChange(inputValueName, e.target.value)}
        />
      )
    }
  }

  getInputItems = () => {
    let inputItems = []
    let i = 0
    for (let inputValueName in this.props.values) {
      inputItems.push(
          <Row className='mb-2' key={inputValueName}>
            <Col span={12}>
              <Text>{inputValueName}</Text>
            </Col>
            <Col span={12}>
              <Row gutter={8}>
                <Col span={23}>
                  {this.getInputItemType(inputValueName)}
                </Col>
                <Col span={1}>
                  <DeleteTwoTone key={inputValueName} type="delete" theme="filled"
                    onClick={() => this.handleDeleteClick(inputValueName)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
      )
    }
    return inputItems
  }

  handleAddInputValue = (inputValueName) => {
    // Check if the input value name already exists
    if (this.props.values && this.props.values.hasOwnProperty(inputValueName)) {
      message.error({ content: 'The input value name already exists', key: 'InputValueNameExists', duration: 3 });
    } else {
      // Save the input value
      let newValue = ''
      if (this.state.newInputValueType === 'number') {
        newValue = 0
      } else if (this.state.newInputValueType === 'boolean') {
        newValue = false
      }
      this.props.onChange(inputValueName, newValue)
      this.state.newInputValueName = ''
    }
  }


  render() {
    const addInputValueDialogContent = (
      <>
        <Input
          placeholder="Input Value Name"
          type="text"
          value={this.state.newInputValueName}
          onChange={(e) => { this.setState({ newInputValueName: e.target.value }) }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              this.setState({ addInputValueDialogVisible: false })
            }
          }}
          onPressEnter={() => {
            this.handleAddInputValue(this.state.newInputValueName)
            this.setState({ addInputValueDialogVisible: false })
          }}
        />
        <Radio.Group onChange={(e) => {
          this.setState({ newInputValueType: e.target.value })
        }}
          value={this.state.newInputValueType}
        >
          <Radio value='string'>String</Radio>
          <Radio value='number'>Number</Radio>
          <Radio value='boolean'>Boolean</Radio>
        </Radio.Group>
        <Button
          className="text-right mt-2"
          color="success"
          href="#pablo"
          onClick={() => {
            this.handleAddInputValue(this.state.newInputValueName)
            this.setState({ addInputValueDialogVisible: false })
          }}
          size="sm"
        >
          Add
      </Button>
      </>
    )

    return (
      <>
        <Row gutter={16}>
          <Col span={24}>
            <Card className="bg-white shadow" size='default'>
              <Row className='mb-2'>
                <Col span={24}>
                  <Popover
                    content={addInputValueDialogContent}
                    title="Enter a new name"
                    trigger="click"
                    zIndex={1101}
                    visible={this.state.addInputValueDialogVisible}
                    onVisibleChange={(visible) => this.setState({ addInputValueDialogVisible: visible })}
                  >
                    <Button
                      className="text-right float-right"
                      color="primary"
                      size="sm"
                    >
                      Add Input Value
                    </Button>
                  </Popover>
                </Col>
              </Row>
              {this.getInputItems()}
            </Card>
          </Col>
        </Row>
      </>
    )
  }
}

export default InputValues;