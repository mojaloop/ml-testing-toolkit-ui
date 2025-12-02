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
 * Configuration for Merchant Payments Demo
 *
 * This file contains all configurable values for the merchant payment demo.
 * Now uses merchant_id instead of LEI codes for lookups.
 * All hardcoded values have been moved here to make them easily configurable.
 */

// Default fallback configuration - will be overridden by JSON config
const FALLBACK_CONFIG = {
  // Fallback Payer Configuration (Person)
  payer: {
    name: 'John Doe',
    bank: 'Pink Bank',
    bankAccountId: '123456789',
    fspId: 'DFSP001',
    displayName: 'PAYER',
    terminalName: 'Pink Bank Mobile App',
    defaultCurrency: 'RWF',
    defaultAmount: 100
  },

  // Fallback Payee Merchant Configuration
  payee: {
    merchantId: '10000007',
    lei: '529900AXZOJO15EBGR24',
    name: 'Bamburi Cement Public Limited Company',
    fspId: 'DFSP001',
    displayName: 'PAYEE',
    merchantClassificationCode: '5814',
    terminalName: 'Bamburi Cement Payment Terminal'
  },

  // Hub/Switch Configuration
  hub: {
    name: 'Mojaloop Switch',
    fspId: 'DFSP001'
  },

  // Default Transaction Parameters
  transaction: {
    currencies: ['RWF', 'KSH'], // Rwanda Franc, Kenyan Shilling
    defaultCurrency: 'RWF',
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
    type: 'MERCHANT_PAYMENT',
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
}

/**
 * Current active configuration
 * This will be loaded from JSON file and merged with fallbacks
 */
let activeConfig = { ...FALLBACK_CONFIG }

/**
 * Load merchant configuration from JSON file
 * @returns {Promise<Object>} Loaded merchant configuration
 */
export const loadMerchantConfig = async () => {
  try {
    const response = await fetch('/merchants.json')
    if (response.ok) {
      const merchantData = await response.json()
      console.log('✅ Loaded merchant config from JSON:', merchantData)

      // Update active config with JSON data
      if (merchantData.payer) {
        activeConfig.payer = {
          ...activeConfig.payer,
          name: merchantData.payer.name,
          bank: merchantData.payer.bank,
          bankAccountId: merchantData.payer.bankAccountId
        }
      }

      if (merchantData.payee) {
        activeConfig.payee = {
          ...activeConfig.payee,
          merchantId: merchantData.payee.merchantId,
          lei: merchantData.payee.lei,
          name: merchantData.payee.name
        }
      }

      if (merchantData.currencies) {
        activeConfig.transaction.currencies = merchantData.currencies
        activeConfig.transaction.defaultCurrency = merchantData.currencies[0] || 'RWF'
      }

      return merchantData
    } else {
      console.warn('⚠️ Failed to load merchants.json, using fallback config')
    }
  } catch (error) {
    console.warn('⚠️ Error loading merchants.json:', error.message, '- using fallback config')
  }

  return null
}

/**
 * Get current configuration
 * @returns {Object} Current active configuration
 */
export const getConfig = () => {
  return activeConfig
}

/**
 * Get payer merchant configuration
 * @returns {Object} Payer merchant config
 */
export const getPayerConfig = () => {
  return activeConfig.payer
}

/**
 * Get payee merchant configuration
 * @returns {Object} Payee merchant config
 */
export const getPayeeConfig = () => {
  return activeConfig.payee
}

/**
 * Get hub/switch configuration
 * @returns {Object} Hub configuration
 */
export const getHubConfig = () => {
  return activeConfig.hub
}

/**
 * Get transaction configuration
 * @returns {Object} Transaction config
 */
export const getTransactionConfig = () => {
  return activeConfig.transaction
}

/**
 * Get QR code configuration
 * @returns {Object} QR code config
 */
export const getQRConfig = () => {
  return activeConfig.qrCode
}

/**
 * Get UI configuration
 * @returns {Object} UI config
 */
export const getUIConfig = () => {
  return activeConfig.ui
}

/**
 * Update configuration with server config or environment overrides
 * @param {Object} configUpdates - Configuration updates to merge
 */
export const updateConfig = (configUpdates) => {
  activeConfig = mergeDeep(activeConfig, configUpdates)
}

/**
 * Reset configuration to defaults
 */
export const resetConfig = () => {
  activeConfig = { ...FALLBACK_CONFIG }
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function mergeDeep (target, source) {
  const output = Object.assign({}, target)

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = mergeDeep(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }

  return output
}

/**
 * Check if value is an object
 * @param {*} item - Item to check
 * @returns {boolean} True if item is an object
 */
function isObject (item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Generate merchant data for QR codes with only name and LEI
 * @param {Object} merchantConfig - Merchant configuration
 * @returns {Object} QR code data object
 */
export const generateMerchantQRData = (merchantConfig) => {
  return {
    merchantName: merchantConfig.name, // Merchant name for display
    lei: merchantConfig.lei // LEI for parties lookup
  }
}

/**
 * Validate merchant_id format
 * @param {string} merchantId - merchant_id to validate
 * @returns {boolean} True if merchant_id format is valid
 */
export const validateMerchantId = (merchantId) => {
  if (!merchantId || typeof merchantId !== 'string') return false

  // Simple validation - non-empty string
  return merchantId.trim().length > 0
}

/**
 * Lookup merchant configuration by merchant_id
 * @param {string} merchantId - merchant_id to lookup
 * @returns {Object|null} Merchant config if found, null otherwise
 */
export const lookupMerchantByMerchantId = async (merchantId) => {
  if (!validateMerchantId(merchantId)) return null

  const normalizedMerchantId = merchantId.toString().trim()

  // TEMPORARILY COMMENTED OUT: Force real database lookup only
  // First check local configuration
  // if (activeConfig.payer.merchantId === normalizedMerchantId) {
  //     return { ...activeConfig.payer, type: 'payer' };
  // }
  //
  // if (activeConfig.payee.merchantId === normalizedMerchantId) {
  //     return { ...activeConfig.payee, type: 'payee' };
  // }

  // Try to lookup from merchant registry oracle
  try {
    const registryUrl = getRegistryOracleUrl()
    console.log(`📡 Registry Oracle Lookup: ${registryUrl}/parties/ALIAS/${normalizedMerchantId}`)
    const response = await fetch(`${registryUrl}/parties/ALIAS/${normalizedMerchantId}`)

    console.log(`📡 Registry Response Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('📡 Full Registry Response Structure:', JSON.stringify(data, null, 2))

      if (data.partyList && data.partyList.length > 0) {
        const merchant = data.partyList[0]
        console.log('📡 First Merchant Entry:', JSON.stringify(merchant, null, 2))

        // Extract LEI directly from registry response
        // The registry now includes lei field in the database response
        let extractedLEI = merchant.lei || null

        // Legacy fallback paths (in case the registry structure changes)
        if (!extractedLEI) {
          const leiPaths = [
            merchant.party?.partyIdInfo?.partyIdentifier,
            merchant.party?.partyIdentifier,
            merchant.partyIdInfo?.partyIdentifier,
            merchant.LEI,
            merchant.aliasValue,
            merchant.party?.aliasValue
          ]
          extractedLEI = leiPaths.find(path => path && typeof path === 'string' && path.trim().length > 0)
        }

        console.log('📡 LEI Extraction Results:')
        console.log('  - merchant.lei (primary):', merchant.lei)
        console.log('  - merchant.fspId:', merchant.fspId)
        console.log('  - merchant.currency:', merchant.currency)
        console.log('  - merchant.alias_value:', merchant.alias_value)
        console.log('  - ✅ Final Extracted LEI:', extractedLEI)

        const result = {
          merchantId: normalizedMerchantId,
          lei: extractedLEI,
          fspId: merchant.fspId,
          currency: merchant.currency,
          name: merchant.party?.name || merchant.merchantName || `Merchant ${normalizedMerchantId}`,
          type: 'external',
          source: 'merchant-registry-oracle',
          rawMerchantData: merchant // Include raw data for debugging
        }

        console.log('📡 Final Processed Result:', JSON.stringify(result, null, 2))
        return result
      } else {
        console.log('❌ No partyList found in response or empty partyList')
      }
    } else {
      console.log(`❌ Registry API call failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('Failed to lookup merchant from registry oracle:', error)
  }

  return null
}

/**
 * Get Registry Oracle URL
 * @returns {string} Registry Oracle base URL
 */
const getRegistryOracleUrl = () => {
  // Try runtime config first (for Docker environments)
  if (typeof window !== 'undefined' && window.appConfig && window.appConfig.REGISTRY_ORACLE_URL) {
    return window.appConfig.REGISTRY_ORACLE_URL
  }

  // Try environment variables (for development)
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.REACT_APP_REGISTRY_ORACLE_URL || process.env.REGISTRY_ORACLE_URL
    if (envUrl) return envUrl
  }

  // Default to the standard merchant registry oracle port
  // Use Docker service name if likely running in container, localhost otherwise
  return typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'http://registry-oracle:8888'
    : 'http://localhost:8888'
}

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
  validateMerchantId,
  lookupMerchantByMerchantId
}
