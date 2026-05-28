import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { OrderService } from '../services';
import type { Order } from '../types';

const formatStatus = (status: string) => status.replace(/_/g, ' ');

export const OrdersPage: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');

            if (user?.role === 'farmer') {
                setOrders(await OrderService.getFarmerOrders());
            } else {
                setOrders(await OrderService.getBuyerOrders());
            }
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to load orders.');
        } finally {
            setIsLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const runOrderAction = async (orderId: string, action: () => Promise<unknown>) => {
        try {
            setUpdatingOrderId(orderId);
            await action();
            await loadOrders();
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to update the order.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        {user?.role === 'farmer' ? 'My Orders' : 'Purchase Orders'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {user?.role === 'farmer'
                            ? 'Review incoming orders and respond to buyers.'
                            : 'Track your recent marketplace purchases.'}
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No orders found.</div>
                    ) : (
                        <div className="divide-y">
                            {orders.map((order) => {
                                const isUpdating = updatingOrderId === order.id;

                                return (
                                    <div key={order.id} className="p-6 space-y-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    Order #{order.id.slice(0, 8)}
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                                                    {formatStatus(order.status)}
                                                </span>
                                                <span className="text-lg font-bold text-green-700">
                                                    ${order.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid gap-2 text-sm text-gray-700">
                                            {order.items.map((item) => (
                                                <div key={`${order.id}-${item.produceId}`} className="flex justify-between gap-4">
                                                    <span>{item.produceName}</span>
                                                    <span>
                                                        {item.quantity} x ${item.unitPrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {user?.role === 'farmer' && order.status === 'pending' && (
                                                <>
                                                    <button
                                                        disabled={isUpdating}
                                                        onClick={() =>
                                                            runOrderAction(order.id, () => OrderService.acceptOrder(order.id))
                                                        }
                                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        disabled={isUpdating}
                                                        onClick={() =>
                                                            runOrderAction(order.id, () =>
                                                                OrderService.updateOrderStatus(order.id, 'cancelled')
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:bg-gray-100"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {user?.role === 'buyer' && order.status === 'in_transit' && (
                                                <button
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        runOrderAction(order.id, () => OrderService.confirmDelivery(order.id))
                                                    }
                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                                                >
                                                    Confirm Delivery
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
