import { apiCall, apiGet } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { ReportDescriptor } from '../types';
import { extractList } from '../utils/apiMappers';

const toRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const parseStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => `${item}`);
};

const mapReportDescriptor = (payload: Record<string, unknown>): ReportDescriptor => ({
    reportName: `${payload.reportName ?? ''}`.trim(),
    label: `${payload.label ?? ''}`.trim(),
    description: `${payload.description ?? ''}`.trim(),
    allowedRoles: parseStringList(payload.allowedRoles),
    params: parseStringList(payload.params),
});

export class ReportService {
    static async getAvailableReports(): Promise<ReportDescriptor[]> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.REPORTS_AVAILABLE);
        return extractList(payload, mapReportDescriptor);
    }

    static async generateReport(
        reportName: string,
        queryParams: Record<string, string>
    ): Promise<Uint8Array> {
        const endpoint = API_CONFIG.ENDPOINTS.REPORTS_GENERATE.replace(':reportName', encodeURIComponent(reportName));
        const data = await apiCall<ArrayBuffer>('GET', endpoint, undefined, {
            params: Object.keys(queryParams).length ? queryParams : undefined,
            responseType: 'arraybuffer',
            headers: {
                Accept: 'application/pdf',
            },
        });

        return new Uint8Array(data);
    }
}
