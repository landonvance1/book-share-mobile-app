import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const mockBook = {
  id: 1,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  thumbnailUrl: 'https://example.com/gatsby.jpg',
};

const mockSearchResult = {
  userBookId: 1,
  bookId: 1,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  thumbnailUrl: 'https://example.com/gatsby.jpg',
  ownerName: 'Book Owner',
  communityName: 'Test Community',
  isAvailable: true,
};

export const booksHandlers = [
  // Search books
  http.get(`${API_BASE_URL}/user-books/search`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    if (search) {
      return HttpResponse.json([mockSearchResult]);
    }

    return HttpResponse.json([]);
  }),

  // Get all books
  http.get(`${API_BASE_URL}/books`, () => {
    return HttpResponse.json([mockBook]);
  }),

  // Get book by ID
  http.get(`${API_BASE_URL}/books/:id`, ({ params }) => {
    return HttpResponse.json({
      ...mockBook,
      id: Number(params.id),
    });
  }),

  // Add book
  http.post(`${API_BASE_URL}/books`, async ({ request }) => {
    const body = await request.json() as { title: string; author: string; thumbnailUrl?: string };
    return HttpResponse.json({
      id: 999,
      title: body.title,
      author: body.author,
      thumbnailUrl: body.thumbnailUrl || '',
    });
  }),

  // Create share request
  http.post(`${API_BASE_URL}/shares`, ({ request }) => {
    const url = new URL(request.url);
    const userBookId = url.searchParams.get('userbookid');
    return HttpResponse.json({
      id: 999,
      userBookId: Number(userBookId),
      borrower: 'user-1',
      returnDate: null,
      status: 1, // Requested
    });
  }),
];
