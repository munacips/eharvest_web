import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, MapPin, RefreshCw, Truck } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { LogisticsService } from '../services';
import type { LogisticsRequest, LogisticsStatus } from '../types';

const normalizeStatus = (status: string): LogisticsStatus =>
    status.trim().toLowerCase().replace(/[\s-]+/g, '_') as LogisticsStatus;

const statusMeta: Record<
    LogisticsStatus,
    { label: string; className: string }
> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Accepted', className: 'bg-blue-100 text-blue-800' },
    assigned: { label: 'Assigned', className: 'bg-indigo-100 text-indigo-800' },
    in_transit: { label: 'In Transit', className: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

const fallbackStatusMeta = {
    label: 'Unknown',
    className: 'bg-slate-100 text-slate-700',
};

export const LogisticsRequestPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState<LogisticsRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRequest = useCallback(async () => {
        if (!id) {
            throw new Error('Missing logistics request id.');
        }

        return LogisticsService.getLogisticsRequest(id);
    }, [id]);

    useEffect(() => {
        let isActive = true;

        const loadRequest = async () => {
            try {
                const response = await fetchRequest();

                if (isActive) {
                    setRequest(response);
                }
            } catch (requestError) {
                if (isActive) {
                    setError(requestError instanceof Error ? requestError.message : 'Failed to load request.');
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void loadRequest();

        return () => {
            isActive = false;
        };
    }, [fetchRequest]);

    const handleReload = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchRequest();
            setRequest(response);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Failed to load request.');
        } finally {
            setIsLoading(false);
        }
    }, [fetchRequest]);

    const runAction = async (
        action: () => Promise<LogisticsRequest>,
        successMessage: string,
    ) => {
        try {
            setActionLoading(true);
            const updated = await action();
            setRequest(updated);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Failed to update request.');
            return;
        } finally {
            setActionLoading(false);
        }

        setError(null);
        window.alert(successMessage);
    };

    const normalizedStatus = normalizeStatus(request?.status ?? 'pending');
    const currentStatusMeta = statusMeta[normalizedStatus] ?? fallbackStatusMeta;
    const isLogisticsUser = user?.role === 'logistics';

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/logistics')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                        >
                            <ArrowLeft size={16} />
                            Back to logistics requests
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Logistics Request {request ? `#${request.id.slice(0, 8)}` : ''}
                            </h1>
                        </div>
                    </div>

                    <button
                        onClick={() => void handleReload()}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {isLoading ? (
                    <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        Loading logistics request...
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                ) : request ? (
                    <div className="space-y-6">
                        <section className="rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-6 text-white shadow-lg">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Truck size={28} />
                                        <h2 className="text-2xl font-bold">Request #{request.id.slice(0, 8)}</h2>
                                    </div>
                                    <p className="mt-2 text-white/80">Order ID: {request.orderId || 'Not linked yet'}</p>
                                </div>

                                <span
                                    className={`rounded-full px-4 py-2 text-sm font-semibold ${currentStatusMeta.className}`}
                                >
                                    {currentStatusMeta.label}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <InfoPill label="Fee" value={`$${request.fee.toFixed(2)}`} icon={<CheckCircle size={16} />} />
                                <InfoPill label="Distance" value={`${request.estimatedDistance} km`} icon={<MapPin size={16} />} />
                                <InfoPill label="Created" value={new Date(request.createdAt).toLocaleString()} icon={<Clock size={16} />} />
                            </div>
                        </section>

                        <section className="grid gap-4 lg:grid-cols-2">
                            <DetailCard label="Pickup location" value={request.originLocation.address} />
                            <DetailCard label="Delivery location" value={request.destinationLocation.address} />
                            <DetailCard label="Assigned provider" value={request.assignedProviderId || 'Not assigned'} />
                            <DetailCard label="Tracking status" value={request.status.replace(/_/g, ' ')} />
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Status actions</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {isLogisticsUser
                                            ? 'Use the available transition for the current request status.'
                                            : 'Only logistics users can change request statuses.'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => void handleReload()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <RefreshCw size={16} />
                                    Reload request
                                </button>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                {isLogisticsUser && normalizedStatus === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => void runAction(() => LogisticsService.acceptRequest(request.id), 'Request accepted successfully.')}
                                            disabled={actionLoading}
                                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Accept request
                                        </button>
                                        <button
                                            onClick={() => void runAction(() => LogisticsService.rejectRequest(request.id), 'Request rejected.')}
                                            disabled={actionLoading}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Reject request
                                        </button>
                                    </>
                                )}

                                {isLogisticsUser && normalizedStatus === 'accepted' && (
                                    <button
                                        onClick={() => void runAction(() => LogisticsService.markInTransit(request.id), 'Request marked as in transit.')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Mark in transit
                                    </button>
                                )}

                                {isLogisticsUser && normalizedStatus === 'in_transit' && (
                                    <button
                                        onClick={() => void runAction(() => LogisticsService.markDelivered(request.id), 'Request marked as delivered.')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Mark delivered
                                    </button>
                                )}

                                {!isLogisticsUser && (
                                    <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                                        Status changes are read-only for your role.
                                    </span>
                                )}
                            </div>
                        </section>
                    </div>
                ) : null}
            </div>
        </Layout>
    );
};

const InfoPill: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
}> = ({ label, value, icon }) => (
    <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-white/80">
            {icon}
            <span>{label}</span>
        </div>
        <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
);

const DetailCard: React.FC<{
    label: string;
    value: string;
}> = ({ label, value }) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
    </div>
);