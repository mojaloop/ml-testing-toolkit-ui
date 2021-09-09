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
import { Row, Col, Typography, notification, Statistic, Card, Table, Tag, Layout, Form, Input, Button, message } from 'antd';

import { CheckOutlined } from '@ant-design/icons';

import axios from 'axios';

import NotificationService from '../../../services/demos/PayeeAppSimulator/payeeNotifications'
import { getConfig } from '../../../utils/getConfig'

import BrandIcon from './BrandIcon'

const { Text, Title } = Typography

class PayeeMobile extends React.Component {
  state = {
    receivedAmount: null,
    payeeReceiveAmount: null,
    payerComplexName: null,
    balance: {},
    transactionHistory: [],
    party: {}
  }

  componentDidMount = async () => {
    if (!this.state.party.idValue) {
      const partyFoundStr = localStorage.getItem('party')
      try {
        const partyFound = JSON.parse(partyFoundStr)
        if (partyFound.idValue) {
          this.state.party = partyFound
          this.forceUpdate()
          this.initStuff()
        }
      } catch(err) {}
    }
  }

  initStuff = async () => {
    if (this.state.party.idValue) {
      const partyIdType = this.state.party.idType
      const partyIdValue = this.state.party.idValue
      this.notificationServiceObj = new NotificationService(partyIdType + '/' + partyIdValue)
      this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents)

      const { apiBaseUrl } = getConfig()
      const environmentRes = await axios.get(`${apiBaseUrl}/api/objectstore/inboundEnvironment`)
      if (environmentRes.status == 200) {
        const partyData = environmentRes.data && environmentRes.data.partyData && environmentRes.data.partyData[partyIdType + '/' + partyIdValue]
        if(partyData) {
          this.setState({balance: partyData.balance, transactionHistory: partyData.transactionHistory.reverse()})
        }
      }
    }
  }

  cleanupStuff = () => {
    if (this.notificationServiceObj) {
      this.notificationServiceObj.disconnect()
    }
  }

  componentWillUnmount = () => {
    this.cleanupStuff()
  }

  resetState = () => {
    this.setState({receivedAmount: null, payeeReceiveAmount: null, payerComplexName: null, stage: null})
  }

  handleNotificationEvents = (event) => {
    console.log(event)
    const amountStr = event.transaction.amount + ' ' + event.transaction.currency
    const payerInfo = `${event.transaction.from.idValue}` + (event.transaction.from.displayName? ` (${event.transaction.from.displayName})` : '')
    this.setState({balance: event.newBalance, balanceCurrency: event.transaction.currency, transactionHistory: event.transactionHistory.reverse()})
    this.openNotification(`Received amount ${amountStr}`, `from ${payerInfo}`)
  }

  openNotification = (message, description) => {
    notification.open({
      message,
      description,
      duration: 6,
      placement: 'topLeft',
      ...this.props.notificationProperties,
      icon: <CheckOutlined style={{ color: '#10e98e' }} />,
    });
  };

  getTransactionHistory = () => {
    const columns = [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: date => (new Date(date)).toUTCString()
      },
      {
        title: 'From',
        dataIndex: 'from',
        key: 'from',
        render: from => {
          return (
            <>
            <Text>{from.displayName}</Text>&nbsp;
            <Tag color='geekblue' key={from.idValue}>
              {from.idValue}
            </Tag>
            </>
          );
        }
      },
      {
        title: 'Amount',
        key: 'amount',
        dataIndex: 'amount',
        render: (amount,record) => {
          return (
            <Text strong key={amount}>
              {amount} {record.currency}
            </Text>
          );
        }
      }
    ];
    return (
      <Table columns={columns} dataSource={this.state.transactionHistory} />
    )
  }

  handleLogout = () => {
    localStorage.clear()
    this.setState({party: {}})
    this.cleanupStuff()
  }

  handleLogin = async (formValues) => {
    try {
      const { apiBaseUrl } = getConfig()
      const res = await axios.get(apiBaseUrl + '/api/objectstore/partyInfo')
      if (res.status === 200 && res.data && res.data.provisionedParties) {
        const provisionedParties = res.data.provisionedParties
        const partyFound = provisionedParties.find(party => party.idValue === formValues.username)
        if (partyFound) {
          console.log(partyFound)
          message.success({ content: 'login successful', key: 'login', duration: 1, ...this.props.messageProperties })
          localStorage.setItem('party', JSON.stringify(partyFound))
          this.state.party = partyFound
          this.forceUpdate()
          this.initStuff()
        } else {
          throw new Error()
        }
        return
      }
    } catch (err) {}
    message.error({ content: 'login failed', key: 'login', duration: 3, ...this.props.messageProperties })
  }

  onLoginFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  render() {
    return (
      this.state.party?.idValue
      ? (
        <>
          <Row className='mt-3'>
            <Col span={12}>
              <span className='ml-3'>
                <BrandIcon width='100px' className='float-center' />
              </span>
            </Col>
            <Col span={12}>
              <span className='float-right mr-3 mt-2'>
                <Row>
                  <Col span={24}>
                    <Button
                      className='float-right'
                      onClick={this.handleLogout}
                    >
                      Logout
                    </Button>
                  </Col>
                </Row>
                <Row className='mt-2'>
                  <Col span={24}>
                    <Text className='float-right' type='secondary' strong>{this.state.party.idValue}</Text>
                  </Col>
                </Row>
              </span>
            </Col>
          </Row>
          <Row style={{marginTop: 30}}></Row>
          <Row className='mt-4'>
            <Col span={24} className='text-center'>
              <Title level={3}>Welcome {this.state.party.displayName}</Title>
            </Col>
          </Row>
          <Row className='mt-4'>
            <Col span={24} className='text-center'>
              <Card className='shadow'>
                {
                  Object.keys(this.state.balance).map(currency => {
                    return (
                      <Statistic
                        title="Account Balance"
                        value={this.state.balance[currency]}
                        precision={0}
                        valueStyle={{ color: '#3f8600' }}
                        suffix={currency}
                      />
                    )
                  })
                }

              </Card>
            </Col>
          </Row>
          <Row className='mt-4'>
            <Col span={24} className='text-center'>
              { this.getTransactionHistory() }
            </Col>
          </Row>
        </>
      )
      : (
        <Layout style={{backgroundColor: '#ffffff', height: '100%'}}>
          <Layout.Content>
            <Row style={{marginTop: '100px', textAlign: 'center'}}>
              <Col span={24}>
                <BrandIcon width='150px' className='float-center' />
              </Col>
            </Row>
            <Row style={{marginTop: '100px'}}>
              <Col colspan={24} className='mx-auto'>
                <Card className='shadow ml-1 mr-1 mt-n5 align-middle p-2' style={{width: '100%'}}>
                <Form
                  name="basic"
                  labelCol={{
                    span: 8,
                  }}
                  wrapperCol={{
                    span: 16,
                  }}
                  initialValues={{
                    // remember: false,
                  }}
                  onFinish={(this.handleLogin)}
                  onFinishFailed={this.onLoginFailed}
                >
                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your username!',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      {
                        required: false,
                        message: 'Please input your password!',
                      },
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>

                  <Form.Item
                    wrapperCol={{
                      offset: 8,
                      span: 16,
                    }}
                  >
                    <Button type="primary" htmlType="submit">
                      Login
                    </Button>
                  </Form.Item>
                </Form>
                </Card>
              </Col>
            </Row>
          </Layout.Content>
        </Layout>
      )
    );
  }
}

export default PayeeMobile;
