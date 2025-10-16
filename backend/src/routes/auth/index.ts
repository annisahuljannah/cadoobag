import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/bcrypt.js';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
} from '../../utils/jwt.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../../services/email.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/error.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Validate password strength
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password validation failed', {
          errors: passwordValidation.errors,
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Email already registered',
        });
      }

      // Get default customer role
      let customerRole = await prisma.role.findUnique({
        where: { code: 'CUSTOMER' },
      });

      // Create role if doesn't exist (for initial setup)
      if (!customerRole) {
        customerRole = await prisma.role.create({
          data: {
            code: 'CUSTOMER',
            name: 'Customer',
          },
        });
      }

      // Hash password
      const passwordHash = await hashPassword(body.password);

      // Generate verification token
      const verificationToken = generateVerificationToken();

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name || null,
          phone: body.phone || null,
          roleId: customerRole.id,
          verificationToken,
        },
      });

      // Send welcome email with verification link
      try {
        await sendWelcomeEmail(user.email, user.name || '', verificationToken);
      } catch (error) {
        logger.error('Failed to send welcome email', { error: String(error) });
        // Don't fail registration if email fails
      }

      logger.info(`New user registered: ${user.email}`);

      return reply.status(201).send({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
          details: error.errors,
        });
      }
      if (error instanceof ValidationError) {
        const validationError = error as ValidationError;
        return reply.status(400).send({
          error: 'Validation Error',
          message: validationError.message,
          details: validationError.details,
        });
      }
      logger.error('Registration error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Registration failed',
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login user and return tokens
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: { role: true },
      });

      if (!user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Compare password
      const isPasswordValid = await comparePassword(body.password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Generate token pair
      const tokens = await generateTokenPair(user.id, user.email, user.roleId);

      logger.info(`User logged in: ${user.email}`);

      return reply.send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          role: user.role.code,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      logger.error('Login error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Login failed',
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', async (request, reply) => {
    try {
      const body = refreshTokenSchema.parse(request.body);

      const newAccessToken = await refreshAccessToken(body.refreshToken);

      return reply.send({
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user by revoking refresh token
   */
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = refreshTokenSchema.parse(request.body);

      await revokeRefreshToken(body.refreshToken);

      logger.info(`User logged out: ${request.user?.email}`);

      return reply.send({
        message: 'Logout successful',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      logger.error('Logout error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Logout failed',
      });
    }
  });

  /**
   * POST /api/auth/logout-all
   * Logout from all devices
   */
  fastify.post('/logout-all', { preHandler: authenticate }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      await revokeAllUserTokens(request.user.id);

      logger.info(`User logged out from all devices: ${request.user.email}`);

      return reply.send({
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      logger.error('Logout all error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Logout failed',
      });
    }
  });

  /**
   * POST /api/auth/verify-email
   * Verify email address
   */
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const body = verifyEmailSchema.parse(request.body);

      // Find user by verification token
      const user = await prisma.user.findUnique({
        where: { verificationToken: body.token },
      });

      if (!user) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid or expired verification token',
        });
      }

      if (user.emailVerified) {
        return reply.send({
          message: 'Email already verified',
        });
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          verificationToken: null,
        },
      });

      logger.info(`Email verified: ${user.email}`);

      return reply.send({
        message: 'Email verified successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      logger.error('Email verification error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Email verification failed',
      });
    }
  });

  /**
   * POST /api/auth/resend-verification
   * Resend verification email
   */
  fastify.post('/resend-verification', async (request, reply) => {
    try {
      const body = z.object({ email: z.string().email() }).parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        // Don't reveal if email exists
        return reply.send({
          message: 'If the email exists, a verification link has been sent',
        });
      }

      if (user.emailVerified) {
        return reply.send({
          message: 'Email already verified',
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });

      // Send verification email
      try {
        await sendWelcomeEmail(user.email, user.name || '', verificationToken);
      } catch (error) {
        logger.error('Failed to send verification email', { error: String(error) });
      }

      return reply.send({
        message: 'If the email exists, a verification link has been sent',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      logger.error('Resend verification error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to resend verification',
      });
    }
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      // Don't reveal if email exists (security)
      if (!user) {
        return reply.send({
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate password reset token
      const resetToken = await generatePasswordResetToken(user.id);

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, user.name || '', resetToken);
      } catch (error) {
        logger.error('Failed to send password reset email', { error: String(error) });
      }

      logger.info(`Password reset requested: ${user.email}`);

      return reply.send({
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      logger.error('Forgot password error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Password reset request failed',
      });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const body = resetPasswordSchema.parse(request.body);

      // Validate password strength
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password validation failed', {
          errors: passwordValidation.errors,
        });
      }

      // Verify reset token
      const userId = await verifyPasswordResetToken(body.token);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid reset token',
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(body.password);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Mark token as used
      await markPasswordResetTokenUsed(body.token);

      // Revoke all refresh tokens (force re-login)
      await revokeAllUserTokens(userId);

      // Send confirmation email
      try {
        await sendPasswordChangedEmail(user.email, user.name || '');
      } catch (error) {
        logger.error('Failed to send password changed email', { error: String(error) });
      }

      logger.info(`Password reset successful: ${user.email}`);

      return reply.send({
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      if (error instanceof ValidationError) {
        const validationError = error as ValidationError;
        return reply.status(400).send({
          error: 'Validation Error',
          message: validationError.message,
          details: validationError.details,
        });
      }
      return reply.status(400).send({
        error: 'Bad Request',
        message: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  });

  /**
   * POST /api/auth/change-password
   * Change password (authenticated)
   */
  fastify.post('/change-password', { preHandler: authenticate }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const body = changePasswordSchema.parse(request.body);

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        body.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Current password is incorrect',
        });
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(body.newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password validation failed', {
          errors: passwordValidation.errors,
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(body.newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Revoke all refresh tokens except current session
      // (User stays logged in on current device)
      
      // Send confirmation email
      try {
        await sendPasswordChangedEmail(user.email, user.name || '');
      } catch (error) {
        logger.error('Failed to send password changed email', { error: String(error) });
      }

      logger.info(`Password changed: ${user.email}`);

      return reply.send({
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0].message,
        });
      }
      if (error instanceof ValidationError) {
        const validationError = error as ValidationError;
        return reply.status(400).send({
          error: 'Validation Error',
          message: validationError.message,
          details: validationError.details,
        });
      }
      logger.error('Change password error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Password change failed',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: { role: true },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          emailVerified: user.emailVerified,
          role: user.role.code,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      logger.error('Get user info error', { error: String(error) });
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get user info',
      });
    }
  });
}
