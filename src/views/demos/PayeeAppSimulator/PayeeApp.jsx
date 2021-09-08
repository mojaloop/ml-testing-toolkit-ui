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
import { Row, Col, Typography, notification, Statistic, Card, Table, Tag, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

import axios from 'axios';

import NotificationService from '../../../services/demos/PayeeAppSimulator/payeeNotifications'
import { getConfig } from '../../../utils/getConfig'

const { Text, Title } = Typography

class PayeeMobile extends React.Component {
  state = {
    receivedAmount: null,
    payeeReceiveAmount: null,
    payerComplexName: null,
    balance: {},
    transactionHistory: [],
    partyIdValue: '18045042357'
  }

  constructor () {
    super()
    this.notificationServiceObj = new NotificationService()
    // const sessionId = this.notificationServiceObj.getSessionId()
  }

  componentDidMount = async () => {
    this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents)
    const { apiBaseUrl } = getConfig()
    const environmentRes = await axios.get(`${apiBaseUrl}/api/objectstore/inboundEnvironment`)
    if (environmentRes.status == 200) {
      const partyData = environmentRes.data && environmentRes.data.partyData && environmentRes.data.partyData['MSISDN/' + this.state.partyIdValue]
      if(partyData) {
        this.setState({balance: partyData.balance, transactionHistory: partyData.transactionHistory.reverse()})
      }
    }
  }

  componentWillUnmount = () => {
    this.notificationServiceObj.disconnect()
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

  render() {
    return (
      <>
        <Row style={{marginTop: 100}}></Row>
        <Row className='mt-4'>
          <Col span={24} className='text-center'>
            <Title level={3}>Welcome {this.state.partyIdValue}</Title>
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
    );
  }
}

export default PayeeMobile;
