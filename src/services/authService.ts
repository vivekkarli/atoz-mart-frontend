import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { ErrorResponse, LoginRequest, SignupRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../types';

const BASE_URLS = {
  auth: process.env.REACT_APP_AUTH_BASE_URL || 'https://localhost:8072/atozmart/authserver',
};

const api = axios.create({
  baseURL: BASE_URLS.auth,
});

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('SSL verification disabled for development. Remove this in production!');
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers['X-Access-Token'] = token; // Match server case
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response, // Success case
  (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      // Response received but blocked by CORS or other client-side issues
      const token = error.response.headers['x-access-token'] || error.response.headers['X-Access-Token'];
      if (token) {
        localStorage.setItem('jwt', token); // Save token despite CORS error
        console.warn('CORS error encountered, but token saved:', token);
        return { data: error.response.data, token }; // Return partial success
      }
    }
    const errorMsg = error.response?.data?.errorMsg || 'An unexpected error occurred';
    toast.error(errorMsg, { position: 'top-center' });
    return Promise.reject(error);
  }
);

export const login = async (data: LoginRequest) => {
  const response = await api.post('/login', data);
  const token = response.headers['x-access-token'] || response.headers['X-Access-Token'];
  if (token) localStorage.setItem('jwt', token); // Ensure token is saved
  return { data: response.data, token };
};

export const signup = async (data: SignupRequest) => {
  const response = await api.post('/signup', data);
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordRequest) => {
  const response = await api.post('/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordRequest, token: string) => {
  const response = await api.patch(`/reset-password?token=${token}`, data);
  return response.data;
};