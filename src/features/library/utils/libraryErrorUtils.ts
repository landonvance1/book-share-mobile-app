export const libraryErrorMessages = {
  ANALYSIS_FAILED: 'Failed to analyze the book cover. Please try again with better lighting or a clearer photo.',
  ANALYSIS_NO_MATCHES: 'No matching books found. Would you like to search manually?',
  RETRY_SUGGESTIONS: 'Please try:\n\u2022 Better lighting\n\u2022 Clearer photo\n\u2022 Manual search',
  NETWORK_ERROR: 'Network connection issue. Please check your connection and try again.',
  DUPLICATE_BOOK: 'This book is already in your library! You can find it in your Library tab.',
  BOOK_NOT_FOUND: 'Book not found. Please try scanning another book or search manually.',
  IMAGE_PROCESSING_FAILED: 'The photo could not be processed. Please take a clearer photo and try again.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    if (error.message.includes('409')) return libraryErrorMessages.DUPLICATE_BOOK;
    if (error.message.includes('connection')) return libraryErrorMessages.NETWORK_ERROR;
    if (error.message.includes('Authentication')) return libraryErrorMessages.AUTHENTICATION_FAILED;
    if (error.message.includes('Server error')) return libraryErrorMessages.SERVER_ERROR;
    if (error.message.includes('Failed to analyze image')) return libraryErrorMessages.ANALYSIS_FAILED;
  }
  return libraryErrorMessages.ANALYSIS_FAILED;
};
