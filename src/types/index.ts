// User Types
export type UserRole = 'farmer' | 'buyer' | 'logistics';

export interface User {
    id: string;
    nationalId: string;
    firstName: string;
    lastName: string;
    username: string;
    role: UserRole;
    email: string;
    phoneNumber: string;
    address: string;
    trustScore: number;
    usdBalance: number;
    zigBalance: number;
    verified: boolean;
    farmName?: string;
    farmLocation?: string;
    cropTypes?: string[];
    companyName?: string;
    vehicleTypes?: string[];
    successfulSales?: number;
    unsuccessfulSales?: number;
    successfulBuys?: number;
    unsuccessfulBuys?: number;
    licenseNumber?: string;
    defensiveId?: string;
}

export interface Farmer extends User {
    farmName: string;
    cropTypes: string[];
    successfulSells: number;
}

export interface Buyer extends User {
    companyName?: string;
    successfulBuys: number;
    unsuccessfulBuys: number;
}

export interface LogisticsProvider extends User {
    companyName: string;
    vehicleTypes: string[];
}

// Authentication Types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: string;
    role: UserRole;
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: UserRole;
    address: string;
    farmName?: string;
    companyName?: string;
    cropTypes?: string[];
    vehicleTypes?: string[];
}

// Product/Produce Types
export interface Produce {
    id: string;
    farmerId: string;
    farmerName: string;
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
    grade: string;
    harvestDate: string;
    availableDate: string;
    description: string;
    image?: string;
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    totalAmount: number;
    status: OrderStatus;
    buyerId: string;
    farmerId: string;
    logisticsRequestId?: string;
    escrowReleased: boolean;
    createdAt: string;
    items: OrderItem[];
}

export interface OrderItem {
    produceId: string;
    produceName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

// Subscription Types
export type SubscriptionFrequency = 'weekly' | 'bi-weekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface ProduceSubscription {
    id: string;
    buyerId: string;
    farmerId: string;
    frequency: SubscriptionFrequency;
    status: SubscriptionStatus;
    items: SubscriptionItem[];
    totalAmount: number;
    startDate: string;
    nextDeliveryDate: string;
}

export interface SubscriptionItem {
    id: string;
    produceId: string;
    produceName: string;
    quantity: number;
    unitPrice: number;
}

// Logistics Types
export type LogisticsStatus = 'pending' | 'accepted' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface LogisticsRequest {
    id: string;
    orderId: string;
    originLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    destinationLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    estimatedDistance: number;
    fee: number;
    status: LogisticsStatus;
    assignedProviderId?: string;
    createdAt: string;
}

// Chat Types
export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
    isPending?: boolean;
    isQueued?: boolean;
    isDeleted?: boolean;
}

export interface ChatConversation {
    id: string;
    name: string;
    isGroup: boolean;
    members: ChatMember[];
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface ChatMember {
    userId: string;
    fullName: string;
    joinedAt: string;
    lastReadAt: string;
}

// Review Types
export interface Review {
    id: string;
    reviewerId: string;
    reviewerName: string;
    revieweeId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// Payment Types
export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    currency: 'USD' | 'ZIG';
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

// AI/Market Types
export interface PricePrediction {
    commodity: string;
    currentPrice: number;
    predictedPrice: number;
    confidence: number;
    timeframe: string;
}

export interface MarketInsight {
    commodity: string;
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    supplyTrend: 'increasing' | 'stable' | 'decreasing';
    averagePrice: number;
    seasonalNote: string;
}

export interface SeasonRecommendation {
    cropName: string;
    season: string;
    demandScore: number;
    profitabilityScore: number;
    recommendation: string;
}

// Heatmap Data
export interface SupplyPoint {
    id: string;
    farmerId: string;
    farmerName: string;
    latitude: number;
    longitude: number;
    availableProduce: Produce[];
    trustScore: number;
}
