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
import { Row, Col, Drawer, Button, Typography } from 'antd';
import { CaretRightFilled, CaretLeftFilled } from '@ant-design/icons';

import mobile_left from '../../../assets/img/mobile_pink_iphone.png';
import mobile_right from '../../../assets/img/mobile_green_iphone.png';

import PayerMobile from "./PayerMobile.jsx";
import PayeeMobile from "./PayeeMobile.jsx";
import TestDiagram from "./TestDiagram.jsx";
import TestMonitor from "./TestMonitor.jsx";
import NotificationService from '../../../services/demos/MobileSimulator/mojaloopNotifications'
import OutboundService from '../../../services/demos/MobileSimulator/mojaloopOutbound'

const {Text} = Typography

class MobileSimulator extends React.Component {
  state = {
    payerName: 'Pink Bank',
    hubName: 'Mojaloop Switch',
    payeeName: 'Green Bank',
    payerLogsDrawerVisible: false,
    payeeLogsDrawerVisible: false
  }

  constructor () {
    super()
    this.payerMobileRef = React.createRef();
    this.payeeMobileRef = React.createRef();
    this.testDiagramRef = React.createRef();
    this.payerMonitorRef = React.createRef();
    this.payeeMonitorRef = React.createRef();
    this.notificationServiceObj = new NotificationService()
    const sessionId = this.notificationServiceObj.getSessionId()
    this.outboundServiceObj = new OutboundService(sessionId)
  }
  
  componentDidMount = async () => {
    this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents)
  }

  componentWillUnmount = () => {
    this.notificationServiceObj.disconnect()
  }

  handleNotificationEvents = (event) => {
    if (event.category === 'payer') {
      this.payerMobileRef.current && this.payerMobileRef.current.handleNotificationEvents(event)
      this.updateSequenceDiagram(event)
    } else if (event.category === 'payee') {
      this.payeeMobileRef.current && this.payeeMobileRef.current.handleNotificationEvents(event)
      this.updateSequenceDiagram(event)
    } else if (event.category === 'payerMonitorLog') {
      this.payerMonitorRef.current && this.payerMonitorRef.current.appendLog(event.data.log)
    } else if (event.category === 'payeeMonitorLog') {
      this.payeeMonitorRef.current && this.payeeMonitorRef.current.appendLog(event.data.log)
    }
  }

  clearEverything = () => {
    if (this.testDiagramRef.current) {
      this.testDiagramRef.current.clearSequence()
    }
    if (this.payerMonitorRef.current) {
      this.payerMonitorRef.current.clearLogs()
    }
    if (this.payeeMonitorRef.current) {
      this.payeeMonitorRef.current.clearLogs()
    }
  }

  updateSequenceDiagram = (event) => {
    switch(event.type) {
      // Payer Side Events
      case 'getParties':
      {
        this.clearEverything()
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] GET ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'both'}})
        }
        break
      }
      case 'getPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'putParties':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'putPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'both'}})
        }
        break
      }
      case 'postQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addNoteOver(this.state.payerName, this.state.payeeName, 'Quotes')
          this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'both'}})
        }
        break
      }
      case 'postQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'putQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'putQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'both'}})
        }
        break
      }
      case 'postTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addNoteOver(this.state.payerName, this.state.payeeName, 'Transfer')
          this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'both'}})
        }
        break
      }
      case 'postTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'putTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'putTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'both'}})
        }
        break
      }

      // Payer Side Events
      case 'payeeGetParties':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP REQ] GET ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeeGetPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutParties':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.payeeName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeName, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
    }
  }

  render() {
    return (
      <>
      <Drawer
        title="Pink Bank Logs"
        width="70%"
        placement='left'
        forceRender={true}
        closable={false}
        visible={this.state.payerLogsDrawerVisible}
        onClose={() => {
          this.setState({payerLogsDrawerVisible: false})
        }}
      >
        <TestMonitor ref={this.payerMonitorRef} />
      </Drawer>
      <Drawer
        title="Green Bank Logs"
        width="70%"
        placement='right'
        forceRender={true}
        closable={false}
        visible={this.state.payeeLogsDrawerVisible}
        onClose={() => {
          this.setState({payeeLogsDrawerVisible: false})
        }}
      >
        <TestMonitor ref={this.payeeMonitorRef} />
      </Drawer>
      <Row className="h-100">
        <Col span={24}>
          <Row className='h-100'>
            <Col span={4}
              className="text-left align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_left})`,
                backgroundPosition: 'left bottom',
                backgroundSize: '30vh',
                backgroundRepeat: 'no-repeat'
              }}>
              <Row align="top">
                <Col span={24}>                
                  <Button type='primary' className='mt-2' style={ {height: '40px', backgroundColor: '#F90085'} } onClick={() => {
                    this.setState({payerLogsDrawerVisible: true})
                  }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Pink Bank Logs</Text> <CaretRightFilled style={ {fontSize: '18px'} }/>
                  </Button>
                </Col>
              </Row>
              <Row align="bottom" className='h-100'>
                <Col span={24}>
                  <Row style={{ marginLeft: '3vh', marginBottom: '8vh', width: '24vh', height: '45vh'}}>
                    <Col span={24}>
                      <PayerMobile
                        ref={this.payerMobileRef}
                        outboundService={this.outboundServiceObj}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col span={16}>
              <div
                style={{
                  height: '90vh',
                  overflow: 'scroll'
                }}
              >
              <TestDiagram ref={this.testDiagramRef} />
              </div>
            </Col>
            <Col span={4}
              className="align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_right})`,
                backgroundPosition: 'right bottom',
                backgroundSize: '30vh',
                backgroundRepeat: 'no-repeat'
              }}>
              <Row align="top">
                <Col span={24}>             
                  <Button type='primary' className='mt-2 float-right' style={ {height: '40px', backgroundColor: '#13AA90'} } onClick={() => {
                      this.setState({payeeLogsDrawerVisible: true})
                    }}>
                    <CaretLeftFilled style={ {fontSize: '18px'} }/> <Text style={{color: 'white', fontWeight: 'bold'}}>Green Bank Logs</Text>
                  </Button>   
                </Col>
              </Row>
              <Row align="bottom" className='h-100'>
                <Col span={24}>
                  <Row className="float-right" style={{ marginRight: '3vh', marginBottom: '8vh', width: '24vh', height: '45vh'}}>
                    <Col span={24} >
                      <PayeeMobile 
                        ref={this.payeeMobileRef}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
      </>
    );
  }
}

export default MobileSimulator;
