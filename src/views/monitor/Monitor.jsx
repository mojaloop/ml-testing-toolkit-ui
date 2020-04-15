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
import '@progress/kendo-theme-default/dist/all.css'
import getConfig from '../../utils/getConfig'

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

import { Icon, Tag, Timeline } from 'antd';

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
      logs: [],
      endpoint: "http://127.0.0.1:5050",
    };
  }
  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
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

export class IncomingMonitor extends React.Component {

  newState =  {
    logs: [],
    incomingItemsObj: {},
    incomingItemsArr: [],
    lastIncomingTime: null
  }

  socket = null

  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(this.newState))
  }
  
  componentWillUnmount = () => {
    this.socket.disconnect()
  }

  componentDidMount() {
    const { apiBaseUrl } = getConfig()
    this.socket = socketIOClient(apiBaseUrl);
    this.socket.on("newLog/" + this.props.sessionId, newLog => {
      // console.log('New log received', newLog)
      this.state.logs.push(newLog)

      // Group by unique ID
      if(!this.state.incomingItemsObj.hasOwnProperty(newLog.uniqueId)) {
        this.state.incomingItemsObj[newLog.uniqueId] = []
        if (!this.state.lastIncomingTime) {
          this.state.lastIncomingTime = new Date(newLog.logTime)
        } else {
          const timeDiffMillis = new Date(newLog.logTime) -  this.state.lastIncomingTime
          this.state.lastIncomingTime = new Date(newLog.logTime)
          if (timeDiffMillis > 1000) {
            this.state.incomingItemsArr.push(null)          }
        }
        let name = newLog.message
        if (newLog.resource) {
          name = newLog.resource.method.toUpperCase() + ' ' + newLog.resource.path
        }
        this.state.incomingItemsArr.push({ id: newLog.uniqueId, name, erroneous: false })
        
      }
      
      // If the verbosity of the log is error, set the entire group as erroneous
      if (newLog.verbosity === 'error') {
        // Find the group in incomingItemsArr array
        const itemIndex = this.state.incomingItemsArr.findIndex(item => item? (item.id === newLog.uniqueId) : false)
        this.state.incomingItemsArr[itemIndex].erroneous = true
      }

      this.state.incomingItemsObj[newLog.uniqueId].push(newLog)
      this.forceUpdate()
    });
  }

  getTimelineItems = () => {
    return this.state.incomingItemsArr.map(item => {
      if (item) {
        return (
          <IncomingTimelineItem key={item.id} info={item} logs={this.state.incomingItemsObj[item.id]} />
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
              {/* <Timeline.Item>Create a services site 2015-09-01</Timeline.Item>
              <Timeline.Item color="green">Solve initial network problems 2015-09-01</Timeline.Item>
              <Timeline.Item>
                <Tag color="#2db7f5">GET /quotes asdf</Tag>
                2019-01-01 00:00:00GMT
              </Timeline.Item>
              <Timeline.Item color="red">Network problems being solved 2015-09-01</Timeline.Item>
              <Timeline.Item>Create a services site 2015-09-01</Timeline.Item>
              <Timeline.Item dot={<Icon type="clock-circle-o" style={{ fontSize: '16px' }} />}>
                Technical testing 2015-09-01
              </Timeline.Item> */}
              {this.getTimelineItems()}
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
