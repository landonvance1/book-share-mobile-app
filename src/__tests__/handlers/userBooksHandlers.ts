import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const mockUserBook = {
  id: 1,
  userId: 'user-1',
  bookId: 1,
  status: 1, // Available
  book: {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    thumbnailUrl: 'https://example.com/gatsby.jpg',
  },
  user: {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
  },
};

// Configurable state for testing different scenarios
let deleteScenario: 'success' | 'conflict' | 'error' = 'success';
let conflictData = {
  message: "'The Great Gatsby' has 2 active share(s). Borrowers will be notified...",
  requiresConfirmation: true,
};

export const setDeleteScenario = (scenario: 'success' | 'conflict' | 'error', data?: typeof conflictData) => {
  deleteScenario = scenario;
  if (data) {
    conflictData = data;
  }
};

export const resetDeleteScenario = () => {
  deleteScenario = 'success';
  conflictData = {
    message: "'The Great Gatsby' has 2 active share(s). Borrowers will be notified...",
    requiresConfirmation: true,
  };
};

export const userBooksHandlers = [
  // Get user's books
  http.get(`${API_BASE_URL}/user-books/user/:userId`, () => {
    return HttpResponse.json([mockUserBook]);
  }),

  // Update user book status
  http.put(`${API_BASE_URL}/user-books/:id/status`, async ({ params }) => {
    return HttpResponse.json({
      ...mockUserBook,
      id: Number(params.id),
    });
  }),

  // Delete user book - handles confirmation flow
  http.delete(`${API_BASE_URL}/user-books/:id`, ({ request }) => {
    const url = new URL(request.url);
    const confirmed = url.searchParams.get('confirmed');

    // If confirmed=true, always succeed
    if (confirmed === 'true') {
      return new HttpResponse(null, { status: 200 });
    }

    // Otherwise, check the scenario
    switch (deleteScenario) {
      case 'conflict':
        return HttpResponse.json(conflictData, { status: 409 });
      case 'error':
        return new HttpResponse(null, { status: 500 });
      case 'success':
      default:
        return new HttpResponse(null, { status: 200 });
    }
  }),
];
