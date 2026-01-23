import { useState, useEffect, useCallback } from 'react';
import { UserBook } from '../../books/types';
import { userBooksApi } from '../api/userBooksApi';
import { useAuth } from '../../../contexts/AuthContext';
import { DeleteUserBookResult } from '../types';

interface UseUserBooksReturn {
  userBooks: UserBook[];
  loading: boolean;
  error: string | null;
  refreshUserBooks: () => Promise<void>;
  updateUserBookStatus: (userBookId: number, status: number) => Promise<void>;
  removeUserBook: (userBookId: number, confirmed?: boolean) => Promise<DeleteUserBookResult>;
}

export const useUserBooks = (): UseUserBooksReturn => {
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  const refreshUserBooks = useCallback(async () => {
    const userId = user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const books = await userBooksApi.getUserBooks(userId);

      // Sort by author last name
      const sortedBooks = books.sort((a, b) => {
        const aLastName = a.book.author.split(' ').pop() || '';
        const bLastName = b.book.author.split(' ').pop() || '';
        return aLastName.localeCompare(bLastName);
      });

      setUserBooks(sortedBooks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user books';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateUserBookStatus = useCallback(async (userBookId: number, status: number) => {
    try {
      await userBooksApi.updateUserBookStatus(userBookId, status);
      await refreshUserBooks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update book status';
      setError(errorMessage);
      throw err;
    }
  }, [refreshUserBooks]);

  const removeUserBook = useCallback(async (userBookId: number, confirmed?: boolean): Promise<DeleteUserBookResult> => {
    try {
      const result = await userBooksApi.deleteUserBook(userBookId, confirmed);
      if (result.type === 'success') {
        await refreshUserBooks();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove book';
      setError(errorMessage);
      throw err;
    }
  }, [refreshUserBooks]);

  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      refreshUserBooks();
    }
  }, [isAuthLoading, user?.id, refreshUserBooks]);

  return {
    userBooks,
    loading,
    error,
    refreshUserBooks,
    updateUserBookStatus,
    removeUserBook,
  };
};