import { FastifyInstance } from 'fastify';
import { prisma } from '../../db';

export default async function categoryRoutes(fastify: FastifyInstance) {
  // List all categories
  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return reply.send({
      data: categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        parentId: cat.parentId,
        productCount: cat._count.products,
      })),
    });
  });

  // Get category by slug with products
  fastify.get('/categories/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                variants: {
                  include: {
                    inventory: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    return reply.send({
      id: category.id,
      slug: category.slug,
      name: category.name,
      products: category.products.map((p) => ({
        id: p.product.id,
        slug: p.product.slug,
        name: p.product.name,
        image: p.product.images[0]?.url || '/images/placeholder.jpg',
        minPrice: p.product.variants[0]?.price,
        stock: p.product.variants[0]?.inventory?.stock || 0,
      })),
    });
  });
}
