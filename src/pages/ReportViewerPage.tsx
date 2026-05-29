import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ReportService } from '../services/ReportService';

interface ReportViewerState {
    title: string;
    reportName: string;
    queryParams: Record<string, string>;
    pdfBytes: Uint8Array;
}

export const ReportViewerPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as ReportViewerState | null;
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(state?.pdfBytes ?? null);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState('');

    const fileUrl = useMemo(() => {
        if (!pdfBytes) return null;
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }, [pdfBytes]);

    useEffect(() => {
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [fileUrl]);

    const handleRegenerate = async () => {
        if (!state) return;

        try {
            setIsRegenerating(true);
            setError('');
            const updated = await ReportService.generateReport(state.reportName, state.queryParams);
            setPdfBytes(updated);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to regenerate report.');
        } finally {
            setIsRegenerating(false);
        }
    };

    if (!state || !pdfBytes) {
        return (
            <Layout>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    Report content is missing. Return to the reports list to try again.
                </div>
                <button
                    onClick={() => navigate('/reports')}
                    className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                >
                    Back to reports
                </button>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">{state.title}</h1>
                    <button
                        onClick={() => void handleRegenerate()}
                        disabled={isRegenerating}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                        <RefreshCw size={16} />
                        {isRegenerating ? 'Refreshing...' : 'Regenerate'}
                    </button>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {fileUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <embed src={fileUrl} type="application/pdf" className="h-[75vh] w-full" />
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        Unable to render this report.
                    </div>
                )}
            </div>
        </Layout>
    );
};
