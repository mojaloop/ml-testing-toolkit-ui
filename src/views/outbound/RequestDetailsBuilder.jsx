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

 * Vijaya Kumar Guthi <vijaya.guthi@infitx.com> (Original Author)
 --------------
 ******/
import React from 'react';

import { Input, Row, Col, Typography } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';

import '../outbound/jsoneditor-react-compat';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';

const { Text } = Typography;


class RequestDetailsBuilder extends React.Component {
    constructor() {
        super();
        this.state = {
            requestIdEditDisabled: true,
            requestDescriptionEditDisabled: true,
            requestIdValidationError: '',
            requestId: '',
            requestDescription: '',
        };
    }

    componentDidMount() {
        this.setState({
            requestId: this.props.request.id,
            requestDescription: this.props.request.description,
        });
    }

    handleRequestIdChange = e => {
        const requestId = e.target.value;
        // Validate the request ID to be a string with only alphanumeric characters, underscore and dash
        if(!/^[a-zA-Z0-9_-]*$/.test(e.target.value)) {
            this.setState({ requestId, requestIdValidationError: 'Request ID should contain only alphanumeric characters, underscore and dash' });
        } else {
            this.setState({ requestId, requestIdValidationError: '' });
        }
    };

    handleRequestIdEditClick = () => {
        this.setState({ requestIdEditDisabled: false });
    };

    handleRequestIdSaveClick = () => {
        if(this.state.requestId !== this.props.request.id) {
            this.props.request.id = this.state.requestId;
            this.state.requestIdEditDisabled = true;
            this.props.onChange();
        }
        this.setState({ requestIdEditDisabled: true });
    };

    handleRequestDescriptionChange = e => {
        const requestDescription = e.target.value;
        this.setState({ requestDescription });
    };

    handleRequestDescriptionEditClick = () => {
        this.setState({ requestDescriptionEditDisabled: false });
    };

    handleRequestDescriptionSaveClick = () => {
        if(this.state.requestDescription !== this.props.request.description) {
            this.props.request.description = this.state.requestDescription;
            this.state.requestDescriptionEditDisabled = true;
            this.props.onChange();
        }
        this.setState({ requestDescriptionEditDisabled: true });
    };

    render() {
        return (
            <>

                <Row>
                    <Col span={6}>
                        <Text>ID</Text>
                    </Col>
                    <Col span={18}>
                        <Input
                            placeholder="Request ID"
                            size="small"
                            disabled={this.state.requestIdEditDisabled}
                            value={this.state.requestId}
                            addonAfter={
                                this.state.requestIdEditDisabled ? (
                                    <EditOutlined
                                        onClick={this.handleRequestIdEditClick}
                                    />
                                ) : (
                                    <SaveOutlined
                                        style={{ visibility: this.state.requestIdValidationError ? 'hidden' : 'visible' }}
                                        onClick={this.handleRequestIdSaveClick}
                                    />
                                )
                            }
                            onChange={this.handleRequestIdChange}
                        />
                        <Text type='danger'>{this.state.requestIdValidationError}</Text>
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={6}>
                        <Text>Description</Text>
                    </Col>
                    <Col span={18}>
                        <Input
                            placeholder="Description"
                            size="small"
                            disabled={this.state.requestDescriptionEditDisabled}
                            value={this.state.requestDescription}
                            addonAfter={
                                this.state.requestDescriptionEditDisabled ? (
                                    <EditOutlined
                                        onClick={this.handleRequestDescriptionEditClick}
                                    />
                                ) : (
                                    <SaveOutlined
                                        onClick={this.handleRequestDescriptionSaveClick}
                                    />
                                )
                            }
                            onChange={this.handleRequestDescriptionChange}
                        />
                    </Col>
                </Row>
            </>
        );
    }
}

export default RequestDetailsBuilder;
