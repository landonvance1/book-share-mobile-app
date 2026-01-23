import { api, ApiError } from '../api';
import { server } from '../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:5155';

describe('ApiError', () => {
  it('should create an error with status and message', () => {
    const error = new ApiError(404, 'Not found');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.name).toBe('ApiError');
  });

  it('should include optional data property', () => {
    const data = { detail: 'Resource not found', code: 'NOT_FOUND' };
    const error = new ApiError(404, 'Not found', data);

    expect(error.data).toEqual(data);
  });

  it('should have undefined data when not provided', () => {
    const error = new ApiError(500, 'Server error');

    expect(error.data).toBeUndefined();
  });
});

describe('api.delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-token');
  });

  it('should return null for successful delete with no content', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/test-resource/1`, () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const result = await api.delete('/test-resource/1');

    expect(result).toBeNull();
  });

  it('should return parsed JSON for successful delete with content', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/test-resource/1`, () => {
        return HttpResponse.json({ deleted: true, id: 1 });
      })
    );

    const result = await api.delete('/test-resource/1');

    expect(result).toEqual({ deleted: true, id: 1 });
  });

  it('should throw ApiError with status code on failure', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/test-resource/1`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(api.delete('/test-resource/1')).rejects.toThrow(ApiError);

    try {
      await api.delete('/test-resource/1');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
    }
  });

  it('should include response data in ApiError', async () => {
    const errorData = {
      Message: 'Resource has active dependencies',
      ActiveCount: 3,
    };

    server.use(
      http.delete(`${API_BASE_URL}/test-resource/1`, () => {
        return HttpResponse.json(errorData, { status: 409 });
      })
    );

    try {
      await api.delete('/test-resource/1');
      fail('Expected ApiError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).data).toEqual(errorData);
    }
  });

  it('should allow catching specific status codes', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/test-resource/1`, () => {
        return HttpResponse.json({ reason: 'conflict' }, { status: 409 });
      })
    );

    let caught409 = false;

    try {
      await api.delete('/test-resource/1');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        caught409 = true;
      }
    }

    expect(caught409).toBe(true);
  });
});
