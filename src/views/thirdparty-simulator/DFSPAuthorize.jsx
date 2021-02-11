/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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
 - Name Surname <name.surname@gatesfoundation.com>

 - Sridhar Voruganti <sridhar.voruganti@modusbox.com>
 --------------
 ******/
import React from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';
import { message } from 'antd';
import { getThirdpartySimConfig } from '../../utils/getConfig'
import "./dfsp-sim.css";

class DFSPAuthorize extends React.Component {

  constructor () {
    super()
    this.state = {
      userName: '',
      password: '',
      consentRequestId: '',
      callbackUri: ''
    }
  }

  validateForm = () => {
    return this.state.userName.length > 0 && this.state.password.length > 0;
  }

  loginUser = async () => {
    try {
      const consentRequestId = (queryString.parse(this.props.location.search)).consentRequestId;
      const callbackUri = (queryString.parse(this.props.location.search)).callbackUri;
      this.setState({ consentRequestId: consentRequestId, callbackUri: callbackUri });
      const forwrdUri = "/admin/dfsp/grant-user-consent" + (this.props.location.search || '');
      const { thirdpartySimAPIBaseUrl } = getThirdpartySimConfig();
      const loginURL = thirdpartySimAPIBaseUrl + '/login';
      const res = await axios.post(loginURL, {
        userName: this.state.userName,
        password: this.state.password
      }, { headers: { 'Content-Type': 'application/json' } });
      if (res.status == 200) {
        message.success({ content: 'login successful', key: 'login', duration: 3 });
        this.props.history.push(forwrdUri);
      } else {
        window.location.href = (this.state.callbackUri) + '?status=rejected&consentRequestId=' + this.state.consentRequestId;
      }
      return
    } catch (error) {
      window.location.href = (this.state.callbackUri) + '?status=rejected&consentRequestId=' + this.state.consentRequestId;
      return
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    this.validateForm()
    await this.loginUser()
  }

  render () {
    return (
      <div className="login__wrapper" >
        <form className="auth__form" onSubmit={async e => { await this.handleSubmit(e) }}>
          <h5>Please Login</h5>
          <label className="auth__form__username">
            User Name : &nbsp;&nbsp;
            <input type="text" name="userName" value={this.state.userName} onChange={e => this.setState({ userName: e.target.value })} />
          </label>
          <label className="auth__form__password">
            Password : &nbsp;&nbsp;&nbsp;&nbsp;
            <input type="password" name="password" value={this.state.password} onChange={e => this.setState({ password: e.target.value })} />
          </label>
          <div>
            <button className="auth__form__submit__btn" type="submit" disabled={!this.validateForm()}>Login</button>
          </div>
        </form>
      </div>
    )
  }
}

export default withRouter(DFSPAuthorize)