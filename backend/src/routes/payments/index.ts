import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { tripay } from '../../providers/tripay';
import { logger } from '../../utils/logger';
import { formatSuccessResponse } from '../../utils/error';

// Validation schemas
const createPaymentSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  merchant_ref: z.string().min(1, 'Order reference is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email format'),
  customer_phone: z.string().min(10, 'Invalid phone number'),
  order_items: z.array(
    z.object({
      sku: z.string().optional(),
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().min(1),
      product_url: z.string().optional(),
      image_url: z.string().optional(),
    })
  ).min(1, 'Order items are required'),
  return_url: z.string().optional(),
  expired_time: z.number().optional(),
});

const channelQuerySchema = z.object({
  type: z.enum(['virtual_account', 'convenience_store', 'ewallet', 'qris']).optional(),
});

export default async function paymentRoutes(server: FastifyInstance) {
  /**
   * GET /api/payments/channels
   * Get list of available payment channels
   */
  server.get('/payments/channels', async (request, reply) => {
    try {
      // Parse query parameters
      const query = channelQuerySchema.parse(request.query);

      // Get all active channels
      let channels = await tripay.getPaymentChannels();

      // Filter by type if specified
      if (query.type) {
        channels = channels.filter(channel => channel.type === query.type);
      }

      // Group channels by type for easier frontend handling
      const groupedChannels = channels.reduce((acc, channel) => {
        if (!acc[channel.type]) {
          acc[channel.type] = [];
        }
        acc[channel.type].push(channel);
        return acc;
      }, {} as Record<string, typeof channels>);

      return formatSuccessResponse({
        channels,
        grouped: groupedChannels,
        total: channels.length,
      });
    } catch (error) {
      logger.error('Failed to fetch payment channels', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch payment channels',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/payments/channels/:code
   * Get specific payment channel details
   */
  server.get<{ Params: { code: string } }>(
    '/payments/channels/:code',
    async (request, reply) => {
      try {
        const { code } = request.params;

        const channel = await tripay.getPaymentChannel(code);

        if (!channel) {
          return reply.status(404).send({
            success: false,
            message: `Payment channel '${code}' not found`,
          });
        }

        return formatSuccessResponse({ channel });
      } catch (error) {
        logger.error('Failed to fetch payment channel', { error });
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch payment channel',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /api/payments/tripay/create
   * Create new payment transaction with Tripay
   */
  server.post('/payments/tripay/create', async (request, reply) => {
    try {
      // Validate request body
      const body = createPaymentSchema.parse(request.body);

      // Check if payment channel exists and is active
      const channel = await tripay.getPaymentChannel(body.method);
      if (!channel) {
        return reply.status(400).send({
          success: false,
          message: `Payment method '${body.method}' is not available`,
        });
      }

      // Calculate fees
      const fee = tripay.calculateFee(body.amount, channel);
      const totalAmount = tripay.calculateTotalAmount(body.amount, channel);

      logger.info('Creating payment transaction', {
        merchant_ref: body.merchant_ref,
        method: body.method,
        amount: body.amount,
        fee,
        totalAmount,
      });

      // Create transaction
      const transaction = await tripay.createTransaction(body);

      return formatSuccessResponse({
        transaction,
        fee_info: {
          subtotal: body.amount,
          fee,
          total: totalAmount,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      logger.error('Failed to create payment', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to create payment transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/payments/tripay/:reference
   * Get payment transaction detail
   */
  server.get<{ Params: { reference: string } }>(
    '/payments/tripay/:reference',
    async (request, reply) => {
      try {
        const { reference } = request.params;

        const transaction = await tripay.getTransactionDetail(reference);

        if (!transaction) {
          return reply.status(404).send({
            success: false,
            message: 'Transaction not found',
          });
        }

        return formatSuccessResponse({ transaction });
      } catch (error) {
        logger.error('Failed to fetch transaction', { error });
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch transaction',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /api/payments/calculate-fee
   * Calculate payment fee for a channel
   */
  server.post('/payments/calculate-fee', async (request, reply) => {
    try {
      const body = z.object({
        method: z.string().min(1),
        amount: z.number().min(1),
      }).parse(request.body);

      const channel = await tripay.getPaymentChannel(body.method);
      if (!channel) {
        return reply.status(400).send({
          success: false,
          message: `Payment method '${body.method}' is not available`,
        });
      }

      const fee = tripay.calculateFee(body.amount, channel);
      const totalAmount = tripay.calculateTotalAmount(body.amount, channel);

      return formatSuccessResponse({
        method: body.method,
        method_name: channel.name,
        amount: body.amount,
        fee,
        total: totalAmount,
        fee_details: {
          flat: channel.fee_customer.flat,
          percent: channel.fee_customer.percent,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      logger.error('Failed to calculate fee', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to calculate payment fee',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logger.info('Payment routes registered');
}
