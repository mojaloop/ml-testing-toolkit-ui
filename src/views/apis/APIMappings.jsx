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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';

import { Collapse, Modal, message, Card, Row, Col, Button } from 'antd';
// import 'antd/dist/antd.css';

import axios from 'axios';
import MappingEditor from './MappingEditor';
import MappingViewer from './MappingViewer';
import { getConfig } from '../../utils/getConfig';

const { Panel } = Collapse;

class APIMappings extends React.Component {
    constructor() {
        super();
        this.state = {
            asynchronous: false,
            mapping: {},
            selectedResource: null,
        };
    }

    componentDidMount() {
        this.componentSetState();
    }

    componentSetState = async () => {
        const asynchronous = !!this.props.apiVersion.asynchronous;
        const mode = asynchronous ? 'callback' : 'response';
        const { apiBaseUrl } = getConfig();
        const mappingUrl = apiBaseUrl + '/api/openapi/' + mode + '_map/' + this.props.apiVersion.type + '/' + this.props.apiVersion.majorVersion + '.' + this.props.apiVersion.minorVersion;
        const mapping = await this.getData(mappingUrl, {});
        const apiDefinitionUrl = apiBaseUrl + '/api/openapi/definition/' + this.props.apiVersion.type + '/' + this.props.apiVersion.majorVersion + '.' + this.props.apiVersion.minorVersion;
        const openApiDefinition = await this.getData(apiDefinitionUrl, {});
        this.setState({ mode, mappingUrl, mapping, openApiDefinition });
    };

    getData = async (url, defaultValue) => {
        let data;
        try {
            const response = await axios.get(url);
            data = response.data;
        } catch (e) {
            data = defaultValue;
        }
        return data;
    };

    updateMapping = async updatedMapping => {
        message.loading({ content: 'Saving the mapping...', key: 'saveProgress' });
        await axios.put(this.state.mappingUrl, updatedMapping, { headers: { 'Content-Type': 'application/json' } });
        this.setState({ selectedResource: null, mapping: updatedMapping });
        message.success({ content: 'Saved', key: 'saveProgress', duration: 2 });
    };

    getMappingsFileContentItems = () => {
        const paths = Object.keys(this.state.mapping ? this.state.mapping : {});
        return paths.map(path => {
            const methods = Object.keys(this.state.mapping[path] ? this.state.mapping[path] : {});
            return methods.map(method => {
                const selectedResource = { data: this.state.mapping[path][method], path, method };
                return (
                    <Panel header={method + ' ' + path} key={method + ' ' + path}>
                        <Row>
                            <Col span={24} style={{ textAlign: 'right' }}>
                                <Button
                                    onClick={() => {
                                        this.setState({ selectedResource });
                                    }}
                                >
                  Edit
                                </Button>
                                <Button
                                    className='ml-2'
                                    type='primary'
                                    danger
                                    onClick={async () => {
                                        const updatedMapping = this.state.mapping;
                                        delete updatedMapping[path][method];
                                        await this.updateMapping(updatedMapping);
                                    }}
                                >
                  Delete
                                </Button>
                            </Col>
                        </Row>
                        {
                            this.state.mapping[path][method]
                                ? <Row>
                                    <Col span={24}>
                                        <MappingViewer
                                            selectedResource={selectedResource}
                                        />
                                    </Col>
                                </Row>
                                : null
                        }
                    </Panel>
                );
            });
        });
    };

    render() {
        return (
            <>
                <Modal
                    centered
                    destroyOnClose
                    forceRender={false}
                    title='Mapping Builder'
                    className='w-50 p-3'
                    visible={!!(this.state.selectedResource)}
                    footer={null}
                    onCancel={() => {
                        this.setState({ selectedResource: null });
                    }}
                    maskClosable={false}
                >
                    <MappingEditor
                        selectedResource={this.state.selectedResource}
                        apiVersion={this.props.apiVersion}
                        openApiDefinition={this.state.openApiDefinition}
                        mapping={this.state.mapping}
                        onSave={async resource => {
                            const updatedMapping = this.state.mapping;
                            if(!updatedMapping[resource.path]) {
                                updatedMapping[resource.path] = {};
                            }
                            if(!updatedMapping[resource.path][resource.method]) {
                                updatedMapping[resource.path][resource.method] = {};
                            }
                            updatedMapping[resource.path][resource.method] = resource.data;
                            await this.updateMapping(updatedMapping);
                        }}
                        mode={this.state.mode}
                    />
                </Modal>

                <Row>
                    <Col span={24}>
                        <Card>
                            <Row className='align-items-center'>
                                <Col span={12} />
                                <Col span={12}>
                                    <Button
                                        className='float-right'
                                        type='primary'
                                        onClick={() => {
                                            this.setState({
                                                selectedResource: {
                                                    data: {
                                                        fspip: '',
                                                        successCallback: null,
                                                        errorCallback: null,
                                                    },
                                                },
                                            });
                                        }}
                                    >
                    Add a new Mapping
                                    </Button>
                                </Col>
                            </Row>
                            <Collapse>
                                {this.getMappingsFileContentItems()}
                            </Collapse>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

export default APIMappings;
