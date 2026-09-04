// centralized axios api client configuration
import axios, { AxiosError } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://food-man-4wgt.vercel.app/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
