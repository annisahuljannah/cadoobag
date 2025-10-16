# API Setup Guide - Phase 2

This guide will help you get API credentials for RajaOngkir and Tripay to complete Phase 2 testing.

---

## 🚚 RajaOngkir API Setup

### What is RajaOngkir?
RajaOngkir is Indonesia's leading shipping cost calculation API. It supports major couriers like JNE, TIKI, POS Indonesia, and many others.

### Step 1: Create Account
1. Go to https://rajaongkir.com
2. Click "Daftar" (Register) in the top right
3. Fill in:
   - Name
   - Email
   - Phone Number
   - Company (optional)
4. Verify your email

### Step 2: Choose Plan
RajaOngkir offers 3 plans:

| Plan | Price | Features | Hit/Month |
|------|-------|----------|-----------|
| **Starter** | FREE or Rp 9,000 | Province, City, Basic couriers | 30 free, 1,000 paid |
| **Basic** | Rp 25,000 | + Subdistrict, More couriers | 1,000 |
| **Pro** | Rp 75,000 | + International, All couriers | Unlimited |

**Recommendation**: 
- **For Development**: Starter (Free) or Basic
- **For Production**: Basic or Pro (depending on traffic)

### Step 3: Get API Key
1. Login to your dashboard
2. Go to "API Key" menu
3. Copy your API Key
4. Note the API endpoint:
   - Starter: `https://api.rajaongkir.com/starter`
   - Basic: `https://api.rajaongkir.com/basic`
   - Pro: `https://pro.rajaongkir.com/api`

### Step 4: Configure in Project
```bash
cd backend
nano .env
```

Add:
```env
RAJAONGKIR_API_KEY=your_api_key_here
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter
```

### Step 5: Test
```bash
# Restart backend
cd backend
pnpm dev

# Test provinces endpoint
curl http://localhost:4000/api/locations/provinces

# Should return list of Indonesian provinces
```

### Troubleshooting
- **401 Unauthorized**: API key is incorrect
- **403 Forbidden**: Plan limit exceeded (upgrade plan)
- **429 Too Many Requests**: Daily limit reached (wait or upgrade)

---

## 💳 Tripay Payment Gateway Setup

### What is Tripay?
Tripay is an Indonesian payment aggregator supporting:
- Virtual Account (BCA, Mandiri, BNI, BRI, etc.)
- E-Wallet (OVO, DANA, ShopeePay, LinkAja, GoPay)
- QRIS
- Convenience Store (Alfamart, Indomaret)

### Step 1: Create Account
1. Go to https://tripay.co.id
2. Click "Daftar" (Register)
3. Fill in:
   - Business Name
   - Email
   - Phone Number
   - Business Type
4. Verify your email and phone

### Step 2: Merchant Application
1. Login to dashboard
2. Go to "Merchant Application" or "Pengajuan Merchant"
3. Submit required documents:
   - ID Card (KTP)
   - Business License (SIUP/NIB) or CV/PT documents
   - Tax Number (NPWP)
   - Bank Account proof
4. Wait for approval (usually 1-3 business days)

### Step 3: Get API Credentials
Once approved:
1. Go to "API Settings" or "Pengaturan API"
2. You'll find:
   - **API Key**: For authentication
   - **Private Key**: For signature generation
   - **Merchant Code**: Your unique identifier

### Step 4: Set Sandbox Mode
For testing without real transactions:
1. Go to "Settings" > "Mode"
2. Switch to **Sandbox Mode**
3. API URL will be: `https://tripay.co.id/api-sandbox`

### Step 5: Configure in Project
```bash
cd backend
nano .env
```

Add:
```env
TRIPAY_API_KEY=your_api_key_here
TRIPAY_PRIVATE_KEY=your_private_key_here
TRIPAY_MERCHANT_CODE=T1234
TRIPAY_BASE_URL=https://tripay.co.id/api-sandbox
```

### Step 6: Setup Webhook
Tripay needs to send payment status updates to your server.

1. In Tripay dashboard, go to "Webhook URL"
2. Set webhook URL: `https://yourdomain.com/webhooks/tripay`
3. For local development, use ngrok:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local backend
   ngrok http 4000
   
   # Use the https URL from ngrok
   # Example: https://abc123.ngrok.io/webhooks/tripay
   ```

### Step 7: Test Payment Channels
```bash
# Get available payment channels
curl -H "Authorization: Bearer your_api_key" \
  https://tripay.co.id/api-sandbox/merchant/payment-channel

# Should return list of active payment methods
```

### Step 8: Test Transaction Creation
```bash
cd backend
pnpm dev

# In another terminal
curl -X POST http://localhost:4000/api/payments/tripay/create \
  -H "Content-Type: application/json" \
  -d '{
    "method": "BRIVA",
    "merchant_ref": "TEST-001",
    "amount": 100000,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "08123456789",
    "order_items": [
      {
        "name": "Test Product",
        "price": 100000,
        "quantity": 1
      }
    ]
  }'
```

### Troubleshooting
- **401 Unauthorized**: API Key is wrong
- **403 Forbidden**: Merchant not yet approved
- **400 Invalid Signature**: Private Key mismatch
- **400 Duplicate Reference**: merchant_ref already used (must be unique)

---

## 🧪 Testing Sandbox Transactions

### Virtual Account (Recommended for Testing)
1. Create transaction with method: `BRIVA`, `BNIVA`, `BRIVA`, etc.
2. You'll get a VA number
3. Use Tripay's test payment page to simulate payment
4. Webhook will be called automatically

### E-Wallet (OVO, DANA)
1. Create transaction with method: `DANA`, `OVO`, etc.
2. You'll get a payment URL
3. Open URL in browser
4. Use test credentials provided by Tripay

### QRIS
1. Create transaction with method: `QRIS`
2. You'll get a QR code
3. Use Tripay's test QR scanner
4. Payment is instant

### Testing Webhook
```bash
# 1. Check if webhook endpoint is accessible
curl http://localhost:4000/webhooks/tripay/test

# 2. Simulate callback (requires valid signature)
# Use Tripay dashboard to send test callback
```

---

## 📊 Cost Estimation

### Development Phase (Sandbox)
- RajaOngkir: **FREE** (30 hit/month) or **Rp 9,000/month** (1,000 hit)
- Tripay: **FREE** (sandbox mode)
- **Total**: FREE - Rp 9,000/month

### Production Phase (100 orders/month)
- RajaOngkir Basic: **Rp 25,000/month** (1,000 hit)
- Tripay: **No monthly fee** (only transaction fees 0.7% - 4%)
- **Total**: Rp 25,000/month + transaction fees

Example transaction fees (per transaction):
- Virtual Account: Rp 4,000 - Rp 5,000
- E-Wallet: 0.7% - 2.5%
- QRIS: Rp 500 - Rp 750
- Convenience Store: Rp 4,500

---

## 🚀 Going to Production

### RajaOngkir Production
1. Upgrade to Basic plan (minimum for subdistrict support)
2. Change `RAJAONGKIR_BASE_URL` to production endpoint
3. Update `ORIGIN_CITY_ID` in code to your warehouse city

### Tripay Production
1. Ensure merchant application is approved
2. Complete bank verification
3. Switch from Sandbox to Production mode in dashboard
4. Update `TRIPAY_BASE_URL` to production: `https://tripay.co.id/api`
5. Set up production webhook URL (must be HTTPS)
6. Test with small real transaction

### Webhook Requirements
For production, your webhook must:
- Be publicly accessible (not localhost)
- Use HTTPS (SSL certificate)
- Respond within 5 seconds
- Return 200 status code
- Be idempotent (handle duplicate callbacks)

**Recommended hosting:**
- Backend: Railway, Fly.io, DigitalOcean App Platform
- Database: Vercel Postgres, PlanetScale, Railway
- Frontend: Vercel, Netlify

---

## 🔒 Security Best Practices

### 1. API Keys
- ✅ Keep keys in `.env` file
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit keys to GitHub
- ✅ Use different keys for development and production

### 2. Webhook Security
- ✅ Always verify Tripay signature
- ✅ Implement idempotent processing
- ✅ Rate limit webhook endpoint
- ✅ Log all webhook calls

### 3. Payment Security
- ✅ Validate amounts server-side
- ✅ Check order ownership
- ✅ Don't trust client-side calculations
- ✅ Implement timeout for pending payments

---

## 📞 Support Contacts

### RajaOngkir
- Website: https://rajaongkir.com
- Support: support@rajaongkir.com
- Docs: https://rajaongkir.com/dokumentasi

### Tripay
- Website: https://tripay.co.id
- Support: support@tripay.co.id
- Telegram: @tripayid
- Docs: https://tripay.co.id/developer

### Community
- Indonesian Laravel Community
- Indonesian E-commerce Developers
- Stackoverflow (tag: rajaongkir, tripay, indonesian-payment)

---

## ✅ Checklist

Before going live, ensure:

- [ ] RajaOngkir API Key obtained and tested
- [ ] Tripay merchant account approved
- [ ] Tripay API credentials configured
- [ ] Webhook URL set up and tested
- [ ] Sandbox transactions successful
- [ ] Error handling tested (failed payments, expired, etc.)
- [ ] Production SSL certificate ready
- [ ] Backup payment method available (manual transfer)
- [ ] Customer support email/phone prepared
- [ ] Terms & Conditions updated
- [ ] Privacy Policy updated (payment data handling)

---

**Last Updated**: October 16, 2025  
**For**: Cadoobag Phase 2 Implementation
