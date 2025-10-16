import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { BadRequestError } from '../../utils/error';
import { logger } from '../../utils/logger';

// Bank account information (in production, store in database or env)
const BANK_ACCOUNTS = [
  {
    id: 'bca',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '1234567890',
    accountName: 'PT Cadoobag Indonesia',
    code: 'BCA',
  },
  {
    id: 'mandiri',
    bankName: 'Bank Mandiri',
    accountNumber: '1234567890',
    accountName: 'PT Cadoobag Indonesia',
    code: 'MANDIRI',
  },
  {
    id: 'bni',
    bankName: 'Bank Negara Indonesia (BNI)',
    accountNumber: '1234567890',
    accountName: 'PT Cadoobag Indonesia',
    code: 'BNI',
  },
  {
    id: 'bri',
    bankName: 'Bank Rakyat Indonesia (BRI)',
    accountNumber: '1234567890',
    accountName: 'PT Cadoobag Indonesia',
    code: 'BRI',
  },
];

const uploadProofSchema = z.object({
  paymentId: z.string().uuid(),
  imageUrl: z.string().url(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  transferDate: z.string().optional(),
  notes: z.string().optional(),
});

export default async function manualPaymentRoutes(fastify: FastifyInstance) {
  // Get available bank accounts
  fastify.get('/manual-payment/banks', async (_request, reply) => {
    return reply.send({
      success: true,
      data: BANK_ACCOUNTS,
    });
  });

  // Upload payment proof
  fastify.post('/manual-payment/upload-proof', async (request, reply) => {
    try {
      const body = uploadProofSchema.parse(request.body);

      // Find the payment
      const payment = await prisma.payment.findUnique({
        where: { id: body.paymentId },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw new BadRequestError('Payment not found');
      }

      if (payment.method !== 'MANUAL_TRANSFER') {
        throw new BadRequestError('Invalid payment method');
      }

      if (payment.status === 'PAID') {
        throw new BadRequestError('Payment already verified');
      }

      // Store proof metadata
      const metadata = {
        imageUrl: body.imageUrl,
        accountNumber: body.accountNumber,
        accountName: body.accountName,
        transferDate: body.transferDate,
        notes: body.notes,
        uploadedAt: new Date().toISOString(),
      };

      // Update payment with proof
      const updatedPayment = await prisma.payment.update({
        where: { id: body.paymentId },
        data: {
          proofImageUrl: body.imageUrl,
          status: 'PENDING_VERIFICATION',
          meta: JSON.stringify(metadata),
          updatedAt: new Date(),
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PENDING_VERIFICATION',
        },
      });

      logger.info('Payment proof uploaded', {
        paymentId: body.paymentId,
        orderId: payment.orderId,
      });

      return reply.send({
        success: true,
        message: 'Payment proof uploaded successfully',
        data: {
          payment: updatedPayment,
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

      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }

      logger.error('Failed to upload payment proof', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to upload payment proof',
      });
    }
  });

  // Admin: Get pending verifications
  fastify.get('/manual-payment/admin/pending', async (_request, reply) => {
    try{
      const pendingPayments = await prisma.payment.findMany({
        where: {
          method: 'MANUAL_TRANSFER',
          status: 'PENDING_VERIFICATION',
        },
        include: {
          order: {
            include: {
              address: true,
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return reply.send({
        success: true,
        data: {
          payments: pendingPayments,
          count: pendingPayments.length,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch pending payments', { error });
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch pending payments',
      });
    }
  });

  // Admin: Verify payment
  fastify.post<{ Params: { id: string } }>(
    '/manual-payment/admin/verify/:id',
    async (request, reply) => {
      try {
        const paymentId = request.params.id;

        // Find payment
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: true },
        });

        if (!payment) {
          throw new BadRequestError('Payment not found');
        }

        if (payment.status !== 'PENDING_VERIFICATION') {
          throw new BadRequestError('Payment is not pending verification');
        }

        // Update payment as paid
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'admin', // TODO: use actual admin user ID
          },
        });

        // Update order
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
          },
        });

        logger.info('Payment verified', {
          paymentId,
          orderId: payment.orderId,
        });

        return reply.send({
          success: true,
          message: 'Payment verified successfully',
          data: { payment: updatedPayment },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }

        logger.error('Failed to verify payment', { error });
        return reply.status(500).send({
          success: false,
          message: 'Failed to verify payment',
        });
      }
    }
  );

  // Admin: Reject payment
  fastify.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/manual-payment/admin/reject/:id',
    async (request, reply) => {
      try {
        const paymentId = request.params.id;
        const { reason } = request.body;

        if (!reason) {
          throw new BadRequestError('Rejection reason is required');
        }

        // Find payment
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: true },
        });

        if (!payment) {
          throw new BadRequestError('Payment not found');
        }

        if (payment.status !== 'PENDING_VERIFICATION') {
          throw new BadRequestError('Payment is not pending verification');
        }

        // Update payment as rejected
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionNote: reason,
          },
        });

        // Update order
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'FAILED',
          },
        });

        logger.info('Payment rejected', {
          paymentId,
          orderId: payment.orderId,
          reason,
        });

        return reply.send({
          success: true,
          message: 'Payment rejected',
          data: { payment: updatedPayment },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }

        logger.error('Failed to reject payment', { error });
        return reply.status(500).send({
          success: false,
          message: 'Failed to reject payment',
        });
      }
    }
  );
}
