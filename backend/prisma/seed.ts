import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== ROLES ====================
  console.log('📋 Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrator',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { code: 'CUSTOMER' },
    update: {},
    create: {
      code: 'CUSTOMER',
      name: 'Customer',
    },
  });

  // ==================== ADMIN USER ====================
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cadoobag.com' },
    update: {},
    create: {
      email: 'admin@cadoobag.com',
      passwordHash: adminPasswordHash,
      name: 'Admin Cadoobag',
      phone: '081234567890',
      roleId: adminRole.id,
    },
  });

  // ==================== CATEGORIES ====================
  console.log('📦 Creating categories...');
  const categories = [
    { slug: 'tote', name: 'Tote Bag' },
    { slug: 'shoulder', name: 'Shoulder Bag' },
    { slug: 'crossbody', name: 'Crossbody Bag' },
    { slug: 'backpack', name: 'Backpack' },
    { slug: 'clutch', name: 'Clutch' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // ==================== PRODUCTS ====================
  console.log('👜 Creating products...');

  const colors = ['Black', 'Nude', 'Rose', 'Lilac'];
  const sizes = ['S', 'M'];

  const products = [
    {
      slug: 'classic-tote-canvas',
      name: 'Classic Canvas Tote',
      description: 'Spacious canvas tote perfect for daily essentials',
      baseWeightGram: 400,
      brand: 'Cadoobag',
      categorySlug: 'tote',
    },
    {
      slug: 'elegant-shoulder-leather',
      name: 'Elegant Leather Shoulder Bag',
      description: 'Premium leather shoulder bag with adjustable strap',
      baseWeightGram: 600,
      brand: 'Cadoobag',
      categorySlug: 'shoulder',
    },
    {
      slug: 'mini-crossbody-chain',
      name: 'Mini Crossbody with Chain',
      description: 'Stylish mini crossbody with gold chain detail',
      baseWeightGram: 300,
      brand: 'Cadoobag',
      categorySlug: 'crossbody',
    },
    {
      slug: 'urban-backpack',
      name: 'Urban Backpack',
      description: 'Modern backpack with multiple compartments',
      baseWeightGram: 700,
      brand: 'Cadoobag',
      categorySlug: 'backpack',
    },
    {
      slug: 'evening-clutch-satin',
      name: 'Evening Satin Clutch',
      description: 'Elegant satin clutch for special occasions',
      baseWeightGram: 200,
      brand: 'Cadoobag',
      categorySlug: 'clutch',
    },
    {
      slug: 'hobo-bag-suede',
      name: 'Hobo Suede Bag',
      description: 'Relaxed hobo style in soft suede',
      baseWeightGram: 500,
      brand: 'Cadoobag',
      categorySlug: 'shoulder',
    },
    {
      slug: 'structured-tote',
      name: 'Structured Tote',
      description: 'Professional structured tote for work',
      baseWeightGram: 650,
      brand: 'Cadoobag',
      categorySlug: 'tote',
    },
    {
      slug: 'bucket-bag',
      name: 'Bucket Bag',
      description: 'Trendy bucket bag with drawstring closure',
      baseWeightGram: 450,
      brand: 'Cadoobag',
      categorySlug: 'shoulder',
    },
    {
      slug: 'convertible-backpack',
      name: 'Convertible Backpack',
      description: 'Versatile bag that converts to shoulder bag',
      baseWeightGram: 550,
      brand: 'Cadoobag',
      categorySlug: 'backpack',
    },
    {
      slug: 'box-clutch',
      name: 'Box Clutch',
      description: 'Structured box clutch with metallic finish',
      baseWeightGram: 250,
      brand: 'Cadoobag',
      categorySlug: 'clutch',
    },
  ];

  const priceRanges = {
    tote: { min: 250000, max: 450000 },
    shoulder: { min: 350000, max: 650000 },
    crossbody: { min: 200000, max: 400000 },
    backpack: { min: 400000, max: 700000 },
    clutch: { min: 150000, max: 350000 },
  };

  for (const prod of products) {
    const category = await prisma.category.findUnique({
      where: { slug: prod.categorySlug },
    });

    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        slug: prod.slug,
        name: prod.name,
        description: prod.description,
        baseWeightGram: prod.baseWeightGram,
        brand: prod.brand,
        active: true,
      },
    });

    // Link to category
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: category.id,
      },
    });

    // Create product image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `/images/products/${prod.slug}.jpg`,
        isPrimary: true,
      },
    });

    // Create variants (colors x sizes)
    const basePrice =
      Math.floor(Math.random() * (priceRanges[prod.categorySlug].max - priceRanges[prod.categorySlug].min)) +
      priceRanges[prod.categorySlug].min;

    for (const color of colors) {
      for (const size of sizes) {
        const sizePriceAdjustment = size === 'M' ? 50000 : 0;
        const price = basePrice + sizePriceAdjustment;
        const sku = `${prod.slug.toUpperCase()}-${color.toUpperCase()}-${size}`.substring(0, 50);

        const variant = await prisma.variant.create({
          data: {
            productId: product.id,
            sku,
            color,
            size,
            price,
            compareAtPrice: Math.floor(price * 1.25),
          },
        });

        // Create inventory
        const randomStock = Math.floor(Math.random() * 50);
        await prisma.inventory.create({
          data: {
            variantId: variant.id,
            stock: randomStock,
            reserved: 0,
          },
        });
      }
    }
  }

  // ==================== VOUCHER ====================
  console.log('🎟️ Creating voucher...');
  await prisma.voucher.upsert({
    where: { code: 'CADOOLOVE' },
    update: {},
    create: {
      code: 'CADOOLOVE',
      type: 'PERCENT',
      value: 10,
      minSpend: 200000,
      startAt: new Date('2025-01-01'),
      endAt: new Date('2025-12-31'),
      quota: 1000,
      used: 0,
      active: true,
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
