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
import { Row, Col, InputNumber, Input, Typography, Skeleton, Card, Button, Result, Select } from 'antd';
const { Text } = Typography;
const { Option } = Select;

class PayerMerchant extends React.Component {
    state = {
        gettingMerchantInfo: false,
        stage: null,
        amount: 100,
        payerLEI: '787200JXIR2YYZDPNP23',
        payeeLEI: '529900VJSEB3P1FV4R31',
        merchantInfo: {},
        quotesRequest: {},
        quotesResponse: {},
        transfersResponse: {},
        accounts: [],
        selectedCurrency: 'USD',
    };

    componentDidMount = async () => {
    };

    handleNotificationEvents = event => {
        switch (event.type) {
            case 'getParties':
            {
                break;
            }
            case 'getPartiesResponse':
            {
                break;
            }
            case 'putParties':
            {
                this.setState({ gettingMerchantInfo: false, stage: 'putParties', merchantInfo: event.data.party });
                break;
            }
            case 'putPartiesResponse':
            {
                break;
            }
            case 'postQuotes':
            {
                this.setState({ quotesRequest: event.data.quotesRequest });
                break;
            }
            case 'postQuotesResponse':
            {
                break;
            }
            case 'putQuotes':
            {
                this.setState({ stage: 'putQuotes', quotesResponse: event.data.quotesResponse });
                // Trigger the complete payee merchant flow simulation
                this.simulatePayeeMerchantFlow();
                break;
            }
            case 'putQuotesResponse':
            {
                break;
            }
            case 'postTransfers':
            {
                break;
            }
            case 'postTransfersResponse':
            {
                break;
            }
            case 'putTransfers':
            {
                this.setState({ stage: 'putTransfers', transfersResponse: event.data.transfersResponse });
                break;
            }
            case 'putTransfersResponse':
            {
                break;
            }
            case 'accountsUpdate':
            {
                this.setState({ accounts: event.data.accounts });
                break;
            }
        }
    };

    getStageData = () => {
        switch (this.state.stage) {
            case 'getParties':
            case 'postQuotes':
            case 'postTransfers':
                return <Skeleton active />;
            case 'putParties':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={8}>
                                <Text>Merchant:</Text>
                            </Col>
                            <Col span={16}>
                                <Text strong>SECOND MERCHANT CORP</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={8}>
                                <Text>LEI:</Text>
                            </Col>
                            <Col span={16}>
                                <Text strong>{this.state.payeeLEI}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={8}>
                                <Text>FSP:</Text>
                            </Col>
                            <Col span={16}>
                                <Text strong>DFSP001</Text>
                            </Col>
                        </Row>
                        <Row className='mt-1'>
                            <Col span={8}><Text strong>Amount:</Text></Col>
                            <Col span={16}>
                                <Row className='mt-1'>
                                    <Col span={24}>
                                        <InputNumber
                                            className='ms-2'
                                            value={this.state.amount}
                                            onChange={newNumber => {
                                                this.setState({ amount: newNumber });
                                            }}
                                        />
                                    </Col>
                                </Row>
                                <Row className='mt-1'>
                                    <Col span={24}>
                                        <Select
                                            className='ms-2'
                                            style={{ width: 120 }}
                                            placeholder='Currency'
                                            value={this.state.selectedCurrency}
                                            defaultActiveFirstOption
                                            onChange={currency => {
                                                this.setState({ selectedCurrency: currency });
                                            }}
                                        >
                                            <Option value="USD">USD</Option>
                                            <Option value="EUR">EUR</Option>
                                        </Select>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' danger disabled={!this.state.selectedCurrency} onClick={this.handleGetQuote}>Get Quote</Button>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'putQuotes':
                return (
                    <Card size='small'>
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
                        <Row>
                            <Col span={12}>
                                <Text>Commission:</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>{this.state.quotesResponse && this.state.quotesResponse.payeeFspCommission ? this.state.quotesResponse.payeeFspCommission.amount : ''} {this.state.quotesResponse && this.state.quotesResponse.payeeFspCommission ? this.state.quotesResponse.payeeFspCommission.currency : ''}</Text>
                            </Col>
                        </Row>
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' danger onClick={this.handleTransfer}>Transfer Money</Button>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'putTransfers':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Result
                                    status='success'
                                    title='Payment Successful!'
                                    subTitle={`Transfer ID: ${this.state.transfersResponse && this.state.transfersResponse.transferId ? this.state.transfersResponse.transferId : ''}`}
                                />
                            </Col>
                        </Row>
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' onClick={this.handleReset}>Reset</Button>
                            </Col>
                        </Row>
                    </Card>
                );
        }
    };

    handleGetMerchantInfo = async () => {
        this.setState({ stage: 'getParties', gettingMerchantInfo: true });
        await this.props.outboundService.getPartiesLEI(this.state.payeeLEI);
    };

    handleGetQuote = async () => {
        this.setState({ stage: 'postQuotes' });
        await this.props.outboundService.postQuotes(this.state.amount, this.state.selectedCurrency, this.state.payerLEI, this.state.payeeLEI);
    };

    handleTransfer = async () => {
        this.setState({ stage: 'postTransfers' });
        const transactionId = this.state.quotesRequest.transactionId;
        const expiration = this.state.quotesResponse.expiration;
        const ilpPacket = this.state.quotesResponse.ilpPacket;
        const condition = this.state.quotesResponse.condition;
        await this.props.outboundService.postTransfers(this.state.amount, transactionId, expiration, ilpPacket, condition);
    };

    simulatePayeeMerchantFlow = () => {
        // Simulate the complete bilateral Mojaloop flow for payee side
        // This creates the missing steps 2, 3, 6, 7, 10, 11 from your list
        
        const baseDelay = 600; // Start after payer's initial steps
        
        // Step 2: GET /parties - Mojaloop Switch -> Second Merchant Corp
        setTimeout(() => {
            this.triggerPayeeMerchantEvent('payeeMerchantGetParties', {
                resource: { method: 'get', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                requestBody: null
            }, 'Getting party info for Second Merchant Corp');
        }, baseDelay);
        
        // Step 3: PUT /parties - Second Merchant Corp -> Mojaloop Switch
        setTimeout(() => {
            this.triggerPayeeMerchantEvent('payeeMerchantPutParties', {
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
            }, 'Returning party info for Second Merchant Corp');
        }, baseDelay + 200);
        
        // Step 6: POST /quotes - Mojaloop Switch -> Second Merchant Corp
        setTimeout(() => {
            this.triggerPayeeMerchantEvent('payeeMerchantPostQuotes', {
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
                    payer: {
                        partyIdInfo: {
                            partyIdType: 'MSISDN',
                            partyIdentifier: '44123456789',
                            fspId: 'testingtoolkitdfsp'
                        },
                        personalInfo: {
                            complexName: {
                                firstName: 'Firstname-Test',
                                lastName: 'Lastname-Test'
                            }
                        }
                    },
                    amountType: 'SEND',
                    amount: {
                        amount: this.state.amount.toString(),
                        currency: this.state.selectedCurrency
                    },
                    transactionType: {
                        scenario: 'TRANSFER',
                        initiator: 'PAYER',
                        initiatorType: 'CONSUMER'
                    }
                }
            }, 'Quote request sent to Second Merchant Corp');
        }, baseDelay + 800);
        
        // Step 7: PUT /quotes - Second Merchant Corp -> Mojaloop Switch
        setTimeout(() => {
            this.triggerPayeeMerchantEvent('payeeMerchantPutQuotes', {
                resource: { method: 'put', path: `/quotes/${this.generateUUID()}` },
                requestBody: {
                    transferAmount: {
                        amount: this.state.amount.toString(),
                        currency: this.state.selectedCurrency
                    },
                    payeeFspFee: {
                        amount: '0',
                        currency: this.state.selectedCurrency
                    },
                    payeeFspCommission: {
                        amount: '0',
                        currency: this.state.selectedCurrency
                    },
                    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    ilpPacket: 'AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXpFUzRvTVBiTlVVQ3VlbXFmNE1rRndudDBxZWQyM2NHTElJFDANdGVzdC5sZWFnM3IuZGZzcDEuYWJjZGVmZWNjJCs4MD8xMsOwYXQAa2IjbCtERmdOBoBnIGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpKMHlGTTIwMQSATE5PVEVYUEVYQU1QTEUNCmRhdGUgZGVjZW50cmFsaXpmMV9TcnRzSUhkQXk=',
                    condition: 'YlK5TZyhflbXaDRPtR5ehDxlMSqM3uIMBoVhqoD0ddg'
                }
            }, 'Quote response sent from Second Merchant Corp');
        }, baseDelay + 1000);
        
        // Step 10: POST /transfers - Mojaloop Switch -> Second Merchant Corp
        setTimeout(() => {
            const transferId = this.generateUUID();
            this.triggerPayeeMerchantEvent('payeeMerchantPostTransfers', {
                resource: { method: 'post', path: '/transfers' },
                requestBody: {
                    transferId: transferId,
                    amount: {
                        amount: this.state.amount.toString(),
                        currency: this.state.selectedCurrency
                    },
                    payerFsp: 'testingtoolkitdfsp',
                    payeeFsp: 'payeefsp',
                    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    ilpPacket: 'AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXpFUzRvTVBiTlVVQ3VlbXFmNE1rRndudDBxZWQyM2NHTElJFDANdGVzdC5sZWFnM3IuZGZzcDEuYWJjZGVmZWNjJCs4MD8xMsOwYXQAa2IjbCtERmdOBoBnIGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpKMHlGTTIwMQSATE5PVEVYUEVYQU1QTEUNCmRhdGUgZGVjZW50cmFsaXpmMV9TcnRzSUhkQXk=',
                    condition: 'YlK5TZyhflbXaDRPtR5ehDxlMSqM3uIMBoVhqoD0ddg'
                }
            }, 'Transfer request sent to Second Merchant Corp');
            
            // Store transferId for the PUT response
            this.lastTransferId = transferId;
        }, baseDelay + 1600);
        
        // Step 11: PUT /transfers - Second Merchant Corp -> Mojaloop Switch
        setTimeout(() => {
            this.triggerPayeeMerchantEvent('payeeMerchantPutTransfers', {
                resource: { method: 'put', path: `/transfers/${this.lastTransferId}` },
                requestBody: {
                    transferState: 'COMMITTED',
                    transferId: this.lastTransferId,
                    completedTimestamp: new Date().toISOString(),
                    fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
                }
            }, 'Transfer committed by Second Merchant Corp');
        }, baseDelay + 1800);
    };
    
    triggerPayeeMerchantEvent = (eventType, data, logMessage) => {
        // Trigger the UI event
        if (this.props.onPayeeMerchantNotification) {
            this.props.onPayeeMerchantNotification({
                category: 'payeeMerchant',
                type: eventType,
                data: data
            });
        }
        
        // Trigger the monitor log for Second Merchant Corp
        if (this.props.onPayeeMerchantNotification && logMessage) {
            // Sanitize message for Mermaid compatibility
            const sanitizedMessage = this.sanitizeForMermaid(logMessage);
            
            this.props.onPayeeMerchantNotification({
                category: 'payeeMerchantMonitorLog',
                type: 'log',
                data: {
                    log: {
                        logTime: new Date().toISOString(),
                        notificationType: eventType.includes('Get') || eventType.includes('Post') ? 'newLog' : 'newOutboundLog',
                        message: sanitizedMessage,
                        resource: data.resource,
                        additionalData: {
                            request: {
                                body: data.requestBody
                            }
                        },
                        uniqueId: this.generateUUID(),
                        verbosity: 'info'
                    }
                }
            });
        }
    };
    
    sanitizeForMermaid = (message) => {
        // Remove or replace characters that can cause Mermaid syntax errors
        return message
            .replace(/[\n\r]/g, ' ')  // Replace newlines with spaces
            .replace(/["'`]/g, '')    // Remove quotes that can break syntax
            .replace(/[{}\[\]]/g, '') // Remove brackets
            .replace(/[<>]/g, '')     // Remove angle brackets
            .replace(/[:;]/g, '-')    // Replace colons/semicolons with dashes
            .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
            .trim();                  // Trim whitespace
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
            gettingMerchantInfo: false,
            stage: null,
            amount: 100,
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            selectedCurrency: 'USD',
        });
    };

    render() {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black', borderRadius: '15px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '15%', background: 'white', borderRadius: '10px', padding: '10px', overflow: 'auto' }}>
                    <Row>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <Text strong style={{ fontSize: '14px' }}>HALMADENT SRL</Text>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', padding: '5px 0' }}>
                                <Text style={{ fontSize: '10px' }}>LEI: {this.state.payerLEI}</Text>
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
                    
                    {this.state.stage ? (
                        <Row className='mt-2'>
                            <Col span={24}>
                                {this.getStageData()}
                            </Col>
                        </Row>
                    ) : (
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' loading={this.state.gettingMerchantInfo} onClick={this.handleGetMerchantInfo}>Start Payment</Button>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
        );
    }
}

export default PayerMerchant;