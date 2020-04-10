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

// reactstrap components
import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Row,
  Button,
  Col,
} from "reactstrap";

import { Input, Checkbox, Divider, Tooltip, message, Tag, Icon } from 'antd';
import 'antd/dist/antd.css';

import Header from "../../components/Headers/Header.jsx";
import axios from 'axios';
import RulesEditor from '../rules/RuleEditor'
import RuleViewer from '../rules/RuleViewer'
import getConfig from '../../utils/getConfig'


class ParamInput extends React.Component {

  inputValue = null

  handleValueChange = (event) => {
    if ((typeof this.props.value) === 'boolean') {
      this.inputValue = event.target.checked
    } else {
      this.inputValue = event.target.value
    }
    this.props.onChange(this.props.itemKey, this.inputValue)
  }

  render() {

    const inputElement = (
      (typeof this.props.value) === 'boolean'
      ? (
        <Checkbox checked={this.props.value} onChange={this.handleValueChange}></Checkbox>
      )
      : (
        <Input
          className="form-control-alternative"
          type="text"
          defaultValue={this.props.value}
          value={this.props.value}
          onChange={this.handleValueChange}
          disabled={false}
        />
      )
    )

    return (
      <Row className="mb-4">
        <Col lg="4">
          <h4>{this.props.name}</h4>
        </Col>
        <Col lg="8">
          {
            this.props.tooltip
            ? (
            <Tooltip placement="topLeft" title={this.props.tooltip}>{inputElement}</Tooltip>
            )
            : inputElement
          }
        </Col>
      </Row>
    )
  }
}

class ConfigurationEditor extends React.Component {

  handleParamValueChange = (name, value) => {
    this.props.config[name] = value
    this.forceUpdate()
  }

  handleSave = () => {
    this.props.onSave(this.props.config)
  }

  render () {
    return (
      <>
      <Row>
        <Col className="mb-5 mb-xl-0" xl="12">
          <Card className="card-profile shadow">
            <CardHeader>
              <div className="d-flex float-right">
                <Button
                  className="float-right"
                  color="primary"
                  href="#pablo"
                  onClick={this.handleSave}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <ParamInput
                name="Override with Environment Variables"
                tooltip="Check this if you are passing the configuration through environment variables. The below configuration may be overridden by the environment variables." 
                itemKey="OVERRIDE_WITH_ENV"
                value={this.props.config.OVERRIDE_WITH_ENV}
                onChange={this.handleParamValueChange} />
              <Divider />
              <ParamInput name="Callback URL" itemKey="CALLBACK_ENDPOINT" value={this.props.config.CALLBACK_ENDPOINT} onChange={this.handleParamValueChange} />
              <ParamInput name="FSP ID" itemKey="FSPID" value={this.props.config.FSPID} onChange={this.handleParamValueChange} />
              <ParamInput name="Send Callback" itemKey="SEND_CALLBACK_ENABLE" value={this.props.config.SEND_CALLBACK_ENABLE} onChange={this.handleParamValueChange} />
              <ParamInput name="Validate Transfers with previous quote" itemKey="TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES" value={this.props.config.TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Version Negotiation Support" itemKey="VERSIONING_SUPPORT_ENABLE" value={this.props.config.VERSIONING_SUPPORT_ENABLE} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Inbound JWS Validation" itemKey="VALIDATE_INBOUND_JWS" value={this.props.config.VALIDATE_INBOUND_JWS} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Inbound JWS Validation for PUT /parties" itemKey="VALIDATE_INBOUND_PUT_PARTIES_JWS" value={this.props.config.VALIDATE_INBOUND_PUT_PARTIES_JWS} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Outbound JWS Signing" itemKey="JWS_SIGN" value={this.props.config.JWS_SIGN} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Outbound JWS Signing for PUT /parties" itemKey="JWS_SIGN_PUT_PARTIES" value={this.props.config.JWS_SIGN_PUT_PARTIES} onChange={this.handleParamValueChange} />
              <ParamInput name="Connection Manager API URL" itemKey="CONNECTION_MANAGER_API_URL" value={this.props.config.CONNECTION_MANAGER_API_URL} onChange={this.handleParamValueChange} />
              <ParamInput name="Inbound Mutual TLS" itemKey="INBOUND_MUTUAL_TLS_ENABLED" value={this.props.config.INBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
              <ParamInput name="Outbound Mutual TLS" itemKey="OUTBOUND_MUTUAL_TLS_ENABLED" value={this.props.config.OUTBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
            </CardBody>
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}

class ParamView extends React.Component {

  render() {
    return (
      <Row className="mb-4">
        <Col lg="6">
          <h4>{this.props.name}</h4>
        </Col>
        <Col lg="6">
          {
            (typeof this.props.value) === 'boolean'
            ? this.props.value ? (<Icon type="check" />) : (<Icon type="close" />)
            : (
              <Tag color="red">{this.props.value}</Tag>
            )
          }
        </Col>
      </Row>
    )
  }
}

class ConfigurationViewer extends React.Component {

  render () {
    return (
      <>
      <Row>
        <Col className="mb-5 mb-xl-0" xl="12">
          <Card className="card-profile shadow">
            <CardBody>
              <ParamView name="Callback URL" value={this.props.config.CALLBACK_ENDPOINT} />
              <ParamView name="FSP ID" value={this.props.config.FSPID} />
              <ParamView name="Send Callback" value={this.props.config.SEND_CALLBACK_ENABLE} />
              <ParamView name="Validate Transfers with previous quote" value={this.props.config.TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES} />
              <ParamView name="Enable Version Negotiation Support" value={this.props.config.VERSIONING_SUPPORT_ENABLE} />
              <ParamView name="Enable Inbound JWS Validation" value={this.props.config.VALIDATE_INBOUND_JWS} />
              <ParamView name="Enable Inbound JWS Validation for PUT /parties" value={this.props.config.VALIDATE_INBOUND_PUT_PARTIES_JWS} />
              <ParamView name="Enable Outbound JWS Signing" value={this.props.config.JWS_SIGN} />
              <ParamView name="Enable Outbound JWS Signing for PUT /parties" value={this.props.config.JWS_SIGN_PUT_PARTIES} />
              <ParamView name="Connection Manager API URL" value={this.props.config.CONNECTION_MANAGER_API_URL} />
              <ParamView name="Enable Inbound Mutual TLS" value={this.props.config.INBOUND_MUTUAL_TLS_ENABLED} />
              <ParamView name="Enable Outbound Mutual TLS" value={this.props.config.OUTBOUND_MUTUAL_TLS_ENABLED} />
            </CardBody>
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}

class Settings extends React.Component {

  constructor() {
    super();
    this.state = {
      userConfigRuntime: {},
      userConfigStored: {},
    };
  }


  componentDidMount() {
    this.getUserConfiguration()
  }

  getUserConfiguration = async () => {
    message.loading({ content: 'Getting user config ...', key: 'getUserConfigProgress' });
    const { apiBaseUrl } = getConfig()
    console.log('GVK', apiBaseUrl)
    const response = await axios.get(apiBaseUrl + "/api/config/user")
    const userConfigRuntime = response.data.runtime
    const userConfigStored = response.data.stored
    await this.setState(  { userConfigRuntime, userConfigStored } )
    message.success({ content: 'Loaded', key: 'getUserConfigProgress', duration: -1 });
  }

  handleSaveUserConfig = async (newConfig) => {
    message.loading({ content: 'Saving user config ...', key: 'saveUserConfigProgress' });
    const { apiBaseUrl } = getConfig()
    await axios.put(apiBaseUrl + "/api/config/user", newConfig, { headers: { 'Content-Type': 'application/json' } })
    await this.getUserConfiguration()
    message.success({ content: 'Saved', key: 'saveUserConfigProgress', duration: 2 });
  }


  render() {
    var newFileName = ''
    var newFileNameErrorMessage = ''
    const newFileCreateConfirm = () => {
      // Validate filename format
      // TODO: Some additional validation for the filename format
      if (!newFileName.endsWith('.json')) {
        message.error('Filename should be ended with .json');
        return
      }

      if (/\s/.test(newFileName)) {
        message.error('Filename contains spaces');
        return
      }

      this.setState({ mode: null})
      this.handleNewRulesFileClick(newFileName)
    }

    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row>
            <Col className="mb-5 mb-xl-0" xl="5">
              <Card className="card-profile shadow">
                <CardHeader className="border-0">
                  <h3 className="mb-0">Runtime Global Configuration</h3>
                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <ConfigurationViewer config={this.state.userConfigRuntime} />
                </CardBody>
              </Card>
            </Col>
            <Col xl="7">
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <h3 className="mb-0">Edit Global Configuration</h3>
                </CardHeader>
                <CardBody>
                  <ConfigurationEditor config={this.state.userConfigStored} onSave={this.handleSaveUserConfig} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default Settings;
