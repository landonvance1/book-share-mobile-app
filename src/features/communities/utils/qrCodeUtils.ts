/**
 * QR Code utility functions for community invite QR codes
 */

const QR_CODE_PREFIX = 'booksharingapp:community:';

/**
 * Parse and validate a community QR code
 * Expected format: "booksharingapp:community:{communityId}"
 *
 * @param data - Raw QR code data string
 * @returns Object with communityId if valid, null if invalid
 */
export function parseQRCode(data: string): { communityId: number } | null {
  if (!data || typeof data !== 'string') {
    return null;
  }

  // Check if data starts with our prefix
  if (!data.startsWith(QR_CODE_PREFIX)) {
    return null;
  }

  // Extract the community ID part and trim whitespace
  const communityIdStr = data.substring(QR_CODE_PREFIX.length).trim();

  // Ensure it contains only numeric characters
  if (!/^\d+$/.test(communityIdStr)) {
    return null;
  }

  // Parse as integer
  const communityId = parseInt(communityIdStr, 10);

  // Validate ID is within reasonable bounds
  // 32-bit signed integer max is 2,147,483,647
  // Using 1,000,000 as reasonable upper limit for community IDs
  if (isNaN(communityId) || communityId <= 0 || communityId > 1000000) {
    return null;
  }

  return { communityId };
}

/**
 * Generate QR code data string for a community
 *
 * @param communityId - The community ID to encode
 * @returns QR code data string
 * @throws Error if communityId is invalid
 */
export function generateQRCodeData(communityId: number): string {
  if (!Number.isInteger(communityId) || communityId <= 0) {
    throw new Error(
      `Invalid community ID: ${communityId}. ID must be a positive integer.`
    );
  }

  return `${QR_CODE_PREFIX}${communityId}`;
}
