import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 */
export function initializeEmailService(): void {
  try {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('Email service not configured - SMTP credentials missing');
      return;
    }

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: parseInt(env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    logger.info('Email service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize email service', { error: String(error) });
  }
}

/**
 * Send email helper
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  if (!transporter) {
    logger.warn('Email service not configured - skipping email send');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: String(error),
    });
    throw new Error('Failed to send email');
  }
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${env.FRONTEND_BASE_URL}/auth/verify-email?token=${verificationToken}`;

  const subject = 'Welcome to Cadoobag! Please verify your email';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Cadoobag!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>Thank you for registering with Cadoobag. We're excited to have you on board!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <center>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Cadoobag. All rights reserved.</p>
          <p>You received this email because you registered on our platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Send email verification reminder
 */
export async function sendVerificationReminder(
  email: string,
  name: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${env.FRONTEND_BASE_URL}/auth/verify-email?token=${verificationToken}`;

  const subject = 'Reminder: Please verify your email';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification Required</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>We noticed you haven't verified your email address yet.</p>
          <p>Please verify your email to unlock all features:</p>
          <center>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Cadoobag. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.FRONTEND_BASE_URL}/auth/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background-color: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>We received a request to reset your password for your Cadoobag account.</p>
          <p>Click the button below to reset your password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #EF4444;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Cadoobag. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  name: string
): Promise<void> {
  const subject = 'Your Password Has Been Changed';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Password Changed Successfully</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>This is to confirm that your password has been successfully changed.</p>
          <p>If you made this change, no further action is required.</p>
          <div class="warning">
            <strong>⚠️ Didn't change your password?</strong>
            <p>If you didn't make this change, please contact our support team immediately and secure your account.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Cadoobag. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Initialize on module load
initializeEmailService();
