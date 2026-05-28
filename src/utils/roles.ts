import type { UserRole } from '../types';

export const normalizeRole = (rawRole?: string | null): UserRole | '' => {
    const normalized = (rawRole || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

    const baseRole = normalized.startsWith('role_')
        ? normalized.slice('role_'.length)
        : normalized;

    switch (baseRole) {
        case 'farmer':
        case 'buyer':
            return baseRole;
        case 'logistics':
        case 'logistics_provider':
        case 'logisticsprovider':
        case 'driver':
            return 'logistics';
        default:
            return '';
    }
};
