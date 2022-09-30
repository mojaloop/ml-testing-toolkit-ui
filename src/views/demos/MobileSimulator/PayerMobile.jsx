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
import { Row, Col, InputNumber, Input, Typography, Skeleton, Card, Button, Result, List, Avatar } from 'antd';
import { GspTransformer } from '../../../utils/gspTransformer.ts';

const { Text } = Typography;

class PayerMobile extends React.Component {
    state = {
        gettingPartyInfo: false,
        stage: null,
        idNumber: '987654320',
        amount: 100,
        idType: 'MSISDN',
        reference: '',
        partyInfo: {},
        quotesRequest: {},
        quotesResponse: {},
        transfersResponse: {},
        accounts: [],
        selectedCurrency: null,
    };

    // TODO: Need to fetch the accounts from the server
    accountsData = [
        {
            title: 'Axis Bank (Default)',
            description: '96XXXXXX1234',
            iconUrl: 'https://png.pngitem.com/pimgs/s/23-238417_axis-bank-logo-png-transparent-png.png',
        },
        {
            title: 'HDFC Bank',
            description: '12XXXXXX9765',
            iconUrl: 'https://www.hdfcbank.com/content/api/contentstream/723fb80a-2dde-42a3-9793-7ae1be57c87f/SEO/hdfc.png',
        },
    ];

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
            case 'getPayeeProxyDisplayInfoComplete':
            {
                const partyInfo = event.data.test_cases[0].requests[0].response.body;
                this.setState({ gettingPartyInfo: false, stage: 'putParties', partyInfo: partyInfo });
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
            case 'getTransferFundsQuotationUpdateComplete':
            {
                const quotesResponse = event.data.test_cases[0].requests[0].response.body;
                this.setState({ stage: 'putQuotes', quotesResponse: quotesResponse });
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
            case 'transferFundsComplete':
            {
                const transfersResponse = event.data.test_cases[0].requests[0].response.body;
                this.setState({ stage: 'putTransfers', transfersResponse: transfersResponse });
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
                        {/* <Row>
                            <Col span={8}>
                                <Text>Name:</Text>
                            </Col>
                            <Col span={16}>
                                <Text strong>{this.state.partyInfo && this.state.partyInfo.displayInfoResult && this.state.partyInfo.displayInfoResult.success && this.state.partyInfo.displayInfoResult.success.displayInfo.displayName }</Text>
                            </Col>
                        </Row> */}
                        <Row>
                            <Col span={10}>
                                <Text>Phone:</Text>
                            </Col>
                            <Col span={14}>
                                <Text strong>{this.state.idNumber }</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={10}>
                                <Text>Reference:</Text>
                            </Col>
                            <Col span={14}>
                                <Text>{this.state.reference }</Text>
                            </Col>
                        </Row>
                        <Row className='mt-1'>
                            <Col span={10}><Text strong>Amount:</Text></Col>
                            <Col span={14}>
                                <Text strong>$ {this.state.amount}</Text>
                            </Col>
                        </Row>
                        <Row className='mt-1'>
                            <Col span={24}>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={this.accountsData}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.iconUrl} />}
                                                title={item.title}
                                                description={item.description}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Col>
                        </Row>
                        <Row className='mt-3'>
                            <Col span={24} className='text-center'>
                                <Button type='primary' shape='round' danger onClick={this.handleGetQuote}>Confirm</Button>
                            </Col>
                        </Row>
                    </Card>
                );
            case 'putQuotes':
                return (
                    <Card size='small'>
                        <Row>
                            <Col span={10}>
                                <Text>Phone:</Text>
                            </Col>
                            <Col span={14}>
                                <Text strong>{this.state.idNumber }</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={10}>
                                <Text>Reference:</Text>
                            </Col>
                            <Col span={14}>
                                <Text>{this.state.reference }</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={10}>
                                <Text>Name:</Text>
                            </Col>
                            <Col span={14}>
                                <Text strong>{this.state.quotesResponse && this.state.quotesResponse.result && this.state.quotesResponse.result.success && this.state.quotesResponse.result.success.payeeProxyLookup && this.state.quotesResponse.result.success.payeeProxyLookup.displayInfo.displayName }</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={10}>
                                <Text>Amount:</Text>
                            </Col>
                            <Col span={14}>
                                $ <Text strong>{this.state.amount }</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={10}>
                                <Text>Fee:</Text>
                            </Col>
                            <Col span={14}>
                            $ <Text strong>{this.state.quotesResponse && this.state.quotesResponse.result && this.state.quotesResponse.result.success && GspTransformer.toFspiopCurrency(this.state.quotesResponse.result.success.feeAmount?.amountMicros) }</Text>
                            </Col>
                        </Row>
                        <Row className='mt-4'>
                            <Col span={12} className='text-center'>
                                <Button type='primary' shape='round' danger onClick={this.handleCancel}>Cancel</Button>
                            </Col>
                            <Col span={12} className='text-center'>
                                <Button type='primary' shape='round' success onClick={this.handleTransfer}>Proceed</Button>
                            </Col>
                        </Row>

                    </Card>
                );
            case 'putTransfers':
                return (
                    <Row>
                        <Col span={24} className='text-center'>
                            {
                                this.state.transfersResponse && this.state.transfersResponse.result && this.state.transfersResponse.result.success
                                    ? (
                                        <Result
                                            status='success'
                                            title={'Sent $' + this.state.amount}
                                            // subTitle={'to ' + (this.state.partyInfo && this.state.partyInfo.displayInfoResult && this.state.partyInfo.displayInfoResult.success && this.state.partyInfo.displayInfoResult.success.displayInfo.displayName)}
                                            subTitle={'to ' + (this.state.quotesResponse && this.state.quotesResponse.result && this.state.quotesResponse.result.success && this.state.quotesResponse.result.success.payeeProxyLookup && this.state.quotesResponse.result.success.payeeProxyLookup.displayInfo.displayName)}
                                        />
                                    )
                                    : (
                                        <Result
                                            status='error'
                                            title='Error'
                                        />
                                    )
                            }
                        </Col>
                    </Row>
                );
            default:
                return (
                    <>
                        <Row className='ml-2'>
                            <Col span={24}>
                                <Row>
                                    <Col span={24}>
                                        <Text strong>Enter Phone Number</Text>
                                        <Input
                                            placeholder='Phone Number'
                                            value={this.state.idNumber}
                                            onChange={newIdNumber => {
                                                this.setState({ idNumber: newIdNumber });
                                            }}
                                        />
                                    </Col>
                                </Row>
                                <Row className='mt-2'>
                                    <Col span={24}>
                                        <Text className='mr-2' strong>Amount</Text>
                                        $ <InputNumber
                                            placeholder='Amount'
                                            value={this.state.amount}
                                            onChange={newNumber => {
                                                this.setState({ amount: newNumber });
                                            }}
                                            // formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            // parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={24}>
                                        <Text strong>Reference</Text>
                                        <Input
                                            placeholder='Reference'
                                            value={this.state.reference}
                                            onChange={e => {
                                                this.setState({ reference: e.target.value });
                                            }}
                                        />
                                    </Col>
                                </Row>
                                <Row className='mt-4'>
                                    <Col span={24} style={{ textAlign: 'center' }}>
                                        <Button
                                            type='primary'
                                            shape='round'
                                            success
                                            onClick={this.handleGetParty}
                                        >
                                            Proceed
                                        </Button>
                                    </Col>
                                </Row>
                                {/* <Row className='mt-4'>
                                    <Col span={24}>
                                        <Radio.Group>
                                            <Space direction="vertical">
                                                <Radio value={1}>
                                                    <Row>
                                                        <Col span={12}>
                                                            <Avatar src='asdf' />
                                                        </Col>
                                                        <Col span={12}>
                                                            <Text strong>asdf</Text>
                                                        </Col>
                                                    </Row>
                                                </Radio>
                                                <Radio value={2}>Option B</Radio>
                                                <Radio value={3}>Option C</Radio>
                                            </Space>
                                        </Radio.Group>
                                    </Col>
                                </Row> */}
                            </Col>
                        </Row>
                    </>
                );
                break;
        }
    };

    handleGetParty = async () => {
        // this.setState({ gettingPartyInfo: true, stage: 'getParties' });
        // await this.props.outboundService.getPayeeProxyDisplayInfo(this.state.idNumber);

        // No need to get the party information and display it before hand as per the demo.
        this.setState({ stage: 'putParties' });
    };

    handleGetQuote = async e => {
        this.setState({ stage: 'postQuotes' });
        await this.props.outboundService.getTransferFundsQuotation(this.state.idNumber, this.state.amount, 'USD');
    };

    handleTransfer = async e => {
        this.setState({ stage: 'postTransfers' });
        await this.props.outboundService.transferFunds(this.state.idNumber, this.state.amount, 'USD');
    };

    handleCancel = e => {
        this.setState({ stage: null });
        // this.props.resetEverything()
    };

    render() {
        return (
            <>
                <Row className='mt-1 ml-2'>
                    <Col span={24}>
                        {this.getStageData()}
                    </Col>
                </Row>
            </>

        );
    }
}

export default PayerMobile;
