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

/**
 * Configuration for LEI Merchant Payments Demo
 * 
 * This file contains all configurable values for the LEI merchant payment demo.
 * All hardcoded values have been moved here to make them easily configurable.
 */

// Default configuration - can be overridden by server config or environment variables
const DEFAULT_CONFIG = {
    // Payer Merchant Configuration
    payer: {
        lei: '787200JXIR2YYZDPNP23',
        name: 'HALMADENT SRL',
        fspId: 'halmadentfsp',
        displayName: 'PAYER',
        terminalName: 'Merchant Payment Terminal',
        defaultCurrency: 'USD',
        defaultAmount: 100
    },
    
    // Payee Merchant Configuration  
    payee: {
        lei: '529900VJSEB3P1FV4R31',
        name: 'SECOND MERCHANT CORP',
        fspId: 'secondmerchantcorpfsp',
        displayName: 'PAYEE',
        merchantClassificationCode: '5814',
        terminalName: 'Payment Receiver Terminal'
    },
    
    // Hub/Switch Configuration
    hub: {
        name: 'Mojaloop Switch',
        fspId: 'DFSP001'
    },
    
    // Default Transaction Parameters
    transaction: {
        currencies: ['USD', 'EUR'],
        defaultCurrency: 'USD',
        defaultAmount: 100,
        fees: {
            payeeFspFee: {
                amount: '0.50',
                currency: 'USD'
            },
            payeeFspCommission: {
                amount: '0.25', 
                currency: 'USD'
            }
        },
        timeout: {
            quotes: 300000, // 5 minutes in milliseconds
            transfers: 1800000 // 30 minutes in milliseconds
        }
    },
    
    // QR Code Configuration
    qrCode: {
        type: 'LEI_MERCHANT_PAYMENT',
        width: 200,
        margin: 2,
        colors: {
            dark: '#11998e',
            light: '#ffffff'
        }
    },
    
    // UI Configuration
    ui: {
        theme: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            successColor: '#52c41a',
            errorColor: '#ff4d4f'
        },
        delays: {
            baseDelay: 500, // Base delay for simulated events
            autoLookupDelay: 500, // Delay before auto merchant lookup after QR scan
            sequenceStepDelay: 500 // Delay between sequence diagram steps
        }
    }
};

/**
 * Current active configuration
 * This will be merged with server config and environment overrides
 */
let activeConfig = { ...DEFAULT_CONFIG };

/**
 * Get current configuration
 * @returns {Object} Current active configuration
 */
export const getConfig = () => {
    return activeConfig;
};

/**
 * Get payer merchant configuration
 * @returns {Object} Payer merchant config
 */
export const getPayerConfig = () => {
    return activeConfig.payer;
};

/**
 * Get payee merchant configuration  
 * @returns {Object} Payee merchant config
 */
export const getPayeeConfig = () => {
    return activeConfig.payee;
};

/**
 * Get hub/switch configuration
 * @returns {Object} Hub configuration
 */
export const getHubConfig = () => {
    return activeConfig.hub;
};

/**
 * Get transaction configuration
 * @returns {Object} Transaction config
 */
export const getTransactionConfig = () => {
    return activeConfig.transaction;
};

/**
 * Get QR code configuration
 * @returns {Object} QR code config
 */
export const getQRConfig = () => {
    return activeConfig.qrCode;
};

/**
 * Get UI configuration
 * @returns {Object} UI config
 */
export const getUIConfig = () => {
    return activeConfig.ui;
};

/**
 * Update configuration with server config or environment overrides
 * @param {Object} configUpdates - Configuration updates to merge
 */
export const updateConfig = (configUpdates) => {
    activeConfig = mergeDeep(activeConfig, configUpdates);
};

/**
 * Reset configuration to defaults
 */
export const resetConfig = () => {
    activeConfig = { ...DEFAULT_CONFIG };
};

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

/**
 * Check if value is an object
 * @param {*} item - Item to check
 * @returns {boolean} True if item is an object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Generate LEI-compatible merchant data for QR codes
 * @param {Object} merchantConfig - Merchant configuration
 * @returns {Object} QR code data object
 */
export const generateMerchantQRData = (merchantConfig) => {
    return {
        type: activeConfig.qrCode.type,
        payeeLEI: merchantConfig.lei,
        merchantName: merchantConfig.name,
        fspId: merchantConfig.fspId,
        merchantClassificationCode: merchantConfig.merchantClassificationCode,
        timestamp: new Date().toISOString()
    };
};

/**
 * Validate LEI format
 * @param {string} lei - LEI to validate
 * @returns {boolean} True if LEI format is valid
 */
export const validateLEI = (lei) => {
    if (!lei || typeof lei !== 'string') return false;
    
    // LEI format: 20 alphanumeric characters
    const leiRegex = /^[A-Z0-9]{20}$/;
    return leiRegex.test(lei.toUpperCase());
};

/**
 * Lookup merchant configuration by LEI
 * @param {string} lei - LEI to lookup
 * @returns {Object|null} Merchant config if found, null otherwise
 */
export const lookupMerchantByLEI = (lei) => {
    if (!validateLEI(lei)) return null;
    
    const normalizedLEI = lei.toUpperCase();
    
    // Check payer
    if (activeConfig.payer.lei === normalizedLEI) {
        return { ...activeConfig.payer, type: 'payer' };
    }
    
    // Check payee
    if (activeConfig.payee.lei === normalizedLEI) {
        return { ...activeConfig.payee, type: 'payee' };
    }
    
    // Could be extended to check external merchant registry
    return null;
};

export default {
    getConfig,
    getPayerConfig,
    getPayeeConfig, 
    getHubConfig,
    getTransactionConfig,
    getQRConfig,
    getUIConfig,
    updateConfig,
    resetConfig,
    generateMerchantQRData,
    validateLEI,
    lookupMerchantByLEI
};