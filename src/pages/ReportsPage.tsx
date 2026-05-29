import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, RefreshCw } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ReportService } from '../services/ReportService';
import type { ReportDescriptor } from '../types';

export const ReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportDescriptor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReports = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await ReportService.getAvailableReports();
            setReports(data);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to load reports.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-600 mt-2">Generate analytics and audit-ready summaries.</p>
                    </div>
                    <button
                        onClick={() => void loadReports()}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        Loading reports...
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        No reports available right now.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reports.map((report) => (
                            <button
                                key={report.reportName}
                                onClick={() => navigate(`/reports/${report.reportName}`, { state: { report } })}
                                className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-green-200 hover:shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="rounded-xl bg-green-50 p-3 text-green-700">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">{report.label}</h2>
                                            <p className="text-sm text-gray-600">{report.description}</p>
                                        </div>
                                        {report.params.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {report.params.map((param) => (
                                                    <span
                                                        key={`${report.reportName}-${param}`}
                                                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                                                    >
                                                        {param}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
