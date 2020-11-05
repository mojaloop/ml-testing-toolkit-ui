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
import React, { useState } from 'react';
import ReactDOM from "react-dom";
import reportWebVitals from './reportWebVitals';

import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";

import AdminLayout from "./layouts/Admin.jsx";
import getConfig from './utils/getConfig'

import './index.css';
import 'antd/dist/antd.css';

import Login from './views/login/Login.jsx';



const axios = require('axios').default

function App() {

  const { isAuthEnabled } = getConfig()

  const isLoggedIn = () => {
    if (!isAuthEnabled) {
      return true
    }
    if (!axios.defaults.withCredentials) {
      axios.defaults.withCredentials = true
    }
    const expAt = localStorage.getItem('JWT_COOKIE_EXP_AT')
    if (expAt) {
      const currentTime = Date.now() / 1000
      if (currentTime + 60 < +expAt) {
        setTimeout(() => handleLogout(), (expAt - 60 - currentTime) * 1000);
        return true
      } else {
        localStorage.clear()
      }
    } 
    return false
  }

  const [user, setUser] = useState(isLoggedIn());

  const handleLogin = (e, token) => {
    e.preventDefault()
    localStorage.setItem('JWT_COOKIE_EXP_AT', token.iat + token.maxAge)
    localStorage.setItem('JWT_COOKIE_DFSP_ID', token.dfspId)
    setUser(true)
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(false)
  }

  return (
    <Router>
        {
          isAuthEnabled
          ?
            user
            ?
            <Switch>
              <Route exact path='/login' render={props => <Login {...props} handleLogin={handleLogin} user={user} />} />
              <Route path="/admin" render={props => <AdminLayout {...props} handleLogout={handleLogout} />} />
              <Redirect from='/' to='/admin/index' />
            </Switch>
            :
            <Switch>
              <Route exact path='/login' render={props => <Login {...props} handleLogin={handleLogin} user={user} />} />
              <Redirect to='/login' />
            </Switch>
          :          
          <Switch>
            <Route path="/admin" render={props => <AdminLayout {...props} handleLogout={handleLogout} />} />
            <Redirect from='/' to='/admin/index' />
          </Switch>
        }
    </Router>
  )
}

ReactDOM.render(
  <App/>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();