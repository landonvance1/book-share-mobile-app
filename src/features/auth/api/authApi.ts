import { api } from '../../../lib/api';

export const authApi = {
  deleteAccount: async (): Promise<void> => {
    await api.delete('/auth/account');
  },
};
