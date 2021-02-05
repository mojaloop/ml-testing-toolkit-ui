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
import { Select, Radio, message } from 'antd';
import { getThirdpartySimConfig } from '../../utils/getConfig'
import "./dfsp-sim.css";

const { Option } = Select

class GrantConsent extends React.Component {

  constructor () {
    super()
    this.state = {
      selectOptions: [],
      value: [],
      consentStatus: '',
      consentRequestId: '',
      callbackUri: ''
    }
  }

  componentDidMount = async () => {
    await this.getOptions();
  }
  getOptions = async () => {
    const consentRequestId = (queryString.parse(this.props.location.search)).consentRequestId;
    const callbackUri = (queryString.parse(this.props.location.search)).callbackUri;
    this.setState({ consentRequestId: consentRequestId, callbackUri: callbackUri });
    const { thirdpartySimAPIBaseUrl } = await getThirdpartySimConfig();
    const consentURL = thirdpartySimAPIBaseUrl + '/store/consentRequests/' + consentRequestId;
    const res = await axios.get(consentURL, { headers: { 'Content-Type': 'application/json' } })
    const dataStr = (res.data.value).replace(/\'/gi, '\"')
    const options = (JSON.parse(dataStr)).scopes.map(d => ({
      "value": d.accountId,
      "text": d.accountId
    }))
    this.setState({ selectOptions: options })
  }

  handleChange = async (value) => {
    this.setState({ value: value })
  }

  validateForm = () => {
    return this.state.value.length > 0 && this.state.consentStatus.length > 0;
  }

  grantConsent = async () => {
    try {
      let forwardUri;
      if (this.state.consentStatus == 'true') {
        const { thirdpartySimAPIBaseUrl } = await getThirdpartySimConfig();
        const authorizeUri = thirdpartySimAPIBaseUrl + '/authorize';
        const res = await axios.post(authorizeUri, {
          userId: this.state.value,
          consentRequestId: this.state.consentRequestId
        }, { headers: { 'Content-Type': 'application/json' } });
        if (res.status == 200) {
          message.success({ content: 'authorization successful', key: 'authorization', duration: 3 });
          forwardUri = (this.state.callbackUri) + '?status=approved&consentRequestId=' + this.state.consentRequestId + '&secret=' + res.data.secret;
        }
        else {
          forwardUri = (this.state.callbackUri) + '?status=rejected&consentRequestId=' + this.state.consentRequestId;
        }
      } else {
        forwardUri = (this.state.callbackUri) + '?status=rejected&consentRequestId=' + this.state.consentRequestId;
      }
      window.location.href = forwardUri;
      return
    } catch (error) {
      window.location.href = (this.state.callbackUri) + '?status=rejected&consentRequestId=' + this.state.consentRequestId;
      return
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    this.validateForm()
    await this.grantConsent()
  }

  render () {
    const options = this.state.selectOptions.map(d => <Option key={d.value}>{d.text}</Option>);
    return (
      <div className="login__wrapper" >
        <form className="auth__form" onSubmit={async e => { await this.handleSubmit(e) }}>
          <h4>Grant consent</h4>
          <label className="auth__form__username">
            Accounts : &nbsp;&nbsp;
          <Select
              mode="multiple"
              allowClear
              style={{ width: 200 }}
              value={this.state.value}
              placeholder="Select Accounts to link"
              onChange={this.handleChange}>
              {options}
            </Select>
          </label>
          <label className="auth__form__username">
            Consent : &nbsp;&nbsp;
        <Radio.Group
              value={this.state.consentStatus}
              onChange={e => this.setState({ consentStatus: e.target.value })}>
              <Radio value={'true'}>Approve</Radio>
              <Radio value={'false'}>Reject</Radio>
            </Radio.Group>
          </label>
          <button className="auth__form__submit__btn" type="submit" disabled={!this.validateForm()}>Submit</button>
        </form>
      </div>
    );
  }
}

export default GrantConsent
