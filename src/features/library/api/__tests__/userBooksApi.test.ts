import { userBooksApi } from '../userBooksApi';
import {
  setDeleteScenario,
  resetDeleteScenario,
} from '../../../../__tests__/handlers/userBooksHandlers';
import * as SecureStore from 'expo-secure-store';

describe('userBooksApi', () => {
  beforeEach(() => {
    resetDeleteScenario();
    // Set up auth token for API calls
    (SecureStore.setItemAsync as jest.Mock)('auth_token', 'mock-token');
  });

  describe('deleteUserBook', () => {
    it('returns success when book has no active shares', async () => {
      setDeleteScenario('success');

      const result = await userBooksApi.deleteUserBook(1);

      expect(result).toEqual({ type: 'success' });
    });

    it('returns requires_confirmation when book has active shares', async () => {
      setDeleteScenario('conflict', {
        message: "'Test Book' has 3 active share(s). Borrowers will be notified...",
        requiresConfirmation: true,
      });

      const result = await userBooksApi.deleteUserBook(1);

      expect(result).toEqual({
        type: 'requires_confirmation',
        message: "'Test Book' has 3 active share(s). Borrowers will be notified...",
      });
    });

    it('returns success when confirmed=true is provided', async () => {
      setDeleteScenario('conflict'); // Would normally return 409

      const result = await userBooksApi.deleteUserBook(1, true);

      expect(result).toEqual({ type: 'success' });
    });

    it('throws error for non-409 error responses', async () => {
      setDeleteScenario('error');

      await expect(userBooksApi.deleteUserBook(1)).rejects.toThrow('API Error: 500');
    });
  });
});
