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

    // 🎯 Comprehensive payee-side event simulation following Mobile Simulator pattern
    simulatePayeeSideEvents = (payerEvent) => {
        // Simulate all missing payee merchant events with proper timing and realistic payloads
        const baseDelay = 100; // Small delay for realistic timing
        
        switch (payerEvent.type) {
            case 'getPartiesResponse': {
                // Step 3: Hub -> SECOND MERCHANT CORP: GET /parties/ALIAS/{LEI}
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantGetParties',
                        data: {
                            resource: {
                                method: 'get',
                                path: payerEvent.data.resource.path // Same LEI lookup path
                            }
                        }
                    });
                }, baseDelay);

                // Step 4: SECOND MERCHANT CORP -> Hub: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantGetPartiesResponse',
                        data: {
                            resource: {
                                method: 'get',
                                path: payerEvent.data.resource.path
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 2);

                // Step 5: SECOND MERCHANT CORP -> Hub: PUT /parties/ALIAS/{LEI}
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant', 
                        type: 'payeeMerchantPutParties',
                        data: {
                            resource: {
                                method: 'put',
                                path: payerEvent.data.resource.path
                            },
                            requestBody: {
                                party: {
                                    partyIdInfo: {
                                        partyIdType: 'ALIAS',
                                        partyIdentifier: '529900VJSEB3P1FV4R31', // SECOND MERCHANT CORP LEI
                                        fspId: 'secondmerchantcorpfsp'
                                    },
                                    merchantClassificationCode: '5814',
                                    name: 'SECOND MERCHANT CORP',
                                    personalInfo: {
                                        complexName: {
                                            firstName: 'Second',
                                            lastName: 'Merchant Corp'
                                        }
                                    }
                                }
                            }
                        }
                    });
                }, baseDelay * 3);

                // Step 6: Hub -> SECOND MERCHANT CORP: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPutPartiesResponse', 
                        data: {
                            resource: {
                                method: 'put',
                                path: payerEvent.data.resource.path
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 4);
                break;
            }

            case 'postQuotesResponse': {
                // Step 11: Hub -> SECOND MERCHANT CORP: POST /quotes
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPostQuotes',
                        data: {
                            resource: {
                                method: 'post',
                                path: '/quotes'
                            },
                            requestBody: {
                                quoteId: this.currentQuoteId || 'quote-' + Date.now(),
                                transactionId: this.currentTransactionId || 'txn-' + Date.now(),
                                payer: {
                                    partyIdInfo: {
                                        partyIdType: 'ALIAS',
                                        partyIdentifier: '787200JXIR2YYZDPNP23' // HALMADENT SRL LEI
                                    },
                                    name: 'HALMADENT SRL'
                                },
                                payee: {
                                    partyIdInfo: {
                                        partyIdType: 'ALIAS', 
                                        partyIdentifier: '529900VJSEB3P1FV4R31' // SECOND MERCHANT CORP LEI
                                    },
                                    name: 'SECOND MERCHANT CORP'
                                },
                                amountType: 'SEND',
                                amount: {
                                    amount: this.currentAmount || '100',
                                    currency: this.currentCurrency || 'USD'
                                }
                            }
                        }
                    });
                }, baseDelay);

                // Step 12: SECOND MERCHANT CORP -> Hub: Response 202
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPostQuotesResponse',
                        data: {
                            resource: {
                                method: 'post', 
                                path: '/quotes'
                            },
                            responseStatus: '202'
                        }
                    });
                }, baseDelay * 2);

                // Step 13: SECOND MERCHANT CORP -> Hub: PUT /quotes/{quoteId} 
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPutQuotes',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/quotes/${this.currentQuoteId || 'quote-' + Date.now()}`
                            },
                            requestBody: {
                                transferAmount: {
                                    amount: this.currentAmount || '100',
                                    currency: this.currentCurrency || 'USD'
                                },
                                payeeReceiveAmount: {
                                    amount: this.currentAmount || '100', 
                                    currency: this.currentCurrency || 'USD'
                                },
                                payeeFspFee: {
                                    amount: '0.50',
                                    currency: this.currentCurrency || 'USD'
                                },
                                payeeFspCommission: {
                                    amount: '0.25',
                                    currency: this.currentCurrency || 'USD'
                                },
                                expiration: new Date(Date.now() + 300000).toISOString(),
                                ilpPacket: 'AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTQzYzYtYTVkNC1kMjQ5MGY2Mjg4YTAiLCJxdW90ZUlkIjoiMGIzMDlhZTYtNTY5Zi00NzJhLWIzODYtN2FlNGVlNGVjZjJiIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoidGVzdGluZ3Rvb2xraXRkZnNwIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTEzIiwiZnNwSWQiOiJ0ZXN0aW5ndG9vbGtpdGRmc3AifX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjEwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwiZXhwaXJhdGlvbiI6IjIwMTctMDUtMjRUMDg6MzI6NTguNzEwWiIsIm5vdGUiOiJoZWoifQ',
                                condition: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA'
                            }
                        }
                    });
                }, baseDelay * 3);

                // Step 14: Hub -> SECOND MERCHANT CORP: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPutQuotesResponse',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/quotes/${this.currentQuoteId || 'quote-' + Date.now()}`
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 4);
                break;
            }

            case 'postTransfersResponse': {
                // Step 19: Hub -> SECOND MERCHANT CORP: POST /transfers
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPostTransfers',
                        data: {
                            resource: {
                                method: 'post',
                                path: '/transfers'
                            },
                            requestBody: {
                                transferId: this.currentTransferId || 'transfer-' + Date.now(),
                                payeeFsp: 'secondmerchantcorpfsp',
                                payerFsp: 'halmadentsrlfsp',
                                amount: {
                                    amount: this.currentAmount || '100',
                                    currency: this.currentCurrency || 'USD'
                                },
                                condition: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
                                expiration: this.currentExpiration || new Date(Date.now() + 300000).toISOString()
                            }
                        }
                    });
                }, baseDelay);

                // Step 20: SECOND MERCHANT CORP -> Hub: Response 202
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPostTransfersResponse', 
                        data: {
                            resource: {
                                method: 'post',
                                path: '/transfers'
                            },
                            responseStatus: '202'
                        }
                    });
                }, baseDelay * 2);

                // Step 21: SECOND MERCHANT CORP -> Hub: PUT /transfers/{transferId} (COMMITTED)
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPutTransfers',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/transfers/${this.currentTransferId || 'transfer-' + Date.now()}`
                            },
                            requestBody: {
                                transferState: 'COMMITTED',
                                transferId: this.currentTransferId || 'transfer-' + Date.now(),
                                completedTimestamp: new Date().toISOString(),
                                fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
                            }
                        }
                    });
                }, baseDelay * 3);

                // Step 22: Hub -> SECOND MERCHANT CORP: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantPutTransfersResponse',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/transfers/${this.currentTransferId || 'transfer-' + Date.now()}`
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 4);
                break;
            }
        }
    };

    // Enhanced handleNotificationEvents to trigger payee simulations and capture transaction data
    handleNotificationEvents = event => {
        // Capture transaction data for realistic payee event simulation
        if (event.type === 'postQuotes' && event.data.quotesRequest) {
            this.currentQuoteId = event.data.quotesRequest.quoteId;
            this.currentTransactionId = event.data.quotesRequest.transactionId; 
            this.currentAmount = event.data.quotesRequest.amount?.amount;
            this.currentCurrency = event.data.quotesRequest.amount?.currency;
        }
        
        if (event.type === 'putQuotes' && event.data.quotesResponse) {
            this.currentExpiration = event.data.quotesResponse.expiration;
            this.currentIlpPacket = event.data.quotesResponse.ilpPacket;
            this.currentCondition = event.data.quotesResponse.condition;
        }
        
        if (event.type === 'postTransfers' && event.data.transfersRequest) {
            this.currentTransferId = event.data.transfersRequest.transferId;
        }

        // Route events to appropriate handlers
        if(event.category === 'payerMerchant') {
            if(this.payerMerchantRef.current)
                this.payerMerchantRef.current.handleNotificationEvents(event);
            this.updateSequenceDiagram(event);
            
            // 🎯 Trigger payee-side simulation for complete 24-step sequence
            this.simulatePayeeSideEvents(event);
        } else if(event.category === 'payeeMerchant') {
            if(this.payeeMerchantRef.current)
                this.payeeMerchantRef.current.handleNotificationEvents(event);
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