import { apiGet, apiPost, apiPut } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { Produce } from '../types';
import { extractList, mapProduce } from '../utils/apiMappers';

export class ProductService {
    static async getAllProduce(page: number = 1, limit: number = 20): Promise<{ data: Produce[]; total: number }> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.PRODUCE, { params: { page: page - 1, size: limit } });
        const data = extractList(payload, mapProduce);
        const total = Array.isArray(payload) ? payload.length : Number((payload as { totalElements?: number }).totalElements ?? data.length);
        return { data, total };
    }

    static async getProduceById(id: string): Promise<Produce> {
        const payload = await apiGet<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.PRODUCE}/${id}`);
        return mapProduce(payload);
    }

    static async getFarmerProduce(farmerId: string): Promise<Produce[]> {
        const all = await this.getAllProduce(1, 200);
        return all.data.filter((product) => product.farmerId === farmerId);
    }

    static async searchProduce(
        query: string,
        category?: string,
        minPrice?: number,
        maxPrice?: number
    ): Promise<Produce[]> {
        const all = await this.getAllProduce(1, 200);
        return all.data.filter((product) => {
            const matchesQuery = !query || product.name.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || product.category === category;
            const matchesMinPrice = minPrice === undefined || product.unitPrice >= minPrice;
            const matchesMaxPrice = maxPrice === undefined || product.unitPrice <= maxPrice;
            return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice;
        });
    }

    static async createProduce(data: Partial<Produce>): Promise<Produce> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.PRODUCE, {
            name: data.name,
            category: data.category,
            description: data.description,
            qualityGrade: data.grade,
            quantity: data.quantity,
            price: data.unitPrice,
            availableFrom: data.availableDate,
            harvestDate: data.harvestDate,
            farmer: data.farmerId ? { id: data.farmerId } : undefined,
        });
        return mapProduce(payload);
    }

    static async updateProduce(id: string, data: Partial<Produce>): Promise<Produce> {
        const payload = await apiPut<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.PRODUCE}/${id}`, data);
        return mapProduce(payload);
    }

    static async deleteProduce(id: string): Promise<void> {
        await apiPost(`${API_CONFIG.ENDPOINTS.PRODUCE}/${id}`);
    }
}
