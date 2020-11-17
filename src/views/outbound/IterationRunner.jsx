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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";

import { Row, Col, Typography, Button, message, Table, Progress, InputNumber, Tag } from 'antd';
import FileDownload from 'js-file-download'

// import { RightCircleOutlined, CodeFilled, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import getConfig from '../../utils/getConfig'
import TraceHeaderUtils from "../../utils/traceHeaderUtils"

const {Text} = Typography
const traceHeaderUtilsObj = new TraceHeaderUtils()

class IterationNumberInput extends React.Component {

  render() {
    return (
      <Row>
        <Col span={24}>
          Iteration Count
          <InputNumber
            min={10}
            max={200}
            step={10}
            style={{ margin: '0 16px' }}
            value={this.props.count}
            onChange={this.props.onChange}
          />
        </Col>
      </Row>
    );
  }
}

class IterationRunner extends React.Component {

  constructor() {
    super();
    this.state = {
      totalIterations: 100,
      iterationsResult: [],
      iterationsDone: 0,
      runtimeDurationDone: 0,
      isTableLoading: false,
      totalReport: null,
      totalRuntimeDuration: null
    };
  }

  componentWillUnmount = () => {
  }
  
  componentDidMount = () => {

  }

  handleIterationCountChange = (count) => {
    this.setState({iterationsDone: 0, totalIterations: count})
  }

  handleIncomingProgress(progress) {
    if (progress.status === 'ITERATION_PROGRESS') {
      this.state.iterationsResult.push(progress.iterationStatus)
      this.state.runtimeDurationDone += progress.iterationStatus.runDurationMs
      this.state.iterationsDone++
      this.forceUpdate()
      // console.log(progress.iterationStatus)
    } else if (progress.status === 'ITERATIONS_FINISHED') {
      this.setState({isTableLoading: false, totalReport: progress.totalReport, totalRuntimeDuration: progress.totalRunDurationMs})
      message.success({ content: 'Finished', key: 'iterationsProgress'});
    } else if (progress.status === 'ITERATIONS_TERMINATED') {
      this.setState({isTableLoading: false})
      message.error({ content: 'Terminated', key: 'iterationsProgress'});
    }
  }

  handleStartExecutionClick = async (template = null) => {
    // Reset the values
    this.state.iterationsDone = 0
    this.state.runtimeDurationDone = 0
    this.state.iterationsResult = []
    this.state.totalRuntimeDuration = null

    this.state.isTableLoading = true
    const traceIdPrefix = traceHeaderUtilsObj.getTraceIdPrefix()
    this.state.currentEndToEndId = traceHeaderUtilsObj.generateEndToEndId()
    const traceId = traceIdPrefix + this.props.sessionId + this.state.currentEndToEndId

    // const outboundRequestID = Math.random().toString(36).substring(7);
    message.loading({ content: 'Starting iterations...', key: 'iterationsProgress' });
    const { apiBaseUrl } = getConfig()
    const params = {
      iterationCount: this.state.totalIterations
    }
    await axios.post(apiBaseUrl + "/api/outbound/template_iterations/" + traceId, this.props.template, { params, headers: { 'Content-Type': 'application/json' } })

    this.state.sendingOutboundRequestID = traceId
    message.loading({ content: 'Executing the test cases...', key: 'iterationsProgress', duration: 10 });

    this.forceUpdate()
  }

  handleDownloadReport = async (iterationNumber) => {
    const testReport = this.state.totalReport && this.state.totalReport.iterations[iterationNumber]

    message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
    const { apiBaseUrl } = getConfig()
    const reportFormat = 'html'
    const response = await axios.post(apiBaseUrl + "/api/reports/testcase/" + reportFormat, testReport, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' })
    let downloadFilename = "test." + reportFormat
    if (response.headers['content-disposition']) {
      const disposition = response.headers['content-disposition']
      if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          downloadFilename = matches[1].replace(/['"]/g, '');
        }
      }
    }
    FileDownload(response.data, downloadFilename)
    message.success({ content: 'Report Generated', key: 'downloadReportProgress', duration: 2 });


  }

  render() {
    const columns = [
      {
        title: 'Iteration No.',
        dataIndex: 'iterationNumber',
      },
      {
        title: 'Pass Percentage',
        dataIndex: 'passPercentage',
      },
      {
        title: 'Runtime Duration (ms)',
        dataIndex: 'runtimeDuration',
      },
      {
        title: 'Report',
        dataIndex: 'downloadReport',
      },
    ];

    const data = this.state.iterationsResult.map((item,index) => {
      return {
        key: index,
        iterationNumber: item.iterationNumber,
        passPercentage: (
          <>
          <Text>{item.totalPassedAssertions + '/' + item.totalAssertions + ' (' + Math.round(item.totalPassedAssertions*100/item.totalAssertions) + '%)'}</Text>
          { item.totalPassedAssertions===item.totalAssertions? (<Tag className='ml-2' color="success">PASSED</Tag>) : (<Tag className='ml-2' color="error">FAILED</Tag>) }
          </>),
        runtimeDuration: item.runDurationMs,
        downloadReport: this.state.totalReport ? (
          <Button
            onClick={(e) => {this.handleDownloadReport(item.iterationNumber)}}
          >Report</Button>
        ) : null
      }
    })

    return (
      <>
      <Row>
        <Col span={8}>
          <IterationNumberInput
            count={this.state.totalIterations}
            onChange={this.handleIterationCountChange}
          />
        </Col>
        <Col span={8}>
        {
          this.state.iterationsDone > 0
          ? (
            <>
            <Progress percent={Math.round(this.state.iterationsDone * 100 / this.state.totalIterations)} width={50} />
            {/* <Title level={4}>{this.state.totalPassedCount} / {this.state.totalAssertionsCount}</Title> */}
            </>
          )
          : null
        }
        </Col>
        <Col span={8}>
          <Button
              className="float-right"
              type="primary"
              danger
              onClick={this.handleStartExecutionClick}
            >
              Start Execution
          </Button>
        </Col>
      </Row>
      <Row className="mt-2">
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ y: 540 }}
            loading={this.state.isTableLoading}
            footer={(pageData) => {
              return (
                <>
                  <Row>
                    <Col span={8}><Text strong>Iterations Done: {this.state.iterationsDone}</Text></Col>
                    <Col span={8}><Text strong>Average Runtime Duration: {Math.round(this.state.runtimeDurationDone / this.state.iterationsDone)}</Text></Col>
                    {
                      this.state.totalRuntimeDuration
                      ? <Col span={8}><Text strong>Total Runtime Duration: {this.state.totalRuntimeDuration}</Text></Col>
                      : null
                    }
                  </Row>
                </>
              );
            }}
          />
        {/* { getHorizontalGroups() } */}
        </Col>
      </Row>
      </>
    );
  }
}

export default IterationRunner;