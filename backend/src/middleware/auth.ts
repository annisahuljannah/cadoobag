import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JWTPayload } from '../utils/jwt.js';
import { prisma } from '../db.js';
import { logger } from '../utils/logger.js';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      roleId: number;
      roleCode: string;
      emailVerified: boolean;
    };
  }
}

/**
 * Authentication middleware - verifies JWT token
 * Attaches user data to request.user if valid
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid token',
      });
    }

    // Check token type
    if (decoded.type !== 'access') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.role.code,
      emailVerified: user.emailVerified,
    };

    logger.debug(`User authenticated: ${user.email}`);
  } catch (error) {
    logger.error('Authentication error', { error: String(error) });
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Require email verification middleware
 * Must be used after authenticate middleware
 */
export async function requireEmailVerification(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!request.user.emailVerified) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Email verification required',
    });
  }
}

/**
 * Require admin role middleware
 * Must be used after authenticate middleware
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (request.user.roleCode !== 'ADMIN' && request.user.roleCode !== 'SUPER_ADMIN') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  logger.debug(`Admin access granted: ${request.user.email}`);
}

/**
 * Require super admin role middleware
 * Must be used after authenticate middleware
 */
export async function requireSuperAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (request.user.roleCode !== 'SUPER_ADMIN') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Super admin access required',
    });
  }

  logger.debug(`Super admin access granted: ${request.user.email}`);
}

/**
 * Optional authentication - doesn't fail if no token
 * Attaches user if token is valid, continues without user if not
 */
export async function optionalAuthenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token, continue without user
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      if (decoded.type !== 'access') {
        return; // Invalid token type, continue without user
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (user) {
        request.user = {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          roleCode: user.role.code,
          emailVerified: user.emailVerified,
        };
      }
    } catch (error) {
      // Token invalid, continue without user
      logger.debug('Optional auth failed, continuing without user');
    }
  } catch (error) {
    logger.error('Optional authentication error', { error: String(error) });
    // Continue without user
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(request: FastifyRequest, ...roles: string[]): boolean {
  if (!request.user) {
    return false;
  }
  return roles.includes(request.user.roleCode);
}

/**
 * Check if user owns resource (user ID matches)
 */
export function isOwner(request: FastifyRequest, resourceUserId: string): boolean {
  if (!request.user) {
    return false;
  }
  return request.user.id === resourceUserId;
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(
  request: FastifyRequest,
  resourceUserId: string
): boolean {
  return hasRole(request, 'ADMIN', 'SUPER_ADMIN') || isOwner(request, resourceUserId);
}
