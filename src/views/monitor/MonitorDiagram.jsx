/*!

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import socketIOClient from "socket.io-client";
import { Grid, GridColumn as Column, GridDetailRow } from '@progress/kendo-react-grid';
import getConfig from '../../utils/getConfig'
import '@progress/kendo-theme-default/dist/all.css'

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Button
} from "reactstrap";
// core components
import Header from "../../components/Headers/Header.jsx";

import { Row, Col } from 'antd';
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
    this.forceUpdate()
  }

  render () {
    return (
      <>
      <Row className="mb-4">
      <div className="col">
        <Card className="shadow">
          <CardHeader className="border-0">
            <Row>
              <Col>
              {
                this.state.sequenceItems.length > 0
                ? (
                  <Button
                    className="float-right"
                    color="danger"
                    size="sm"
                    onClick={this.handleClearLogs}
                  >
                    Clear
                  </Button>
                )
                : null
              }
              </Col>
            </Row>
          </CardHeader>
          <CardBody>
            <>
            <Row style={{'min-height': '200px'}}>
              <Col className='text-center'>
                <div
                ref={div => {
                  this.seqDiagContainer = div
                }}
                ><span className='h2'><br /><br /> Welcome to Testing Toolkit</span> </div>
              </Col>
            </Row>
            </>
          </CardBody>
        </Card>
        </div>
      </Row>
      </>
    )
  }
}

class Tables extends React.Component {
  constructor() {
    super();
    this.state = {
    };
  }


  render() {
  
    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <IncomingMonitor />
          {/* <Logs /> */}
        </Container>
      </>
    );
  }
}

export default Tables;
