import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { BadRequestError } from '../../utils/error';
import { calculateSubtotal, calculateDiscount, calculateTotal } from '../../utils/pricing';
import { calculateTotalWeight } from '../../utils/weight';

const orderPreviewSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.number(),
      qty: z.number().min(1),
    })
  ),
  shippingCost: z.number().optional().default(0),
  voucherCode: z.string().optional(),
});

export default async function orderRoutes(fastify: FastifyInstance) {
  // Order preview - calculate totals
  fastify.post('/orders/preview', async (request, reply) => {
    const body = orderPreviewSchema.parse(request.body);

    // Validate items and get variant details
    const variantIds = body.items.map((item) => item.variantId);
    const variants = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      include: {
        inventory: true,
        product: true,
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestError('Some variants not found');
    }

    // Check stock availability
    const itemsWithDetails = body.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new BadRequestError(`Variant ${item.variantId} not found`);
      }

      if (!variant.product.active) {
        throw new BadRequestError(`Product ${variant.product.name} is not active`);
      }

      const availableStock = (variant.inventory?.stock || 0) - (variant.inventory?.reserved || 0);

      if (item.qty > availableStock) {
        throw new BadRequestError(
          `Insufficient stock for ${variant.product.name}. Available: ${availableStock}`,
          'INSUFFICIENT_STOCK'
        );
      }

      return {
        variantId: item.variantId,
        qty: item.qty,
        price: variant.price,
        weightGram: variant.product.baseWeightGram,
        name: variant.product.name,
        sku: variant.sku,
      };
    });

    // Calculate subtotal
    const subtotal = calculateSubtotal(itemsWithDetails);

    // Calculate total weight
    const totalWeight = calculateTotalWeight(itemsWithDetails);

    // Validate and apply voucher if provided
    let discount = 0;
    let voucher = null;

    if (body.voucherCode) {
      voucher = await prisma.voucher.findUnique({
        where: { code: body.voucherCode },
      });

      if (!voucher) {
        throw new BadRequestError('Invalid voucher code', 'INVALID_VOUCHER');
      }

      if (!voucher.active) {
        throw new BadRequestError('Voucher is not active', 'VOUCHER_INACTIVE');
      }

      const now = new Date();
      if (now < voucher.startAt || now > voucher.endAt) {
        throw new BadRequestError('Voucher has expired or not yet active', 'VOUCHER_EXPIRED');
      }

      if (voucher.used >= voucher.quota) {
        throw new BadRequestError('Voucher quota has been reached', 'VOUCHER_QUOTA_EXCEEDED');
      }

      discount = calculateDiscount(subtotal, voucher);
    }

    // Calculate total
    const total = calculateTotal(subtotal, body.shippingCost, discount);

    return reply.send({
      items: itemsWithDetails.map((item) => ({
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        qty: item.qty,
        price: item.price,
        subtotal: item.price * item.qty,
        weightGram: item.weightGram,
      })),
      subtotal,
      shippingCost: body.shippingCost,
      discount,
      total,
      totalWeight,
      voucher: voucher
        ? {
            code: voucher.code,
            type: voucher.type,
            value: voucher.value,
            minSpend: voucher.minSpend,
          }
        : null,
    });
  });
}
