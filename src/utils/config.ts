// Configuration for API endpoints
const env = import.meta.env;

export const API_CONFIG = {
    // Backend base URL - change this to your actual backend URL
    BASE_URL: env.VITE_API_URL || 'http://localhost:8080',

    // API endpoints
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login',
        AUTH_REGISTER: '/auth/register',
        AUTH_REFRESH: '/auth/refresh',
        AUTH_LOGOUT: '/auth/logout',

        // Users
        USERS: '/api/v1/users',
        BUYERS: '/api/v1/buyers',
        FARMERS: '/api/v1/farmers',
        LOGISTICS_PROVIDERS: '/api/v1/logistics-providers',

        // Products/Produce
        PRODUCE: '/api/v1/produce',

        // Orders
        ORDERS: '/api/v1/orders',
        ORDER_DETAIL: '/api/v1/orders/:id',
        ORDER_FARMER: '/api/v1/orders/farmer/:id',
        ORDER_BUYER: '/api/v1/orders/buyer/:id',

        // Subscriptions
        SUBSCRIPTIONS: '/api/v1/subscriptions',
        SUBSCRIPTION_DETAIL: '/api/v1/subscriptions/:id',
        SUBSCRIPTION_FARMER: '/api/v1/subscriptions/farmer/:id',
        SUBSCRIPTION_BUYER: '/api/v1/subscriptions/buyer/:id',

        // Logistics
        LOGISTICS_REQUESTS: '/api/v1/logistics',
        LOGISTICS_REQUEST_DETAIL: '/api/v1/logistics/:id',
        LOGISTICS_ACCEPT: '/api/v1/logistics/:id/accept',
        LOGISTICS_REJECT: '/api/v1/logistics/:id/reject',
        LOGISTICS_IN_TRANSIT: '/api/v1/logistics/:id/in-transit',
        LOGISTICS_DELIVERED: '/api/v1/logistics/:id/delivered',

        // Payments
        PAYMENTS: '/api/v1/payments',
        PAYMENT_INITIATE: '/api/v1/payments/init',
        PAYMENT_RETURN: '/api/v1/payments/return',
        TRANSACTIONS: '/api/v1/transactions',

        // Reviews
        REVIEWS: '/api/v1/reviews',
        REVIEWS_BY_REVIEWER: '/api/v1/reviews/reviewer/:id',
        REVIEWS_BY_REVIEWEE: '/api/v1/reviews/reviewee/:id',

        // Chat
        CHAT_CONVERSATIONS: '/api/v1/chat/conversations',
        CHAT_MESSAGES: '/api/v1/chat/conversations/:id/messages',
        CHAT_MARK_READ: '/api/v1/chat/conversations/:id/read',
        CHAT_DELETE_MESSAGE: '/api/v1/chat/messages/:id',
        CHAT_WEBSOCKET_SEND: '/chat.send',

        // Notifications
        NOTIFICATIONS: '/api/v1/notifications',
        NOTIFICATION_MARK_READ: '/api/v1/notifications/:id/read',
        FCM_TOKEN_REGISTER: '/api/notifications/register-token',
        FCM_TOKEN_DEREGISTER: '/api/notifications/deactivate-token',

        // AI Services
        AI_FORECAST_COMMODITY: '/api/ai/forecast/:commodity',
        AI_DEMAND_SUPPLY_FORECAST: '/api/ai/forecast/demand-supply',
        AI_WEATHER_INTEGRATION: '/api/ai/integrations/weather',
        AI_MARKET_PRICES: '/api/ai/integrations/market-prices',
        AI_PRESCRIPTIVE_RECOMMENDATIONS: '/api/ai/recommendations/prescriptive',
        AI_TRUST_SCORE: '/api/ai/trust-score/:userId',
        AI_PREDICT_PRICE: '/api/ai/predict-price',
        AI_PRICING_SCHEMA: '/api/ai/pricing/schema',
        AI_PRICING_BATCH: '/api/ai/pricing/batch',
        AI_PRICING_AUTO: '/api/ai/pricing/auto',
    },

    // WebSocket configuration
    WS_CONFIG: {
        URL: env.VITE_WS_URL || 'ws://localhost:8080/ws/chat',
        RECONNECT_DELAY: 3000,
        RECONNECT_ATTEMPTS: 5,
    },

    // Firebase configuration
    FIREBASE_CONFIG: {
        apiKey: env.VITE_FIREBASE_API_KEY || '',
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: env.VITE_FIREBASE_APP_ID || '',
        vapidKey: env.VITE_FIREBASE_VAPID_KEY || '',
    },
};
