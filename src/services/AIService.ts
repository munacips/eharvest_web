import { apiGet, apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { PricePrediction, MarketInsight, SeasonRecommendation } from '../types';

export class AIService {
    static async predictPrice(
        commodity: string,
        quantity: number
    ): Promise<PricePrediction> {
        return apiPost(API_CONFIG.ENDPOINTS.AI_PREDICT_PRICE, {
            commodity,
            quantity,
        });
    }

    static async forecastCommodity(
        commodity: string,
        days: number = 30
    ): Promise<any> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_FORECAST_COMMODITY.replace(':commodity', encodeURIComponent(commodity)), {
            params: { commodity, days },
        });
    }

    static async getDemandSupplyForecast(
        commodity: string,
        region?: string
    ): Promise<any> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_DEMAND_SUPPLY_FORECAST, {
            params: { commodity, region },
        });
    }

    static async getSeasonRecommendations(
        region?: string,
        season?: string
    ): Promise<SeasonRecommendation[]> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_PRESCRIPTIVE_RECOMMENDATIONS, {
            params: { region, season },
        });
    }

    static async getMarketInsights(commodity?: string): Promise<MarketInsight[]> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_MARKET_PRICES, {
            params: { commodity },
        });
    }

    static async getWeatherIntegration(
        latitude: number,
        longitude: number
    ): Promise<any> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_WEATHER_INTEGRATION, {
            params: { latitude, longitude },
        });
    }

    static async getLogisticsMatch(
        originLat: number,
        originLng: number,
        destinationLat: number,
        destinationLng: number
    ): Promise<any> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_PRICING_AUTO, {
            params: { originLat, originLng, destinationLat, destinationLng },
        });
    }

    static async getTrustScore(userId: string): Promise<number> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_TRUST_SCORE.replace(':userId', encodeURIComponent(userId)));
    }

    static async getPricingSchema(): Promise<any> {
        return apiGet(API_CONFIG.ENDPOINTS.AI_PRICING_SCHEMA);
    }

    static async getBatchPricing(payload: unknown): Promise<any> {
        return apiPost(API_CONFIG.ENDPOINTS.AI_PRICING_BATCH, payload);
    }

    static async getAutoPricing(payload: unknown): Promise<any> {
        return apiPost(API_CONFIG.ENDPOINTS.AI_PRICING_AUTO, payload);
    }
}
