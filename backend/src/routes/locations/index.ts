import { FastifyPluginAsync } from 'fastify';
import { rajaOngkir } from '../../providers/rajaongkir';
import { formatSuccessResponse } from '../../utils/error';
import { logger } from '../../utils/logger';

/**
 * Location endpoints using RajaOngkir API
 * Routes:
 * - GET /api/locations/provinces
 * - GET /api/locations/cities/:provinceId
 * - GET /api/locations/subdistricts/:cityId
 */
export const locationRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all provinces
   */
  fastify.get('/locations/provinces', async (request, reply) => {
    try {
      logger.info('Fetching provinces');
      const provinces = await rajaOngkir.getProvinces();

      return formatSuccessResponse({
        provinces: provinces.map((p) => ({
          id: p.province_id,
          name: p.province,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to fetch provinces', { error: error.message });
      return reply.status(500).send({
        error: 'Failed to fetch provinces',
        message: error.message,
      });
    }
  });

  /**
   * Get cities in a province
   */
  fastify.get<{
    Params: { provinceId: string };
  }>('/locations/cities/:provinceId', async (request, reply) => {
    const { provinceId } = request.params;

    try {
      logger.info('Fetching cities', { provinceId });
      const cities = await rajaOngkir.getCities(provinceId);

      return formatSuccessResponse({
        cities: cities.map((c) => ({
          id: c.city_id,
          provinceId: c.province_id,
          province: c.province,
          type: c.type,
          name: c.city_name,
          postalCode: c.postal_code,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to fetch cities', { provinceId, error: error.message });
      return reply.status(500).send({
        error: 'Failed to fetch cities',
        message: error.message,
      });
    }
  });

  /**
   * Get subdistricts in a city
   */
  fastify.get<{
    Params: { cityId: string };
  }>('/locations/subdistricts/:cityId', async (request, reply) => {
    const { cityId } = request.params;

    try {
      logger.info('Fetching subdistricts', { cityId });
      const subdistricts = await rajaOngkir.getSubdistricts(cityId);

      return formatSuccessResponse({
        subdistricts: subdistricts.map((s) => ({
          id: s.subdistrict_id,
          cityId: s.city_id,
          city: s.city,
          provinceId: s.province_id,
          province: s.province,
          type: s.type,
          name: s.subdistrict_name,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to fetch subdistricts', { cityId, error: error.message });
      return reply.status(500).send({
        error: 'Failed to fetch subdistricts',
        message: error.message,
      });
    }
  });
};
