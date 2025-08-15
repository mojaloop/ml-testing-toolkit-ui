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
import { Row, Col, Tag, Collapse, Card, Typography } from 'antd';

import { TTKColors } from '../../utils/styleHelpers';

const { Panel } = Collapse;
const { Title, Text } = Typography;

class TestCaseDemoViewer extends React.Component {
    constructor() {
        super();
        this.state = {
            testCaseName: '',
        };
    }

    componentWillUnmount = () => {
    };

    componentDidMount = () => {
        if(!this.props.testCase.meta) {
            this.props.testCase.meta = {
                info: this.props.testCase.name,
            };
        }
        this.setState({ testCaseName: this.props.testCase.name });
    };

    getTestCaseItems = () => {
        if(this.props.testCase.requests) {
            const requestRows = this.props.testCase.requests.map((item, index) => {
                if(item.method && item.operationPath) {
                    const testStatus = item.status && item.tests && item.status.testResult && item.tests.assertions ? item.status.testResult.passedCount + ' / ' + item.tests.assertions.length : '';
                    let testStatusColor = TTKColors.assertionFailed;
                    if(item.status && item.status.progressStatus == 'SKIPPED') {
                        testStatusColor = TTKColors.assertionSkipped;
                    } else if(item.status && item.tests && item.status.testResult && item.tests.assertions && item.status.testResult.passedCount === item.tests.assertions.length) {
                        testStatusColor = TTKColors.assertionPassed;
                    }
                    return (
                        <tr>
                            <td>
                                <Collapse className='mt-2'>
                                    <Panel
                                        header = {(
                                            <>
                                                <Title level={5}>{item.method.toUpperCase() + ' ' + item.operationPath}</Title>
                                                <Text>{item.description}</Text>
                                                {
                                                    item.status && (item.status.state === 'finish' || item.status.state === 'error')
                                                        ? (
                                                            <Tag color={testStatusColor} className='float-end'>
                                                                {testStatus}
                                                            </Tag>
                                                        )
                                                        : null
                                                }
                                            </>
                                        )}
                                        key='1'
                                        className='text-start'
                                    >
                                        <Row>
                                            <Col span={11}>
                                                {
                                                    item.status?.response
                                                        ? (
                                                            <>
                                                                <Title level={5}>Request:</Title>
                                                                <Text><pre>{JSON.stringify({ method: item.status?.requestSent.method, path: item.status?.requestSent.path, headers: item.status?.requestSent.headers, body: item.status?.requestSent.body }, null, 2)}</pre></Text>
                                                            </>
                                                        ) : null
                                                }
                                                
                                            </Col>
                                            <Col span={2}></Col>
                                            <Col span={11}>
                                                {
                                                    item.status?.response
                                                        ? (
                                                            <>
                                                                <Title level={5}>Response:</Title>
                                                                <Text><pre>{JSON.stringify(item.status?.response, null, 2)}</pre></Text>
                                                            </>
                                                        ) : null
                                                }
                                            </Col>                                    
                                        </Row>
                                    </Panel>
                                </Collapse>
                            </td>
                        </tr>
                    );
                } else {
                    return (
                        <tr>
                            <td>
                                <p>{item.description}</p>
                            </td>
                        </tr>
                    );
                }
            });
            return (
                <table width='100%' cellPadding='5px'>
                    <tbody>
                        {requestRows}
                    </tbody>
                </table>
            );
        } else {
            return null;
        }
    };


    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card
                            title={ this.props.testCase.name }
                        >
                            <>
                                { this.getTestCaseItems() }
                            </>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default TestCaseDemoViewer;
