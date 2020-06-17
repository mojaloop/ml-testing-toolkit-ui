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

import { Input, Checkbox, Divider, Tooltip, message, Tag, Icon, notification, Modal, Table, Select } from 'antd';
import { BulbTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';

import Header from "../../components/Headers/Header.jsx";
import axios from 'axios';
import RulesEditor from '../rules/RuleEditor'
import RuleViewer from '../rules/RuleViewer'
import getConfig from '../../utils/getConfig'
import { getServerConfig } from '../../utils/getConfig'
import FileDownload from 'js-file-download'

function buildFileSelector( multi = false ){
  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  return fileSelector;
}


const readFileAsync = (file, type) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    switch (type) {
      case 'readAsArrayBuffer':
        reader.readAsArrayBuffer(file)
        break;
      default: 
        reader.readAsText(file)
    }
  })
}

class ParamInput extends React.Component {

  inputValue = null

  handleValueChange = (event) => {
    if ((typeof this.props.value) === 'boolean') {
      this.inputValue = event.target.checked
    } else {
      this.inputValue = event.target.value
    }
    this.props.onChange(this.props.itemRef, this.props.itemKey, this.inputValue)
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

class EndpointInput extends React.Component {

  inputValue = null

  handleValueChange = (event) => {
    this.inputValue = event.target.value
    this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.value)
  }

  render() {

    const inputElement = (
      <Input
        className="form-control-alternative"
        type="text"
        defaultValue={this.props.value}
        value={this.props.value}
        onChange={(event) => {
          this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.value)
        }}
        disabled={false}
      />
    )

    return (
      <Tooltip placement="topLeft" title={this.props.tooltip}>{inputElement}</Tooltip>
    )
  }
}

class CallbackResourceEndpointsInput extends React.Component {

  inputValue = null

  handleValueChange = (event) => {
    this.inputValue = event.target.checked
    this.props.onChange(this.props.itemRef, this.props.itemKey, event.target.checked)
  }

  render() {

    const inputElement = (
      <Checkbox checked={this.props.value} onChange={this.handleValueChange}></Checkbox>
    )

    return (
      <Row className="mb-4">
        <Col lg="4">
          <h4>{this.props.name}</h4>
        </Col>
        <Col lg="1">
          {
            this.props.tooltip
            ? (
            <Tooltip placement="topLeft" title={this.props.tooltip}>{inputElement}</Tooltip>
            )
            : inputElement
          }
        </Col>
        <Col lg="1">
          <CallBackResourceEndpoints config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.props.handleParamValueChange} handleSave={this.props.handleSave} />
        </Col>
      </Row>
    )
  }
}

class ConfigurationEditor extends React.Component {

  constructor() {
    super();
    this.state = {
      exportDialogVisible: false,
      importDialogVisible: false,
      importExportOptions: {
        rules_response: 'Sync Response Rules',
        rules_validation: 'Validation Rules (Error callbacks)',
        rules_callback: 'Callback Rules (Success Callback)',
        'user_config.json': 'Settings'
      },
      exportSelectedRowKeys: [],
      importSelectedRowKeys: []
    };
  }

  componentDidMount() {
    this.specFilesSelector = buildFileSelector();
    this.specFilesSelector.addEventListener ('input', async (e) => {
      if (e.target.files) {
        await this.handleImport(e.target.files[0])
        await this.props.doRefresh()
        this.specFilesSelector.value = null
      }
    })
  }

  handleParamValueChange = (itemRef, name, value) => {
    itemRef[name] = value
    this.forceUpdate()
  }

  handleSave = () => {
    this.props.onSave(this.props.config)
  }

  handleImport = async (file_to_read) => {
    message.loading({ content: 'Importing ...', key: 'importProgress' });
    try {
      const { apiBaseUrl } = getConfig()
      if (this.state.importSelectedRowKeys.length === 1 && this.state.importSelectedRowKeys[0] === 'user_config.json' && file_to_read.name.endsWith('.json')) {
        const settings = JSON.parse(await readFileAsync(file_to_read))
        await axios.put(apiBaseUrl + "/api/config/user", settings, { headers: { 'Content-Type': 'application/json' }})
      } else {
        await axios.post(apiBaseUrl + "/api/settings/import", 
          { buffer: Buffer.from(await readFileAsync(file_to_read, 'readAsArrayBuffer')), }, 
          { params: { options: this.state.importSelectedRowKeys }, headers: { 'Content-Type': 'application/json' }})
      }
      message.success({ content: 'Import completed', key: 'importProgress', duration: 2 })
    } catch (err) {
      message.error({ content: err.response ? err.response.data : err.message, key: 'importProgress', duration: 6 })
    }
    this.setState({importSelectedRowKeys: []})
  }

  handleExport = async () => {
    message.loading({ content: 'Export all rules and settings...', key: 'exportFileProgress' });
    try {
      let filename
      let data
      if (this.state.exportSelectedRowKeys.length === 1 && this.state.exportSelectedRowKeys[0] === 'user_config.json') {
        filename = `user_config_${new Date().toISOString()}.json`
        data = JSON.stringify(this.props.config, null, 2)
      } else {
        const { apiBaseUrl } = getConfig()
        const exportRulesResponse = await axios.get(apiBaseUrl + '/api/settings/export', {params: { options: this.state.exportSelectedRowKeys }})
        filename = `${exportRulesResponse.data.body.namePrefix}_${new Date().toISOString()}.zip`
        data = Buffer.from(Buffer.from(exportRulesResponse.data.body.buffer.data))
      }
      FileDownload(data, filename)
      message.success({ content: 'Export rules and settings completed', key: 'exportFileProgress', duration: 2 })
    } catch (err) {
      message.error({ content: err.response ? err.response.data : err.message, key: 'exportFileProgress', duration: 6 })
    }
  }

  generageTableRowData = (obj) => {
    const options = []
    Object.keys(obj).forEach((element) => {
      options.push({key: element, option: obj[element]})
    })
    return options
  }

  render () {
    return (
      <>
      <Row>
        <Col className="mb-5 mb-xl-0" xl="12">
          <Card className="card-profile shadow">
            <CardHeader>
              <div className="d-flex float-right">                
                <Button color="success" size="sm" onClick={(e) => {
                  this.setState({exportDialogVisible: true})
                }}>
                  Export
                </Button>
                {
                  this.state.exportDialogVisible
                  ?
                  <Modal
                    title="Export"
                    visible={this.state.exportDialogVisible}
                    width='50%'
                    onOk={async () => {
                      if (this.state.exportSelectedRowKeys.length !== 0) {
                        await this.handleExport()
                        this.setState({exportDialogVisible: false})
                        this.setState({exportSelectedRowKeys: []})
                      } else {
                        message.error({ content: 'please select at least one option', key: 'importEmptySelection', duration: 6 })
                      }
                    }}
                    onCancel={() => {
                      this.setState({exportDialogVisible: false})
                      this.setState({exportSelectedRowKeys: []})
                    }}
                  >
                  <Table
                    rowSelection={{type: 'checkbox', selectedRowKeys: this.state.exportSelectedRowKeys, onChange: (selectedRowKeys) => {
                      this.setState({exportSelectedRowKeys: selectedRowKeys})
                    }}}
                    columns={[{title: 'Select all', dataIndex: 'option'}]}
                    dataSource={this.generageTableRowData(this.state.importExportOptions)}
                  />
                  </Modal>
                  :
                  null
                }
                <Button color="info" size="sm" onClick={(e) => {
                  this.setState({importDialogVisible: true})
                }}>
                  Import
                </Button>
                {
                  this.state.importDialogVisible
                  ?
                  <Modal
                    title="Import"
                    visible={this.state.importDialogVisible}
                    width='50%'
                    onOk={() => {
                      if (this.state.importSelectedRowKeys.length !== 0) {
                        this.specFilesSelector.click();
                        this.setState({importDialogVisible: false})
                      } else {
                        message.error({ content: 'please select at least one option', key: 'importEmptySelection', duration: 6 })
                      }
                    }}
                    onCancel={() => {
                      this.setState({importSelectedRowKeys: []})
                      this.setState({importDialogVisible: false})
                    }}
                  >
                    <Table
                      rowSelection={{type: 'checkbox', selectedRowKeys: this.state.importSelectedRowKeys, onChange: (selectedRowKeys) => {
                        this.setState({importSelectedRowKeys: selectedRowKeys})
                      }}}
                      columns={[{title: 'Select all', dataIndex: 'option'}]}
                      dataSource={this.generageTableRowData(this.state.importExportOptions)}
                    />
                  </Modal>
                  :
                  null
                }
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
              <ParamInput name="Callback URL" itemRef={this.props.config} itemKey="CALLBACK_ENDPOINT" value={this.props.config.CALLBACK_ENDPOINT} onChange={this.handleParamValueChange} />
              <ParamInput name="FSP ID" itemRef={this.props.config} itemKey="FSPID" value={this.props.config.FSPID} onChange={this.handleParamValueChange} />
              <ParamInput name="Send Callback" itemRef={this.props.config} itemKey="SEND_CALLBACK_ENABLE" value={this.props.config.SEND_CALLBACK_ENABLE} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Version Negotiation Support" itemRef={this.props.config}  itemKey="VERSIONING_SUPPORT_ENABLE" value={this.props.config.VERSIONING_SUPPORT_ENABLE} onChange={this.handleParamValueChange}  />
              <Divider />
              <CallbackResourceEndpointsInput name="Enable Callback resource endpoints" itemRef={this.props.config.CALLBACK_RESOURCE_ENDPOINTS}  itemKey="enabled" value={this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled} onChange={this.handleParamValueChange} config={this.props.config} configRuntime={this.props.configRuntime} handleParamValueChange={this.handleParamValueChange} handleSave={this.handleSave} />
              <Divider />
              <ParamInput name="Validate Transfers with previous quote" itemRef={this.props.config}  itemKey="TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES" value={this.props.config.TRANSFERS_VALIDATION_WITH_PREVIOUS_QUOTES} onChange={this.handleParamValueChange} />
              <ParamInput name="Validate IlpPacket in transfers" itemRef={this.props.config}  itemKey="TRANSFERS_VALIDATION_ILP_PACKET" value={this.props.config.TRANSFERS_VALIDATION_ILP_PACKET} onChange={this.handleParamValueChange} />
              <ParamInput name="Validate Condition in transfers" itemRef={this.props.config} itemKey="TRANSFERS_VALIDATION_CONDITION" value={this.props.config.TRANSFERS_VALIDATION_CONDITION} onChange={this.handleParamValueChange} />
              <ParamInput name="ILP Secret" itemKey="ILP_SECRET" itemRef={this.props.config}  value={this.props.config.ILP_SECRET} onChange={this.handleParamValueChange} />
              <Divider />
              <ParamInput name="Enable Inbound JWS Validation" itemRef={this.props.config} itemKey="VALIDATE_INBOUND_JWS" value={this.props.config.VALIDATE_INBOUND_JWS} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Inbound JWS Validation for PUT /parties" itemRef={this.props.config}  itemKey="VALIDATE_INBOUND_PUT_PARTIES_JWS" value={this.props.config.VALIDATE_INBOUND_PUT_PARTIES_JWS} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Outbound JWS Signing" itemRef={this.props.config}  itemKey="JWS_SIGN" value={this.props.config.JWS_SIGN} onChange={this.handleParamValueChange} />
              <ParamInput name="Enable Outbound JWS Signing for PUT /parties" itemRef={this.props.config}  itemKey="JWS_SIGN_PUT_PARTIES" value={this.props.config.JWS_SIGN_PUT_PARTIES} onChange={this.handleParamValueChange} />
              <Divider />
              <ParamInput name="Connection Manager API URL" itemRef={this.props.config}  itemKey="CONNECTION_MANAGER_API_URL" value={this.props.config.CONNECTION_MANAGER_API_URL} onChange={this.handleParamValueChange} />
              <Divider />
              <ParamInput name="Inbound Mutual TLS" itemRef={this.props.config} itemKey="INBOUND_MUTUAL_TLS_ENABLED" value={this.props.config.INBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
              <ParamInput name="Outbound Mutual TLS" itemRef={this.props.config} itemKey="OUTBOUND_MUTUAL_TLS_ENABLED" value={this.props.config.OUTBOUND_MUTUAL_TLS_ENABLED} onChange={this.handleParamValueChange} />
              <Divider />
              <ParamInput name="Advanced Features" itemRef={this.props.config} itemKey="ADVANCED_FEATURES_ENABLED" value={this.props.config.ADVANCED_FEATURES_ENABLED} onChange={this.handleParamValueChange} />
            </CardBody>
          </Card>
        </Col>
      </Row>
      </>
    )
  }
}

class CallBackResourceEndpoints extends React.Component {

  constructor() {
    super();
    this.state = {
      callbackResourceEndpoints: false,
      callbackResourceEndpointsLocal: [],
      callbackResourceEndpointsInputs: [],
      callbackResourceEndpointsColumns: [
        { title: 'method', dataIndex: 'method', key: 'method', width: '10%'},
        { title: 'path', dataIndex: 'path', key: 'path', width: '40%'},
        { title: 'endpoint', dataIndex: 'endpoint', key: 'endpoint', width: '40%'},
        { dataIndex: '', key: 'delete', width: '10%', render: (text, record) => (
          <Button color="danger" size="sm" onClick={(e) => {
            this.setState({callbackResourceEndpointsLocal: this.state.callbackResourceEndpointsLocal.filter((local, index) => {
              return (+record.key !== index)
            })})
          }}>Delete</Button>
        )}
      ]
    };
  }

  componentDidMount() {}


  getCallbackResourceEndpointsLocal = () => {
    const local = []
    this.props.config.CALLBACK_RESOURCE_ENDPOINTS.endpoints.forEach(endpoint => {
      local.push({...endpoint})
    })
    return local
  }

  getCallbackResourceEndpointsInputs = () => {
    const inputs = []
    this.state.callbackResourceEndpointsLocal.forEach((endpoint, index) => {
      const endpointInputs = {}
      Object.keys(endpoint).forEach(key => {
        endpointInputs[key] = 
          <>
            {
              (key === 'method') ?
                <Select style={{width: '100px'}} defaultValue='put' onChange={(value) => {
                  this.props.handleParamValueChange(endpoint, key, value)
                }}>
                  <Select.Option value="put">put</Select.Option>
                </Select>
              :
              <EndpointInput itemRef={endpoint} itemKey={key} value={endpoint[key]} onChange={this.props.handleParamValueChange} />
            }
          </>
      })
      inputs.push({key: index + "", ...endpointInputs})
    })
    return inputs
  }

  render () {
    return (
      <>
        {
          this.props.config.CALLBACK_RESOURCE_ENDPOINTS && this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled
          ?
          <>
          <Button color="info" size="sm" onClick={(e) => {
            this.setState({callbackResourceEndpointsLocal: this.getCallbackResourceEndpointsLocal()})
            this.setState({callbackResourceEndpointsVisible: true})
          }}>
            Edit
          </Button>
          {
            this.state.callbackResourceEndpointsVisible
            ?
            <Modal
            title="Edit Callback resources endpoints"
            visible={this.state.callbackResourceEndpointsVisible}
            width='70%'
            onOk={() => {
              this.props.config.CALLBACK_RESOURCE_ENDPOINTS.endpoints = this.state.callbackResourceEndpointsLocal
              if (!this.props.configRuntime.CALLBACK_RESOURCE_ENDPOINTS.enabled) {
                this.props.config.CALLBACK_RESOURCE_ENDPOINTS.enabled = true
              }
              this.props.handleSave()
              this.setState({callbackResourceEndpointsVisible: false})
            }}
            onCancel={() => {
              this.setState({callbackResourceEndpointsVisible: false})
            }}
            >
              <Row>
                <Col>
                  <Button color="info" size="sm" onClick={(e) => {
                  const newEndpoint = {method: 'put', path: null, endpoint: null}
                  this.setState({callbackResourceEndpointsLocal: [...this.state.callbackResourceEndpointsLocal, newEndpoint]})
                }}>Add Callback Resource Endpoint</Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Table
                    columns={this.state.callbackResourceEndpointsColumns}
                    dataSource={this.getCallbackResourceEndpointsInputs()}
                  />
                </Col>
              </Row>
            </Modal>
            :
            null
          }
          </>
          :
          null
        }
      </>
    )
  }
}
// class ParamView extends React.Component {

//   render() {
//     return (
//       <Row className="mb-4">
//         <Col lg="6">
//           <h4>{this.props.name}</h4>
//         </Col>
//         <Col lg="6">
//           {
//             (typeof this.props.value) === 'boolean'
//             ? this.props.value ? (<Icon type="check" />) : (<Icon type="close" />)
//             : (
//               <Tag color="red">{this.props.value}</Tag>
//             )
//           }
//         </Col>
//       </Row>
//     )
//   }
// }

class Settings extends React.Component {

  constructor() {
    super();
    this.state = {
      userConfigRuntime: {
        CALLBACK_RESOURCE_ENDPOINTS: {
          enabled: false,
          endpoints: []
        }
      },
      userConfigStored: {
        CALLBACK_RESOURCE_ENDPOINTS: {
          enabled: false,
          endpoints: []
        }
      }
    };
  }

  componentDidMount() {
    this.getUserConfiguration()
  }

  getUserConfiguration = async () => {
    message.loading({ content: 'Getting user config ...', key: 'getUserConfigProgress' });
    const { userConfigRuntime, userConfigStored } = await getServerConfig()
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
    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7" fluid>
          <Row>
            <Col>
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <h3 className="mb-0">Edit Global Configuration</h3>
                </CardHeader>
                <CardBody>
                  <ConfigurationEditor config={this.state.userConfigStored} configRuntime={this.state.userConfigRuntime} onSave={this.handleSaveUserConfig} doRefresh={this.getUserConfiguration} />
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
