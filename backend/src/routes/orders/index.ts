import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { BadRequestError } from '../../utils/error';
import { calculateSubtotal, calculateDiscount, calculateTotal } from '../../utils/pricing';
import { calculateTotalWeight } from '../../utils/weight';
import { tripay } from '../../providers/tripay';
import { logger } from '../../utils/logger';

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

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.number(),
      qty: z.number().min(1),
    })
  ).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    receiverName: z.string().min(1, 'Receiver name is required'),
    phone: z.string().min(10, 'Phone number is required'),
    provinceId: z.string().min(1),
    provinceName: z.string().min(1),
    cityId: z.string().min(1),
    cityName: z.string().min(1),
    subdistrictId: z.string().min(1),
    subdistrictName: z.string().min(1),
    postalCode: z.string().optional(),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    notes: z.string().optional(),
  }),
  shippingMethod: z.object({
    courier: z.string().min(1, 'Courier is required'),
    service: z.string().min(1, 'Service is required'),
    cost: z.number().min(0, 'Shipping cost must be positive'),
    etd: z.string().optional(),
  }),
  paymentMethod: z.string().min(1, 'Payment method is required'),
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
      const variant = variants.find((v: any) => v.id === item.variantId);
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

  // Create new order with payment
  fastify.post('/orders', async (request, reply) => {
    try {
      const body = createOrderSchema.parse(request.body);

      // Step 1: Validate items and get variant details
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

      // Check stock and prepare items
      const itemsWithDetails = body.items.map((item) => {
        const variant = variants.find((v: any) => v.id === item.variantId);
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
          productId: variant.productId,
        };
      });

      // Step 2: Calculate pricing
      const subtotal = calculateSubtotal(itemsWithDetails);
      const totalWeight = calculateTotalWeight(itemsWithDetails);

      let discount = 0;
      let voucherId: number | undefined;

      if (body.voucherCode) {
        const voucher = await prisma.voucher.findUnique({
          where: { code: body.voucherCode },
        });

        if (!voucher || !voucher.active) {
          throw new BadRequestError('Invalid or inactive voucher', 'INVALID_VOUCHER');
        }

        const now = new Date();
        if (now < voucher.startAt || now > voucher.endAt) {
          throw new BadRequestError('Voucher has expired or not yet active', 'VOUCHER_EXPIRED');
        }

        if (voucher.used >= voucher.quota) {
          throw new BadRequestError('Voucher quota has been reached', 'VOUCHER_QUOTA_EXCEEDED');
        }

        discount = calculateDiscount(subtotal, voucher);
        voucherId = voucher.id;
      }

      const total = calculateTotal(subtotal, body.shippingMethod.cost, discount);

      // Step 3: Validate payment method
      const paymentChannel = await tripay.getPaymentChannel(body.paymentMethod);
      if (!paymentChannel) {
        throw new BadRequestError(
          `Payment method '${body.paymentMethod}' is not available`,
          'INVALID_PAYMENT_METHOD'
        );
      }

      // Calculate payment fee
      const paymentFee = tripay.calculateFee(total, paymentChannel);
      const grandTotal = total + paymentFee;

      // Step 4: Generate unique order reference
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const merchantRef = `ORD-${timestamp}-${random}`;

      logger.info('Creating new order', {
        merchantRef,
        total,
        paymentFee,
        grandTotal,
        paymentMethod: body.paymentMethod,
      });

      // Step 5: Create order in database (transaction)
      const order = await prisma.$transaction(async (tx: any) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber: merchantRef,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            paymentMethod: body.paymentMethod,
            paymentReference: merchantRef, // Will be updated with Tripay reference later
            subtotal,
            shippingCost: body.shippingMethod.cost,
            discount,
            total,
            paymentFee,
            grandTotal,
            totalWeight,
            voucherId,
            // Shipping info
            shippingCourier: body.shippingMethod.courier.toUpperCase(),
            shippingService: body.shippingMethod.service,
            shippingEtd: body.shippingMethod.etd || null,
            trackingNumber: null,
            // Address
            receiverName: body.shippingAddress.receiverName,
            receiverPhone: body.shippingAddress.phone,
            province: body.shippingAddress.provinceName,
            city: body.shippingAddress.cityName,
            subdistrict: body.shippingAddress.subdistrictName,
            postalCode: body.shippingAddress.postalCode || null,
            address: body.shippingAddress.address,
            notes: body.shippingAddress.notes || null,
          },
          include: {
            voucher: true,
          },
        });

        // Create order items
        await tx.orderItem.createMany({
          data: itemsWithDetails.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            name: item.name,
            quantity: item.qty,
            price: item.price,
            subtotal: item.price * item.qty,
          })),
        });

        // Reserve inventory
        for (const item of itemsWithDetails) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: {
                reserved: inventory.reserved + item.qty,
              },
            });
          }
        }

        // Increment voucher usage if applied
        if (voucherId) {
          await tx.voucher.update({
            where: { id: voucherId },
            data: { used: { increment: 1 } },
          });
        }

        return newOrder;
      });

      // Step 6: Create payment transaction with Tripay
      try {
        const tripayTransaction = await tripay.createTransaction({
          method: body.paymentMethod,
          merchant_ref: merchantRef,
          amount: grandTotal,
          customer_name: body.shippingAddress.receiverName,
          customer_email: `customer-${order.id}@cadoobag.com`, // Generate email from order ID
          customer_phone: body.shippingAddress.phone,
          order_items: itemsWithDetails.map((item) => ({
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: item.qty,
          })),
          expired_time: 86400, // 24 hours
        });

        // Update order with Tripay reference
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentReference: tripayTransaction.reference,
          },
        });

        logger.info('Payment transaction created', {
          orderId: order.id,
          tripayReference: tripayTransaction.reference,
          payCode: tripayTransaction.pay_code,
        });

        // Return success response with payment details
        return reply.status(201).send({
          success: true,
          message: 'Order created successfully',
          data: {
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              paymentStatus: order.paymentStatus,
              total: order.total,
              grandTotal: order.grandTotal,
              createdAt: order.createdAt,
            },
            payment: {
              reference: tripayTransaction.reference,
              method: tripayTransaction.payment_method,
              methodName: tripayTransaction.payment_name,
              amount: tripayTransaction.amount,
              fee: paymentFee,
              total: grandTotal,
              payCode: tripayTransaction.pay_code,
              payUrl: tripayTransaction.pay_url,
              checkoutUrl: tripayTransaction.checkout_url,
              qrUrl: tripayTransaction.qr_url,
              expiredAt: new Date(tripayTransaction.expired_time * 1000),
              instructions: tripayTransaction.instructions,
            },
          },
        });
      } catch (paymentError) {
        // If payment creation fails, cancel the order
        logger.error('Failed to create payment, cancelling order', {
          orderId: order.id,
          error: paymentError,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });

        // Release reserved inventory
        for (const item of itemsWithDetails) {
          const inventory = await prisma.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (inventory) {
            await prisma.inventory.update({
              where: { variantId: item.variantId },
              data: {
                reserved: Math.max(0, inventory.reserved - item.qty),
              },
            });
          }
        }

        throw new BadRequestError(
          'Failed to create payment transaction. Please try again.',
          'PAYMENT_CREATION_FAILED'
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          message: error.message,
          code: error.code,
        });
      }

      logger.error('Failed to create order', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get order by ID
  fastify.get<{ Params: { id: string } }>('/orders/:id', async (request, reply) => {
    try {
      const orderId = parseInt(request.params.id);

      if (isNaN(orderId)) {
        throw new BadRequestError('Invalid order ID');
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  sku: true,
                  size: true,
                  color: true,
                },
              },
            },
          },
          voucher: true,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          message: 'Order not found',
        });
      }

      return reply.send({
        success: true,
        data: { order },
      });
    } catch (error) {
      logger.error('Failed to fetch order', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch order',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
