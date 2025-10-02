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
import { Row, Col, Typography, Card, Result, InputNumber, Select, Button, Skeleton, Input } from 'antd';
const { Text } = Typography;
const { Option } = Select;

class PayerMerchant extends React.Component {
    state = {
        gettingMerchantInfo: false,
        stage: null,
        amount: 100,
        payerLEI: '787200JXIR2YYZDPNP23',
        payeeLEI: '529900VJSEB3P1FV4R31',
        lookupLEI: '529900VJSEB3P1FV4R31', // Input field for LEI lookup, prefilled
        merchantInfo: {},
        quotesRequest: {},
        quotesResponse: {},
        transfersResponse: {},
        accounts: [],
        selectedCurrency: 'USD',
        currentTransactionId: null, // Track transaction ID from quotes to transfers
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
                // Small delay to ensure sequence diagram processes this response first
                setTimeout(() => {
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
                }, 50);
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
                // Only trigger after we confirm this response was processed
                setTimeout(() => {
                    if (this.payeeMerchantRef && this.payeeMerchantRef.current) {
                        this.payeeMerchantRef.current.triggerStep11PostQuotes(
                            this.state.amount.toString(),
                            this.state.selectedCurrency
                        );
                    }
                }, 50); // Small delay to ensure sequence diagram processes response first
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
                    quotesResponse: event.data.quotesResponse,
                    // Store transaction ID from quotes response for later use
                    currentTransactionId: event.data.quotesResponse && event.data.quotesResponse.transactionId
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
                // Small delay to ensure sequence diagram processes response first
                setTimeout(() => {
                    if (this.payeeMerchantRef && this.payeeMerchantRef.current) {
                        this.payeeMerchantRef.current.triggerStep19PostTransfers();
                    } else {
                        console.error('PayerMerchant: payeeMerchantRef not available for Step 19');
                    }
                }, 50);
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
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                        <Text style={{ color: '#666', fontSize: '15px', marginTop: '10px' }}>Looking up merchant information...</Text>
                    </div>
                );
            case 'postQuotes':
                return (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                        <Text style={{ color: '#666', fontSize: '15px', marginTop: '10px' }}>Getting quote...</Text>
                    </div>
                );
            case 'postTransfers':
                return (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                        <Text style={{ color: '#666', fontSize: '15px', marginTop: '10px' }}>Processing transfer...</Text>
                    </div>
                );
            case 'putParties':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Merchant Info */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Merchant:</Text>
                                <br/>
                                <Text strong style={{ fontSize: '16px' }}>SECOND MERCHANT CORP</Text>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>LEI:</Text>
                                <br/>
                                <Text strong style={{ fontSize: '14px' }}>{this.state.payeeLEI}</Text>
                            </div>
                        </div>
                        
                        {/* Amount Input */}
                        <div style={{ marginBottom: '18px' }}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}>Payment Amount:</Text>
                            <InputNumber
                                style={{ width: '100%', marginBottom: '8px' }}
                                size='large'
                                value={this.state.amount}
                                onChange={newNumber => {
                                    this.setState({ amount: newNumber });
                                }}
                                placeholder='Enter amount'
                            />
                            <Select
                                style={{ width: '100%' }}
                                size='large'
                                placeholder='Select Currency'
                                value={this.state.selectedCurrency}
                                onChange={currency => {
                                    this.setState({ selectedCurrency: currency });
                                }}
                            >
                                <Option value="USD">USD</Option>
                                <Option value="EUR">EUR</Option>
                            </Select>
                        </div>
                        
                        {/* Get Quote Button */}
                        <Button 
                            type='primary' 
                            size='large'
                            block
                            disabled={!this.state.selectedCurrency} 
                            onClick={this.handleGetQuote}
                            style={{ borderRadius: '8px', height: '50px', fontWeight: 'bold', fontSize: '16px' }}
                        >
                            Get Quote
                        </Button>
                    </div>
                );
            case 'putQuotes':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Quote Details */}
                        <div style={{ 
                            background: '#f8f9fa', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            marginBottom: '15px' 
                        }}>
                            <Text strong style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>Quote Details</Text>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Amount:</Text>
                                <Text strong style={{ fontSize: '16px', float: 'right' }}>
                                    {this.state.quotesResponse && this.state.quotesResponse.transferAmount ? 
                                        `${this.state.quotesResponse.transferAmount.amount} ${this.state.quotesResponse.transferAmount.currency}` : 
                                        `${this.state.amount} ${this.state.selectedCurrency}`
                                    }
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            <div style={{ marginBottom: '8px' }}>
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
                        
                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                                size='large'
                                onClick={this.handleReset}
                                style={{ flex: 1, height: '50px', borderRadius: '8px', fontSize: '15px' }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type='primary' 
                                size='large'
                                onClick={this.handleTransfer}
                                style={{ flex: 1, height: '50px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Transfer Money
                            </Button>
                        </div>
                    </div>
                );
            case 'putTransfers':
                return (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Result
                            status='success'
                            title={<Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Successful!</Text>}
                            subTitle={
                                <div>
                                    <Text style={{ fontSize: '14px', color: '#666' }}>Amount: {this.state.amount} {this.state.selectedCurrency}</Text>
                                    <br/>
                                    <Text style={{ fontSize: '12px', color: '#999' }}>Transfer ID: {this.state.currentTransactionId || (this.state.transfersResponse && this.state.transfersResponse.transferId) || 'N/A'}</Text>
                                </div>
                            }
                        />
                        <Button 
                            type='primary' 
                            size='large'
                            onClick={this.handleReset}
                            style={{ marginTop: '18px', borderRadius: '8px', width: '140px', height: '50px', fontWeight: 'bold', fontSize: '15px' }}
                        >
                            New Payment
                        </Button>
                    </div>
                );
            default:
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <Text style={{ fontSize: '18px', color: '#333', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Send Payment</Text>
                            <Text style={{ fontSize: '14px', color: '#666' }}>Enter the recipient's LEI to continue</Text>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <Text style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Recipient LEI:</Text>
                            <Input
                                size='large'
                                value={this.state.lookupLEI}
                                onChange={(e) => this.setState({ lookupLEI: e.target.value })}
                                placeholder='Enter LEI (e.g., 529900VJSEB3P1FV4R31)'
                                style={{ marginBottom: '15px' }}
                            />
                        </div>
                        
                        <Button 
                            type='primary' 
                            size='large'
                            block
                            loading={this.state.gettingMerchantInfo} 
                            onClick={this.handleGetMerchantInfo}
                            disabled={!this.state.lookupLEI || this.state.lookupLEI.trim().length === 0}
                            style={{ 
                                borderRadius: '8px', 
                                height: '55px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            Lookup Merchant
                        </Button>
                    </div>
                );
        }
    };

    handleGetMerchantInfo = async () => {
        // Update payeeLEI with the looked up LEI
        const lookupLEI = this.state.lookupLEI.trim();
        this.setState({ 
            stage: 'getParties', 
            gettingMerchantInfo: true,
            payeeLEI: lookupLEI // Update the payeeLEI with the looked up value
        });
        await this.props.outboundService.getPartiesLEI(lookupLEI);
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
            
            const transactionId = this.state.currentTransactionId ||
                (this.state.quotesRequest && this.state.quotesRequest.transactionId) ||
                (this.state.quotesResponse && this.state.quotesResponse.transactionId) ||
                this.generateUUID();
            
            // Update state with the transaction ID being used for transfer
            this.setState({ currentTransactionId: transactionId });
            
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
            selectedCurrency: 'USD',
            lookupLEI: '529900VJSEB3P1FV4R31', // Reset to default LEI
            currentTransactionId: null // Reset transaction ID
        });
    };

    render() {
        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    <Text style={{ color: '#667eea', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>PAYER</Text>
                    <Text strong style={{ fontSize: '22px', color: '#333' }}>HALMADENT SRL</Text>
                    <br/>
                    <Text style={{ fontSize: '14px', color: '#666' }}>LEI: {this.state.payerLEI}</Text>
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
                    minHeight: '300px'
                }}>
                    {this.getStageData()}
                </div>
            </div>
        );
    }
}

export default PayerMerchant;