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
import { Input, Row, Col, Checkbox, Typography } from 'antd';
import { EditTwoTone, SaveTwoTone, CloseSquareTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

const { TextArea } = Input;

class MetadataItem extends React.Component {
    state = {
        editMode: false,
        itemValue: null,
    };

    componentDidMount = () => {
        this.setState({ itemValue: this.props.value });
    };

    handleValueChange = () => {
        this.props.onChange(this.props.name, this.state.itemValue);
    };

    getMetadataItemType = () => {
        if(this.state.editMode) {
            if(typeof this.props.value === 'boolean') {
                return (
                    <Checkbox
                        checked={this.state.itemValue}
                        onChange={e => this.setState({ itemValue: e.target.check })}
                    />
                );
            } else if(typeof this.props.value === 'number') {
                return (
                    <Input
                        value={this.state.itemValue}
                        onChange={e => this.setState({ itemValue: +e.target.value })}
                    />
                );
            } else {
                return (
                    <TextArea
                        rows={5}
                        value={this.state.itemValue}
                        onChange={e => this.setState({ itemValue: e.target.value })}
                    />
                );
            }
        } else {
            return (
                <ReactMarkdown>
                    {this.props.value}
                </ReactMarkdown>
            );
        }
    };

    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Text className='mr-2' strong>{this.props.name}</Text>
                        {
                            this.state.editMode
                                ? (
                                    <>
                                        <SaveTwoTone
                                            style={{ fontSize: '20px' }}
                                            onClick={() => {
                                                this.setState({ editMode: false });
                                                this.handleValueChange();
                                            }}
                                        />
                                        <CloseSquareTwoTone
                                            style={{ fontSize: '20px' }}
                                            className='mr-1'
                                            onClick={() => {
                                                this.setState({ editMode: false });
                                            }}
                                        />
                                    </>
                                )
                                : (
                                    <EditTwoTone
                                        style={{ fontSize: '20px' }}
                                        onClick={() => {
                                            this.setState({ editMode: true, itemValue: this.props.value });
                                        }}
                                    />
                                )
                        }

                    </Col>
                </Row>
                <Row className='mt-2 mb-2'>
                    <Col span={24}>
                        {this.getMetadataItemType()}
                    </Col>
                </Row>
            </>
        );
    }
}

class MetadataEditor extends React.Component {
    handleItemValueChange = (name, newValue) => {
        this.props.values[name] = newValue;
        this.props.onChange();
    };

    getMetadataItems = () => {
        if(this.props.values) {
            const inputItems = [];
            for(const inputValueName in this.props.values) {
                inputItems.push(
                    <MetadataItem name={inputValueName} value={this.props.values[inputValueName]} onChange={this.handleItemValueChange} />,
                );
            }
            return inputItems;
        }
    };

    render() {
        return (
            <>
                {this.getMetadataItems()}
            </>
        );
    }
}

export default MetadataEditor;
