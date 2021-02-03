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
 * Steven Oderayi <steven.oderayi@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";
import { Table, Tag } from "antd";

class ServerLogsViewer extends React.Component {
  constructor() {
    super()
    this.state = {}
  }

  componentDidMount = () => this.setState({ logs: this.props.logs })

  // marshalLogItem = (log, index) => ({
  //   service: log.metadata.trace.service,
  //   timestamp: log.metadata.trace.startTimestamp,
  //   fspiop_source: log.metadata.trace.tags.source,
  //   fspiop_destination: log.metadata.trace.tags.destination,
  //   status: log.metadata.event.state.status,
  //   fullLog: log,
  //   key: index
  // })

  marshalLogItem = (log, index) => {
    console.log(log)
    return {
      service: log.metadata.service,
      timestamp: log.metadata.timestamp,
      source: log.metadata.source,
      destination: log.metadata.destination,
      status: log.metadata.status,
      content: log.content,
      key: index
    }
  }

  render() {
    if (!this.props.logs.length) return null;
    const columns = [
      { title: "Service Tag", dataIndex: 'service', key: 'servcie' },
      { title: "Timestamp", dataIndex: 'timestamp', key: 'timestamp' },
      { title: "Source", dataIndex: 'source', key: 'source' },
      { title: "Destination", dataIndex: 'destination', key: 'destination' },
      {
        title: "Status",
        dataIndex: 'status',
        key: 'status',
        render: text => text === 'success' ? <Tag color="green">{text}</Tag> : <Tag color="volcano">{text}</Tag>
      }
    ]
    const dataSource = this.props.logs.map((log, i) => ({ ...this.marshalLogItem(log, i) }))

    return <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      scroll={{ y: 480 }}
      expandable={{
        expandedRowRender: log => <pre><code>{JSON.stringify(log.content, null, 2)}</code></pre>
      }}
    />
  }
}

export default ServerLogsViewer;
