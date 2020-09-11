/*!

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import { RedocStandalone } from 'redoc';
import getConfig from '../utils/getConfig'
import axios from 'axios';
import { Select, Row, Col } from 'antd';
// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  Container,
} from "reactstrap";

import Header from "../components/Headers/Header.jsx";

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
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row className="mb-4">
          <div className="col">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Select onChange={this.handleApiVersionSelect}
                  disabled={(this.props.value? true : false)}
                  style={{ width: 300 }}
                  className="float-right"
                  placeholder="Select an API"
                  value={this.getApiVersionValue()}
                >
                {this.getApiVersionOptions()}
                </Select>
                <h3 className="mb-0">API Documentation</h3>
              </CardHeader>
              <CardBody>
              {
                this.state.selectedVersion
                ? (
                  <RedocStandalone specUrl={this.getSelectedVersionURL()}
                    options={{
                      nativeScrollbars: true,
                      theme: { colors: { primary: { main: '#dd5522' } } },
                    }}
                  />
                )
                : null
              }

              </CardBody>
            </Card>
            </div>
          </Row>
        </Container>
      </>
    );
  }
}

export default APIDocs;
