import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserBooks } from '../useUserBooks';
import { AuthProvider } from '../../../../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import {
  setDeleteScenario,
  resetDeleteScenario,
} from '../../../../__tests__/handlers/userBooksHandlers';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

// Helper to wait for hook to be fully initialized (loaded successfully with data)
const waitForHookReady = async (result: { current: ReturnType<typeof useUserBooks> }) => {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.userBooks.length).toBeGreaterThan(0);
  });
};

describe('useUserBooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDeleteScenario();

    // Mock authenticated user
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
      if (key === 'user_data') return Promise.resolve(JSON.stringify(mockUser));
      if (key === 'auth_token') return Promise.resolve('mock-token');
      return Promise.resolve(null);
    });
  });

  describe('initial load', () => {
    it('fetches user books on mount when authenticated', async () => {
      const { result } = renderHook(() => useUserBooks(), { wrapper });

      // Should start loading
      expect(result.current.loading).toBe(false); // Initially false, becomes true during fetch

      await waitForHookReady(result);

      expect(result.current.userBooks).toHaveLength(1);
      expect(result.current.userBooks[0].book.title).toBe('The Great Gatsby');
    });

    it('does not fetch when user is not authenticated', async () => {
      // Mock no auth
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useUserBooks(), { wrapper });

      // Wait a tick to ensure any async operations complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.userBooks).toEqual([]);
    });
  });

  describe('removeUserBook', () => {
    it('returns success when book deletion succeeds', async () => {
      setDeleteScenario('success');
      const { result } = renderHook(() => useUserBooks(), { wrapper });

      await waitForHookReady(result);

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.removeUserBook(1);
      });

      expect(deleteResult).toEqual({ type: 'success' });
    });

    it('returns requires_confirmation when book has active shares', async () => {
      setDeleteScenario('conflict', {
        message: "'Test Book' has 2 active share(s). Borrowers will be notified...",
        requiresConfirmation: true,
      });

      const { result } = renderHook(() => useUserBooks(), { wrapper });

      await waitForHookReady(result);

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.removeUserBook(1);
      });

      expect(deleteResult).toEqual({
        type: 'requires_confirmation',
        message: "'Test Book' has 2 active share(s). Borrowers will be notified...",
      });
    });

    it('returns success when confirmed=true is passed', async () => {
      setDeleteScenario('conflict'); // Would normally return 409

      const { result } = renderHook(() => useUserBooks(), { wrapper });

      await waitForHookReady(result);

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.removeUserBook(1, true);
      });

      expect(deleteResult).toEqual({ type: 'success' });
    });

    it('throws error when API returns error status', async () => {
      setDeleteScenario('error');

      const { result } = renderHook(() => useUserBooks(), { wrapper });

      await waitForHookReady(result);

      await expect(
        act(async () => {
          await result.current.removeUserBook(1);
        })
      ).rejects.toThrow();
    });

    it('does not refresh user books when requires_confirmation is returned', async () => {
      setDeleteScenario('conflict', {
        message: "'Test Book' has 1 active share(s). Borrowers will be notified...",
        requiresConfirmation: true,
      });

      const { result } = renderHook(() => useUserBooks(), { wrapper });

      await waitForHookReady(result);

      const booksBeforeDelete = result.current.userBooks;

      await act(async () => {
        await result.current.removeUserBook(1);
      });

      // Books should remain the same (no refresh called after requires_confirmation)
      expect(result.current.userBooks).toBe(booksBeforeDelete);
    });
  });
});
