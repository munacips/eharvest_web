import { apiGet, apiPost, apiPut } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { ProduceSubscription, SubscriptionFrequency, SubscriptionStatus } from '../types';
import { extractList, mapSubscription } from '../utils/apiMappers';
import { AuthService } from './AuthService';

export class SubscriptionService {
    static async createSubscription(data: {
        farmerId: string;
        items: { produceId: string; quantity: number; unitPrice?: number }[];
        frequency: SubscriptionFrequency | string;
        startDate: string;
        requiresLogistics?: boolean;
        pickupAddress?: string | null;
        currency?: string;
    }): Promise<ProduceSubscription> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS, data);
        return mapSubscription(payload);
    }

    static async getSubscription(id: string): Promise<ProduceSubscription> {
        const payload = await apiGet<Record<string, unknown>>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_DETAIL.replace(':id', id));
        return mapSubscription(payload);
    }

    static async getBuyerSubscriptions(): Promise<ProduceSubscription[]> {
        const buyerId = AuthService.getUserId();
        if (!buyerId) return [];
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_BUYER.replace(':id', buyerId));
        return extractList(payload, mapSubscription);
    }

    static async getFarmerSubscriptions(): Promise<ProduceSubscription[]> {
        const farmerId = AuthService.getUserId();
        if (!farmerId) return [];
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_FARMER.replace(':id', farmerId));
        return extractList(payload, mapSubscription);
    }

    static async updateSubscription(
        id: string,
        data: Partial<ProduceSubscription> & {
            items?: { produceId: string; quantity: number; unitPrice?: number }[];
            frequency?: SubscriptionFrequency | string;
            requiresLogistics?: boolean;
            pickupAddress?: string | null;
            currency?: string;
        }
    ): Promise<ProduceSubscription> {
        const payload = await apiPut<Record<string, unknown>>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_DETAIL.replace(':id', id), data);
        return mapSubscription(payload);
    }

    static async updateSubscriptionStatus(
        id: string,
        status: SubscriptionStatus
    ): Promise<ProduceSubscription> {
        const payload = await apiPut<Record<string, unknown>>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_DETAIL.replace(':id', id), { status });
        return mapSubscription(payload);
    }

    static async cancelSubscription(id: string): Promise<ProduceSubscription> {
        const payload = await apiPost<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS}/${id}/cancel`, {});
        return mapSubscription(payload);
    }

    static async pauseSubscription(id: string): Promise<ProduceSubscription> {
        const payload = await apiPost<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS}/${id}/pause`, {});
        return mapSubscription(payload);
    }

    static async resumeSubscription(id: string): Promise<ProduceSubscription> {
        const payload = await apiPost<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS}/${id}/resume`, {});
        return mapSubscription(payload);
    }

    static async processSubscription(id: string): Promise<ProduceSubscription> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.SUBSCRIPTION_PROCESS.replace(':id', id), {});
        return mapSubscription(payload);
    }
}
