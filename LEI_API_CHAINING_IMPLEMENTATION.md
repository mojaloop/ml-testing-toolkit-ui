# LEI Merchant Payments - Event-Driven API Chaining Implementation

## Overview

The LEI Merchant Payments demo has been successfully enhanced to implement the same event-driven API chaining pattern as the Mobile Simulator. This creates a seamless, response-driven transaction flow for LEI-based merchant-to-merchant payments.

## Enhanced API Call Flow

### 1. **Merchant Party Lookup Phase**
1. **GET /parties/ALIAS/{LEI}** - Look up payee merchant by LEI
   - Triggered by "Start Payment" button → `handleGetMerchantInfo()`
   - Shows loading state with "Looking up merchant information..."
   - Success response automatically triggers payee merchant lookup

2. **PUT /parties/ALIAS/{LEI}** - Receive merchant party information
   - Triggers `putParties` event → Updates UI with merchant info
   - Enables quote request with amount/currency selection

### 2. **Quote Request Phase**
3. **POST /quotes** - Initiate quote request for LEI merchant payment
   - Triggered by "Get Quote" button → `handleGetQuote()`
   - Shows loading state with "Getting quote..."
   - Uses LEI identifiers for both payer and payee merchants
   - Success response automatically triggers payee merchant quote processing

4. **PUT /quotes** - Receive quote response
   - Triggers `putQuotes` event → Shows quote details (amount, fees, commission)
   - Enables transfer execution with Cancel/Transfer buttons

### 3. **Transfer Phase**
5. **POST /transfers** - Execute the merchant payment transfer
   - Triggered by "Transfer Money" button → `handleTransfer()`
   - Shows loading state with "Processing transfer..."
   - Success response automatically triggers payee merchant transfer processing

6. **PUT /transfers** - Confirm transfer completion
   - Triggers `putTransfers` event → Shows success result with transfer ID
   - Provides "Reset" button to start a new payment

## Key Implementation Features

### **Event-Driven State Management**

```javascript
handleNotificationEvents = event => {
    switch (event.type) {
        case 'getParties':
            this.setState({ stage: 'getParties' });
            break;
        case 'putParties':
            this.setState({ 
                gettingMerchantInfo: false, 
                stage: 'putParties', 
                merchantInfo: event.data.party 
            });
            break;
        case 'putQuotes':
            this.setState({ 
                stage: 'putQuotes', 
                quotesResponse: event.data.quotesResponse 
            });
            break;
        case 'putTransfers':
            this.setState({ 
                stage: 'putTransfers', 
                transfersResponse: event.data.transfersResponse 
            });
            break;
    }
}
```

### **Improved Loading States**

Each API call now has specific loading states with descriptive messages:
- **Party Lookup**: "Looking up merchant information..."
- **Quote Request**: "Getting quote..."  
- **Transfer Processing**: "Processing transfer..."

### **Seamless UI Flow**

```javascript
getStageData = () => {
    switch (this.state.stage) {
        case 'getParties':
            return <LoadingCard message="Looking up merchant information..." />;
        case 'putParties':
            return <MerchantInfoCard onGetQuote={this.handleGetQuote} />;
        case 'putQuotes':
            return <QuoteCard onTransfer={this.handleTransfer} onReset={this.handleReset} />;
        case 'putTransfers':
            return <SuccessCard onReset={this.handleReset} />;
        default:
            return <StartPaymentCard onClick={this.handleGetMerchantInfo} />;
    }
}
```

### **Template Enhancements**

#### LEI Party Lookup Template (`template_getPartiesLEI.json`)
- Dynamic LEI identifier support: `{$inputs.toIdValue}`
- Dynamic ID type support: `{$inputs.toIdType}` (set to "ALIAS")
- Proper participant management (add/lookup/cleanup)

#### LEI Quote Template (`template_postQuotes.json`)
- Dynamic LEI identifiers for both payer and payee
- Merchant classification codes and names
- Dynamic amount and currency support
- LEI-specific FSPIOP headers

## Benefits of Event-Driven Implementation

### 1. **Response-Driven Flow**
- No artificial delays or timeouts
- Each step waits for actual success responses
- Real-time feedback based on actual API status

### 2. **Better User Experience**
- Clear loading states with descriptive messages
- Immediate UI updates on successful responses
- Intuitive progress through payment stages
- Proper error handling and reset capabilities

### 3. **Merchant-Specific Features**
- LEI-based party identification (ALIAS type)
- Merchant classification codes
- Business-to-business payment semantics
- Support for different merchant names and identifiers

### 4. **Consistent Architecture**
- Same event-driven pattern as Mobile Simulator
- Reusable notification service infrastructure
- Template-based API configuration
- Centralized state management

## LEI Merchant Payment Flow Summary

```
1. User clicks "Start Payment"
   ↓
2. GET /parties/ALIAS/{payee_LEI} → Loading: "Looking up merchant..."
   ↓
3. PUT /parties/ALIAS/{payee_LEI} → Show merchant info + amount input
   ↓
4. User clicks "Get Quote" 
   ↓
5. POST /quotes → Loading: "Getting quote..."
   ↓
6. PUT /quotes → Show quote details + Transfer/Cancel buttons
   ↓
7. User clicks "Transfer Money"
   ↓
8. POST /transfers → Loading: "Processing transfer..."
   ↓
9. PUT /transfers → Show success + Reset button
```

## Comparison with Mobile Simulator

| Feature | Mobile Simulator | LEI Merchant Payments |
|---------|------------------|----------------------|
| **Identity Type** | MSISDN (phone numbers) | LEI (Legal Entity Identifiers) |
| **Party Lookup** | `/parties/MSISDN/{phone}` | `/parties/ALIAS/{LEI}` |
| **Use Case** | P2P consumer payments | B2B merchant payments |
| **Flow Pattern** | ✅ Event-driven | ✅ Event-driven |
| **Loading States** | ✅ Descriptive messages | ✅ Descriptive messages |
| **Auto-progression** | ✅ Response-based | ✅ Response-based |
| **Reset Capability** | ✅ Full reset | ✅ Full reset |

The LEI Merchant Payments demo now provides the same seamless, event-driven user experience as the Mobile Simulator, adapted specifically for merchant-to-merchant payment scenarios using Legal Entity Identifiers.