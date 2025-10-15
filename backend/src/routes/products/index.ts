import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { NotFoundError } from '../../utils/error';

const productQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  category: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name-asc']).optional().default('newest'),
});

export default async function productRoutes(fastify: FastifyInstance) {
  // List products with filters
  fastify.get('/products', async (request, reply) => {
    const query = productQuerySchema.parse(request.query);
    const page = parseInt(query.page, 10);
    const limit = parseInt(query.limit, 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      active: true,
    };

    // Category filter
    if (query.category) {
      where.categories = {
        some: {
          category: {
            slug: query.category,
          },
        },
      };
    }

    // Color filter (check variants)
    if (query.color) {
      where.variants = {
        some: {
          color: {
            equals: query.color,
            mode: 'insensitive',
          },
        },
      };
    }

    // Price filter (check variants)
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) {
        priceFilter.gte = parseInt(query.minPrice, 10);
      }
      if (query.maxPrice) {
        priceFilter.lte = parseInt(query.maxPrice, 10);
      }
      where.variants = {
        some: {
          price: priceFilter,
        },
      };
    }

    // Search filter
    if (query.search) {
      where.OR = [
        {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'name-asc') {
      orderBy = { name: 'asc' };
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          variants: {
            include: {
              inventory: true,
            },
            orderBy: query.sort === 'price-asc' ? { price: 'asc' } : { price: 'desc' },
            take: 1,
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format response
    const formattedProducts = products.map((product) => {
      const variant = product.variants[0];
      const minPrice = variant?.price;
      const stock = variant?.inventory?.stock || 0;

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        brand: product.brand,
        image: product.images[0]?.url || '/images/placeholder.jpg',
        minPrice,
        stock,
        categories: product.categories.map((c) => c.category),
      };
    });

    return reply.send({
      data: formattedProducts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get product by slug
  fastify.get('/products/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const product = await prisma.product.findUnique({
      where: { slug, active: true },
      include: {
        images: {
          orderBy: { isPrimary: 'desc' },
        },
        variants: {
          include: {
            inventory: true,
          },
          orderBy: { color: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    // Get unique colors and sizes
    const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];

    return reply.send({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand,
      baseWeightGram: product.baseWeightGram,
      images: product.images,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.inventory?.stock || 0,
        reserved: v.inventory?.reserved || 0,
      })),
      categories: product.categories.map((c) => c.category),
      colors,
      sizes,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name,
        createdAt: r.createdAt,
      })),
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
    });
  });
}
