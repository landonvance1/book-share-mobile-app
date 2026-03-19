import { API_BASE_URL } from './constants';
import * as SecureStore from 'expo-secure-store';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await SecureStore.getItemAsync('auth_token');
  const headers: Record<string, string> = {};

  if (__DEV__ && API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const api = {
  get: async (endpoint: string) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...authHeaders,
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `API Error: ${response.status}`;
      throw new Error(errorMessage);
    }
    return response.json();
  },
  
  put: async (endpoint: string, data?: any) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      ...(data && { body: JSON.stringify(data) }),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  patch: async (endpoint: string, data?: any) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      ...(data && { body: JSON.stringify(data) }),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    // PATCH requests may return no content (204)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  delete: async (endpoint: string, data?: any) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      ...(data && { body: JSON.stringify(data) }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, `API Error: ${response.status}`, errorData);
    }
    // DELETE requests may return no content
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },
};