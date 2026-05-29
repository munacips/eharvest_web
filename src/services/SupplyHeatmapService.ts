import { apiGet } from '../utils/apiClient';
import type { HeatmapPoint } from '../types';

const extractItems = (decoded: unknown): unknown[] => {
    if (Array.isArray(decoded)) {
        return decoded;
    }

    if (decoded && typeof decoded === 'object') {
        const candidates = ['data', 'points', 'heatmap', 'results', 'items'];
        for (const key of candidates) {
            const value = (decoded as Record<string, unknown>)[key];
            if (Array.isArray(value)) {
                return value;
            }
        }
    }

    throw new Error('Supply heatmap response did not contain a heatmap array.');
};

const parsePoint = (item: Record<string, unknown>): HeatmapPoint | null => {
    const latitude = Number(item.latitude ?? item.lat ?? 0);
    const longitude = Number(item.longitude ?? item.lng ?? 0);
    const weight = Number(
        item.weight_kg ??
        item.weightKg ??
        item.total_kg ??
        item.totalKg ??
        item.normalizedWeight ??
        0
    );

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    if (latitude === 0 && longitude === 0) {
        return null;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
        return null;
    }

    return {
        latitude,
        longitude,
        normalizedWeight: weight,
    };
};

export class SupplyHeatmapService {
    static async fetchSupplyHeatmap(crop: string): Promise<HeatmapPoint[]> {
        const payload = await apiGet<unknown>('/heatmap/supply', {
            params: { crop },
        });

        const items = extractItems(payload);
        return items
            .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map(parsePoint)
            .filter((point): point is HeatmapPoint => point !== null);
    }
}
