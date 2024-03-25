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

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Row, Col, Typography, notification, Statistic, Card, Table, Tag, Layout, Form, Input, Button, message, InputNumber, Select, Skeleton, Result, Steps } from 'antd';

import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';

import axios from 'axios';

import NotificationService from '../../../services/demos/PayeeAppSimulator/payeeNotifications';
import { getServerConfig, getConfig } from '../../../utils/getConfig';

import BrandIcon from './BrandIcon';

const { Text, Title } = Typography;
const { Option } = Select;

const COUNTRY_CODE_LIST = [
    'AED',
    'AFN',
    'ALL',
    'AMD',
    'ANG',
    'AOA',
    'ARS',
    'AUD',
    'AWG',
    'AZN',
    'BAM',
    'BBD',
    'BDT',
    'BGN',
    'BHD',
    'BIF',
    'BMD',
    'BND',
    'BOB',
    'BRL',
    'BSD',
    'BTC',
    'BTN',
    'BWP',
    'BYN',
    'BZD',
    'CAD',
    'CDF',
    'CHF',
    'CLF',
    'CLP',
    'CNH',
    'CNY',
    'COP',
    'CRC',
    'CUC',
    'CUP',
    'CVE',
    'CZK',
    'DJF',
    'DKK',
    'DOP',
    'DZD',
    'EGP',
    'ERN',
    'ETB',
    'EUR',
    'FJD',
    'FKP',
    'GBP',
    'GEL',
    'GGP',
    'GHS',
    'GIP',
    'GMD',
    'GNF',
    'GTQ',
    'GYD',
    'HKD',
    'HNL',
    'HRK',
    'HTG',
    'HUF',
    'IDR',
    'ILS',
    'IMP',
    'INR',
    'IQD',
    'IRR',
    'ISK',
    'JEP',
    'JMD',
    'JOD',
    'JPY',
    'KES',
    'KGS',
    'KHR',
    'KMF',
    'KPW',
    'KRW',
    'KWD',
    'KYD',
    'KZT',
    'LAK',
    'LBP',
    'LKR',
    'LRD',
    'LSL',
    'LYD',
    'MAD',
    'MDL',
    'MGA',
    'MKD',
    'MMK',
    'MNT',
    'MOP',
    'MRU',
    'MUR',
    'MVR',
    'MWK',
    'MXN',
    'MYR',
    'MZN',
    'NAD',
    'NGN',
    'NIO',
    'NOK',
    'NPR',
    'NZD',
    'OMR',
    'PAB',
    'PEN',
    'PGK',
    'PHP',
    'PKR',
    'PLN',
    'PYG',
    'QAR',
    'RON',
    'RSD',
    'RUB',
    'RWF',
    'SAR',
    'SBD',
    'SCR',
    'SDG',
    'SEK',
    'SGD',
    'SHP',
    'SLL',
    'SOS',
    'SRD',
    'SSP',
    'STD',
    'STN',
    'SVC',
    'SYP',
    'SZL',
    'THB',
    'TJS',
    'TMT',
    'TND',
    'TOP',
    'TRY',
    'TTD',
    'TWD',
    'TZS',
    'UAH',
    'UGX',
    'USD',
    'UYU',
    'UZS',
    'VES',
    'VND',
    'VUV',
    'WST',
    'XAF',
    'XAG',
    'XAU',
    'XCD',
    'XDR',
    'XOF',
    'XPD',
    'XPF',
    'XPT',
    'YER',
    'ZAR',
    'ZMW',
    'ZWL',
];


class PayerMobile extends React.Component {
    state = {
        receivedAmount: null,
        payeeReceiveAmount: null,
        payerComplexName: null,
        balance: {},
        transactionHistory: [],
        party: {},
        selectedCurrency: 'KES',
        amount: 10,
        phoneNumber: '16135551002',
        loading: false,
        partyInfo: {},
        transferId: '',
        currentState: 'start',
        errorMessage: '',
        userConfig: {},
        sdkOutboundApiBaseUrl: '',
    };

    componentDidMount = async () => {
        const { userConfigRuntime } = await getServerConfig();
        this.setState({
            userConfig: userConfigRuntime,
            sdkOutboundApiBaseUrl: userConfigRuntime.CALLBACK_ENDPOINT,
        });

    };

    cleanupStuff = () => {
        if(this.notificationServiceObj) {
            this.notificationServiceObj.disconnect();
        }
    };

    componentWillUnmount = () => {
        this.cleanupStuff();
    };

    resetState = () => {
        this.setState({ receivedAmount: null, payeeReceiveAmount: null, payerComplexName: null, currentState: 'start' });
    };

    handleNotificationEvents = event => {
        console.log(event);
        const amountStr = event.transaction.amount + ' ' + event.transaction.currency;
        const payerInfo = `${event.transaction.from.idValue}` + (event.transaction.from.displayName ? ` (${event.transaction.from.displayName})` : '');
        this.setState({ balance: event.newBalance, balanceCurrency: event.transaction.currency, transactionHistory: event.transactionHistory.reverse() });
        this.openNotification(`Received amount ${amountStr}`, `from ${payerInfo}`);
    };

    openNotification = (message, description) => {
        notification.open({
            message,
            description,
            duration: 6,
            placement: 'topLeft',
            ...this.props.notificationProperties,
            icon: <CheckOutlined style={{ color: '#10e98e' }} />,
        });
    };

    getStageData = () => {
        switch (this.state.currentState) {
            case 'start':
                return (
                    <>
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' danger disabled={!this.state.phoneNumber || !this.state.amount} onClick={this.handleInitiateTransfer} loading={this.state.loading}>Initiate Transfer</Button>
                            </Col>
                        </Row>
                    </>
                );
            case 'getQuote':
                return <Skeleton active />;
            case 'WAITING_FOR_PARTY_ACCEPTANCE':
                return (
                    <Row className='mt-3'>
                        <Col span={24} className='text-center'>
                            <Button type='primary' shape='round' danger onClick={ e => this.handleAcceptance('acceptParty')} loading={this.state.loading}>Accept Party Information</Button>
                        </Col>
                    </Row>
                );
            case 'WAITING_FOR_CONVERSION_ACCEPTANCE':
                return (
                    <Row className='mt-3'>
                        <Col span={24} className='text-center'>
                            <Button type='primary' shape='round' danger onClick={e => this.handleAcceptance('acceptConversion')} loading={this.state.loading}>Accept Conversion</Button>
                        </Col>
                    </Row>
                );
            case 'WAITING_FOR_QUOTE_ACCEPTANCE':
                return (
                    <Row className='mt-3'>
                        <Col span={24} className='text-center'>
                            <Button type='primary' shape='round' danger onClick={e => this.handleAcceptance('acceptQuote')} loading={this.state.loading}>Accept Quote</Button>
                        </Col>
                    </Row>
                );
            case 'COMPLETED':
                return (
                    <Row>
                        <Col span={24} className='text-center'>
                            {
                                this.state.transfersResponse && this.state.transfersResponse.transferState === 'COMMITTED'
                                    ? (
                                        <Result
                                            status='success'
                                        />
                                    )
                                    : (
                                        <Result
                                            status='error'
                                        />
                                    )
                            }
                        </Col>
                    </Row>
                );
            default:
                return null;
        }
    };

    _constructStateFromResponse = responseData => {
        return {
            partyInfo: responseData?.getPartiesResponse?.body?.party,
            quoteResponse: responseData?.quoteResponse?.body,
            fxQuoteResponse: responseData?.fxQuoteResponse?.body,
            transfersResponse: responseData?.fulfil?.body,
            currentState: responseData?.currentState,
            transferId: responseData?.transferId,
        };
    };

    handleInitiateTransfer = async e => {
        this.setState({ loading: true });

        const requestBody = {
            homeTransactionId: '1234',
            from: {
                type: 'CONSUMER',
                idType: 'MSISDN',
                idValue: '16135551001',
                displayName: 'string',
                firstName: 'Henrik',
                middleName: 'Johannes',
                lastName: 'Karlsson',
                dateOfBirth: '1966-06-16',
                fspId: this.state.userConfig.FSP_ID,
            },
            to: {
                type: 'CONSUMER',
                idType: 'MSISDN',
                idValue: this.state.phoneNumber,
                merchantClassificationCode: 123,
            },
            amountType: 'SEND',
            currency: this.state.selectedCurrency,
            amount: this.state.amount,
            transactionType: 'TRANSFER',
            note: 'Note sent to Payee.',
            skipPartyLookup: false,
        };
        let newState = {};
        try {
            const environmentRes = await axios.post(`${this.state.sdkOutboundApiBaseUrl}/transfers`, requestBody);
            newState = this._constructStateFromResponse(environmentRes.data);
            newState.loading = false;
        } catch (err) {
            console.log(err);
            const responseData = err.response.data.transferState;
            newState = this._constructStateFromResponse(responseData);
            newState.errorMessage = responseData.lastError?.mojaloopError?.errorInformation?.errorDescription || 'Error occurred';
            newState.loading = false;
        }
        this.setState(newState);
    };

    handleAcceptance = async acceptanceType => {
        this.setState({ loading: true });
        const transferId = this.state.transferId;

        const requestBody = {};
        requestBody[acceptanceType] = true;
        
        let newState = {};
        try {
            const environmentRes = await axios.put(`${this.state.sdkOutboundApiBaseUrl}/transfers/${transferId}`, requestBody);
            newState = this._constructStateFromResponse(environmentRes.data);
            newState.loading = false;
        } catch (err) {
            console.log(err);
            newState.loading = false;
        }

        this.setState(newState);
    };

    getStepItems = () => {
        // const steps = [
        //     { title: 'Finished', description: 'asdf' },
        //     {
        //         title: 'In Progress',
        //         description: 'asdf',
        //     },
        //     {
        //         title: 'Waiting',
        //         description: 'asdf',
        //     },
        // ];
        const steps = [];
        if(this.state.currentState == 'start' && this.state.loading) {
            steps.push({
                title: 'Getting Party Info',
                description: 'Please wait...',
                status: 'process',
                icon: <LoadingOutlined />,
            });
        }
        if(this.state.partyInfo && this.state.partyInfo.personalInfo && this.state.partyInfo.personalInfo.complexName) {
            steps.push({
                title: 'Party Info',
                description: this.state.partyInfo.personalInfo.complexName.firstName + ' ' + (this.state.partyInfo.personalInfo.complexName.middleName || '') + ' ' + this.state.partyInfo.personalInfo.complexName.lastName + ' @ ' + this.state.partyInfo.partyIdInfo.fspId,
                status: 'finish',
            });
        }
        if(this.state.currentState == 'WAITING_FOR_PARTY_ACCEPTANCE' && this.state.loading) {
            steps.push({
                title: 'Getting Quote',
                description: 'Please wait...',
                status: 'process',
                icon: <LoadingOutlined />,
            });
        }
        if(this.state.fxQuoteResponse && this.state.fxQuoteResponse.conversionTerms && this.state.fxQuoteResponse.conversionTerms.sourceAmount && this.state.fxQuoteResponse.conversionTerms.targetAmount) {
            steps.push({
                title: 'Conversion Terms',
                description: <>Sending {this.state.fxQuoteResponse.conversionTerms.sourceAmount.currency} {this.state.fxQuoteResponse.conversionTerms.sourceAmount.amount}<br />Payee receives {this.state.fxQuoteResponse.conversionTerms.targetAmount.currency} {this.state.fxQuoteResponse.conversionTerms.targetAmount.amount}</>,
                status: 'finish',
            });
        }
        if(this.state.currentState == 'WAITING_FOR_CONVERSION_ACCEPTANCE' && this.state.loading) {
            steps.push({
                title: 'Getting Quote',
                description: 'Please wait...',
                status: 'process',
                icon: <LoadingOutlined />,
            });
        }
        if(this.state.quoteResponse && this.state.quoteResponse.transferAmount && this.state.quoteResponse.transferAmount.amount) {
            const payeeFspFee = this.state.quoteResponse.payeeFspFee?.amount || 0;
            const payeeFspCurrency = this.state.quoteResponse.payeeFspFee?.currency || this.state.quoteResponse.transferAmount.currency;
            steps.push({
                title: 'Quote',
                description: <>Payee FSP fee is {payeeFspCurrency} {payeeFspFee}<br />Payee receives {this.state.quoteResponse.transferAmount.currency + ' ' + this.state.quoteResponse.transferAmount.amount}</>,
                status: 'finish',
            });
        }
        if(this.state.currentState == 'WAITING_FOR_QUOTE_ACCEPTANCE' && this.state.loading) {
            steps.push({
                title: 'Committing Transfer',
                description: 'Please wait...',
                status: 'process',
                icon: <LoadingOutlined />,
            });
        }
        if(this.state.transfersResponse && this.state.transfersResponse.transferState && this.state.transfersResponse.transferState === 'COMMITTED') {
            steps.push({
                title: 'Transfer Successful',
                description: <>Sent amount successfully</>,
                status: 'finish',
            });
        }
        if(this.state.transfersResponse && this.state.transfersResponse.transferState && this.state.transfersResponse.transferState !== 'COMMITTED') {
            steps.push({
                title: 'Transfer Failed',
                description: <>Failed to send amount</>,
                status: 'error',
            });
        }
        if(this.state.currentState == 'ERROR_OCCURRED') {
            steps.push({
                title: 'Transfer Failed',
                description: this.state.errorMessage,
                status: 'error',
            });
        }
        return steps;
    };

    onLoginFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    render() {
        return (
            <>
                <Row className='mt-1'>
                    <Col span={12}>
                        <span className='ml-3'>
                            <BrandIcon width='100px' className='float-center' />
                        </span>
                    </Col>
                    <Col span={12}>
                        <span className='float-right mr-3 mt-2'>
                            <Row className='mt-2'>
                                <Col span={24}>
                                    <Text className='float-right' type='secondary' strong>{this.state.party.idValue}</Text>
                                </Col>
                            </Row>
                        </span>
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={24} className='text-center'>
                        <Title level={3}>Welcome {this.state.party.displayName}</Title>
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={24} className='text-left'>
                        <Row className='ml-2'>
                            <Col span={24}>
                                <Text strong>Phone Number</Text>
                                <Input
                                    placeholder='Phone Number'
                                    disabled={this.state.currentState !== 'start'}
                                    value={this.state.phoneNumber}
                                    onChange={e => {
                                        this.setState({ phoneNumber: e.target.value });
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row className='mt-2 ml-2'>
                            <Col span={24}>
                                <Text strong>Amount</Text>
                                <InputNumber
                                    className='ml-2'
                                    value={this.state.amount}
                                    disabled={this.state.currentState !== 'start'}
                                    onChange={newNumber => {
                                        this.setState({ amount: newNumber });
                                    }}
                                    // formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    // parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                                <Select
                                    className='ml-2'
                                    style={{ width: 120 }}
                                    placeholder='Currency'
                                    disabled={this.state.currentState !== 'start'}
                                    value={this.state.selectedCurrency}
                                    defaultActiveFirstOption
                                    onChange={currency => {
                                        this.setState({ selectedCurrency: currency });
                                    }}
                                >
                                    {
                                        COUNTRY_CODE_LIST.map((countryCode, index) => {
                                            return <Option key={index} value={countryCode}>{countryCode}</Option>;
                                        })
                                    }
                                </Select>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <Card size='small'>
                                    <Steps
                                        direction="vertical"
                                        size="small"
                                        current={1}
                                        items={this.getStepItems()}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Row className='mt-1 ml-2'>
                            <Col span={24}>
                                {this.getStageData()}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>
        );
    }
}

export default PayerMobile;
