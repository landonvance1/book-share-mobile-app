export interface Book {
  id: number;
  title: string;
  author: string;
  thumbnailUrl: string;
}

export interface BookOwner {
  userBookId: number;
  ownerUserId: string;
  ownerFirstName: string;
  communityId: number;
  communityName: string;
}

export interface SearchBookResult {
  bookId: number;
  title: string;
  author: string;
  owners: BookOwner[];
}

export interface UserBook {
  id: number;
  userId: string;
  bookId: number;
  book: Book;
}

export interface BookSearchResponse {
  books: Book[];
  hasMore: boolean;
}

export interface ExternalBookSearchResponse {
  books: Book[];
  hasMore: boolean;
}