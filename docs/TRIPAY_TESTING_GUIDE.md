# Tripay Integration Testing Guide

**Date**: October 15, 2025  
**Status**: ✅ Backend Implementation Complete (Tasks 6-8)

---

## 🎯 Overview

Tasks 6-8 telah selesai diimplementasikan:
- ✅ Tripay Provider Service dengan HMAC signature
- ✅ Payment API Endpoints (channels, create, detail, fee calculation)
- ✅ Webhook Handler dengan signature verification

---

## 📁 Files Created

### Backend (3 files)
```
✅ /backend/src/providers/tripay.ts           (NEW - 315 lines)
✅ /backend/src/routes/payments/index.ts      (NEW - 220 lines)
✅ /backend/src/routes/webhooks/index.ts      (NEW - 175 lines)
✅ /backend/src/server.ts                     (MODIFIED - added routes)
```

**Total Lines Added**: ~710 lines of code

---

## 🔧 Tripay Provider Features

### Core Methods

**Signature Generation**:
```typescript
tripay.generateSignature(merchantRef: string, amount: number): string
// Returns HMAC SHA256 signature for transaction creation
```

**Callback Verification**:
```typescript
tripay.verifyCallbackSignature(signature: string, json: string): boolean
// Verifies webhook signature from Tripay
```

**Payment Channels**:
```typescript
tripay.getPaymentChannels(): Promise<PaymentChannel[]>
// Get all active payment channels with fee information

tripay.getPaymentChannel(code: string): Promise<PaymentChannel | null>
// Get specific channel details
```

**Transaction Management**:
```typescript
tripay.createTransaction(params): Promise<TripayTransaction>
// Create new payment transaction

tripay.getTransactionDetail(reference: string): Promise<TripayTransaction | null>
// Get transaction status and details
```

**Fee Calculation**:
```typescript
tripay.calculateFee(amount, channel, feeType): number
// Calculate payment fee for a channel

tripay.calculateTotalAmount(amount, channel): number
// Calculate total amount including fee
```

---

## 🌐 API Endpoints

### 1. Get Payment Channels

```bash
GET /api/payments/channels
Query: ?type=virtual_account|ewallet|qris|convenience_store (optional)

Response:
{
  "success": true,
  "data": {
    "channels": [
      {
        "group": "Virtual Account",
        "code": "BRIVA",
        "name": "BRI Virtual Account",
        "type": "virtual_account",
        "fee_merchant": { "flat": 0, "percent": 0 },
        "fee_customer": { "flat": 4000, "percent": 0 },
        "total_fee": { "flat": 4000, "percent": 0 },
        "minimum_fee": 0,
        "maximum_fee": 0,
        "icon_url": "https://...",
        "active": true
      }
      // ... more channels
    ],
    "grouped": {
      "virtual_account": [...],
      "ewallet": [...],
      "qris": [...],
      "convenience_store": [...]
    },
    "total": 15
  }
}
```

### 2. Get Specific Channel

```bash
GET /api/payments/channels/:code

Example:
GET /api/payments/channels/BRIVA

Response:
{
  "success": true,
  "data": {
    "channel": { /* channel details */ }
  }
}
```

### 3. Calculate Payment Fee

```bash
POST /api/payments/calculate-fee
Content-Type: application/json

Body:
{
  "method": "BRIVA",
  "amount": 100000
}

Response:
{
  "success": true,
  "data": {
    "method": "BRIVA",
    "method_name": "BRI Virtual Account",
    "amount": 100000,
    "fee": 4000,
    "total": 104000,
    "fee_details": {
      "flat": 4000,
      "percent": 0
    }
  }
}
```

### 4. Create Payment Transaction

```bash
POST /api/payments/tripay/create
Content-Type: application/json

Body:
{
  "method": "BRIVA",
  "merchant_ref": "ORDER-20251015-001",
  "amount": 150000,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "081234567890",
  "order_items": [
    {
      "sku": "PROD-001",
      "name": "Product Name",
      "price": 150000,
      "quantity": 1,
      "product_url": "https://example.com/product",
      "image_url": "https://example.com/image.jpg"
    }
  ],
  "return_url": "https://example.com/orders",
  "expired_time": 86400
}

Response:
{
  "success": true,
  "data": {
    "transaction": {
      "reference": "TP123456789",
      "merchant_ref": "ORDER-20251015-001",
      "payment_method": "BRIVA",
      "payment_name": "BRI Virtual Account",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "081234567890",
      "amount": 150000,
      "fee_merchant": 0,
      "fee_customer": 4000,
      "total_fee": 4000,
      "amount_received": 150000,
      "pay_code": "123456789012345",
      "checkout_url": "https://tripay.co.id/checkout/...",
      "status": "UNPAID",
      "expired_time": 1697404800,
      "order_items": [...],
      "instructions": [
        {
          "title": "ATM BRI",
          "steps": ["Masukkan kartu ATM", "..."]
        }
      ]
    },
    "fee_info": {
      "subtotal": 150000,
      "fee": 4000,
      "total": 154000
    }
  }
}
```

### 5. Get Transaction Detail

```bash
GET /api/payments/tripay/:reference

Example:
GET /api/payments/tripay/TP123456789

Response:
{
  "success": true,
  "data": {
    "transaction": { /* transaction details */ }
  }
}
```

### 6. Webhook Handler

```bash
POST /webhooks/tripay
Content-Type: application/json
X-Callback-Signature: {HMAC_SHA256_SIGNATURE}

Body:
{
  "reference": "TP123456789",
  "merchant_ref": "ORDER-20251015-001",
  "status": "PAID",
  "amount": 150000,
  "amount_received": 150000,
  "paid_at": 1697401234,
  // ... other fields
}

Response:
{
  "success": true,
  "message": "Callback processed successfully"
}
```

### 7. Test Webhook

```bash
GET /webhooks/tripay/test

Response:
{
  "success": true,
  "message": "Tripay webhook endpoint is accessible",
  "timestamp": "2025-10-15T08:04:01.649Z"
}
```

---

## 🧪 Manual Testing

### Prerequisites

**⚠️ Important**: Untuk testing penuh, Anda perlu:

1. **Tripay Account** (Register di [tripay.co.id](https://tripay.co.id))
2. **API Credentials**:
   - API Key
   - Private Key
   - Merchant Code

3. **Update `.env`**:
```bash
TRIPAY_API_KEY=your_actual_api_key_here
TRIPAY_PRIVATE_KEY=your_actual_private_key_here
TRIPAY_MERCHANT_CODE=your_actual_merchant_code_here
TRIPAY_BASE_URL=https://tripay.co.id/api-sandbox  # Use sandbox for testing
```

### Test Scenarios

#### 1. Test Payment Channels
```bash
# Get all channels
curl http://localhost:4000/api/payments/channels

# Get VA channels only
curl "http://localhost:4000/api/payments/channels?type=virtual_account"

# Get specific channel
curl http://localhost:4000/api/payments/channels/BRIVA
```

#### 2. Test Fee Calculation
```bash
curl -X POST http://localhost:4000/api/payments/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "method": "BRIVA",
    "amount": 100000
  }'
```

#### 3. Test Transaction Creation
```bash
curl -X POST http://localhost:4000/api/payments/tripay/create \
  -H "Content-Type: application/json" \
  -d '{
    "method": "BRIVA",
    "merchant_ref": "TEST-ORDER-001",
    "amount": 150000,
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "customer_phone": "081234567890",
    "order_items": [
      {
        "name": "Test Product",
        "price": 150000,
        "quantity": 1
      }
    ]
  }'
```

#### 4. Test Webhook (Requires ngrok or similar)
```bash
# 1. Expose local webhook to internet
ngrok http 4000

# 2. Configure webhook URL in Tripay dashboard
# URL: https://your-ngrok-url.ngrok.io/webhooks/tripay

# 3. Test webhook accessibility
curl https://your-ngrok-url.ngrok.io/webhooks/tripay/test

# 4. Make a payment (Tripay will send callback)
```

---

## 🔒 Security Features

### HMAC Signature Verification

**Transaction Creation**:
```typescript
// Generate signature before sending to Tripay
const signature = crypto
  .createHmac('sha256', PRIVATE_KEY)
  .update(MERCHANT_CODE + MERCHANT_REF + AMOUNT)
  .digest('hex');
```

**Webhook Verification**:
```typescript
// Verify callback signature
const signature = crypto
  .createHmac('sha256', PRIVATE_KEY)
  .update(JSON_STRING)
  .digest('hex');

if (signature !== callback_signature) {
  // Reject invalid callback
}
```

### Validation

- ✅ Zod schema validation for all inputs
- ✅ Email format validation
- ✅ Phone number validation
- ✅ Amount validation (must be > 0)
- ✅ Required fields enforcement

### Error Handling

- ✅ Try-catch blocks on all async operations
- ✅ Detailed error logging
- ✅ Proper HTTP status codes
- ✅ User-friendly error messages

---

## 📊 Database Integration

### Order Updates from Webhook

When payment status changes, webhook updates order:

```typescript
// Payment Status → Order Status Mapping
'PAID'    → status: 'CONFIRMED', paymentStatus: 'PAID'
'FAILED'  → status: 'CANCELLED', paymentStatus: 'FAILED'
'EXPIRED' → status: 'CANCELLED', paymentStatus: 'EXPIRED'
'REFUND'  → status: 'CANCELLED', paymentStatus: 'REFUNDED'
```

### Order Fields Updated
- `status` - Order status
- `paymentStatus` - Payment status
- `paymentMethod` - Payment channel code
- `paymentReference` - Tripay reference
- `paidAt` - Payment timestamp
- `updatedAt` - Update timestamp

---

## 🎨 Payment Channel Types

### Virtual Account (VA)
- **Banks**: BCA, BRI, BNI, Mandiri, Permata, CIMB, etc.
- **Customer Fee**: Flat fee (typically Rp 4.000 - 5.000)
- **Expiry**: 24 hours default
- **Use Case**: Most popular for Indonesian customers

### E-Wallet
- **Providers**: OVO, DANA, ShopeePay, LinkAja
- **Customer Fee**: Usually percentage-based
- **Expiry**: Shorter (typically 1-2 hours)
- **Use Case**: Quick checkout, mobile-first users

### QRIS
- **Providers**: All QRIS-enabled banks/wallets
- **Customer Fee**: Typically 0.7% - 1%
- **Expiry**: 30 minutes - 1 hour
- **Use Case**: Universal QR payment

### Convenience Store
- **Stores**: Indomaret, Alfamart
- **Customer Fee**: Flat fee
- **Expiry**: 48 hours
- **Use Case**: Cash payment, no bank account needed

---

## 🚀 Next Steps

After testing backend integration, proceed with:

1. **Task 9**: Create Order Endpoint
   - Integrate with Tripay transaction creation
   - Save order to database
   - Generate unique merchant_ref

2. **Task 10**: Payment Instructions Page
   - Display payment details (VA number, QRIS, etc.)
   - Show instructions from Tripay
   - Add countdown timer for expiry

3. **Task 11**: Order List & Detail Pages
   - Show customer orders
   - Display payment status
   - Show tracking information

4. **Task 12**: Manual Bank Transfer
   - For direct transfer without payment gateway
   - Upload payment proof
   - Admin verification

---

## 📝 Notes

### Current Limitations

1. **Sandbox Mode**: Using Tripay sandbox for testing
   - Use sandbox credentials during development
   - Switch to production credentials for live

2. **Webhook Testing**: Requires public URL
   - Use ngrok/localtunnel for local testing
   - Configure webhook URL in Tripay dashboard

3. **API Keys**: Currently using placeholder values
   - Update with real credentials from Tripay
   - Keep credentials secure (never commit to git)

### Best Practices

1. **Always Verify Signatures**: Never trust webhooks without verification
2. **Log Everything**: Keep detailed logs for debugging
3. **Handle Errors Gracefully**: Return 200 for webhooks even on errors
4. **Test All Payment Methods**: Different channels have different flows
5. **Monitor Webhook Failures**: Setup alerts for failed callbacks

---

## 📖 Tripay Documentation

- **Main Docs**: [https://tripay.co.id/developer](https://tripay.co.id/developer)
- **Sandbox Dashboard**: [https://tripay.co.id/merchant/sandbox](https://tripay.co.id/merchant/sandbox)
- **Production Dashboard**: [https://tripay.co.id/merchant](https://tripay.co.id/merchant)

---

**Status**: ✅ Tasks 6-8 COMPLETED  
**Next**: Task 9 - Create Order Endpoint  
**Date**: October 15, 2025
