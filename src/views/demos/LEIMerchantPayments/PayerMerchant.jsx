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
                // Start of party lookup - show loading state
                this.setState({ stage: 'getParties' });
                break;
            }
            case 'getPartiesResponse':
            {
                // Step 2: Mojaloop Switch → HALMADENT SRL response 202
                // This triggers Step 3: Mojaloop Switch → SECOND MERCHANT CORP: GET /parties
                if (this.props.onPayeeMerchantNotification) {
                    this.props.onPayeeMerchantNotification({
                        category: 'payeeMerchant',
                        type: 'payeeMerchantGetParties',
                        data: {
                            resource: { method: 'get', path: `/parties/ALIAS/${this.state.payeeLEI}` },
                            requestBody: null
                        }
                    });
                }
                break;
            }
            // Handle events from PayeeMerchant (SECOND MERCHANT CORP)
            case 'payeeMerchantGetPartiesResponse':
            {
                // Step 4: SECOND MERCHANT CORP → Mojaloop Switch: response 202 
                // This triggers Step 5: SECOND MERCHANT CORP → Mojaloop Switch: PUT /parties
                break;
            }
            case 'payeeMerchantPutPartiesResponse':
            {
                // Step 6: Mojaloop Switch → SECOND MERCHANT CORP: response 200
                // This triggers Step 7: Mojaloop Switch → HALMADENT SRL: PUT /parties
                // Note: Step 7-8 are handled automatically by the notification service
                break;
            }
            case 'putParties':
            {
                // Step 7: Final step of Party Lookup phase - ready for quotes
                this.setState({ 
                    gettingMerchantInfo: false, 
                    stage: 'putParties', 
                    merchantInfo: event.data.party 
                });
                break;
            }
            case 'putPartiesResponse':
            {
                break;
            }
            case 'postQuotes':
            {
                // Step 8: HALMADENT → Mojaloop Switch POST /quotes - show loading state
                this.setState({ 
                    stage: 'postQuotes',
                    quotesRequest: event.data.quotesRequest 
                });
                break;
            }
            case 'postQuotesResponse':
            {
                // Step 10: Mojaloop Switch → HALMADENT SRL: response 202
                // This triggers Step 11: Mojaloop Switch → SECOND MERCHANT CORP: POST /quotes
                if (this.payeeMerchantRef && this.payeeMerchantRef.current) {
                    this.payeeMerchantRef.current.triggerStep11PostQuotes(
                        this.state.amount.toString(),
                        this.state.selectedCurrency
                    );
                }
                break;
            }
            // Handle quotes response events from PayeeMerchant
            case 'payeeMerchantPostQuotesResponse':
            {
                // Step 12: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                // This triggers Step 13: SECOND MERCHANT CORP → Mojaloop Switch: PUT /quotes
                break;
            }
            case 'payeeMerchantPutQuotesResponse':
            {
                // Step 14: Mojaloop Switch → SECOND MERCHANT CORP: response 200
                // This triggers Step 15: Mojaloop Switch → HALMADENT SRL: PUT /quotes
                // Note: Step 15-16 are handled automatically by the notification service
                break;
            }
            case 'putQuotes':
            {
                // Step 15: Final step of Quotes phase - ready for transfers
                this.setState({ 
                    stage: 'putQuotes', 
                    quotesResponse: event.data.quotesResponse 
                });
                break;
            }
            case 'putQuotesResponse':
            {
                break;
            }
            case 'postTransfers':
            {
                // Step 17: HALMADENT → Mojaloop Switch POST /transfers - show loading state
                console.log('PayerMerchant: postTransfers event received');
                this.setState({ stage: 'postTransfers' });
                break;
            }
            case 'postTransfersResponse':
            {
                // Step 18: Mojaloop Switch → HALMADENT SRL: response 202
                // This triggers Step 19: Mojaloop Switch → SECOND MERCHANT CORP: POST /transfers
                console.log('PayerMerchant: postTransfersResponse event received, triggering Step 19');
                if (this.payeeMerchantRef && this.payeeMerchantRef.current) {
                    this.payeeMerchantRef.current.triggerStep19PostTransfers();
                } else {
                    console.error('PayerMerchant: payeeMerchantRef not available for Step 19');
                }
                break;
            }
            // Handle transfers response events from PayeeMerchant
            case 'payeeMerchantPostTransfersResponse':
            {
                // Step 20: SECOND MERCHANT CORP → Mojaloop Switch: response 202
                // This triggers Step 21: SECOND MERCHANT CORP → Mojaloop Switch: PUT /transfers
                break;
            }
            case 'payeeMerchantPutTransfersResponse':
            {
                // Step 22: Mojaloop Switch → SECOND MERCHANT CORP: response 200
                // This triggers Step 23: Mojaloop Switch → HALMADENT SRL: PUT /transfers
                // Note: Step 23-24 are handled automatically by the notification service
                break;
            }
            case 'putTransfers':
            {
                // Step 23: Final step - Transfer complete!
                console.log('PayerMerchant: putTransfers event received - SUCCESS!', event.data);
                this.setState({ 
                    stage: 'putTransfers', 
                    transfersResponse: event.data.transfersResponse 
                });
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
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                                <Text>Looking up merchant information...</Text>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'postQuotes':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                                <Text>Getting quote...</Text>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'postTransfers':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                                <Text>Processing transfer...</Text>
                            </Col>
                        </Row>
                    </Card>
                );
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
                        <Row className='mt-4'>
                            <Col span={12} className='text-center'>
                                <Button type='default' shape='round' onClick={this.handleReset}>Cancel</Button>
                            </Col>
                            <Col span={12} className='text-center'>
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
            default:
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Button 
                                    type='primary' 
                                    shape='round' 
                                    loading={this.state.gettingMerchantInfo} 
                                    onClick={this.handleGetMerchantInfo}
                                >
                                    Start Payment
                                </Button>
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
        await this.props.outboundService.postQuotes(
            this.state.amount,
            this.state.selectedCurrency,
            this.state.payerLEI,
            this.state.payeeLEI
        );
    };

    handleTransfer = async () => {
        this.setState({ stage: 'postTransfers' });
        console.log('Transfer Debug - quotesRequest:', this.state.quotesRequest);
        console.log('Transfer Debug - quotesResponse:', this.state.quotesResponse);
        
        try {
            // Always try to call the transfer with fallback values
            const amount = (this.state.quotesResponse && this.state.quotesResponse.transferAmount) ? 
                this.state.quotesResponse.transferAmount.amount : 
                this.state.amount.toString();
            
            const transactionId = (this.state.quotesRequest && this.state.quotesRequest.transactionId) ||
                (this.state.quotesResponse && this.state.quotesResponse.transactionId) ||
                this.generateUUID();
            
            const expiration = (this.state.quotesResponse && this.state.quotesResponse.expiration) ||
                new Date(Date.now() + 30 * 60 * 1000).toISOString();
            
            const ilpPacket = (this.state.quotesResponse && this.state.quotesResponse.ilpPacket) ||
                'AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXpFUzRvTVBiTlVVQ3VlbXFmNE1rRndudDBxZWQyM2NHTElJFDANdGVzdC5sZWFnM3IuZGZzcDEuYWJjZGVmZWNjJCs4MD8xMsOwYXQAa2IjbCtERmdOBoBnIGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpKMHlGTTIwMQSATE5PVEVYUEVYQU1QTEUNCmRhdGUgZGVjZW50cmFsaXpmMV9TcnRzSUhkQXk=';
            
            const condition = (this.state.quotesResponse && this.state.quotesResponse.condition) ||
                'YlK5TZyhflbXaDRPtR5ehDxlMSqM3uIMBoVhqoD0ddg';
            
            console.log('Transfer calling with:', { amount, transactionId, expiration, ilpPacket, condition });
            
            await this.props.outboundService.postTransfers(
                amount,
                transactionId,
                expiration,
                ilpPacket,
                condition
            );
        } catch (error) {
            console.error('Error in handleTransfer:', error);
            // Still try to show the loading state
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
            gettingMerchantInfo: false,
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            amount: 100,
            selectedCurrency: 'USD'
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
                    
                    <Row className='mt-2'>
                        <Col span={24}>
                            {this.getStageData()}
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

export default PayerMerchant;