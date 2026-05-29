import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, RefreshCw } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SubscriptionService } from '../services';
import type { ProduceSubscription } from '../types';

export const SubscriptionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<ProduceSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState('');

    const loadSubscription = useCallback(async () => {
        if (!id) {
            setError('Missing subscription id.');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const data = await SubscriptionService.getSubscription(id);
            setSubscription(data);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to load subscription.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void loadSubscription();
    }, [loadSubscription]);

    const runAction = async (action: () => Promise<ProduceSubscription>, label: string) => {
        try {
            setIsMutating(true);
            setError('');
            const updated = await action();
            setSubscription(updated);
            window.alert(`Subscription ${label}.`);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Action failed.');
        } finally {
            setIsMutating(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                    Loading subscription...
                </div>
            </Layout>
        );
    }

    if (!subscription) {
        return (
            <Layout>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    {error || 'Subscription not found.'}
                </div>
            </Layout>
        );
    }

    const status = subscription.status.toLowerCase();

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Subscription #{subscription.id.slice(0, 8)}
                        </h1>
                        <p className="text-gray-600">Manage subscription details and actions.</p>
                    </div>
                    <button
                        onClick={() => void loadSubscription()}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                        <DetailRow label="Buyer" value={subscription.buyerName || subscription.buyerId} />
                        <DetailRow label="Farmer" value={subscription.farmerName || subscription.farmerId} />
                        <DetailRow label="Frequency" value={subscription.frequency} />
                        <DetailRow label="Currency" value={subscription.currency || 'USD'} />
                        <DetailRow
                            label="Start date"
                            value={new Date(subscription.startDate).toLocaleString()}
                            icon={<Calendar size={14} className="text-gray-400" />}
                        />
                        <DetailRow
                            label="Next delivery"
                            value={new Date(subscription.nextDeliveryDate).toLocaleString()}
                            icon={<Calendar size={14} className="text-gray-400" />}
                        />
                        <DetailRow
                            label="Logistics"
                            value={subscription.requiresLogistics ? 'Required' : 'Pickup'}
                        />
                        {!subscription.requiresLogistics && (
                            <DetailRow label="Pickup address" value={subscription.pickupAddress || '-'} />
                        )}
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                        {subscription.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                <span>{item.produceName || `Produce #${item.produceId}`}</span>
                                <span>
                                    {item.quantity} x {subscription.currency} {item.unitPrice.toFixed(2)}
                                </span>
                            </div>
                        ))}
                        <div className="mt-3 flex justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800">
                            <span>Total</span>
                            <span>
                                {subscription.currency} {subscription.totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate(`/subscriptions/${subscription.id}/edit`, { state: { subscription } })}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                    >
                        Edit
                    </button>
                    {status === 'active' && (
                        <button
                            onClick={() =>
                                void runAction(() => SubscriptionService.pauseSubscription(subscription.id), 'paused')
                            }
                            disabled={isMutating}
                            className="rounded-lg bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700"
                        >
                            Pause
                        </button>
                    )}
                    {status === 'paused' && (
                        <button
                            onClick={() =>
                                void runAction(() => SubscriptionService.resumeSubscription(subscription.id), 'resumed')
                            }
                            disabled={isMutating}
                            className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
                        >
                            Resume
                        </button>
                    )}
                    {status !== 'cancelled' && (
                        <button
                            onClick={() =>
                                void runAction(() => SubscriptionService.cancelSubscription(subscription.id), 'cancelled')
                            }
                            disabled={isMutating}
                            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() =>
                            void runAction(() => SubscriptionService.processSubscription(subscription.id), 'processed')
                        }
                        disabled={isMutating}
                        className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                    >
                        Process cycle
                    </button>
                </div>
            </div>
        </Layout>
    );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({
    label,
    value,
    icon,
}) => (
    <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span className="text-gray-500">{label}</span>
        <span className="flex items-center gap-2 font-medium text-gray-900">
            {icon}
            {value}
        </span>
    </div>
);
