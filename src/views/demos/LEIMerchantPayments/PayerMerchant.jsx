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