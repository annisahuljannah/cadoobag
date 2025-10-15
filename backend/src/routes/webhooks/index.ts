import { FastifyInstance } from 'fastify';
import { tripay, TripayCallback } from '../../providers/tripay';
import { logger } from '../../utils/logger';
import { prisma } from '../../db';

export default async function webhookRoutes(server: FastifyInstance) {
  /**
   * POST /webhooks/tripay
   * Handle payment status callbacks from Tripay
   * 
   * Tripay will send callback when:
   * - Payment is successful (PAID)
   * - Payment failed (FAILED)
   * - Payment expired (EXPIRED)
   * - Payment refunded (REFUND)
   */
  server.post('/webhooks/tripay', async (request, reply) => {
    try {
      // Get callback signature from header
      const callbackSignature = request.headers['x-callback-signature'] as string;

      if (!callbackSignature) {
        logger.warn('Tripay callback received without signature');
        return reply.status(400).send({
          success: false,
          message: 'Missing callback signature',
        });
      }

      // Get raw body as string for signature verification
      const rawBody = JSON.stringify(request.body);
      
      // Verify signature
      const isValid = tripay.verifyCallbackSignature(callbackSignature, rawBody);

      if (!isValid) {
        logger.error('Invalid Tripay callback signature', {
          signature: callbackSignature,
        });
        return reply.status(403).send({
          success: false,
          message: 'Invalid signature',
        });
      }

      // Parse callback data
      const callback = request.body as TripayCallback;

      logger.info('Tripay callback received', {
        reference: callback.reference,
        merchant_ref: callback.merchant_ref,
        status: callback.status,
        amount: callback.amount_received,
      });

      // Find the order by merchant_ref (our order reference)
      const order = await prisma.order.findFirst({
        where: {
          paymentReference: callback.merchant_ref,
        },
      });

      if (!order) {
        logger.error('Order not found for callback', {
          merchant_ref: callback.merchant_ref,
        });
        // Return 200 to prevent Tripay from retrying
        return reply.status(200).send({
          success: true,
          message: 'Order not found',
        });
      }

      // Update order status based on payment status
      let orderStatus: string;
      let paymentStatus: string;

      switch (callback.status) {
        case 'PAID':
          orderStatus = 'CONFIRMED';
          paymentStatus = 'PAID';
          logger.info('Payment confirmed', {
            order_id: order.id,
            reference: callback.reference,
            amount: callback.amount_received,
          });
          break;

        case 'FAILED':
          orderStatus = 'CANCELLED';
          paymentStatus = 'FAILED';
          logger.warn('Payment failed', {
            order_id: order.id,
            reference: callback.reference,
          });
          break;

        case 'EXPIRED':
          orderStatus = 'CANCELLED';
          paymentStatus = 'EXPIRED';
          logger.warn('Payment expired', {
            order_id: order.id,
            reference: callback.reference,
          });
          break;

        case 'REFUND':
          orderStatus = 'CANCELLED';
          paymentStatus = 'REFUNDED';
          logger.info('Payment refunded', {
            order_id: order.id,
            reference: callback.reference,
          });
          break;

        default:
          orderStatus = order.status;
          paymentStatus = callback.status;
          logger.warn('Unknown payment status', {
            order_id: order.id,
            status: callback.status,
          });
      }

      // Update order in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus,
          paymentStatus,
          paymentMethod: callback.payment_method,
          paymentReference: callback.reference, // Update with Tripay reference
          paidAt: callback.paid_at ? new Date(callback.paid_at * 1000) : null,
          updatedAt: new Date(),
        },
      });

      logger.info('Order updated from callback', {
        order_id: order.id,
        status: orderStatus,
        payment_status: paymentStatus,
      });

      // Return success response
      return reply.status(200).send({
        success: true,
        message: 'Callback processed successfully',
      });
    } catch (error) {
      logger.error('Failed to process Tripay callback', { error });
      
      // Always return 200 to prevent Tripay from retrying
      // Log the error for manual investigation
      return reply.status(200).send({
        success: false,
        message: 'Callback processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /webhooks/tripay/test
   * Test endpoint to verify webhook is accessible
   */
  server.get('/webhooks/tripay/test', async (_request, reply) => {
    return reply.send({
      success: true,
      message: 'Tripay webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
    });
  });

  logger.info('Webhook routes registered');
}
