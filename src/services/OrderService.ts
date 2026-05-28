import { apiGet, apiPost, apiPut } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { Order } from '../types';
import { extractList, mapOrder } from '../utils/apiMappers';
import { AuthService } from './AuthService';

export class OrderService {
    static async createOrder(data: {
        items: { produceId: string; quantity: number }[];
        shippingAddress: string;
    }): Promise<Order> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.ORDERS, data);
        return mapOrder(payload);
    }

    static async getOrder(id: string): Promise<Order> {
        const payload = await apiGet<Record<string, unknown>>(API_CONFIG.ENDPOINTS.ORDER_DETAIL.replace(':id', id));
        return mapOrder(payload);
    }

    static async getFarmerOrders(): Promise<Order[]> {
        const farmerId = AuthService.getUserId();
        if (!farmerId) return [];
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.ORDER_FARMER.replace(':id', farmerId));
        return extractList(payload, mapOrder);
    }

    static async getBuyerOrders(): Promise<Order[]> {
        const buyerId = AuthService.getUserId();
        if (!buyerId) return [];
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.ORDER_BUYER.replace(':id', buyerId));
        return extractList(payload, mapOrder);
    }

    static async updateOrderStatus(
        id: string,
        status: 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
    ): Promise<Order> {
        const current = await this.getOrder(id);
        const payload = await apiPut<Record<string, unknown>>(API_CONFIG.ENDPOINTS.ORDER_DETAIL.replace(':id', id), {
            ...current,
            status,
        });
        return mapOrder(payload);
    }

    static async acceptOrder(id: string): Promise<Order> {
        const payload = await apiPost<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}/accept`, {});
        return mapOrder(payload);
    }

    static async confirmDelivery(id: string): Promise<Order> {
        const payload = await apiPost<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}/delivery-confirmed`, {});
        return mapOrder(payload);
    }

    static async holdEscrow(id: string, amount: number): Promise<any> {
        return apiPost(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}/hold-escrow`, { amount });
    }

    static async releaseEscrow(id: string): Promise<any> {
        return apiPost(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}/release-escrow`, {});
    }

    static async proposeTransportFee(id: string, fee: number): Promise<any> {
        return apiPost(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}/propose-transport-fee?fee=${encodeURIComponent(fee)}`, {});
    }
}
