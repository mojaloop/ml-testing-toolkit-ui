/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

  * Pratap Pawar <iampratappawar@gmail.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Row, Col, Input, Card, Button, Result, Select, message } from 'antd';
import axios from 'axios';

// const { Text } = Typography;
const { Option } = Select;

class PayerMobile extends React.Component {
    state = {
        gettingPartyInfo: false,
        stage: null,
        previousStage: null,
        amount: 100,
        idType: 'MSISDN',
        partyInfo: null,
        quotesRequest: {},
        quotesResponse: {},
        transfersResponse: {},
        accounts: [],
        selectedCurrency: 'INR',
        dfspList: [],
        selectedDfsp: null,
        userId: '',
        selectedAccount: null,
        otp: '',
        consentRequestId: null,
        payeePhone: '',
        paymentOtp: '',
        transactionRequestId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
        pin: 'xxxxxxxxxxx',
        showPin: false,
        transferAmount: '',
        transferCurrency: '',
        linkedAccounts: [],
        selectedAccountLabel: '',
        userIdSubmitted: false,
        fspId: 'pispA',
    };

    componentDidMount = async () => {
        // initial setup here
    };

    proceedToNextStage = nextStage => {
        this.setState(prevState => ({
            previousStage: prevState.stage,
            stage: nextStage,
        }));
    };

    fetchDFSPs = async () => {
        this.setState({ gettingPartyInfo: true });

        try {
            const response = await axios.get('http://localhost:4040/linking/providers');

            if(response && response.data) {
                const { providers, currentState } = response.data;

                if(currentState === 'providersLookupSuccess') {
                    this.setState({ dfspList: providers, gettingPartyInfo: false });
                    this.proceedToNextStage('selectDFSP');
                } else {
                    console.error('Failed to fetch DFSPs:', currentState);
                    this.setState({ gettingPartyInfo: false });
                }
            } else {
                console.error('No data returned');
                this.setState({ gettingPartyInfo: false });
            }
        } catch (error) {
            console.error('Error fetching DFSPs:', error);
            this.setState({ gettingPartyInfo: false });
        }
    };

    fetchLinkedAccounts = async () => {
        const { userId, fspId } = this.state;

        if(!userId || userId.length < 10) {
            message.error('User ID must be at least 10 digits');
            return;
        }

        if(!fspId) {
            message.error('FSP ID cannot be empty');
            return;
        }

        try {
            const response = await axios.get(`/linking/accounts/${fspId}/${userId}`);

            if(response && response.data && Array.isArray(response.data.accounts) && response.data.accounts.length > 0) {
                this.setState({ linkedAccounts: response.data.accounts, userIdSubmitted: true });
                this.proceedToNextStage('selectAccount');
                console.log('Linked Accounts:', response.data.accounts);
            } else {
                message.error('No linked accounts found');
            }
        } catch (error) {
            console.error('Error fetching linked accounts:', error);
            if(error.response) {
                message.error(`Failed to fetch linked accounts: ${error.response.statusText || 'Unknown error'}`);
            } else {
                message.error('Failed to fetch linked accounts');
            }
        }
    };

    fetchAccounts = async () => {
        // Simulated account fetching
        this.proceedToNextStage('enterUserId');
    };

    handleRequestConsent = async () => {
        const { userId, selectedAccount, selectedDfsp } = this.state;
    
        if(!userId || userId.length < 10) {
            message.error('User ID must be at least 10 digits');
            return;
        }
    
        if(!selectedAccount) {
            message.error('Please select an account');
            return;
        }
    
        if(!selectedDfsp) {
            message.error('Please select a DFSP');
            return;
        }
    
        try {
            const consentRequestId = 'f6ab43b0-71cc-49f9-b763-2ac3f05ac8c1'; 
            const payload = {
                consentRequestId,
                toParticipantId: selectedDfsp,
                accounts: [
                    {
                        accountNickname: 'SpeXXXXXXXXnt',
                        id: selectedAccount,
                        currency: 'USD',
                        address: selectedAccount, 
                    },
                ],
                actions: ['ACCOUNTS_TRANSFER'],
                userId,
                callbackUri: 'pisp-app://callback',
            };
    
            const response = await axios.post('/linking/request-consent', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            console.log('Consent request response:', response.data);
    
            if(response.data.currentState === 'OTPAuthenticationChannelResponseReceived') {
                this.setState({
                    consentRequestId: payload.consentRequestId,
                    stage: 'enterOTP',
                });
            } else {
                message.error('Unexpected consent request response state');
            }
        } catch (error) {
            console.error('Error requesting consent:', error.response ? error.response.data : error.message);
            message.error('Failed to request consent: ' + (error.response && error.response.data.errorInformation ? error.response.data.errorInformation.errorDescription : error.message));
        }
    };

    handleOtpVerification = async () => {
        const { otp } = this.state;
        if(otp.length < 6) {
            message.error('OTP must be at least 6 digits');
            return;
        }
        // Simulated OTP verification
        this.proceedToNextStage('passCredential');
    };

    handlePassCredential = async () => {
        // Simulated credential passing
        alert('Account Linked🎉');
        this.proceedToNextStage('enterPayeePhone');
    };

    handleSearch = async payeePhone => {
        if(payeePhone.length !== 10) {
            message.error('Payee phone number must be 10 digits');
            return;
        }

        this.setState({ gettingPartyInfo: true });

        try {
            const transactionRequestId = 'b51ec534-ee48-4575-b6a9-ead2955b8069';
            const payload = {
                transactionRequestId,
                payee: {
                    partyIdType: 'MSISDN',
                    partyIdentifier: payeePhone,
                },
            };

            const resp = await axios.post('/thirdpartyTransaction/partyLookup', payload, {
                withCredentials: true,
            });

            if(resp && resp.data) {
                const { currentState, party, errorInformation } = resp.data;

                switch (currentState) {
                    case 'partyLookupSuccess':
                        console.log('Party Info:', party);
                        this.setState({
                            partyInfo: {
                                firstName: party.name ? party.name.split(' ')[0] : 'Justin',
                                middleName: party.name ? party.name.split(' ')[1] : 'Pierre',
                                lastName: party.name ? party.name.split(' ')[2] : '',
                                fspId: party.partyIdInfo?.fspId || 'Green Bank',
                                partyIdInfo: party.partyIdInfo || {},
                            },
                            gettingPartyInfo: false,
                        });
                        break;

                    case 'partyLookupFailure':
                        console.error('Party lookup failed', errorInformation);
                        this.setState({ gettingPartyInfo: false });
                        message.error('Failed to lookup party information');
                        break;

                    case 'errored':
                        console.error('Error occurred', errorInformation);
                        this.setState({ gettingPartyInfo: false });
                        message.error('An error occurred while looking up party information');
                        break;

                    default:
                        console.error('Unexpected state:', currentState);
                        this.setState({ gettingPartyInfo: false });
                        message.error('Unexpected error occurred');
                        break;
                }
            } else {
                console.error('No data returned');
                this.setState({ gettingPartyInfo: false });
                message.error('No data returned from server');
            }
        } catch (error) {
            console.error('Error fetching party info:', error);
            this.setState({ gettingPartyInfo: false });
            message.error('Failed to fetch party information');
        }
    };

    handleGetQuote = async () => {
        const { payeePhone, amount, selectedCurrency } = this.state;

        if(!payeePhone || payeePhone.length !== 10) {
            message.error('Payee phone number must be 10 digits');
            return;
        }

        if(!amount || amount <= 0) {
            message.error('Amount is required and must be greater than 0');
            return;
        }

        if(!selectedCurrency) {
            message.error('Currency is required');
            return;
        }

        try {
            const { partyInfo, userId, selectedDfsp, transactionRequestId } = this.state;

            // Validate partyInfo
            if(!partyInfo || !partyInfo.partyIdInfo) {
                throw new Error('Party information is missing');
            }

            // Validate userId
            if(!userId || userId.length < 10) {
                throw new Error('Payer partyIdentifier must be at least 10 digits');
            }

            const payload = {
                payee: {
                    name: `${partyInfo.firstName} ${partyInfo.middleName} ${partyInfo.lastName}`.trim(),
                    partyIdInfo: {
                        fspId: partyInfo.fspId,
                        partyIdType: 'MSISDN',
                        partyIdentifier: payeePhone,
                    },
                },
                payer: {
                    partyIdType: 'THIRD_PARTY_LINK',
                    partyIdentifier: userId,
                    fspId: selectedDfsp,
                },
                amountType: 'RECEIVE',
                amount: {
                    currency: selectedCurrency,
                    amount: amount.toString(),
                },
                transactionType: {
                    scenario: 'DEPOSIT',
                    initiator: 'PAYER',
                    initiatorType: 'CONSUMER',
                },
                expiration: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
            };

            // Debugging logs
            console.log('Payload:', payload);
            console.log('userId:', userId);
            console.log('payer:', {
                partyIdType: 'THIRD_PARTY_LINK',
                partyIdentifier: userId,
                fspId: selectedDfsp,
            });

            const response = await axios.post(`/thirdpartyTransaction/${transactionRequestId}/initiate`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Debugging response
            console.log('Quote response:', response.data);

            this.setState({ quotesResponse: response.data });
            this.proceedToNextStage('postQuotes');
        } catch (error) {
            console.error('Error getting quote:', error.response ? error.response.data : error.message);
            message.error('Failed to get quote: ' + (error.response && error.response.data.message ? error.response.data.message : error.message));
        }
    };

    handleSend = async () => {
        this.proceedToNextStage('enterPin');
    };

    handleCancel = () => {
        this.setState({ stage: null });
    };

    handleBack = () => {
        this.setState(prevState => ({ stage: prevState.previousStage }));
    };

    handlePinSubmit = async () => {
        const { pin } = this.state;
        if(pin.length < 4) {
            message.error('Pin must be at least 4 digits');
            return;
        }

        try {
            const { transactionRequestId, transferAmount, transferCurrency, amount, selectedCurrency } = this.state;

            const signedPayload = 'SIGNED_PAYLOAD_DATA'; // Replace with actual signed payload data
            const signedPayloadType = 'GENERIC';

            if(!signedPayload || !signedPayloadType) {
                throw new Error('signedPayload or signedPayloadType is missing from quotesResponse.authorization');
            }

            const payload = {
                authorizationResponse: {
                    signedPayload: {
                        signedPayloadType: signedPayloadType,
                        genericSignedPayload: signedPayload,
                    },
                    responseType: 'ACCEPTED',
                },
            };

            const response = await axios.post(`/thirdpartyTransaction/${transactionRequestId}/approve`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                },
            );

            console.log('Approval response:', response.data);

            this.setState({
                transfersResponse: response.data,
                transferAmount,
                transferCurrency,
            });

            // Send message to PayeeMobile
            window.postMessage({
                type: 'PAYMENT_SUCCESS',
                amount: {
                    amount: amount,
                    currency: selectedCurrency,
                },
                payerName: 'Pratap',
            }, '*');

            this.proceedToNextStage('postTransfers');
        } catch (error) {
            console.error('Error approving transaction:', error.response ? error.response.data : error.message);
            message.error('Failed to approve transaction: ' + (error.response && error.response.data.errorInformation ? error.response.data.errorInformation.errorDescription : error.message));
        }
    };

    togglePinVisibility = () => {
        this.setState(prevState => ({ showPin: !prevState.showPin }));
    };

    renderStageContent = () => {
        const { stage, dfspList, userId, otp, payeePhone, gettingPartyInfo, partyInfo, amount, selectedCurrency, quotesResponse, pin, showPin, linkedAccounts } = this.state;

        return (
            <Card size='small'>
                {stage !== null && stage !== 'enterPayeePhone' && stage !== 'postTransfers' && (
                    <Button type='default' onClick={this.handleBack} style={{ marginBottom: '1em' }}>
                        Back
                    </Button>
                )}
                {stage === null && (
                    <Row className='mt-3'>
                        <Col span={24} className='text-center'>
                            <Button type='primary' shape='round' onClick={this.fetchDFSPs}>Link your account</Button>
                        </Col>
                    </Row>
                )}
                {stage === 'selectDFSP' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px' }}>Select DFSP</h3>
                        <Select
                            style={{ width: '100%', fontSize: '16px', color: 'black'  }}
                            placeholder={<span style={{ color: 'black' }}>Select DFSP</span>} 
                            onChange={value => this.setState({ selectedDfsp: value })}
                            value={this.state.selectedDfsp}
                            dropdownStyle={{ color: 'black' }} 
                        >
                            {dfspList.map(dfsp => (
                                <Option key={dfsp} value={dfsp}>{dfsp}</Option>
                            ))}
                        </Select>
                        {this.state.selectedDfsp && (
                            <Button type='primary' onClick={this.fetchAccounts} className='mt-2'>Next</Button>
                        )}
                    </Card>
                )}

                {stage === 'enterUserId' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px' }}>Enter User Id</h3>
                        <Input
                            style={{ width: '100%', fontSize: '16px', color: 'black' }}
                            value={userId}
                            onChange={e => this.setState({ userId: e.target.value })}
                            placeholder='Enter 10 digit User ID'
                        />
                        {userId.length >= 10 && (
                            <Button type='primary' onClick={this.fetchLinkedAccounts} className='mt-2'>Next</Button>
                        )}
                    </Card>
                )}
                {stage === 'selectAccount' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px' }}>Select Account</h3>
                        <Select
                            style={{ 
                                width: '100%', 
                                fontSize: '9px', 
                                color: 'black',  // Ensure selected text is black
                            }}
                            placeholder={<span style={{ color: 'black' }}>Select Account</span>}  // Darker placeholder text
                            labelInValue
                            onChange={option => this.setState({
                                selectedAccount: option.value,
                                selectedAccountLabel: option.label,
                            })}
                            value={this.state.selectedAccount ? {
                                value: this.state.selectedAccount,
                                label: this.state.selectedAccountLabel || 
                                `${linkedAccounts.find(account => account.address === this.state.selectedAccount)?.accountNickname} - ${linkedAccounts.find(account)?.currency}`,
                            } : undefined}
                            dropdownStyle={{ color: 'black' }}  // Ensure dropdown options are dark
                        >
                            {linkedAccounts.map(account => (
                                <Option key={account.address} value={account.address}>
                                    {`${account.accountNickname} - ${account.currency}`}
                                </Option>
                            ))}
                        </Select>

                        {this.state.selectedAccount && (
                            <Button type='primary' onClick={this.handleRequestConsent} className='mt-2'>
                                Next
                            </Button>
                        )}
                    </Card>
                )}

    
                {stage === 'enterOTP' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px' }}>Approve Transfers</h3>
                        <Input
                            style={{ width: '100%', fontSize: '16px' }}
                            value={otp}
                            onChange={e => this.setState({ otp: e.target.value })}
                            placeholder='6 digit OTP    '
                        />
                        {otp.length >= 6 && (
                            <Button type='primary' onClick={this.handleOtpVerification} className='mt-2'>Verify OTP</Button>
                        )}
                    </Card>
                )}
                {stage === 'passCredential' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px' }}>Authorizating Credentials...</h3>
                        <Button type='primary' onClick={this.handlePassCredential}>Next</Button>
                    </Card>
                )}
                {stage === 'enterPayeePhone' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '15px' }}>Enter Payee Identifier</h3>
                        <Input.Search
                            value={payeePhone}
                            onChange={e => this.setState({ payeePhone: e.target.value })}
                            placeholder='10 digit phone number'
                            onSearch={() => this.handleSearch(payeePhone)}
                            loading={gettingPartyInfo}
                        />
                        {partyInfo && (
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ fontSize: '15px', marginTop: '4px' }}>Party Info</h3>
                                <p style={{ marginBottom: '8px' }}>
                                    <strong>Name:</strong> {`${partyInfo.firstName || ''} ${partyInfo.middleName || ''} ${partyInfo.lastName || ''}`}
                                </p>
                                <p style={{ marginBottom: '16px' }}>
                                    <strong>Bank:</strong> {partyInfo.fspId}
                                </p>
                                <div style={{ marginBottom: '16px' }}>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={e => this.setState({ amount: e.target.value })}
                                        placeholder='Enter Amount'
                                        addonBefore="Amount"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={selectedCurrency}
                                        onChange={value => this.setState({ selectedCurrency: value })}
                                        placeholder="Select Currency"
                                    >
                                        <Option value="INR">INR</Option>
                                        <Option value="USD">USD</Option>
                                    </Select>
                                </div>
                                {payeePhone.length === 10 && amount > 0 && selectedCurrency && (
                                    <Button
                                        type='primary'
                                        onClick={this.handleGetQuote}
                                        style={{ width: '100%' }}
                                    >
                                            Get Quote
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                )}
                {stage === 'postQuotes' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '18px', textAlign: 'center' }}>Quote Details</h3>
    
                        {/* Display relevant transaction details */}
                        <Row className='mt-3'>
                            {/* Transfer Amount */}
                            {quotesResponse?.authorization?.transferAmount && (
                                <Col span={24} style={{ textAlign: 'left' }}> {/* Aligns content to the left */}
                                    <p><strong>Transfer Amount: </strong>{amount} {selectedCurrency}</p>
                                </Col>
                            )}
    
                            {/* Payee FSP */}
                            {quotesResponse?.authorization?.payee?.partyIdInfo?.fspId && (
                                <Col span={24} style={{ textAlign: 'left' }}> {/* Aligns content to the left */}
                                    <p><strong>Payee FSP: </strong>{quotesResponse.authorization.payee.partyIdInfo.fspId}</p>
                                </Col>
                            )}
    
                            {/* Payer FSP */}
                            {quotesResponse?.authorization?.payer?.fspId && (
                                <Col span={24} style={{ textAlign: 'left' }}> {/* Aligns content to the left */}
                                    <p><strong>Payer FSP: </strong>{quotesResponse.authorization.payer.fspId}</p>
                                </Col>
                            )}
    
                            {/* Expiration */}
                            {quotesResponse?.authorization?.expiration && (
                                <Col span={24} style={{ textAlign: 'left' }}> {/* Aligns content to the left */}
                                    <p><strong>Expiration: </strong>{new Date(quotesResponse.authorization.expiration).toLocaleString()}</p>
                                </Col>
                            )}
                        </Row>
    
                        {/* Cancel and Proceed Buttons */}
                        <Row className='mt-3'>
                            <Col span={12} style={{ textAlign: 'left' }}> {/* Left aligned buttons */}
                                <Button type='default' onClick={this.handleCancel}>Cancel</Button>
                            </Col>
                            <Col span={12} style={{ textAlign: 'left' }}> {/* Left aligned buttons */}
                                <Button type='primary' onClick={this.handleSend}>Approve</Button>
                            </Col>
                        </Row>
                    </Card>
                )}
    
                {stage === 'enterPin' && (
                    <Card size='small'>
                        <h3 style={{ fontSize: '20px', textAlign: 'center' }}>Enter Pin</h3>
                        <Input.Password
                            value={pin}
                            onChange={e => this.setState({ pin: e.target.value })}
                            placeholder='Enter PIN'
                            visibilityToggle={{
                                visible: showPin,
                                onVisibleChange: this.togglePinVisibility,
                            }}
                        />
                        {pin.length >= 4 && (
                            <Button type='primary' onClick={this.handlePinSubmit} className='mt-2'>Submit</Button>
                        )}
                    </Card>
                )}
    
                {stage === 'postTransfers' && (
                    <Result
                        status="success"
                        title="Payment Successful"
                        subTitle={amount && selectedCurrency && partyInfo?.firstName ? `Your payment of ${amount} ${selectedCurrency} was sent successfully to ${partyInfo.firstName}.` : 'Your payment was processed successfully.'}
                    />
                )}
            </Card>
        );
    };
    
    render() {
        return (
            <div className='payer-mobile'>
                {this.renderStageContent()}
            </div>
        );
    }
}
    
export default PayerMobile;