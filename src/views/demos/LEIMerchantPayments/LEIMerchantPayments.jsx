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
import { getPayerConfig, getPayeeConfig, getHubConfig, getUIConfig, loadMerchantConfig } from '../../../config/leiMerchantConfig.js';

const { Text } = Typography;
const { TabPane } = Tabs;

class LEIMerchantPayments extends React.Component {
    state = {
        payerMerchantName: 'Payer Merchant',
        hubName: 'Mojaloop Switch',
        payeeMerchantName: 'Payee Merchant',
        payerMerchantLogsDrawerVisible: false,
        payeeMerchantLogsDrawerVisible: false,
        showSettings: false,
        hubConsoleEnabled: false,
        partyLookupSequenceState: 'idle', // Track where we are in the party lookup sequence
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
        
        // Make notification service accessible globally for real registry integration
        if (typeof window !== 'undefined') {
            window.notificationService = this.notificationServiceObj;
        }
    }

    componentDidMount = async () => {
        this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents);
        
        // Load merchant configuration from JSON file
        await loadMerchantConfig();
        
        // Update state with loaded merchant names
        const payerConfig = getPayerConfig();
        const payeeConfig = getPayeeConfig();
        
        this.setState({
            payerMerchantName: 'Pink Bank', // Display name for sequence diagram
            payeeMerchantName: payeeConfig.name
        });
        
        console.log('✅ Merchant config loaded:', {
            payer: payerConfig.name,
            payee: payeeConfig.name
        });
        
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
        // Reset sequence state
        this.setState({ partyLookupSequenceState: 'idle' });
    };

    updateSequenceDiagram = event => {
        switch (event.type) {
            // 🔹 PHASE 1: PARTY LOOKUP (Oracle Lookup)
            // Step 1: Payer → Mojaloop Switch (GET /parties/ALIAS/LEI)
            case 'getParties':
            {
                this.clearEverything();
                this.setState({ partyLookupSequenceState: 'payer_get_sent' });
                if(this.testDiagramRef.current) {
                    // Establish the correct participant order by introducing all participants in desired order
                    // This first sequence establishes: Payer → Mojaloop Switch
                    this.testDiagramRef.current.addSequence(this.state.payerMerchantName, this.state.hubName, '[HTTP REQ] GET ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'both' } });
                }
                break;
            }
            case 'getPartiesResponse':
            {
                this.setState({ partyLookupSequenceState: 'payer_get_responded' });
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            // Step 2: Mojaloop Switch → Payee (GET /parties/ALIAS/LEI)
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
            // Step 3: Payee → Mojaloop Switch (PUT /parties callback)
            case 'payeeMerchantPutParties':
            {
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.payeeMerchantName, this.state.hubName, '[HTTP Callback] PUT ' + event.data.resource.path);
                }
                break;
            }
            case 'payeeMerchantPutPartiesResponse':
            {
                this.setState({ partyLookupSequenceState: 'payee_put_completed' });
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payeeMerchantName, '[HTTP RESP] ' + event.data.responseStatus, { dashed: true, activation: { mode: 'deactivate', peer: 'destination' } });
                }
                break;
            }
            // Step 7: Mojaloop Switch → Payer (PUT /parties callback)
            // Only allow this after payee merchant has completed its PUT parties
            case 'putParties':
            {
                // Filter out premature putParties events (like error responses before payee sequence)
                if(this.state.partyLookupSequenceState !== 'payee_put_completed') {
                    console.log('Filtering out premature putParties event, current state:', this.state.partyLookupSequenceState);
                    break; // Ignore this event - it's coming too early
                }
                
                this.setState({ partyLookupSequenceState: 'final_put_sent' });
                if(this.testDiagramRef.current) {
                    this.testDiagramRef.current.addSequence(this.state.hubName, this.state.payerMerchantName, '[HTTP Callback] PUT ' + event.data.resource.path, { activation: { mode: 'activate', peer: 'destination' } });
                }
                break;
            }
            case 'putPartiesResponse':
            {
                // Only allow putPartiesResponse after we've sent the final putParties
                if(this.state.partyLookupSequenceState !== 'final_put_sent') {
                    console.log('Filtering out premature putPartiesResponse event, current state:', this.state.partyLookupSequenceState);
                    break; // Ignore this event - it's coming too early
                }
                
                this.setState({ partyLookupSequenceState: 'completed' });
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
        const baseDelay = getUIConfig().delays.sequenceStepDelay;
        
        switch (payerEvent.type) {
            case 'getPartiesResponse': {
                // Only simulate the payee side events, not the final PUT parties to payer
                // The correct sequence should be:
                // 1. Payer → Mojaloop Switch: HTTP GET /parties/ALIAS/LEI (already done)
                // 2. Mojaloop Switch → Payer: HTTP RESP 202 (already done) 
                // 3. Mojaloop Switch → Payee: HTTP GET /parties/ALIAS/LEI
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

                // 4. Payee → Mojaloop Switch: HTTP RESP 202
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantGetPartiesResponse',
                        data: {
                            resource: {
                                method: 'get',
                                path: payerEvent.data.resource.path
                            },
                            responseStatus: '202'
                        }
                    });
                }, baseDelay * 2);

                // 5. Payee → Mojaloop Switch: HTTP Callback PUT /parties/ALIAS/LEI
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
                                        partyIdentifier: getPayeeConfig().lei,
                                        fspId: getPayeeConfig().fspId
                                    },
                                    merchantClassificationCode: getPayeeConfig().merchantClassificationCode,
                                    name: getPayeeConfig().name,
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

                // 6. Mojaloop Switch → Payee: HTTP RESP 200
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
                
                // 7. Mojaloop Switch → Payer: HTTP Callback PUT /parties/ALIAS/LEI
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putParties',
                        data: {
                            resource: {
                                method: 'put',
                                path: payerEvent.data.resource.path
                            },
                            party: {
                                partyIdInfo: {
                                    partyIdType: 'ALIAS',
                                    partyIdentifier: getPayeeConfig().lei,
                                    fspId: getPayeeConfig().fspId
                                },
                                name: getPayeeConfig().name
                            }
                        }
                    });
                }, baseDelay * 5);
                
                // 8. Payer → Mojaloop Switch: HTTP RESP 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putPartiesResponse',
                        data: {
                            resource: {
                                method: 'put',
                                path: payerEvent.data.resource.path
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 6);
                break;
            }

            case 'postQuotesResponse': {
                // Step 11: Hub -> Payee: POST /quotes
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
                                        partyIdentifier: getPayerConfig().lei
                                    },
                                    name: getPayerConfig().name
                                },
                                payee: {
                                    partyIdInfo: {
                                        partyIdType: 'ALIAS', 
                                        partyIdentifier: getPayeeConfig().lei
                                    },
                                    name: getPayeeConfig().name
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

                // Step 12: Payee -> Hub: Response 202
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

                // Step 13: Payee -> Hub: PUT /quotes/{quoteId}
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

                // Step 14: Hub -> Payee: Response 200
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
                
                // Step 15: Hub -> Payer: PUT /quotes callback
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putQuotes',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/quotes/${this.currentQuoteId || 'quote-' + Date.now()}`
                            },
                            quotesResponse: {
                                transferAmount: {
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
                }, baseDelay * 5);
                
                // Step 16: Payer -> Hub: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putQuotesResponse',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/quotes/${this.currentQuoteId || 'quote-' + Date.now()}`
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 6);
                break;
            }

            case 'postTransfersResponse': {
                // Step 19: Hub -> Payee: POST /transfers
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
                                payeeFsp: getPayeeConfig().fspId,
                                payerFsp: getPayerConfig().fspId,
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

                // Step 20: Payee -> Hub: Response 202
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

                // Step 21: Payee -> Hub: PUT /transfers/{transferId} (COMMITTED)
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

                // Step 22: Hub -> Payee: Response 200
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
                
                // Step 23: Hub -> Payer: PUT /transfers callback
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putTransfers',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/transfers/${this.currentTransferId || 'transfer-' + Date.now()}`
                            },
                            transfersResponse: {
                                transferState: 'COMMITTED',
                                transferId: this.currentTransferId || 'transfer-' + Date.now(),
                                completedTimestamp: new Date().toISOString(),
                                fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
                            }
                        }
                    });
                }, baseDelay * 5);
                
                // Step 24: Payer -> Hub: Response 200
                setTimeout(() => {
                    this.handleNotificationEvents({
                        category: 'payerMerchant',
                        type: 'putTransfersResponse',
                        data: {
                            resource: {
                                method: 'put',
                                path: `/transfers/${this.currentTransferId || 'transfer-' + Date.now()}`
                            },
                            responseStatus: '200'
                        }
                    });
                }, baseDelay * 6);
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
                    title={`${this.state.payerMerchantName} Logs`}
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
                    title={`${this.state.payeeMerchantName} Logs`}
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