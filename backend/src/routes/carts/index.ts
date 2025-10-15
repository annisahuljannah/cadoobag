import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { BadRequestError, NotFoundError } from '../../utils/error';

const addToCartSchema = z.object({
  variantId: z.number(),
  qty: z.number().min(1),
});

const updateCartItemSchema = z.object({
  qty: z.number().min(1),
});

export default async function cartRoutes(fastify: FastifyInstance) {
  // Get or create cart
  fastify.get('/carts', async (request, reply) => {
    // For now, we'll use a session-based cart (stored in header)
    // Later we'll implement user-based cart
    const cartId = request.headers['x-cart-id'] as string | undefined;

    let cart;

    if (cartId) {
      cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    if (!cart) {
      // Create new cart
      cart = await prisma.cart.create({
        data: {},
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.variant.price * item.qty, 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return reply.send({
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        qty: item.qty,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          image: item.variant.product.images[0]?.url || '/images/placeholder.jpg',
        },
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          color: item.variant.color,
          size: item.variant.size,
          price: item.variant.price,
          stock: item.variant.inventory?.stock || 0,
        },
      })),
      subtotal,
      totalItems,
    });
  });

  // Add item to cart
  fastify.post('/carts/items', async (request, reply) => {
    const body = addToCartSchema.parse(request.body);
    const cartId = request.headers['x-cart-id'] as string | undefined;

    // Get or create cart
    let cart;
    if (cartId) {
      cart = await prisma.cart.findUnique({ where: { id: cartId } });
    }

    if (!cart) {
      cart = await prisma.cart.create({ data: {} });
    }

    // Check if variant exists and has stock
    const variant = await prisma.variant.findUnique({
      where: { id: body.variantId },
      include: {
        inventory: true,
        product: true,
      },
    });

    if (!variant || !variant.product.active) {
      throw new NotFoundError('Product variant not found or inactive');
    }

    const availableStock = (variant.inventory?.stock || 0) - (variant.inventory?.reserved || 0);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: body.variantId,
        },
      },
    });

    let newQty = body.qty;
    if (existingItem) {
      newQty = existingItem.qty + body.qty;
    }

    if (newQty > availableStock) {
      throw new BadRequestError(
        `Not enough stock. Available: ${availableStock}`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: body.variantId,
        },
      },
      update: {
        qty: newQty,
      },
      create: {
        cartId: cart.id,
        variantId: body.variantId,
        qty: body.qty,
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return reply.status(201).send({
      cartId: cart.id,
      item: {
        id: cartItem.id,
        variantId: cartItem.variantId,
        qty: cartItem.qty,
        product: {
          id: cartItem.variant.product.id,
          name: cartItem.variant.product.name,
          slug: cartItem.variant.product.slug,
          image: cartItem.variant.product.images[0]?.url || '/images/placeholder.jpg',
        },
        variant: {
          id: cartItem.variant.id,
          sku: cartItem.variant.sku,
          color: cartItem.variant.color,
          size: cartItem.variant.size,
          price: cartItem.variant.price,
        },
      },
    });
  });

  // Update cart item quantity
  fastify.patch('/carts/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateCartItemSchema.parse(request.body);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        variant: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    const availableStock =
      (cartItem.variant.inventory?.stock || 0) - (cartItem.variant.inventory?.reserved || 0);

    if (body.qty > availableStock) {
      throw new BadRequestError(
        `Not enough stock. Available: ${availableStock}`,
        'INSUFFICIENT_STOCK'
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: parseInt(id, 10) },
      data: { qty: body.qty },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return reply.send({
      id: updatedItem.id,
      variantId: updatedItem.variantId,
      qty: updatedItem.qty,
      product: {
        id: updatedItem.variant.product.id,
        name: updatedItem.variant.product.name,
        image: updatedItem.variant.product.images[0]?.url || '/images/placeholder.jpg',
      },
      variant: {
        id: updatedItem.variant.id,
        sku: updatedItem.variant.sku,
        color: updatedItem.variant.color,
        size: updatedItem.variant.size,
        price: updatedItem.variant.price,
      },
    });
  });

  // Remove cart item
  fastify.delete('/carts/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(id, 10) },
    });

    return reply.status(204).send();
  });
}
