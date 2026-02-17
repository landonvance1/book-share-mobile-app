import { API_BASE_URL } from '../lib/constants';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  RESIZE_WIDTH,
  COMPRESSION_QUALITY,
} from '../features/library/utils/imageProcessingConfig';

export const getFullImageUrl = (thumbnailUrl?: string): string => {
  if (!thumbnailUrl || thumbnailUrl.trim() === '') {
    return 'https://via.placeholder.com/150x200?text=No+Image';
  }

  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl;
  }

  return `${API_BASE_URL}${thumbnailUrl.startsWith('/') ? '' : '/'}${thumbnailUrl}`;
};

export const getImageUrlFromId = (id: number): string => {
  if (id <= 0) {
    return 'https://via.placeholder.com/150x200?text=No+Image';
  }

  return `${API_BASE_URL}/images/${id}.jpg`;
};

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Crops an image to the given rectangle, then resizes and compresses it for
 * upload to the cover analysis API.  Combining crop + resize into a single
 * manipulateAsync call avoids an intermediate write to disk.
 *
 * Target output: ~200-500KB, well under Azure Vision's 4MB limit.
 */
export const cropImageToScanArea = async (
  uri: string,
  cropRect: CropRect
): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      { crop: cropRect },
      { resize: { width: RESIZE_WIDTH } },
    ],
    {
      compress: COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
};
