// centralized axios api client configuration
import axios, { AxiosError } from 'axios';

/**
 * Resolve the API base URL:
 * - When running in the browser:
 *   - Using relative '/api/v1' delegates to Next.js rewrites.
 *     This avoids cross-domain DNS failures on Bangladeshi mobile carriers (GP, Robi, Banglalink, Teletalk)
 *     and eliminates CORS preflight (OPTIONS) roundtrips for maximum mobile speed.
 *   - In local development with explicit localhost URL, connects directly.
 * - When running server-side (SSR): Uses full URL.
 */
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_API_URL?.startsWith('http://localhost')
    ) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return '/api/v1';
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5001/api/v1'
  );
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

// attach authorization token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('foodman_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor to extract data cleanly and format errors
apiClient.interceptors.response.use(
  (response) => {
    // return data object directly if nested in standard wrapper
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'an unexpected server error occurred';
    return Promise.reject(new Error(message));
  }
);
