import { getFullImageUrl, getImageUrlFromId, cropImageToScanArea } from '../imageUtils';
import { API_BASE_URL } from '../../lib/constants';
import * as ImageManipulator from 'expo-image-manipulator';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock the config (so tests don't depend on production values)
jest.mock('../../features/library/utils/imageProcessingConfig', () => ({
  RESIZE_WIDTH: 1920,
  COMPRESSION_QUALITY: 0.8,
}));

// Mock the API_BASE_URL constant
jest.mock('../../lib/constants', () => ({
  API_BASE_URL: 'http://localhost:5155',
  BookStatus: {
    Available: 1,
    BeingShared: 2,
    Unavailable: 3,
  },
  ShareStatus: {
    Requested: 1,
    Ready: 2,
    PickedUp: 3,
    Returned: 4,
    HomeSafe: 5,
    Disputed: 6,
    Declined: 7,
  },
}));

describe('imageUtils', () => {
  describe('getFullImageUrl', () => {
    it('should return placeholder for empty string', () => {
      expect(getFullImageUrl('')).toBe(
        'https://via.placeholder.com/150x200?text=No+Image'
      );
    });

    it('should return placeholder for undefined', () => {
      expect(getFullImageUrl(undefined)).toBe(
        'https://via.placeholder.com/150x200?text=No+Image'
      );
    });

    it('should return placeholder for whitespace string', () => {
      expect(getFullImageUrl('   ')).toBe(
        'https://via.placeholder.com/150x200?text=No+Image'
      );
    });

    it('should return full URL if it starts with http://', () => {
      const url = 'http://example.com/image.jpg';
      expect(getFullImageUrl(url)).toBe(url);
    });

    it('should return full URL if it starts with https://', () => {
      const url = 'https://example.com/image.jpg';
      expect(getFullImageUrl(url)).toBe(url);
    });

    it('should prepend API_BASE_URL to relative paths with leading slash', () => {
      expect(getFullImageUrl('/images/book.jpg')).toBe(
        `${API_BASE_URL}/images/book.jpg`
      );
    });

    it('should prepend API_BASE_URL and slash to relative paths without leading slash', () => {
      expect(getFullImageUrl('images/book.jpg')).toBe(
        `${API_BASE_URL}/images/book.jpg`
      );
    });
  });

  describe('getImageUrlFromId', () => {
    it('should return placeholder for id <= 0', () => {
      expect(getImageUrlFromId(0)).toBe(
        'https://via.placeholder.com/150x200?text=No+Image'
      );
      expect(getImageUrlFromId(-1)).toBe(
        'https://via.placeholder.com/150x200?text=No+Image'
      );
    });

    it('should return correct URL for valid id', () => {
      expect(getImageUrlFromId(1)).toBe(`${API_BASE_URL}/images/1.jpg`);
      expect(getImageUrlFromId(42)).toBe(`${API_BASE_URL}/images/42.jpg`);
    });
  });

  describe('cropImageToScanArea', () => {
    const mockManipulate = ImageManipulator.manipulateAsync as jest.Mock;

    beforeEach(() => {
      mockManipulate.mockReset();
    });

    it('should call manipulateAsync with crop and resize operations', async () => {
      const inputUri = 'file://test-image.jpg';
      const resultUri = 'file://cropped-image.jpg';

      mockManipulate.mockResolvedValue({ uri: resultUri, width: 1920, height: 2400 });

      const cropRect = { originX: 50, originY: 100, width: 280, height: 350 };
      const result = await cropImageToScanArea(inputUri, cropRect);

      expect(mockManipulate).toHaveBeenCalledWith(
        inputUri,
        [
          { crop: cropRect },
          { resize: { width: 1920 } },
        ],
        {
          compress: 0.8,
          format: 'jpeg',
        }
      );
      expect(result).toBe(resultUri);
    });

    it('should propagate errors from manipulateAsync', async () => {
      mockManipulate.mockRejectedValue(new Error('Image processing failed'));

      await expect(
        cropImageToScanArea('file://bad.jpg', {
          originX: 0,
          originY: 0,
          width: 100,
          height: 100,
        })
      ).rejects.toThrow('Image processing failed');
    });

    it('should pass through the exact crop rectangle provided', async () => {
      mockManipulate.mockResolvedValue({ uri: 'file://out.jpg' });

      const oddCrop = { originX: 123, originY: 456, width: 789, height: 1011 };
      await cropImageToScanArea('file://input.jpg', oddCrop);

      const [, actions] = mockManipulate.mock.calls[0];
      expect(actions[0]).toEqual({ crop: oddCrop });
    });
  });
});
