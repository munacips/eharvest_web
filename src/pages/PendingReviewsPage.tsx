import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { ReviewService } from '../services';
import type { Review } from '../types';
import { MessageSquare, Star } from 'lucide-react';

export const PendingReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeReview, setActiveReview] = useState<Review | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadReviews = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await ReviewService.getPendingReviewsForCurrentUser();
            setReviews(data);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to load pending reviews.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

    const openReview = (review: Review) => {
        setActiveReview(review);
        setRating(5);
        setComment('');
    };

    const closeReview = () => {
        setActiveReview(null);
        setComment('');
        setRating(5);
    };

    const handleSubmit = async () => {
        if (!activeReview) return;

        try {
            setIsSubmitting(true);
            await ReviewService.submitPendingReview(activeReview.id, rating, comment);
            closeReview();
            await loadReviews();
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const revieweeLabel = useMemo(() => {
        if (!activeReview) return '';
        const role = activeReview.revieweeRole
            ? activeReview.revieweeRole.replace(/_/g, ' ').toLowerCase()
            : '';
        const roleLabel = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : '';
        return `${activeReview.revieweeName || 'User'}${roleLabel ? ` · ${roleLabel}` : ''}`;
    }, [activeReview]);

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Pending Reviews</h1>
                    <p className="text-gray-600 mt-2">Share feedback on completed orders.</p>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        Loading pending reviews...
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        You have no pending reviews right now.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reviews.map((review) => (
                            <button
                                key={review.id}
                                onClick={() => openReview(review)}
                                className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-green-200 hover:shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="rounded-xl bg-green-50 p-3 text-green-700">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {review.revieweeName || 'Reviewee'}
                                            </h2>
                                            <p className="text-sm text-gray-600">Order {review.orderId || review.id}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                Status {review.status || 'pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {activeReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Submit review</h2>
                                <p className="text-sm text-gray-600">{revieweeLabel}</p>
                            </div>
                            <button
                                onClick={closeReview}
                                className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rating</label>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => setRating(value)}
                                            className={`rounded-full p-2 ${rating >= value ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <Star size={18} />
                                        </button>
                                    ))}
                                    <span className="text-sm text-gray-600">{rating} / 5</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    rows={4}
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Share your feedback"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={closeReview}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleSubmit()}
                                disabled={isSubmitting}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
