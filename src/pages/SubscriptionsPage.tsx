import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { SubscriptionService } from '../services';
import type { ProduceSubscription } from '../types';
import { Calendar, Pause, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SubscriptionsPage: React.FC = () => {
    const { user } = useAuth();
    const [subscriptions, setSubscriptions] = useState<ProduceSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSubscriptions = useCallback(async () => {
        try {
            setIsLoading(true);
            const data =
                user?.role === 'farmer'
                    ? await SubscriptionService.getFarmerSubscriptions()
                    : await SubscriptionService.getBuyerSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        void loadSubscriptions();
    }, [loadSubscriptions]);

    const handlePause = async (id: string) => {
        try {
            await SubscriptionService.pauseSubscription(id);
            await loadSubscriptions();
            alert('Subscription paused');
        } catch {
            alert('Failed to pause subscription');
        }
    };

    const handleResume = async (id: string) => {
        try {
            await SubscriptionService.resumeSubscription(id);
            await loadSubscriptions();
            alert('Subscription resumed');
        } catch {
            alert('Failed to resume subscription');
        }
    };

    const handleCancel = async (id: string) => {
        if (confirm('Are you sure you want to cancel this subscription?')) {
            try {
                await SubscriptionService.cancelSubscription(id);
                await loadSubscriptions();
                alert('Subscription cancelled');
            } catch {
                alert('Failed to cancel subscription');
            }
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Subscriptions</h1>
                    <p className="text-gray-600 mt-2">
                        {user?.role === 'farmer'
                            ? 'Review recurring buyer commitments and upcoming deliveries'
                            : 'Manage recurring produce deliveries'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading subscriptions...</div>
                ) : subscriptions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No subscriptions yet</p>
                        <p className="text-gray-400 text-sm mt-2">Create recurring deliveries to support your favorite farms</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Subscription #{sub.id.slice(0, 8)}</h3>
                                        <p className="text-sm text-gray-600 mt-1 capitalize">
                                            {sub.frequency} delivery
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${sub.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : sub.status === 'paused'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {sub.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4 pb-4 border-b">
                                    <div>
                                        <p className="text-sm text-gray-600">Items</p>
                                        <ul className="text-sm mt-1 space-y-1">
                                            {sub.items.map((item, idx) => (
                                                <li key={idx} className="text-gray-900">
                                                    {item.produceName} x {item.quantity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Per Delivery</p>
                                        <p className="text-lg font-bold text-green-600">${sub.totalAmount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Next Delivery</p>
                                        <p className="font-medium text-gray-900">{new Date(sub.nextDeliveryDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {sub.status === 'active' && (
                                        <>
                                            <button
                                                onClick={() => handlePause(sub.id)}
                                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Pause size={16} />
                                                <span>Pause</span>
                                            </button>
                                            <button
                                                onClick={() => handleCancel(sub.id)}
                                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Trash2 size={16} />
                                                <span>Cancel</span>
                                            </button>
                                        </>
                                    )}
                                    {sub.status === 'paused' && (
                                        <button
                                            onClick={() => handleResume(sub.id)}
                                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <RotateCcw size={16} />
                                            <span>Resume</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
