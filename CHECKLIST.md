# Cadoobag Development Checklist

## Phase 0: Infrastructure Setup ✅ COMPLETED
- [x] Initialize PNPM monorepo
- [x] Setup backend (Fastify + TypeScript + Prisma)
- [x] Setup frontend (Next.js 14 + TypeScript + Tailwind)
- [x] Create database schema (16 tables)
- [x] Run initial migration
- [x] Create seed script with sample data (10 products, 80 variants)
- [x] Configure CORS and basic middleware
- [x] Test servers (backend:4000, frontend:3000)

## Phase 1: Basic Catalog & Cart ✅ COMPLETED
### Backend API ✅
- [x] Product endpoints (list, detail, filters, search, sort)
- [x] Category endpoints (list, detail)
- [x] Cart endpoints (CRUD with stock validation)
- [x] Order preview endpoint (with voucher support)

### Frontend ✅
- [x] Layout components (Navbar with cart integration, Footer)
- [x] Homepage (hero, categories, features)
- [x] Product list page with ProductGrid
- [x] Product detail page (variant selector, add-to-cart)
- [x] Shopping cart drawer (view, update, remove items)
- [x] Basic checkout page (3-step form, placeholders for Phase 2)
- [x] Cart state management (Zustand)
- [x] Responsive design (mobile-first)
- [x] Brand consistency (colors, fonts, components)

---

## Phase 2 — RajaOngkir & Pembayaran ✅ CODE COMPLETE (Needs API Credentials)

### Backend ✅

- [x] **RajaOngkir Integration**
  - [x] Provider service (`providers/rajaongkir.ts`)
  - [x] `GET /api/locations/provinces` - Get provinces
  - [x] `GET /api/locations/cities/:provinceId` - Get cities
  - [x] `GET /api/locations/subdistricts/:cityId` - Get subdistricts
  - [x] `POST /api/shipping/cost` - Calculate shipping cost
  - [x] Cache shipping cost (TTL 24 hours for locations, no cache for cost)
  - [x] Handle RajaOngkir API errors gracefully

- [x] **Voucher Service**
  - [x] Validate voucher code (integrated in order preview)
  - [x] Apply discount calculation (percent/fixed)
  - [x] Check min spend, quota, active status, date range

- [x] **Order Creation**
  - [x] `POST /api/orders` - Create order with payment
  - [x] Validate stock availability
  - [x] Reserve inventory
  - [x] Create order + order items records
  - [x] Generate order number

- [x] **Tripay Payment**
  - [x] Provider service (`providers/tripay.ts`)
  - [x] `POST /api/payments/tripay/create` - Create transaction
  - [x] `GET /api/payments/channels` - Get payment channels list
  - [x] `POST /api/payments/calculate-fee` - Calculate payment fees
  - [x] Handle Tripay API response
  - [x] Store payment info (refNo, vaNo, instructions)

- [x] **Tripay Webhook**
  - [x] `POST /webhooks/tripay` - Handle callback
  - [x] Verify HMAC signature
  - [x] Idempotent processing (check merchant_ref)
  - [x] Update payment status (PAID/FAILED/EXPIRED/REFUND)
  - [x] Update order status
  - [x] Handle all payment states

- [x] **Manual Transfer**
  - [x] `GET /api/manual-payment/banks` - Get bank accounts
  - [x] `POST /api/manual-payment/upload-proof` - Upload bukti bayar
  - [x] Store file URL & update payment meta
  - [x] Set status PENDING_VERIFICATION
  - [x] `GET /api/manual-payment/admin/pending` - Admin: Get pending verifications
  - [x] `POST /api/manual-payment/admin/verify/:id` - Admin: Verify payment
  - [x] `POST /api/manual-payment/admin/reject/:id` - Admin: Reject payment

### Frontend ✅

- [x] **Checkout - Complete**
  - [x] Address form with cascading select (province → city → subdistrict)
  - [x] Shipping cost calculation real-time
  - [x] Courier selection (JNE/TIKI/POS with services)
  - [x] ETD display
  - [x] Voucher code input & validation
  - [x] Discount display
  - [x] Payment method selection

- [x] **Payment**
  - [x] Payment method selection (Tripay channels vs Manual Transfer)
  - [x] Tripay: Show available channels (VA, QRIS, etc.)
  - [x] Manual Transfer: Show bank account info
  - [x] Upload bukti bayar for manual transfer
  - [x] Payment instruction page `/payment/[reference]`
  - [x] Manual payment page `/payment/manual/[reference]`
  - [x] VA number, QR code, instructions display
  - [x] Payment countdown timer

- [x] **Order Status**
  - [x] Order list page `/orders`
  - [x] Order detail page `/orders/[id]`
  - [x] Order status badge
  - [x] Payment status indicator
  - [x] Order items display
  - [x] Shipping info

- [x] **Admin Payment Verification**
  - [x] Admin payments page `/admin/payments`
  - [x] View pending manual transfers
  - [x] Verify/reject payment with proof image view

- [x] **UI/UX Polish**
  - [x] Loading spinners
  - [x] Form validation
  - [x] Responsive design (mobile, tablet, desktop)
  - [x] Empty states

### ⚠️ Required to Test Phase 2

- [ ] **API Credentials Needed**
  - [ ] RajaOngkir API Key (get from https://rajaongkir.com)
  - [ ] Tripay API Key, Private Key, Merchant Code (get from https://tripay.co.id)
  - [ ] Configure in backend/.env

- [ ] **End-to-End Testing**
  - [ ] Test location cascading (province → city → subdistrict)
  - [ ] Test shipping cost calculation with real data
  - [ ] Test Tripay payment flow with sandbox
  - [ ] Test manual transfer upload
  - [ ] Test webhook signature verification
  - [ ] Test admin payment verification

**Status**: ✅ Code Complete (95%) - Ready for API integration & testing

---

## Phase 3 — Admin & Operasional

### Backend

- [ ] **Admin Auth**
  - [ ] `POST /api/admin/login` - Admin login
  - [ ] JWT token issuance
  - [ ] Auth middleware (`middlewares/auth.ts`)
  - [ ] Role guard middleware

- [ ] **Admin Product Management**
  - [ ] `GET /api/admin/products` - List products (paginated)
  - [ ] `POST /api/admin/products` - Create product
  - [ ] `PATCH /api/admin/products/:id` - Update product
  - [ ] `DELETE /api/admin/products/:id` - Delete product
  - [ ] `POST /api/admin/products/:id/images` - Upload product images
  - [ ] `POST /api/admin/products/:id/variants` - Add variant
  - [ ] `PATCH /api/admin/variants/:id` - Update variant
  - [ ] `DELETE /api/admin/variants/:id` - Delete variant

- [ ] **Admin Inventory**
  - [ ] `PATCH /api/admin/inventory/:variantId` - Adjust stock
  - [ ] Stock history/audit log

- [ ] **Admin Order Management**
  - [ ] `GET /api/admin/orders` - List orders dengan filter
  - [ ] `GET /api/admin/orders/:id` - Order detail
  - [ ] `PATCH /api/admin/orders/:id/status` - Update order status
  - [ ] `POST /api/admin/orders/:id/ship` - Add tracking number (waybill)
  - [ ] `POST /api/admin/orders/:id/cancel` - Cancel order
  - [ ] Export orders to CSV

- [ ] **Admin Payment Verification**
  - [ ] `GET /api/admin/payments/pending` - Pending manual payments
  - [ ] `POST /api/admin/payments/:id/verify` - Verify manual payment
  - [ ] `POST /api/admin/payments/:id/reject` - Reject manual payment

- [ ] **Admin Voucher Management**
  - [ ] `GET /api/admin/vouchers` - List vouchers
  - [ ] `POST /api/admin/vouchers` - Create voucher
  - [ ] `PATCH /api/admin/vouchers/:id` - Update voucher
  - [ ] `DELETE /api/admin/vouchers/:id` - Delete voucher

- [ ] **Admin Dashboard Stats**
  - [ ] `GET /api/admin/dashboard` - Summary statistics
  - [ ] Total orders, revenue, pending payments
  - [ ] Chart data (sales over time)

- [ ] **Audit Log**
  - [ ] Log admin actions (create, update, delete)
  - [ ] Store actor, action, entity, diff

### Frontend

- [ ] **Admin Layout**
  - [ ] Admin sidebar navigation
  - [ ] Admin header dengan logout
  - [ ] Protected routes (admin only)

- [ ] **Admin Dashboard**
  - [ ] `/admin` - Dashboard overview
  - [ ] Statistics cards (orders, revenue, customers)
  - [ ] Recent orders table
  - [ ] Charts (sales, top products)

- [ ] **Admin Product Management**
  - [ ] `/admin/products` - Product list dengan search & filter
  - [ ] `/admin/products/new` - Create product form
  - [ ] `/admin/products/[id]/edit` - Edit product form
  - [ ] Image upload & preview
  - [ ] Variant management (add/edit/delete)
  - [ ] Stock adjustment

- [ ] **Admin Order Management**
  - [ ] `/admin/orders` - Order list dengan filter
  - [ ] `/admin/orders/[id]` - Order detail
  - [ ] Status update dropdown
  - [ ] Add tracking number form
  - [ ] Cancel order confirmation
  - [ ] Export CSV button

- [ ] **Admin Payment Verification**
  - [ ] `/admin/payments` - Pending payments list
  - [ ] View bukti bayar image
  - [ ] Verify/Reject buttons
  - [ ] Verification notes

- [ ] **Admin Voucher Management**
  - [ ] `/admin/vouchers` - Voucher list
  - [ ] `/admin/vouchers/new` - Create voucher form
  - [ ] `/admin/vouchers/[id]/edit` - Edit voucher form
  - [ ] Date picker untuk start/end
  - [ ] Usage statistics

**Target**: End of Week 5

---

## Integration & Testing

- [ ] **API Integration Testing**
  - [ ] Test all product flows
  - [ ] Test cart flows
  - [ ] Test checkout → payment → webhook → order paid
  - [ ] Test manual transfer flow
  - [ ] Test admin CRUD operations

- [ ] **Third-party Testing**
  - [ ] RajaOngkir cost calculation (live API)
  - [ ] Tripay sandbox testing
  - [ ] Webhook signature verification

- [ ] **UI Testing**
  - [ ] Mobile responsive check
  - [ ] Tablet responsive check
  - [ ] Desktop responsive check
  - [ ] Cross-browser testing (Chrome, Firefox, Safari)

- [ ] **Performance**
  - [ ] Image optimization
  - [ ] API response caching
  - [ ] Pagination for large lists
  - [ ] Lazy loading

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Focus indicators
  - [ ] ARIA labels
  - [ ] Color contrast check

**Target**: Week 6

---

## Deployment & Production

- [ ] **Environment Setup**
  - [ ] Production environment variables
  - [ ] Database migration strategy
  - [ ] SSL certificates
  - [ ] Domain setup

- [ ] **Security Hardening**
  - [ ] Rate limiting tuning
  - [ ] Input validation review
  - [ ] CORS configuration
  - [ ] SQL injection prevention check
  - [ ] XSS prevention check

- [ ] **Deployment**
  - [ ] Choose hosting (Vercel/Netlify for frontend, Railway/Fly.io for backend)
  - [ ] Deploy backend
  - [ ] Deploy frontend
  - [ ] Setup CI/CD auto-deploy
  - [ ] Database backups

- [ ] **Monitoring**
  - [ ] Error logging (Sentry)
  - [ ] Analytics (Google Analytics/Plausible)
  - [ ] Uptime monitoring
  - [ ] Performance monitoring

- [ ] **Documentation**
  - [ ] API documentation (Swagger/Postman)
  - [ ] User manual
  - [ ] Admin manual
  - [ ] Deployment guide

**Target**: Week 7-8

---

## Optional Enhancements (Future)

- [ ] User authentication (OAuth, Email verification)
- [ ] Product reviews dengan foto
- [ ] Wishlist functionality
- [ ] Order tracking integration (auto-update dari courier)
- [ ] Email notifications (order placed, shipped, delivered)
- [ ] SMS notifications via Twilio
- [ ] Multi-warehouse support
- [ ] Pre-order products
- [ ] Flash sale/limited time offers
- [ ] Customer loyalty points
- [ ] Referral program

---

**Last Updated**: October 15, 2025  
**Current Phase**: Phase 0 ✅ COMPLETED  
**Next Phase**: Phase 1 - Katalog, Keranjang, Checkout Dasar
