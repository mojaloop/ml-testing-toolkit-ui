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
import 'antd/dist/antd.css';
import mobile_bg from '../../../assets/img/mobile_plain.png';

import PayeeApp from './PayeeApp.jsx';

class MobileAppWrapper extends React.Component {
    render() {
        return (
            <>
                <div
                    style={{
                        width: '45vh',
                        height: '90vh',
                        backgroundImage: `url(${mobile_bg})`,
                        backgroundSize: '45vh',
                        backgroundRepeat: 'no-repeat',
                        paddingTop: '10vh',
                        paddingLeft: '4vh',
                    }}
                >
                    <div style={{ width: '37vh', height: '72vh', overflow: 'scroll' }}>
                        <PayeeApp
                            notificationProperties={{
                                top: 100,
                                style: {
                                    marginLeft: 18,
                                    width: 350,
                                    borderRadius: 30,
                                    backgroundColor: '#d4e4ff',
                                },
                            }}
                            messageProperties={{
                                style: {
                                    textAlign: 'left',
                                    marginLeft: '15vh',
                                    marginTop: '10vh',
                                },
                            }}
                        />
                    </div>
                </div>
            </>
        );
    }
}

export default MobileAppWrapper;
