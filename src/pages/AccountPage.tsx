import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import {
    BadgeCheck,
    Building2,
    Edit2,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Save,
    Star,
    Truck,
    Wallet,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { AIService, AuthService, LogisticsService, OrderService, PaymentService, ReviewService } from '../services';
import type { LogisticsRequest, Order, Payment, Review } from '../types';

interface AccountForm {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
}

export const AccountPage: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [accountLoading, setAccountLoading] = useState(true);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [aiTrustScore, setAiTrustScore] = useState<number | null>(null);
    const [roleOrders, setRoleOrders] = useState<Order[]>([]);
    const [presentDeliveries, setPresentDeliveries] = useState<LogisticsRequest[]>([]);
    const [pastDeliveries, setPastDeliveries] = useState<LogisticsRequest[]>([]);
    const [pendingLogisticsRequests, setPendingLogisticsRequests] = useState(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [buyerOrdersExpanded, setBuyerOrdersExpanded] = useState(false);
    const [deliveriesExpanded, setDeliveriesExpanded] = useState(false);
    const [reviewsExpanded, setReviewsExpanded] = useState(false);

    const { register, handleSubmit, reset } = useForm<AccountForm>();

    useEffect(() => {
        reset({
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            email: user?.email ?? '',
            phoneNumber: user?.phoneNumber ?? '',
            address: user?.address ?? '',
        });
    }, [reset, user]);

    useEffect(() => {
        if (!user?.id) {
            setAccountLoading(false);
            return;
        }

        let cancelled = false;

        const loadAccountData = async () => {
            setAccountLoading(true);
            setAccountError(null);

            try {
                const [trustScore, reviewsResponse, paymentResponse, ordersResponse, logisticsResponse] = await Promise.all([
                    AIService.getTrustScore(user.id).catch(() => null),
                    ReviewService.getReviewsForUser(user.id).catch(() => [] as Review[]),
                    PaymentService.getPaymentHistory().catch(() => ({ data: [] as Payment[], total: 0 })),
                    user.role === 'buyer'
                        ? OrderService.getBuyerOrders()
                        : user.role === 'farmer'
                            ? OrderService.getFarmerOrders()
                            : Promise.resolve([] as Order[]),
                    user.role === 'logistics'
                        ? LogisticsService.getLogisticsRequests().catch(() => ({ data: [] as LogisticsRequest[], total: 0 }))
                        : Promise.resolve({ data: [] as LogisticsRequest[], total: 0 }),
                ]);

                if (cancelled) {
                    return;
                }

                setAiTrustScore(typeof trustScore === 'number' ? trustScore : null);
                setReviews(reviewsResponse);
                setPaymentHistory(paymentResponse.data);
                setRoleOrders(ordersResponse);

                if (user.role === 'logistics') {
                    const assignedRequests = logisticsResponse.data.filter(
                        (request) => request.assignedProviderId === user.id,
                    );
                    setPresentDeliveries(
                        assignedRequests.filter((request) =>
                            ['accepted', 'assigned', 'in_transit'].includes(request.status),
                        ),
                    );
                    setPastDeliveries(
                        assignedRequests.filter((request) =>
                            ['delivered', 'cancelled'].includes(request.status),
                        ),
                    );
                    setPendingLogisticsRequests(
                        logisticsResponse.data.filter((request) => request.status === 'pending').length,
                    );
                } else {
                    setPresentDeliveries([]);
                    setPastDeliveries([]);
                    setPendingLogisticsRequests(0);
                }
            } catch (error) {
                if (!cancelled) {
                    setAccountError(error instanceof Error ? error.message : 'Failed to load account data.');
                }
            } finally {
                if (!cancelled) {
                    setAccountLoading(false);
                }
            }
        };

        void loadAccountData();

        return () => {
            cancelled = true;
        };
    }, [user?.id, user?.role]);

    const onSubmit = async (data: AccountForm) => {
        try {
            const updatedUser = await AuthService.updateProfile(data);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            await refreshUser();
            setIsEditing(false);
            alert('Profile updated successfully');
        } catch {
            alert('Failed to update profile');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Account';
    const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.trim() || '?';
    const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '-';
    const trustScore = user?.trustScore ?? 0;
    const reviewAverage = reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    const visibleBuyerOrders = buyerOrdersExpanded ? roleOrders : roleOrders.slice(0, 5);
    const visiblePresentDeliveries = deliveriesExpanded ? presentDeliveries : presentDeliveries.slice(0, 3);
    const visiblePastDeliveries = deliveriesExpanded ? pastDeliveries : pastDeliveries.slice(0, 3);
    const visibleReviews = reviewsExpanded ? reviews : reviews.slice(0, 3);

    const personalInfoItems = [
        { label: 'National ID', value: user?.nationalId },
        { label: 'Username', value: user?.username },
        { label: 'Email', value: user?.email },
        { label: 'Phone Number', value: user?.phoneNumber },
        { label: 'Address', value: user?.address },
    ];

    const businessInfoItems = user?.role === 'farmer'
        ? [
            { label: 'Farm Name', value: user.farmName },
            { label: 'Farm Location', value: user.farmLocation },
            { label: 'Crop Types', value: user.cropTypes?.join(', ') },
            { label: 'Successful Sales', value: user.successfulSales },
            { label: 'Unsuccessful Sales', value: user.unsuccessfulSales },
        ]
        : user?.role === 'buyer'
            ? [
                { label: 'Company Name', value: user.companyName },
                { label: 'Successful Buys', value: user.successfulBuys },
                { label: 'Unsuccessful Buys', value: user.unsuccessfulBuys },
            ]
            : user?.role === 'logistics'
                ? [
                    { label: 'Company Name', value: user.companyName },
                    { label: 'Vehicle Types', value: user.vehicleTypes?.join(', ') },
                    { label: 'License Number', value: user.licenseNumber },
                    { label: 'Defensive ID', value: user.defensiveId },
                ]
                : [];

    return (
        <Layout>
            <div className="space-y-8">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-lime-600 text-white shadow-xl">
                    <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:items-end">
                        <div className="space-y-5">
                            <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
                                Account overview
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/15 text-3xl font-bold">
                                    {initials}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold sm:text-4xl">{fullName}</h1>
                                    <p className="mt-1 text-white/80">@{user?.username ?? 'unknown'}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm font-medium">
                                <span className="rounded-full bg-white/15 px-4 py-2 capitalize">{roleLabel}</span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                                    <BadgeCheck size={16} />
                                    {user?.verified ? 'Verified account' : 'Verification pending'}
                                </span>
                                <span className="rounded-full bg-white/15 px-4 py-2">
                                    Trust score {trustScore}/100
                                </span>
                                <span className="rounded-full bg-white/15 px-4 py-2">
                                    Balance ${((user?.usdBalance ?? 0) + (user?.zigBalance ?? 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                                <p className="text-sm text-white/75">System trust score</p>
                                <div className="mt-3 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-bold">{trustScore}</p>
                                        <p className="text-sm text-white/75">out of 100</p>
                                    </div>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold">
                                        {Math.round(trustScore)}%
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                                <p className="text-sm text-white/75">AI trust score</p>
                                <div className="mt-3 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-bold">
                                            {aiTrustScore === null ? 'N/A' : aiTrustScore.toFixed(0)}
                                        </p>
                                        <p className="text-sm text-white/75">
                                            {aiTrustScore === null ? 'Not fetched yet' : 'AI verification signal'}
                                        </p>
                                    </div>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold">
                                        <Star size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {accountError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        {accountError}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Profile Summary</h2>
                                    <p className="mt-1 text-sm text-gray-600">Core account information and status</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-100"
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <SummaryCard title="Trust Score" value={`${trustScore}/100`} subtitle={aiTrustScore !== null ? `AI score ${aiTrustScore.toFixed(0)}` : 'AI score unavailable'} />
                                <SummaryCard title="Verified" value={user?.verified ? 'Yes' : 'No'} subtitle={user?.verified ? 'Identity confirmed' : 'Verification pending'} />
                                <SummaryCard title="USD Balance" value={`$${(user?.usdBalance ?? 0).toFixed(2)}`} subtitle="Wallet balance" />
                                <SummaryCard title="ZIG Balance" value={`${(user?.zigBalance ?? 0).toFixed(2)} ZIG`} subtitle="Wallet balance" />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {reviews.length ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} received` : 'No reviews yet'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReviewsExpanded((value) => !value)}
                                    className="rounded-xl bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-100"
                                >
                                    {reviewsExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <SummaryCard title="Average rating" value={reviews.length ? reviewAverage.toFixed(1) : 'N/A'} subtitle="Public feedback" />
                                <SummaryCard title="Review count" value={String(reviews.length)} subtitle="Total reviews" />
                                <SummaryCard title="Latest signal" value={aiTrustScore === null ? 'N/A' : aiTrustScore.toFixed(0)} subtitle="AI trust score" />
                            </div>

                            <div className="mt-6 space-y-3">
                                {accountLoading ? (
                                    <p className="text-sm text-gray-500">Loading reviews...</p>
                                ) : visibleReviews.length === 0 ? (
                                    <p className="text-sm text-gray-500">No reviews found.</p>
                                ) : (
                                    visibleReviews.map((review) => (
                                        <div key={review.id} className="rounded-2xl border border-gray-200 p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{review.reviewerName}</p>
                                                    <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                                                </div>
                                                <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700">
                                                    <Star size={14} />
                                                    {review.rating.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {user?.role === 'farmer' ? 'Pending Orders' : user?.role === 'buyer' ? 'My Orders' : 'Orders'}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {user?.role === 'farmer'
                                            ? 'Orders waiting for action'
                                            : user?.role === 'buyer'
                                                ? 'Latest purchases and order history'
                                                : 'Order activity linked to your account'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/orders')}
                                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    Open orders
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <SummaryCard title="Total orders" value={String(roleOrders.length)} subtitle="All fetched orders" />
                                <SummaryCard title="Completed" value={String(roleOrders.filter((order) => order.status === 'delivered').length)} subtitle="Delivered orders" />
                                <SummaryCard title="Pending" value={String(roleOrders.filter((order) => order.status === 'pending').length)} subtitle="Open orders" />
                            </div>

                            {user?.role === 'buyer' && (
                                <div className="mt-6 space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setBuyerOrdersExpanded((value) => !value)}
                                        className="text-sm font-medium text-blue-700 hover:text-blue-800"
                                    >
                                        {buyerOrdersExpanded ? 'Collapse list' : 'Expand list'}
                                    </button>
                                    {accountLoading ? (
                                        <p className="text-sm text-gray-500">Loading orders...</p>
                                    ) : roleOrders.length === 0 ? (
                                        <p className="text-sm text-gray-500">No orders found.</p>
                                    ) : (
                                        <>
                                            {visibleBuyerOrders.map((order) => (
                                                <button
                                                    key={order.id}
                                                    type="button"
                                                    onClick={() => navigate('/orders')}
                                                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-green-200 hover:bg-green-50"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Order #{order.id}</p>
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                                                        <p className="text-sm capitalize text-gray-600">{order.status.replace('_', ' ')}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {!buyerOrdersExpanded && roleOrders.length > 5 && (
                                                <p className="text-sm text-gray-500">+{roleOrders.length - 5} more orders</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {user?.role === 'farmer' && (
                                <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                    <p className="text-sm text-orange-700">
                                        Pending orders: <span className="font-semibold">{roleOrders.filter((order) => order.status === 'pending').length}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {user?.role === 'logistics' && (
                            <div className="rounded-2xl bg-white p-6 shadow-md">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Truck size={20} className="text-green-600" />
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">My Deliveries</h2>
                                            <p className="mt-1 text-sm text-gray-600">Current and past assigned logistics requests</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveriesExpanded((value) => !value)}
                                        className="rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                                    >
                                        {deliveriesExpanded ? 'Collapse' : 'Expand'}
                                    </button>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                    <SummaryCard title="Current requests" value={String(pendingLogisticsRequests)} subtitle="Open logistics requests" />
                                    <SummaryCard title="Present deliveries" value={String(presentDeliveries.length)} subtitle="Active assignments" />
                                    <SummaryCard title="Past deliveries" value={String(pastDeliveries.length)} subtitle="Completed or closed" />
                                </div>

                                <div className="mt-6 space-y-4">
                                    <DeliveryGroup
                                        title="Present deliveries"
                                        deliveries={visiblePresentDeliveries}
                                        emptyText="No present deliveries."
                                        onOpenList={() => navigate('/logistics')}
                                        onOpenItem={(id) => navigate(`/logistics/${id}`)}
                                    />
                                    <DeliveryGroup
                                        title="Past deliveries"
                                        deliveries={visiblePastDeliveries}
                                        emptyText="No past deliveries yet."
                                        onOpenList={() => navigate('/logistics')}
                                        onOpenItem={(id) => navigate(`/logistics/${id}`)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                                    <p className="mt-1 text-sm text-gray-600">Edit your core contact details here</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing((value) => !value)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                                </button>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormField label="First Name" register={register('firstName')} type="text" />
                                        <FormField label="Last Name" register={register('lastName')} type="text" />
                                    </div>
                                    <FormField label="Email" register={register('email')} type="email" />
                                    <FormField label="Phone Number" register={register('phoneNumber')} type="tel" />
                                    <FormField label="Address" register={register('address')} type="text" multiline />
                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700"
                                    >
                                        Save Changes
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <InfoTile icon={<MapPin size={18} />} label="First Name" value={user?.firstName} />
                                        <InfoTile icon={<MapPin size={18} />} label="Last Name" value={user?.lastName} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <InfoTile icon={<Mail size={18} />} label="Email" value={user?.email} />
                                        <InfoTile icon={<Phone size={18} />} label="Phone Number" value={user?.phoneNumber} />
                                    </div>
                                    <InfoTile icon={<MapPin size={18} />} label="Address" value={user?.address} />
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                            <p className="mt-1 text-sm text-gray-600">Identity and contact details from your profile</p>
                            <div className="mt-6 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200">
                                {personalInfoItems.map((item) => (
                                    <InfoRow key={item.label} label={item.label} value={item.value} />
                                ))}
                            </div>
                        </div>

                        {businessInfoItems.length > 0 && (
                            <div className="rounded-2xl bg-white p-6 shadow-md">
                                <div className="flex items-center gap-3">
                                    <Building2 size={20} className="text-green-600" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
                                        <p className="mt-1 text-sm text-gray-600">Role-specific account information</p>
                                    </div>
                                </div>
                                <div className="mt-6 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200">
                                    {businessInfoItems.map((item) => (
                                        <InfoRow key={item.label} label={item.label} value={item.value} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl bg-white p-6 shadow-md">
                            <div className="flex items-center gap-3">
                                <Wallet size={20} className="text-green-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Wallet & Balance</h2>
                                    <p className="mt-1 text-sm text-gray-600">Current wallet balances and payment activity</p>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                                    <p className="text-sm text-gray-600">USD Balance</p>
                                    <p className="mt-2 text-3xl font-bold text-blue-700">${(user?.usdBalance ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                                    <p className="text-sm text-gray-600">ZIG Balance</p>
                                    <p className="mt-2 text-3xl font-bold text-purple-700">{(user?.zigBalance ?? 0).toFixed(2)} ZIG</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent transactions</h3>
                                    <span className="text-sm text-gray-500">{paymentHistory.length} total</span>
                                </div>
                                {accountLoading ? (
                                    <p className="text-sm text-gray-500">Loading transactions...</p>
                                ) : paymentHistory.length === 0 ? (
                                    <p className="text-sm text-gray-500">No payment history found.</p>
                                ) : (
                                    paymentHistory.slice(0, 3).map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">Payment #{payment.id}</p>
                                                <p className="mt-1 text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{payment.currency} {payment.amount.toFixed(2)}</p>
                                                <p className="text-sm capitalize text-gray-600">{payment.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const SummaryCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
}> = ({ title, value, subtitle }) => (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
);

const InfoRow: React.FC<{
    label: string;
    value?: React.ReactNode;
}> = ({ label, value }) => (
    <div className="bg-white px-4 py-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{value ?? '-'}</p>
    </div>
);

const InfoTile: React.FC<{
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
            <div className="rounded-xl bg-green-50 p-2 text-green-700">{icon}</div>
            <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="mt-1 font-semibold text-gray-900">{value ?? '-'}</p>
            </div>
        </div>
    </div>
);

const DeliveryGroup: React.FC<{
    title: string;
    deliveries: LogisticsRequest[];
    emptyText: string;
    onOpenList: () => void;
    onOpenItem: (id: string) => void;
}> = ({ title, deliveries, emptyText, onOpenList, onOpenItem }) => (
    <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <button
                type="button"
                onClick={onOpenList}
                className="text-sm font-medium text-green-700 hover:text-green-800"
            >
                Open logistics list
            </button>
        </div>
        <div className="mt-4 space-y-3">
            {deliveries.length === 0 ? (
                <p className="text-sm text-gray-500">{emptyText}</p>
            ) : (
                deliveries.map((delivery) => (
                    <button
                        key={delivery.id}
                        type="button"
                        onClick={() => onOpenItem(delivery.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-green-200 hover:bg-green-50"
                    >
                        <div>
                            <p className="font-semibold text-gray-900">Delivery #{delivery.id}</p>
                            <p className="mt-1 text-sm text-gray-600">
                                {delivery.originLocation.address || 'Unknown pickup'} → {delivery.destinationLocation.address || 'Unknown delivery'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold capitalize text-gray-900">{delivery.status.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-500">${delivery.fee.toFixed(2)}</p>
                        </div>
                    </button>
                ))
            )}
        </div>
    </div>
);

const FormField: React.FC<{
    label: string;
    register: UseFormRegisterReturn;
    type?: string;
    multiline?: boolean;
}> = ({ label, register, type = 'text', multiline = false }) => (
    <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
        {multiline ? (
            <textarea
                {...register}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
        ) : (
            <input
                {...register}
                type={type}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
        )}
    </div>
);