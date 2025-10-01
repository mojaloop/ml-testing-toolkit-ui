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

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/

import socketIOClient from 'socket.io-client';
import { getConfig } from '../../../utils/getConfig';
import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib';
import templateProvisioning from './template_provisioning.json';

class NotificationService {
    logTypes = {
        outbound: {
            socket: null,
            socketTopic: 'newOutboundLog',
        },
        inbound: {
            socket: null,
            socketTopic: 'newLog',
        },
        outboundProgress: {
            socket: null,
            socketTopic: 'outboundProgress',
        },
    };

    notificationEventFunction = () => {};

    setNotificationEventListener(notificationEventFunction) {
        this.notificationEventFunction = notificationEventFunction;
    }

    apiBaseUrl = '';

    sessionId = '123';

    constructor() {
        const { apiBaseUrl } = getConfig();
        this.apiBaseUrl = apiBaseUrl;
        this.sessionId = TraceHeaderUtils.generateSessionId();
        for(const logType of Object.keys(this.logTypes)) {
            const item = this.logTypes[logType];
            item.socket = socketIOClient(this.apiBaseUrl);
            item.socket.on(item.socketTopic + '/' + this.sessionId, log => {
                this.handleNotificationLog({ ...log, internalLogType: logType });
            });
        }
    }

    getSessionId() {
        return this.sessionId;
    }

    disconnect() {
        for(const logType of Object.keys(this.logTypes)) {
            this.logTypes[logType].socket.disconnect();
        }
    }

    notifyPayerMerchantMonitorLog = log => {
        // Monitoring Logs for Payer Merchant
        this.notificationEventFunction({
            category: 'payerMerchantMonitorLog',
            type: 'log',
            data: {
                log,
            },
        });
    };

    notifyPayerMerchantGetAccounts = progress => {
        // Monitoring Logs
        this.notificationEventFunction({
            category: 'payerMerchant',
            type: 'accountsUpdate',
            data: {
                accounts: progress.response.body,
            },
        });
    };

    notifyPayeeMerchantMonitorLog = log => {
        // Monitoring Logs for Payee Merchant
        this.notificationEventFunction({
            category: 'payeeMerchantMonitorLog',
            type: 'log',
            data: {
                log,
            },
        });
    };

    notifySettingsTestCaseProgress = progress => {
         
        const template = templateProvisioning;
        if(progress.status === 'FINISHED') {
            this.notificationEventFunction({
                category: 'settingsLog',
                type: 'testCaseFinished',
                data: {
                    progress,
                },
            });
            // progress.totalResult
        } else if(progress.status === 'TERMINATED') {
            this.notificationEventFunction({
                category: 'settingsLog',
                type: 'testCaseTerminated',
                data: {
                    progress,
                },
            });
        } else {
            const testCase = template.test_cases.find(item => item.id === progress.testCaseId);
            if(testCase) {
                this.notificationEventFunction({
                    category: 'settingsLog',
                    type: 'testCaseProgress',
                    data: {
                        testCaseName: testCase.name,
                        testCaseRequestCount: testCase.requests.length,
                        progress,
                    },
                });
            }
        }
    };

    notifyGetHubConsoleInitValues = progress => {
        if(progress.status === 'FINISHED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getHubConsoleInitValuesFinished',
                data: {
                    result: progress,
                },
            });
        } else if(progress.status === 'TERMINATED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getHubConsoleInitValuesTerminated',
                data: {
                    result: progress,
                },
            });
        }
    };

    notifyDFSPValues = progress => {
        if(progress.status === 'FINISHED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getDFSPValuesFinished',
                data: {
                    result: progress,
                },
            });
        } else if(progress.status === 'TERMINATED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getDFSPValuesTerminated',
                data: {
                    result: progress,
                },
            });
        }
    };

    notifyDFSPAccounts = progress => {
        if(progress.response.status === 200) {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'dfspAccountsUpdate',
                data: {
                    dfspId: progress.requestSent.params.name,
                    accountsData: progress.response.body,
                },
            });
        }
    };

    notifyDFSPLimits = progress => {
        if(progress.response.status === 200) {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'dfspLimitsUpdate',
                data: {
                    limitsData: progress.response.body,
                },
            });
        }
    };

    notifyGetSettlementModels = progress => {
        if(progress.response.status === 200) {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'settlementModelsUpdate',
                data: {
                    settlementModels: progress.response.body,
                },
            });
        }
    };

    notifyGetSettlements = progress => {
        if(progress.status === 'FINISHED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getSettlementsFinished',
                data: {
                    result: progress,
                },
            });
        } else if(progress.status === 'TERMINATED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'getSettlementsTerminated',
                data: {
                    result: progress,
                },
            });
        } else {
            if(progress.response.status === 200) {
                this.notificationEventFunction({
                    category: 'hubConsole',
                    type: 'settingsUpdate',
                    data: {
                        settlements: progress.response.body,
                    },
                });
            }
        }
    };

    notifyGetParticipants = progress => {
        if(progress.response.status === 200) {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'participantsUpdate',
                data: {
                    participants: progress.response.body,
                },
            });
        }
    };

    notifyExecuteSettlement = progress => {
        if(progress.status === 'FINISHED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'executeSettlementFinished',
                data: {
                    result: progress,
                },
            });
        } else if(progress.status === 'TERMINATED') {
            this.notificationEventFunction({
                category: 'hubConsole',
                type: 'executeSettlementTerminated',
                data: {
                    result: progress,
                },
            });
        }
    };

    handleNotificationLog = log => {
        // Handle the outbound progress events
        if(log.internalLogType === 'outboundProgress') {
            if(log.status === 'FINISHED' || log.status === 'TERMINATED') {
                switch (log.totalResult.name) {
                    case 'PROVISIONING':
                        this.notifySettingsTestCaseProgress(log);
                        break;
                    case 'GET_DFSP_VALUES':
                        this.notifyDFSPValues(log);
                        break;
                    case 'GET_HUBCONSOLE_INIT_VALUES':
                        this.notifyGetHubConsoleInitValues(log);
                        break;
                    case 'GET_SETTLEMENTS':
                        this.notifyGetSettlements(log);
                        break;
                    case 'EXECUTE_SETTLEMENT':
                        this.notifyExecuteSettlement(log);
                        break;
                }
            } else {
                // By test case name
                switch (log.testCaseName) {
                    case 'PAYER_FSP_PROVISIONING':
                    case 'PAYEE_FSP_PROVISIONING':
                        this.notifySettingsTestCaseProgress(log);
                        break;
                    case 'GET_DFSP_ACCOUNTS':
                        this.notifyDFSPAccounts(log);
                        break;
                    case 'GET_DFSP_LIMITS':
                        this.notifyDFSPLimits(log);
                        break;
                    case 'GET_SETTLED_SETTLEMENTS':
                        this.notifyGetSettlements(log);
                        break;
                    case 'GET_PARTICIPANTS':
                        this.notifyGetParticipants(log);
                        break;
                    case 'GET_SETTLEMENT_MODELS':
                        this.notifyGetSettlementModels(log);
                        break;
                    case 'GET_PAYER_ACCOUNTS':
                        this.notifyPayerMerchantGetAccounts(log);
                        break;
                }
                // By request name
                switch (log.requestSent.description) {
                    case 'GET_PAYER_ACCOUNTS':
                        this.notifyPayerMerchantGetAccounts(log);
                        break;
                }
            }
            return null;
        }

        // Payer Merchant Logs
        // Catch get Parties request (LEI lookup)
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Sending request') &&
          log.resource &&
          log.resource.method === 'get' &&
          log.resource.path.startsWith('/parties/') &&
          log.resource.path.includes('/ALIAS/')
        ) {
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'getParties',
                data: {
                    resource: log.resource,
                },
            });
            this.notifyPayerMerchantMonitorLog(log);
        }

        // Catch get Parties response (LEI lookup)
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Received response') &&
          log.resource &&
          log.resource.method === 'get' &&
          log.resource.path.startsWith('/parties/') &&
          log.resource.path.includes('/ALIAS/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'getPartiesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.message.replace('Received response ', ''),
                },
            });
        }

        // Catch put Parties
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putParties',
                data: {
                    resource: log.resource,
                    party:  log.additionalData && 
                            log.additionalData.request && 
                            log.additionalData.request.body ? log.additionalData.request.body.party : null,
                },
            });
        }

        // Catch put Parties response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putPartiesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // Catch post Quotes request
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Sending request') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/quotes')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'postQuotes',
                data: {
                    resource: log.resource,
                    quotesRequest: log.additionalData &&
                                    log.additionalData.request ? log.additionalData.request.body : null,
                },
            });
        }

        // Catch post Quotes response
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Received response') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/quotes')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'postQuotesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.message.replace('Received response ', ''),
                },
            });
        }

        // Catch put Quotes
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/quotes/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putQuotes',
                data: {
                    resource: log.resource,
                    quotesResponse: log.additionalData &&
                                      log.additionalData.request ? log.additionalData.request.body : null,
                },
            });
        }

        // Catch put Quotes response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/quotes/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putQuotesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // Catch post Transfers request
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Sending request') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/transfers')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'postTransfers',
                data: {
                    resource: log.resource,
                    transfersRequest: log.additionalData && 
                                        log.additionalData.request ? log.additionalData.request.body : null,
                },
            });
        }

        // Catch post Transfers response
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Received response') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/transfers')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'postTransfersResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.message.replace('Received response ', ''),
                },
            });
        }

        // Catch put Transfers
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/transfers/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putTransfers',
                data: {
                    resource: log.resource,
                    transfersResponse: log.additionalData &&
                                        log.additionalData.request ? log.additionalData.request.body : null,
                },
            });
        }

        // Catch put Transfers response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/transfers/')
        ) {
            this.notifyPayerMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payerMerchant',
                type: 'putTransfersResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // *********** Payee Merchant Side Logs ********* //
        // Catch get Parties request
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: get') &&
          log.resource &&
          log.resource.method === 'get' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantGetParties',
                data: {
                    resource: log.resource,
                },
            });
        }

        // Catch get Parties response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: get') &&
          log.resource &&
          log.resource.method === 'get' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantGetPartiesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // Catch put Parties request
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutParties',
                data: {
                    resource: log.resource,
                },
            });
        }

        // Catch put Parties response
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/parties/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutPartiesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText,
                },
            });
        }

        // Catch post Quotes request
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: post') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/quotes')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostQuotes',
                data: {
                    resource: log.resource,
                    requestBody: log.additionalData.request.body,
                },
            });
        }

        // Catch post Quotes response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: post') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/quotes')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostQuotesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // Catch put Quotes request
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/quotes/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutQuotes',
                data: {
                    resource: log.resource,
                    requestBody: log.additionalData.request.body,
                },
            });
        }

        // Catch put Quotes response
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/quotes/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutQuotesResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response &&
                                    (log.additionalData.response.status + ' ' + log.additionalData.response.statusText),
                },
            });
        }

        // Catch post Transfers request
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Request: post') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/transfers')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostTransfers',
                data: {
                    resource: log.resource,
                    requestBody: log.additionalData.request.body,
                },
            });
        }

        // Catch post Transfers response
        if(log.notificationType === 'newLog' &&
          log.message.startsWith('Response: post') &&
          log.resource &&
          log.resource.method === 'post' &&
          log.resource.path.startsWith('/transfers')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPostTransfersResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + '',
                },
            });
        }

        // Catch put Transfers request
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Request: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/transfers/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutTransfers',
                data: {
                    resource: log.resource,
                    requestBody: log.additionalData.request.body,
                },
            });
        }

        // Catch put Transfers response
        if(log.notificationType === 'newOutboundLog' &&
          log.message.startsWith('Response: put') &&
          log.resource &&
          log.resource.method === 'put' &&
          log.resource.path.startsWith('/transfers/')
        ) {
            this.notifyPayeeMerchantMonitorLog(log);
            this.notificationEventFunction({
                category: 'payeeMerchant',
                type: 'payeeMerchantPutTransfersResponse',
                data: {
                    resource: log.resource,
                    responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText,
                },
            });
        }
    };
}

export default NotificationService;