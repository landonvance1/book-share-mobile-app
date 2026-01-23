import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notifyManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../__tests__/mocks/server';
import {
  useNotifications,
  useShareUnreadCount,
  useShareNotifications,
  useShareListNotificationCount,
} from '../useNotifications';
import { NotificationTypes } from '../../types';

const API_BASE_URL = 'http://localhost:5155';

// Wrap React Query's notification batching in act() to prevent warnings
// See: https://tanstack.com/query/latest/docs/framework/react/guides/testing
notifyManager.setScheduler((callback) => {
  setTimeout(() => {
    act(() => {
      callback();
    });
  }, 0);
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        refetchInterval: false, // Disable polling in tests
      },
      mutations: { retry: false },
    },
  });

// QueryClient is created per test and cleaned up in afterEach
let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const createNotification = (overrides: Partial<{
  id: number;
  userId: string;
  notificationType: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  shareId: number | null;
  createdByUserId: string;
}>) => ({
  id: 1,
  userId: 'user-1',
  notificationType: NotificationTypes.STATUS_STATUS_CHANGED,
  message: 'Test notification',
  createdAt: '2026-01-10T10:00:00Z',
  readAt: null,
  shareId: 1,
  createdByUserId: 'user-2',
  ...overrides,
});

describe('useNotifications hooks', () => {
  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useShareUnreadCount', () => {
    it('counts StatusChanged notifications', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.STATUS_STATUS_CHANGED }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });

    it('counts DueDateChanged notifications', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.DUE_DATE_CHANGED }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });

    it('counts ShareMessageReceived notifications', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.SHARE_MESSAGE_RECEIVED }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });

    it('counts UserBookWithdrawn notifications', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.USER_BOOK_WITHDRAWN }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });

    it('counts all share-related notification types together', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.STATUS_STATUS_CHANGED }),
            createNotification({ id: 2, notificationType: NotificationTypes.DUE_DATE_CHANGED }),
            createNotification({ id: 3, notificationType: NotificationTypes.SHARE_MESSAGE_RECEIVED }),
            createNotification({ id: 4, notificationType: NotificationTypes.USER_BOOK_WITHDRAWN }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(4);
      });
    });

    it('ignores unknown notification types', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({ id: 1, notificationType: NotificationTypes.STATUS_STATUS_CHANGED }),
            createNotification({ id: 2, notificationType: 'UnknownType' }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });
  });

  describe('useShareNotifications', () => {
    it('returns bookWithdrawn=true when UserBookWithdrawn notification exists for share', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 123,
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareNotifications(123), { wrapper });

      await waitFor(() => {
        expect(result.current.bookWithdrawn).toBe(true);
      });
    });

    it('returns bookWithdrawn=false when no UserBookWithdrawn notification exists', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 123,
              notificationType: NotificationTypes.STATUS_STATUS_CHANGED,
            }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareNotifications(123), { wrapper });

      await waitFor(() => {
        expect(result.current.bookWithdrawn).toBe(false);
      });
    });

    it('returns bookWithdrawn=false when UserBookWithdrawn notification is for different share', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 456, // Different share ID
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareNotifications(123), { wrapper });

      await waitFor(() => {
        expect(result.current.bookWithdrawn).toBe(false);
      });
    });

    it('returns all notification flags correctly', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 123,
              notificationType: NotificationTypes.STATUS_STATUS_CHANGED,
            }),
            createNotification({
              id: 2,
              shareId: 123,
              notificationType: NotificationTypes.DUE_DATE_CHANGED,
            }),
            createNotification({
              id: 3,
              shareId: 123,
              notificationType: NotificationTypes.SHARE_MESSAGE_RECEIVED,
            }),
            createNotification({
              id: 4,
              shareId: 123,
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
          ]);
        })
      );

      const { result } = renderHook(() => useShareNotifications(123), { wrapper });

      await waitFor(() => {
        expect(result.current.statusUpdated).toBe(true);
        expect(result.current.dueDateUpdated).toBe(true);
        expect(result.current.unreadMessagesCount).toBe(1);
        expect(result.current.bookWithdrawn).toBe(true);
        expect(result.current.count).toBe(4);
      });
    });
  });

  describe('useShareListNotificationCount', () => {
    it('counts UserBookWithdrawn notifications in share list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 1,
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
          ]);
        })
      );

      const mockShares = [{ id: 1 }, { id: 2 }] as any;
      const { result } = renderHook(() => useShareListNotificationCount(mockShares), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
    });

    it('counts all notification types for shares in list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 1,
              notificationType: NotificationTypes.STATUS_STATUS_CHANGED,
            }),
            createNotification({
              id: 2,
              shareId: 1,
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
            createNotification({
              id: 3,
              shareId: 2,
              notificationType: NotificationTypes.DUE_DATE_CHANGED,
            }),
          ]);
        })
      );

      const mockShares = [{ id: 1 }, { id: 2 }] as any;
      const { result } = renderHook(() => useShareListNotificationCount(mockShares), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(3);
      });
    });

    it('ignores notifications for shares not in list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/notifications`, () => {
          return HttpResponse.json([
            createNotification({
              id: 1,
              shareId: 999, // Not in the list
              notificationType: NotificationTypes.USER_BOOK_WITHDRAWN,
            }),
          ]);
        })
      );

      const mockShares = [{ id: 1 }, { id: 2 }] as any;
      const { result } = renderHook(() => useShareListNotificationCount(mockShares), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(0);
      });
    });
  });
});
