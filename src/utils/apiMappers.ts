import type {
    ChatConversation,
    ChatMember,
    ChatMessage,
    LogisticsRequest,
    Order,
    OrderItem,
    Payment,
    Produce,
    ProduceSubscription,
    Review,
    SubscriptionItem,
    SupplyPoint,
    User,
} from '../types';
import { normalizeRole } from './roles';

const toRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const readString = (source: Record<string, unknown>, keys: string[], fallback = ''): string => {
    for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && `${value}`.trim() !== '') {
            return `${value}`.trim();
        }
    }
    return fallback;
};

const readNumber = (source: Record<string, unknown>, keys: string[], fallback = 0): number => {
    const raw = readString(source, keys, '');
    if (!raw) {
        for (const key of keys) {
            const value = source[key];
            if (typeof value === 'number') {
                return value;
            }
        }
        return fallback;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const readBoolean = (source: Record<string, unknown>, keys: string[], fallback = false): boolean => {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
        }
    }
    return fallback;
};

const readArray = <T = unknown>(source: Record<string, unknown>, keys: string[]): T[] => {
    for (const key of keys) {
        const value = source[key];
        if (Array.isArray(value)) {
            return value as T[];
        }
    }
    return [];
};

const readObject = (source: Record<string, unknown>, keys: string[]): Record<string, unknown> | null => {
    for (const key of keys) {
        const value = source[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value as Record<string, unknown>;
        }
    }
    return null;
};

export const extractList = <T>(payload: unknown, mapper: (item: Record<string, unknown>) => T): T[] => {
    if (Array.isArray(payload)) {
        return payload.map((item) => mapper(toRecord(item)));
    }

    const record = toRecord(payload);
    const list =
        readArray(record, ['content', 'data', 'items', 'results']) ||
        [];

    return list.map((item) => mapper(toRecord(item)));
};

export const mapUser = (payload: Record<string, unknown>): User => ({
    id: readString(payload, ['id']),
    nationalId: readString(payload, ['nationalId', 'national_id']),
    firstName: readString(payload, ['firstName', 'first_name']),
    lastName: readString(payload, ['lastName', 'last_name']),
    username: readString(payload, ['username']),
    role: normalizeRole(readString(payload, ['role'])) || 'buyer',
    email: readString(payload, ['email']),
    phoneNumber: readString(payload, ['phoneNumber', 'phone_number']),
    address: readString(payload, ['address']),
    trustScore: readNumber(payload, ['trustScore', 'trust_score']),
    usdBalance: readNumber(payload, ['usdBalance', 'usd_balance']),
    zigBalance: readNumber(payload, ['zigBalance', 'zig_balance']),
    verified: readBoolean(payload, ['verified']),
    farmName: readString(payload, ['farmName', 'farm_name']),
    farmLocation: readString(payload, ['farmLocation', 'farm_location']),
    cropTypes: readArray<string>(payload, ['cropTypes', 'crop_types']),
    companyName: readString(payload, ['companyName', 'company_name']),
    vehicleTypes: readArray<string>(payload, ['vehicleTypes', 'vehicle_types']),
    successfulSales: readNumber(payload, ['successfulSales', 'successful_sales']),
    unsuccessfulSales: readNumber(payload, ['unsuccessfulSales', 'unsuccessful_sales']),
    successfulBuys: readNumber(payload, ['successfulBuys', 'successful_buys']),
    unsuccessfulBuys: readNumber(payload, ['unsuccessfulBuys', 'unsuccessful_buys']),
    licenseNumber: readString(payload, ['licenseNumber', 'license_number']),
    defensiveId: readString(payload, ['defensiveId', 'defensive_id']),
});

export const mapProduce = (payload: Record<string, unknown>): Produce => {
    const farmer = readObject(payload, ['farmer']);

    return {
        id: readString(payload, ['id']),
        farmerId: readString(payload, ['farmerId', 'farmer_id'], readString(farmer ?? {}, ['id'])),
        farmerName:
            readString(farmer ?? {}, ['first_name']) && readString(farmer ?? {}, ['last_name'])
                ? `${readString(farmer ?? {}, ['first_name'])} ${readString(farmer ?? {}, ['last_name'])}`.trim()
                : readString(farmer ?? {}, ['username'], 'Unknown farmer'),
        name: readString(payload, ['name']),
        category: readString(payload, ['category']),
        quantity: readNumber(payload, ['quantity']),
        unitPrice: readNumber(payload, ['unitPrice', 'unit_price', 'price']),
        grade: readString(payload, ['grade', 'qualityGrade', 'quality_grade']),
        harvestDate: readString(payload, ['harvestDate', 'harvest_date']),
        availableDate: readString(payload, ['availableDate', 'availableFrom', 'available_date', 'available_from']),
        description: readString(payload, ['description']),
        image: readArray<string>(payload, ['imageUrls', 'image_urls'])[0] || readString(payload, ['image']),
    };
};

export const mapOrderItem = (payload: Record<string, unknown>): OrderItem => {
    const produce = readObject(payload, ['produce']);

    return {
        produceId: readString(payload, ['produceId', 'produce_id'], readString(produce ?? {}, ['id'])),
        produceName: readString(payload, ['produceName', 'produce_name'], readString(produce ?? {}, ['name'], 'Produce')),
        quantity: readNumber(payload, ['quantity']),
        unitPrice: readNumber(payload, ['unitPrice', 'unit_price', 'price']),
        subtotal: readNumber(payload, ['subtotal'], readNumber(payload, ['quantity']) * readNumber(payload, ['unitPrice', 'unit_price', 'price'])),
    };
};

export const mapOrder = (payload: Record<string, unknown>): Order => ({
    id: readString(payload, ['id']),
    totalAmount: readNumber(payload, ['totalAmount', 'total_amount', 'total', 'amount']),
    status: readString(payload, ['status']).toLowerCase().replace(/[\s-]+/g, '_') as Order['status'],
    buyerId: readString(payload, ['buyerId', 'buyer_id'], readString(readObject(payload, ['buyer']) ?? {}, ['id'])),
    farmerId: readString(payload, ['farmerId', 'farmer_id'], readString(readObject(payload, ['farmer']) ?? {}, ['id'])),
    logisticsRequestId: readString(payload, ['logisticsRequestId', 'logistics_request_id']),
    escrowReleased: readBoolean(payload, ['escrowReleased', 'escrow_released']),
    createdAt: readString(payload, ['createdAt', 'created_at', 'orderDate', 'order_date'], new Date().toISOString()),
    items: readArray(payload, ['items']).map((item) => mapOrderItem(toRecord(item))),
});

export const mapSubscriptionItem = (payload: Record<string, unknown>): SubscriptionItem => ({
    id: readString(payload, ['id']),
    produceId: readString(payload, ['produceId', 'produce_id']),
    produceName: readString(payload, ['produceName', 'produce_name'], `Produce #${readString(payload, ['produceId', 'produce_id'])}`),
    quantity: readNumber(payload, ['quantity']),
    unitPrice: readNumber(payload, ['unitPrice', 'unit_price']),
});

export const mapSubscription = (payload: Record<string, unknown>): ProduceSubscription => ({
    id: readString(payload, ['id']),
    buyerId: readString(payload, ['buyerId', 'buyer_id']),
    farmerId: readString(payload, ['farmerId', 'farmer_id']),
    frequency: readString(payload, ['frequency']).toLowerCase().replace('biweekly', 'bi-weekly') as ProduceSubscription['frequency'],
    status: readString(payload, ['status']).toLowerCase() as ProduceSubscription['status'],
    items: readArray(payload, ['items']).map((item) => mapSubscriptionItem(toRecord(item))),
    totalAmount: readNumber(payload, ['totalAmount', 'total_amount']),
    startDate: readString(payload, ['startDate', 'start_date'], new Date().toISOString()),
    nextDeliveryDate: readString(payload, ['nextDeliveryDate', 'next_delivery_date'], new Date().toISOString()),
});

export const mapLogisticsRequest = (payload: Record<string, unknown>): LogisticsRequest => ({
    id: readString(payload, ['id']),
    orderId: readString(payload, ['orderId', 'order_id'], readString(readObject(payload, ['order']) ?? {}, ['id'])),
    originLocation: {
        latitude: 0,
        longitude: 0,
        address: readString(payload, ['pickupLocation', 'pickup_location']),
    },
    destinationLocation: {
        latitude: 0,
        longitude: 0,
        address: readString(payload, ['deliveryLocation', 'delivery_location']),
    },
    estimatedDistance: readNumber(payload, ['estimatedDistance', 'estimated_distance']),
    fee: readNumber(payload, ['fee', 'cost']),
    status: readString(payload, ['status']).toLowerCase().replace(/[\s-]+/g, '_') as LogisticsRequest['status'],
    assignedProviderId: readString(readObject(payload, ['assignedProvider', 'assigned_provider']) ?? {}, ['id']),
    createdAt: readString(payload, ['createdAt', 'created_at'], new Date().toISOString()),
});

export const mapPayment = (payload: Record<string, unknown>): Payment => ({
    id: readString(payload, ['id', 'reference', 'transactionId', 'transaction_id']),
    orderId: readString(payload, ['orderId', 'order_id']),
    amount: readNumber(payload, ['amount']),
    currency: (readString(payload, ['currency'], 'USD').toUpperCase() as Payment['currency']),
    status: (readString(payload, ['status'], 'pending').toLowerCase() as Payment['status']),
    createdAt: readString(payload, ['createdAt', 'created_at'], new Date().toISOString()),
});

export const mapReview = (payload: Record<string, unknown>): Review => ({
    id: readString(payload, ['id']),
    reviewerId: readString(payload, ['reviewerId', 'reviewer_id']),
    reviewerName: readString(readObject(payload, ['reviewer']) ?? {}, ['username', 'firstName', 'first_name'], 'Reviewer'),
    revieweeId: readString(payload, ['revieweeId', 'reviewee_id']),
    rating: readNumber(payload, ['rating']),
    comment: readString(payload, ['comment']),
    createdAt: readString(payload, ['createdAt', 'created_at'], new Date().toISOString()),
});

export const mapChatMember = (payload: Record<string, unknown>): ChatMember => ({
    userId: readString(payload, ['userId', 'user_id', 'id']),
    fullName: readString(payload, ['fullName', 'full_name', 'username']),
    joinedAt: readString(payload, ['joinedAt', 'joined_at'], new Date().toISOString()),
    lastReadAt: readString(payload, ['lastReadAt', 'last_read_at'], new Date().toISOString()),
});

export const mapChatMessage = (payload: Record<string, unknown>): ChatMessage => {
    const sender = readObject(payload, ['sender']);
    return {
        id: readString(payload, ['id']),
        conversationId: readString(payload, ['conversationId', 'conversation_id']),
        senderId: readString(payload, ['senderId', 'sender_id'], readString(sender ?? {}, ['id'])),
        senderName: readString(payload, ['senderName', 'sender_name'], readString(sender ?? {}, ['username', 'firstName', 'first_name'], 'User')),
        content: readString(payload, ['content', 'message']),
        createdAt: readString(payload, ['createdAt', 'created_at', 'sentAt', 'sent_at'], new Date().toISOString()),
    };
};

export const mapChatConversation = (payload: Record<string, unknown>): ChatConversation => {
    const lastMessage = readObject(payload, ['lastMessage', 'last_message']);
    return {
        id: readString(payload, ['id']),
        name: readString(payload, ['name'], 'Conversation'),
        isGroup: readBoolean(payload, ['group', 'isGroup', 'is_group']),
        members: readArray(payload, ['members', 'participants']).map((item) => mapChatMember(toRecord(item))),
        lastMessage: lastMessage ? mapChatMessage(lastMessage) : undefined,
        unreadCount: readNumber(payload, ['unreadCount', 'unread_count']),
    };
};

export const mapSupplyPoint = (payload: Record<string, unknown>): SupplyPoint => {
    const availableProduce = readArray(payload, ['availableProduce', 'available_produce', 'produce']).map((item) =>
        mapProduce(toRecord(item))
    );

    return {
        id: readString(payload, ['id', 'farmerId', 'farmer_id']),
        farmerId: readString(payload, ['farmerId', 'farmer_id']),
        farmerName: readString(payload, ['farmerName', 'farmer_name', 'city'], 'Supply point'),
        latitude: readNumber(payload, ['latitude']),
        longitude: readNumber(payload, ['longitude']),
        availableProduce,
        trustScore: readNumber(payload, ['trustScore', 'trust_score', 'normalizedWeight', 'normalized_weight']),
    };
};
