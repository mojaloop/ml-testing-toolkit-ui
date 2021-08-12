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
import React from "react";
import moment from 'moment';

import { message, Button, Form, Input, Row, Col, Card, Layout, Typography } from 'antd';
import { getConfig } from '../../utils/getConfig'

const { Text, Title } = Typography
const { Content } = Layout
const axios = require('axios').default

class TokenFetcher extends React.Component {

  constructor() {
    super();
    this.state = {
      token: '',
      expiresInSec: 0,
    };
  }

  onFinish = async (formValues) => {
    console.log(formValues)
    try {
      const { apiBaseUrl } = getConfig()
      axios.defaults.withCredentials = true
      const res = await axios.post(apiBaseUrl + '/api/oauth2/tokeninfo', {
        username: 'dfsp1',
        password: formValues.password
      }, { headers: { 'Content-Type': 'application/json' } })
      if (res.status === 200) {
        this.setState({ token: res.data.access_token, expiresInSec: res.data.expires_in } )
        return
      }
    } catch (err) {}
    message.error({ content: 'Authentication failed', key: 'login', duration: 3 });
  }

  onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  render() {
    return (
      <Layout style={{backgroundColor: '#ffffff'}}>
        <Content>
          <Row>
            <Col colspan={24} className='mx-auto'>
              <Card className='align-middle p-4' style={{width: '600px'}}>
              <Form
                name="basic"
                labelCol={{
                  span: 4,
                }}
                wrapperCol={{
                  span: 20,
                }}
                initialValues={{
                  // remember: true,
                }}
                onFinish={this.onFinish}
                onFinishFailed={this.onFinishFailed}
              >
                <Form.Item
                  label="Password"
                  name="password"
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
                    offset: 4,
                    span: 20,
                  }}
                >
                  <Button type="primary" htmlType="submit">
                    Get Token
                  </Button>
                </Form.Item>
              </Form>
              {
                this.state.token
                ? (
                  <>
                  <Title level={4}>Copy the following token. It expires { moment().add(this.state.expiresInSec, 'seconds').fromNow() }</Title>
                  <Text
                    copyable = {
                      {
                        text: this.state.token
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
    )
  }
}

export default TokenFetcher;