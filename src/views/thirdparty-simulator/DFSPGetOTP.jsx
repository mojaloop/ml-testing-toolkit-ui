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
import ReactDOM from "react-dom";
import axios from 'axios';
import { Spin } from 'antd';
import { getThirdpartySimConfig } from '../../utils/getConfig'
import "./dfsp-sim.css";

class GetOTP extends React.Component {

  constructor () {
    super()
    this.state = {
      consentRequestId: ''
    }
  }

  attempt = 0;
  handleChange = async (value) => {
    this.setState({ consentRequestId: value });
  }

  validateForm = () => {
    return this.state.consentRequestId.length > 0;
  }

  displayLoading = async () => {
    ReactDOM.render(<Spin className="auth__form__otp_msg" />, document.getElementById('displayOTP'));
  }

  getOTPFromDFSP = async () => {
    try {
      const { thirdpartySimAPIBaseUrl } = getThirdpartySimConfig();
      const otpURL = thirdpartySimAPIBaseUrl + '/OTPorSecret/' + this.state.consentRequestId;
      return await axios.get(otpURL, { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      return;
    }
  }

  getOTP = async () => {
    if (this.attempt < 5) {
      this.attempt++;
      const res = await this.getOTPFromDFSP();
      if (res?.status == 200) {
        this.attempt = 0;
        const otpVal = (res.data.value == "undefined") ? 'Not generated' : res.data.value
        return ReactDOM.render(<label className="auth__form__otp_msg">OTP : {otpVal} </label>, document.getElementById('displayOTP'));
      } else {
        return setTimeout(() => this.getOTP(), 6000);
      }
    } else {
      this.attempt = 0;
      return ReactDOM.render(<label className="auth__form__otp_err">OTP generation failed, Please retry after some time.</label>, document.getElementById('displayOTP'));
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.validateForm();
    await this.displayLoading();
    await this.getOTP();
  }

  render () {
    return (
      <div className="login__wrapper" >
        <form className="auth__form" onSubmit={async e => { await this.handleSubmit(e) }}>
          <h4>Get OTP</h4>
          <label className="auth__form__username">
            Consent Request Id : &nbsp;&nbsp;
            <input type="text" name="consentRequestId" value={this.state.consentRequestId} onChange={e => this.setState({ consentRequestId: e.target.value })} />
          </label>
          <button className="auth__form__submit__btn" type="submit" disabled={!this.validateForm()}>Submit</button>
        </form>
        <div id="displayOTP"></div>
      </div>
    );
  }
}

export default GetOTP
