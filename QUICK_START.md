# Cadoobag - Quick Start Guide

## 🚀 Running the Application

### Option 1: Quick Start (Recommended)

```bash
cd /workspaces/cadoobag
./start-dev.sh
```

This will automatically:
- Clean up any existing processes on ports 4000 and 3000
- Start backend server on http://localhost:4000
- Start frontend server on http://localhost:3000

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /workspaces/cadoobag/backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd /workspaces/cadoobag/frontend
pnpm install
pnpm dev
```

---

## 🧪 Testing the Application

### 1. Health Check
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Browse Products
- Open browser: http://localhost:3000
- Click "Lihat Produk" or navigate to Products
- You should see 10 products displayed

### 3. Product Detail
- Click any product card
- Select color (Pink or Black)
- Select size (S, M, L, or XL)
- Adjust quantity (max based on stock)
- Click "Tambah ke Keranjang"

### 4. Shopping Cart
- Click cart icon in navbar (should show badge count)
- Cart drawer slides in from right
- Try:
  - Increase/decrease quantity
  - Remove items
  - Click "Checkout"

### 5. Checkout Flow
- Complete Step 1: Fill in name, phone, address
- Click "Lanjutkan" to Step 2 (shipping placeholder)
- Click "Lanjutkan" to Step 3 (review order)
- Note: Payment integration coming in Phase 2

---

## 📚 Available Scripts

### Backend
```bash
cd backend

# Development
pnpm dev              # Start dev server with hot reload

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed database with sample data
pnpm prisma:studio    # Open Prisma Studio (GUI)

# Build & Production
pnpm build            # Compile TypeScript
pnpm start            # Run production build
```

### Frontend
```bash
cd frontend

# Development
pnpm dev              # Start dev server (port 3000)
pnpm build            # Build for production
pnpm start            # Run production build
pnpm lint             # Run ESLint
```

---

## 🗄️ Database

### Location
`/workspaces/cadoobag/backend/prisma/dev.db` (SQLite)

### Seed Data
After running `pnpm prisma:seed`, you'll have:
- **5 categories**: Tote, Shoulder, Crossbody, Backpack, Clutch
- **10 products**: 2 per category
- **80 variants**: Each product has 8 variants (2 colors × 4 sizes)
- **1 admin user**:
  - Email: `admin@cadoobag.com`
  - Password: `admin123`
- **1 voucher**: `WELCOME10` (10% off, min Rp 100,000)

### Reset Database
```bash
cd backend
rm prisma/dev.db  # Delete database file
pnpm prisma:migrate  # Recreate tables
pnpm prisma:seed     # Re-seed data
```

---

## 🌐 API Endpoints

Base URL: `http://localhost:4000`

### Products
- `GET /api/products` - List products
  - Query: `?page=1&limit=12&category=tote&color=pink&minPrice=100000&maxPrice=500000&search=leather&sort=price_asc`
- `GET /api/products/:slug` - Product detail

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:slug` - Category detail

### Cart
- `GET /api/carts` - Get/create cart (requires `x-cart-id` header)
- `POST /api/carts/items` - Add item to cart
  - Body: `{"variantId": 1, "qty": 2}`
- `PATCH /api/carts/items/:id` - Update quantity
  - Body: `{"qty": 3}`
- `DELETE /api/carts/items/:id` - Remove item

### Orders
- `POST /api/orders/preview` - Preview order total
  - Body: `{"items": [{"variantId": 1, "qty": 2}], "voucherCode": "WELCOME10"}`

---

## 🎨 Brand Guidelines

### Colors
- **Pink Primary**: `#FF3EA5` - CTA buttons, links
- **Purple Deep**: `#6B2D84` - Headings, prices
- **Pink Light**: `#FFD1EA` - Backgrounds, accents
- **Gray BG**: `#F6F7F9` - Page background

### Typography
- **Headings**: Poppins (font-bold, font-semibold)
- **Body**: Inter (font-normal, font-medium)

### CSS Classes
```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<input className="input-field" />
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 4000
lsof -ti:4000 | xargs kill -9

# Find process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Not Generated
```bash
cd backend
pnpm prisma:generate
```

### TypeScript Errors
```bash
# Backend
cd backend
pnpm build  # Check for errors

# Frontend
cd frontend
pnpm build  # Check for errors
```

### Cart Not Persisting
- Check browser localStorage for `cartId` key
- Check Network tab for `x-cart-id` header in requests
- Clear localStorage and try again

### Cannot Add to Cart
- Check backend logs for stock validation errors
- Verify variant has sufficient stock in database:
  ```bash
  cd backend
  pnpm prisma:studio
  # Navigate to Inventory table
  ```

---

## 📁 Key Files

### Configuration
- `/pnpm-workspace.yaml` - Monorepo configuration
- `/backend/prisma/schema.prisma` - Database schema
- `/backend/.env` - Backend environment variables
- `/frontend/.env.local` - Frontend environment variables (create if needed)

### Important Directories
- `/backend/src/routes/` - API route handlers
- `/frontend/src/app/` - Next.js pages (App Router)
- `/frontend/src/components/` - Reusable UI components
- `/frontend/src/store/` - Zustand state management
- `/frontend/src/lib/` - Utility functions

---

## ✅ Phase 1 Checklist

- [x] Monorepo setup (PNPM workspace)
- [x] Backend API (Fastify + Prisma)
- [x] Database schema (16 tables)
- [x] Seed data (10 products, 80 variants)
- [x] Product endpoints (list, detail, filters)
- [x] Category endpoints
- [x] Cart endpoints (CRUD)
- [x] Order preview endpoint
- [x] Frontend layout (Navbar, Footer)
- [x] Homepage
- [x] Product list page
- [x] Product detail page
- [x] Cart drawer
- [x] Checkout page (basic)
- [x] Responsive design
- [x] Brand consistency

---

## 🔜 Coming in Phase 2

- [ ] **RajaOngkir Integration**: Real-time shipping cost calculation
- [ ] **Tripay Payment Gateway**: Multiple payment channels (VA, E-Wallet, QRIS)
- [ ] **Manual Bank Transfer**: Upload payment proof
- [ ] **Order Management**: Track orders, update status
- [ ] **Voucher System**: Apply discount codes at checkout

---

## 📖 Documentation

- [Phase 0 Report](/workspaces/cadoobag/docs/PHASE_0_REPORT.md) - Infrastructure setup
- [Phase 1 Report](/workspaces/cadoobag/docs/PHASE_1_REPORT.md) - Catalog & cart features
- [Prisma Schema](/workspaces/cadoobag/backend/prisma/schema.prisma) - Database design

---

## 🆘 Need Help?

- Check `/docs/PHASE_1_REPORT.md` for detailed feature documentation
- Review API examples in report
- Use Prisma Studio to inspect database: `cd backend && pnpm prisma:studio`
- Check browser Console and Network tabs for frontend issues
- Check terminal logs for backend errors

---

**Happy coding! 🎉**
