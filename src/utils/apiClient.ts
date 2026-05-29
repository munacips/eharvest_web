import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

let apiClient: AxiosInstance;

export const initializeApiClient = () => {
    apiClient = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor to add auth token
    apiClient.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    apiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    return apiClient;
};

export const getApiClient = (): AxiosInstance => {
    if (!apiClient) {
        initializeApiClient();
    }
    return apiClient;
};

// Generic API call helper
export const apiCall = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: never,
    config?: AxiosRequestConfig
): Promise<T> => {
    const client = getApiClient();

    try {
        const response = await client({
            method,
            url: endpoint,
            data,
            ...config,
        });

        return response.data;
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
};

// Convenience methods
export const apiGet = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiCall('GET', endpoint, undefined, config);
};

export const apiPost = <T>(endpoint: string, data?: never, config?: AxiosRequestConfig): Promise<T> => {
    return apiCall('POST', endpoint, data, config);
};

export const apiPut = <T>(endpoint: string, data?: never, config?: AxiosRequestConfig): Promise<T> => {
    return apiCall('PUT', endpoint, data, config);
};

export const apiPatch = <T>(endpoint: string, data?: never, config?: AxiosRequestConfig): Promise<T> => {
    return apiCall('PATCH', endpoint, data, config);
};

export const apiDelete = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiCall('DELETE', endpoint, undefined, config);
};
