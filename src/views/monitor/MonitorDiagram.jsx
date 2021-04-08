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
import socketIOClient from "socket.io-client";
import { getConfig } from '../../utils/getConfig'

import { Row, Col, Card, Button } from 'antd';
import mermaid from 'mermaid'

class IncomingMonitor extends React.Component {

  newState =  {
    logs: [],
    lastLogTime: null,
    sequenceItems: [],
    timeline: {
      outbound: {
        socket: null,
        socketTopic: "newOutboundLog"
      },
      inbound: {
        socket: null,
        socketTopic: "newLog"
      }
    }
  }

  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(this.newState))
  }
  
  componentWillUnmount = () => {
    if (this.state.timeline.inbound.socket) {
      this.state.timeline.inbound.socket.disconnect()
  }
    if (this.state.timeline.outbound.socket) {
      this.state.timeline.outbound.socket.disconnect()
    }
  }

  componentDidMount = async () => {

    this.resetWelcomeMessage()

    const { apiBaseUrl } = getConfig()

    for (const logType of Object.keys(this.state.timeline)) {
      const item = this.state.timeline[logType]
      item.socket = socketIOClient(apiBaseUrl);
      if (getConfig().isAuthEnabled) {
        const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID')
        if (dfspId) {
              item.socketTopic = `${item.socketTopic}/${dfspId}`
        }
      }

      item.socket.on(item.socketTopic, log => {
        this.appendLog(log)
        this.forceUpdate()
      });
    }
    this.forceUpdate()
  }

  appendLog = (log) => {

    // Check for the time of last log and clear the old data
    var datetime = new Date( this.state.lastLogTime ).getTime();
    var now = new Date( log.logTime ).getTime();
    if ( (now - datetime) > 5000 ) {
      this.state.sequenceItems = []
    }

    this.state.lastLogTime = log.logTime 

    // this.state.logs.push(log)

    if (log.notificationType === "newLog") {
      if(log.messageType === 'request') {
        this.state.sequenceItems.push({
          logTime: log.logTime,
          isError: (log.verbosity === 'error'),
          type: 'inboundRequest',
          method: log.resource.method,
          path: log.resource.path,
          title: log.resource.method + ' ' + log.resource.path
        })
      } else if(log.messageType === 'response') {
        this.state.sequenceItems.push({
          logTime: log.logTime,
          isError: (log.verbosity === 'error'),
          type: 'inboundResponse',
          method: log.resource.method,
          path: log.resource.path,
          title: log.additionalData.response.status + ' ' + (log.additionalData.response.statusText ? log.additionalData.response.statusText : '')
        })
      }
    } else if (log.notificationType === "newOutboundLog") {
      if (log.message.startsWith("Sending request") || log.message.startsWith("Request:")) {
        this.state.sequenceItems.push({
          logTime: log.logTime,
          isError: (log.verbosity === 'error'),
          type: 'outboundRequest',
          method: log.resource.method,
          path: log.resource.path,
          title: log.resource.method + ' ' + log.resource.path
        })
      }
      if (log.message.startsWith("Received response") || log.message.startsWith("Response:")) {
        this.state.sequenceItems.push({
          logTime: log.logTime,
          isError: (log.verbosity === 'error'),
          type: 'outboundResponse',
          method: log.resource.method,
          path: log.resource.path,
          title: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        })
      }
    }
    this.refreshSequenceDiagram()
  }

  refreshSequenceDiagram = async () => {
    this.state.sequenceItems.sort(function(a,b){
      return new Date(a.logTime) - new Date(b.logTime);
    });
    this.seqDiagContainer.removeAttribute('data-processed')
    let seqSteps = ''
    const rowCount = this.state.sequenceItems.length
    for (let i=0; i<rowCount; i++) {
      let transactionBegan = false
      if ( this.state.sequenceItems[i].type === 'outboundRequest' ) {
        // seqSteps += 'Note over TTK,PEER: ' + testCase.requests[i].status.requestSent.description + '\n'
        seqSteps += 'TTK->>PEER: [HTTP REQ] ' + this.state.sequenceItems[i].title + '\n'
        // transactionBegan  = true
        // seqSteps += 'activate PEER\n'
      }
      if ( this.state.sequenceItems[i].type === 'outboundResponse' ) {
        seqSteps += 'PEER--' + (this.state.sequenceItems[i].isError ? 'x' : '>>') + 'TTK: [HTTP RESP] ' + this.state.sequenceItems[i].title + '\n'
      }
      // if ( testCase.requests[i].status && testCase.requests[i].status.response ) {
      //   const stepStr = testCase.requests[i].status.response.status + ' ' + testCase.requests[i].status.response.statusText + ' ' +testCase.requests[i].status.state
      //   if (testCase.requests[i].status.state === 'error') {
      //     seqSteps += 'PEER--xTTK: [HTTP RESP] ' + stepStr + '\n'
      //   } else {
      //     seqSteps += 'PEER-->>TTK: [HTTP RESP] ' + stepStr + '\n'
      //   }
      // }
      // if ( testCase.requests[i].status && testCase.requests[i].status.callback ) {
      //   const stepStr = testCase.requests[i].status.callback.url
      //   seqSteps += 'PEER-->>TTK: [ASYNC CALLBACK] ' + stepStr + '\n'
      // }
      if ( this.state.sequenceItems[i].type === 'inboundRequest' ) {
        seqSteps += 'PEER->>TTK: [HTTP REQ] ' + this.state.sequenceItems[i].title + '\n'
      }
      if ( this.state.sequenceItems[i].type === 'inboundResponse' ) {
        seqSteps += 'TTK--' + (this.state.sequenceItems[i].isError ? 'x' : '>>') + 'PEER: [HTTP RESP] ' + this.state.sequenceItems[i].title + '\n'
      }

      // if (transactionBegan) {
      //   seqSteps += 'deactivate PEER\n'
      // }
    }

    const code = 'sequenceDiagram\n' + seqSteps
    try {
      mermaid.parse(code)
      this.seqDiagContainer.innerHTML = code
      mermaid.init(undefined, this.seqDiagContainer)
    } catch (e) {
      console.log('Diagram generation error', e.str || e.message)
    }

  }

  handleClearLogs = () => {
    this.state.sequenceItems = []
    this.refreshSequenceDiagram()
    this.resetWelcomeMessage()
    this.forceUpdate()
  }

  resetWelcomeMessage = () => {
    this.seqDiagContainer.innerHTML = '<h4><br /><br /><br />Welcome to Testing Toolkit</h4>'
  }

  render () {
    return (
      <>
        <Row>
          <Col span={24}>
          {
            this.state.sequenceItems.length > 0
            ? (
              <Button
                className="float-right"
                type="primary"
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
        <Row style={{'min-height': '200px'}}>
          <Col className='text-center' span={24}>
            <div
            ref={div => {
              this.seqDiagContainer = div
            }}
            ></div>
          </Col>
        </Row>
      </>
    )
  }
}

export default IncomingMonitor;
