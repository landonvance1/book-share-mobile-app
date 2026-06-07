import { api } from '../../../lib/api';
import { UserReputation } from '../types';

export const reputationApi = {
  getReputationStats: async (userId: string, role: 'borrower' | 'lender'): Promise<UserReputation> =>
    api.get(`/users/${userId}/reputation?role=${role}`),
};
