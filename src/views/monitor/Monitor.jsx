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
  Row,
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

// const getMessageTypeIcon = (messageType) => {
//   let icon_name
//   switch(messageType) {
//     case 'request':
//       icon_name = "ni-bold-right"
//       break
//     case 'response':
//       icon_name = "ni-bold-left"
//       break
//     case 'generic':
//     default:
//       icon_name = "ni-sound-wave"
//       break

//   }
//   const className = "rounded-circle mr-3 ni " + icon_name
//   return <i className={className}></i>
// }


export class Logs extends React.Component {
  constructor() {
    super();
    this.state = {
      logs: []
    };
  }
  componentDidMount() {
    const { apiBaseUrl } = getConfig()
    const socket = socketIOClient(apiBaseUrl);
    socket.on("newLog", newLog => {
      // console.log('New log received', newLog)
      const updatedLogs = this.state.logs.concat(newLog)
      this.setState({ logs: updatedLogs })
    });
  }

  expandChange = (event) => {
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
  }


  render() {
  
    return (
      <>
        <Row>
          <div className="col">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <h3 className="mb-0">Logs</h3>
                </CardHeader>
                <Grid
                  className="align-items-center table-flush"
                  data={this.state.logs}
                  detail={DetailComponent}
                  expandField="expanded"
                  onExpandChange={this.expandChange}
                >
                  <Column field="logTime" title="Time" />
                  <Column field="uniqueId" title="UniqueID" />
                  <Column field="message" title="Message" />
                  <Column field="verbosity" title="Verbosity" />
                </Grid>
              </Card>
              </div>
        </Row>
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
      <Timeline.Item position='right'>
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
      </Timeline.Item>
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
        <Timeline.Item position='right'>
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
        </Timeline.Item>
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
    lastIncomingTime: null,
  }

  socket = null

  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(this.newState))
  }
  
  componentWillUnmount = () => {
    this.socket.disconnect()
  }

  componentDidMount = async () => {
    const { apiBaseUrl } = getConfig()
    this.socket = socketIOClient(apiBaseUrl);
    let socketTopic = 'newLog'
    if (getConfig().isAuthEnabled) {
      const dfspId = localStorage.getItem('JWT_COOKIE_DFSP_ID')
      if (dfspId) {
        socketTopic = 'newLog/' + dfspId
      }
      if (this.state.logs.length === 0) {
        const storedLogs = await axios.get(apiBaseUrl + '/api/history/logs')
        storedLogs.data.forEach(newLog => {
          this.appendLog(newLog)
        })
      }
    }

    this.socket.on(socketTopic, newLog => {
      this.appendLog(newLog)
      this.forceUpdate()
    });
    this.forceUpdate()
  }

  appendLog = (newLog) => {
    this.state.logs.push(newLog)
    let primaryGroupId = 'misc'
    if(newLog.traceID) {
      primaryGroupId = newLog.traceID
    } else {
      primaryGroupId = newLog.uniqueId
    }

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

    const secondaryGroupId = newLog.uniqueId
    if(!this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj.hasOwnProperty(secondaryGroupId)) {  
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId] = []
      let name = newLog.message
      if (newLog.resource) {
        name = newLog.resource.method.toUpperCase() + ' ' + newLog.resource.path
        primaryName = newLog.resource.method.toUpperCase() + ' > '
      }
      this.state.incomingItemsObj[primaryGroupId].logTime = newLog.logTime
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.push({ id: secondaryGroupId, name, erroneous: false })
    }

    this.state.incomingItemsObj[primaryGroupId].name += primaryName + ' '
    
    // If the verbosity of the log is error, set the entire group as erroneous
    if (newLog.verbosity === 'error') {
      // Find the group in incomingItemsArr array
      this.state.incomingItemsObj[primaryGroupId].erroneous = true
      // Find the group in secondaryItemsArr array
      const secondaryItemIndex = this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.findIndex(item => item? (item.id === secondaryGroupId) : false)
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr[secondaryItemIndex].erroneous = true
    }

    this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId].push(newLog)
  }

  getTimelineSets = () => {
    return this.state.incomingItemsArr.map(item => {
      if (item) {
        return (
          <IncomingTimelineSet key={item.id} info={item} logSetObj={this.state.incomingItemsObj[item]} />
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
            <Button
              className="float-right"
              color="danger"
              size="sm"
              onClick={this.handleClearLogs}
            >
              Clear
            </Button>
            <h3 className="mb-0">Monitor</h3>
          </CardHeader>
          <CardBody>
            <Timeline reverse={true} pending="Monitoring..." >
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
