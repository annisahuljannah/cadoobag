import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './env';
import { logger } from './utils/logger';
import { formatErrorResponse, HttpError } from './utils/error';

// Import providers
import { rajaOngkir } from './providers/rajaongkir';
import { tripay } from './providers/tripay';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/carts';
import orderRoutes from './routes/orders';
import { locationRoutes } from './routes/locations';
import { shippingRoutes } from './routes/shipping';
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';
import manualPaymentRoutes from './routes/manual-payment';

const server = Fastify({
  logger: false,
});

// Register plugins
server.register(cors, {
  origin: env.FRONTEND_BASE_URL,
  credentials: true,
});

server.register(multipart, {
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE, 10),
  },
});

server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(productRoutes, { prefix: '/api' });
server.register(categoryRoutes, { prefix: '/api' });
server.register(cartRoutes, { prefix: '/api' });
server.register(orderRoutes, { prefix: '/api' });
server.register(locationRoutes, { prefix: '/api' });
server.register(shippingRoutes, { prefix: '/api' });
server.register(paymentRoutes, { prefix: '/api' });
server.register(manualPaymentRoutes, { prefix: '/api' });

// Register webhook routes (no /api prefix)
server.register(webhookRoutes);

// Error handler
server.setErrorHandler((error, request, reply) => {
  if (error instanceof HttpError) {
    logger.warn(`HTTP Error ${error.statusCode}: ${error.message}`, {
      path: request.url,
      method: request.method,
    });
    return reply.status(error.statusCode).send(formatErrorResponse(error));
  }

  logger.error('Unexpected error', {
    error: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  return reply.status(500).send(formatErrorResponse(error));
});

// 404 handler
server.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Start server
const start = async () => {
  try {
    // Initialize providers
    logger.info('Initializing providers...');
    rajaOngkir; // Initialize RajaOngkir provider
    tripay; // Initialize Tripay provider
    
    const port = parseInt(env.PORT, 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`🚀 Server running on ${env.BACKEND_BASE_URL}`);
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
};

start();
