import { authApi } from '../authApi';
import { server } from '../../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

describe('authApi.deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-token');
  });

  it('should resolve successfully on 200', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/auth/account`, () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    await expect(authApi.deleteAccount()).resolves.toBeUndefined();
  });

  it('should throw on server error', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/auth/account`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(authApi.deleteAccount()).rejects.toThrow();
  });

  it('should throw on 401 unauthorized', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/auth/account`, () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    await expect(authApi.deleteAccount()).rejects.toThrow();
  });
});
