import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { Review } from '../types';
import { extractList, mapReview } from '../utils/apiMappers';
import { AuthService } from './AuthService';

export class ReviewService {
    static async createReview(data: {
        revieweeId: string;
        rating: number;
        comment: string;
    }): Promise<Review> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.REVIEWS, data);
        return mapReview(payload);
    }

    static async getReview(id: string): Promise<Review> {
        const payload = await apiGet<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.REVIEWS}/${id}`);
        return mapReview(payload);
    }

    static async getReviewsForUser(userId: string): Promise<Review[]> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.REVIEWS_BY_REVIEWEE.replace(':id', userId));
        return extractList(payload, mapReview);
    }

    static async getReviewsByReviewer(userId: string): Promise<Review[]> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.REVIEWS_BY_REVIEWER.replace(':id', userId));
        return extractList(payload, mapReview);
    }

    static async getPendingReviewsForCurrentUser(): Promise<Review[]> {
        const reviewerId = AuthService.getUserId();
        if (!reviewerId) return [];
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.REVIEWS_PENDING_REVIEWER.replace(':id', reviewerId));
        return extractList(payload, mapReview).filter(
            (review) => (review.status ?? '').toLowerCase() === 'pending'
        );
    }

    static async updateReview(id: string, data: Partial<Review>): Promise<Review> {
        const payload = await apiPut<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.REVIEWS}/${id}`, data);
        return mapReview(payload);
    }

    static async submitPendingReview(id: string, rating: number, comment: string): Promise<Review> {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5.');
        }
        return this.updateReview(id, { rating, comment });
    }

    static async deleteReview(id: string): Promise<void> {
        return apiDelete(`${API_CONFIG.ENDPOINTS.REVIEWS}/${id}`);
    }

    static async getAverageRating(userId: string): Promise<number> {
        const reviews = await this.getReviewsForUser(userId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    }
}
