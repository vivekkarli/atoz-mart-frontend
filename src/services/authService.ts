import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ErrorResponse, LoginRequest, SignupRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../types';

// Configurable base URLs (extendable for other services)
const BASE_URLS = {
  auth: process.env.REACT_APP_AUTH_BASE_URL || 'https://localhost:8072/atozmart/authserver',
  // Add other services here later, e.g., product: 'https://localhost:8073/atozmart/products'
};

// Create Axios instance with base config
const api = axios.create({
  baseURL: BASE_URLS.auth,
});

// Optional: Bypass SSL verification for self-signed certs (development only)
if (process.env.NODE_ENV === 'development') {
  // Warning: This is insecure and should be removed in production
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('SSL verification disabled for development. Remove this in production!');
}

// Add JWT to headers if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers['X-Access-Token'] = token; // As per your sample
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const errorMsg = error.response?.data?.errorMsg || 'An unexpected error occurred';
    toast.error(errorMsg, { position: 'top-center' });
    return Promise.reject(error);
  }
);

export const login = async (data: LoginRequest) => {
  const response = await api.post('/login', data);
  const token = response.headers['x-access-token']; // As per your note
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

export const resetPassword = async (data: ResetPasswordRequest) => {
  const response = await api.post('/reset-password', data);
  return response.data;
};