import { api } from '../../../lib/api';
import { Community, CommunityWithMemberCount } from '../types';

export const communitiesApi = {
  getAllCommunities: async (): Promise<Community[]> => {
    return api.get('/communities');
  },
  
  getUserCommunities: async (userId: string): Promise<CommunityWithMemberCount[]> => {
    return api.get(`/community-users/user/${userId}`);
  },
  
  getCommunityById: async (id: number): Promise<Community> => {
    return api.get(`/communities/${id}`);
  },
  
  addCommunity: async (name: string): Promise<Community> => {
    return api.post(`/communities?name=${encodeURIComponent(name)}`, {});
  },
  
  leaveCommunity: async (communityId: number): Promise<void> => {
    return api.delete(`/community-users/leave/${communityId}`);
  },

  joinCommunityById: async (communityId: number): Promise<void> => {
    return api.post(`/community-users/join/${communityId}`, {});
  },
};