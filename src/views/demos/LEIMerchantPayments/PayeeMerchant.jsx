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
import { Row, Col, Typography, Card, Result, Statistic, notification } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
const { Text } = Typography;

class PayeeMerchant extends React.Component {
    state = {
        stage: null,
        quotesRequest: {},
        quotesResponse: {},
        transfersRequest: {},
        transfersResponse: {},
        payeeLEI: '529900VJSEB3P1FV4R31',
        balance: { USD: 1000 }, // Initial balance
        balanceCurrency: 'USD',
        transactionHistory: [],
        lastReceivedAmount: null,
    };

    componentDidMount = async () => {
    };

    handleNotificationEvents = event => {
        switch (event.type) {
            case 'payeeMerchantGetParties':
            {
                // Step 3: Mojaloop Switch → SECOND MERCHANT CORP: GET /parties (received)
                // Send Step 4: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                this.sendGetPartiesResponse();
                break;
            }
            case 'payeeMerchantGetPartiesResponse':
            {
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
                this.setState({ stage: 'postQuotes', quotesRequest: event.data.requestBody });
                break;
            }
            case 'payeeMerchantPostQuotesResponse':
            {
                // Step 12 response sent, Step 13 is already triggered by sendPostQuotesResponse
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
                // Show transfer request and remember amount for later success message
                const transfersRequest = event.data.requestBody || {};
                this.setState({ stage: 'postTransfers', transfersRequest });
                break;
            }
            case 'payeeMerchantPostTransfersResponse':
            {
                // Step 20 response sent, Step 21 is already triggered by sendPostTransfersResponse
                break;
            }
            case 'payeeMerchantPutTransfers':
            {
                // Update UI to success and apply balance change
                const transfersResponse = event.data.requestBody || {};
                const amountObj = this.state.transfersRequest?.amount;
                if(transfersResponse && transfersResponse.transferState === 'COMMITTED' && amountObj) {
                    const currency = amountObj.currency;
                    const amount = parseFloat(amountObj.amount || '0');
                    this.setState(prev => {
                        const prevBal = prev.balance?.[currency] || 0;
                        const newBal = prevBal + amount;
                        const updatedBalance = { ...(prev.balance || {}), [currency]: newBal };
                        const historyItem = {
                            date: new Date().toISOString(),
                            from: { displayName: 'HALMADENT SRL', idValue: this.state.payeeLEI },
                            amount: amount,
                            currency,
                        };
                        const newTxHistory = [historyItem, ...(prev.transactionHistory || [])];
                        return {
                            stage: 'putTransfers',
                            transfersResponse,
                            balance: updatedBalance,
                            balanceCurrency: currency,
                            transactionHistory: newTxHistory,
                            lastReceivedAmount: { amount, currency },
                        };
                    }, () => {
                        // Notification toast
                        const amountStr = `${amount} ${amountObj.currency}`;
                        notification.open({
                            message: `Payment Received` ,
                            description: `Amount ${amountStr}`,
                            duration: 6,
                            placement: 'topLeft',
                            icon: <CheckOutlined style={{ color: '#10e98e' }} />,
                        });
                    });
                } else {
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
                const currentBalance = this.state.balance?.[receivedAmount?.currency || 'USD'] || 0;
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
                                    <Text style={{ fontSize: '13px', color: '#52c41a', fontWeight: 'bold' }}>
                                        New Balance: {currentBalance} {receivedAmount?.currency || 'USD'}
                                    </Text>
                                </div>
                            }
                        />
                    </div>
                );
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <div style={{ marginBottom: '18px' }}>
                            <Text style={{ fontSize: '16px', color: '#666', display: 'block' }}>Merchant Terminal</Text>
                            <Text style={{ fontSize: '13px', color: '#999' }}>Ready to accept payments</Text>
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
        }
        // After response is sent, trigger Step 5: PUT parties
        this.triggerStep5PutParties();
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
        }
        // After response is sent, trigger Step 13: PUT quotes
        this.triggerStep13PutQuotes();
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
        }
        // After response is sent, trigger Step 21: PUT transfers
        console.log('PayeeMerchant: About to trigger Step 21');
        this.triggerStep21PutTransfers();
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

    render() {
        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                borderRadius: '25px',
                display: 'flex',
                flexDirection: 'column',
                padding: '15px 12px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Status Bar */}
                <div style={{ 
                    height: '24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <Text style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Payee</Text>
                    <Text style={{ color: 'white', fontSize: '12px' }}>●●●●●</Text>
                </div>

                {/* Header */}
                <div style={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    borderRadius: '15px', 
                    padding: '15px',
                    marginBottom: '12px',
                    textAlign: 'center'
                }}>
                    <Text strong style={{ fontSize: '18px', color: '#333' }}>SECOND MERCHANT CORP</Text>
                    <br/>
                    <Text style={{ fontSize: '12px', color: '#666' }}>LEI: {this.state.payeeLEI}</Text>
                    <br/>
                    <Text style={{ fontSize: '11px', color: '#888' }}>Merchant Payment Terminal</Text>
                </div>

                {/* Balance Display */}
                <div style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    borderRadius: '12px', 
                    padding: '12px',
                    marginBottom: '12px',
                    textAlign: 'center'
                }}>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Account Balance</Text>
                    <div style={{ marginTop: '6px' }}>
                        {
                            Object.keys(this.state.balance || {}).map(currency => (
                                <Text key={currency} style={{ fontSize: '16px', color: '#11998e', fontWeight: 'bold' }}>
                                    {this.state.balance[currency]} {currency}
                                </Text>
                            ))
                        }
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ 
                    flex: 1,
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '15px',
                    padding: '18px 15px',
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: this.state.stage ? 'flex-start' : 'center',
                    justifyContent: 'center',
                    minHeight: '200px'
                }}>
                    {this.state.stage ? (
                        <div style={{ width: '100%' }}>
                            {this.getStageData()}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: '#666', fontSize: '14px' }}>Waiting for payment...</Text>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default PayeeMerchant;