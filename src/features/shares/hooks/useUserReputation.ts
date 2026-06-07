import { useState, useEffect, useCallback } from 'react';
import { UserReputation } from '../types';
import { reputationApi } from '../api/reputationApi';

export const useUserReputation = (userId: string, role: 'borrower' | 'lender') => {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReputation = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await reputationApi.getReputationStats(userId, role);
      setReputation(data);
    } catch (err) {
      console.error('Failed to fetch user reputation:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { reputation, loading };
};
