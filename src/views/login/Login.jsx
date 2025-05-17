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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message, Button, Form, Input, Row, Col, Card, Layout } from 'antd';
import { getConfig } from '../../utils/getConfig';

import PlainNavbar from '../../components/Navbars/PlainNavbar';

const { Content } = Layout;

const Login = props => {
    const navigate = useNavigate();

    const onFinish = async formValues => {
        console.log(formValues);
        try {
            const { apiBaseUrl } = getConfig();
            axios.defaults.withCredentials = true;
            const res = await axios.post(apiBaseUrl + '/api/oauth2/login/', {
                username: formValues.username,
                password: formValues.password,
            }, { headers: { 'Content-Type': 'application/json' } });
            if(res.status === 200) {
                props.handleLogin(res.data.token.payload);
                message.success({ content: 'login successful', key: 'login', duration: 1 });
                navigate('/admin/index');
                return;
            }
        } catch (err) {}
        message.error({ content: 'login failed', key: 'login', duration: 3 });
    };

    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Layout style={{ backgroundColor: '#ffffff' }}>
            <PlainNavbar />
            <Content>
                <Row style={{ marginTop: '250px' }}>
                    <Col colspan={24} className='mx-auto'>
                        <Card className='shadow ml-4 mr-4 mt-n5 align-middle p-4' style={{ width: '500px' }}>
                            <Form
                                name='basic'
                                labelCol={{
                                    span: 8,
                                }}
                                wrapperCol={{
                                    span: 16,
                                }}
                                initialValues={{
                                    // remember: true,
                                }}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                            >
                                <Form.Item
                                    label='Username'
                                    name='username'
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please input your username!',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label='Password'
                                    name='password'
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please input your password!',
                                        },
                                    ]}
                                >
                                    <Input.Password />
                                </Form.Item>

                                <Form.Item
                                    wrapperCol={{
                                        offset: 8,
                                        span: 16,
                                    }}
                                >
                                    <Button type='primary' htmlType='submit'>
                      Submit
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default Login;
