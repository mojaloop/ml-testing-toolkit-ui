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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com>
 * Steven Oderayi <steven.oderayi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Table, Tag, Spin, message, Collapse, Button, Row, Col } from 'antd';
import axios from 'axios';
import { getConfig } from '../../utils/getConfig';

const { Panel } = Collapse;

class ServerLogsViewer extends React.Component {
    constructor() {
        super();
        this.state = {
            serverLogsLoading: false,
            logs: [],
        };
    }

    componentDidMount = () => this.setState({ logs: this.state.logs });

    marshalLogItem = (log, index) => {
        return {
            service: log.metadata.service,
            timestamp: log.metadata.timestamp,
            source: log.metadata.source,
            destination: log.metadata.destination,
            status: log.metadata.status,
            content: log.content,
            key: index,
        };
    };

    handleExpandServerLogs = activePanels => {
        if(activePanels.length) {
            this.fetchServerLogs();
        }
    };

    fetchServerLogs = async (componentName = null) => {
        if(!this.props.traceID) return;
        this.setState({ serverLogsLoading: true, serverLogsError: null });
        let logs = [];
        try {
            const res = await axios.get(`${getConfig().apiBaseUrl}/api/serverlogs/search?metadata.trace.traceId=${this.props.traceID}`);
            if(res.status == 200) {
                if(Array.isArray(res.data) && res.data.length) {
                    logs = res.data;
                } else {
                    message.error('No log was found for the current requests.');
                }
            } else {
                message.error('Logs could not be retrieved at the moment. Please try again.');
            }
        } catch (err) {
            message.error('Logs could not be retrieved at the moment. Please try again.');
        }
        this.setState({ logs, serverLogsLoading: false, serverLogsError: null });
    };

    render() {
        const genExtra = () => (
            <>
                {
                    this.props.userConfig.LOG_SERVER_UI_URL
                        ? <Button
                            onClick={event => {
                                event.stopPropagation();
                            }}
                            href={this.props.userConfig.LOG_SERVER_UI_URL}
                            target='_blank'
                            className='float-end me-2'
                            ghost
                            type='primary'
                        >Go to Log Server
                        </Button>
                        : null
                }
            </>
        );
        // if (!this.state.logs.length) return null;
        const columns = [
            { title: 'Service Tag', dataIndex: 'service', key: 'servcie' },
            { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
            { title: 'Source', dataIndex: 'source', key: 'source' },
            { title: 'Destination', dataIndex: 'destination', key: 'destination' },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: text => text === 'success' ? <Tag color='green'>{text}</Tag> : <Tag color='volcano'>{text}</Tag>,
            },
        ];
        const dataSource = this.state.logs.map((log, i) => ({ ...this.marshalLogItem(log, i) }));

        return (
            <Collapse onChange={this.handleExpandServerLogs}>
                <Panel header='Server Logs' key='1' extra={genExtra()}>
                    {
                        this.state.serverLogsLoading
                            ? <center><Spin size='large' /></center>
                            : (
                                <>
                                    <Row>
                                        <Col>
                                            <Button type='primary' onClick={this.fetchServerLogs}>Reload</Button>
                                        </Col>
                                    </Row>
                                    <Row className='mt-2'>
                                        <Col span={24}>
                                            <Table
                                                dataSource={dataSource}
                                                columns={columns}
                                                pagination={false}
                                                scroll={{ y: 480 }}
                                                expandable={{
                                                    expandedRowRender: log => <pre><code>{JSON.stringify(log.content, null, 2)}</code></pre>,
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </>
                            )
                    }
                </Panel>
            </Collapse>
        );
    }
}

export default ServerLogsViewer;
