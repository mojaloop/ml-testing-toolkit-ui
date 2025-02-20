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

import { Row, Col, Button } from 'antd';
import mermaid from 'mermaid';

class SequenceDiagram extends React.Component {
    newState = {
        logs: [],
        lastLogTime: null,
        sequenceItems: [],
    };

    inboundPeerName = 'Inbound';

    outboundPeerName = 'Outbound';

    ttkPeerName = 'TTK';

    timeToRefresh = 1 * 60 * 1000;

    constructor() {
        super();
        this.state = JSON.parse(JSON.stringify(this.newState));
    }

    componentDidMount() {
        this.initDiagram();
    }

    appendLog = log => {
        // Check for the time of last log and clear the old data
        const datetime = new Date(this.state.lastLogTime).getTime();
        const now = new Date(log.logTime).getTime();
        if((now - datetime) > this.timeToRefresh) {
            this.state.sequenceItems = [];
        }

        this.state.lastLogTime = log.logTime;

        // this.state.logs.push(log)

        if(log.notificationType === 'newLog') {
            if(log.messageType === 'request') {
                this.state.sequenceItems.push({
                    logTime: log.logTime,
                    isError: (log.verbosity === 'error'),
                    type: 'inboundRequest',
                    method: log.resource.method,
                    path: log.resource.path,
                    title: log.resource.method + ' ' + log.resource.path,
                });
            } else if(log.messageType === 'response') {
                this.state.sequenceItems.push({
                    logTime: log.logTime,
                    isError: (log.verbosity === 'error'),
                    type: 'inboundResponse',
                    method: log.resource.method,
                    path: log.resource.path,
                    title: log.additionalData.response.status + ' ' + (log.additionalData.response.statusText ? log.additionalData.response.statusText : ''),
                });
            }
        } else if(log.notificationType === 'newOutboundLog') {
            if(log.message.startsWith('Sending request') || log.message.startsWith('Request:')) {
                this.state.sequenceItems.push({
                    logTime: log.logTime,
                    isError: (log.verbosity === 'error'),
                    type: 'outboundRequest',
                    method: log.resource.method,
                    path: log.resource.path,
                    title: log.resource.method + ' ' + log.resource.path,
                });
            }
            if(log.message.startsWith('Received response') || log.message.startsWith('Response:')) {
                this.state.sequenceItems.push({
                    logTime: log.logTime,
                    isError: (log.verbosity === 'error'),
                    type: 'outboundResponse',
                    method: log.resource.method,
                    path: log.resource.path,
                    title: log.additionalData && log.additionalData.response && (log.additionalData.response.status + ' ' + log.additionalData.response.statusText),
                });
            }
        }
        this.refreshSequenceDiagram();
    };

    refreshSequenceDiagram = async () => {
        this.state.sequenceItems.sort(function (a, b) {
            return new Date(a.logTime) - new Date(b.logTime);
        });
        let seqSteps = this.getDiagramHeaders();
        const rowCount = this.state.sequenceItems.length;
        for(let i = 0; i < rowCount; i++) {
            if(this.state.sequenceItems[i].type === 'outboundRequest') {
                seqSteps += `${this.ttkPeerName}->>${this.outboundPeerName}: [HTTP REQ] ` + this.state.sequenceItems[i].title + '\n';
            }
            if(this.state.sequenceItems[i].type === 'outboundResponse') {
                seqSteps += `${this.outboundPeerName}--` + (this.state.sequenceItems[i].isError ? 'x' : '>>') + `${this.ttkPeerName}: [HTTP RESP] ` + this.state.sequenceItems[i].title + '\n';
            }
            if(this.state.sequenceItems[i].type === 'inboundRequest') {
                seqSteps += `${this.inboundPeerName}->>${this.ttkPeerName}: [HTTP REQ] ${this.state.sequenceItems[i].title}\n`;
            }
            if(this.state.sequenceItems[i].type === 'inboundResponse') {
                seqSteps += `${this.ttkPeerName}--` + (this.state.sequenceItems[i].isError ? 'x' : '>>') + `${this.inboundPeerName}: [HTTP RESP] ` + this.state.sequenceItems[i].title + '\n';
            }
        }

        this.drawDiagram(seqSteps);
    };

    drawDiagram = seqSteps => {
        this.seqDiagContainer.removeAttribute('data-processed');
        const code = 'sequenceDiagram\n' + seqSteps;
        try {
            mermaid.parse(code);
            this.seqDiagContainer.innerHTML = code;
            mermaid.init(undefined, this.seqDiagContainer);
        } catch (e) {
            console.log('Diagram generation error', e.str || e.message);
        }
    };

    initDiagram = () => {
        this.drawDiagram(this.getDiagramHeaders());
    };

    getDiagramHeaders = () => {
        let seqSteps = '';
        seqSteps += `Note over ${this.inboundPeerName},${this.ttkPeerName}: Inbound Requests\n`;
        seqSteps += `Note over ${this.ttkPeerName},${this.outboundPeerName}: Outbound Requests\n`;
        return seqSteps;
    };

    handleClearLogs = () => {
        this.state.sequenceItems = [];
        this.refreshSequenceDiagram();
        this.initDiagram();
        this.forceUpdate();
    };

    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        {
                            this.state.sequenceItems.length > 0
                                ? (
                                    <Button
                                        className='float-right'
                                        type='primary'
                                        danger
                                        onClick={this.handleClearLogs}
                                    >
                  Clear
                                    </Button>
                                )
                                : null
                        }
                    </Col>
                </Row>
                <Row style={{ minHeight: '200px' }}>
                    <Col className='text-center' span={24}>
                        <div
                            ref={div => {
                                this.seqDiagContainer = div;
                            }}
                        />
                    </Col>
                </Row>
            </>
        );
    }
}

export default SequenceDiagram;
