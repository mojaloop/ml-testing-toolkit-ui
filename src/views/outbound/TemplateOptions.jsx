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
import { Input, Row, Col, Card, Checkbox, Radio, Typography } from 'antd';
import 'antd/dist/antd.css';

const { Text } = Typography;

class TemplateOptions extends React.Component {
    state = {};

    getOptionItemType = itemName => {
        if(typeof this.props.values[itemName] === 'boolean') {
            return (
                <Checkbox
                    checked={this.props.values[itemName]}
                    onChange={e => this.props.onChange(itemName, e.target.checked)}
                />
            );
        } else if(typeof this.props.values[itemName] === 'number') {
            return (
                <Input
                    value={this.props.values[itemName]}
                    onChange={e => this.props.onChange(itemName, +e.target.value)}
                />
            );
        } else if(itemName === 'generateIDType') {
            return (
                <Radio.Group
                    onChange={e => this.props.onChange(itemName, e.target.value)}
                    value={this.props.values[itemName]}
                >
                    <Radio value={'uuid'}>UUID</Radio>
                    <Radio value={'ulid'}>ULID</Radio>
                </Radio.Group>
            );
        } else if(itemName === 'transformerName') {
            return (
                <Radio.Group
                    onChange={e => this.props.onChange(itemName, e.target.value)}
                    value={this.props.values[itemName]}
                >
                    <Radio value={'none'}>None</Radio>
                    <Radio value={'fspiopToISO20022'}>FSPIOP To ISO20022</Radio>
                    <Radio value={'ISO20022ToFspiop'}>ISO20022 To FSPIOP</Radio>
                </Radio.Group>
            );
        } else {
            return (
                <Input
                    value={this.props.values[itemName]}
                    onChange={e => this.props.onChange(inputValueName, e.target.value)}
                />
            );
        }
    };

    getOptionItems = () => {
        const optionItems = [];
        for(const itemName in this.props.values) {
            optionItems.push(
                <Row className='mb-2' key={itemName}>
                    <Col span={6}>
                        <Text>{itemName}</Text>
                    </Col>
                    <Col span={18}>
                        <Row gutter={8}>
                            <Col span={24}>
                                {this.getOptionItemType(itemName)}
                            </Col>
                        </Row>
                    </Col>
                </Row>,
            );
        }
        return optionItems;
    };

    render() {
        return (
            <>
                <Row gutter={16}>
                    <Col span={24}>
                        <Card className='bg-white shadow' size='default'>
                            {this.getOptionItems()}
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default TemplateOptions;
