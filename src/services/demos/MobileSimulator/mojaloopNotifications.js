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

import socketIOClient from "socket.io-client";
import getConfig from '../../../utils/getConfig'
import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib'

class NotificationService {
  logTypes = {
    outbound: {
      socket: null,
      socketTopic: "newOutboundLog"
    },
    inbound: {
      socket: null,
      socketTopic: "newLog"
    },
    outboundProgress: {
      socket: null,
      socketTopic: "outboundProgress"
    }
  }
  notificationEventFunction = () => {}

  setNotificationEventListener (notificationEventFunction) {
    this.notificationEventFunction = notificationEventFunction
  }

  apiBaseUrl = ''
  sessionId = '123'

  constructor () {
    const { apiBaseUrl } = getConfig()
    this.apiBaseUrl = apiBaseUrl
    this.sessionId = TraceHeaderUtils.generateSessionId()
    for (const logType of Object.keys(this.logTypes)) {
      const item = this.logTypes[logType]
      item.socket = socketIOClient(this.apiBaseUrl)
      item.socket.on(item.socketTopic + '/' + this.sessionId, log => {
        this.handleNotificationLog( {...log, internalLogType: logType})
      });
    }
  }

  getSessionId () {
    return this.sessionId
  }

  disconnect () {
    for (const logType of Object.keys(this.logTypes)) {
      this.logTypes[logType].socket.disconnect()
    }
  }

  notifyPayerMonitorLog = (log) => {
    // Monitoring Logs
    this.notificationEventFunction({
      category: 'payerMonitorLog',
      type: 'log',
      data: {
        log: log
      }
    })
  }

  notifyPayeeMonitorLog = (log) => {
    // Monitoring Logs
    this.notificationEventFunction({
      category: 'payeeMonitorLog',
      type: 'log',
      data: {
        log: log
      }
    })
  }

  notifySettingsTestCaseProgress = (progress) => {
    const template = require('./template_provisioning.json')
    if (progress.status === 'FINISHED') {
      this.notificationEventFunction({
        category: 'settingsLog',
        type: 'testCaseFinished',
        data: {
          progress: progress
        }
      })
      // progress.totalResult
    } else if (progress.status === 'TERMINATED') {
      this.notificationEventFunction({
        category: 'settingsLog',
        type: 'testCaseTerminated',
        data: {
          progress: progress
        }
      })
    } else {
      let testCase = template.test_cases.find(item => item.id === progress.testCaseId)
      if (testCase) {
        // let request = testCase.requests.find(item => item.id === progress.requestId)
        // Update total passed count
        // const passedCount = (progress.testResult) ? progress.testResult.passedCount : 0
        // this.state.totalPassedCount += passedCount
        this.notificationEventFunction({
          category: 'settingsLog',
          type: 'testCaseProgress',
          data: {
            testCaseName: testCase.name,
            testCaseRequestCount: testCase.requests.length,
            progress: progress
          }
        })
      }
    }

  }

  notifyDFSPValues = (progress) => {
    if (progress.status === 'FINISHED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'getDFSPValuesFinished',
        data: {
          result: progress
        }
      })
    } else if (progress.status === 'TERMINATED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'getDFSPValuesTerminated',
        data: {
          result: progress
        }
      })
    } else {
      if (progress.requestSent.method === 'get' && progress.requestSent.operationPath === '/participants/{name}/accounts') {
        if (progress.response.status === 200) {
          this.notificationEventFunction({
            category: 'hubConsole',
            type: 'dfspAccountsUpdate',
            data: {
              dfspId: progress.requestSent.params.name,
              accountsData: progress.response.body
            }
          })
        }
      }
    }
  }
  notifyGetSettlements = (progress) => {
    if (progress.status === 'FINISHED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'getSettlementsFinished',
        data: {
          result: progress
        }
      })
    } else if (progress.status === 'TERMINATED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'getSettlementsTerminated',
        data: {
          result: progress
        }
      })
    } else {
      if (progress.response.status === 200) {
        this.notificationEventFunction({
          category: 'hubConsole',
          type: 'settingsUpdate',
          data: {
            settlements: progress.response.body
          }
        })
      }
    }
  }
  notifyExecuteSettlement = (progress) => {
    if (progress.status === 'FINISHED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'executeSettlementFinished',
        data: {
          result: progress
        }
      })
    } else if (progress.status === 'TERMINATED') {
      this.notificationEventFunction({
        category: 'hubConsole',
        type: 'executeSettlementTerminated',
        data: {
          result: progress
        }
      })
    }
  }

  handleNotificationLog = (log) => {
    // console.log(log)

    // Handle the outbound progress events
    if ( log.internalLogType === 'outboundProgress' ) {
      if (log.status === 'FINISHED') {
        switch (log.totalResult.name) {
          case 'PROVISIONING':
            this.notifySettingsTestCaseProgress(log)
            break
          case 'GET_DFSP_VALUES':
            this.notifyDFSPValues(log)
            break
          case 'GET_SETTLEMENTS':
            this.notifyGetSettlements(log)
            break
          case 'EXECUTE_SETTLEMENT':
            this.notifyExecuteSettlement(log)
            break
        }
      } else {
        switch (log.testCaseName) {
          case 'PAYER_FSP_PROVISIONING':
          case 'PAYEE_FSP_PROVISIONING':
            this.notifySettingsTestCaseProgress(log)
            break
          case 'GET_DFSP_ACCOUNTS':
            this.notifyDFSPValues(log)
            break
          case 'GET_SETTLED_SETTLEMENTS':
            this.notifyGetSettlements(log)
            break
        }      
      }
      return null
    }

    // Payer Logs
    // Catch get Parties request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Sending request')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notificationEventFunction({
        category: 'payer',
        type: 'getParties',
        data: {
          resource: log.resource
        }
      })
      this.notifyPayerMonitorLog(log)
    }

    // Catch get Parties response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Received response')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'getPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.message.replace('Received response ', '')
        }
      })
    }

    // Catch put Parties
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putParties',
        data: {
          resource: log.resource,
          party: log.additionalData && log.additionalData.request && log.additionalData.request.body ? log.additionalData.request.body.party : null
        }
      })
    }

    // Catch put Parties response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }

    // Catch post Quotes request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Sending request')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'postQuotes',
        data: {
          resource: log.resource,
          quotesRequest: log.additionalData && log.additionalData.request ? log.additionalData.request.body : null
        }
      })
    }
    // Catch post Quotes response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Received response')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'postQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.message.replace('Received response ', '')
        }
      })
    }

    // Catch put Quotes
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putQuotes',
        data: {
          resource: log.resource,
          quotesResponse: log.additionalData && log.additionalData.request ? log.additionalData.request.body : null
        }
      })
    }

    // Catch put Quotes response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }
    // Catch post Transfers request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Sending request')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'postTransfers',
        data: {
          resource: log.resource,
          transfersRequest: log.additionalData && log.additionalData.request ? log.additionalData.request.body : null
        }
      })
    }
    // Catch post Transfers response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Received response')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'postTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.message.replace('Received response ', '')
        }
      })
    }

    // Catch put Transfers
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putTransfers',
        data: {
          resource: log.resource,
          transfersResponse: log.additionalData && log.additionalData.request ? log.additionalData.request.body : null
        }
      })
    }

    // Catch put Transfers response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayerMonitorLog(log)
      this.notificationEventFunction({
        category: 'payer',
        type: 'putTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }

    // *********** Payee Side Logs ********* //
    // Catch get Parties request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: get')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeeGetParties',
        data: {
          resource: log.resource
        }
      })
    }

    // Catch get Parties response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: get')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeeGetPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }
    // Catch put Parties request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutParties',
        data: {
          resource: log.resource
        }
      })
    }

    // Catch put Parties response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }
    // Catch post Quotes request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostQuotes',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body
        }
      })
    }

    // Catch post Quotes response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }
    // Catch put Quotes request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutQuotes',
        data: {
          resource: log.resource
        }
      })
    }

    // Catch put Quotes response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }
    // Catch post Transfers request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostTransfers',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body
        }
      })
    }

    // Catch post Transfers response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ''
        }
      })
    }
    // Catch put Transfers request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutTransfers',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body
        }
      })
    }

    // Catch put Transfers response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }

  }

}

export default NotificationService
