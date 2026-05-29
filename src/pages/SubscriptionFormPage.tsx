import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ProductService, SubscriptionService } from '../services';
import type { Produce, ProduceSubscription, SubscriptionFrequency } from '../types';

interface DraftItem {
    id: string;
    produceId: string;
    produceName: string;
    quantity: number;
    unitPrice: number;
    farmerId?: string;
}

const formatDate = (value: Date) => value.toISOString().split('T')[0];
const formatTime = (value: Date) => value.toTimeString().slice(0, 5);

export const SubscriptionFormPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const subscription = (location.state as { subscription?: ProduceSubscription } | null)?.subscription ?? null;
    const [produceList, setProduceList] = useState<Produce[]>([]);
    const [items, setItems] = useState<DraftItem[]>([]);
    const [frequency, setFrequency] = useState<SubscriptionFrequency>(subscription?.frequency || 'weekly');
    const [currency, setCurrency] = useState<'USD' | 'ZIG'>((subscription?.currency as 'USD' | 'ZIG') || 'USD');
    const [requiresLogistics, setRequiresLogistics] = useState(subscription?.requiresLogistics ?? true);
    const [pickupAddress, setPickupAddress] = useState(subscription?.pickupAddress || '');
    const initialDate = subscription?.startDate ? new Date(subscription.startDate) : new Date();
    const [startDate, setStartDate] = useState(formatDate(initialDate));
    const [startTime, setStartTime] = useState(formatTime(initialDate));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProduce = async () => {
            try {
                const response = await ProductService.getAllProduce(1, 200);
                setProduceList(response.data);
            } catch {
                setProduceList([]);
            }
        };

        void loadProduce();
    }, []);

    useEffect(() => {
        if (!subscription) {
            setItems([
                {
                    id: crypto.randomUUID(),
                    produceId: '',
                    produceName: '',
                    quantity: 1,
                    unitPrice: 0,
                },
            ]);
            return;
        }

        setItems(
            subscription.items.map((item) => ({
                id: crypto.randomUUID(),
                produceId: item.produceId,
                produceName: item.produceName || `Produce #${item.produceId}`,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            }))
        );
    }, [subscription]);

    const selectedFarmerId = useMemo(() => {
        const match = items.find((item) => item.farmerId);
        return match?.farmerId || subscription?.farmerId;
    }, [items, subscription?.farmerId]);

    const filteredProduce = useMemo(() => {
        if (!selectedFarmerId) return produceList;
        return produceList.filter((item) => item.farmerId === selectedFarmerId);
    }, [produceList, selectedFarmerId]);

    const total = useMemo(() =>
        items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]
    );

    const updateItem = (id: string, patch: Partial<DraftItem>) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const handleProduceChange = (id: string, produceId: string) => {
        const produce = produceList.find((item) => item.id === produceId);
        updateItem(id, {
            produceId,
            produceName: produce?.name || `Produce #${produceId}`,
            unitPrice: produce?.unitPrice ?? 0,
            farmerId: produce?.farmerId,
        });
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                produceId: '',
                produceName: '',
                quantity: 1,
                unitPrice: 0,
            },
        ]);
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSubmit = async () => {
        setError('');
        if (!items.length || items.some((item) => !item.produceId || item.quantity <= 0)) {
            setError('Add at least one valid item to continue.');
            return;
        }

        const farmerId = selectedFarmerId || items[0]?.farmerId;
        if (!farmerId) {
            setError('Please choose produce tied to a farmer.');
            return;
        }

        if (!requiresLogistics && !pickupAddress.trim()) {
            setError('Pickup address is required when logistics are not needed.');
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                farmerId,
                frequency: frequency === 'bi-weekly' ? 'BIWEEKLY' : frequency.toUpperCase(),
                currency,
                requiresLogistics,
                pickupAddress: requiresLogistics ? null : pickupAddress.trim(),
                startDate: new Date(`${startDate}T${startTime}:00`).toISOString(),
                items: items.map((item) => ({
                    produceId: item.produceId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            };

            if (subscription) {
                await SubscriptionService.updateSubscription(subscription.id, payload);
            } else {
                await SubscriptionService.createSubscription(payload);
            }

            navigate('/subscriptions', { state: { refreshed: true } });
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to save subscription.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {subscription ? 'Edit Subscription' : 'Create Subscription'}
                    </h1>
                    <p className="mt-1 text-gray-600">Configure recurring deliveries and payment terms.</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(event) => setFrequency(event.target.value as SubscriptionFrequency)}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="bi-weekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Currency</label>
                            <select
                                value={currency}
                                onChange={(event) => setCurrency(event.target.value as 'USD' | 'ZIG')}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                                <option value="USD">USD</option>
                                <option value="ZIG">ZIG</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Start date</label>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Start time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(event) => setStartTime(event.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Requires logistics</p>
                            <p className="text-xs text-gray-600">Toggle off for buyer pickup.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={requiresLogistics}
                            onChange={(event) => setRequiresLogistics(event.target.checked)}
                            className="h-5 w-5 accent-green-600"
                        />
                    </div>

                    {!requiresLogistics && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Pickup address</label>
                            <input
                                type="text"
                                value={pickupAddress}
                                onChange={(event) => setPickupAddress(event.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                                placeholder="Enter pickup location"
                            />
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                        <button
                            onClick={addItem}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
                        >
                            <Plus size={16} />
                            Add item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Produce</label>
                                        <select
                                            value={item.produceId}
                                            onChange={(event) => handleProduceChange(item.id, event.target.value)}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                                        >
                                            <option value="">Select produce</option>
                                            {filteredProduce.map((produce) => (
                                                <option key={produce.id} value={produce.id}>
                                                    {produce.name} ({produce.category})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Quantity</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Unit price</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                            className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">Subscription total</span>
                        <span className="text-lg font-bold text-green-700">
                            {currency} {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/subscriptions')}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                        className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Saving...' : subscription ? 'Save changes' : 'Create subscription'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};
