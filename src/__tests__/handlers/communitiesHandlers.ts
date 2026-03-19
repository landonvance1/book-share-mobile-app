import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const mockCommunity = {
  id: 1,
  name: 'Test Community',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockCommunityWithMemberCount = {
  ...mockCommunity,
  memberCount: 5,
};

export const communitiesHandlers = [
  // Get all communities
  http.get(`${API_BASE_URL}/communities`, () => {
    return HttpResponse.json([mockCommunity]);
  }),

  // Get user communities
  http.get(`${API_BASE_URL}/community-users/user/:userId`, () => {
    return HttpResponse.json([mockCommunityWithMemberCount]);
  }),

  // Get community by ID
  http.get(`${API_BASE_URL}/communities/:id`, ({ params }) => {
    return HttpResponse.json({
      ...mockCommunity,
      id: Number(params.id),
    });
  }),

  // Add community
  http.post(`${API_BASE_URL}/communities`, async ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    return HttpResponse.json({
      ...mockCommunity,
      id: 999,
      name: name || 'New Community',
    });
  }),

  // Leave community
  http.delete(`${API_BASE_URL}/community-users/leave/:communityId`, () => {
    return HttpResponse.text('', { status: 204 });
  }),
];
