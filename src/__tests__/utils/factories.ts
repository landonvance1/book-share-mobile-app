import { User } from '../../types/auth';
import { Share } from '../../features/shares/types';
import { Book } from '../../features/books/types';
import { ShareStatus, BookStatus } from '../../lib/constants';

let userIdCounter = 1;
let shareIdCounter = 1;
let bookIdCounter = 1;
let userBookIdCounter = 1;

export const createMockUser = (overrides?: Partial<User>): User => {
  const id = `user-${userIdCounter++}`;
  return {
    id,
    email: `${id}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    ...overrides,
  };
};

export const createMockBook = (overrides?: Partial<Book>): Book => {
  const id = bookIdCounter++;
  return {
    id,
    title: `Book Title ${id}`,
    author: `Author ${id}`,
    thumbnailUrl: `https://example.com/book${id}.jpg`,
    ...overrides,
  };
};

export const createMockShare = (overrides?: Partial<Share>): Share => {
  const id = shareIdCounter++;
  const lender = createMockUser({ firstName: 'Lender', lastName: 'User' });
  const borrower = createMockUser({ firstName: 'Borrower', lastName: 'User' });
  const book = createMockBook();

  return {
    id,
    userBookId: userBookIdCounter++,
    borrower: borrower.id,
    returnDate: '2026-02-01T00:00:00Z',
    status: ShareStatus.Requested,
    isDisputed: false,
    disputedBy: null,
    userBook: {
      id: userBookIdCounter,
      userId: lender.id,
      bookId: book.id,
      status: BookStatus.BeingShared,
      isDeleted: false,
      book,
      user: lender,
    },
    borrowerUser: borrower,
    ...overrides,
  };
};

export const createMockNotification = (overrides?: Partial<any>) => {
  return {
    id: 1,
    userId: 'user-1',
    shareId: 1,
    type: 'ShareStatusChanged',
    isRead: false,
    createdAt: '2026-01-10T10:00:00Z',
    share: createMockShare(),
    actor: createMockUser(),
    ...overrides,
  };
};

export const createMockCommunity = (overrides?: Partial<any>) => {
  return {
    id: 1,
    name: 'Test Community',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
};

export const createMockChatMessage = (overrides?: Partial<any>) => {
  return {
    id: 1,
    shareId: 1,
    userId: 'user-1',
    content: 'Test message',
    isSystemMessage: false,
    createdAt: '2026-01-10T10:00:00Z',
    user: createMockUser(),
    ...overrides,
  };
};

// Reset counters between tests
export const resetFactories = () => {
  userIdCounter = 1;
  shareIdCounter = 1;
  bookIdCounter = 1;
  userBookIdCounter = 1;
};
