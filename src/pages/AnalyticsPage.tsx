import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { AIService, SupplyHeatmapService } from '../services';
import type {
    DemandSupplySeries,
    ForecastPoint,
    HeatmapPoint,
    PrescriptiveRecommendation,
} from '../types';
import { TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { useLocation } from 'react-router-dom';

type CommodityEntry = { id: string; value: string };

const cropOptions = [
    'Maize',
    'Sorghum',
    'Millet',
    'Finger Millet',
    'Wheat',
    'Barley',
    'Rice',
    'Soya Beans',
    'Groundnuts',
    'Sugar Beans',
    'Cowpeas',
    'Bambara Nuts',
    'Sunflower',
    'Cotton',
    'Tobacco',
    'Sugarcane',
    'Tea',
    'Coffee',
    'Mangoes',
    'Oranges',
    'Bananas',
    'Apples',
    'Avocados',
    'Pineapples',
    'Strawberries',
    'Papaya',
    'Grapes',
    'Tomatoes',
    'Onions',
    'Potatoes',
    'Sweet Potatoes',
    'Cabbage',
    'Leafy Vegetables',
    'Butternut',
    'Pumpkin',
    'Paprika',
    'Chillies',
    'Carrots',
];

const zimbabweCenter: [number, number] = [-19.0154, 29.1549];

const parseForecast = (response: unknown): ForecastPoint[] => {
    if (!response || typeof response !== 'object') {
        return [];
    }

    const forecast = (response as Record<string, unknown>).forecast;
    if (!Array.isArray(forecast)) {
        return [];
    }

    return forecast
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            const date = String((item as Record<string, unknown>).date ?? '').trim();
            const value = Number((item as Record<string, unknown>).value ?? NaN);
            if (!date || !Number.isFinite(value)) {
                return null;
            }
            return { date, value };
        })
        .filter((point): point is ForecastPoint => point !== null);
};

const parseDemandSupplySeries = (response: unknown): DemandSupplySeries[] => {
    if (!response || typeof response !== 'object') {
        return [];
    }

    const forecasts = (response as Record<string, unknown>).forecasts;
    if (!Array.isArray(forecasts)) {
        return [];
    }

    return forecasts
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            const payload = item as Record<string, unknown>;
            const commodity = String(payload.commodity ?? 'Commodity');
            const demand = Array.isArray(payload.demand) ? payload.demand : [];
            const supply = Array.isArray(payload.supply) ? payload.supply : [];
            const demandValues = demand
                .map((entry) => Number((entry as Record<string, unknown>)?.value ?? NaN))
                .filter((value) => Number.isFinite(value));
            const supplyValues = supply
                .map((entry) => Number((entry as Record<string, unknown>)?.value ?? NaN))
                .filter((value) => Number.isFinite(value));

            const normalizedSupply = supplyValues.length
                ? supplyValues
                : Array(demandValues.length).fill(0);

            return {
                commodity,
                demandValues,
                supplyValues: normalizedSupply,
            };
        })
        .filter((series): series is DemandSupplySeries => !!series && series.demandValues.length > 0);
};

const parseRecommendations = (response: unknown): {
    seasonLabel: string;
    recommendations: PrescriptiveRecommendation[];
} => {
    if (!response || typeof response !== 'object') {
        return { seasonLabel: '', recommendations: [] };
    }

    const payload = response as Record<string, unknown>;
    const items = payload.recommendations;
    if (!Array.isArray(items)) {
        return { seasonLabel: '', recommendations: [] };
    }

    const recommendations = items
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            const entry = item as Record<string, unknown>;
            const why = (entry.why as Record<string, unknown>) ?? {};
            const targets = Array.isArray(entry.market_targets) ? entry.market_targets : [];
            const plantingMonths = Array.isArray(why.planting_months)
                ? why.planting_months
                    .map((month) => Number(month))
                    .filter((month) => Number.isFinite(month))
                : [];

            return {
                commodity: String(entry.commodity ?? 'Unknown'),
                score: Number(entry.score ?? 0),
                climateFit: why.climate_fit === true,
                estimatedCostUsd: Number(why.estimated_cost_usd_per_ha ?? NaN),
                plantingMonths,
                marketTargets: targets
                    .map((market) => {
                        if (!market || typeof market !== 'object') {
                            return null;
                        }
                        const marketItem = market as Record<string, unknown>;
                        return {
                            name: String(marketItem.market ?? 'Market'),
                            avgPrice: Number(marketItem.avg_price ?? NaN),
                        };
                    })
                    .filter((market): market is { name: string; avgPrice?: number } => !!market),
            };
        })
        .filter((rec): rec is PrescriptiveRecommendation => !!rec);

    return {
        seasonLabel: String(payload.season ?? '').trim(),
        recommendations,
    };
};

const MessageCard: React.FC<{ message: string; tone?: 'error' | 'info' }> = ({
    message,
    tone = 'info',
}) => {
    const isError = tone === 'error';
    return (
        <div className={`rounded-xl border px-4 py-3 ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            {message}
        </div>
    );
};

const ForecastChart: React.FC<{ points: ForecastPoint[] }> = ({ points }) => {
    if (points.length < 2) {
        return <div className="text-sm text-gray-500">Not enough data to draw the trend yet.</div>;
    }

    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const span = maxValue - minValue || 1;
    const width = 320;
    const height = 160;
    const padding = 8;

    const linePoints = values
        .map((value, index) => {
            const x = padding + (index / (values.length - 1)) * (width - padding * 2);
            const y = height - padding - ((value - minValue) / span) * (height - padding * 2);
            return `${x},${y}`;
        })
        .join(' ');

    const fillPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
            <defs>
                <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline fill="url(#forecast-fill)" stroke="none" points={fillPoints} />
            <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={linePoints} />
        </svg>
    );
};

const DualLineChart: React.FC<{ demand: number[]; supply: number[] }> = ({ demand, supply }) => {
    if (demand.length < 2) {
        return <div className="text-sm text-gray-500">Not enough data to draw the trend yet.</div>;
    }

    const values = [...demand, ...supply];
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const span = maxValue - minValue || 1;
    const width = 320;
    const height = 160;
    const padding = 16;

    const buildPoints = (series: number[]) =>
        series
            .map((value, index) => {
                const x = padding + (index / (series.length - 1)) * (width - padding * 2);
                const y = height - padding - ((value - minValue) / span) * (height - padding * 2);
                return `${x},${y}`;
            })
            .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
            <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={buildPoints(demand)} />
            <polyline fill="none" stroke="#f97316" strokeWidth="2" points={buildPoints(supply)} />
        </svg>
    );
};

export const AnalyticsPage: React.FC = () => {
    const location = useLocation();
    const activeSection = location.hash.replace('#', '') || 'forecasts';
    const entryId = useRef(0);

    const [forecastCommodity, setForecastCommodity] = useState('maize');
    const [forecastPeriods, setForecastPeriods] = useState('30');
    const [forecastRegion, setForecastRegion] = useState('');
    const [forecastLoading, setForecastLoading] = useState(false);
    const [forecastError, setForecastError] = useState('');
    const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);
    const [forecastAverage, setForecastAverage] = useState<number | null>(null);
    const [forecastChange, setForecastChange] = useState<number | null>(null);

    const [demandRegion, setDemandRegion] = useState('Harare');
    const [demandPeriods, setDemandPeriods] = useState('6');
    const [demandEntries, setDemandEntries] = useState<CommodityEntry[]>([
        { id: `${entryId.current++}`, value: '' },
    ]);
    const [demandLoading, setDemandLoading] = useState(false);
    const [demandError, setDemandError] = useState('');
    const [demandSeries, setDemandSeries] = useState<DemandSupplySeries[]>([]);

    const [recRegion, setRecRegion] = useState('Harare');
    const [recBudget, setRecBudget] = useState('500');
    const [recMonth, setRecMonth] = useState<number | null>(null);
    const [recSeason, setRecSeason] = useState('');
    const [recLoading, setRecLoading] = useState(false);
    const [recError, setRecError] = useState('');
    const [recSeasonLabel, setRecSeasonLabel] = useState('');
    const [recItems, setRecItems] = useState<PrescriptiveRecommendation[]>([]);

    const [selectedCrop, setSelectedCrop] = useState(cropOptions[0]);
    const [heatmapLoading, setHeatmapLoading] = useState(true);
    const [heatmapError, setHeatmapError] = useState('');
    const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);

    const monthOptions = useMemo(
        () => [
            { value: 1, label: 'January' },
            { value: 2, label: 'February' },
            { value: 3, label: 'March' },
            { value: 4, label: 'April' },
            { value: 5, label: 'May' },
            { value: 6, label: 'June' },
            { value: 7, label: 'July' },
            { value: 8, label: 'August' },
            { value: 9, label: 'September' },
            { value: 10, label: 'October' },
            { value: 11, label: 'November' },
            { value: 12, label: 'December' },
        ],
        []
    );

    const fetchForecast = async () => {
        const commodity = forecastCommodity.trim();
        if (!commodity) {
            setForecastError('Commodity is required.');
            return;
        }

        setForecastLoading(true);
        setForecastError('');
        setForecastPoints([]);
        setForecastAverage(null);
        setForecastChange(null);

        try {
            const response = await AIService.forecastCommodity(commodity, {
                periods: Number(forecastPeriods) || 30,
                region: forecastRegion.trim() || undefined,
                visual: false,
            });
            const points = parseForecast(response);
            if (!points.length) {
                throw new Error('No forecast data available.');
            }
            const avg = points.reduce((sum, point) => sum + point.value, 0) / points.length;
            const change = points.length > 1 && points[0].value !== 0
                ? (points[points.length - 1].value - points[0].value) / points[0].value
                : null;
            setForecastPoints(points);
            setForecastAverage(avg);
            setForecastChange(change);
        } catch (error) {
            setForecastError(error instanceof Error ? error.message : 'Unable to load forecast.');
        } finally {
            setForecastLoading(false);
        }
    };

    const addDemandEntry = () => {
        setDemandEntries((prev) => [...prev, { id: `${entryId.current++}`, value: '' }]);
    };

    const removeDemandEntry = (id: string) => {
        setDemandEntries((prev) => (prev.length > 1 ? prev.filter((entry) => entry.id !== id) : prev));
    };

    const updateDemandEntry = (id: string, value: string) => {
        setDemandEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, value } : entry)));
    };

    const fetchDemandSupply = async () => {
        const region = demandRegion.trim();
        if (!region) {
            setDemandError('Region is required.');
            return;
        }

        const commodities = demandEntries
            .map((entry) => entry.value.trim())
            .filter((value) => value.length > 0);

        if (!commodities.length) {
            setDemandError('Add at least one commodity.');
            return;
        }

        setDemandLoading(true);
        setDemandError('');
        setDemandSeries([]);

        try {
            const response = await AIService.demandSupplyForecast({
                region,
                periods: Number(demandPeriods) || 6,
                commodities,
            });
            const series = parseDemandSupplySeries(response);
            if (!series.length) {
                throw new Error('No forecast data returned.');
            }
            setDemandSeries(series);
        } catch (error) {
            setDemandError(error instanceof Error ? error.message : 'Unable to load demand and supply.');
        } finally {
            setDemandLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        const region = recRegion.trim();
        if (!region) {
            setRecError('Region is required.');
            return;
        }

        const budget = Number(recBudget);
        if (!Number.isFinite(budget) || budget <= 0) {
            setRecError('Enter a valid budget.');
            return;
        }

        setRecLoading(true);
        setRecError('');
        setRecSeasonLabel('');
        setRecItems([]);

        try {
            const response = await AIService.prescriptiveRecommendations({
                region,
                season: recSeason.trim() || null,
                month: recMonth,
                budget_usd: budget,
            });
            const parsed = parseRecommendations(response);
            if (!parsed.recommendations.length) {
                throw new Error('No recommendations available.');
            }
            setRecSeasonLabel(parsed.seasonLabel);
            setRecItems(parsed.recommendations);
        } catch (error) {
            setRecError(error instanceof Error ? error.message : 'Unable to load recommendations.');
        } finally {
            setRecLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadHeatmap = async () => {
            setHeatmapLoading(true);
            setHeatmapError('');
            try {
                const points = await SupplyHeatmapService.fetchSupplyHeatmap(selectedCrop);
                if (!cancelled) {
                    setHeatmapPoints(points);
                }
            } catch (error) {
                if (!cancelled) {
                    setHeatmapError(error instanceof Error ? error.message : 'Failed to load heatmap data.');
                }
            } finally {
                if (!cancelled) {
                    setHeatmapLoading(false);
                }
            }
        };

        void loadHeatmap();
        return () => {
            cancelled = true;
        };
    }, [selectedCrop]);

    const maxHeatWeight = heatmapPoints.reduce(
        (max, point) => Math.max(max, point.normalizedWeight),
        0
    );

    const heatColor = (weight: number) => {
        if (weight <= 0 || maxHeatWeight <= 0) {
            return '#22c55e';
        }
        const intensity = Math.log(weight + 1) / Math.log(maxHeatWeight + 1);
        const hue = (1 - intensity) * 120;
        return `hsl(${hue}, 85%, 50%)`;
    };

    const heatRadius = (weight: number) => {
        if (weight <= 0 || maxHeatWeight <= 0) {
            return 6;
        }
        const intensity = Math.log(weight + 1) / Math.log(maxHeatWeight + 1);
        return 10 + intensity * 18;
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Market Analytics</h1>
                    <p className="text-gray-600 mt-2">
                        Forecasts, demand insights, recommendations, and supply heatmaps aligned with the mobile workflow.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {[
                        ['forecasts', 'Forecasts'],
                        ['demand-supply', 'Demand & Supply'],
                        ['recommendations', 'Recommendations'],
                        ['supply-heatmap', 'Supply Heatmap'],
                    ].map(([key, label]) => (
                        <a
                            key={key}
                            href={`#${key}`}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${activeSection === key
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700'
                                }`}
                        >
                            {label}
                        </a>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <section className="bg-white rounded-lg shadow-md p-6" id="forecasts">
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Forecasts</h2>
                                <p className="text-sm text-gray-500">Run commodity price forecasts by region and period.</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Commodity
                                        <input
                                            value={forecastCommodity}
                                            onChange={(event) => setForecastCommodity(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="e.g. maize"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Periods (Months)
                                        <input
                                            value={forecastPeriods}
                                            onChange={(event) => setForecastPeriods(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="30"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Region (optional)
                                        <input
                                            value={forecastRegion}
                                            onChange={(event) => setForecastRegion(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="Harare"
                                        />
                                    </label>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={fetchForecast}
                                        disabled={forecastLoading}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {forecastLoading ? 'Loading Forecast...' : 'Get Forecast'}
                                    </button>
                                </div>
                            </div>

                            {forecastError && <MessageCard tone="error" message={forecastError} />}

                            {forecastPoints.length > 0 && (
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="rounded-2xl border border-gray-200 p-5">
                                        <p className="text-sm text-gray-500">Average Price</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ${forecastAverage ? forecastAverage.toFixed(4) : '0.0000'}/kg
                                        </p>
                                        <p className="text-sm text-gray-500">Trend</p>
                                        <p className="flex items-center gap-2 text-lg font-semibold text-green-600">
                                            <TrendingUp size={16} />
                                            {forecastChange === null
                                                ? 'N/A'
                                                : `${forecastChange >= 0 ? '+' : ''}${(forecastChange * 100).toFixed(1)}%`}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-5 lg:col-span-2">
                                        <p className="text-sm font-semibold text-gray-700">Forecast Trend</p>
                                        <ForecastChart points={forecastPoints} />
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-5 lg:col-span-3">
                                        <p className="text-sm font-semibold text-gray-700">Upcoming Forecast</p>
                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            {forecastPoints.slice(0, 7).map((point) => (
                                                <div key={point.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                                    <span>{point.date}</span>
                                                    <span className="font-semibold text-green-700">${point.value.toFixed(4)}/kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-md p-6" id="demand-supply">
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Demand & Supply</h2>
                                <p className="text-sm text-gray-500">Model multi-commodity demand and supply movement.</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Region
                                        <input
                                            value={demandRegion}
                                            onChange={(event) => setDemandRegion(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="Harare"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Periods (Months)
                                        <input
                                            value={demandPeriods}
                                            onChange={(event) => setDemandPeriods(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="6"
                                        />
                                    </label>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-700">Commodities</p>
                                        <button
                                            type="button"
                                            onClick={addDemandEntry}
                                            className="text-sm font-semibold text-green-700"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        {demandEntries.map((entry) => (
                                            <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                    <input
                                                        value={entry.value}
                                                        onChange={(event) => updateDemandEntry(entry.id, event.target.value)}
                                                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
                                                        placeholder="Commodity"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDemandEntry(entry.id)}
                                                        disabled={demandEntries.length <= 1}
                                                        className="text-sm font-semibold text-gray-500 disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={fetchDemandSupply}
                                        disabled={demandLoading}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {demandLoading ? 'Generating Forecast...' : 'Generate Forecast'}
                                    </button>
                                </div>
                            </div>

                            {demandError && <MessageCard tone="error" message={demandError} />}

                            {demandSeries.length > 0 && (
                                <div className="space-y-4">
                                    {demandSeries.map((series) => (
                                        <div key={series.commodity} className="rounded-2xl border border-gray-200 p-5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">{series.commodity}</h3>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-green-600" />Demand
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-orange-500" />Supply
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <DualLineChart demand={series.demandValues} supply={series.supplyValues} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-md p-6" id="recommendations">
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
                                <p className="text-sm text-gray-500">Generate seasonal crop recommendations.</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Region
                                        <input
                                            value={recRegion}
                                            onChange={(event) => setRecRegion(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="Harare"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Budget (USD)
                                        <input
                                            value={recBudget}
                                            onChange={(event) => setRecBudget(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="500"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Planting Month
                                        <select
                                            value={recMonth ?? ''}
                                            onChange={(event) => setRecMonth(event.target.value ? Number(event.target.value) : null)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                        >
                                            <option value="">Select month</option>
                                            {monthOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                        Season (optional)
                                        <input
                                            value={recSeason}
                                            onChange={(event) => setRecSeason(event.target.value)}
                                            className="rounded-lg border border-gray-200 px-3 py-2"
                                            placeholder="Rainy"
                                        />
                                    </label>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={fetchRecommendations}
                                        disabled={recLoading}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {recLoading ? 'Loading Recommendations...' : 'Get Recommendations'}
                                    </button>
                                </div>
                            </div>

                            {recError && <MessageCard tone="error" message={recError} />}

                            {!!recSeasonLabel && !recError && (
                                <MessageCard tone="info" message={`Season: ${recSeasonLabel}`} />
                            )}

                            {recItems.length > 0 && (
                                <div className="grid gap-4">
                                    {recItems.map((rec) => (
                                        <div key={`${rec.commodity}-${rec.score}`} className="rounded-2xl border border-gray-200 p-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{rec.commodity}</h3>
                                                <span className="text-sm font-semibold text-green-700">Score {rec.score.toFixed(2)}</span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${rec.climateFit ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                                                    {rec.climateFit ? 'Climate fit' : 'Climate risk'}
                                                </span>
                                                {Number.isFinite(rec.estimatedCostUsd) && rec.estimatedCostUsd !== undefined && (
                                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                        Cost USD {rec.estimatedCostUsd.toFixed(0)}/ha
                                                    </span>
                                                )}
                                                {rec.plantingMonths.length > 0 && (
                                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                                                        Planting {rec.plantingMonths.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                            {rec.marketTargets.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-semibold text-gray-700">Top Markets</p>
                                                    <div className="mt-2 space-y-2">
                                                        {rec.marketTargets.map((market) => (
                                                            <div key={`${rec.commodity}-${market.name}`} className="flex items-center justify-between text-sm">
                                                                <span>{market.name}</span>
                                                                <span className="font-semibold text-green-700">
                                                                    {Number.isFinite(market.avgPrice) ? market.avgPrice?.toFixed(2) : '-'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-md p-6" id="supply-heatmap">
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Supply Heatmap</h2>
                                <p className="text-sm text-gray-500">Select a crop to visualize supply intensity.</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                    Select Crop
                                    <select
                                        value={selectedCrop}
                                        onChange={(event) => setSelectedCrop(event.target.value)}
                                        className="rounded-lg border border-gray-200 px-3 py-2"
                                    >
                                        {cropOptions.map((crop) => (
                                            <option key={crop} value={crop}>
                                                {crop}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
                                <MapContainer center={zimbabweCenter} zoom={6.5} className="h-96 w-full">
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        subdomains={['a', 'b', 'c']}
                                        attribution="&copy; OpenStreetMap contributors"
                                    />
                                    {heatmapPoints.map((point, index) => {
                                        const color = heatColor(point.normalizedWeight);
                                        return (
                                            <CircleMarker
                                                key={`${point.latitude}-${point.longitude}-${index}`}
                                                center={[point.latitude, point.longitude]}
                                                radius={heatRadius(point.normalizedWeight)}
                                                pathOptions={{
                                                    color,
                                                    fillColor: color,
                                                    fillOpacity: 0.7,
                                                    weight: 0,
                                                }}
                                            />
                                        );
                                    })}
                                </MapContainer>
                                {heatmapLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
                                        Loading heatmap...
                                    </div>
                                )}
                                {heatmapError && !heatmapLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 text-center text-sm text-white">
                                        {heatmapError}
                                    </div>
                                )}
                                <div className="absolute bottom-4 right-4 rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs text-white">
                                    <p className="font-semibold">Supply Intensity</p>
                                    <div className="mt-2 h-2 w-32 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" />
                                    <div className="mt-2 flex justify-between text-[10px] text-white/70">
                                        <span>Lower</span>
                                        <span>Log Scale</span>
                                        <span>Higher</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
};
