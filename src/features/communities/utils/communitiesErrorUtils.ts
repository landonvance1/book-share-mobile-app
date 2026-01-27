/**
 * Centralized error handling for communities feature
 */

export enum CommunityErrorCode {
  NOT_FOUND = 'COMMUNITY_NOT_FOUND',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  INVALID_QR = 'INVALID_QR_FORMAT',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface CommunityError {
  code: CommunityErrorCode;
  message: string;
}

/**
 * Parse error from backend and categorize it
 *
 * @param error - Error object from API call
 * @returns Categorized error with code and message
 */
export function parseCommunityError(error: any): CommunityError {
  const message = error?.message || error?.toString() || 'An unknown error occurred';

  // Check for "not found" or "does not exist" errors
  if (
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('does not exist') ||
    message.toLowerCase().includes("doesn't exist")
  ) {
    return {
      code: CommunityErrorCode.NOT_FOUND,
      message,
    };
  }

  // Check for "already member" errors
  if (
    message.toLowerCase().includes('already') &&
    message.toLowerCase().includes('member')
  ) {
    return {
      code: CommunityErrorCode.ALREADY_MEMBER,
      message,
    };
  }

  // Check for invalid QR format
  if (message === 'INVALID_FORMAT' || message === CommunityErrorCode.INVALID_QR) {
    return {
      code: CommunityErrorCode.INVALID_QR,
      message: 'Invalid QR code format',
    };
  }

  // Default to unknown error
  return {
    code: CommunityErrorCode.UNKNOWN,
    message,
  };
}

/**
 * Get user-friendly error title for display
 *
 * @param errorCode - The error code
 * @returns User-friendly error title
 */
export function getErrorTitle(errorCode: CommunityErrorCode): string {
  switch (errorCode) {
    case CommunityErrorCode.NOT_FOUND:
      return 'Community Not Found';
    case CommunityErrorCode.ALREADY_MEMBER:
      return 'Already a Member';
    case CommunityErrorCode.INVALID_QR:
      return 'Invalid QR Code';
    default:
      return 'Error';
  }
}

/**
 * Get user-friendly error message for display
 *
 * @param errorCode - The error code
 * @param communityName - Optional community name for context
 * @returns User-friendly error message
 */
export function getErrorMessage(
  errorCode: CommunityErrorCode,
  communityName?: string
): string {
  switch (errorCode) {
    case CommunityErrorCode.NOT_FOUND:
      return 'This community no longer exists.';
    case CommunityErrorCode.ALREADY_MEMBER:
      return communityName
        ? `You're already part of ${communityName}`
        : "You're already a member of this community";
    case CommunityErrorCode.INVALID_QR:
      return "This doesn't appear to be a BookSharing community code. Please try scanning a valid community QR code.";
    default:
      return 'Failed to join community. Please try again.';
  }
}
