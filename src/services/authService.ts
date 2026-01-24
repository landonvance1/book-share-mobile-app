import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const authService = {
  // API calls
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post('/auth/login', credentials);
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return api.post('/auth/register', userData);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return api.post('/auth/refresh', { refreshToken });
  },

  // Token storage
  storeTokens: async (authResponse: AuthResponse) => {
    await SecureStore.setItemAsync(TOKEN_KEY, authResponse.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authResponse.refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authResponse.user));
  },

  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  getUser: async () => {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};