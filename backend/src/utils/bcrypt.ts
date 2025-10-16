import bcrypt from 'bcrypt';
import { logger } from './logger.js';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher = more secure but slower
 * 10-12 is recommended for most applications
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error: String(error) });
    throw new Error('Password hashing failed');
  }
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    logger.debug(`Password comparison result: ${match}`);
    return match;
  } catch (error) {
    logger.error('Failed to compare password', { error: String(error) });
    throw new Error('Password comparison failed');
  }
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param password - Password to validate
 * @returns Object with isValid and errors
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password needs rehashing (if salt rounds have changed)
 * @param hash - Existing password hash
 * @returns boolean - True if rehashing is needed
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds !== SALT_ROUNDS;
  } catch (error) {
    logger.error('Failed to check hash rounds', { error: String(error) });
    return true; // Assume rehash needed if we can't determine
  }
}

/**
 * Generate a random password
 * Useful for temporary passwords or password resets
 * @param length - Length of password (default: 12)
 * @returns string - Random password
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable pattern
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
