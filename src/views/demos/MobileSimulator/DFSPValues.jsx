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
import { Row, Col, Typography, Button, Table, Tag, Progress } from 'antd';
const { Text } = Typography

class DFSPValues extends React.Component {
  state = {
    getDFSPValuesInProgress: false,
    provisioningStatus: '',
    dfsps: {}
  }

  constructor () {
    super()
  }

  componentDidMount = async () => {
  }

  handleAccountsUpdate = (dfspId, accountsData) => {
    if (!this.state.dfsps[dfspId]) {
      this.state.dfsps[dfspId] = {}
    }
    this.state.dfsps[dfspId].accountsData = accountsData

    this.forceUpdate()
    // const progress = data.progress
    // if (progress.status === "SUCCESS" || progress.status === "ERROR") {
    //   if (this.state.progressSteps[data.testCaseName]) {
    //     this.state.progressSteps[data.testCaseName].passedCount++ 
    //   } else {
    //     this.state.progressSteps[data.testCaseName] = {
    //       passedCount: 1,
    //       totalCount: data.testCaseRequestCount
    //     }
    //   }
    //   this.forceUpdate()
    // }
  }

  handleNotificationEvents = (event) => {
    // console.log(event)
    switch(event.type) {
      case 'dfspAccountsUpdate':
      {
        if (event.data && event.data.dfspId && event.data.accountsData) {
          this.handleAccountsUpdate(event.data.dfspId, event.data.accountsData)
        }
        break
      }
      case 'testCaseFinished':
      {
        this.setState({getDFSPValuesInProgress: false})
        break
      }
      case 'testCaseTerminated':
      {
        this.setState({getDFSPValuesInProgress: false})
        break
      }
    }
  }

  handleDFSPValues = async (idNumber) => {
    this.setState({getDFSPValuesInProgress: true})
    const resp = await this.props.outboundService.getDFSPValues()
  }

  render() {
    const columns = [
      {
        title: 'DFSP ID',
        dataIndex: 'dfspId',
      },
      {
        title: 'Position',
        dataIndex: 'position',
      },
      {
        title: 'Settlement',
        dataIndex: 'settlement',
      },
    ];

    const dfspValuesData = Object.entries(this.state.dfsps).map((dfspItem,index) => {
      const positionData = dfspItem[1].accountsData.filter(item => item.ledgerAccountType === 'POSITION').reduce((prevVal,currVal,idx) => {
        const detail = currVal.currency + ': ' + currVal.value
        return idx == 0 ? detail : prevVal + ', ' + detail
      }, '')
      const settlementData = dfspItem[1].accountsData.filter(item => item.ledgerAccountType === 'SETTLEMENT').reduce((prevVal,currVal,idx) => {
        const detail = currVal.currency + ': ' + currVal.value
        return idx == 0 ? detail : prevVal + ', ' + detail
      }, '')
      return {
        key: index,
        dfspId: dfspItem[0],
        position: positionData,
        settlement: settlementData
      }
    })

    return (
      <>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Button
            onClick={this.handleDFSPValues}
            loading={this.state.getDFSPValuesInProgress}
          >
            Get DFSP Data
          </Button>
        </Col>
      </Row>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={dfspValuesData}
            pagination={false}
            scroll={{ y: 540 }}
            loading={this.state.getDFSPValuesInProgress}
            footer={(pageData) => {
              return (
                <Text strong>{this.state.provisioningStatus}</Text>
              );
            }}
          />
        </Col>
      </Row>
      </>

    );
  }
}

export default DFSPValues;
