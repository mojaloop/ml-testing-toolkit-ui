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
import { Row, Col, Drawer, Button } from 'antd';

import mobile_left from '../../../assets/img/mobile_left.png';
import mobile_right from '../../../assets/img/mobile_right.png';

import PayerMobile from "./PayerMobile.jsx";
import PayeeMobile from "./PayeeMobile.jsx";
import TestDiagram from "./TestDiagram.jsx";
import TestMonitor from "./TestMonitor.jsx";


class MobileSimulator extends React.Component {
  state = {
    drawerPlacement: 'left',
    drawerVisible: false
  }

  constructor () {
    super()
    this.payeeMobileRef = React.createRef();
    this.testDiagramRef = React.createRef();
  }

  componentDidMount = async () => {
  }

  handleGetParties = (idNumber = '123456') => {
    this.testDiagramRef.current.actionGetParties('MSISDN', idNumber)
  }
  handlePutParties = (idNumber = '123456') => {
    this.testDiagramRef.current.actionPutParties('MSISDN', idNumber)
  }
  handlePostQuotes = () => {
    this.testDiagramRef.current.actionPostQuotes('123456')
  }
  handlePutQuotes = () => {
    this.testDiagramRef.current.actionPutQuotes('123456')
  }
  handlePostTransfers = () => {
    this.testDiagramRef.current.actionPostTransfers('123456')
    this.payeeMobileRef.current.receivedFunds(100)
  }
  handlePutTransfers = () => {
    this.testDiagramRef.current.actionPutTransfers('123456')
  }

  render() {
    return (
      <>
      <Drawer
        title="Logs"
        width="50%"
        placement={this.state.drawerPlacement}
        closable={false}
        visible={this.state.drawerVisible}
        onClose={() => {
          this.setState({drawerVisible: false})
        }}
      >
        <TestMonitor />
      </Drawer>
      <Row className="h-100">
        <Col span={24}>
          <Row className='h-100'>
            <Col span={8}
              className="text-left align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_left})`,
                backgroundPosition: 'left bottom',
                backgroundSize: '60vh',
                backgroundRepeat: 'no-repeat'
              }}>
              <Row align="bottom" className='h-100'>
                <Col span={24}>
                  <Button type='dashed' className='ml-2' onClick={() => {
                    this.setState({drawerPlacement: 'left', drawerVisible: true})
                  }}>
                    Payer Logs
                  </Button>
                  <Row style={{ marginLeft: '25vh', marginBottom: '17vh', width: '24vh', height: '45vh' }}>
                    <Col span={24}>
                      <PayerMobile
                        onGetParties={this.handleGetParties}
                        onPutParties={this.handlePutParties}
                        onPostQuotes={this.handlePostQuotes}
                        onPutQuotes={this.handlePutQuotes}
                        onPostTransfers={this.handlePostTransfers}
                        onPutTransfers={this.handlePutTransfers}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col span={8}>
              <TestDiagram ref={this.testDiagramRef} />
            </Col>
            <Col span={8}
              className="align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_right})`,
                backgroundPosition: 'right bottom',
                backgroundSize: '60vh',
                backgroundRepeat: 'no-repeat'
              }}>
              <Row align="bottom" className='h-100'>
                <Col span={24}>
                  <Button type='dashed' className='mr-2 float-right' onClick={() => {
                    this.setState({drawerPlacement: 'right', drawerVisible: true})
                  }}>
                    Payee Logs
                  </Button>
                  <Row className="float-right" style={{ marginRight: '14vh', marginBottom: '15vh', width: '24vh', height: '45vh' }}>
                    <Col span={24} >
                      <PayeeMobile ref={this.payeeMobileRef} />
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
