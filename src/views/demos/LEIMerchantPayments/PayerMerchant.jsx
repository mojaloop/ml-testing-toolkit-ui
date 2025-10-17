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
        
        this.state = {
            gettingMerchantInfo: false,
            stage: null,
            amount: 100, // Will be updated from config
            payerName: '', // Will be populated from config
            payerBank: '', // Will be populated from config
            payerBankAccountId: '', // Will be populated from config
            payeeMerchantId: '', // Will be populated from config
            payeeLEI: null, // Will be set from lookup
            lookupMerchantId: '', // Input field for LEI lookup, will be populated from config
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            accounts: [],
            selectedCurrency: 'RWF', // Will be updated from config
            currentTransactionId: null, // Track transaction ID from quotes to transfers
            showQRScanner: false,
            scannedMerchantInfo: null,
        };
    }

    componentDidMount = async () => {
        // Load merchant configuration first
        await this.loadAndUpdateConfig();
    };
    
    loadAndUpdateConfig = async () => {
        try {
            // Force reload the merchant configuration
            const response = await fetch('/merchants.json');
            if (response.ok) {
                const merchantData = await response.json();
                console.log('📋 PayerMerchant: Loaded merchant config:', merchantData);
                
                // Update state directly with loaded data
                if (merchantData.payer) {
                    this.setState({
                        payerName: merchantData.payer.name,
                        payerBank: merchantData.payer.bank,
                        payerBankAccountId: merchantData.payer.bankAccountId,
                    });
                }
                
                if (merchantData.payee) {
                    console.log('✅ Setting lookupMerchantId to LEI:', merchantData.payee.lei);
                    this.setState({
                        payeeMerchantId: merchantData.payee.merchantId,
                        lookupMerchantId: merchantData.payee.lei, // Use LEI for lookup
                    });
                }
                
                // Update transaction config
                if (merchantData.currencies) {
                    this.setState({
                        selectedCurrency: merchantData.currencies[0] || 'RWF'
                    });
                }
                
                // Set default amount
                this.setState({
                    amount: 100 // Default amount
                });
            } else {
                console.error('❌ Failed to load merchants.json');
            }
        } catch (error) {
            console.error('❌ Error loading merchant config:', error);
        }
    };

    handleNotificationEvents = event => {
        console.log('🔔 PayerMerchant: Received notification event:', {
            type: event.type,
            data: event.data
        });
        
        switch (event.type) {
            case 'getParties':
            {
                // Start of party lookup - show loading state
                this.setState({ stage: 'getParties' });
                break;
            }
            case 'getPartiesResponse':
            {
                // Step 2: Mojaloop Switch → Payer response 202
                // Backend notification service will automatically handle the next step
                break;
            }
            // Handle events from PayeeMerchant (Payee)
            case 'payeeMerchantGetPartiesResponse':
            {
                // Step 4: Payee → Mojaloop Switch: response 202 
                // This triggers Step 5: Payee → Mojaloop Switch: PUT /parties
                break;
            }
            case 'payeeMerchantPutPartiesResponse':
            {
                // Step 6: Mojaloop Switch → Payee: response 200
                // This triggers Step 7: Mojaloop Switch → Payer: PUT /parties
                // Note: Step 7-8 are handled automatically by the notification service
                break;
            }
            case 'putParties':
            {
                // Step 7: Final step of Party Lookup phase - ready for quotes
                console.log('📋 PayerMerchant: putParties event received');
                console.log('🔍 Full event.data structure:', JSON.stringify(event.data, null, 2));
                
                let payeeLEI = this.state.payeeLEI; // Keep existing LEI if already set
                console.log('💾 Current payeeLEI in state:', payeeLEI);
                
                // Extract LEI from the parties response structure
                // For ALIAS party type, the partyIdentifier contains the LEI
                if (event.data) {
                    console.log('🔍 Attempting LEI extraction from event.data...');
                    console.log('🔍 event.data.lei:', event.data.lei);
                    console.log('🔍 event.data.extractedLEI:', event.data.extractedLEI);
                    console.log('🔍 event.data.merchantInfo:', event.data.merchantInfo);
                    console.log('🔍 event.data.party:', event.data.party);
                    
                    // Try multiple possible LEI locations in the response
                    let newPayeeLEI = null;
                    
                    // Primary method: Extract from party.partyIdInfo.partyIdentifier when partyIdType is ALIAS
                    if (event.data.party && event.data.party.partyIdInfo) {
                        const { partyIdType, partyIdentifier } = event.data.party.partyIdInfo;
                        if (partyIdType === 'ALIAS' && partyIdentifier) {
                            newPayeeLEI = partyIdentifier;
                            console.log('🔍 Found LEI in party.partyIdInfo.partyIdentifier:', newPayeeLEI);
                        }
                    }
                    
                    // Fallback methods for other possible LEI locations
                    if (!newPayeeLEI) {
                        newPayeeLEI = event.data.lei || 
                                      event.data.extractedLEI ||
                                      (event.data.merchantInfo && event.data.merchantInfo.lei) ||
                                      (event.data.merchantInfo && event.data.merchantInfo.extractedLEI) ||
                                      (event.data.party && event.data.party.lei) ||
                                      (event.data.party && event.data.party.extractedLEI) ||
                                      null;
                    }
                    
                    console.log('🔍 Final extracted newPayeeLEI:', newPayeeLEI);
                    
                    if (newPayeeLEI) {
                        payeeLEI = newPayeeLEI;
                        console.log('✅ Successfully extracted payee LEI from parties response:', payeeLEI);
                    } else {
                        console.log('⚠️ Could not extract LEI from parties response. Available keys in event.data:');
                        console.log(Object.keys(event.data));
                        
                        // Deep inspection of all nested objects
                        Object.keys(event.data).forEach(key => {
                            if (typeof event.data[key] === 'object' && event.data[key] !== null) {
                                console.log(`🔍 event.data.${key}:`, JSON.stringify(event.data[key], null, 2));
                            }
                        });
                    }
                } else {
                    console.log('❌ No event.data available for LEI extraction');
                }
                
                console.log('💾 Final payeeLEI to store in state:', payeeLEI);
                
                this.setState({ 
                    gettingMerchantInfo: false, 
                    stage: 'putParties', 
                    merchantInfo: event.data.party,
                    payeeLEI: payeeLEI // Store the extracted LEI
                }, () => {
                    console.log('💾 State updated. New payeeLEI in state:', this.state.payeeLEI);
                });
                break;
            }
            case 'putPartiesResponse':
            {
                break;
            }
            case 'postQuotes':
            {
                // Step 8: Payer → Mojaloop Switch POST /quotes - keep internal but don't show UI
                // Store quotes request data but don't change UI stage
                this.setState({ 
                    quotesRequest: event.data.quotesRequest 
                });
                break;
            }
            case 'postQuotesResponse':
            {
                // Step 10: Mojaloop Switch → Payer: response 202
                // Backend notification service will automatically handle the next step
                break;
            }
            // Handle quotes response events from PayeeMerchant
            case 'payeeMerchantPostQuotesResponse':
            {
                // Step 12: Payee → Mojaloop Switch: response 202
                // This triggers Step 13: Payee → Mojaloop Switch: PUT /quotes
                break;
            }
            case 'payeeMerchantPutQuotesResponse':
            {
                // Step 14: Mojaloop Switch → Payee: response 200
                // This triggers Step 15: Mojaloop Switch → Payer: PUT /quotes
                // Note: Step 15-16 are handled automatically by the notification service
                break;
            }
            case 'putQuotes':
            {
                // Step 15: Final step of Quotes phase - automatically proceed to transfers
                // Store quotes data but don't show quotes UI, go straight to transfer
                console.log('🎨 putQuotes received - current stage:', this.state.stage);
                this.setState({ 
                    quotesResponse: event.data.quotesResponse,
                    // Store transaction ID from quotes response for later use
                    currentTransactionId: event.data.quotesResponse && event.data.quotesResponse.transactionId
                }, () => {
                    console.log('🎨 putQuotes state updated - about to auto-trigger transfer');
                    // Automatically trigger transfer after quotes are received
                    setTimeout(() => {
                        try {
                            console.log('🎨 Auto-triggering transfer now');
                            this.handleTransfer();
                        } catch (error) {
                            console.error('Error in automatic transfer:', error);
                            // Don't reset stage on error - keep current state
                        }
                    }, 500); // Small delay for smooth UX
                });
                break;
            }
            case 'putQuotesResponse':
            {
                break;
            }
            case 'postTransfers':
            {
                // Step 17: Payer → Mojaloop Switch POST /transfers - show loading state
                console.log('PayerMerchant: postTransfers event received');
                this.setState({ stage: 'postTransfers' });
                break;
            }
            case 'postTransfersResponse':
            {
                // Step 18: Mojaloop Switch → Payer: response 202
                // Backend notification service will automatically handle the next step
                console.log('PayerMerchant: postTransfersResponse event received');
                break;
            }
            // Handle transfers response events from PayeeMerchant
            case 'payeeMerchantPostTransfersResponse':
            {
                // Step 20: Payee → Mojaloop Switch: response 202
                // This triggers Step 21: Payee → Mojaloop Switch: PUT /transfers
                break;
            }
            case 'payeeMerchantPutTransfersResponse':
            {
                // Step 22: Mojaloop Switch → Payee: response 200
                // This triggers Step 23: Mojaloop Switch → Payer: PUT /transfers
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
            // Quotes stages are hidden from UI - handled internally
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
                        {/* Compact Merchant Info */}
                        <div style={{ 
                            background: '#f0f9ff', 
                            borderRadius: '6px', 
                            padding: '12px', 
                            marginBottom: '12px',
                            border: '1px solid #bae6fd'
                        }}>
                            <Text style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>✅ Merchant Found:</Text>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Text style={{ fontSize: '11px', color: '#64748b' }}>Name:</Text>
                                <Text strong style={{ fontSize: '12px', color: '#1e293b' }}>
                                    {this.state.merchantInfo && this.state.merchantInfo.name ? this.state.merchantInfo.name : getPayeeConfig().name}
                                </Text>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Text style={{ fontSize: '11px', color: '#64748b' }}>ID:</Text>
                                <Text strong style={{ fontSize: '11px', color: '#1e293b' }}>{this.state.payeeMerchantId}</Text>
                            </div>
                            
                            {this.state.payeeLEI && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '11px', color: '#64748b' }}>LEI:</Text>
                                    <Text strong style={{ fontSize: '10px', color: '#667eea', fontFamily: 'monospace' }}>{this.state.payeeLEI}</Text>
                                </div>
                            )}
                        </div>
                        
                        {/* Compact Amount Input */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <InputNumber
                                    style={{ flex: 2 }}
                                    size='middle'
                                    value={this.state.amount}
                                    onChange={newNumber => this.setState({ amount: newNumber })}
                                    placeholder='Amount'
                                />
                                <Select
                                    style={{ flex: 1 }}
                                    size='middle'
                                    value={this.state.selectedCurrency}
                                    onChange={currency => this.setState({ selectedCurrency: currency })}
                                >
                                    {getTransactionConfig().currencies.map(currency => (
                                        <Option key={currency} value={currency}>{currency}</Option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        
                        {/* Send Payment Button - quotes happen internally */}
                        <Button 
                            type='primary' 
                            size='middle'
                            block
                            disabled={!this.state.selectedCurrency} 
                            onClick={this.handleGetQuote}
                            style={{ borderRadius: '6px', height: '36px', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            Send Payment
                        </Button>
                    </div>
                );
            case 'putTransfers':
                return (
                    <div style={{ width: '100%' }}>
                        {/* Big Success Checkmark */}
                        <div style={{ 
                            textAlign: 'center',
                            marginBottom: '15px'
                        }}>
                            <div style={{ 
                                fontSize: '48px',
                                lineHeight: '1',
                                marginBottom: '8px',
                                color: '#52c41a'
                            }}>✅</div>
                            <Text strong style={{ fontSize: '16px', color: '#52c41a', display: 'block', marginBottom: '4px' }}>Payment Sent!</Text>
                            <Text style={{ fontSize: '12px', color: '#666' }}>Transaction completed successfully</Text>
                        </div>
                        
                        {/* Compact Payment Summary */}
                        <div style={{ 
                            background: '#f6ffed', 
                            borderRadius: '6px', 
                            padding: '10px', 
                            marginBottom: '10px',
                            border: '1px solid #b7eb8f'
                        }}>
                            <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#333' }}>💸 Payment Summary</Text>
                            
                            {/* Compact Payee Information */}
                            <div style={{ 
                                background: '#ffffff', 
                                borderRadius: '6px', 
                                padding: '8px', 
                                marginBottom: '8px',
                                border: '1px solid #d9f7be'
                            }}>
                                <Text style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>To (Payee):</Text>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888' }}>Merchant Name:</Text>
                                    <Text strong style={{ fontSize: '11px', float: 'right', color: '#333' }}>
                                        {this.state.merchantInfo && this.state.merchantInfo.name ? this.state.merchantInfo.name : getPayeeConfig().name}
                                    </Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888' }}>Merchant ID:</Text>
                                    <Text strong style={{ fontSize: '10px', float: 'right', color: '#333' }}>{this.state.payeeMerchantId}</Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888' }}>Payee LEI:</Text>
                                    <Text strong style={{ fontSize: '9px', float: 'right', color: '#667eea', fontFamily: 'monospace' }}>
                                        {this.state.payeeLEI || 'N/A'}
                                    </Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                            </div>
                            
                            {/* Compact Transfer Details */}
                            <div style={{ 
                                background: '#ffffff', 
                                borderRadius: '6px', 
                                padding: '8px', 
                                marginBottom: '6px',
                                border: '1px solid #d9f7be'
                            }}>
                                <Text style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Transfer Details:</Text>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888' }}>Amount Sent:</Text>
                                    <Text strong style={{ fontSize: '14px', float: 'right', color: '#52c41a' }}>
                                        {this.state.quotesResponse && this.state.quotesResponse.transferAmount ? 
                                            `${this.state.quotesResponse.transferAmount.amount} ${this.state.quotesResponse.transferAmount.currency}` : 
                                            `${this.state.amount} ${this.state.selectedCurrency}`
                                        }
                                    </Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Transfer ID:</Text>
                                    <Text strong style={{ 
                                        fontSize: '9px', 
                                        color: '#666', 
                                        fontFamily: 'monospace',
                                        display: 'block',
                                        wordBreak: 'break-all',
                                        lineHeight: '1.2'
                                    }}>
                                        {this.state.currentTransactionId || (this.state.transfersResponse && this.state.transfersResponse.transferId) || 'N/A'}
                                    </Text>
                                </div>
                                
                                <div style={{ marginBottom: '4px' }}>
                                    <Text style={{ fontSize: '10px', color: '#888' }}>Sent At:</Text>
                                    <Text strong style={{ fontSize: '9px', float: 'right', color: '#666' }}>
                                        {new Date().toLocaleString()}
                                    </Text>
                                    <div style={{ clear: 'both' }} />
                                </div>
                                
                                {this.state.quotesResponse && this.state.quotesResponse.payeeFspFee && (
                                    <div style={{ marginBottom: '4px' }}>
                                        <Text style={{ fontSize: '10px', color: '#888' }}>Processing Fee:</Text>
                                        <Text strong style={{ fontSize: '9px', float: 'right', color: '#ff7a00' }}>
                                            {this.state.quotesResponse.payeeFspFee.amount} {this.state.quotesResponse.payeeFspFee.currency}
                                        </Text>
                                        <div style={{ clear: 'both' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Action Button */}
                        <div style={{ textAlign: 'center' }}>
                            <Button 
                                type='primary' 
                                size='large'
                                onClick={this.handleReset}
                                style={{ marginTop: '10px', borderRadius: '8px', width: '160px', height: '50px', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                🆕 New Payment
                            </Button>
                        </div>
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
                            <Text style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Recipient LEI or Merchant ID:</Text>
                            <Input
                                size='large'
                                value={this.state.lookupMerchantId}
                                onChange={(e) => this.setState({ lookupMerchantId: e.target.value })}
                                placeholder='Enter LEI (e.g., 529900AXZOJO15EBGR24) or Merchant ID'
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
        console.log('🚀 Starting handleGetMerchantInfo...');
        
        const lookupId = this.state.lookupMerchantId.trim();
        console.log('🔍 Looking up LEI:', lookupId);
        
        // Try to lookup merchant info from configuration first (now async)
        let foundMerchantLEI = null;
        try {
            console.log('🔍 Attempting local merchant lookup...');
            const merchantLookup = await lookupMerchantByMerchantId(lookupId);
            if (merchantLookup) {
                console.log('🔍 Found merchant in local lookup:', merchantLookup);
                foundMerchantLEI = merchantLookup.lei; // Store LEI from lookup
                console.log('🔍 Local lookup foundMerchantLEI:', foundMerchantLEI);
                if (merchantLookup.source === 'merchant-registry-oracle') {
                    console.log('✅ Using real merchant registry data!');
                } else {
                    console.log('📋 Using local configuration data');
                }
            } else {
                console.log('⚠️ No merchant found in local lookup');
            }
        } catch (error) {
            console.warn('❌ Merchant lookup failed:', error);
        }
        
        console.log('💾 Setting initial state with foundMerchantLEI:', foundMerchantLEI);
        
        this.setState({ 
            stage: 'getParties', 
            gettingMerchantInfo: true,
            payeeMerchantId: lookupId, // Update the payeeMerchantId with the looked up value
            payeeLEI: foundMerchantLEI // Store the LEI from lookup
        }, () => {
            console.log('💾 State updated with payeeLEI:', this.state.payeeLEI);
        });
        
        try {
            console.log(`🚀 Calling outboundService.getPartiesAlias with LEI: ${lookupId}`);
            const result = await this.props.outboundService.getPartiesAlias(lookupId);
            console.log('🔍 getPartiesAlias result:', result);
            
            // Extract LEI from the registry response if available
            if (result?.data?.merchantInfo?.lei) {
                console.log('✅ Extracted LEI from registry response:', result.data.merchantInfo.lei);
                this.setState({ payeeLEI: result.data.merchantInfo.lei });
            }
        } catch (error) {
            console.error('❌ Error in merchant lookup:', error);
            message.error('Failed to lookup merchant information');
            this.setState({ 
                gettingMerchantInfo: false
                // Don't reset stage to null - keep current stage
            });
        }
    };

    handleGetQuote = async () => {
        // Don't change UI stage - quotes happen internally
        // this.setState({ stage: 'postQuotes' });
        console.log('🎨 handleGetQuote called - stage should remain:', this.state.stage);
        
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
            console.log('🔍 QR scan successful:', qrData);
            
            // Check if QR code contains LEI - use LEI for direct parties lookup
            if (!qrData.lei) {
                message.error('QR code does not contain LEI information');
                return;
            }
            
            console.log('✅ Found LEI in QR code:', qrData.lei);
            
            // Store QR data and LEI
            this.setState({
                showQRScanner: false,
                scannedMerchantInfo: qrData,
                lookupMerchantId: qrData.lei, // Use LEI for lookup display
                payeeMerchantId: qrData.merchantId || qrData.lei, // Keep merchant ID if available
                payeeLEI: qrData.lei // Store LEI from QR code
            });
            
            const merchantName = qrData.merchantName || 'Unknown Merchant';
            message.success(`QR Code scanned successfully! Found: ${merchantName}`);
            
            // Get UI config for delay timing
            const uiConfig = getUIConfig();
            
            // Automatically proceed to LEI-based parties lookup using getPartiesAlias
            setTimeout(() => {
                this.handleGetMerchantInfo(); // This will now use LEI with getPartiesAlias
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

    handleReset = async () => {
        // Reset state to initial values
        this.setState({ 
            stage: null,
            gettingMerchantInfo: false,
            merchantInfo: {},
            quotesRequest: {},
            quotesResponse: {},
            transfersResponse: {},
            payeeLEI: null,
            currentTransactionId: null,
            showQRScanner: false,
            scannedMerchantInfo: null
        });
        
        // Reload configuration to get fresh default values
        await this.loadAndUpdateConfig();
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
                    <Text style={{ fontSize: '14px', color: '#666' }}>Bank: {this.state.payerBank}</Text>
                    <br/>
                    <Text style={{ fontSize: '14px', color: '#666' }}>Account: {this.state.payerBankAccountId}</Text>
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