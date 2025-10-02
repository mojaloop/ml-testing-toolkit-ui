/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Row, Col, Drawer, Button, Typography, Modal, Tabs } from 'antd';
import { CaretRightFilled, CaretLeftFilled, SettingOutlined } from '@ant-design/icons';

import PayerMerchant from './PayerMerchant.jsx';
import PayeeMerchant from './PayeeMerchant.jsx';
import TestDiagram from './TestDiagram.jsx';
import TestMonitor from './TestMonitor.jsx';
import Settings from './Settings.jsx';
import HUBConsole from './HUBConsole.jsx';
import NotificationService from '../../../services/demos/LEIMerchantPayments/mojaloopNotifications';
import OutboundService from '../../../services/demos/LEIMerchantPayments/mojaloopOutbound';
import { getServerConfig } from '../../../utils/getConfig';

const { Text } = Typography;
const { TabPane } = Tabs;

class LEIMerchantPayments extends React.Component {
    state = {
        payerMerchantName: 'HALMADENT SRL',
        hubName: 'Mojaloop Switch',
        payeeMerchantName: 'SECOND MERCHANT CORP',
        payerMerchantLogsDrawerVisible: false,
        payeeMerchantLogsDrawerVisible: false,
        showSettings: false,
        hubConsoleEnabled: false,
    };

    constructor() {
        super();
        this.payerMerchantRef = React.createRef();
        this.payeeMerchantRef = React.createRef();
        this.testDiagramRef = React.createRef();
        this.payerMerchantMonitorRef = React.createRef();
        this.payeeMerchantMonitorRef = React.createRef();
        this.settingsRef = React.createRef();
        this.hubConsoleRef = React.createRef();
        this.notificationServiceObj = new NotificationService();
        const sessionId = this.notificationServiceObj.getSessionId();
        this.outboundServiceObj = new OutboundService(sessionId);
    }

    componentDidMount = async () => {
        this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents);
        this.fetchConfiguration();
    };

    componentWillUnmount = () => {
        this.notificationServiceObj.disconnect();
    };

    fetchConfiguration = async () => {
        const { userConfigRuntime } = await getServerConfig();
        const hubConsoleEnabled = userConfigRuntime && userConfigRuntime.UI_CONFIGURATION && userConfigRuntime.UI_CONFIGURATION.LEI_MERCHANT_PAYMENTS && userConfigRuntime.UI_CONFIGURATION.LEI_MERCHANT_PAYMENTS.HUB_CONSOLE_ENABLED;
        this.setState({ hubConsoleEnabled });
    };

    handleNotificationEvents = event => {
        if(event.category === 'payerMerchant') {
            if(this.payerMerchantRef.current) {
                // Pass payee merchant reference for sequence coordination
                this.payerMerchantRef.current.payeeMerchantRef = this.payeeMerchantRef;
                this.payerMerchantRef.current.handleNotificationEvents(event);
            }
            this.updateSequenceDiagram(event);
            
            // Simulate missing payee-side events that backend should send but doesn't
            this.simulatePayeeSideEvents(event);
            
        } else if(event.category === 'payeeMerchant') {
            if(this.payeeMerchantRef.current) {
                // Pass sequence event handler to payee merchant
                this.payeeMerchantRef.current.props = {
                    ...this.payeeMerchantRef.current.props,
                    onSequenceEvent: this.handleNotificationEvents
                };
                this.payeeMerchantRef.current.handleNotificationEvents(event);
            }
            this.updateSequenceDiagram(event);
        } else if(event.category === 'payerMerchantMonitorLog') {
            if(this.payerMerchantMonitorRef.current)
                this.payerMerchantMonitorRef.current.appendLog(event.data.log);
        } else if(event.category === 'payeeMerchantMonitorLog') {
            if(this.payeeMerchantMonitorRef.current)
                this.payeeMerchantMonitorRef.current.appendLog(event.data.log);
        } else if(event.category === 'settingsLog') {
            if(this.settingsRef.current)
                this.settingsRef.current.handleNotificationEvents(event);
        } else if(event.category === 'hubConsole') {
            if(this.hubConsoleRef.current)
                this.hubConsoleRef.current.handleNotificationEvents(event);
        }
    };
    
    // Simulate the payee-side events that the backend should generate but doesn't
    // This follows the exact same pattern as Mobile Simulator's backend notification service
    simulatePayeeSideEvents = (payerEvent) => {
        switch (payerEvent.type) {
            case 'getPartiesResponse':
            {
                // After payer gets parties response, simulate payee getting parties request  
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantGetParties',
                        data: {
                            resource: { method: 'get', path: `/parties/ALIAS/${this.state.payeeMerchantName.replace(/ /g, '_')}` },
                            requestBody: null
                        }
                    });
                }, 100);
                break;
            }
            case 'postQuotesResponse':
            {
                // After payer gets quotes response, simulate payee getting quotes request
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant', 
                        type: 'payeeMerchantPostQuotes',
                        data: {
                            resource: { method: 'post', path: '/quotes' },
                            requestBody: {
                                quoteId: this.generateUUID(),
                                transactionId: this.generateUUID(),
                                amount: { amount: '100', currency: 'USD' },
                                payee: {
                                    partyIdInfo: {
                                        partyIdType: 'ALIAS',
                                        partyIdentifier: '529900VJSEB3P1FV4R31'
                                    },
                                    merchantClassificationCode: '5814',
                                    name: 'SECOND MERCHANT CORP'
                                }
                            }
                        }
                    });
                }, 100);
                break;
            }
            case 'postTransfersResponse':
            {
                // After payer gets transfers response, simulate payee getting transfers request
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPostTransfers', 
                        data: {
                            resource: { method: 'post', path: '/transfers' },
                            requestBody: {
                                transferId: this.generateUUID(),
                                amount: { amount: '100', currency: 'USD' },
                                payerFsp: 'testingtoolkitdfsp',
                                payeeFsp: 'payeefsp'
                            }
                        }
                    });
                }, 100);
                break;
            }
        }
    };
    
    generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    clearEverything = () => {
        if(this.testDiagramRef.current) {
            this.testDiagramRef.current.clearSequence();
        }
        if(this.payerMerchantMonitorRef.current) {
            this.payerMerchantMonitorRef.current.clearLogs();
        }
        if(this.payeeMerchantMonitorRef.current) {
            this.payeeMerchantMonitorRef.current.clearLogs();
        }
    };

    updateSequenceDiagram = event => {
        switch (event.type) {
            // 🔹 PHASE 1: PARTY LOOKUP (Oracle Lookup)
            // Step 1: HALMADENT SRL → Mojaloop Switch (GET /parties/ALIAS/LEI)
            case 'getParties':
            {
                this.clearEverything();
                if(this.testDiagramRef.current) {
                    // Establish the correct participant order by introducing all participants in desired order
                    // This first sequence establishes: HALMADENT SRL → Mojaloop Switch
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP REQ] GET ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'getPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            // Step 2: Mojaloop Switch → SECOND MERCHANT CORP (GET /parties/ALIAS/LEI)
            case 'payeeMerchantGetParties':
            {
                if(this.testDiagramRef.current) {
                    // Add the second step of party lookup - this introduces the third participant
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP REQ] GET ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                    // Now that all participants are introduced, add the phase note
                    this.testDiagramRef.current.addNoteOver(this.state.payerMerchantName, this.state.payeeMerchantName, 'Party Lookup (Oracle)');
                }
                break;
            }
            case 'payeeMerchantGetPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true });
                }
                break;
            }
            // Step 3: SECOND MERCHANT CORP → Mojaloop Switch (PUT /parties callback)
            case 'payeeMerchantPutParties':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path);
                }
                break;
            }
            case 'payeeMerchantPutPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            // Step 4: Mojaloop Switch → HALMADENT SRL (PUT /parties callback)
            case 'putParties':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putPartiesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }

            // 🔹 PHASE 2: QUOTES
            case 'postQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addNoteOver(this.state.payerMerchantName, this.state.payeeMerchantName, 'Quotes Phase');
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'postQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'payeeMerchantPostQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'payeeMerchantPostQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true });
                }
                break;
            }
            case 'payeeMerchantPutQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path);
                }
                break;
            }
            case 'payeeMerchantPutQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'putQuotes':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putQuotesResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }

            // 🔹 PHASE 3: TRANSFERS
            case 'postTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addNoteOver(this.state.payerMerchantName, this.state.payeeMerchantName, 'Transfer Phase');
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'postTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'payeeMerchantPostTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP REQ] POST ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'payeeMerchantPostTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true });
                }
                break;
            }
            case 'payeeMerchantPutTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path);
                }
                break;
            }
            case 'payeeMerchantPutTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            case 'putTransfers':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putTransfersResponse':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'both' } });
                }
                break;
            }
        }
    };

    render() {
        return (
            <>
                <Drawer
                    title='HALMADENT SRL Logs'
                    width='70%'
                    placement='left'
                    forceRender
                    closable={false}
                    open={this.state.payerMerchantLogsDrawerVisible}
                    onClose={() => {
                        this.setState({ payerMerchantLogsDrawerVisible: false });
                    }}
                >
                    <TestMonitor ref={this.payerMerchantMonitorRef} />
                </Drawer>
                <Drawer
                    title='SECOND MERCHANT CORP Logs'
                    width='70%'
                    placement='right'
                    forceRender
                    closable={false}
                    open={this.state.payeeMerchantLogsDrawerVisible}
                    onClose={() => {
                        this.setState({ payeeMerchantLogsDrawerVisible: false });
                    }}
                >
                    <TestMonitor ref={this.payeeMerchantMonitorRef} />
                </Drawer>
                <Modal
                    style={{ top: 20 }}
                    destroyOnClose
                    title='Settings'
                    open={!!this.state.showSettings}
                    footer={null}
                    onCancel={() => { this.setState({ showSettings: false }); }}
                >
                    <Settings
                        ref={this.settingsRef}
                        outboundService={this.outboundServiceObj}
                        inputValues={this.outboundServiceObj.inputValues}
                    />
                </Modal>
                <div style={{ width: '100%', height: '100vh', overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
                    <div style={{ display: 'flex', minHeight: '600px', height: '100%', minWidth: '1000px', flexWrap: 'nowrap', alignItems: 'stretch' }}>
                        <div
                            style={{
                                flex: '0 0 auto',
                                width: '25%',
                                minWidth: '250px',
                                maxWidth: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                height: '100%',
                            }}
                        >
                            <div style={{ padding: '10px', position: 'relative', zIndex: 10 }}>
                                <Button
                                    type='primary' className='mt-2' style={{ height: '40px', backgroundColor: '#F90085' }} onClick={() => {
                                        this.setState({ payerMerchantLogsDrawerVisible: true });
                                    }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Payer Merchant Logs</Text> <CaretRightFilled style={{ fontSize: '18px' }} />
                                </Button>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '20px' }}>
                                <div style={{ 
                                    width: '100%', 
                                    maxWidth: '450px',
                                    minWidth: '350px',
                                    position: 'relative'
                                }}>
                                    <PayerMerchant
                                        ref={this.payerMerchantRef}
                                        outboundService={this.outboundServiceObj}
                                        onPayeeMerchantNotification={this.handleNotificationEvents}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 50%', minWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <Button
                                    className='mt-2 mb-2'
                                    style={{ width: '50px', height: '50px' }}
                                    danger
                                    shape='circle'
                                    size='large'
                                    onClick={() => { this.setState({ showSettings: true }); }}
                                >
                                    <SettingOutlined style={{ fontSize: '24px' }} />
                                </Button>
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
                                        {
                                            this.state.hubConsoleEnabled
                                                ? (
                                                    <TabPane tab='Hub Console' key='2'>
                                                        <HUBConsole
                                                            style={{
                                                                width: '90%',
                                                            }}
                                                            ref={this.hubConsoleRef}
                                                            outboundService={this.outboundServiceObj}
                                                        />
                                                    </TabPane>
                                                )
                                                : null
                                        }
                                    </Tabs>
                                </div>
                        </div>
                        <div
                            style={{
                                flex: '0 0 auto',
                                width: '25%',
                                minWidth: '250px',
                                maxWidth: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                height: '100%',
                            }}
                        >
                            <div style={{ padding: '10px', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 10 }}>
                                <Button
                                    type='primary' className='mt-2' style={{ height: '40px', backgroundColor: '#13AA90' }} onClick={() => {
                                        this.setState({ payeeMerchantLogsDrawerVisible: true });
                                    }}
                                >
                                    <CaretLeftFilled style={{ fontSize: '18px' }} /> <Text style={{ color: 'white', fontWeight: 'bold' }}>Payee Merchant Logs</Text>
                                </Button>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '20px' }}>
                                <div style={{ 
                                    width: '100%',
                                    maxWidth: '450px',
                                    minWidth: '350px',
                                    position: 'relative'
                                }}>
                                    <PayeeMerchant
                                        ref={this.payeeMerchantRef}
                                        onSequenceEvent={this.handleNotificationEvents}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default LEIMerchantPayments;