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
import { Row, Col, Typography, Card, Result, InputNumber, Select, Button, Skeleton, Input, Modal, message } from 'antd';
import { QrcodeOutlined, ScanOutlined } from '@ant-design/icons';
import QRCameraScanner from '../../../components/QRCameraScanner.jsx';
import { getPayerConfig, getPayeeConfig, getTransactionConfig, getUIConfig, validateMerchantId, lookupMerchantByMerchantId } from '../../../config/leiMerchantConfig.js';
const { Text } = Typography;
const { Option } = Select;

class PayerMerchant extends React.Component {
    constructor(props) {
        super(props);
        
        const payerConfig = getPayerConfig();
        const payeeConfig = getPayeeConfig();
        const transactionConfig = getTransactionConfig();
        
        this.state = {
            gettingMerchantInfo: false,
            stage: null,
            amount: transactionConfig.defaultAmount,
            payerMerchantId: payerConfig.merchantId,
            payerLEI: payerConfig.lei,
            payeeMerchantId: payeeConfig.merchantId,
            payeeLEI: null, // Will be set from lookup
            lookupMerchantId: payeeConfig.merchantId, // Input field for merchant_id lookup, prefilled with default payee
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            accounts: [],
            selectedCurrency: transactionConfig.defaultCurrency,
            currentTransactionId: null, // Track transaction ID from quotes to transfers
            showQRScanner: false,
            scannedMerchantInfo: null,
        };
    }

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
                // Backend notification service will automatically handle the next step
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
                // Backend notification service will automatically handle the next step
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
                // Backend notification service will automatically handle the next step
                console.log('PayerMerchant: postTransfersResponse event received');
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
                                <Text strong style={{ fontSize: '16px' }}>{getPayeeConfig().name}</Text>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>Merchant ID:</Text>
                                <br/>
                                <Text strong style={{ fontSize: '14px' }}>{this.state.payeeMerchantId}</Text>
                            </div>
                            {this.state.payeeLEI && (
                                <div style={{ marginBottom: '10px' }}>
                                    <Text style={{ fontSize: '13px', color: '#666' }}>LEI:</Text>
                                    <br/>
                                    <Text strong style={{ fontSize: '14px' }}>{this.state.payeeLEI}</Text>
                                </div>
                            )}
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
                                {getTransactionConfig().currencies.map(currency => (
                                    <Option key={currency} value={currency}>{currency}</Option>
                                ))}
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
                                <Text style={{ fontSize: '13px', color: '#666' }}>To:</Text>
                                <Text strong style={{ fontSize: '14px', float: 'right' }}>
                                    {getPayeeConfig().name}
                                </Text>
                                <div style={{ clear: 'both' }} />
                            </div>
                            
                            {this.state.payeeLEI && (
                                <div style={{ marginBottom: '8px' }}>
                                    <Text style={{ fontSize: '13px', color: '#666' }}>LEI:</Text>
                                    <Text strong style={{ fontSize: '14px', float: 'right' }}>
                                        {this.state.payeeLEI}
                                    </Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                            )}
                            
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
                            <Text style={{ fontSize: '14px', color: '#666' }}>Scan QR code or enter the recipient's merchant ID</Text>
                        </div>
                        
                        {/* QR Scanner Button */}
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <Button
                                type='default'
                                size='large'
                                icon={<ScanOutlined />}
                                onClick={this.handleQRScan}
                                style={{
                                    borderRadius: '8px',
                                    height: '50px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    border: '2px dashed #667eea',
                                    color: '#667eea',
                                    background: 'rgba(102, 126, 234, 0.05)'
                                }}
                            >
                                Scan QR Code
                            </Button>
                        </div>
                        
                        {/* Divider */}
                        <div style={{ 
                            textAlign: 'center', 
                            margin: '20px 0', 
                            position: 'relative'
                        }}>
                            <div style={{
                                height: '1px',
                                background: '#e8e8e8',
                                position: 'relative'
                            }} />
                            <Text style={{
                                fontSize: '12px',
                                color: '#999',
                                background: 'rgba(255,255,255,0.95)',
                                padding: '0 10px',
                                position: 'absolute',
                                top: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }}>or</Text>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <Text style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Recipient Merchant ID:</Text>
                            <Input
                                size='large'
                                value={this.state.lookupMerchantId}
                                onChange={(e) => this.setState({ lookupMerchantId: e.target.value })}
                                placeholder='Enter Merchant ID (e.g., 1 or 2)'
                                style={{ marginBottom: '15px' }}
                                prefix={this.state.scannedMerchantInfo ? <QrcodeOutlined style={{ color: '#52c41a' }} /> : null}
                            />
                            {this.state.scannedMerchantInfo && (
                                <Text style={{ fontSize: '12px', color: '#52c41a', marginBottom: '10px', display: 'block' }}>
                                    ✓ Scanned: {this.state.scannedMerchantInfo.merchantName}
                                </Text>
                            )}
                        </div>
                        
                        <Button 
                            type='primary' 
                            size='large'
                            block
                            loading={this.state.gettingMerchantInfo} 
                            onClick={this.handleGetMerchantInfo}
                            disabled={!this.state.lookupMerchantId || this.state.lookupMerchantId.trim().length === 0}
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
        // Update payeeMerchantId with the looked up merchant ID
        const lookupMerchantId = this.state.lookupMerchantId.trim();
        
        // Validate merchant ID format
        if (!validateMerchantId(lookupMerchantId)) {
            message.error('Invalid merchant ID format.');
            return;
        }
        
        // Try to lookup merchant info from configuration first (now async)
        let foundMerchantLEI = null;
        try {
            const merchantLookup = await lookupMerchantByMerchantId(lookupMerchantId);
            if (merchantLookup) {
                console.log('Found merchant:', merchantLookup);
                foundMerchantLEI = merchantLookup.lei; // Store LEI from lookup
                if (merchantLookup.source === 'merchant-registry-oracle') {
                    console.log('\u2705 Using real merchant registry data!');
                } else {
                    console.log('\ud83d\udccb Using local configuration data');
                }
            }
        } catch (error) {
            console.warn('Merchant lookup failed:', error);
        }
        
        this.setState({ 
            stage: 'getParties', 
            gettingMerchantInfo: true,
            payeeMerchantId: lookupMerchantId, // Update the payeeMerchantId with the looked up value
            payeeLEI: foundMerchantLEI // Store the LEI from lookup
        });
        
        try {
            await this.props.outboundService.getPartiesAlias(lookupMerchantId);
        } catch (error) {
            console.error('Error in merchant lookup:', error);
            message.error('Failed to lookup merchant information');
            this.setState({ 
                gettingMerchantInfo: false,
                stage: null
            });
        }
    };

    handleGetQuote = async () => {
        this.setState({ stage: 'postQuotes' });
        
        // If payeeLEI is still null, try to look it up again
        let payeeLEI = this.state.payeeLEI;
        if (!payeeLEI && this.state.payeeMerchantId) {
            console.log('\ud83d\udd0d Payee LEI not available, attempting lookup...');
            try {
                const merchantLookup = await lookupMerchantByMerchantId(this.state.payeeMerchantId);
                if (merchantLookup && merchantLookup.lei) {
                    payeeLEI = merchantLookup.lei;
                    this.setState({ payeeLEI });
                    console.log('\u2705 Retrieved payee LEI for quotes:', payeeLEI);
                }
            } catch (error) {
                console.warn('Failed to lookup payee LEI for quotes:', error);
            }
        }
        
        console.log('\ud83d\udccb Calling postQuotes with:', {
            amount: this.state.amount,
            currency: this.state.selectedCurrency,
            payerMerchantId: this.state.payerMerchantId,
            payeeMerchantId: this.state.payeeMerchantId,
            payerLEI: this.state.payerLEI,
            payeeLEI: payeeLEI
        });
        
        await this.props.outboundService.postQuotes(
            this.state.amount,
            this.state.selectedCurrency,
            this.state.payerMerchantId,
            this.state.payeeMerchantId,
            this.state.payerLEI, // Pass payer LEI
            payeeLEI  // Pass payee LEI (possibly just retrieved)
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
    
    handleQRScan = () => {
        this.setState({ showQRScanner: true });
    };
    
    handleQRScanCancel = () => {
        this.setState({ showQRScanner: false });
    };
    
    handleQRScanSuccess = async (qrData) => {
        try {
            console.log('QR scan successful:', qrData);
            
            // Validate the scanned merchant ID
            if (!validateMerchantId(qrData.merchantId)) {
                message.error('Invalid merchant ID format in QR code');
                return;
            }
            
            // Try to lookup merchant info from configuration (now async)
            const merchantLookup = await lookupMerchantByMerchantId(qrData.merchantId);
            
            // Enhanced merchant info with lookup data
            const enhancedMerchantInfo = {
                ...qrData,
                ...(merchantLookup && {
                    merchantName: merchantLookup.name,
                    fspId: merchantLookup.fspId,
                    merchantType: merchantLookup.type,
                    lei: merchantLookup.lei
                })
            };
            
            this.setState({
                showQRScanner: false,
                scannedMerchantInfo: enhancedMerchantInfo,
                lookupMerchantId: qrData.merchantId,
                payeeMerchantId: qrData.merchantId,
                payeeLEI: merchantLookup?.lei || null // Store LEI from lookup
            });
            
            const merchantName = enhancedMerchantInfo.merchantName || 'Unknown Merchant';
            message.success(`QR Code scanned successfully! Found: ${merchantName}`);
            
            // Get UI config for delay timing
            const uiConfig = getUIConfig();
            
            // Automatically proceed to merchant lookup
            setTimeout(() => {
                this.handleGetMerchantInfo();
            }, uiConfig.delays.autoLookupDelay);
            
        } catch (error) {
            console.error('Error processing QR code:', error);
            message.error('Failed to process QR code data');
            this.setState({ showQRScanner: false });
        }
    };
    
    handleQRScanError = (error) => {
        console.error('QR scan error:', error);
        message.error('QR code scanning failed. Please try again.');
    };

    handleReset = () => {
        const payeeConfig = getPayeeConfig();
        const transactionConfig = getTransactionConfig();
        
        this.setState({ 
            stage: null,
            gettingMerchantInfo: false,
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            amount: transactionConfig.defaultAmount,
            selectedCurrency: transactionConfig.defaultCurrency,
            lookupMerchantId: payeeConfig.merchantId, // Reset to default payee merchant ID
            payeeLEI: null, // Clear the LEI from previous lookup
            currentTransactionId: null, // Reset transaction ID
            showQRScanner: false,
            scannedMerchantInfo: null
        });
    };

    render() {
        return (
            <>
                {/* Real QR Camera Scanner */}
                <QRCameraScanner
                    visible={this.state.showQRScanner}
                    onCancel={this.handleQRScanCancel}
                    onScanSuccess={this.handleQRScanSuccess}
                    onScanError={this.handleQRScanError}
                    title="Scan Merchant QR Code"
                />
                
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
                    <Text style={{ color: '#667eea', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{getPayerConfig().displayName}</Text>
                    <Text strong style={{ fontSize: '22px', color: '#333' }}>{getPayerConfig().name}</Text>
                    <br/>
                    <Text style={{ fontSize: '14px', color: '#666' }}>Merchant ID: {this.state.payerMerchantId}</Text>
                    <br/>
                    <Text style={{ fontSize: '14px', color: '#666' }}>LEI: {this.state.payerLEI}</Text>
                    <br/>
                    <Text style={{ fontSize: '12px', color: '#888' }}>{getPayerConfig().terminalName}</Text>
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
            </>
        );
    }
}

export default PayerMerchant;