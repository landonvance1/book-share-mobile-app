import { api, ApiError } from '../../../lib/api';
import { UserBook } from '../../books/types';
import { DeleteUserBookResult } from '../types';

export const userBooksApi = {
  getUserBooks: async (userId: string): Promise<UserBook[]> => {
    return api.get(`/user-books/user/${userId}`);
  },

  updateUserBookStatus: async (userBookId: number, status: number): Promise<UserBook> => {
    return api.put(`/user-books/${userBookId}/status`, status);
  },

  deleteUserBook: async (userBookId: number, confirmed: boolean = false): Promise<DeleteUserBookResult> => {
    try {
      await api.delete(`/user-books/${userBookId}?confirmed=${confirmed}`);
      return { type: 'success' };
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return {
          type: 'requires_confirmation',
          message: error.data?.message,
        };
      }
      throw error;
    }
  },
};