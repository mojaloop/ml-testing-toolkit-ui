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
import { Row, Col, Typography, Card, Result, Statistic, Button, notification } from 'antd';
import { CheckOutlined, QrcodeOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
const { Text } = Typography;

class PayeeMerchant extends React.Component {
    state = {
        stage: null,
        quotesRequest: {},
        quotesResponse: {},
        transfersRequest: {},
        transfersResponse: {},
        payeeLEI: '529900VJSEB3P1FV4R31',
        lastReceivedAmount: null,
        qrCodeDataURL: null,
    };

    componentDidMount = async () => {
        this.generateQRCode();
    };
    
    generateQRCode = async () => {
        try {
            // Create QR code data with LEI information
            const qrData = JSON.stringify({
                type: 'LEI_MERCHANT_PAYMENT',
                payeeLEI: this.state.payeeLEI,
                merchantName: 'SECOND MERCHANT CORP',
                timestamp: new Date().toISOString()
            });
            
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#11998e',
                    light: '#ffffff'
                }
            });
            
            this.setState({ qrCodeDataURL });
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    handleNotificationEvents = event => {
        switch (event.type) {
            case 'payeeMerchantGetParties':
            {
                // Step 3: Mojaloop Switch → SECOND MERCHANT CORP: GET /parties (received)
                // Just log the inbound request - backend will handle responses automatically
                if (this.props.onSequenceEvent) {
                    this.props.onSequenceEvent({
                        category: 'payeeMerchantMonitorLog',
                        type: 'log',
                        data: {
                            log: {
                                logTime: new Date().toISOString(),
                                notificationType: 'newLog',
                                message: 'Request: get ' + event.data.resource.path,
                                resource: event.data.resource,
                                additionalData: {
                                    request: { body: event.data.requestBody }
                                },
                                uniqueId: this.generateUUID(),
                                verbosity: 'info'
                            }
                        }
                    });
                }
                break;
            }
            case 'payeeMerchantGetPartiesResponse':
            {
                // Step 4: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                // Backend will handle the next step automatically
                break;
            }
            case 'payeeMerchantPutParties':
            {
                // Step 3: Completed, this will trigger Step 4 via parent
                break;
            }
            case 'payeeMerchantPutPartiesResponse':
            {
                break;
            }
            case 'payeeMerchantPostQuotes':
            {
                // Log the inbound quotes request
                if (this.props.onSequenceEvent) {
                    this.props.onSequenceEvent({
                        category: 'payeeMerchantMonitorLog',
                        type: 'log',
                        data: {
                            log: {
                                logTime: new Date().toISOString(),
                                notificationType: 'newLog',
                                message: 'Request: post ' + event.data.resource.path,
                                resource: event.data.resource,
                                additionalData: {
                                    request: { body: event.data.requestBody }
                                },
                                uniqueId: this.generateUUID(),
                                verbosity: 'info'
                            }
                        }
                    });
                }
                this.setState({ stage: 'postQuotes', quotesRequest: event.data.requestBody });
                break;
            }
            case 'payeeMerchantPostQuotesResponse':
            {
                // Step 12: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                // Backend will handle the next step automatically
                break;
            }
            case 'payeeMerchantPutQuotes':
            {
                this.setState({ stage: 'putQuotes', quotesResponse: event.data.requestBody });
                break;
            }
            case 'payeeMerchantPutQuotesResponse':
            {
                break;
            }
            case 'payeeMerchantPostTransfers':
            {
                // Log the inbound transfer request
                if (this.props.onSequenceEvent) {
                    this.props.onSequenceEvent({
                        category: 'payeeMerchantMonitorLog',
                        type: 'log',
                        data: {
                            log: {
                                logTime: new Date().toISOString(),
                                notificationType: 'newLog',
                                message: 'Request: post ' + event.data.resource.path,
                                resource: event.data.resource,
                                additionalData: {
                                    request: { body: event.data.requestBody }
                                },
                                uniqueId: this.generateUUID(),
                                verbosity: 'info'
                            }
                        }
                    });
                }
                // Show transfer request and remember amount for later success message
                const transfersRequest = event.data.requestBody || {};
                this.setState({ stage: 'postTransfers', transfersRequest });
                break;
            }
            case 'payeeMerchantPostTransfersResponse':
            {
                // Step 20: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                // Backend will handle the next step automatically
                console.log('PayeeMerchant: Step 20 confirmed');
                break;
            }
            case 'payeeMerchantPutTransfers':
            {
                // Update UI to success and apply balance change
                const transfersResponse = event.data.requestBody || {};
                const amountObj = this.state.transfersRequest?.amount;
                
                console.log('PayeeMerchant: PutTransfers event received');
                console.log('transfersResponse:', transfersResponse);
                console.log('transfersRequest amount:', amountObj);
                console.log('transferState:', transfersResponse.transferState);
                
                // Update UI to success state
                if(amountObj && amountObj.amount) {
                    const currency = amountObj.currency || 'USD';
                    const amount = parseFloat(amountObj.amount || '0');
                    
                    console.log('PayeeMerchant: Payment received, amount:', amount, currency);
                    
                    this.setState({
                        stage: 'putTransfers',
                        transfersResponse,
                        lastReceivedAmount: { amount, currency },
                    }, () => {
                        // Notification toast
                        const amountStr = `${amount} ${currency}`;
                        notification.open({
                            message: `Payment Received` ,
                            description: `Amount ${amountStr}`,
                            duration: 6,
                            placement: 'topLeft',
                            icon: <CheckOutlined style={{ color: '#10e98e' }} />,
                        });
                        console.log('PayeeMerchant: Payment successfully received');
                    });
                } else {
                    console.log('PayeeMerchant: No amount found');
                    this.setState({ stage: 'putTransfers', transfersResponse });
                }
                break;
            }
            case 'payeeMerchantPutTransfersResponse':
            {
                break;
            }
        }
    };

    getStageData = () => {
        switch (this.state.stage) {
            case 'postQuotes':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Quote Request Details */}
                        <div style={{ 
                            background: '#e6f7ff', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            marginBottom: '10px' 
                        }}>
                            <Text strong style={{ fontSize: '15px', display: 'block', marginBottom: '12px', color: '#1890ff' }}>Quote Request Received</Text>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>From:</Text>
                                <Text strong style={{ fontSize: '14px', float: 'right' }}>HALMADENT SRL</Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Amount:</Text>
                                <Text strong style={{ fontSize: '16px', float: 'right' }}>
                                    {this.state.quotesRequest && this.state.quotesRequest.amount ? 
                                        `${this.state.quotesRequest.amount.amount} ${this.state.quotesRequest.amount.currency}` : 
                                        '-- --'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            <div style={{ marginBottom: '0px' }}>
                                <Text style={{ fontSize: '12px', color: '#999' }}>Quote ID:</Text>
                                <Text style={{ fontSize: '11px', float: 'right', color: '#666', fontFamily: 'monospace' }}>
                                    {this.state.quotesRequest && this.state.quotesRequest.quoteId ? 
                                        this.state.quotesRequest.quoteId.substring(0, 8) + '...' : 
                                        'N/A'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ fontSize: '14px', color: '#1890ff' }}>→ Processing quote...</Text>
                        </div>
                    </div>
                );
            case 'putQuotes':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Quote Response Details */}
                        <div style={{ 
                            background: '#f6ffed', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            marginBottom: '10px',
                            border: '1px solid #b7eb8f'
                        }}>
                            <Text strong style={{ fontSize: '15px', display: 'block', marginBottom: '12px', color: '#52c41a' }}>Quote Response Sent</Text>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Amount:</Text>
                                <Text strong style={{ fontSize: '16px', float: 'right' }}>
                                    {this.state.quotesResponse && this.state.quotesResponse.transferAmount ? 
                                        `${this.state.quotesResponse.transferAmount.amount} ${this.state.quotesResponse.transferAmount.currency}` : 
                                        '-- --'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            <div style={{ marginBottom: '0px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Fees:</Text>
                                <Text strong style={{ fontSize: '14px', float: 'right' }}>
                                    {this.state.quotesResponse && this.state.quotesResponse.payeeFspFee ? 
                                        `${this.state.quotesResponse.payeeFspFee.amount} ${this.state.quotesResponse.payeeFspFee.currency}` : 
                                        '0.00 USD'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ fontSize: '14px', color: '#52c41a' }}>✓ Quote sent to payer</Text>
                        </div>
                    </div>
                );
            case 'postTransfers':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Transfer Request Details */}
                        <div style={{ 
                            background: '#fff2e8', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            marginBottom: '10px',
                            border: '1px solid #ffbb96'
                        }}>
                            <Text strong style={{ fontSize: '15px', display: 'block', marginBottom: '12px', color: '#fa8c16' }}>Transfer Request Received</Text>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Amount:</Text>
                                <Text strong style={{ fontSize: '16px', float: 'right' }}>
                                    {this.state.transfersRequest && this.state.transfersRequest.amount ? 
                                        `${this.state.transfersRequest.amount.amount} ${this.state.transfersRequest.amount.currency}` : 
                                        '-- --'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            <div style={{ marginBottom: '0px' }}>
                                <Text style={{ fontSize: '12px', color: '#999' }}>Transfer ID:</Text>
                                <Text style={{ fontSize: '11px', float: 'right', color: '#666', fontFamily: 'monospace' }}>
                                    {this.state.transfersRequest && this.state.transfersRequest.transferId ? 
                                        this.state.transfersRequest.transferId.substring(0, 8) + '...' : 
                                        'N/A'
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ fontSize: '14px', color: '#fa8c16' }}>→ Processing transfer...</Text>
                        </div>
                    </div>
                );
            case 'putTransfers':
                const receivedAmount = this.state.lastReceivedAmount;
                return (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Result
                            status='success'
                            title={<Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Received!</Text>}
                            subTitle={
                                <div>
                                    <Text style={{ fontSize: '14px', color: '#666' }}>
                                        Amount: {receivedAmount ? `${receivedAmount.amount} ${receivedAmount.currency}` : `${this.state.transfersRequest?.amount?.amount || ''} ${this.state.transfersRequest?.amount?.currency || ''}`}
                                    </Text>
                                    <br/>
                                    <Text style={{ fontSize: '13px', color: '#52c41a' }}>
                                        Transaction completed successfully
                                    </Text>
                                </div>
                            }
                        />
                        <Button 
                            type='primary' 
                            size='large'
                            onClick={this.handleReset}
                            style={{ marginTop: '18px', borderRadius: '8px', width: '140px', height: '50px', fontWeight: 'bold', fontSize: '15px' }}
                        >
                            Ready for Next
                        </Button>
                    </div>
                );
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <QrcodeOutlined style={{ fontSize: '24px', color: '#11998e', marginBottom: '10px' }} />
                            <Text style={{ fontSize: '18px', color: '#333', display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Scan to Pay</Text>
                            <Text style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Scan this QR code to initiate payment</Text>
                        </div>
                        
                        {/* QR Code */}
                        <div style={{ 
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'inline-block'
                        }}>
                            {this.state.qrCodeDataURL ? (
                                <img 
                                    src={this.state.qrCodeDataURL} 
                                    alt="Payment QR Code" 
                                    style={{ display: 'block' }}
                                />
                            ) : (
                                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <Text style={{ color: '#999' }}>Generating QR Code...</Text>
                                </div>
                            )}
                        </div>
                        
                        {/* LEI Info */}
                        <div style={{ 
                            background: '#f0fdfa',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '20px',
                            border: '1px solid #5eead4'
                        }}>
                            <Text style={{ fontSize: '12px', color: '#0f766e', display: 'block', marginBottom: '4px' }}>Merchant LEI:</Text>
                            <Text style={{ fontSize: '14px', color: '#047857', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {this.state.payeeLEI}
                            </Text>
                        </div>
                    </div>
                );
        }
    };

    triggerStep5PutParties = () => {
        // Step 5: PUT parties - Second Merchant Corp -> Mojaloop Switch
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPutParties',
            data: {
                resource: { method: 'put', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                requestBody: {
                    party: {
                        partyIdInfo: {
                            partyIdType: 'ALIAS',
                            partyIdentifier: this.state.payeeLEI,
                            fspId: 'payeefsp'
                        },
                        merchantClassificationCode: '5814',
                        name: 'SECOND MERCHANT CORP'
                    }
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
        }
        this.handleNotificationEvents(event);
        
        // Trigger monitor log
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newOutboundLog',
                        message: 'Returning party info for Second Merchant Corp',
                        resource: { method: 'put', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                        additionalData: {
                            request: {
                                body: event.data.requestBody
                            }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        
        // Step 6: After PUT parties, send response 200 immediately
        this.sendPutPartiesResponse();
    };
    
    triggerStep11PostQuotes = (payerAmount, payerCurrency) => {
        // Step 11: POST quotes - Mojaloop Switch -> Second Merchant Corp
        const quoteId = this.generateUUID();
        const transactionId = this.generateUUID();
        
        // Store IDs for later use
        this.currentQuoteId = quoteId;
        this.currentTransactionId = transactionId;
        this.currentAmount = payerAmount || '100';
        this.currentCurrency = payerCurrency || 'USD';
        
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPostQuotes',
            data: {
                resource: { method: 'post', path: '/quotes' },
                requestBody: {
                    quoteId: quoteId,
                    transactionId: transactionId,
                    payee: {
                        partyIdInfo: {
                            partyIdType: 'ALIAS',
                            partyIdentifier: this.state.payeeLEI,
                            fspId: 'payeefsp'
                        },
                        name: 'SECOND MERCHANT CORP'
                    },
                    amount: {
                        amount: this.currentAmount,
                        currency: this.currentCurrency
                    }
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
            
            // Add outbound log for the quotes request
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newOutboundLog',
                        message: 'Sending request POST /quotes',
                        resource: { method: 'post', path: '/quotes' },
                        additionalData: {
                            request: { body: event.data.requestBody }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        this.handleNotificationEvents(event);
        
        // Step 12: Send response 202 immediately
        this.sendPostQuotesResponse();
    };
    
    triggerStep13PutQuotes = () => {
        // Step 13: PUT quotes - Second Merchant Corp -> Mojaloop Switch
        const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const condition = 'YlK5TZyhflbXaDRPtR5ehDxlMSqM3uIMBoVhqoD0ddg';
        const ilpPacket = 'AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXpFUzRvTVBiTlVVQ3VlbXFmNE1rRndudDBxZWQyM2NHTElJFDANdGVzdC5sZWFnM3IuZGZzcDEuYWJjZGVmZWNjJCs4MD8xMsOwYXQAa2IjbCtERmdOBoBnIGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpKMHlGTTIwMQSATE5PVEVYUEVYQU1QTEUNCmRhdGUgZGVjZW50cmFsaXpmMV9TcnRzSUhkQXk=';
        
        // Store for transfer step
        this.currentExpiration = expiration;
        this.currentCondition = condition;
        this.currentIlpPacket = ilpPacket;
        
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPutQuotes',
            data: {
                resource: { method: 'put', path: `/quotes/${this.currentQuoteId}` },
                requestBody: {
                    transferAmount: {
                        amount: this.currentAmount,
                        currency: this.currentCurrency
                    },
                    payeeFspFee: {
                        amount: '0',
                        currency: this.currentCurrency
                    },
                    payeeFspCommission: {
                        amount: '0',
                        currency: this.currentCurrency
                    },
                    expiration: expiration,
                    ilpPacket: ilpPacket,
                    condition: condition,
                    transactionId: this.currentTransactionId
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
            
            // Add outbound log for the PUT quotes request
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newOutboundLog',
                        message: 'Request: put ' + event.data.resource.path,
                        resource: event.data.resource,
                        additionalData: {
                            request: { body: event.data.requestBody }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        this.handleNotificationEvents(event);
        
        // Step 14: Send response 200 immediately
        this.sendPutQuotesResponse();
    };
    
    triggerStep19PostTransfers = () => {
        // Step 19: POST transfers - Mojaloop Switch -> Second Merchant Corp
        console.log('PayeeMerchant: triggerStep19PostTransfers called');
        const transferId = this.currentTransactionId || this.generateUUID();
        this.currentTransferId = transferId;
        console.log('PayeeMerchant: Transfer ID for Step 19:', transferId);
        
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPostTransfers',
            data: {
                resource: { method: 'post', path: '/transfers' },
                requestBody: {
                    transferId: transferId,
                    amount: {
                        amount: this.currentAmount || '100',
                        currency: this.currentCurrency || 'USD'
                    },
                    expiration: this.currentExpiration,
                    ilpPacket: this.currentIlpPacket,
                    condition: this.currentCondition,
                    payerFsp: 'testingtoolkitdfsp',
                    payeeFsp: 'payeefsp'
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
        }
        this.handleNotificationEvents(event);
        
        // Step 20: Send response 202 immediately
        this.sendPostTransfersResponse();
    };
    
    triggerStep21PutTransfers = () => {
        // Step 21: PUT transfers - Second Merchant Corp -> Mojaloop Switch
        console.log('PayeeMerchant: triggerStep21PutTransfers called with transferId:', this.currentTransferId);
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPutTransfers',
            data: {
                resource: { method: 'put', path: `/transfers/${this.currentTransferId}` },
                requestBody: {
                    transferState: 'COMMITTED',
                    transferId: this.currentTransferId,
                    completedTimestamp: new Date().toISOString()
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
            
            // Add outbound log for the PUT transfers request
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newOutboundLog',
                        message: 'Request: put ' + event.data.resource.path,
                        resource: event.data.resource,
                        additionalData: {
                            request: { body: event.data.requestBody }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        this.handleNotificationEvents(event);
        
        // Step 22: Send response 200 immediately
        this.sendPutTransfersResponse();
    };
    
    // Sequential response methods to maintain proper ordering
    sendGetPartiesResponse = () => {
        // Step 4: SECOND MERCHANT CORP → Mojaloop Switch: response 202
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantGetPartiesResponse',
                data: {
                    resource: { method: 'get', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                    responseStatus: '202'
                }
            });
            
            // Add monitor log for the response
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newLog',
                        message: 'Response: get /parties/ALIAS/' + this.state.payeeLEI + ' 202',
                        resource: { method: 'get', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                        additionalData: {
                            response: { status: 202, statusText: 'Accepted' }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        // DO NOT immediately trigger Step 5 - wait for success response
        // Step 5 will be triggered when we receive confirmation that Step 4 was processed
    };
    
    sendPutPartiesResponse = () => {
        // Step 6: Mojaloop Switch → SECOND MERCHANT CORP: response 200
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutPartiesResponse',
                data: {
                    resource: { method: 'put', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                    responseStatus: '200'
                }
            });
        }
        // Step 6 completed - Party lookup phase is done
        // Next phase (quotes) will be triggered by user action in PayerMerchant
    };
    
    sendPostQuotesResponse = () => {
        // Step 12: SECOND MERCHANT CORP → Mojaloop Switch: response 202
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostQuotesResponse',
                data: {
                    resource: { method: 'post', path: '/quotes' },
                    responseStatus: '202'
                }
            });
            
            // Add monitor log for the response
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newLog',
                        message: 'Response: post /quotes 202',
                        resource: { method: 'post', path: '/quotes' },
                        additionalData: {
                            response: { status: 202, statusText: 'Accepted' }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        // DO NOT immediately trigger Step 13 - wait for success confirmation
    };
    
    sendPutQuotesResponse = () => {
        // Step 14: Mojaloop Switch → SECOND MERCHANT CORP: response 200
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutQuotesResponse',
                data: {
                    resource: { method: 'put', path: `/quotes/${this.generateUUID()}` },
                    responseStatus: '200'
                }
            });
        }
    };
    
    sendPostTransfersResponse = () => {
        // Step 20: SECOND MERCHANT CORP → Mojaloop Switch: response 202
        console.log('PayeeMerchant: sendPostTransfersResponse - sending Step 20 response');
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostTransfersResponse',
                data: {
                    resource: { method: 'post', path: '/transfers' },
                    responseStatus: '202'
                }
            });
            
            // Add monitor log for the response
            this.props.onSequenceEvent({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: 'newLog',
                        message: 'Response: post /transfers 202',
                        resource: { method: 'post', path: '/transfers' },
                        additionalData: {
                            response: { status: 202, statusText: 'Accepted' }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
        // DO NOT immediately trigger Step 21 - wait for success confirmation
        console.log('PayeeMerchant: Step 20 sent, waiting for confirmation before Step 21');
    };
    
    sendPutTransfersResponse = () => {
        // Step 22: Mojaloop Switch → SECOND MERCHANT CORP: response 200
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutTransfersResponse',
                data: {
                    resource: { method: 'put', path: `/transfers/${this.currentTransferId}` },
                    responseStatus: '200'
                }
            });
        }
    };
    
    generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    handleReset = () => {
        this.setState({
            stage: null,
            quotesRequest: {},
            quotesResponse: {},
            transfersRequest: {},
            transfersResponse: {},
            lastReceivedAmount: null,
        });
        // Regenerate QR code for new transaction
        this.generateQRCode();
        console.log('PayeeMerchant: Reset to initial state');
    };

    render() {
        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                minHeight: '400px'
            }}>
                {/* Header */}
                <div style={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    borderRadius: '12px', 
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <Text style={{ color: '#11998e', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>PAYEE</Text>
                    <Text strong style={{ fontSize: '22px', color: '#333' }}>SECOND MERCHANT CORP</Text>
                    <br/>
                    <Text style={{ fontSize: '14px', color: '#666' }}>LEI: {this.state.payeeLEI}</Text>
                    <br/>
                    <Text style={{ fontSize: '12px', color: '#888' }}>Merchant Payment Terminal</Text>
                </div>

                {/* Main Content */}
                <div style={{ 
                    flex: 1,
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    padding: '25px',
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: this.state.stage ? 'flex-start' : 'center',
                    justifyContent: 'center',
                    minHeight: '300px'
                }}>
                    <div style={{ width: '100%' }}>
                        {this.getStageData()}
                    </div>
                </div>
            </div>
        );
    }
}

export default PayeeMerchant;
