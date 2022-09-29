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
import React from 'react';
import { Row, Col, Drawer, Button, Typography, Modal, Tabs, message } from 'antd';
import { CaretRightFilled, CaretLeftFilled, SettingOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import mobile_left from '../../../assets/img/mobile_pink_iphone.png';
import mobile_right from '../../../assets/img/mobile_green_iphone.png';

import PayerMobile from './PayerMobile.jsx';
import TestDiagram from './TestDiagram.jsx';
import TestMonitor from './TestMonitor.jsx';
import NotificationService from '../../../services/demos/MobileSimulator/mojaloopNotifications';
import OutboundService from '../../../services/demos/MobileSimulator/mojaloopOutbound';
import { getServerConfig } from '../../../utils/getConfig';

const { Text } = Typography;
const { TabPane } = Tabs;

class MobileSimulator extends React.Component {
    state = {
        payerName: 'PISP Backend',
        hubName: 'GSP Adapter',
        payerLogsDrawerVisible: false,
    };

    constructor() {
        super();
        this.payerMobileRef = React.createRef();
        this.testDiagramRef = React.createRef();
        this.payerMonitorRef = React.createRef();
        this.notificationServiceObj = new NotificationService();
        const sessionId = this.notificationServiceObj.getSessionId();
        this.outboundServiceObj = new OutboundService(sessionId);
    }

    componentDidMount = async () => {
        this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents);
        // this.fetchConfiguration();
    };

    componentWillUnmount = () => {
        this.notificationServiceObj.disconnect();
    };

    // fetchConfiguration = async () => {
    //     const { userConfigRuntime } = await getServerConfig();
    // };

    handleNotificationEvents = event => {
        if(event.category === 'payer') {
            if(this.payerMobileRef.current)
                this.payerMobileRef.current.handleNotificationEvents(event);
            // this.updateSequenceDiagram(event);
        } else if(event.category === 'payerMonitorLog') {
            this.updateSequenceDiagram(event);
            if(this.payerMonitorRef.current) {
                this.payerMonitorRef.current.appendLog(event.data.log);
            }
        }
    };

    clearEverything = () => {
        if(this.testDiagramRef.current) {
            this.testDiagramRef.current.clearSequence();
        }
        if(this.payerMonitorRef.current) {
            this.payerMonitorRef.current.clearLogs();
        }
    };

    updateSequenceDiagram = event => {
        console.log('GVK Update Sequece Diagram', event);
        switch (event.type) {
            // Payer Side Events
            case 'log':
            {
                
                if(event.data?.log?.message?.startsWith('Sending')) {
                    if(event.data.log.resource.method === 'post' && event.data.log.resource.path === '/v3/getTransferFundsQuotation') {
                        this.clearEverything();
                    }
                    if(this.testDiagramRef.current) {
                        this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] ' + event.data.log.resource.method + ' ' + event.data.log.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                    }
                } else if(event.data?.log?.message?.startsWith('Received')) {
                    if(this.testDiagramRef.current) {
                        this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.log.additionalData.response.status + ' ' + event.data.log.additionalData.response.statusText, { dashed: true, activation: { mode: 'activate', peer: 'both' } });
                    }
                }
                break;
            }
            // case 'httpRequest':
            // {
            //     this.clearEverything();
            //     if(this.testDiagramRef.current) {
            //         this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] GET ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
            //     }
            //     break;
            // }
            // case 'httpResponse':
            // {
            //     this.clearEverything();
            //     if(this.testDiagramRef.current) {
            //         this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
            //     }
            //     break;
            // }
            case 'getParties':
            {
                this.clearEverything();
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] GET ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'getPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'putParties':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }
            case 'postQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addNoteOver(this.state.payerName, this.state.payeeName, 'Quotes');
                    this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'postQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'putQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }
            case 'postTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addNoteOver(this.state.payerName, this.state.payeeName, 'Transfer');
                    this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'postTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'putTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }

        }
    };

    render() {
        return (
            <>
                <Row className='h-100'>
                    <Col span={24}>
                        <Row className='h-100'>
                            <Col
                                span={4}
                                className='text-left align-bottom'
                                style={{
                                    verticalAlign: 'bottom',
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${mobile_left})`,
                                    backgroundPosition: 'left bottom',
                                    backgroundSize: '30vh',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                <Row align='bottom' className='h-100'>
                                    <Col span={24}>
                                        <Row style={{ marginLeft: '3vh', marginBottom: '3vh', width: '24vh', height: '45vh' }}>
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
                            <Col span={16} className='text-center'>
                                <div
                                    style={{
                                        height: '90vh',
                                    }}
                                >
                                    <Tabs defaultActiveKey='1'>
                                        <TabPane tab='Sequence Diagram' key='1' forceRender>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    overflow: 'scroll',
                                                }}
                                            >
                                                <TestDiagram ref={this.testDiagramRef} />
                                            </div>
                                        </TabPane>
                                        <TabPane tab='Activity Log' key='2' forceRender>
                                            <TestMonitor
                                                style={{
                                                    width: '90%',
                                                }}
                                                ref={this.payerMonitorRef}
                                            />
                                        </TabPane>
                                    </Tabs>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>
        );
    }
}

export default MobileSimulator;
