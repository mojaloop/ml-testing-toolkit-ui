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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';

import { Card, Typography } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

class MappingViewer extends React.Component {
    render() {
        return (
            <>
                <table width='100%' cellPadding='5px'>
                    <tbody>
                        <tr>
                            <td className='align-text-top' width='25px'>
                                <DoubleRightOutlined style={{ fontSize: '20px', color: '#08c' }} />
                            </td>
                            <td>
                                <Title level={4}>{this.props.selectedResource.method.toUpperCase() + ' ' + this.props.selectedResource.path}</Title>
                            </td>
                        </tr>
                        <tr>
                            <td className='align-text-top' width='25px'>
                                <DoubleLeftOutlined style={{ fontSize: '20px', color: '#08c' }} />
                            </td>
                            <td>
                                <Title level={4}>FSPID: {this.props.selectedResource.data.fspid}</Title>
                            </td>
                        </tr>
                        {
                            this.props.selectedResource.data.successCallback
                                ? (
                                    <tr>
                                        <td className='align-text-top'>
                                            <DoubleLeftOutlined style={{ fontSize: '20px', color: '#08c' }} />
                                        </td>
                                        <td>
                                            <Title level={4}>Success Callback</Title>
                                            {
                                                Object.entries(this.props.selectedResource.data.successCallback).length > 0
                                                    ? (
                                                        <Card size='small' className='mt-4'>
                                                            <pre>{JSON.stringify(this.props.selectedResource.data.successCallback, null, 2)}</pre>
                                                        </Card>
                                                    )
                                                    : 'success callback'
                                            }
                                        </td>
                                    </tr>
                                )
                                : null
                        }
                        {
                            this.props.selectedResource.data.errorCallback
                                ? (
                                    <tr>
                                        <td className='align-text-top'>
                                            <DoubleLeftOutlined style={{ fontSize: '20px', color: '#08c' }} />
                                        </td>
                                        <td>
                                            <Title level={4}>Error Callback</Title>
                                            {
                                                Object.entries(this.props.selectedResource.data.errorCallback).length > 0
                                                    ? (
                                                        <Card size='small' className='mt-4'>
                                                            <pre>{JSON.stringify(this.props.selectedResource.data.errorCallback, null, 2)}</pre>
                                                        </Card>
                                                    )
                                                    : 'error callback'
                                            }
                                        </td>
                                    </tr>
                                )
                                : null
                        }
                    </tbody>
                </table>
            </>
        );
    }
}

export default MappingViewer;
