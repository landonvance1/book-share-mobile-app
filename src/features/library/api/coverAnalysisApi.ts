import { API_BASE_URL } from '../../../lib/config';
import * as SecureStore from 'expo-secure-store';
import { CoverAnalysisResponse } from '../types/coverAnalysis';
import { ANALYSIS_TIMEOUT_MS } from '../utils/imageProcessingConfig';

export const coverAnalysisApi = {
  analyzeImage: async (imageUri: string): Promise<CoverAnalysisResponse> => {
    // Validate image URI before building the request
    if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
      throw new Error('Invalid image URI provided for analysis');
    }

    const token = await SecureStore.getItemAsync('auth_token');

    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // React Native FormData expects an object with uri, type, and name properties
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    };

    const formData = new FormData();
    formData.append('imageFile', imageFile as any);

    // Abort controller with timeout to prevent indefinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      // Use fetch directly for FormData (api.ts doesn't support FormData)
      const response = await fetch(`${API_BASE_URL}/books/analyze/cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't expose backend error messages to user
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error('Failed to analyze image. Please try again.');
      }

      const raw = await response.json();

      // Normalize PascalCase backend response to camelCase
      return {
        analysis: raw.analysis,
        matchedBooks: raw.matchedBooks,
        exactMatch: raw.exactMatch ?? null,
      } as CoverAnalysisResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw our custom errors as-is
      if (error instanceof Error && (
        error.message.includes('Authentication') ||
        error.message.includes('Server error') ||
        error.message.includes('Failed to analyze image. Please try again.')
      )) {
        throw error;
      }

      // Timeout via AbortController
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Analysis timed out. Please try again with a clearer photo.');
      }

      // Network connection issue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to analyze image. Please check your connection and try again.');
      }

      // JSON parsing error
      if (error instanceof SyntaxError) {
        console.error('Invalid server response:', error);
        throw new Error('Failed to analyze image. Server returned invalid data.');
      }

      // Generic fallback
      console.error('Unexpected error during cover analysis:', error);
      throw new Error('Failed to analyze image. Please check your connection and try again.');
    }
  },
};
