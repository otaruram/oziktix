import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV, getAuthToken } from '../config/env';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: Automatically attach Bearer token if present
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
