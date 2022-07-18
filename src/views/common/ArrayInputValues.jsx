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

import React from 'react'
import { Input, Row, Col, Button, Card } from 'antd'
import { DeleteTwoTone } from '@ant-design/icons'
import 'antd/dist/antd.css'

class ArrayInputValues extends React.Component {
  state = {
    values: []
  }

  componentDidMount = async () => {
    if (!this.props.values || !Array.isArray(this.props.values)) {
      this.props.onChange([])
    } else {
      this.setState({ values: this.props.values })
    }
  }

  handleDeleteClick = (itemIndex) => {
    this.state.values.splice(itemIndex, 1)
    this.props.onChange(this.state.values)
  }

  getInputItems = () => {
    const inputItems = []
    for (let i = 0; i < this.state.values.length; i++) {
      inputItems.push(
        <Row className='mb-2' key={i}>
          <Col span={24}>
            <Row gutter={8}>
              <Col span={23}>
                <Input
                  value={this.state.values[i]}
                  onChange={(e) => {
                    this.state.values[i] = e.target.value
                    this.props.onChange(this.state.values)
                  }}
                />
              </Col>
              <Col span={1}>
                <DeleteTwoTone
                  key={i} type='delete' theme='filled'
                  onClick={() => this.handleDeleteClick(i)}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      )
    }
    return inputItems
  }

  handleAddInputValue = () => {
    this.state.values.push('')
    this.props.onChange(this.state.values)
  }

  render () {
    return (
      <>
        <Row gutter={16}>
          <Col span={24}>
            <Card size='small'>
              <Row className='mb-2'>
                <Col span={24}>
                  <Button
                    className='text-right float-right'
                    color='primary'
                    size='sm'
                    onClick={this.handleAddInputValue}
                  >
                    Add
                  </Button>
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

export default ArrayInputValues
