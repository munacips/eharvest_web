import { apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';

let messaging: Messaging | null = null;

export class NotificationService {
    static async initialize(): Promise<void> {
        try {
            if (!API_CONFIG.FIREBASE_CONFIG.apiKey || !API_CONFIG.FIREBASE_CONFIG.vapidKey) {
                console.warn('NotificationService skipped because Firebase or VAPID config is missing.');
                return;
            }

            // Initialize Firebase
            const app = initializeApp(API_CONFIG.FIREBASE_CONFIG);
            messaging = getMessaging(app);

            // Request permission and get FCM token
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.registerFCMToken();
                this.setupMessageListeners();
            }
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    }

    static async registerFCMToken(): Promise<void> {
        try {
            if (!messaging) return;

            const token = await getToken(messaging, {
                vapidKey: API_CONFIG.FIREBASE_CONFIG.vapidKey,
            });

            if (token) {
                await apiPost(API_CONFIG.ENDPOINTS.FCM_TOKEN_REGISTER, { token });
                localStorage.setItem('fcmToken', token);
            }
        } catch (error) {
            console.error('Failed to register FCM token:', error);
        }
    }

    static async deregisterFCMToken(): Promise<void> {
        try {
            const token = localStorage.getItem('fcmToken');
            if (token) {
                await apiPost(API_CONFIG.ENDPOINTS.FCM_TOKEN_DEREGISTER, { token });
                localStorage.removeItem('fcmToken');
            }
        } catch (error) {
            console.error('Failed to deregister FCM token:', error);
        }
    }

    static setupMessageListeners(): void {
        if (!messaging) return;

        // Handle messages when app is in foreground
        onMessage(messaging, (payload) => {
            console.log('Message received:', payload);

            // Show notification
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || 'eHarvest', {
                    body: payload.notification?.body,
                    icon: '/logo.png',
                });
            }

            // Handle notification click to navigate
            if (payload.data?.navigateTo) {
                window.location.href = payload.data.navigateTo;
            }
        });
    }

    static onNotification(callback: (notification: any) => void): void {
        if (!messaging) return;
        onMessage(messaging, callback);
    }
}
