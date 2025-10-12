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
import axios from 'axios';
import { getConfig, getServerConfig } from '../../../utils/getConfig';
import templateGetPartiesLEI from './template_getPartiesLEI.json';
import templateGetPartiesAlias from './template_getPartiesAlias.json';
import templatePostQuotes from './template_postQuotes.json';
import templatePostTransfers from './template_postTransfers.json';
import templateProvisioning from './template_provisioning.json';
import templateGetHubConsoleInitValues from './template_getHubConsoleInitValues.json';
import templateGetDFSPValues from './template_getDFSPValues.json';
import templateGetSettlements from './template_getSettlements.json';
import templateExecuteSettlement from './template_executeSettlement.json';
import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib';
import _ from 'lodash';

class OutboundService {
    apiBaseUrl = '';

    inputValues = {};

    sessionId = '123';

    userConfig = {};

    customParams = {
        payerFspTransferExpirationOffset: 60 * 1000,
    };

    // TEMPORARILY COMMENTED OUT: Force real database lookup only
    // Default LEI codes for merchants
    // merchantLEIs = {
    //     payer: '787200JXIR2YYZDPNP23',  // HALMADENT SRL
    //     payee: '529900VJSEB3P1FV4R31',  // SECOND MERCHANT CORP
    // };

    constructor(sessionId = '123') {
        const { apiBaseUrl } = getConfig();
        this.apiBaseUrl = apiBaseUrl;
        this.sessionId = sessionId;
        this.initEnvironment();
    }

    initEnvironment = async () => {
        await this.fetchUserConfig();
        await this.reloadEnvironment();
    };

    getSessionId() {
        return this.sessionId;
    }

    getTraceId() {
        const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix();
        const currentEndToEndId = TraceHeaderUtils.generateEndToEndId();
        return traceIdPrefix + this.sessionId + currentEndToEndId;
    }

    async fetchUserConfig() {
        const { userConfigRuntime } = await getServerConfig();
        this.userConfig = userConfigRuntime;
    }

    async reloadEnvironment() {
        const DEFAULT_ENVIRONMENT_FILE_NAME = this.userConfig ? this.userConfig.DEFAULT_ENVIRONMENT_FILE_NAME : 'hub-local-environment.json';
        const environmentURL = '/api/samples/loadFolderWise?environment=examples/environments/' + DEFAULT_ENVIRONMENT_FILE_NAME;
        const resp = await axios.get(this.apiBaseUrl + environmentURL);
        if(resp.data && resp.data.body && resp.data.body.environment) {
            this.inputValues = resp.data.body.environment;
        }
    }

    setCustomParams = newConfig => {
        _.merge(this.customParams, newConfig);
    };

    getCustomParams = () => {
        return this.customParams;
    };
    
    getRegistryOracleUrl = () => {
        // Try to get from environment or config first
        const envUrl = process.env.REACT_APP_REGISTRY_ORACLE_URL || process.env.REGISTRY_ORACLE_URL;
        if (envUrl) {
            return envUrl;
        }
        
        // Default to the standard merchant registry oracle port
        // This matches the docker-compose setup where registry-oracle runs on port 8888
        // Use Docker service name when running in container
        return 'http://registry-oracle:8888';
    };

    // COMMENTED OUT: LEI-based lookup - now using merchant_id
    // Get merchant party info using LEI via /parties/ALIAS/{lei}
    // async getPartiesLEI(leiCode) {
    //     const traceId = this.getTraceId();
    //     
    //     // First try to get merchant info directly from merchant registry oracle
    //     try {
    //         const registryUrl = this.getRegistryOracleUrl();
    //         const registryResp = await axios.get(`${registryUrl}/parties/ALIAS/${leiCode}`);
    //         
    //         if (registryResp.data && registryResp.data.partyList && registryResp.data.partyList.length > 0) {
    //             console.log('Found merchant in registry oracle:', registryResp.data);
    //             
    //             // Create a mock successful response that matches ML Testing Toolkit expectations
    //             return {
    //                 data: {
    //                     status: 200,
    //                     merchantInfo: registryResp.data.partyList[0],
    //                     leiCode: leiCode,
    //                     source: 'merchant-registry-oracle'
    //                 }
    //             };
    //         }
    //     } catch (error) {
    //         console.log('Registry oracle lookup failed, falling back to template:', error.message);
    //     }
    //     
    //     // Fallback to the original ML Testing Toolkit template approach
    //     const template = templateGetPartiesLEI;
    //     template.inputValues = this.inputValues;
    //     // Replace corresponding values in inputValues
    //     template.inputValues.toIdValue = leiCode + '';
    //     template.inputValues.toIdType = 'ALIAS';
    //     const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
    //     return resp;
    // }

    // Get merchant party info using merchant_id via /parties/ALIAS/{merchant_id}
    async getPartiesAlias(merchantId) {
        const traceId = this.getTraceId();
        
        // First try to get merchant info directly from merchant registry oracle
        try {
            const registryUrl = this.getRegistryOracleUrl();
            console.log(`🔍 Outbound Service Registry Lookup: ${registryUrl}/parties/ALIAS/${merchantId}`);
            const registryResp = await axios.get(`${registryUrl}/parties/ALIAS/${merchantId}`);
            
            if (registryResp.data && registryResp.data.partyList && registryResp.data.partyList.length > 0) {
                console.log('🔍 Outbound Service Registry Response:', JSON.stringify(registryResp.data, null, 2));
                
                const merchant = registryResp.data.partyList[0];
                
                // Extract LEI directly from registry response (primary method)
                let extractedLEI = merchant.lei || null;
                
                // Legacy fallback for other possible LEI locations
                if (!extractedLEI) {
                    extractedLEI = merchant.party?.partyIdInfo?.partyIdentifier || 
                                   merchant.party?.partyIdentifier || 
                                   merchant.partyIdInfo?.partyIdentifier ||
                                   merchant.LEI ||
                                   merchant.aliasValue ||
                                   merchant.party?.aliasValue;
                }
                
                console.log('🔍 Extracted LEI for Outbound Service:', extractedLEI);
                
                // Create a mock successful response that matches ML Testing Toolkit expectations
                const response = {
                    data: {
                        status: 200,
                        merchantInfo: {
                            ...registryResp.data.partyList[0],
                            extractedLEI: extractedLEI // Add extracted LEI to response
                        },
                        merchantId: merchantId,
                        lei: extractedLEI,
                        source: 'merchant-registry-oracle'
                    }
                };
                
                console.log('🔍 Final Outbound Response:', JSON.stringify(response, null, 2));
                return response;
            } else {
                console.log('❌ Outbound Service: No partyList found in registry response');
            }
        } catch (error) {
            console.log('❌ Registry oracle lookup failed, falling back to template:', error.message);
        }
        
        // Fallback to the original ML Testing Toolkit template approach
        const template = templateGetPartiesAlias;
        template.inputValues = this.inputValues;
        // Replace corresponding values in inputValues
        template.inputValues.toIdValue = merchantId + '';
        template.inputValues.toIdType = 'ALIAS';
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    // COMMENTED OUT: Legacy method - now using merchant_id instead of LEI
    // Legacy method for backward compatibility - now uses LEI instead of phone number
    // async getParties(merchantType = 'payer') {
    //     const leiCode = merchantType === 'payer' ? this.merchantLEIs.payer : this.merchantLEIs.payee;
    //     return this.getPartiesLEI(leiCode);
    // }

    async postQuotes(amount, currency, payerMerchantId, payeeMerchantId, payerLEI = null, payeeLEI = null) {
        const traceId = this.getTraceId();
         
        const template = templatePostQuotes;
        template.inputValues = this.inputValues;
        
        // Replace corresponding values in inputValues for merchant payments
        template.inputValues.amount = amount + '';
        template.inputValues.currency = currency + '';
        template.inputValues.payerMerchantId = payerMerchantId || '1';
        template.inputValues.payeeMerchantId = payeeMerchantId || '2';
        template.inputValues.payerMerchantName = 'HALMADENT SRL';
        template.inputValues.payeeMerchantName = 'SECOND MERCHANT CORP';
        
        // Include LEI data for quotes template
        template.inputValues.payerLEI = payerLEI || '787200JXIR2YYZDPNP23';
        template.inputValues.payeeLEI = payeeLEI || '529900VJSEB3P1FV4R31';
        
        console.log('📋 Quote Template Input Values:', {
            payerMerchantId: template.inputValues.payerMerchantId,
            payeeMerchantId: template.inputValues.payeeMerchantId,
            payerLEI: template.inputValues.payerLEI,
            payeeLEI: template.inputValues.payeeLEI
        });
        
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async postTransfers(amount, transactionId, expiration, ilpPacket, condition) {
        const traceId = this.getTraceId();
         
        const template = templatePostTransfers;
        template.inputValues = this.inputValues;
        // Replace corresponding values in inputValues
        template.inputValues.amount = amount + '';
        template.inputValues.quotesCallbackTransactionId = transactionId + '';
        template.inputValues.quotesCallbackExpiration = expiration + '';
        template.inputValues.quotesCallbackIlpPacket = ilpPacket + '';
        template.inputValues.quotesCallbackCondition = condition + '';
        template.inputValues.expirationOffset = this.customParams.payerFspTransferExpirationOffset;
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async startProvisioning() {
        const traceId = this.getTraceId();
         
        const template = templateProvisioning;
        template.inputValues = this.inputValues;
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async getHubConsoleInitValues() {
        const traceId = this.getTraceId();
         
        const template = templateGetHubConsoleInitValues;
        template.inputValues = this.inputValues;
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async getDFSPValues() {
        const traceId = this.getTraceId();
         
        const template = templateGetDFSPValues;
        template.inputValues = this.inputValues;
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async getSettlements() {
        const traceId = this.getTraceId();
         
        const template = templateGetSettlements;
        template.inputValues = this.inputValues;
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }

    async executeSettlement(settlementModel) {
        const traceId = this.getTraceId();
         
        const template = templateExecuteSettlement;
        template.inputValues = this.inputValues;
        // Replace corresponding values in inputValues
        template.inputValues.settlementModel = settlementModel + '';
        const resp = await axios.post(this.apiBaseUrl + '/api/outbound/template/' + traceId, template, { headers: { 'Content-Type': 'application/json' } });
        return resp;
    }
}

export default OutboundService;