import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LogisticsService } from '../services';
import type { LogisticsRequest } from '../types';
import { ArrowRight, CheckCircle, Clock, MapPin, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LogisticsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LogisticsRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const loadRequests = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await LogisticsService.getLogisticsRequests(statusFilter || undefined);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to load logistics requests:', error);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await LogisticsService.acceptRequest(requestId);
            await loadRequests();
            alert('Request accepted successfully');
        } catch {
            alert('Failed to accept request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await LogisticsService.rejectRequest(requestId);
            await loadRequests();
            alert('Request rejected');
        } catch {
            alert('Failed to reject request');
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Logistics Requests</h1>
                        <p className="text-gray-600 mt-2">Manage delivery requests</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Pending"
                        value={requests.filter((r) => r.status === 'pending').length}
                        icon={<Clock size={24} />}
                        color="yellow"
                    />
                    <StatCard
                        title="Accepted"
                        value={requests.filter((r) => r.status === 'accepted').length}
                        icon={<CheckCircle size={24} />}
                        color="blue"
                    />
                    <StatCard
                        title="In Transit"
                        value={requests.filter((r) => r.status === 'in_transit').length}
                        icon={<TrendingUp size={24} />}
                        color="green"
                    />
                    <StatCard
                        title="Completed"
                        value={requests.filter((r) => r.status === 'delivered').length}
                        icon={<CheckCircle size={24} />}
                        color="purple"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 flex space-x-4">
                    {['', 'pending', 'accepted', 'in_transit', 'delivered'].map((status) => (
                        <button
                            key={status || 'all'}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status ? status.replace('_', ' ').toUpperCase() : 'ALL'}
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No requests found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">From</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">To</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Distance</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fee</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {requests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.id.slice(0, 8)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-start space-x-2">
                                                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                                                    <span>{request.originLocation.address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-start space-x-2">
                                                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                                                    <span>{request.destinationLocation.address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{request.estimatedDistance} km</td>
                                            <td className="px-6 py-4 text-sm font-medium text-green-600">${request.fee.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${request.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : request.status === 'accepted'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : request.status === 'in_transit'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm space-x-2 flex">
                                                <button
                                                    onClick={() => navigate(`/logistics/${request.id}`)}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                                                >
                                                    View
                                                    <ArrowRight size={12} />
                                                </button>
                                                {user?.role === 'logistics' && request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptRequest(request.id)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(request.id)}
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {user?.role === 'logistics' && request.status === 'accepted' && (
                                                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                                                        In Transit
                                                    </button>
                                                )}
                                                {user?.role === 'logistics' && request.status === 'in_transit' && (
                                                    <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                                                        Mark Delivered
                                                    </button>
                                                )}
                                                {(user?.role !== 'logistics' || request.status === 'delivered') && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                        {request.status === 'delivered' ? 'Completed' : 'Tracking only'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, color }) => {
    const colors = {
        yellow: 'bg-yellow-50 text-yellow-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
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
