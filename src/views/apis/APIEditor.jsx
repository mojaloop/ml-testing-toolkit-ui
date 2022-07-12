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
import React from "react";

import { Modal, Input, Card, Row, Col, Button, Typography } from 'antd'; 
import 'antd/dist/antd.css';

import axios from 'axios';
import { getConfig } from '../../utils/getConfig'
import APIMappings from './APIMappings'

const {Text} = Typography

class APIEditor extends React.Component {

  constructor() {
    super();
    this.state = {
      apiMappingsVisible: false,
      hostnames: [],
      prefix: '',
      valuesChanged: false
    };
  }

  componentDidMount() {
    this.componentSetState()
  }  

  componentSetState = async () => {
    this.setState({ hostnames: this.props.apiVersion.hostnames,
      prefix: this.props.apiVersion.prefix
    })
  }


  handleSave = async () => {
    const res = await axios.put(this.getDefinitionVersionURL(),{
      hostnames: this.state.hostnames,
      prefix: this.state.prefix
    })
    this.setState({valuesChanged: false})
    this.props.onUpdated()
    return res.data
  }

  getDefinitionVersionURL = () => {
    const { apiBaseUrl } = getConfig()
    if (this.state.selectedApiIndex !== null) {
      const url = apiBaseUrl + '/api/openapi/definition/' +  this.props.apiVersion.type + '/' + this.props.apiVersion.majorVersion + '.' + this.props.apiVersion.minorVersion
      return url
    } else {
      return ''
    }
  }

  showPrefix() {
    return (
      <Row className='mt-2'>
        <Col span={12}>
          <Text>Prefix</Text>
        </Col>
        <Col span={12}>
          <Row gutter={8}>
            <Col span={23}>
              <Input
                value={this.state.prefix}
                onChange={(e) => this.setState({prefix: e.target.value, valuesChanged: true})}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }
  
  showHostNames() {
    return (
      <Row className='mt-2'>
        <Col span={12}>
          <Text>Hostnames (Comma-separated values)</Text>
        </Col>
        <Col span={12}>
          <Row gutter={8}>
            <Col span={23}>
              <Input
                value={this.state.hostnames}
                onChange={(e) => this.setState({hostnames: e.target.value ? e.target.value.split(',') : [], valuesChanged: true})}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }

  render() {

    return (
      <>
        <Modal
          title='Mapping'
          style={{ top: 20 }}
          className="p-3"
          width='90%'
          destroyOnClose
          footer={null}
          visible={this.state.apiMappingsVisible}
          onCancel={ e => {
            this.setState({apiMappingsVisible: false})
          }}
        >
          <APIMappings
            apiVersion={this.props.apiVersion}
            openApiDefinition={this.props.openApiDefinition}
          />
        </Modal>
          <Row>
            <Col span={24}> 
              <Card>
                <Row>
                <Col span={12}>
                  <Text strong>
                    {this.props.apiVersion?.type + ' ' + this.props.apiVersion?.majorVersion + '.' + this.props.apiVersion?.minorVersion}
                  </Text>
                  </Col>
                  <Col span={12}>
                    <Button
                      className="ml-2 float-right"
                      type="primary"
                      onClick={ e => {
                        this.setState({apiMappingsVisible: true})
                      }}
                      disabled={!(this.props.apiVersion && (this.props.apiVersion.asynchronous ? true : false))}
                    >
                      Edit Asynchronous Callback Mappings
                    </Button>
                  </Col>
                </Row>
                {this.showPrefix()}
                {this.showHostNames()}
                <Row>
                  <Col span={12}>
                    <Button
                      danger
                      type="primary"
                      onClick={this.handleSave}
                      disabled={!this.state.valuesChanged}
                    >
                      Save
                    </Button>
                    </Col>
                </Row>
              </Card>
            </Col>
          </Row>
      </>
    );
  }
}

export default APIEditor;
