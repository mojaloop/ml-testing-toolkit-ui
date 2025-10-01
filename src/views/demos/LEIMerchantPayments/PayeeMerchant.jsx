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
import { Row, Col, Typography, Card, Result } from 'antd';
const { Text } = Typography;

class PayeeMerchant extends React.Component {
    state = {
        stage: null,
        quotesRequest: {},
        quotesResponse: {},
        transfersRequest: {},
        transfersResponse: {},
        payeeLEI: '529900VJSEB3P1FV4R31',
    };

    componentDidMount = async () => {
    };

    handleNotificationEvents = event => {
        switch (event.type) {
            case 'payeeMerchantGetParties':
            {
                break;
            }
            case 'payeeMerchantGetPartiesResponse':
            {
                break;
            }
            case 'payeeMerchantPutParties':
            {
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
                this.setState({ stage: 'postTransfers', transfersRequest: event.data.requestBody });
                break;
            }
            case 'payeeMerchantPostTransfersResponse':
            {
                break;
            }
            case 'payeeMerchantPutTransfers':
            {
                this.setState({ stage: 'putTransfers', transfersResponse: event.data.requestBody });
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
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={24} className='text-center'>
                                <Result
                                    status='success'
                                    title='Payment Received!'
                                    subTitle={`Amount: ${this.state.transfersRequest && this.state.transfersRequest.amount ? this.state.transfersRequest.amount.amount : ''} ${this.state.transfersRequest && this.state.transfersRequest.amount ? this.state.transfersRequest.amount.currency : ''}`}
                                />
                            </Col>
                        </Row>
                    </Card>
                );
        }
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