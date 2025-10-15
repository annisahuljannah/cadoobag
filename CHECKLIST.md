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

## Phase 2 — RajaOngkir & Pembayaran

### Backend

- [ ] **RajaOngkir Integration**
  - [ ] Provider service (`providers/rajaongkir.ts`)
  - [ ] `GET /api/locations/provinces` - Get provinces
  - [ ] `GET /api/locations/cities/:provinceId` - Get cities
  - [ ] `GET /api/locations/subdistricts/:cityId` - Get subdistricts
  - [ ] `POST /api/shipping/cost` - Calculate shipping cost
  - [ ] Cache shipping cost (TTL 5 minutes)
  - [ ] Handle RajaOngkir API errors gracefully

- [ ] **Voucher Service**
  - [ ] `POST /api/vouchers/validate` - Validate voucher code
  - [ ] Apply discount calculation (percent/fixed)
  - [ ] Check min spend, quota, active status, date range

- [ ] **Order Creation**
  - [ ] `POST /api/orders/confirm` - Create order dengan payment
  - [ ] Validate stock availability
  - [ ] Reserve inventory
  - [ ] Create order + order items + shipment record
  - [ ] Generate order number

- [ ] **Tripay Payment**
  - [ ] Provider service (`providers/tripay.ts`)
  - [ ] `POST /api/payments/tripay/create` - Create transaction
  - [ ] Get payment channels list
  - [ ] Handle Tripay API response
  - [ ] Store payment info (refNo, vaNo, instructions)

- [ ] **Tripay Webhook**
  - [ ] `POST /webhooks/tripay` - Handle callback
  - [ ] Verify HMAC signature
  - [ ] Idempotent processing (check refNo)
  - [ ] Update payment status (PAID/FAILED/EXPIRED)
  - [ ] Update order status
  - [ ] Release reserved stock on PAID

- [ ] **Manual Transfer**
  - [ ] `POST /api/payments/manual/upload` - Upload bukti bayar
  - [ ] Multipart file handling
  - [ ] Store file & update payment meta
  - [ ] Set status NEED_VERIFICATION

### Frontend

- [ ] **Checkout - Complete**
  - [ ] Address form dengan cascading select (province → city → subdistrict)
  - [ ] Address book (list saved addresses)
  - [ ] Shipping cost calculation realtime
  - [ ] Courier selection (JNE/TIKI/POS dengan services)
  - [ ] ETD display
  - [ ] Voucher code input & validation
  - [ ] Discount display

- [ ] **Payment**
  - [ ] Payment method selection (Tripay channels vs Manual Transfer)
  - [ ] Tripay: Show available channels (VA, QRIS, etc.)
  - [ ] Manual Transfer: Show bank account info
  - [ ] Upload bukti bayar untuk manual transfer
  - [ ] Payment instruction page `/orders/[id]/payment`
  - [ ] VA number, QR code, instructions display
  - [ ] Payment countdown timer

- [ ] **Order Status**
  - [ ] Order list page `/orders`
  - [ ] Order detail page `/orders/[id]`
  - [ ] Order status badge
  - [ ] Payment status indicator
  - [ ] Order items display
  - [ ] Shipping info

- [ ] **UI/UX Polish**
  - [ ] Toast notifications (success, error)
  - [ ] Loading spinners
  - [ ] Form validation errors
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Empty states

**Target**: End of Week 3

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
