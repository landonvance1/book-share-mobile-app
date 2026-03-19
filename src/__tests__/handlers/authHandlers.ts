import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const authHandlers = [
  // Login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
        },
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };

    return HttpResponse.json({
      user: {
        id: 'user-new',
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: `${body.firstName} ${body.lastName}`,
      },
      token: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  }),

  // Refresh token
  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refreshToken: string };

    if (body.refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        token: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }),
];
