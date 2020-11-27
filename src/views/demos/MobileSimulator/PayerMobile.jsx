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
import { Row, Col, InputNumber, Input, Typography, Skeleton, Card, Button, Result } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
const { Text } = Typography

class PayerMobile extends React.Component {
  state = {
    gettingPartyInfo: false,
    stage: null,
    amount: 1000,
  }

  componentDidMount = async () => {
  }

  getStageData = () => {
    switch(this.state.stage) {
      case 'getParties':
      case 'postQuotes':
      case 'postTransfers':
        return <Skeleton active />
      case 'putParties':
        return (
          <Card className='mr-3'>
            <Row>
              <Col span={12}>
                <Text>F.Name:</Text>
              </Col>
              <Col span={12}>
                <Text strong>Harry</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>M.Name:</Text>
              </Col>
              <Col span={12}>
                <Text strong>M</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>L.Name:</Text>
              </Col>
              <Col span={12}>
                <Text strong>Williams</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>Bank:</Text>
              </Col>
              <Col span={12}>
                <Text strong>Jio Money</Text>
              </Col>
            </Row>
            <Row className='mt-4'>
              <Col span={24}>
                <Text strong>Amount:</Text>
                <InputNumber
                  className='ml-2'
                  value={this.state.amount}
                  onChange={(newNumber) => {
                    this.setState({amount: newNumber})
                  }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Col>
            </Row>
            <Row className='mt-4'>
              <Col span={24} className='text-center'>
                <Button type='primary' shape="round" danger onClick={this.handleGetQuote}>Get Quote</Button>
              </Col>
            </Row>
            
          </Card>
        )
      case 'putQuotes':
        return (
          <Card className='mr-3'>
            <Row>
              <Col span={12}>
                <Text>Transfer Amount:</Text>
              </Col>
              <Col span={12}>
                <Text strong>$100</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>Payee receive Amount:</Text>
              </Col>
              <Col span={12}>
                <Text strong>$95</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>Payee Fsp Fee:</Text>
              </Col>
              <Col span={12}>
                <Text strong>$3</Text>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Text>payeeFspCommission:</Text>
              </Col>
              <Col span={12}>
                <Text strong>$2</Text>
              </Col>
            </Row>
            <Row className='mt-4'>
              <Col span={12} className='text-center'>
                <Button type='primary' shape="round" danger onClick={this.handleCancel}>Cancel</Button>
              </Col>
              <Col span={12} className='text-center'>
                <Button type='primary' shape="round" success onClick={this.handleSend}>Proceed</Button>
              </Col>
            </Row>
            
          </Card>
        )
      case 'putTransfers':
        return (
          <Row>
            <Col span={24} className='text-center'>
              <Result
                status="success"
                title="Sent $100"
                subTitle="to Harry"
              />
            </Col>
          </Row>
        )
      default:
        return null
    }
  }

  handleSearch = (idNumber) => {
    this.setState({gettingPartyInfo: true, stage: 'getParties'})
    this.props.onGetParties(idNumber)
    setTimeout(() => {
      this.setState({gettingPartyInfo: false, stage: 'putParties'})
      this.props.onPutParties(idNumber)
    }, 1000)
  }

  handleGetQuote = (e) => {
    this.setState({stage: 'postQuotes'})
    this.props.onPostQuotes()
    setTimeout(() => {
      this.setState({stage: 'putQuotes'})
      this.props.onPutQuotes()
    }, 1000)    
  }

  handleSend = (e) => {
    this.setState({stage: 'postTransfers'})
    this.props.onPostTransfers()
    setTimeout(() => {
      this.setState({stage: 'putTransfers'})
      this.props.onPutTransfers()
    }, 1000)    
  }
  
  handleCancel = (e) => {
    this.setState({stage: null})
    // this.props.resetEverything()  
  }

  render() {
    return (
      <>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Input.Search
            placeholder='Phone Number'
            loading={this.state.gettingPartyInfo}
            defaultValue={'987654321'}
            onSearch={this.handleSearch}
          />
        </Col>
      </Row>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          { this.getStageData() }
        </Col>
      </Row>
      </>

    );
  }
}

export default PayerMobile;
