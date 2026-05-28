import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { AIService, OrderService, PaymentService, ProductService } from '../services';
import type { Produce } from '../types';
import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recentProduce, setRecentProduce] = useState<Produce[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ activeListings: 0, totalSales: 0, trustScore: 0, balance: 0 });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                const [produce, trustScore] = await Promise.all([
                    ProductService.getAllProduce(1, 5),
                    user?.id ? AIService.getTrustScore(user.id) : Promise.resolve(0),
                ]);

                setRecentProduce(produce.data);

                const balance = user ? user.usdBalance + user.zigBalance : 0;
                const activeListings =
                    user?.role === 'farmer' && user.id ? (await ProductService.getFarmerProduce(user.id)).length : produce.total;
                const totalSales =
                    user?.role === 'buyer'
                        ? (await OrderService.getBuyerOrders()).length
                        : user?.role === 'farmer'
                            ? (await OrderService.getFarmerOrders()).length
                            : (await PaymentService.getPaymentHistory()).total;

                setStats({
                    activeListings,
                    totalSales,
                    trustScore: trustScore || user?.trustScore || 0,
                    balance,
                });
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadDashboardData();
    }, [user]);

    return (
        <Layout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
                    <p className="text-green-100">
                        {user?.role === 'farmer'
                            ? 'Manage your crops, track sales, and connect with buyers'
                            : user?.role === 'buyer'
                                ? 'Discover fresh produce and manage your purchases'
                                : 'Track logistics requests and manage deliveries'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Active Listings"
                        value={stats.activeListings}
                        icon={<Package size={24} />}
                        color="blue"
                    />
                    <StatCard
                        title="Total Sales"
                        value={stats.totalSales}
                        icon={<DollarSign size={24} />}
                        color="green"
                    />
                    <StatCard
                        title="Trust Score"
                        value={`${stats.trustScore}/5`}
                        icon={<TrendingUp size={24} />}
                        color="purple"
                    />
                    <StatCard
                        title="Balance"
                        value={`$${stats.balance.toFixed(2)}`}
                        icon={<Users size={24} />}
                        color="orange"
                    />
                </div>

                {/* Recent Products */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Produce</h2>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : recentProduce.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No produce found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentProduce.map((produce) => (
                                <div key={produce.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                    <div className="bg-gray-100 h-32 rounded-lg mb-3 flex items-center justify-center">
                                        <span className="text-4xl">🥬</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{produce.name}</h3>
                                    <p className="text-sm text-gray-600">{produce.category}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="font-bold text-green-600">${produce.unitPrice.toFixed(2)}</span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{produce.grade}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {user?.role === 'farmer' && (
                            <>
                                <QuickActionButton title="Create Listing" description="Add new produce" onClick={() => navigate('/sell')} />
                                <QuickActionButton title="View Orders" description="Manage your orders" onClick={() => navigate('/orders')} />
                                <QuickActionButton title="Analytics" description="Market insights" onClick={() => navigate('/analytics')} />
                            </>
                        )}
                        {user?.role === 'buyer' && (
                            <>
                                <QuickActionButton title="Browse Produce" description="Find fresh items" onClick={() => navigate('/buy')} />
                                <QuickActionButton title="My Orders" description="View purchases" onClick={() => navigate('/orders')} />
                                <QuickActionButton title="Subscriptions" description="Manage subscriptions" onClick={() => navigate('/subscriptions')} />
                            </>
                        )}
                        {user?.role === 'logistics' && (
                            <>
                                <QuickActionButton title="New Requests" description="Available deliveries" onClick={() => navigate('/logistics')} />
                                <QuickActionButton title="In Progress" description="Active deliveries" onClick={() => navigate('/logistics')} />
                                <QuickActionButton title="Supply Map" description="Regional demand map" onClick={() => navigate('/supply-map')} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className={`w-12 h-12 rounded-lg ${colors[color as keyof typeof colors]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
};

const QuickActionButton: React.FC<{ title: string; description: string; onClick?: () => void }> = ({
    title,
    description,
    onClick,
}) => (
    <button
        onClick={onClick}
        className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
    >
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
    </button>
);
