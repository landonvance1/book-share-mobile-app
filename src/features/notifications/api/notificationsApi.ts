import { api } from '../../../lib/api';
import { Notification } from '../types';

export const notificationsApi = {
  // Get all unread notifications for the current user
  getAllUnreadNotifications: async (): Promise<Notification[]> => {
    return api.get('/notifications');
  },

  // Mark all notifications for a specific share as read
  markShareNotificationsRead: async (shareId: number): Promise<void> => {
    return api.patch(`/notifications/shares/${shareId}/read`, {});
  },

  // Mark chat notifications for a specific share as read
  markShareChatNotificationsRead: async (shareId: number): Promise<void> => {
    return api.patch(`/notifications/shares/${shareId}/chat/read`, {});
  },

  // Mark a single notification as read by ID
  markNotificationRead: async (notificationId: number): Promise<void> => {
    return api.patch(`/notifications/${notificationId}/read`, {});
  },
};
