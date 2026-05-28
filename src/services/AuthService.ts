import { apiPost, apiGet, apiPut } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { LoginRequest, LoginResponse, SignupRequest, User } from '../types';
import { mapUser } from '../utils/apiMappers';
import { normalizeRole } from '../utils/roles';

export class AuthService {
    static async login(credentials: LoginRequest): Promise<LoginResponse> {
        return apiPost<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH_LOGIN, credentials);
    }

    static async register(data: SignupRequest): Promise<LoginResponse> {
        return apiPost<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH_REGISTER, data);
    }

    static async updateProfile(data: Partial<User> & { farmName?: string; companyName?: string }): Promise<User> {
        const userId = this.getUserId();
        const role = normalizeRole(this.getUserRole());

        if (!userId) {
            throw new Error('No user id available.');
        }

        const endpoint =
            role === 'farmer'
                ? `${API_CONFIG.ENDPOINTS.FARMERS}/${userId}`
                : role === 'buyer'
                    ? `${API_CONFIG.ENDPOINTS.BUYERS}/${userId}`
                    : role === 'logistics'
                        ? `${API_CONFIG.ENDPOINTS.LOGISTICS_PROVIDERS}/${userId}`
                        : `${API_CONFIG.ENDPOINTS.USERS}/${userId}`;

        const payload = await apiPut<Record<string, unknown>>(endpoint, data);
        return mapUser(payload);
    }

    static async getProfile(): Promise<User> {
        const userId = this.getUserId();
        const role = normalizeRole(this.getUserRole());

        if (!userId) {
            throw new Error('No user id available.');
        }

        const endpoint =
            role === 'farmer'
                ? `${API_CONFIG.ENDPOINTS.FARMERS}/${userId}`
                : role === 'buyer'
                    ? `${API_CONFIG.ENDPOINTS.BUYERS}/${userId}`
                    : role === 'logistics'
                        ? `${API_CONFIG.ENDPOINTS.LOGISTICS_PROVIDERS}/${userId}`
                        : `${API_CONFIG.ENDPOINTS.USERS}/${userId}`;

        const payload = await apiGet<Record<string, unknown>>(endpoint);
        return mapUser(payload);
    }

    static async logout(): Promise<void> {
        try {
            await apiPost(API_CONFIG.ENDPOINTS.AUTH_LOGOUT);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    static getToken(): string | null {
        return localStorage.getItem('token');
    }

    static isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }

    static getUserRole(): string | null {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                return JSON.parse(user).role;
            } catch {
                return null;
            }
        }
        return null;
    }

    static getUserId(): string | null {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                return JSON.parse(user).id;
            } catch {
                return null;
            }
        }
        return null;
    }
}
