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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';

import { Card, Tag, Typography } from 'antd';
import { DoubleRightOutlined, QuestionOutlined, DoubleLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

class RuleViewer extends React.Component {
    render() {
        const inputRule = this.props.rule;
        if(!inputRule.event.params) {
            inputRule.event.params = {};
        }
        const resource = {};
        let conditions = [];
        try {
            const pathCondition = inputRule.conditions.all.find(item => {
                if(item.fact === 'operationPath') {
                    return true;
                } else {
                    return false;
                }
            });
            if(pathCondition) {
                resource.path = pathCondition.value;
            }
            const methodCondition = inputRule.conditions.all.find(item => {
                if(item.fact === 'method') {
                    return true;
                } else {
                    return false;
                }
            });
            if(methodCondition) {
                resource.method = methodCondition.value;
            }

            conditions = inputRule.conditions.all.filter(item => {
                if(item.fact === 'method' || item.fact === 'operationPath') {
                    return false;
                } else {
                    return true;
                }
            });
        } catch (err) {}

        const getItemValueString = itemValue => {
            if(Array.isArray(itemValue)) {
                return itemValue.toString();
            } else {
                return itemValue;
            }
        };

        const conditionItems = conditions.map(item => {
            return (
                <>
                    <Card size='small' className='mt-1'>
                        <Tag color='cyan'>{item.fact}.{item.path}</Tag>
                        <Tag>{item.operator}</Tag>
                        <Tag color='blue'>{getItemValueString(item.value)}</Tag>
                    </Card>
                </>
            );
        });
        return (
            <>
                <table width='100%' cellPadding='5px'>
                    <tbody>
                        <tr>
                            <td className='align-text-top' width='25px'>
                                <DoubleRightOutlined style={{ fontSize: '20px', color: '#08c' }} />
                            </td>
                            <td>
                                <Title level={4}>{resource.method.toUpperCase() + ' ' + resource.path}</Title>
                            </td>
                        </tr>
                        {
                            conditions.length > 0
                                ? (
                                    <tr>
                                        <td className='align-text-top'>
                                            <QuestionOutlined style={{ fontSize: '20px', color: '#08c' }} />
                                        </td>
                                        <td>
                                            <Title level={4}>Conditions</Title>
                                            {conditionItems}
                                        </td>
                                    </tr>
                                )
                                : null
                        }
                        <tr>
                            <td className='align-text-top'>
                                <DoubleLeftOutlined style={{ fontSize: '20px', color: '#08c' }} />
                            </td>
                            <td>
                                <Title level={4}>Event</Title>
                                {
                                    Object.entries(inputRule.event.params).length > 0
                                        ? (
                                            <Card size='small' className='mt-4' title={inputRule.event.type}>
                                                <pre>{JSON.stringify(inputRule.event.params, null, 2)}</pre>
                                            </Card>
                                        )
                                        : inputRule.event.type
                                }
                            </td>
                        </tr>
                    </tbody>
                </table>
            </>
        );
    }
}

export default RuleViewer;
