import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const mockNotification = {
  id: 1,
  userId: 'user-1',
  shareId: 1,
  type: 'ShareStatusChanged',
  isRead: false,
  createdAt: '2026-01-10T10:00:00Z',
  share: {
    id: 1,
    userBookId: 1,
    borrower: 'user-2',
    returnDate: '2026-02-01T00:00:00Z',
    status: 1,
  },
  actor: {
    id: 'user-2',
    email: 'actor@example.com',
    firstName: 'Actor',
    lastName: 'User',
    fullName: 'Actor User',
  },
};

export const notificationsHandlers = [
  // Get all unread notifications
  http.get(`${API_BASE_URL}/notifications`, () => {
    return HttpResponse.json([mockNotification]);
  }),

  // Mark share notifications as read
  http.patch(`${API_BASE_URL}/notifications/shares/:shareId/read`, () => {
    return HttpResponse.text('', { status: 204 });
  }),

  // Mark share chat notifications as read
  http.patch(`${API_BASE_URL}/notifications/shares/:shareId/chat/read`, () => {
    return HttpResponse.text('', { status: 204 });
  }),
];
