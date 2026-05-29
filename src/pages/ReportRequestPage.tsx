import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, FileDown } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ReportService } from '../services/ReportService';
import type { ReportDescriptor } from '../types';

const dateParams = new Set(['from', 'to']);
const numberParams = new Set(['farmerId', 'sellerId', 'warehouseId']);

const labelForParam = (param: string) => {
    switch (param) {
        case 'from':
            return 'From date';
        case 'to':
            return 'To date';
        case 'region':
            return 'Region';
        case 'status':
            return 'Status';
        case 'farmerId':
            return 'Farmer ID';
        case 'sellerId':
            return 'Seller ID';
        case 'warehouseId':
            return 'Warehouse ID';
        default:
            return param.replace(/(^|_)([a-z])/g, (_match, prefix, letter) =>
                `${prefix === '_' ? ' ' : ''}${letter.toUpperCase()}`
            );
    }
};

export const ReportRequestPage: React.FC = () => {
    const { reportName } = useParams<{ reportName: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportDescriptor | null>(
        (location.state as { report?: ReportDescriptor } | null)?.report ?? null
    );
    const [isLoading, setIsLoading] = useState(!report);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    const loadReport = useCallback(async () => {
        if (!reportName) {
            setError('Report identifier is missing.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const available = await ReportService.getAvailableReports();
            const match = available.find((item) => item.reportName === reportName);
            if (!match) {
                setError('Report was not found.');
                return;
            }
            setReport(match);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to load report details.');
        } finally {
            setIsLoading(false);
        }
    }, [reportName]);

    useEffect(() => {
        if (!report) {
            void loadReport();
        }
    }, [loadReport, report]);

    const params = useMemo(() => report?.params ?? [], [report?.params]);

    const updateParam = (param: string, value: string) => {
        setFormValues((prev) => ({
            ...prev,
            [param]: value,
        }));
    };

    const handleGenerate = async () => {
        if (!report) return;

        try {
            setIsGenerating(true);
            setError('');

            const queryParams = Object.entries(formValues).reduce<Record<string, string>>((acc, [key, value]) => {
                if (value.trim()) {
                    acc[key] = value.trim();
                }
                return acc;
            }, {});

            const pdfBytes = await ReportService.generateReport(report.reportName, queryParams);

            navigate('/reports/view', {
                state: {
                    title: report.label,
                    reportName: report.reportName,
                    queryParams,
                    pdfBytes,
                },
            });
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to generate the report.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                    Loading report details...
                </div>
            </Layout>
        );
    }

    if (!report) {
        return (
            <Layout>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    {error || 'Report details are unavailable.'}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900">{report.label}</h1>
                    <p className="mt-2 text-gray-600">{report.description}</p>
                </div>

                {params.length === 0 ? (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        This report does not require any parameters.
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        {params.map((param) => {
                            const isDate = dateParams.has(param);
                            const isNumber = numberParams.has(param);

                            return (
                                <div key={param} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        {labelForParam(param)}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={isDate ? 'date' : isNumber ? 'number' : 'text'}
                                            value={formValues[param] ?? ''}
                                            onChange={(event) => updateParam(param, event.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        {isDate && (
                                            <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <button
                    onClick={() => void handleGenerate()}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                >
                    <FileDown size={18} />
                    {isGenerating ? 'Generating...' : 'Generate report'}
                </button>
            </div>
        </Layout>
    );
};
