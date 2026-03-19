import { http, HttpResponse } from 'msw';
import { ShareStatus } from '../../lib/constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const mockShare = {
  id: 1,
  userBookId: 1,
  borrower: 'user-2',
  returnDate: '2026-02-01T00:00:00Z',
  status: ShareStatus.Requested,
  isDisputed: false,
  disputedBy: null,
  userBook: {
    id: 1,
    userId: 'user-1',
    bookId: 1,
    status: 2,
    book: {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      thumbnailUrl: 'https://example.com/gatsby.jpg',
    },
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      firstName: 'Book',
      lastName: 'Owner',
      fullName: 'Book Owner',
    },
  },
  borrowerUser: {
    id: 'user-2',
    email: 'borrower@example.com',
    firstName: 'Book',
    lastName: 'Borrower',
    fullName: 'Book Borrower',
  },
};

export const sharesHandlers = [
  // Get borrower shares
  http.get(`${API_BASE_URL}/shares/borrower`, () => {
    return HttpResponse.json([mockShare]);
  }),

  // Get lender shares
  http.get(`${API_BASE_URL}/shares/lender`, () => {
    return HttpResponse.json([mockShare]);
  }),

  // Get archived borrower shares
  http.get(`${API_BASE_URL}/shares/borrower/archived`, () => {
    return HttpResponse.json([]);
  }),

  // Get archived lender shares
  http.get(`${API_BASE_URL}/shares/lender/archived`, () => {
    return HttpResponse.json([]);
  }),

  // Update share status
  http.put(`${API_BASE_URL}/shares/:shareId/status`, async ({ params, request }) => {
    const body = await request.json() as { Status: number };
    return HttpResponse.json({
      ...mockShare,
      id: Number(params.shareId),
      status: body.Status,
    });
  }),

  // Update return date
  http.put(`${API_BASE_URL}/shares/:shareId/return-date`, async ({ params, request }) => {
    const body = await request.json() as { returnDate: string };
    return HttpResponse.json({
      ...mockShare,
      id: Number(params.shareId),
      returnDate: body.returnDate,
    });
  }),

  // Archive share
  http.post(`${API_BASE_URL}/shares/:shareId/archive`, () => {
    return HttpResponse.json({});
  }),

  // Unarchive share
  http.post(`${API_BASE_URL}/shares/:shareId/unarchive`, () => {
    return HttpResponse.json({});
  }),

  // Dispute share
  http.post(`${API_BASE_URL}/shares/:shareId/dispute`, ({ params }) => {
    return HttpResponse.json({
      ...mockShare,
      id: Number(params.shareId),
      isDisputed: true,
      disputedBy: 'user-2',
    });
  }),
];
