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
import { Layout, Button, Typography } from 'antd'
import { getConfig } from '../../utils/getConfig'

const { Header } = Layout;
const { Title } = Typography;

class AdminNavbar extends React.Component {
  render() {
    const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID')
    const { isAuthEnabled } = getConfig()
    return (
      <>
        <Header
          style={{
            height: '10vh',
            background: '#293e5d'
          }}
        >
            <Title
              level={4}
              className="text-white text-uppercase d-none d-lg-inline-block"
            >
              {this.props.brandText}
            </Title>
            {
              dfspId
              ?
              <span>{dfspId}</span>
              :
              null
            }

            {
              isAuthEnabled
              ?
              <Button
                color="danger"
                href="#pablo"
                onClick={e => {
                  e.preventDefault()
                  this.props.handleLogout()
                }}
                size="sm"
              >
                Logout
              </Button>
              : null
            }            
        </Header>
      </>
    );
  }
}

export default AdminNavbar;
