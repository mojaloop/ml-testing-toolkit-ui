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
import socketIOClient from 'socket.io-client';
import { getConfig } from '../../utils/getConfig';
import axios from 'axios';

import { Tabs } from 'antd';

import ActivityLog from './ActivityLog';
import SequenceDiagram from './SequenceDiagram';

const { TabPane } = Tabs;

class Monitor extends React.Component {
    newState = {
        timeline: {
            outbound: {
                socket: null,
                socketTopic: 'newOutboundLog',
            },
            inbound: {
                socket: null,
                socketTopic: 'newLog',
            },
        },
    };

    constructor() {
        super();
        this.activityLogRef = React.createRef();
        this.sequenceDiagramRef = React.createRef();
        this.state = JSON.parse(JSON.stringify(this.newState));
    }

    componentWillUnmount = () => {
        if(this.state.timeline.inbound.socket) {
            this.state.timeline.inbound.socket.disconnect();
        }
        if(this.state.timeline.outbound.socket) {
            this.state.timeline.outbound.socket.disconnect();
        }
    };

    componentDidMount = async () => {
        const { apiBaseUrl } = getConfig();
        if(getConfig().isAuthEnabled) {
            const storedLogs = await axios.get(`${apiBaseUrl}/api/history/logs`);
            storedLogs.data.forEach(log => {
                if(this.activityLogRef.current)
                    this.activityLogRef.current.appendLog(log);
                if(this.sequenceDiagramRef.current)
                    this.sequenceDiagramRef.current.appendLog(log);
            });
        }
        for(const logType of Object.keys(this.state.timeline)) {
            const item = this.state.timeline[logType];
            item.socket = socketIOClient(apiBaseUrl);
            if(getConfig().isAuthEnabled) {
                const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID');
                if(dfspId) {
                    item.socketTopic = `${item.socketTopic}/${dfspId}`;
                }
            }

            item.socket.on(item.socketTopic, log => {
                if(this.activityLogRef.current)
                    this.activityLogRef.current.appendLog(log);
                if(this.sequenceDiagramRef.current)
                    this.sequenceDiagramRef.current.appendLog(log);
                this.forceUpdate();
            });
        }
        this.forceUpdate();
    };

    render() {
        return (
            <Tabs type='card' defaultActiveKey='1'>
                <TabPane tab='Activity Log' key='1' forceRender>
                    <ActivityLog ref={this.activityLogRef} />
                </TabPane>
                <TabPane tab='Sequence Diagram' key='2' forceRender>
                    <SequenceDiagram ref={this.sequenceDiagramRef} />
                </TabPane>
            </Tabs>

        );
    }
}

export default Monitor;
