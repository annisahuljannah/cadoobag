# 🛍️ Cadoobag - E-Commerce Tas Wanita

> **Status**: Phase 1 ✅ COMPLETED | Phase 2 ✅ CODE COMPLETE (Needs API Keys)

Platform e-commerce modern untuk penjualan tas wanita dengan fitur lengkap: katalog produk, keranjang belanja, checkout, integrasi RajaOngkir, dan Tripay payment gateway.

---

## 📊 Project Status

| Phase | Status | Features | Completion |
|-------|--------|----------|------------|
| **Phase 0** | ✅ Done | Infrastructure setup | 100% |
| **Phase 1** | ✅ Done | Catalog & Cart | 100% |
| **Phase 2** | � Code Complete | Shipping & Payment | 95% (needs API keys) |
| **Phase 3** | 🔮 Next | Admin Dashboard | 20% (payment verification done) |

---

## �🚀 Tech Stack

### Frontend
- **Next.js 14.2.33** (App Router)
- **React 18.2.0**
- **TypeScript 5.3.3**
- **Tailwind CSS 3.4.1**
- **Zustand 4.5.0** (State Management)

### Backend
- **Fastify 4.26.0** (HTTP Server)
- **Prisma ORM 5.9.1** (Database)
- **SQLite** (Development DB)
- **TypeScript 5.3.3**
- **Zod 3.22.4** (Validation)

### Integrasi (Phase 2)
- **RajaOngkir** - Shipping cost calculation
- **Tripay** - Payment gateway (VA, E-Wallet, QRIS)
- **Manual Transfer** - Bank transfer option

## 📁 Struktur Proyek

```
cadoobag/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── styles/
│   │   └── types/
│   └── package.json
├── backend/           # Fastify API
│   ├── src/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── providers/
│   │   ├── middlewares/
│   │   └── webhooks/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
└── package.json
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 20+
- PNPM 8+

### Option 1: One-Command Start (Recommended)

```bash
cd /workspaces/cadoobag
./start-dev.sh
```

This automatically starts both backend (port 4000) and frontend (port 3000).

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
pnpm install
pnpm prisma:migrate    # Setup database
pnpm prisma:seed       # Load sample data
pnpm dev               # Start server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm install
pnpm dev               # Start Next.js
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### Default Credentials
- **Email**: `admin@cadoobag.com`
- **Password**: `admin123`

---

## ✨ Features (Phase 1)

### 🛒 Shopping Experience
- [x] **Product Catalog** - Browse 10+ products across 5 categories
- [x] **Product Detail** - View images, select variants (color, size), check stock
- [x] **Search & Filter** - Find products by category, color, price range
- [x] **Shopping Cart** - Add, update, remove items with real-time stock validation
- [x] **Checkout Flow** - 3-step process (address, shipping, payment)

### 🎨 User Interface
- [x] **Responsive Design** - Mobile-first, works on all devices
- [x] **Brand Consistency** - Pink (#FF3EA5) & Purple (#6B2D84) theme
- [x] **Smooth Animations** - Drawer transitions, hover effects
- [x] **Empty States** - Helpful messages when cart is empty

### 🔧 Backend API
- [x] **RESTful Endpoints** - 8 operational routes
- [x] **Stock Validation** - Prevent overselling
- [x] **Voucher System** - Apply discount codes (10% off with WELCOME10)
- [x] **Cart Session** - Persist cart across page reloads

### 📦 Sample Data
- **5 Categories**: Tote, Shoulder, Crossbody, Backpack, Clutch
- **10 Products**: 2 per category with realistic pricing
- **80 Variants**: 8 variants per product (2 colors × 4 sizes)
- **Stock**: 5-25 units per variant

---

## 🗄️ Database

### Schema (16 Tables)
User, Role, Address, Category, Product, ProductImage, Variant, Inventory, Cart, CartItem, Order, OrderItem, Payment, Shipment, ShipmentStatus, Voucher, Review, Wishlist, AuditLog

### Common Commands
```bash
cd backend
cd backend
pnpm prisma:migrate    # Run migrations
pnpm prisma:seed       # Load sample data
pnpm prisma:studio     # Open database GUI
```

### Reset Database
```bash
cd backend
rm prisma/dev.db       # Delete database
pnpm prisma:migrate    # Recreate tables
pnpm prisma:seed       # Reload data
```

---

## 🌐 API Endpoints

### Products
```
GET    /api/products              # List products (with filters)
GET    /api/products/:slug        # Product detail
```

### Categories
```
GET    /api/categories            # List categories
GET    /api/categories/:slug      # Category detail
```

### Cart
```
GET    /api/carts                 # Get/create cart
POST   /api/carts/items           # Add item to cart
PATCH  /api/carts/items/:id       # Update quantity
DELETE /api/carts/items/:id       # Remove item
```

### Orders
```
POST   /api/orders/preview        # Calculate order total
```

**Example Request:**
```bash
# Get products
curl http://localhost:4000/api/products

# Add to cart
curl -X POST http://localhost:4000/api/carts/items \
  -H "Content-Type: application/json" \
  -H "x-cart-id: abc123" \
  -d '{"variantId": 1, "qty": 2}'
```

---

## � Documentation

| File | Description |
|------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Quick setup guide with troubleshooting |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Complete project overview |
| [CHECKLIST.md](./CHECKLIST.md) | Development progress tracker |
| [docs/PHASE_1_REPORT.md](./docs/PHASE_1_REPORT.md) | Phase 1 detailed report |

---

## 🧪 Testing (Phase 1)

All API endpoints tested manually with cURL:
```bash
✓ GET /api/products              # Returns 10 products
✓ GET /api/products/:slug        # Returns product detail
✓ GET /api/categories            # Returns 5 categories
✓ POST /api/carts/items          # Adds item to cart
✓ PATCH /api/carts/items/:id     # Updates quantity
✓ DELETE /api/carts/items/:id    # Removes item
✓ POST /api/orders/preview       # Calculates total
```

Frontend tested on:
- ✓ Chrome/Edge (desktop & mobile)
- ✓ Firefox
- ✓ Safari (iOS)

---

## 🎨 Design System

### Brand Colors
```css
--pink-primary: #FF3EA5;    /* CTA buttons, links */
--purple-deep: #6B2D84;     /* Headings, prices */
--pink-light: #FFD1EA;      /* Backgrounds */
--gray-bg: #F6F7F9;         /* Page background */
```

### Typography
- **Display/Headings**: Poppins (bold, semibold)
- **Body Text**: Inter (regular, medium)

### Components
```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<input className="input-field" />
```

---

## 🛣️ Roadmap

### ✅ Phase 0: Infrastructure (DONE)
- [x] Monorepo setup
- [x] Database schema
- [x] Seed data

### ✅ Phase 1: Catalog & Cart (DONE)
- [x] Product catalog API
- [x] Shopping cart
- [x] Basic checkout UI

### 🔜 Phase 2: Shipping & Payment (NEXT)
- [ ] RajaOngkir integration
- [ ] Tripay payment gateway
- [ ] Manual bank transfer
- [ ] Order management
- [ ] Email notifications

### 🔮 Phase 3: Admin & Advanced (FUTURE)
- [ ] Authentication system
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Product reviews
- [ ] Analytics & reports

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## � License

This project is private and proprietary.

---

## 📞 Contact

For questions or support, please contact the development team.

---

**Last Updated**: January 2025  
**Current Version**: 1.0.0-beta (Phase 1)  
**Status**: ✅ Phase 1 Complete, 🔜 Phase 2 In Planning
- CORS configuration

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License

## 👥 Team

- Developer: Annisa Huljannah