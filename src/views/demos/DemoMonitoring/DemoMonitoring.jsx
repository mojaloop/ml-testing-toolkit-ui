/* eslint-disable @typescript-eslint/naming-convention */
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
import socketIOClient from 'socket.io-client';
import { getServerConfig, fetchServerConfig, getConfig } from '../../../utils/getConfig';
import { Typography, Layout } from 'antd';
// import 'antd/dist/antd.css';
// import axios from 'axios';
import Monitor from '../../monitor/Monitor';
import { TTKColors } from '../../../utils/styleHelpers';

const { Header, Content } = Layout;
const { Text } = Typography;

class DemoMonitoring extends React.Component {
    constructor() {
        super();
        this.fileManagerRef = React.createRef();
        this.state = {
            request: {},
            userConfig: null,
        };
    }

    socket = null;

    componentWillUnmount = () => {
        if(this.socket) {
            this.socket.disconnect();
        }
    };

    componentDidMount = async () => {
        await fetchServerConfig();

        const { userConfigRuntime } = await getServerConfig();
        this.setState({ userConfig: userConfigRuntime });
        const { apiBaseUrl } = getConfig();
        this.socket = socketIOClient(apiBaseUrl);
        // this.socket.on("outboundProgress", this.handleIncomingProgress);

    };

    render() {
        return (
            <>
                <Layout>
                    <Header
                        style={{
                            height: '7vh',
                            background: this.state.userConfig?.UI_THEME?.HEADER_COLOR || TTKColors.header,
                        }}
                        className='shadow'
                    >
                        <Text
                            level={3}
                            style={{
                                color: this.state.userConfig?.UI_THEME?.TITLE_COLOR || TTKColors.title,
                                fontSize: '2.5vh',
                            }}
                            strong
                        >
                            { this.state.userConfig?.INSTANCE_NAME || 'Mojaloop Testing Toolkit' }
                        </Text>
                    </Header>
                    <Content
                        className='p-2'
                    >
                        <Monitor />
                    </Content>
                </Layout>
            </>
        );
    }
}

export default DemoMonitoring;
