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
import { ClockCircleOutlined } from '@ant-design/icons';

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Button
} from "reactstrap";
// core components
import Header from "../../components/Headers/Header.jsx";

import { Icon, Tag, Timeline, Card as CardAnt } from 'antd';

import axios from 'axios';

class DetailComponent extends GridDetailRow {
  render() {
      const log = this.props.dataItem;
      return (
        <>
        {log.additionalData
          ? (
              <div>
                <br />
                <div style={{ backgroundColor: '#1f4662', width: '100%', color: '#fff', fontSize: '12px' }}>
                  <div style={{ backgroundColor: '#193549', width: '100%', fontFamily: 'monospace', color: '#ffc600' }} >
                  </div>
                  <pre style={{ display: 'block', width: '100%', margin: '0', overflow: 'scroll', color: '#ffffff' }}>
                    {JSON.stringify(log.additionalData,null,2)}
                  </pre>
                </div>
              </div>
            )
          : log.message
        }
        </>
      );
  }
}

class IncomingTimelineItem extends React.Component {

  constructor() {
    super();
    this.state = {
      logsVisible: false
    }
  }
  expandChange = (event) => {
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
  }

  toggleLogsVisibility = () => {
      this.setState({logsVisible: !this.state.logsVisible})
  }

  render () {
    const log = this.props.logs[0]
    const info = this.props.info
    return (
      <>
        <b>{log.logTime}</b>
        <br /><Tag color={info.erroneous ? "#f50" : "#2db7f5"} onClick={this.toggleLogsVisibility}>{info.name}</Tag>
        <br />
        {
          this.state.logsVisible
          ? (
            <Grid
              className="align-items-center table-flush"
              data={this.props.logs}
              detail={DetailComponent}
              expandField="expanded"
              onExpandChange={this.expandChange}
            >
              <Column field="logTime" title="Time" />
              <Column field="message" title="Message" />
              <Column field="verbosity" title="Verbosity" />
            </Grid>
          )
          : null
        }
      </>
    )
  }
}
class IncomingTimelineSet extends React.Component {

  constructor() {
    super();
    this.state = {
      logsVisible: false
    }
  }
  expandChange = (event) => {
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
  }

  toggleLogsVisibility = () => {
      this.setState({logsVisible: !this.state.logsVisible})
  }

  getTimelineItems = () => {
    return this.props.logSetObj.secondaryItemsArr.map(item => {
      if (item) {
        return (
          <IncomingTimelineItem key={item.id} info={item} logs={this.props.logSetObj.secondaryItemsObj[item.id]} />
        )
      } else {
        return (
          <Timeline.Item dot={<Icon type="clock-circle-o" style={{ fontSize: '16px' }} />} color="red"><br /><br /></Timeline.Item>
        )
      }

    })
  }

  render () {
    const logSetObj = this.props.logSetObj
    // const log = { logTime: 'TEMP TIME' }
    // const info = { name: 'TEMP NAME', erroneous: false }
    if (this.props.logSetObj.secondaryItemsArr.length > 1) {
      return (
        <>
          <b>{logSetObj.logTime}</b>
          <br /><Tag color={logSetObj.erroneous ? "#f50" : "#2db7f5"} onClick={this.toggleLogsVisibility}>{logSetObj.name}</Tag>
          <br />
          {
            this.state.logsVisible
            ? (
                <CardAnt>
                  <Timeline reverse={false}>
                    {this.getTimelineItems()}
                  </Timeline>
                </CardAnt>
            )
            : null
          }
        </>
      )
    } else {
      if (this.props.logSetObj.secondaryItemsArr.length === 1) {
        const item = this.props.logSetObj.secondaryItemsArr[0]
        return (
          <IncomingTimelineItem key={item.id} info={item} logs={this.props.logSetObj.secondaryItemsObj[item.id]} />
        )
      } else {
        return null
      }
    }
  }
}

class IncomingMonitor extends React.Component {

  newState =  {
    logs: [],
    incomingItemsObj: {},
    incomingItemsArr: [],
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
    if (getConfig().isAuthEnabled && this.state.logs.length === 0) {
      const storedLogs = await axios.get(`${apiBaseUrl}/api/history/logs`)
      storedLogs.data.forEach(log => {
        this.appendLog(log)
      })
    }
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
    this.state.logs.push(log)
    let primaryGroupId = 'misc'
    if(log.uniqueId) {
      primaryGroupId = log.uniqueId
    }
    // Disabling grouping by traceID temporarily, need to refactor this functionality to sync with the new inbound and outbound logs structure
    // if(log.traceID) {
    //   primaryGroupId = log.traceID
    // }
    

    // Group by unique ID
    if(!this.state.incomingItemsObj.hasOwnProperty(primaryGroupId)) {
      this.state.incomingItemsObj[primaryGroupId] = {
        name: '',
        erroneous: false,
        logTime: null,
        secondaryItemsArr: [],
        secondaryItemsObj: {}
      }
      
      this.state.incomingItemsArr.push(primaryGroupId)
    }
    let primaryName = ''

    const secondaryGroupId = log.uniqueId
    if(!this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj.hasOwnProperty(secondaryGroupId)) {  
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId] = []
      let name = log.message
      if (log.resource) {
        name = log.resource.method.toUpperCase() + ' ' + log.resource.path
        primaryName = log.resource.method.toUpperCase() + ' > '
      }
      this.state.incomingItemsObj[primaryGroupId].logTime = log.logTime
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.push({ id: secondaryGroupId, name, erroneous: false })
    }

    this.state.incomingItemsObj[primaryGroupId].name += primaryName + ' '
    
    // If the verbosity of the log is error, set the entire group as erroneous
    if (log.verbosity === 'error') {
      // Find the group in incomingItemsArr array
      this.state.incomingItemsObj[primaryGroupId].erroneous = true
      // Find the group in secondaryItemsArr array
      const secondaryItemIndex = this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.findIndex(item => item? (item.id === secondaryGroupId) : false)
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr[secondaryItemIndex].erroneous = true
    }

    this.state.incomingItemsObj[primaryGroupId].position = log.notificationType === "newLog" ? "right" : "left"

    this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId].push(log)
  }

  getTimelineSets = () => {
    return this.state.incomingItemsArr.map(item => {
      if (item) {
        return (
          <Timeline.Item position={this.state.incomingItemsObj[item].position}>
            <IncomingTimelineSet key={item.id} info={item} logSetObj={this.state.incomingItemsObj[item]} />
          </Timeline.Item>
        )
      } else {
        return (
          <Timeline.Item dot={<Icon type="clock-circle-o" style={{ fontSize: '16px' }} />} color="red"><br /><br /></Timeline.Item>
        )
      }
    })
  }

  handleClearLogs = () => {
    this.setState(JSON.parse(JSON.stringify(this.newState)))
  }

  render () {
    return (
      <>
      <Row className="mb-4">
      <div className="col">
        <Card className="shadow">
          <CardHeader className="border-0">
            <Row>
              <Col className="text-right" ><span className="font-weight-bold">Inbound Requests</span></Col>
              <Col className="text-center" ><span className="font-weight-bold">|</span></Col>
              <Col className="text-left"><span className="font-weight-bold">Outbound Requests</span>
              <Button
                className="float-right"
                color="danger"
                size="sm"
                onClick={this.handleClearLogs}
              >
                Clear
              </Button>
              </Col>

            </Row>
          </CardHeader>
          <CardBody>
            <Timeline mode="alternate" reverse={true} pending="Monitoring..." >
              {this.getTimelineSets()}
            </Timeline>
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
