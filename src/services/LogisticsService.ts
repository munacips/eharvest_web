import { apiGet, apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { LogisticsRequest, SupplyPoint } from '../types';
import { extractList, mapLogisticsRequest, mapSupplyPoint } from '../utils/apiMappers';
import { ProductService } from './ProductService';

export class LogisticsService {
    static async getLogisticsRequest(id: string): Promise<LogisticsRequest> {
        const payload = await apiGet<Record<string, unknown>>(API_CONFIG.ENDPOINTS.LOGISTICS_REQUEST_DETAIL.replace(':id', id));
        return mapLogisticsRequest(payload);
    }

    static async getLogisticsRequests(
        status?: string,
        page: number = 1
    ): Promise<{ data: LogisticsRequest[]; total: number }> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.LOGISTICS_REQUESTS, {
            params: { status, page },
        });
        const data = extractList(payload, mapLogisticsRequest);
        return { data, total: data.length };
    }

    static async acceptRequest(id: string): Promise<LogisticsRequest> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.LOGISTICS_ACCEPT.replace(':id', id), {});
        return mapLogisticsRequest(payload);
    }

    static async rejectRequest(id: string, reason?: string): Promise<LogisticsRequest> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.LOGISTICS_REJECT.replace(':id', id), { reason });
        return mapLogisticsRequest(payload);
    }

    static async markInTransit(id: string): Promise<LogisticsRequest> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.LOGISTICS_IN_TRANSIT.replace(':id', id), {});
        return mapLogisticsRequest(payload);
    }

    static async markDelivered(id: string, proof?: string): Promise<LogisticsRequest> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.LOGISTICS_DELIVERED.replace(':id', id), { proof });
        return mapLogisticsRequest(payload);
    }

    static async holdEscrow(id: string, amount: number): Promise<any> {
        return apiPost(`${API_CONFIG.ENDPOINTS.LOGISTICS_REQUESTS}/${id}/hold-escrow`, { amount });
    }

    static async releaseEscrow(id: string): Promise<any> {
        return apiPost(`${API_CONFIG.ENDPOINTS.LOGISTICS_REQUESTS}/${id}/release-escrow`, {});
    }

    static async getSupplyMap(
        latitude?: number,
        longitude?: number
    ): Promise<SupplyPoint[]> {
        const produce = await ProductService.getAllProduce(1, 200);
        return produce.data
            .filter((item) => item.farmerId)
            .map((item) =>
                mapSupplyPoint({
                    id: item.id,
                    farmerId: item.farmerId,
                    farmerName: item.farmerName,
                    latitude: latitude ?? 0,
                    longitude: longitude ?? 0,
                    availableProduce: [item],
                    trustScore: 0,
                })
            );
    }
}
