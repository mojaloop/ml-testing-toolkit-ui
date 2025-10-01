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
                // Step 2: GET parties received, immediately trigger Step 3: PUT parties response
                this.triggerStep3PutParties();
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
                // Step 6 SUCCESS → Trigger Step 7: PUT quotes response
                this.triggerStep7PutQuotes();
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
                // Step 10 SUCCESS → Trigger Step 11: PUT transfers response
                this.triggerStep11PutTransfers();
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
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Text strong>Quote Request Received</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>From:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>HALMADENT SRL</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Amount:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>{this.state.quotesRequest && this.state.quotesRequest.amount ? this.state.quotesRequest.amount.amount : ''} {this.state.quotesRequest && this.state.quotesRequest.amount ? this.state.quotesRequest.amount.currency : ''}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Quote ID:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ fontSize: '8px' }}>{this.state.quotesRequest && this.state.quotesRequest.quoteId ? this.state.quotesRequest.quoteId : ''}</Text>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'putQuotes':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Text strong>Quote Response Sent</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Amount:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>{this.state.quotesResponse && this.state.quotesResponse.transferAmount ? this.state.quotesResponse.transferAmount.amount : ''} {this.state.quotesResponse && this.state.quotesResponse.transferAmount ? this.state.quotesResponse.transferAmount.currency : ''}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Fees:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>{this.state.quotesResponse && this.state.quotesResponse.payeeFspFee ? this.state.quotesResponse.payeeFspFee.amount : ''} {this.state.quotesResponse && this.state.quotesResponse.payeeFspFee ? this.state.quotesResponse.payeeFspFee.currency : ''}</Text>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'postTransfers':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Text strong>Transfer Request Received</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Amount:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>{this.state.transfersRequest && this.state.transfersRequest.amount ? this.state.transfersRequest.amount.amount : ''} {this.state.transfersRequest && this.state.transfersRequest.amount ? this.state.transfersRequest.amount.currency : ''}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text>Transfer ID:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ fontSize: '8px' }}>{this.state.transfersRequest && this.state.transfersRequest.transferId ? this.state.transfersRequest.transferId : ''}</Text>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'putTransfers':
                const receivedAmount = this.state.lastReceivedAmount;
                const currentBalance = this.state.balance?.[receivedAmount?.currency || 'USD'] || 0;
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Result
                                    status='success'
                                    title='Payment Received!'
                                    subTitle={
                                        <div>
                                            <div>Amount: {receivedAmount ? `${receivedAmount.amount} ${receivedAmount.currency}` : `${this.state.transfersRequest?.amount?.amount || ''} ${this.state.transfersRequest?.amount?.currency || ''}`}</div>
                                            <div style={{ marginTop: '8px' }}>New Balance: {currentBalance} {receivedAmount?.currency || 'USD'}</div>
                                        </div>
                                    }
                                />
                            </Col>
                        </Row>
                    </Card>
                );
        }
    };

    triggerStep3PutParties = () => {
        // Step 3: PUT parties - Second Merchant Corp -> Mojaloop Switch
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
    };
    
    triggerStep6PostQuotes = () => {
        // Step 6: POST quotes - Mojaloop Switch -> Second Merchant Corp
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPostQuotes',
            data: {
                resource: { method: 'post', path: '/quotes' },
                requestBody: {
                    quoteId: this.generateUUID(),
                    transactionId: this.generateUUID(),
                    payee: {
                        partyIdInfo: {
                            partyIdType: 'ALIAS',
                            partyIdentifier: this.state.payeeLEI,
                            fspId: 'payeefsp'
                        },
                        name: 'SECOND MERCHANT CORP'
                    },
                    amount: {
                        amount: '100', // Will be updated from payer
                        currency: 'USD'
                    }
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
        }
        this.handleNotificationEvents(event);
        
        // Simulate Step 6 SUCCESS response to trigger Step 7
        setTimeout(() => {
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
        }, 50);
    };
    
    triggerStep7PutQuotes = () => {
        // Step 7: PUT quotes - Second Merchant Corp -> Mojaloop Switch
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPutQuotes',
            data: {
                resource: { method: 'put', path: `/quotes/${this.generateUUID()}` },
                requestBody: {
                    transferAmount: {
                        amount: '100',
                        currency: 'USD'
                    },
                    payeeFspFee: {
                        amount: '0',
                        currency: 'USD'
                    },
                    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    condition: 'YlK5TZyhflbXaDRPtR5ehDxlMSqM3uIMBoVhqoD0ddg'
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
        }
        this.handleNotificationEvents(event);
    };
    
    triggerStep10PostTransfers = () => {
        // Step 10: POST transfers - Mojaloop Switch -> Second Merchant Corp
        const transferId = this.generateUUID();
        this.currentTransferId = transferId;
        
        const event = {
            category: 'payeeMerchant',
            type: 'payeeMerchantPostTransfers',
            data: {
                resource: { method: 'post', path: '/transfers' },
                requestBody: {
                    transferId: transferId,
                    amount: {
                        amount: '100',
                        currency: 'USD'
                    },
                    payerFsp: 'testingtoolkitdfsp',
                    payeeFsp: 'payeefsp'
                }
            }
        };
        
        if (this.props.onSequenceEvent) {
            this.props.onSequenceEvent(event);
        }
        this.handleNotificationEvents(event);
        
        // Simulate Step 10 SUCCESS response to trigger Step 11
        setTimeout(() => {
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
        }, 50);
    };
    
    triggerStep11PutTransfers = () => {
        // Step 11: PUT transfers - Second Merchant Corp -> Mojaloop Switch
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
            <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black', borderRadius: '15px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '15%', background: 'white', borderRadius: '10px', padding: '10px', overflow: 'auto' }}>
                    <Row>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <Text strong style={{ fontSize: '14px' }}>SECOND MERCHANT CORP</Text>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '5px 0' }}>
                                <Text style={{ fontSize: '10px' }}>LEI: {this.state.payeeLEI}</Text>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '5px 0' }}>
                                <Text style={{ fontSize: '10px' }}>Merchant Payment Terminal</Text>
                            </div>
                        </Col>
                    </Row>
                    
                    {/* Balance Display */}
                    <Row className='mt-2'>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '4px', margin: '0 5px' }}>
                                <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>Account Balance</Text>
                                <div style={{ marginTop: '4px' }}>
                                    {
                                        Object.keys(this.state.balance || {}).map(currency => (
                                            <Text key={currency} style={{ fontSize: '14px', color: '#3f8600', fontWeight: 'bold' }}>
                                                {this.state.balance[currency]} {currency}
                                            </Text>
                                        ))
                                    }
                                </div>
                            </div>
                        </Col>
                    </Row>
                    
                    {this.state.stage ? (
                        <Row className='mt-2'>
                            <Col span={24}>
                                {this.getStageData()}
                            </Col>
                        </Row>
                    ) : (
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Text type='secondary'>Waiting for payment...</Text>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
        );
    }
}

export default PayeeMerchant;