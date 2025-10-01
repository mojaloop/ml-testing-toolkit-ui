# LEI Merchant Payments - Complete 24-Step Sequence Implementation

## Overview

The LEI Merchant Payments demo now implements the **exact 24-step sequence** you specified, with proper event-driven coordination between HALMADENT SRL (Payer) and SECOND MERCHANT CORP (Payee).

## Complete 24-Step Sequence Flow

### **Phase 1: Party Lookup (Steps 1-8)**

#### Steps 1-2: Initial Party Lookup
- **Step 1**: HALMADENT SRL → Mojaloop Switch: `GET /parties/ALIAS/{payeeLEI}`
  - **Triggered by**: User clicks "Start Payment" → `handleGetMerchantInfo()`
  - **Implementation**: `outboundService.getPartiesLEI(payeeLEI)`
  
- **Step 2**: Mojaloop Switch → HALMADENT SRL: response 202
  - **Event**: `getPartiesResponse`
  - **Auto-triggers**: Step 3

#### Steps 3-4: Payee Lookup
- **Step 3**: Mojaloop Switch → SECOND MERCHANT CORP: `GET /parties/ALIAS/{payeeLEI}`
  - **Auto-triggered by**: Step 2 success
  - **Implementation**: PayerMerchant sends `payeeMerchantGetParties` event
  
- **Step 4**: SECOND MERCHANT CORP → Mojaloop Switch: response 202
  - **Auto-triggered by**: PayeeMerchant.sendGetPartiesResponse()
  - **Implementation**: PayeeMerchant triggers Step 5 immediately

#### Steps 5-6: Payee Party Response
- **Step 5**: SECOND MERCHANT CORP → Mojaloop Switch: `PUT /parties/ALIAS/{payeeLEI}`
  - **Auto-triggered by**: Step 4 completion
  - **Implementation**: PayeeMerchant.triggerStep5PutParties()
  
- **Step 6**: Mojaloop Switch → SECOND MERCHANT CORP: response 200
  - **Auto-triggered by**: Step 5 completion
  - **Implementation**: PayeeMerchant.sendPutPartiesResponse()

#### Steps 7-8: Payer Party Response  
- **Step 7**: Mojaloop Switch → HALMADENT SRL: `PUT /parties/ALIAS/{payeeLEI}`
  - **Auto-triggered by**: Step 6 completion via notification service
  - **Event**: `putParties` → Updates PayerMerchant UI with merchant info
  
- **Step 8**: HALMADENT SRL → Mojaloop Switch: response 200
  - **Auto-triggered by**: Step 7 completion via notification service
  - **Event**: `putPartiesResponse` → **Phase 2 enabled**

---

### **Phase 2: Quotes (Steps 9-16)**

#### Steps 9-10: Initial Quote Request
- **Step 9**: HALMADENT SRL → Mojaloop Switch: `POST /quotes`
  - **Triggered by**: User clicks "Get Quote" → `handleGetQuote()`
  - **Implementation**: `outboundService.postQuotes(amount, currency, payerLEI, payeeLEI)`
  
- **Step 10**: Mojaloop Switch → HALMADENT SRL: response 202
  - **Event**: `postQuotesResponse`
  - **Auto-triggers**: Step 11

#### Steps 11-12: Payee Quote Processing
- **Step 11**: Mojaloop Switch → SECOND MERCHANT CORP: `POST /quotes`
  - **Auto-triggered by**: Step 10 success
  - **Implementation**: PayerMerchant calls `payeeMerchantRef.current.triggerStep11PostQuotes()`
  
- **Step 12**: SECOND MERCHANT CORP → Mojaloop Switch: response 202
  - **Auto-triggered by**: PayeeMerchant.sendPostQuotesResponse()
  - **Implementation**: PayeeMerchant triggers Step 13 immediately

#### Steps 13-14: Payee Quote Response
- **Step 13**: SECOND MERCHANT CORP → Mojaloop Switch: `PUT /quotes/{quoteId}`
  - **Auto-triggered by**: Step 12 completion
  - **Implementation**: PayeeMerchant.triggerStep13PutQuotes()
  
- **Step 14**: Mojaloop Switch → SECOND MERCHANT CORP: response 200
  - **Auto-triggered by**: Step 13 completion
  - **Implementation**: PayeeMerchant.sendPutQuotesResponse()

#### Steps 15-16: Payer Quote Response
- **Step 15**: Mojaloop Switch → HALMADENT SRL: `PUT /quotes/{quoteId}`
  - **Auto-triggered by**: Step 14 completion via notification service
  - **Event**: `putQuotes` → Updates PayerMerchant UI with quote details
  
- **Step 16**: HALMADENT SRL → Mojaloop Switch: response 200
  - **Auto-triggered by**: Step 15 completion via notification service
  - **Event**: `putQuotesResponse` → **Phase 3 enabled**

---

### **Phase 3: Transfer (Steps 17-24)**

#### Steps 17-18: Initial Transfer Request
- **Step 17**: HALMADENT SRL → Mojaloop Switch: `POST /transfers`
  - **Triggered by**: User clicks "Transfer Money" → `handleTransfer()`
  - **Implementation**: `outboundService.postTransfers(amount, transactionId, expiration, ilpPacket, condition)`
  
- **Step 18**: Mojaloop Switch → HALMADENT SRL: response 202
  - **Event**: `postTransfersResponse`
  - **Auto-triggers**: Step 19

#### Steps 19-20: Payee Transfer Processing
- **Step 19**: Mojaloop Switch → SECOND MERCHANT CORP: `POST /transfers`
  - **Auto-triggered by**: Step 18 success
  - **Implementation**: PayerMerchant calls `payeeMerchantRef.current.triggerStep19PostTransfers()`
  
- **Step 20**: SECOND MERCHANT CORP → Mojaloop Switch: response 202
  - **Auto-triggered by**: PayeeMerchant.sendPostTransfersResponse()
  - **Implementation**: PayeeMerchant triggers Step 21 immediately

#### Steps 21-22: Payee Transfer Commitment
- **Step 21**: SECOND MERCHANT CORP → Mojaloop Switch: `PUT /transfers/{transferId}`
  - **Auto-triggered by**: Step 20 completion
  - **Implementation**: PayeeMerchant.triggerStep21PutTransfers()
  - **Payload**: `{ transferState: 'COMMITTED', transferId, completedTimestamp }`
  
- **Step 22**: Mojaloop Switch → SECOND MERCHANT CORP: response 200
  - **Auto-triggered by**: Step 21 completion
  - **Implementation**: PayeeMerchant.sendPutTransfersResponse()

#### Steps 23-24: Payer Transfer Completion
- **Step 23**: Mojaloop Switch → HALMADENT SRL: `PUT /transfers/{transferId}`
  - **Auto-triggered by**: Step 22 completion via notification service
  - **Event**: `putTransfers` → Updates PayerMerchant UI with success result
  
- **Step 24**: HALMADENT SRL → Mojaloop Switch: response 200 ✅ **TRANSFER SUCCESSFUL**
  - **Auto-triggered by**: Step 23 completion via notification service
  - **Event**: `putTransfersResponse` → **Payment complete!**

## Key Implementation Features

### **1. Event-Driven Coordination**
```javascript
// PayerMerchant coordinates with PayeeMerchant
case 'postQuotesResponse':
    // Step 10 → triggers Step 11
    if (this.payeeMerchantRef && this.payeeMerchantRef.current) {
        this.payeeMerchantRef.current.triggerStep11PostQuotes();
    }
    break;
```

### **2. Automatic Sequence Progression**
```javascript
// PayeeMerchant automatically progresses through steps
sendPostQuotesResponse = () => {
    // Step 12: Send response
    this.props.onSequenceEvent({...});
    // Step 13: Immediately trigger PUT quotes
    this.triggerStep13PutQuotes();
};
```

### **3. Template Integration**
All API calls use dynamic templates with proper LEI-based parameters:
- **Party Lookup**: `template_getPartiesLEI.json` with `/parties/ALIAS/{LEI}`
- **Quotes**: `template_postQuotes.json` with LEI merchant information
- **Transfers**: `template_postTransfers.json` with quote-derived parameters

### **4. UI State Synchronization**
```javascript
// Each step updates UI appropriately
case 'putParties':     // Step 7 → Show merchant info + quote form
case 'putQuotes':      // Step 15 → Show quote details + transfer button  
case 'putTransfers':   // Step 23 → Show success result + reset
```

## Sequence Flow Summary

```
Phase 1: Party Lookup
HALMADENT SRL → GET parties → (response 202) → 
Mojaloop → SECOND MERCHANT → (response 202) → PUT parties → (response 200) → 
Mojaloop → HALMADENT SRL → PUT parties → (response 200) ✓

Phase 2: Quotes  
HALMADENT SRL → POST quotes → (response 202) →
Mojaloop → SECOND MERCHANT → (response 202) → PUT quotes → (response 200) →
Mojaloop → HALMADENT SRL → PUT quotes → (response 200) ✓

Phase 3: Transfer
HALMADENT SRL → POST transfers → (response 202) →
Mojaloop → SECOND MERCHANT → (response 202) → PUT transfers → (response 200) →
Mojaloop → HALMADENT SRL → PUT transfers → (response 200) ✅ SUCCESS!
```

## Benefits

✅ **Exact 24-step sequence** as specified
✅ **Response-driven progression** - no artificial delays  
✅ **Proper LEI-based merchant identification** (ALIAS type)
✅ **Real-time UI updates** at each step
✅ **Automatic coordination** between payer/payee merchants
✅ **Complete transfer implementation** with success confirmation
✅ **Proper error handling** and reset capability

The LEI Merchant Payments demo now follows your exact 24-step specification with perfect event-driven coordination between all parties! 🎯