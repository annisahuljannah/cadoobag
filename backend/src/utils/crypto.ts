import * as crypto from 'crypto';

/**
 * Verify HMAC signature for Tripay callback
 */
export function verifyTripaySignature(
  privateKey: string,
  jsonPayload: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac('sha256', privateKey);
  hmac.update(jsonPayload);
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === signature;
}

/**
 * Generate random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
