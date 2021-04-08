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
import React from "react";
import { getConfig } from '../../utils/getConfig'
import APIDocViewer from './APIDocViewer'
import axios from 'axios';
import { Select, Row, Col, Card } from 'antd';

const { Option } = Select;

class APIDocs extends React.Component {
  state = {
    apiVersions: [],
    selectedVersion: null
  }

  getApiVersions = async () => {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/openapi/api_versions")
    return response.data
  }
  getApiVersionOptions = () => {
    this.apiVersionOptions = this.state.apiVersions.map((item, index) => {
      return (
        <Option key={index} value={JSON.stringify(item)}>{item.type} {item.majorVersion}.{item.minorVersion}</Option>
      )
    })
    return this.apiVersionOptions
  }

  getApiVersionValue = () => {
    if(this.state.selectedVersion) {
      return JSON.stringify(this.state.selectedVersion)
    } else {
      return null
    }
  }

  componentDidMount = async () => {
    const apiVersions = await this.getApiVersions()
    this.setState({ apiVersions, selectedVersion: apiVersions[0] })
  }

  handleApiVersionSelect = (eventKey) => {
    this.setState({ selectedVersion: JSON.parse(eventKey) })
  }

  getSelectedVersionURL = () => {
    const { apiBaseUrl } = getConfig()
    if (this.state.selectedVersion) {
      const url = apiBaseUrl + '/api/openapi/definition/' + this.state.selectedVersion.type + '/' + this.state.selectedVersion.majorVersion + '.' + this.state.selectedVersion.minorVersion
      return url
    } else {
      return ''
    }
  }

  render() {
    return (
      <>
        {/* Page content */}
          <Row className="mt--7 mb-4">
            <Col span={24}>
              <Row>
                <Col span={24}>
                <Select onChange={this.handleApiVersionSelect}
                  disabled={(this.props.value? true : false)}
                  style={{ width: 300 }}
                  className="float-right"
                  placeholder="Select an API"
                  value={this.getApiVersionValue()}
                >
                {this.getApiVersionOptions()}
                </Select>
              </Col>
              </Row>
              <Row>
              <Col span={24}>
              {
                this.state.selectedVersion
                ? (
                  <APIDocViewer
                    specUrl={this.getSelectedVersionURL()}
                  />
                )
                : null
              }
              </Col>
              </Row>
            </Col>
          </Row>
      </>
    );
  }
}

export default APIDocs;
