import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { rajaOngkir } from '../../providers/rajaongkir';
import { formatSuccessResponse, BadRequestError } from '../../utils/error';
import { logger } from '../../utils/logger';

/**
 * Shipping cost calculation endpoints
 * Routes:
 * - POST /api/shipping/cost
 */

const calculateCostSchema = z.object({
  origin: z.string().min(1, 'Origin city ID is required'),
  destination: z.string().min(1, 'Destination subdistrict ID is required'),
  weight: z.number().positive('Weight must be positive'),
  couriers: z.array(z.string()).optional().default(['jne', 'tiki', 'pos']),
});

export const shippingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Calculate shipping cost
   * POST /api/shipping/cost
   */
  fastify.post('/shipping/cost', async (request, reply) => {
    try {
      const body = calculateCostSchema.parse(request.body);
      
      logger.info('Calculating shipping cost', body);

      const results = await rajaOngkir.calculateMultipleCosts({
        origin: body.origin,
        destination: body.destination,
        weight: body.weight,
        couriers: body.couriers,
      });

      // Format response
      const formattedResults = results.map((courier) => ({
        code: courier.code,
        name: courier.name,
        services: courier.costs.map((service) => ({
          service: service.service,
          description: service.description,
          cost: service.cost[0]?.value || 0,
          etd: service.cost[0]?.etd || '',
          note: service.cost[0]?.note || '',
        })),
      }));

      return formatSuccessResponse({
        origin: body.origin,
        destination: body.destination,
        weight: body.weight,
        couriers: formattedResults,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(error.errors[0].message);
      }

      logger.error('Failed to calculate shipping cost', { error: error.message });
      return reply.status(500).send({
        error: 'Failed to calculate shipping cost',
        message: error.message,
      });
    }
  });
};
