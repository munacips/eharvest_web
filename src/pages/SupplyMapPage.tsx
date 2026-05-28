import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LogisticsService } from '../services';
import type { SupplyPoint } from '../types';
import { MapPin } from 'lucide-react';

export const SupplyMapPage: React.FC = () => {
    const [points, setPoints] = useState<SupplyPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPoints = async () => {
            try {
                setIsLoading(true);
                setError('');
                setPoints(await LogisticsService.getSupplyMap());
            } catch (err: unknown) {
                const apiError = err as { response?: { data?: { message?: string } } };
                setError(apiError.response?.data?.message || 'Failed to load supply map data.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadPoints();
    }, []);

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Supply Heatmap</h1>
                    <p className="text-gray-600 mt-2">
                        Nearby supply points for logistics coordination and sourcing.
                    </p>
                </div>

                <div className="rounded-2xl border border-dashed border-green-200 bg-gradient-to-br from-green-50 to-white p-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {isLoading ? (
                            <p className="text-gray-500">Loading supply locations...</p>
                        ) : error ? (
                            <p className="text-red-600">{error}</p>
                        ) : points.length === 0 ? (
                            <p className="text-gray-500">No supply points available right now.</p>
                        ) : (
                            points.map((point) => (
                                <div key={point.id} className="rounded-xl bg-white p-5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-green-100 p-2 text-green-700">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-900">{point.farmerName}</h2>
                                            <p className="text-sm text-gray-500">
                                                {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm text-gray-500">Trust score</p>
                                        <p className="font-medium text-gray-900">{point.trustScore}</p>
                                        <p className="text-sm text-gray-500">Available produce</p>
                                        <div className="flex flex-wrap gap-2">
                                            {point.availableProduce.map((produce) => (
                                                <span
                                                    key={`${point.id}-${produce.id}`}
                                                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                                                >
                                                    {produce.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
