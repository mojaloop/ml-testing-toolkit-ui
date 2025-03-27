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
import { Row, Col, Typography, notification, Card, Input, Button, InputNumber, Select, Skeleton, Result, Steps, Popover } from 'antd';

import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';

import axios from 'axios';

import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib';
import { getServerConfig, getConfig } from '../../../utils/getConfig';

import templateSdkPostTransfers from './templateSdkPostTransfers.json';
templateSdkPostTransfers.inputValues = {};

import templateSdkPutTransfers from './templateSdkPutTransfers.json';
templateSdkPutTransfers.inputValues = {};

import COUNTRY_CODE_LIST from './countryList.json';

import BrandIcon from './BrandIcon';

const { Text, Title } = Typography;
const { Option } = Select;

const TraceWrap = ({ children, trace }) =>
    <Popover
        content={<div>trace-id: <a href={trace.traceUrl} target='_blank' rel='noreferrer'>{trace.traceId}</a></div>}
    >
        {children}
    </Popover>;

const initialState = {
    receivedAmount: null,
    payeeReceiveAmount: null,
    payerComplexName: null,
    balance: {},
    transactionHistory: [],
    party: {},
    selectedCurrency: 'ZMW',
    selectedIdType: 'MSISDN',
    selectedAmountType: 'SEND',
    amount: 10,
    receiverId: '16665551002',
    loading: false,
    partyInfo: {},
    quoteResponse: {},
    fxQuoteResponse: {},
    transfersResponse: {},
    transferId: '',
    currentState: 'start',
    errorMessage: '',
    userConfig: {},
    sdkOutboundApiBaseUrl: '',
};
class PayerMobile extends React.Component {
    state = initialState;

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
        this.setState(initialState);
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
                                <Button type='primary' shape='round' danger disabled={!this.state.receiverId || !this.state.amount} onClick={this.handleInitiateTransfer} loading={this.state.loading}>Initiate Transfer</Button>
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
            case 'ERROR_OCCURRED':
                const restart = [
                    <Button key="restart" type='primary' shape='round' danger onClick={this.resetState} style={{ position:'fixed', top: '5vh', left: '5vh' }}>Restart</Button>,
                ];
                return (
                    this.state.transfersResponse && this.state.transfersResponse.transferState === 'COMMITTED'
                        ? (
                            <Result
                                extra={restart}
                                status='success'
                            />
                        )
                        : (
                            <Result
                                extra={restart}
                                status='error'
                            />
                        )
                );
            default:
                return null;
        }
    };

    _constructStateFromResponse = (responseData, { traceId, traceUrl } = {}, type = 'error') => {
        switch (type) {
            case 'start':
                return {
                    partyInfo: { ...responseData?.getPartiesResponse?.body?.party, traceId, traceUrl },
                    currentState: responseData?.currentState,
                    transferId: responseData?.transferId,
                };
            case 'acceptParty':
                return {
                    fxQuoteResponse: { ...responseData?.fxQuoteResponse?.body, traceId, traceUrl },
                    currentState: responseData?.currentState,
                    transferId: responseData?.transferId,
                };
            case 'acceptConversion':
                return {
                    quoteResponse: { ...responseData?.quoteResponse?.body, traceId, traceUrl },
                    currentState: responseData?.currentState,
                    transferId: responseData?.transferId,
                };
            case 'acceptQuote':
                return {
                    transfersResponse: { ...responseData?.fulfil?.body, traceId, traceUrl },
                    currentState: responseData?.currentState,
                    transferId: responseData?.transferId,
                };
            default:
                return {
                    currentState: responseData?.currentState,
                    transferId: responseData?.transferId,
                };
        }
    };

    _constructStateFromError = request => {
        const content = <div>
            <div>trace-id: <a href={request.traceUrl} target='grafana'>{request.traceId}</a></div>
            <pre>{JSON.stringify(request?.response?.body, null, 2)}</pre>
        </div>;
        return {
            errorMessage:
                <Popover content={content} title="Error Details">
                    {request?.response?.body?.errorInformation?.errorDescription ?? request?.response?.statusText ?? 'Unexpected error'}
                </Popover>,
            currentState: 'ERROR_OCCURRED',
        };
    };

    _getTraceId() {
        const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix();
        const currentEndToEndId = TraceHeaderUtils.generateEndToEndId();
        const sessionId = TraceHeaderUtils.generateSessionId();
        return traceIdPrefix + sessionId + currentEndToEndId;
    }

    _getTtkBackendAPIUrl = () => {
        const { apiBaseUrl } = getConfig();
        const traceId = this._getTraceId();
        return `${apiBaseUrl}/api/outbound/template/${traceId}?sync=true`;
    };

    handleInitiateTransfer = async e => {
        this.setState({ loading: true });

        templateSdkPostTransfers.inputValues = {
            AMOUNT_TYPE: this.state.selectedAmountType,
            AMOUNT: this.state.amount + '',
            CURRENCY: this.state.selectedCurrency,
            SOURCE_PARTY_ID: '16135551001',
            DESTINATION_PARTY_ID_TYPE: this.state.selectedIdType,
            DESTINATION_PARTY_ID_VALUE: this.state.receiverId,
            SOURCE_FSP_ID: this.state.userConfig.FSPID,
        };
        let newState = {};
        try {
            const resp = await axios.post(
                this._getTtkBackendAPIUrl(),
                templateSdkPostTransfers,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
            newState = resp.data.test_cases[0]?.requests[0]?.response?.status >= 300
                ? this._constructStateFromError(resp.data.test_cases[0]?.requests[0])
                : this._constructStateFromResponse(resp.data.test_cases[0]?.requests[0]?.response?.body, resp.data.test_cases[0]?.requests[0], 'start');
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

        templateSdkPutTransfers.inputValues = {
            TRANSFER_ID: this.state.transferId,
            ACCEPTANCE_TYPE: acceptanceType,
        };

        let newState = {};
        try {
            const resp = await axios.post(
                this._getTtkBackendAPIUrl(),
                templateSdkPutTransfers,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
            newState = resp.data.test_cases[0]?.requests[0]?.response?.status >= 300
                ? this._constructStateFromError(resp.data.test_cases[0]?.requests[0])
                : this._constructStateFromResponse(resp.data.test_cases[0]?.requests[0]?.response?.body, resp.data.test_cases[0]?.requests[0], acceptanceType);
            newState.loading = false;
        } catch (err) {
            console.log(err);
            newState.loading = false;
        }

        this.setState(newState);
    };

    getStepItems = () => {
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
                description: <TraceWrap trace={this.state.partyInfo}>{
                    this.state.partyInfo.personalInfo.complexName.firstName + ' ' + (this.state.partyInfo.personalInfo.complexName.middleName || '') + ' ' + this.state.partyInfo.personalInfo.complexName.lastName + ' @ ' + this.state.partyInfo.partyIdInfo.fspId
                }</TraceWrap>,
                status: 'finish',
            });
        } else if(this.state.partyInfo && this.state.partyInfo.name) {
            steps.push({
                title: 'Party Info',
                description: <TraceWrap trace={this.state.partyInfo}>{
                    this.state.partyInfo.name + ' @ ' + this.state.partyInfo.partyIdInfo.fspId
                }</TraceWrap>,
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
            let conversionFee = 0;
            if(this.state.fxQuoteResponse.conversionTerms.charges) {
                conversionFee = Math.round(this.state.fxQuoteResponse.conversionTerms.charges.reduce((acc, obj) => acc + Number(obj.targetAmount.amount), 0));
            }
            steps.push({
                title: 'Conversion Terms',
                description: <TraceWrap trace={this.state.fxQuoteResponse}>{
                    <>Sending Amount: {this.state.fxQuoteResponse.conversionTerms.sourceAmount.currency} {this.state.fxQuoteResponse.conversionTerms.sourceAmount.amount}<br />Conversion fee: {this.state.fxQuoteResponse.conversionTerms.targetAmount.currency} {conversionFee}<br />Converted Amount: {this.state.fxQuoteResponse.conversionTerms.targetAmount.currency} {this.state.fxQuoteResponse.conversionTerms.targetAmount.amount}</>
                }</TraceWrap>,
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
                description: <TraceWrap trace={this.state.quoteResponse}>{
                    <>Payee FSP fee is {payeeFspCurrency} {payeeFspFee}<br />Payee receives {this.state.quoteResponse.transferAmount.currency + ' ' + this.state.quoteResponse.transferAmount.amount}</>
                }</TraceWrap>,
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
                description: <TraceWrap trace={this.state.transfersResponse}>Sent amount successfully</TraceWrap>,
                status: 'finish',
            });
        }
        if(this.state.transfersResponse && this.state.transfersResponse.transferState && this.state.transfersResponse.transferState !== 'COMMITTED') {
            steps.push({
                title: 'Transfer Failed',
                description: <TraceWrap trace={this.state.transfersResponse}>Failed to send amount</TraceWrap>,
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
                        <Text strong>Receiver ID</Text>
                        <Row>
                            <Col span={14}>
                                <Input
                                    placeholder='Receiver ID'
                                    disabled={this.state.currentState !== 'start'}
                                    value={this.state.receiverId}
                                    onChange={e => {
                                        this.setState({ receiverId: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col span={10}>
                                <Select
                                    className='ml-2'
                                    style={{ width: 120 }}
                                    placeholder='Receiver ID Type'
                                    disabled={this.state.currentState !== 'start'}
                                    value={this.state.selectedIdType}
                                    defaultActiveFirstOption
                                    onChange={idType => {
                                        this.setState({ selectedIdType: idType });
                                    }}
                                >
                                    <Option value='MSISDN'>MSISDN</Option>
                                    <Option value='ALIAS'>ALIAS</Option>
                                    <Option value='ACCOUNT_NO'>ACCOUNT_NO</Option>
                                    <Option value='EMAIL'>EMAIL</Option>
                                    <Option value='PERSONAL_ID'>PERSONAL_ID</Option>
                                    <Option value='BUSINESS'>BUSINESS</Option>
                                    <Option value='DEVICE'>DEVICE</Option>
                                    <Option value='ACCOUNT_ID'>ACCOUNT_ID</Option>
                                    <Option value='IBAN'>IBAN</Option>
                                </Select>
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
                                    style={{ width: 80 }}
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
                                <Select
                                    className='ml-2'
                                    style={{ width: 100 }}
                                    placeholder='Amount Type'
                                    disabled={this.state.currentState !== 'start'}
                                    value={this.state.selectedAmountType}
                                    defaultActiveFirstOption
                                    onChange={amountType => {
                                        this.setState({ selectedAmountType: amountType });
                                    }}
                                >
                                    <Option key={1} value='SEND'>SEND</Option>
                                    <Option key={2} value='RECEIVE'>RECEIVE</Option>
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
