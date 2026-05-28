import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { AIService } from '../services';
import type { MarketInsight, SeasonRecommendation } from '../types';
import { TrendingUp, TrendingDown, Cloud, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
    const location = useLocation();
    const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
    const [recommendations, setRecommendations] = useState<SeasonRecommendation[]>([]);
    const [priceForecast, setPriceForecast] = useState<{ currentPrice?: number; predictedPrice?: number; confidence?: number; timeframe?: string } | null>(null);
    const [demandSupply, setDemandSupply] = useState<any>(null);
    const [weather, setWeather] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const activeSection = location.pathname.replace('/', '') || 'analytics';

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setIsLoading(true);
                const [insights, seasonRecommendations, forecast, demandSupplyForecast, weatherReport] = await Promise.all([
                    AIService.getMarketInsights(),
                    AIService.getSeasonRecommendations(),
                    AIService.predictPrice('tomatoes', 100),
                    AIService.getDemandSupplyForecast('tomatoes'),
                    AIService.getWeatherIntegration(0, 0),
                ]);
                setMarketInsights(insights);
                setRecommendations(seasonRecommendations);
                setPriceForecast(forecast);
                setDemandSupply(demandSupplyForecast);
                setWeather(weatherReport);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadAnalytics();
    }, []);

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Market Analytics</h1>
                    <p className="text-gray-600 mt-2">
                        AI-powered insights for better decisions across forecasting, pricing, demand, and season planning.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {[
                        ['analytics', 'Overview'],
                        ['bulk-pricing', 'Bulk Pricing'],
                        ['demand-supply', 'Demand & Supply'],
                        ['market-insights', 'Market Insights'],
                        ['season-recommendations', 'Recommendations'],
                    ].map(([key, label]) => (
                        <span
                            key={key}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${activeSection === key
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-50 text-green-700'
                                }`}
                        >
                            {label}
                        </span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading analytics...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Market Insights */}
                        <div className="bg-white rounded-lg shadow-md p-6" id="market-insights">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Insights</h2>
                            <div className="space-y-4">
                                {marketInsights.map((insight, idx) => (
                                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900">{insight.commodity}</h3>
                                            <span className="text-sm font-medium text-green-600">
                                                ${insight.averagePrice.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center space-x-1">
                                                {insight.demandTrend === 'increasing' ? (
                                                    <TrendingUp size={16} className="text-green-600" />
                                                ) : insight.demandTrend === 'decreasing' ? (
                                                    <TrendingDown size={16} className="text-red-600" />
                                                ) : (
                                                    <span>→</span>
                                                )}
                                                <span className="text-gray-600">Demand: {insight.demandTrend}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {insight.supplyTrend === 'increasing' ? (
                                                    <TrendingUp size={16} className="text-green-600" />
                                                ) : insight.supplyTrend === 'decreasing' ? (
                                                    <TrendingDown size={16} className="text-red-600" />
                                                ) : (
                                                    <span>→</span>
                                                )}
                                                <span className="text-gray-600">Supply: {insight.supplyTrend}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{insight.seasonalNote}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seasonal Recommendations */}
                        <div className="bg-white rounded-lg shadow-md p-6" id="season-recommendations">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Seasonal Recommendations</h2>
                            <div className="space-y-4">
                                {recommendations.map((rec, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg"
                                    >
                                        <h3 className="font-bold text-gray-900 mb-2">{rec.cropName}</h3>
                                        <p className="text-sm text-gray-700 mb-3">{rec.recommendation}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Zap size={16} className="text-yellow-500" />
                                                <span className="text-sm font-medium">Demand: {rec.demandScore}/10</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <TrendingUp size={16} className="text-green-600" />
                                                <span className="text-sm font-medium">Profit: {rec.profitabilityScore}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Forecasting */}
                        <div className="bg-white rounded-lg shadow-md p-6" id="bulk-pricing">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk Pricing Forecast</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">30-Day Price Forecast</p>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-3xl font-bold text-blue-600">
                                            ${priceForecast?.predictedPrice?.toFixed(2) ?? '0.00'}
                                        </span>
                                        {priceForecast?.currentPrice !== undefined && priceForecast?.predictedPrice !== undefined && (
                                            <span className="text-green-600 font-medium">
                                                {((priceForecast.predictedPrice - priceForecast.currentPrice) / Math.max(priceForecast.currentPrice, 1) * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {priceForecast?.timeframe || 'Forecast returned from the pricing API.'}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">Bulk Market Signal</p>
                                    <p className="font-medium text-gray-900">
                                        {demandSupply?.summary || 'Market pricing and demand/supply data loaded from the AI API.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Weather Integration */}
                        <div className="bg-white rounded-lg shadow-md p-6" id="demand-supply">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Demand, Supply & Weather</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Cloud size={24} className="text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">Weather</p>
                                            <p className="text-sm text-gray-600">AI integration</p>
                                        </div>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                        {weather?.summary || 'Live weather data not returned yet'}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <p className="text-sm text-gray-600">Supply balance</p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {demandSupply?.balance || 'Supply balance loaded from AI demand/supply forecast.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
