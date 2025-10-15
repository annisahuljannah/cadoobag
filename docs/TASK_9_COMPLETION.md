# Task 9 Completion - Order Creation Endpoint

**Date**: October 15, 2025  
**Task**: 9 - Create Order Creation Endpoint  
**Status**: ✅ **COMPLETED**

---

## 📋 Overview

Task 9 menyelesaikan implementasi endpoint utama untuk membuat order lengkap yang mengintegrasikan:
- ✅ Cart items validation & stock checking
- ✅ Shipping address & cost calculation
- ✅ Voucher discount application
- ✅ Payment channel selection & fee calculation
- ✅ Tripay payment transaction creation
- ✅ Database order persistence with transactions
- ✅ Inventory reservation system
- ✅ Automatic rollback on payment failure

---

## 🎯 Features Implemented

### 1. Complete Order Creation Flow

**Endpoint**: `POST /api/orders`

**Request Body**:
```typescript
{
  items: [
    { variantId: number, qty: number }
  ],
  shippingAddress: {
    receiverName: string,
    phone: string,
    provinceId: string,
    provinceName: string,
    cityId: string,
    cityName: string,
    subdistrictId: string,
    subdistrictName: string,
    postalCode?: string,
    address: string,
    notes?: string
  },
  shippingMethod: {
    courier: string,      // "jne", "tiki", "pos"
    service: string,      // "REG", "YES", etc.
    cost: number,
    etd?: string          // "2-3 hari"
  },
  paymentMethod: string,  // Tripay channel code (BRIVA, OVO, etc.)
  voucherCode?: string    // Optional discount voucher
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-1729046400123-456",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "total": 275000,
      "grandTotal": 279000,
      "createdAt": "2025-10-15T08:20:00.123Z"
    },
    "payment": {
      "reference": "TP123456789",
      "method": "BRIVA",
      "methodName": "BRI Virtual Account",
      "amount": 275000,
      "fee": 4000,
      "total": 279000,
      "payCode": "123456789012345",
      "payUrl": null,
      "checkoutUrl": "https://tripay.co.id/checkout/...",
      "qrUrl": null,
      "expiredAt": "2025-10-16T08:20:00.000Z",
      "instructions": [
        {
          "title": "ATM BRI",
          "steps": [
            "Masukkan kartu ATM",
            "Pilih menu Pembayaran/Payment",
            "Pilih menu Lainnya/Others",
            "..."
          ]
        }
      ]
    }
  }
}
```

---

## 🔄 Order Creation Process

### Step-by-Step Flow:

```
1. Validate Request Body
   ↓
2. Fetch & Validate Product Variants
   - Check product exists
   - Check product is active
   - Check stock availability
   ↓
3. Calculate Pricing
   - Calculate subtotal (price × qty)
   - Calculate total weight
   - Apply voucher discount (if provided)
   - Add shipping cost
   - Calculate total
   ↓
4. Validate Payment Method
   - Check Tripay channel exists
   - Calculate payment fee
   - Calculate grand total
   ↓
5. Generate Unique Order Reference
   - Format: ORD-{timestamp}-{random}
   ↓
6. Create Order in Database (Transaction)
   - Create order record
   - Create order items
   - Reserve inventory
   - Increment voucher usage
   ↓
7. Create Payment Transaction (Tripay)
   - Generate HMAC signature
   - Call Tripay API
   - Get payment instructions
   ↓
8. Update Order with Tripay Reference
   ↓
9. Return Success Response
```

---

## 💾 Database Operations

### Order Table Fields:
```typescript
{
  orderNumber: string,       // Unique reference
  status: 'PENDING',         // Initial status
  paymentStatus: 'UNPAID',   // Initial payment status
  paymentMethod: string,     // Tripay channel code
  paymentReference: string,  // Tripay reference
  subtotal: number,
  shippingCost: number,
  discount: number,
  total: number,
  paymentFee: number,
  grandTotal: number,
  totalWeight: number,
  voucherId?: number,
  // Shipping info
  shippingCourier: string,
  shippingService: string,
  shippingEtd: string,
  // Address
  receiverName: string,
  receiverPhone: string,
  province: string,
  city: string,
  subdistrict: string,
  postalCode: string,
  address: string,
  notes: string
}
```

### OrderItem Table:
```typescript
{
  orderId: number,
  productId: number,
  variantId: number,
  sku: string,
  name: string,
  quantity: number,
  price: number,
  subtotal: number
}
```

### Inventory Updates:
```typescript
// Reserve stock when order created
inventory.reserved += quantity

// When payment confirmed (webhook):
inventory.stock -= quantity
inventory.reserved -= quantity
```

---

## 🔒 Transaction Safety

### Database Transaction
All database operations wrapped in `prisma.$transaction()`:
```typescript
const order = await prisma.$transaction(async (tx) => {
  // 1. Create order
  const newOrder = await tx.order.create(...)
  
  // 2. Create order items
  await tx.orderItem.createMany(...)
  
  // 3. Reserve inventory
  for (const item of items) {
    await tx.inventory.update({
      where: { variantId: item.variantId },
      data: { reserved: { increment: item.qty } }
    })
  }
  
  // 4. Increment voucher usage
  if (voucherId) {
    await tx.voucher.update({
      where: { id: voucherId },
      data: { used: { increment: 1 } }
    })
  }
  
  return newOrder
})
```

### Automatic Rollback
If Tripay payment creation fails:
```typescript
try {
  const tripayTransaction = await tripay.createTransaction(...)
} catch (paymentError) {
  // Cancel order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'FAILED'
    }
  })
  
  // Release reserved inventory
  for (const item of items) {
    await prisma.inventory.update({
      where: { variantId: item.variantId },
      data: {
        reserved: Math.max(0, inventory.reserved - item.qty)
      }
    })
  }
  
  throw new BadRequestError('Failed to create payment...')
}
```

---

## ✅ Validation Logic

### 1. Stock Availability
```typescript
const availableStock = inventory.stock - inventory.reserved

if (qty > availableStock) {
  throw new BadRequestError(
    `Insufficient stock. Available: ${availableStock}`,
    'INSUFFICIENT_STOCK'
  )
}
```

### 2. Product Active Status
```typescript
if (!product.active) {
  throw new BadRequestError(
    `Product ${product.name} is not active`
  )
}
```

### 3. Voucher Validation
```typescript
// Check active
if (!voucher.active) {
  throw new BadRequestError('Voucher is not active', 'VOUCHER_INACTIVE')
}

// Check date range
if (now < voucher.startAt || now > voucher.endAt) {
  throw new BadRequestError('Voucher has expired', 'VOUCHER_EXPIRED')
}

// Check quota
if (voucher.used >= voucher.quota) {
  throw new BadRequestError('Voucher quota exceeded', 'VOUCHER_QUOTA_EXCEEDED')
}
```

### 4. Payment Method Validation
```typescript
const paymentChannel = await tripay.getPaymentChannel(paymentMethod)

if (!paymentChannel) {
  throw new BadRequestError(
    `Payment method '${paymentMethod}' is not available`,
    'INVALID_PAYMENT_METHOD'
  )
}
```

---

## 📊 Pricing Calculation

### Formula:
```typescript
// 1. Subtotal
subtotal = Σ (item.price × item.qty)

// 2. Discount (if voucher applied)
if (voucher.type === 'PERCENTAGE') {
  discount = subtotal × (voucher.value / 100)
} else if (voucher.type === 'FIXED') {
  discount = voucher.value
}

// 3. Total
total = subtotal + shippingCost - discount

// 4. Payment Fee
paymentFee = channel.fee_customer.flat + (total × channel.fee_customer.percent / 100)

// Apply min/max limits
if (paymentFee < channel.minimum_fee) paymentFee = channel.minimum_fee
if (paymentFee > channel.maximum_fee) paymentFee = channel.maximum_fee

// 5. Grand Total
grandTotal = total + paymentFee
```

---

## 🔗 Integration Points

### 1. RajaOngkir Integration
- Shipping cost already calculated in frontend
- Passed via `shippingMethod.cost`
- Stored in order record

### 2. Tripay Integration
- Payment channel validation
- Payment fee calculation
- Transaction creation with HMAC signature
- Payment instructions retrieval

### 3. Webhook Integration
- Order will be updated when payment confirmed
- Triggered by Tripay callback
- Status changes: PENDING → CONFIRMED (when PAID)

---

## 🧪 Testing Scenarios

### Test Case 1: Successful Order Creation
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"variantId": 1, "qty": 1},
      {"variantId": 10, "qty": 1}
    ],
    "shippingAddress": {
      "receiverName": "John Doe",
      "phone": "081234567890",
      "provinceId": "9",
      "provinceName": "DKI Jakarta",
      "cityId": "152",
      "cityName": "Jakarta Barat",
      "subdistrictId": "2001",
      "subdistrictName": "Cengkareng",
      "postalCode": "11730",
      "address": "Jl. Test No. 123",
      "notes": "Kirim pagi"
    },
    "shippingMethod": {
      "courier": "jne",
      "service": "REG",
      "cost": 25000,
      "etd": "2-3 hari"
    },
    "paymentMethod": "BRIVA",
    "voucherCode": "CADOOLOVE"
  }'
```

### Test Case 2: Insufficient Stock
```bash
# Should return 400 with INSUFFICIENT_STOCK error
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"variantId": 1, "qty": 9999}],
    ...
  }'
```

### Test Case 3: Invalid Voucher
```bash
# Should return 400 with INVALID_VOUCHER error
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "voucherCode": "INVALID_CODE"
    ...
  }'
```

### Test Case 4: Invalid Payment Method
```bash
# Should return 400 with INVALID_PAYMENT_METHOD error
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "paymentMethod": "INVALID_METHOD"
    ...
  }'
```

---

## 🎨 Additional Endpoints

### Get Order by ID
**Endpoint**: `GET /api/orders/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-1729046400123-456",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "subtotal": 250000,
      "shippingCost": 25000,
      "discount": 0,
      "total": 275000,
      "paymentFee": 4000,
      "grandTotal": 279000,
      "receiverName": "John Doe",
      "address": "...",
      "items": [
        {
          "id": 1,
          "name": "Product Name",
          "sku": "SKU-001",
          "quantity": 1,
          "price": 125000,
          "subtotal": 125000,
          "product": {
            "name": "Product Name",
            "slug": "product-name",
            "images": [...]
          },
          "variant": {
            "sku": "SKU-001",
            "size": "M",
            "color": "Black"
          }
        }
      ],
      "voucher": null,
      "createdAt": "2025-10-15T08:20:00.123Z"
    }
  }
}
```

---

## 📝 Error Handling

### Error Types:
1. **Validation Error** (400)
   - Invalid input format
   - Missing required fields
   - Type mismatch

2. **Business Logic Error** (400)
   - Insufficient stock
   - Invalid voucher
   - Invalid payment method
   - Product not active

3. **Payment Error** (400)
   - Tripay API failure
   - Payment creation failed
   - Invalid payment channel

4. **Server Error** (500)
   - Database connection failed
   - Unexpected exceptions

### Error Response Format:
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [...]  // For validation errors
}
```

---

## 📁 Files Modified

### Backend (1 file updated)
```
✅ /backend/src/routes/orders/index.ts  (UPDATED - added 350+ lines)
```

**New Content**:
- `createOrderSchema` - Zod validation schema
- `POST /api/orders` - Complete order creation endpoint (270+ lines)
- `GET /api/orders/:id` - Get order detail endpoint (60+ lines)

**Total Lines Added**: ~350 lines of production code

---

## 🎯 Success Criteria

✅ **Complete Order Flow**:
- Cart → Checkout → Address → Shipping → Payment → Order Created

✅ **Data Integrity**:
- Atomic transactions
- Inventory reservation
- Rollback on failure

✅ **Payment Integration**:
- Tripay transaction creation
- Payment instructions
- Fee calculation

✅ **Error Handling**:
- Validation errors
- Business logic errors
- Automatic cleanup

✅ **Order Tracking**:
- Unique order number
- Status tracking
- Payment status tracking

---

## 🚀 What's Next?

### Task 10: Payment Instructions Page
- Display payment details (VA number, QRIS, etc.)
- Show countdown timer for expiry
- Display step-by-step payment instructions
- Add payment status checking

### Task 11: Order List & Detail Pages
- Customer order history
- Order status display
- Payment status
- Tracking information
- Reorder functionality

### Task 12: Manual Bank Transfer
- Direct bank transfer option
- Payment proof upload
- Admin verification panel
- Manual order confirmation

---

## 💡 Key Takeaways

### What Went Well:
1. **Comprehensive Validation**: All edge cases covered
2. **Transaction Safety**: Atomic operations with rollback
3. **Clean Architecture**: Separation of concerns
4. **Error Handling**: Clear error messages with codes
5. **Integration**: Seamless Tripay + RajaOngkir integration

### Technical Highlights:
1. **Database Transactions**: Ensures data consistency
2. **Inventory Reservation**: Prevents overselling
3. **Automatic Rollback**: Clean up on payment failure
4. **HMAC Signature**: Secure payment creation
5. **Order Reference**: Unique timestamp-based ID

### Best Practices Applied:
1. Single Responsibility Principle
2. Fail-fast validation
3. Explicit error codes
4. Comprehensive logging
5. Type safety with TypeScript & Zod

---

**Status**: ✅ Task 9 COMPLETED  
**Next**: Task 10 - Payment Instructions Page  
**Phase 2 Progress**: 9/12 tasks (75%)  
**Date**: October 15, 2025
