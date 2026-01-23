import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { Notification, NotificationTypes } from '../types';
import { NOTIFICATIONS_POLL_INTERVAL } from '../../../lib/queryConfig';
import { Share } from '../../shares/types';

// Query key for notifications
export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'unread'];

/**
 * Base hook that fetches all unread notifications
 * Automatically refetches at the configured poll interval
 */
export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: notificationsApi.getAllUnreadNotifications,
    refetchInterval: NOTIFICATIONS_POLL_INTERVAL,
  });
}

/**
 * Derives unread share notification count from the notifications cache
 * Only counts share-related notifications (StatusChanged, DueDateChanged, ShareMessageReceived, UserBookWithdrawn)
 */
export function useShareUnreadCount() {
  const { data: notifications = [] } = useNotifications();

  const shareNotifications = notifications.filter(
    (notification) =>
      notification.notificationType === NotificationTypes.STATUS_STATUS_CHANGED ||
      notification.notificationType === NotificationTypes.DUE_DATE_CHANGED ||
      notification.notificationType === NotificationTypes.SHARE_MESSAGE_RECEIVED ||
      notification.notificationType === NotificationTypes.USER_BOOK_WITHDRAWN
  );

  return shareNotifications.length;
}

/**
 * Filters notifications for a specific share
 */
export function useShareNotifications(shareId: number) {
  const { data: notifications = [] } = useNotifications();

  const shareNotifications = notifications.filter(
    (notification) => notification.shareId === shareId
  );

  const statusUpdated = shareNotifications.some(
    (n) => n.notificationType === NotificationTypes.STATUS_STATUS_CHANGED
  );

  const dueDateUpdated = shareNotifications.some(
    (n) => n.notificationType === NotificationTypes.DUE_DATE_CHANGED
  );

  const unreadMessagesCount = shareNotifications.filter(
    (n) => n.notificationType === NotificationTypes.SHARE_MESSAGE_RECEIVED
  ).length;

  const bookWithdrawn = shareNotifications.some(
    (n) => n.notificationType === NotificationTypes.USER_BOOK_WITHDRAWN
  );

  return {
    notifications: shareNotifications,
    count: shareNotifications.length,
    statusUpdated,
    dueDateUpdated,
    unreadMessagesCount,
    bookWithdrawn,
  };
}

/**
 * Gets notification count for a list of shares
 * Useful for showing badge counts on tabs (My Borrows vs My Lent Books)
 */
export function useShareListNotificationCount(shares: Share[]) {
  const { data: notifications = [] } = useNotifications();

  const shareIds = new Set(shares.map(share => share.id));

  const count = notifications.filter(
    (notification) =>
      notification.shareId &&
      shareIds.has(notification.shareId) &&
      (notification.notificationType === NotificationTypes.STATUS_STATUS_CHANGED ||
        notification.notificationType === NotificationTypes.DUE_DATE_CHANGED ||
        notification.notificationType === NotificationTypes.SHARE_MESSAGE_RECEIVED ||
        notification.notificationType === NotificationTypes.USER_BOOK_WITHDRAWN)
  ).length;

  return count;
}

/**
 * Mutation to mark share notifications as read with optimistic updates
 */
export function useMarkShareNotificationsRead(shareId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markShareNotificationsRead(shareId),

    // Optimistic update - remove notifications immediately
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);

      // Optimistically update to remove notifications for this share
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old = []) =>
        old.filter((notification) => notification.shareId !== shareId)
      );

      // Return context with the previous value
      return { previousNotifications };
    },

    // On error, rollback to previous value
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
    },

    // Always refetch after success or error to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to mark chat notifications as read with optimistic updates
 */
export function useMarkChatNotificationsRead(shareId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markShareChatNotificationsRead(shareId),

    // Optimistic update - remove chat notifications immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);

      // Remove only ShareMessageReceived notifications for this share
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old = []) =>
        old.filter(
          (notification) =>
            !(notification.shareId === shareId &&
              notification.notificationType === NotificationTypes.SHARE_MESSAGE_RECEIVED)
        )
      );

      return { previousNotifications };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
