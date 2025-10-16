import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { prisma } from '../db.js';
import { logger } from './logger.js';

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: number;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  const tokenPayload: JWTPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  const tokenPayload: JWTPayload = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  userId: string,
  email: string,
  roleId: number
): Promise<TokenPair> {
  const payload = { userId, email, roleId };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt,
    },
  });

  logger.info(`Token pair generated for user ${userId}`);

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: parseExpiry(env.JWT_ACCESS_EXPIRY),
    refreshExpiresIn: parseExpiry(env.JWT_REFRESH_EXPIRY),
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  // Verify refresh token
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Check if refresh token exists in database and not expired
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new Error('Refresh token not found');
  }

  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new Error('Refresh token has expired');
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    roleId: storedToken.user.roleId,
  });

  logger.info(`Access token refreshed for user ${storedToken.userId}`);

  return newAccessToken;
}

/**
 * Revoke refresh token (for logout)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });

  logger.info('Refresh token revoked');
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  logger.info(`All refresh tokens revoked for user ${userId}`);
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  logger.info(`Cleaned up ${result.count} expired refresh tokens`);
}

/**
 * Generate email verification token
 */
export function generateVerificationToken(): string {
  return jwt.sign(
    { purpose: 'email-verification', timestamp: Date.now() },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = jwt.sign(
    { userId, purpose: 'password-reset', timestamp: Date.now() },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Store in database
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  logger.info(`Password reset token generated for user ${userId}`);

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<string> {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      purpose: string;
    };

    if (decoded.purpose !== 'password-reset') {
      throw new Error('Invalid token purpose');
    }

    // Check if token exists in database and not used
    const storedToken = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!storedToken) {
      throw new Error('Reset token not found');
    }

    if (storedToken.used) {
      throw new Error('Reset token already used');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Reset token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid reset token');
    }
    throw error;
  }
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordReset.update({
    where: { token },
    data: { used: true },
  });

  logger.info('Password reset token marked as used');
}

/**
 * Parse expiry string to seconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}
