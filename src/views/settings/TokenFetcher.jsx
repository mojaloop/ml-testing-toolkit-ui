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
import moment from 'moment';

import axios from 'axios';
import { message, Button, Row, Col, Card, Layout, Typography, Descriptions } from 'antd';
import { getConfig } from '../../utils/getConfig';

const { Text, Title } = Typography;
const { Content } = Layout;

class TokenFetcher extends React.Component {
    constructor() {
        super();
        this.state = {
            token: '',
            expiresInSec: 0,
            authConfig: {},
        };
    }

    componentDidMount = async () => {
        this.getAuthInfo();
    };

    getAuthInfo = async () => {
        try {
            const { apiBaseUrl } = getConfig();
            axios.defaults.withCredentials = true;
            const res = await axios.get(apiBaseUrl + '/api/keycloak/clientinfo');
            if(res.status === 200) {
                // this.setState({ token: res.data.access_token, expiresInSec: res.data.expires_in } )
                this.setState({ authConfig: res.data });
                return;
            } else {
                message.error({ content: 'Getting Token info failed: ' + res.statusText, key: 'login', duration: 3 });
            }
        } catch (err) {
            message.error({ content: 'Getting Token info failed: ' + err.message, key: 'login', duration: 3 });
        }
    };

    handleGenerateToken = async () => {
        try {
            const { apiBaseUrl } = getConfig();
            axios.defaults.withCredentials = true;
            const res = await axios.post(apiBaseUrl + '/api/keycloak/tokeninfo', {
                ...this.state.authConfig,
            }, { headers: { 'Content-Type': 'application/json' } });
            if(res.status === 200) {
                this.setState({ token: res.data.access_token, expiresInSec: res.data.expires_in });
                return;
            } else {
                message.error({ content: 'Generating token failed: ' + res.statusText, key: 'login', duration: 3 });
            }
        } catch (err) {
            message.error({ content: 'Generating token failed: ' + err.message, key: 'login', duration: 3 });
        }
    };

    onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    render() {
        const displayAuthInfo = info => {
            const descriptionItems = Object.entries(info).map(item => (
                <Descriptions.Item label={item[0]}>
                    {item[1]}
                </Descriptions.Item>
            ));
            return (
                <>
                    {
                        Object.entries(info).length > 0
                            ? (
                                <>
                                    <Title className='mt-2' level={4}>Use the following information in your DFSP service to get the token periodically</Title>
                                    <Row>
                                        <Col span={24}>
                                            <Descriptions layout='horizontal' column={1} size='small' bordered>
                                                {descriptionItems}
                                            </Descriptions>
                                        </Col>
                                    </Row>
                                </>
                            )
                            : <Title className='mt-2' style={{ color: 'red' }} level={4}>There is some issue getting token information</Title>
                    }
                </>
            );
        };

        return (
            <Layout style={{ backgroundColor: '#ffffff' }}>
                <Content>
                    <Row>
                        <Col span={24} className='mx-auto'>
                            <Card className='align-middle' style={{ width: '600px' }}>
                                {displayAuthInfo(this.state.authConfig)}
                                <Button className='mt-2' type='primary' onClick={this.handleGenerateToken}>
                  Generate a Static Token
                                </Button>
                                {
                                    this.state.token
                                        ? (
                                            <>
                                                <Title className='mt-2' level={4}>Copy the following token. It expires {moment().add(this.state.expiresInSec, 'seconds').fromNow()}</Title>
                                                <Text
                                                    className='mt-2'
                                                    copyable={
                                                        {
                                                            text: this.state.token,
                                                        }
                                                    }
                                                >
                                                    <pre style={{ overflow: 'scroll', 'white-space': 'pre-wrap' }}>
                                                        {this.state.token}
                                                    </pre>
                                                </Text>
                                            </>
                                        )
                                        : null
                                }
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        );
    }
}

export default TokenFetcher;
