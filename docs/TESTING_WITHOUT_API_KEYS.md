# Testing Phase 2 Without API Keys

This guide explains how to test Phase 2 features without real RajaOngkir and Tripay API credentials using mock data.

> **⚠️ Important Note**: This document provides *example approaches* for testing without API keys. The code examples shown here are templates that you would need to create manually if you want to test without credentials. None of these files are included in the repository by default.

---

## 🎯 Overview

While Phase 2 is complete, it requires external API credentials. For initial testing and development, you can:
1. Use mock data for frontend development (requires manual setup)
2. Test the UI/UX flow without backend calls
3. Validate the integration structure
4. Test with real credentials (recommended - see API_SETUP_GUIDE.md)

---

## 🔧 Option 1: Frontend-Only Testing

Test the checkout flow with mock data without connecting to the backend.

### Step 1: Create Mock Data File

**Note**: This is an optional file you need to create manually for testing.

Create `frontend/src/lib/mockData.ts`:

```typescript
export const mockProvinces = [
  { id: '11', name: 'Jawa Timur' },
  { id: '12', name: 'Jawa Tengah' },
  { id: '9', name: 'DKI Jakarta' },
];

export const mockCities = {
  '11': [
    { id: '444', name: 'Surabaya', type: 'Kota', postalCode: '60000' },
    { id: '445', name: 'Malang', type: 'Kota', postalCode: '65000' },
  ],
  '12': [
    { id: '501', name: 'Yogyakarta', type: 'Kota', postalCode: '55000' },
    { id: '455', name: 'Semarang', type: 'Kota', postalCode: '50000' },
  ],
  '9': [
    { id: '151', name: 'Jakarta Selatan', type: 'Kota', postalCode: '12000' },
    { id: '152', name: 'Jakarta Utara', type: 'Kota', postalCode: '14000' },
  ],
};

export const mockSubdistricts = {
  '444': [
    { id: '6139', name: 'Gubeng' },
    { id: '6140', name: 'Tegalsari' },
  ],
  // Add more as needed
};

export const mockShippingCosts = [
  {
    code: 'jne',
    name: 'JNE',
    services: [
      { service: 'REG', description: 'Regular', cost: 25000, etd: '2-3' },
      { service: 'YES', description: 'Yakin Esok Sampai', cost: 45000, etd: '1-2' },
    ],
  },
  {
    code: 'tiki',
    name: 'TIKI',
    services: [
      { service: 'REG', description: 'Regular Service', cost: 23000, etd: '3-4' },
      { service: 'ONS', description: 'Over Night Service', cost: 42000, etd: '1' },
    ],
  },
  {
    code: 'pos',
    name: 'POS Indonesia',
    services: [
      { service: 'Paket Kilat Khusus', description: 'Express', cost: 20000, etd: '2-4' },
    ],
  },
];

export const mockPaymentChannels = [
  {
    group: 'Virtual Account',
    code: 'BRIVA',
    name: 'BRI Virtual Account',
    type: 'virtual_account',
    fee_customer: { flat: 4000, percent: 0 },
    active: true,
  },
  {
    group: 'Virtual Account',
    code: 'BNIVA',
    name: 'BNI Virtual Account',
    type: 'virtual_account',
    fee_customer: { flat: 4000, percent: 0 },
    active: true,
  },
  {
    group: 'E-Wallet',
    code: 'OVO',
    name: 'OVO',
    type: 'ewallet',
    fee_customer: { flat: 0, percent: 2 },
    active: true,
  },
  {
    group: 'QRIS',
    code: 'QRIS',
    name: 'QRIS (All E-Wallet)',
    type: 'qris',
    fee_customer: { flat: 500, percent: 0.7 },
    active: true,
  },
];
```

### Step 2: Modify Hooks to Use Mock Data

**Note**: This shows how you would modify the existing hook to support mock data. This is optional for testing.

Update `frontend/src/hooks/useLocations.ts`:

```typescript
import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { Province, City, Subdistrict } from '@/types/dto';
import { mockProvinces, mockCities, mockSubdistricts } from '@/lib/mockData';

// Add this flag at the top
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setProvinces(mockProvinces);
      return;
    }

    // Original API call code...
  }, []);

  return { provinces, loading, error };
}

// Similar changes for useCities and useSubdistricts
```

### Step 3: Enable Mock Mode

**Note**: Create this file if it doesn't exist.

In `frontend/.env.local`:

```env
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 4: Test Checkout Flow

1. Start frontend: `cd frontend && pnpm dev`
2. Add items to cart
3. Go to checkout
4. Test location selection (mock provinces/cities)
5. Test courier selection (mock shipping costs)
6. See how the UI flows work

---

## 🔧 Option 2: Backend Mock Endpoints

Create mock endpoints that return sample data without calling external APIs.

### Step 1: Create Mock Router

**Note**: This is an optional approach. You would need to create this file manually.

Create `backend/src/routes/mock/index.ts`:

```typescript
import { FastifyPluginAsync } from 'fastify';

export const mockRoutes: FastifyPluginAsync = async (fastify) => {
  // Mock provinces
  fastify.get('/mock/locations/provinces', async () => ({
    success: true,
    data: {
      provinces: [
        { id: '11', name: 'Jawa Timur' },
        { id: '12', name: 'Jawa Tengah' },
        { id: '9', name: 'DKI Jakarta' },
      ],
    },
  }));

  // Mock cities
  fastify.get('/mock/locations/cities/:provinceId', async (request) => {
    const { provinceId } = request.params as { provinceId: string };
    const cities = {
      '11': [
        { id: '444', name: 'Surabaya', type: 'Kota' },
      ],
      '12': [
        { id: '501', name: 'Yogyakarta', type: 'Kota' },
      ],
    };
    
    return {
      success: true,
      data: { cities: cities[provinceId] || [] },
    };
  });

  // Mock shipping costs
  fastify.post('/mock/shipping/cost', async () => ({
    success: true,
    data: {
      couriers: [
        {
          code: 'jne',
          name: 'JNE',
          services: [
            { service: 'REG', cost: 25000, etd: '2-3' },
            { service: 'YES', cost: 45000, etd: '1-2' },
          ],
        },
      ],
    },
  }));

  // Mock payment channels
  fastify.get('/mock/payments/channels', async () => ({
    success: true,
    data: {
      channels: [
        {
          code: 'BRIVA',
          name: 'BRI Virtual Account',
          type: 'virtual_account',
          fee_customer: { flat: 4000, percent: 0 },
        },
      ],
    },
  }));
};
```

### Step 2: Register Mock Routes

**Note**: This shows how you would modify the server file. This is optional.

In `backend/src/server.ts`, add:

```typescript
import { mockRoutes } from './routes/mock';

// Add before other routes
if (process.env.NODE_ENV === 'development') {
  server.register(mockRoutes, { prefix: '/api' });
  logger.info('Mock routes enabled for development');
}
```

### Step 3: Use Mock Endpoints

Update frontend to call mock endpoints:

In `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/mock
```

---

## 🧪 Option 3: Manual Testing Script

Test the order flow with a curl script.

**Note**: This is an example script you can create for testing. Create this file manually.

Create `backend/test-order-flow.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:4000/api"

echo "🧪 Testing Order Flow"
echo "====================="

# 1. Test products
echo -e "\n${GREEN}1. Fetching products...${NC}"
curl -s $BASE_URL/products | jq '.data[0] | {id, name, price}'

# 2. Test cart
echo -e "\n${GREEN}2. Creating cart...${NC}"
CART_ID=$(curl -s $BASE_URL/carts | jq -r '.data.id')
echo "Cart ID: $CART_ID"

# 3. Add to cart
echo -e "\n${GREEN}3. Adding item to cart...${NC}"
curl -s -X POST $BASE_URL/carts/items \
  -H "Content-Type: application/json" \
  -H "x-cart-id: $CART_ID" \
  -d '{
    "variantId": 1,
    "qty": 2
  }' | jq '.success'

# 4. Order preview
echo -e "\n${GREEN}4. Order preview...${NC}"
curl -s -X POST $BASE_URL/orders/preview \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"variantId": 1, "qty": 2}],
    "shippingCost": 25000,
    "voucherCode": "WELCOME10"
  }' | jq '{subtotal, discount, total}'

# 5. Manual payment banks
echo -e "\n${GREEN}5. Manual payment banks...${NC}"
curl -s $BASE_URL/manual-payment/banks | jq '.data[0]'

echo -e "\n${GREEN}✅ Test completed!${NC}"
```

Run:
```bash
chmod +x backend/test-order-flow.sh
./backend/test-order-flow.sh
```

---

## 📝 UI/UX Testing Checklist

Test these without API credentials:

### Checkout Page
- [ ] Cart items display correctly
- [ ] Step navigation works (1 → 2 → 3)
- [ ] Address form validation
- [ ] Province/city/subdistrict dropdowns are functional (with mock)
- [ ] Shipping cost appears after selecting courier (with mock)
- [ ] Voucher input shows error/success
- [ ] Order summary calculates correctly
- [ ] Payment method selection works
- [ ] Responsive on mobile

### Payment Pages
- [ ] Payment instruction page renders
- [ ] Copy button works
- [ ] Countdown timer displays
- [ ] Manual transfer page shows bank accounts
- [ ] File upload button works
- [ ] Form validation works

### Order Pages
- [ ] Orders list displays (even if empty)
- [ ] Order detail shows structure
- [ ] Status badges render correctly
- [ ] Timeline/history displays

### Admin Pages
- [ ] Pending payments page loads
- [ ] Verify/reject buttons are functional
- [ ] Image preview works

---

## 🐛 Testing Individual Components

### Test LocationSelector

**Note**: This is an example test page you can create. Create this file manually.

```tsx
// Create: frontend/src/app/test-components/page.tsx
'use client';

import { useState } from 'react';
import { LocationSelector } from '@/components/checkout/LocationSelector';

export default function TestPage() {
  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [subdistrictId, setSubdistrictId] = useState('');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Location Selector</h1>
      <div className="max-w-md space-y-4">
        <LocationSelector
          provinceId={provinceId}
          cityId={cityId}
          subdistrictId={subdistrictId}
          onProvinceChange={setProvinceId}
          onCityChange={setCityId}
          onSubdistrictChange={setSubdistrictId}
        />
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Selected Values:</h2>
        <p>Province: {provinceId || 'Not selected'}</p>
        <p>City: {cityId || 'Not selected'}</p>
        <p>Subdistrict: {subdistrictId || 'Not selected'}</p>
      </div>
    </div>
  );
}
```

Access at: http://localhost:3000/test-components

---

## 🎨 Visual Testing

Test UI without functionality:

1. **Checkout Flow**: 
   - Navigate through all 3 steps
   - Check form layouts
   - Test responsive breakpoints
   - Verify button states

2. **Payment Pages**:
   - Check countdown timer UI
   - Test payment instruction layout
   - Verify copy button placement
   - Test image upload preview

3. **Order Pages**:
   - Check table/card layouts
   - Test status badge colors
   - Verify empty state messages
   - Test pagination UI

---

## 🔍 Code Quality Testing

Even without API credentials, you can test:

### 1. TypeScript Compilation
```bash
cd backend
pnpm type-check

cd frontend
pnpm run type-check
```

### 2. Linting
```bash
cd backend
pnpm lint

cd frontend
pnpm lint
```

### 3. Build Process
```bash
cd backend
pnpm build

cd frontend
pnpm build
```

### 4. Test Coverage (if tests exist)
```bash
cd backend
pnpm test

cd frontend
pnpm test
```

---

## 📊 What Can Be Tested Without API Keys

| Feature | Testable Without API | Notes |
|---------|---------------------|--------|
| Cart functionality | ✅ Yes | Fully functional |
| Product browsing | ✅ Yes | Fully functional |
| Checkout UI | ✅ Yes | With mock data |
| Location selection | ⚠️ Partial | Need mock data |
| Shipping calculation | ⚠️ Partial | Need mock data |
| Payment channels | ⚠️ Partial | Need mock data |
| Order creation | ❌ No | Requires Tripay |
| Webhook | ❌ No | Requires Tripay |
| Admin verification | ✅ Yes | UI testable |

---

## 🚀 When You Get API Keys

Once you have API credentials:

1. Add keys to `backend/.env`
2. Remove mock data flags
3. Restart both servers
4. Test end-to-end flow
5. Document any issues

---

## 💡 Tips for Development

1. **Use Browser DevTools**: Check network requests, console errors
2. **Test Progressive**: Start with UI, then add API integration
3. **Keep Mock Data Realistic**: Use actual Indonesian addresses
4. **Document Issues**: Note what doesn't work for future fixing
5. **Test Edge Cases**: Empty cart, invalid voucher, etc.

---

**Last Updated**: October 16, 2025  
**For**: Phase 2 Development Testing
