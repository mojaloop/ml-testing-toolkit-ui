 
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
import { getConfig } from '../../utils/getConfig';
import { Row, Col, message, Menu, Dropdown, Button, Table, Pagination, Progress, Typography, Tag, Card, DatePicker, Radio } from 'antd';
import { red, green } from '@ant-design/colors';
import axios from 'axios';
import FileDownload from 'js-file-download';

const { Text } = Typography;
const { RangePicker } = DatePicker;

class ReportHistory extends React.Component {
    constructor() {
        super();
        this.state = {
            testReport: null,
            pageSize: 10,
            currentPage: 1,
            historyReportsLocal: [],
            filterStatus: 'all',
            filterDateRangeStart: null,
            filterDateRangeEnd: null,
            // TODO: fetch total from API
            historyReportsTotal: 100,
            historyReportsVisible: false,
            historyReportsColumns: [
                { title: 'Name', dataIndex: 'name', key: 'name', width: '20%' },
                { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: '20%' },
                { title: 'Run duration', dataIndex: 'duration', key: 'duration', width: '10%' },
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: '10%',
                    render: runtimeInformation => (
                        <>
                            {this.getProgressBar(runtimeInformation)}
                        </>
                    ),
                },
                {
                    dataIndex: '',
                    key: 'download',
                    width: '10%',
                    render: (text, record) => (
                        <Dropdown overlay={this.downloadReportMenu(record)}>
                            <Button className='float-right' color='info' size='sm' onClick={e => e.preventDefault()}>
                                Download
                            </Button>
                        </Dropdown>
                    ),
                },
            ],
        };
    }

    getProgressBar = runtimeInformation => {
        const colorArr = [];
        const percentage = Math.round(runtimeInformation.totalPassedAssertions * 100 / runtimeInformation.totalAssertions);
        const passed = runtimeInformation.totalPassedAssertions === runtimeInformation.totalAssertions;
        for(let i = 1; i <= 5; i++) {
            if(passed) {
                colorArr.push(green[6]);
            } else {
                colorArr.push(red[5]);
            }
        }
        return (
            <Progress
                percent={percentage}
                steps={5}
                status="normal"
                format={() => {
                    return (
                        <>
                            <Text className='me-2'>{runtimeInformation.totalPassedAssertions + '/' + runtimeInformation.totalAssertions}</Text>
                            {
                                passed
                                    ? (
                                        <Tag color="#87d068">
                                            PASSED
                                        </Tag>
                                    )
                                    : (
                                        <Tag color="#f50">
                                            FAILED
                                        </Tag>
                                    )
                            }

                        </>
                    );
                }}
                showInfo={true}
                strokeColor={colorArr}
            />
        );

    };

    socket = null;

    autoSave = false;

    autoSaveIntervalId = null;

    componentDidMount = async () => {
        this.updateResults();
    };

    download = (content, fileName, contentType) => {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    };

    handleDownloadReport = async (event, report) => {
        switch (event.key) {
            case 'json':
            case 'printhtml':
            case 'html':
            default:
                message.loading({ content: 'Generating the report...', key: 'downloadReportProgress', duration: 10 });
                const { apiBaseUrl } = getConfig();
                const reportFormat = event.key;
                console.log(report);
                const response = await axios.get(`${apiBaseUrl}/api/history/test-reports/${report.key}?format=${reportFormat}&download=yes`, { responseType: 'blob' });
                let downloadFilename = 'test.' + reportFormat;
                if(response.headers['content-disposition']) {
                    const disposition = response.headers['content-disposition'];
                    if(disposition && disposition.indexOf('attachment') !== -1) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if(matches != null && matches[1]) {
                            downloadFilename = matches[1].replace(/['"]/g, '');
                        }
                    }
                }
                FileDownload(response.data, downloadFilename);
                message.success({ content: 'Report Generated', key: 'downloadReportProgress', duration: 2 });
        }
    };

    downloadReportMenu = report => {
        return (
            <Menu onClick={event => this.handleDownloadReport(event, report)}>
                <Menu.Item key='json'>JSON format</Menu.Item>
                <Menu.Item key='html'>HTML report</Menu.Item>
                <Menu.Item key='printhtml'>Printer Friendly HTML report</Menu.Item>
            </Menu>
        );
    };

    getReportsHistoryData = async (currentPage, pageSize, filterOptions) => {
        const { apiBaseUrl } = getConfig();
        const options = {};
        options.params = {
            skip: (currentPage - 1) * pageSize,
            limit: pageSize,
            ...filterOptions,
        };
        const reports = await axios.get(apiBaseUrl + '/api/history/test-reports', options);
        return reports.data;
    };

    constructTableData = reportsHistory => {
        const dataSource = [];
        reportsHistory.forEach(report => {
            const historyReportsDataSource = {
                key: report._id,
                name: report.name,
                timestamp: report.runtimeInformation.completedTimeISO,
                duration: report.runtimeInformation.runDurationMs + ' ms',
                status: report.runtimeInformation,
            };
            dataSource.push(historyReportsDataSource);
        });
        return dataSource;
    };

    updateResults = async () => {
        const { currentPage, pageSize, filterStatus, filterDateRangeStart, filterDateRangeEnd } = this.state;
        const filterOptions = {
            filterStatus,
            filterDateRangeStart,
            filterDateRangeEnd,
        };
        const reportsHistoryData = await this.getReportsHistoryData(currentPage, pageSize, filterOptions);
        const historyReportsLocal = this.constructTableData(reportsHistoryData.documents);
        this.setState({ currentPage, pageSize, filterStatus, filterDateRangeStart, filterDateRangeEnd, historyReportsLocal, historyReportsTotal: reportsHistoryData.count });
    };

    handlePageChange = async (currentPage, pageSize) => {
        this.state.currentPage = currentPage;
        this.state.pageSize = pageSize;
        this.updateResults();
    };

    handleFilterStatusChange = e => {
        this.state.filterStatus = e.target.value;
        this.updateResults();
    };

    handleDateChange = (dates, dateStrings) => {
        // Ignoring local timezone offset because we are dealing with the server time zone
        const startTimeStamp = dates[0].$d.getTime() - dates[0].$d.getTimezoneOffset() * 60000;
        const endTimeStamp = dates[1].$d.getTime() - dates[1].$d.getTimezoneOffset() * 60000;
        this.state.filterDateRangeStart = new Date(startTimeStamp).toISOString();
        this.state.filterDateRangeEnd = new Date(endTimeStamp).toISOString();
        this.updateResults();
    };

    render() {

        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card className='mb-4'>
                            <Pagination
                                className='float-right'
                                pageSize={this.state.pageSize}
                                current={this.state.currentPage}
                                total={this.state.historyReportsTotal}
                                onChange={this.handlePageChange}
                                showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total}`}
                                style={{ bottom: '0px' }}
                            />
                            <RangePicker showTime onChange={this.handleDateChange} />
                            <Radio.Group className='ms-4' value={this.state.filterStatus} onChange={this.handleFilterStatusChange}>
                                <Radio.Button value="all">All</Radio.Button>
                                <Radio.Button value="passed">Passed</Radio.Button>
                                <Radio.Button value="failed">Failed</Radio.Button>
                            </Radio.Group>
                        </Card>
                        <Row>
                            <Col span={24}>
                                <Table
                                    columns={this.state.historyReportsColumns}
                                    dataSource={this.state.historyReportsLocal}
                                    pagination={false}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>
        );
    }
}

export default ReportHistory;
