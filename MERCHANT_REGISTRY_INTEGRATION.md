# Merchant Registry Integration Guide

## Overview

The ml-testing-toolkit-ui has been updated to integrate with your **merchant-registry-svc-sprak** service instead of using hardcoded LEI values. This enables real-time lookups from your MySQL database via the registry-oracle service.

## What Was Changed

### 🔧 **Core Integration Updates**

1. **LEI Outbound Service** (`src/services/demos/LEIMerchantPayments/mojaloopOutbound.js`):
   - **NEW**: `getRegistryOracleUrl()` method to connect to your registry-oracle
   - **UPDATED**: `getPartiesLEI()` now calls `registry-oracle` first before falling back to templates
   - **Real Database Calls**: Hits `http://localhost:8888/parties/ALIAS/{LEI}`

2. **Configuration System** (`src/config/leiMerchantConfig.js`):
   - **NEW**: `lookupMerchantByLEI()` is now async and calls your merchant registry
   - **FALLBACK**: Still works with local config if registry is unavailable
   - **Environment Support**: Reads `REGISTRY_ORACLE_URL` from config

3. **PayerMerchant Component** (`src/views/demos/LEIMerchantPayments/PayerMerchant.jsx`):
   - **UPDATED**: QR scan and manual LEI lookup now use async merchant registry calls
   - **CONSOLE LOGGING**: Shows whether data comes from registry or local config
   - **ERROR HANDLING**: Graceful fallback if registry is unavailable

4. **Configuration** (`public/config.json`):
   - **NEW**: `REGISTRY_ORACLE_URL` setting for Docker environments

### 🎯 **Integration Points**

Your **merchant-registry-svc-sprak** exposes:
- **Service**: `registry-oracle` running on port **8888**
- **Database**: `registry_db` in MySQL container on port **3307**  
- **API Endpoint**: `GET /parties/ALIAS/{LEI}` (exactly what ml-testing-toolkit-ui needs!)

## Current Flow

### ✅ **Before** (Hardcoded):
```javascript
// Old hardcoded approach
merchantLEIs = {
    payer: '787200JXIR2YYZDPNP23',  // HALMADENT SRL
    payee: '529900VJSEB3P1FV4R31',  // SECOND MERCHANT CORP
};
```

### 🚀 **After** (Real Database Integration):
```javascript
// New dynamic approach
const registryResp = await axios.get(`http://localhost:8888/parties/ALIAS/${leiCode}`);
// Returns: { partyList: [{ fspId: "...", currency: "..." }] }
```

## How It Works

1. **User scans QR code** or **manually enters LEI**
2. **Frontend validates LEI format** (20 alphanumeric characters)
3. **Calls registry-oracle**: `GET http://localhost:8888/parties/ALIAS/787200JXIR2YYZDPNP23`
4. **Registry-oracle queries MySQL**: `SELECT fspId, currency FROM RegistryEntity WHERE alias_value = ?`
5. **Returns merchant data** or falls back to local config
6. **Console shows data source**: "✅ Using real merchant registry data!" vs "📋 Using local configuration data"

## Configuration Options

### **Docker Environment** (ml-core-test-harness-sprak):
The UI automatically connects to `http://localhost:8888` when running in your Docker stack.

### **Development Environment**:
Set environment variable:
```bash
export REACT_APP_REGISTRY_ORACLE_URL=http://localhost:8888
```

### **Custom Registry URL**:
Update `public/config.json`:
```json
{
  "REGISTRY_ORACLE_URL": "http://your-registry-host:8888"
}
```

## Testing the Integration

### 1. **Check Console Logs**:
When doing LEI lookups, you'll see:
- ✅ `"Using real merchant registry data!"` - Success from your database
- 📋 `"Using local configuration data"` - Fallback to hardcoded
- ⚠️ `"Registry oracle lookup failed"` - Connection issues

### 2. **Database Validation**:
```sql
-- Check what LEIs are in your registry_db
SELECT alias_value, fspId, currency FROM RegistryEntity;
```

### 3. **API Testing**:
```bash
# Test the registry-oracle directly
curl http://localhost:8888/parties/ALIAS/787200JXIR2YYZDPNP23
```

## Benefits

### 🏆 **Real Data Integration**:
- No more hardcoded merchant info
- Dynamic lookups from your actual merchant database
- Real-time synchronization with merchant registrations

### 🔄 **Fallback Support**:
- Still works if registry service is down
- Graceful degradation to local configuration
- No breaking changes to existing functionality

### 🛡️ **Production Ready**:
- Proper error handling and logging
- Environment-specific configuration
- Compatible with your Docker Compose setup

## Database Schema Expected

Your **registry-oracle** expects this table structure (which you already have):
```sql
CREATE TABLE RegistryEntity (
    alias_value VARCHAR(255),  -- LEI codes stored here
    fspId VARCHAR(255),        -- FSP identifier
    currency VARCHAR(10),      -- Currency code
    -- other fields...
);
```

## Next Steps

1. **Populate Database**: Ensure your `registry_db` has LEI entries in `RegistryEntity.alias_value`
2. **Start Services**: Run `docker-compose --profile merchant-registry up`
3. **Test Integration**: Try LEI lookups in ml-testing-toolkit-ui
4. **Monitor Logs**: Check console for "✅ Using real merchant registry data!"

## Troubleshooting

### **"Registry oracle lookup failed"**:
- Check if registry-oracle is running: `curl http://localhost:8888/health`
- Verify Docker network connectivity
- Check `registry_db` database has data

### **Still seeing hardcoded values**:
- Clear browser cache
- Check `REGISTRY_ORACLE_URL` configuration
- Verify LEI exists in database with exact matching

---

🎉 **Your ml-testing-toolkit-ui is now integrated with your real merchant registry database!**