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
import autoBind from 'react-autobind'

// reactstrap components
import {
  Badge,
  Card,
  CardHeader,
  CardFooter,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Media,
  Pagination,
  PaginationItem,
  PaginationLink,
  Progress,
  Table,
  Container,
  Row,
  UncontrolledTooltip
} from "reactstrap";
// core components
import Header from "components/Headers/Header.jsx";

const getMessageTypeIcon = (messageType) => {
  let icon_name
  switch(messageType) {
    case 'request':
      icon_name = "ni-bold-right"
      break
    case 'response':
      icon_name = "ni-bold-left"
      break
    case 'generic':
    default:
      icon_name = "ni-sound-wave"
      break

  }
  const className = "rounded-circle mr-3 ni " + icon_name
  return <i className={className}></i>
}

class TableRow extends React.Component {
  constructor() {
    super();
    autoBind(this)
    this.state = {
      showAdditionalInfo: false,
    };
  }

  toggle() {
    console.log(this.state.showAdditionalInfo)
    this.setState({
      showAdditionalInfo: !this.state.showAdditionalInfo,
    });
  }

  render() {
    const log = this.props.log;
    return (
      <tr>
      <th scope="row">
        <Media className="align-items-center">
          { getMessageTypeIcon(log.messageType) }
          <Media>
            <span className="mb-0 text-sm">
              {log.logTime}
            </span>
          </Media>
        </Media>
      </th>
      <td>
        {log.additionalData
          ? (
              <div>
                {log.message}
                {this.state.showAdditionalInfo 
                  ? (
                    <div>
                      <br />
                      <div style={{ backgroundColor: '#1f4662', width: '500px', color: '#fff', fontSize: '12px' }}>
                        <div style={{ backgroundColor: '#193549', width: '100%', padding: '5px 10px', fontFamily: 'monospace', color: '#ffc600' }} >
                          <table width='100%' cellpadding='0' cellspacing='0'>
                            <tr>
                              <td><strong>Additional Info</strong></td>
                              <td align='right'><strong onClick={this.toggle}>Close</strong></td>
                            </tr>
                          </table>
                        </div>
                        <pre style={{ display: 'block', width: '100%', height: '250px', padding: '10px 30px', margin: '0', overflow: 'scroll', color: '#ffffff' }}>
                          {JSON.stringify(log.additionalData,null,2)}
                        </pre>
                      </div>
                    </div>
                  )
                  : null
                }
              </div>
            )
          : log.message
        }
      </td>
      <td>
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-success" />
          {log.verbosity}
        </Badge>
      </td>
      <td className="text-right">
      {log.additionalData
          ? (       
        <UncontrolledDropdown>
          <DropdownToggle
            className="btn-icon-only text-light"
            href="#pablo"
            role="button"
            size="sm"
            color=""
            onClick={e => e.preventDefault()}
          >
            <i className="fas fa-ellipsis-v" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-arrow" right>
            <DropdownItem
              href="#pablo"
              onClick={this.toggle}
            >
              View Additional Info
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
        )
        : ""
      }
      </td>
      </tr>
    );
  }
}

class Tables extends React.Component {
  constructor() {
    super();
    this.state = {
      logs: [],
      endpoint: "http://127.0.0.1:4444",
    };
  }
  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("newLog", newLog => {
      console.log('New log received')
      const updatedLogs = this.state.logs.concat(newLog)
      this.setState({ logs: updatedLogs })
    });
  }



  render() {
    const { logs } = this.state;
    const logsRows = logs.map(log => {
      return (
        <TableRow log={log} />
      );
    });

    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          {/* Table */}
          <Row>
            <div className="col">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <h3 className="mb-0">Logs</h3>
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Message</th>
                      <th scope="col">Verbosity</th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {
                      logsRows.length
                      ? logsRows
                      : <tr><td colSpan='100%' align='center'>No logs found</td></tr>
                    }
                  </tbody>
                </Table>
                {/* <CardFooter className="py-4">
                  <nav aria-label="...">
                    <Pagination
                      className="pagination justify-content-end mb-0"
                      listClassName="justify-content-end mb-0"
                    >
                      <PaginationItem className="disabled">
                        <PaginationLink
                          href="#pablo"
                          onClick={e => e.preventDefault()}
                          tabIndex="-1"
                        >
                          <i className="fas fa-angle-left" />
                          <span className="sr-only">Previous</span>
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem className="active">
                        <PaginationLink
                          href="#pablo"
                          onClick={e => e.preventDefault()}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#pablo"
                          onClick={e => e.preventDefault()}
                        >
                          2 <span className="sr-only">(current)</span>
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#pablo"
                          onClick={e => e.preventDefault()}
                        >
                          3
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#pablo"
                          onClick={e => e.preventDefault()}
                        >
                          <i className="fas fa-angle-right" />
                          <span className="sr-only">Next</span>
                        </PaginationLink>
                      </PaginationItem>
                    </Pagination>
                  </nav>
                </CardFooter> */}
              </Card>
            </div>
          </Row>
          {/* Dark table */}

        </Container>
      </>
    );
  }
}

export default Tables;
