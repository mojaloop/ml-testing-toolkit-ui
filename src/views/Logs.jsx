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

// reactstrap components
import {
  Card,
  CardHeader,
  Container,
  Row,
} from "reactstrap";
// core components
import Header from "../components/Headers/Header.jsx";

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
          <Logs />
        </Container>
      </>
    );
  }
}

export default Tables;
