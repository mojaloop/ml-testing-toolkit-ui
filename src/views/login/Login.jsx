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

import { withRouter, Redirect } from "react-router-dom";
import { message, Button, Form, Input } from 'antd';
import getConfig from '../../utils/getConfig'

import "./Auth.css";

const axios = require('axios').default

class Login extends React.Component {
  
  constructor() {
    super()
    this.state = {
      username: '',
      password: ''
    }
  }

  validateForm = () => {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { apiBaseUrl } = getConfig()
      axios.defaults.withCredentials = true
      const res = await axios.post(apiBaseUrl + '/api/oauth2/login/', {
        username: this.state.username,
        password: this.state.password
      }, { headers: { 'Content-Type': 'application/json' } })
      if (res.status === 200) {
        this.props.handleLogin(e, res.data.token.payload)
        message.success({ content: 'login successful', key: 'login', duration: 1 });
        this.props.history.push("/admin/index")
        return
      }
    } catch (err) {}
    message.error({ content: 'login failed', key: 'login', duration: 3 });
  }

  render() {
    return (
      <div className="auth">
        <Form className="auth__form"
          onFinish={async e => {await this.handleSubmit(e)}}
        >
          <Form.Item className="auth__form__username" label="Username" name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              autoFocus
              value={this.state.username}
              onChange={e => this.setState({username: e.target.value})}
            />
          </Form.Item>
          <Form.Item className="auth__form__password" label="Password" name="password"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              autoFocus
              type="password"
              value={this.state.password}
              onChange={e => this.setState({password: e.target.value})}
            />
          </Form.Item>
          <Form.Item>
            <Button className="auth__form__submit__btn" block bsSize="large" disabled={!this.validateForm()} type='submit'>Submit</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}

export default withRouter(Login)
