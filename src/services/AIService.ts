import type { AxiosRequestConfig } from 'axios';
import { apiGet, apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { PricePrediction, MarketInsight } from '../types';

const withAiBaseUrl = (config?: AxiosRequestConfig): AxiosRequestConfig => ({
    ...config,
    baseURL: API_CONFIG.AI_BASE_URL,
});

const aiGet = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> =>
    apiGet(endpoint, withAiBaseUrl(config));

const aiPost = <T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiPost(endpoint, data, withAiBaseUrl(config));

export class AIService {
    static async predictPrice(
        commodity: string,
        quantity: number
    ): Promise<PricePrediction> {
        return aiPost(API_CONFIG.ENDPOINTS.AI_PREDICT_PRICE, {
            commodity,
            quantity,
        });
    }

    static async forecastCommodity(
        commodity: string,
        options: { periods?: number; region?: string; visual?: boolean } = {}
    ): Promise<any> {
        const { periods = 30, region, visual = false } = options;
        return aiGet(API_CONFIG.ENDPOINTS.AI_FORECAST_COMMODITY.replace(':commodity', encodeURIComponent(commodity)), {
            params: {
                periods,
                visual,
                region,
            },
        });
    }

    static async demandSupplyForecast(payload: {
        region: string;
        periods: number;
        commodities: string[];
    }): Promise<any> {
        return aiPost(API_CONFIG.ENDPOINTS.AI_DEMAND_SUPPLY_FORECAST, payload);
    }

    static async prescriptiveRecommendations(payload: {
        region: string;
        season?: string | null;
        month?: number | null;
        budget_usd: number;
    }): Promise<any> {
        return aiPost(API_CONFIG.ENDPOINTS.AI_PRESCRIPTIVE_RECOMMENDATIONS, payload);
    }

    static async getMarketInsights(commodity?: string): Promise<MarketInsight[]> {
        return aiGet(API_CONFIG.ENDPOINTS.AI_MARKET_PRICES, {
            params: { commodity },
        });
    }

    static async getWeatherIntegration(
        latitude: number,
        longitude: number
    ): Promise<any> {
        return aiGet(API_CONFIG.ENDPOINTS.AI_WEATHER_INTEGRATION, {
            params: { latitude, longitude },
        });
    }

    static async getLogisticsMatch(
        originLat: number,
        originLng: number,
        destinationLat: number,
        destinationLng: number
    ): Promise<any> {
        return aiGet(API_CONFIG.ENDPOINTS.AI_PRICING_AUTO, {
            params: { originLat, originLng, destinationLat, destinationLng },
        });
    }

    static async getTrustScore(userId: string): Promise<number> {
        return aiGet(API_CONFIG.ENDPOINTS.AI_TRUST_SCORE.replace(':userId', encodeURIComponent(userId)));
    }

    static async getPricingSchema(): Promise<any> {
        return aiGet(API_CONFIG.ENDPOINTS.AI_PRICING_SCHEMA);
    }

    static async getBatchPricing(payload: unknown): Promise<any> {
        return aiPost(API_CONFIG.ENDPOINTS.AI_PRICING_BATCH, payload);
    }

    static async getAutoPricing(payload: unknown): Promise<any> {
        return aiPost(API_CONFIG.ENDPOINTS.AI_PRICING_AUTO, payload);
    }
}
