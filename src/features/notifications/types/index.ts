export interface Notification {
  id: number;
  userId: string;
  notificationType: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  shareId: number | null;
  createdByUserId: string;
}

// Common notification types as constants for filtering
export const NotificationTypes = {
  // Share-related notifications
  STATUS_STATUS_CHANGED: 'ShareStatusChanged',
  DUE_DATE_CHANGED: 'ShareDueDateChanged',
  SHARE_MESSAGE_RECEIVED: 'ShareMessageReceived',
  USER_BOOK_WITHDRAWN: 'UserBookWithdrawn',
} as const;
