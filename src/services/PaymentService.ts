import { apiGet, apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { Payment } from '../types';
import { extractList, mapPayment } from '../utils/apiMappers';

export class PaymentService {
    static async initiatePayment(
        orderId: string,
        amount: number,
        currency: 'USD' | 'ZIG' = 'USD'
    ): Promise<{ paymentId: string; redirectUrl: string }> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.PAYMENT_INITIATE, {
            orderId,
            amount,
            currency,
        });
        return {
            paymentId: `${payload.id ?? payload.reference ?? orderId}`,
            redirectUrl: `${payload.redirectUrl ?? payload.redirect_url ?? ''}`,
        };
    }

    static async getPaymentReturn(transactionId: string): Promise<Payment> {
        const payload = await apiGet<Record<string, unknown>>(API_CONFIG.ENDPOINTS.PAYMENT_RETURN, { params: { reference: transactionId } });
        return mapPayment(payload);
    }

    static async getWalletBalance(currency: 'USD' | 'ZIG'): Promise<number> {
        const transactions = await this.getPaymentHistory();
        return transactions.data
            .filter((payment) => payment.currency === currency)
            .reduce((sum, payment) => sum + payment.amount, 0);
    }

    static async getPaymentHistory(page: number = 1): Promise<{ data: Payment[]; total: number }> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.TRANSACTIONS, { params: { page } });
        const data = extractList(payload, mapPayment);
        return { data, total: data.length };
    }

    static async getPaymentById(id: string): Promise<Payment> {
        const payload = await apiGet<Record<string, unknown>>(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`);
        return mapPayment(payload);
    }
}
