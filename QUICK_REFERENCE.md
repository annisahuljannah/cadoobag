# 🚀 Quick Reference - Cadoobag

## 🏃‍♂️ Quick Commands

```bash
# Install all dependencies
pnpm install

# Run both services (backend + frontend)
pnpm dev

# Backend only
cd backend && pnpm dev

# Frontend only  
cd frontend && pnpm dev

# Database
cd backend
pnpm prisma:migrate      # Run migrations
pnpm prisma:seed         # Seed database
pnpm prisma:studio       # Open Prisma Studio

# Build
pnpm build               # Build both
cd backend && pnpm build # Build backend
cd frontend && pnpm build # Build frontend

# Lint & Type Check
pnpm lint
cd backend && pnpm type-check
cd frontend && pnpm type-check
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **Prisma Studio**: `pnpm prisma:studio` (dari folder backend)

## 🔑 Default Credentials

**Admin User**:
- Email: `admin@cadoobag.com`
- Password: `admin123`

## 📊 Database Quick Info

**Total Tables**: 16

**Key Entities**:
- User, Role, Address
- Category, Product, ProductImage, Variant, Inventory
- Cart, CartItem
- Order, OrderItem, Payment, Shipment
- Voucher, Review, Wishlist, AuditLog

**Sample Data**:
- 10 Products
- 80 Variants (10 products × 4 colors × 2 sizes)
- 5 Categories
- 1 Admin User
- 1 Voucher (CADOOLOVE - 10% off)

## 🎨 Design Tokens

### Colors
```css
--pink-primary: #FF3EA5
--purple-deep: #6B2D84
--pink-light: #FFD1EA
--gray-bg: #F6F7F9
```

### Tailwind Classes
```jsx
// Buttons
className="btn-primary"    // Pink primary button
className="btn-secondary"  // Purple outline button

// Inputs
className="input-field"    // Standard input field

// Typography
className="font-display"   // Poppins (headings)
className="font-sans"      // Inter (body)

// Colors
className="bg-pink-primary"
className="text-purple-deep"
className="bg-pink-light"
```

## 📁 Important Files

### Backend
```
backend/
├── src/
│   ├── server.ts          # Fastify server
│   ├── env.ts             # Environment variables
│   ├── db.ts              # Prisma client
│   └── utils/
│       ├── error.ts       # Error handling
│       ├── logger.ts      # Logging
│       ├── crypto.ts      # HMAC verification
│       ├── pricing.ts     # Price calculations
│       └── weight.ts      # Weight calculations
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
└── .env                   # Environment config
```

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Homepage
│   ├── lib/
│   │   ├── fetcher.ts     # API client
│   │   ├── constants.ts   # App constants
│   │   ├── formatting.ts  # Format helpers
│   │   └── cn.ts          # Class merger
│   ├── types/
│   │   └── dto.ts         # TypeScript types
│   └── styles/
│       └── globals.css    # Global styles
└── .env.local             # Environment config
```

## 🔌 API Endpoints (Planned)

### Public
```
GET    /api/products              # List products
GET    /api/products/:slug        # Product detail
GET    /api/categories            # List categories
POST   /api/shipping/cost         # Calculate shipping
```

### Authenticated
```
POST   /api/carts                 # Get/create cart
POST   /api/carts/items           # Add to cart
PATCH  /api/carts/items/:id       # Update cart item
DELETE /api/carts/items/:id       # Remove from cart
POST   /api/orders/preview        # Order preview
POST   /api/orders/confirm        # Create order
POST   /api/payments/tripay/create # Create payment
```

### Webhooks
```
POST   /webhooks/tripay            # Tripay callback
```

### Admin
```
GET    /api/admin/products        # List products
POST   /api/admin/products        # Create product
PATCH  /api/admin/products/:id    # Update product
GET    /api/admin/orders          # List orders
PATCH  /api/admin/orders/:id      # Update order
POST   /api/admin/payments/:id/verify # Verify payment
```

## 🗂️ Useful Prisma Commands

```bash
# Generate client after schema changes
pnpm prisma:generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View database in browser
pnpm prisma:studio

# Format schema file
npx prisma format

# Pull schema from existing database
npx prisma db pull

# Push schema changes without migration
npx prisma db push
```

## 🧪 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend builds and runs
- [ ] Database migrations run successfully
- [ ] Seed data loads correctly
- [ ] Health endpoint responds: `GET /health`
- [ ] Can view Prisma Studio
- [ ] No TypeScript errors
- [ ] No ESLint errors

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
```bash
cd backend
pnpm prisma:generate
```

### Issue: "Port 4000 already in use"
```bash
# Find and kill process
lsof -ti:4000 | xargs kill -9
```

### Issue: "Port 3000 already in use"
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Issue: Database is locked
```bash
cd backend/prisma
rm dev.db
pnpm prisma:migrate
pnpm prisma:seed
```

### Issue: TypeScript errors after installing packages
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 📦 Package Scripts Reference

### Root (monorepo)
```json
{
  "dev": "Run both backend and frontend in parallel",
  "build": "Build backend then frontend",
  "lint": "Lint all packages",
  "format": "Format code with Prettier",
  "format:check": "Check code formatting"
}
```

### Backend
```json
{
  "dev": "Run dev server with hot reload",
  "build": "Build TypeScript to JavaScript",
  "start": "Run production build",
  "prisma:generate": "Generate Prisma Client",
  "prisma:migrate": "Run database migrations",
  "prisma:studio": "Open Prisma Studio",
  "prisma:seed": "Seed database",
  "lint": "Lint TypeScript files",
  "type-check": "Check TypeScript without emitting"
}
```

### Frontend
```json
{
  "dev": "Run Next.js dev server",
  "build": "Build for production",
  "start": "Run production build",
  "lint": "Lint with Next.js ESLint",
  "type-check": "Check TypeScript"
}
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"

# RajaOngkir
RAJAONGKIR_API_KEY=your_key_here
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter

# Tripay
TRIPAY_API_KEY=your_key_here
TRIPAY_PRIVATE_KEY=your_private_key_here
TRIPAY_MERCHANT_CODE=your_code_here
TRIPAY_BASE_URL=https://tripay.co.id/api-sandbox

# URLs
FRONTEND_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:4000

# Optional
JWT_SECRET=your_secret_key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 📚 Documentation Files

- `README.md` - Project overview
- `CHECKLIST.md` - Development checklist
- `docs/PHASE_0_REPORT.md` - Phase 0 completion report
- `QUICK_REFERENCE.md` - This file

## 🎯 Current Status

**Phase**: 0 (Bootstrap) ✅ COMPLETED  
**Next**: Phase 1 (Katalog, Keranjang, Checkout)

**What's Working**:
- ✅ Monorepo setup
- ✅ Database schema & migrations
- ✅ Backend server running
- ✅ Frontend running
- ✅ Seed data loaded
- ✅ CI/CD pipeline configured

**What's Next**:
- [ ] Product API endpoints
- [ ] Cart functionality
- [ ] Product listing page
- [ ] Product detail page
- [ ] Cart drawer

---

**Last Updated**: October 15, 2025
