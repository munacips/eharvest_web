import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { PaymentService } from '../services';
import type { Payment } from '../types';

export const PaymentReturnPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<Payment | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const reference = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('reference') || params.get('transactionId') || '';
    }, [location.search]);

    useEffect(() => {
        const loadPayment = async () => {
            if (!reference) {
                setError('Payment reference is missing.');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError('');
                setPayment(await PaymentService.getPaymentReturn(reference));
            } catch (err: unknown) {
                const apiError = err as { response?: { data?: { message?: string } } };
                setError(apiError.response?.data?.message || 'Could not verify payment.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadPayment();
    }, [reference]);

    const status = payment?.status?.toLowerCase() ?? '';
    const isSuccess = status.includes('complete') || status.includes('success');
    const isPending = status.includes('pending');

    const icon = isSuccess ? (
        <CheckCircle2 size={48} className="text-green-600" />
    ) : isPending ? (
        <Clock3 size={48} className="text-amber-500" />
    ) : (
        <AlertCircle size={48} className="text-red-500" />
    );

    const title = isSuccess
        ? 'Payment completed'
        : isPending
            ? 'Payment pending'
            : 'Payment update unavailable';

    return (
        <Layout>
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl bg-white p-8 shadow-md text-center space-y-6">
                    {isLoading ? (
                        <p className="text-gray-500">Checking payment status...</p>
                    ) : (
                        <>
                            <div className="flex justify-center">{icon}</div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                                <p className="mt-2 text-gray-600">
                                    {error ||
                                        (isSuccess
                                            ? 'Your payment was confirmed by the platform.'
                                            : isPending
                                                ? 'The transaction is still being processed.'
                                                : 'We could not confirm this transaction yet.')}
                                </p>
                            </div>

                            {payment && (
                                <div className="rounded-xl bg-gray-50 p-4 text-left">
                                    <p className="text-sm text-gray-500">Reference</p>
                                    <p className="font-medium text-gray-900">{payment.id}</p>
                                    <p className="mt-3 text-sm text-gray-500">Status</p>
                                    <p className="font-medium text-gray-900 capitalize">{payment.status}</p>
                                    <p className="mt-3 text-sm text-gray-500">Amount</p>
                                    <p className="font-medium text-gray-900">
                                        {payment.currency} {payment.amount.toFixed(2)}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={() => navigate('/account')}
                                    className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700"
                                >
                                    Back to account
                                </button>
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="rounded-lg bg-gray-100 px-5 py-3 font-medium text-gray-800 hover:bg-gray-200"
                                >
                                    View orders
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};
