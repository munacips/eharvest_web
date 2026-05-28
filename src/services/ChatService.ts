import { apiGet, apiPost } from '../utils/apiClient';
import { API_CONFIG } from '../utils/config';
import type { ChatConversation, ChatMessage } from '../types';
import { extractList, mapChatConversation, mapChatMessage } from '../utils/apiMappers';

export class ChatService {
    private static messageHandlers: ((message: ChatMessage) => void)[] = [];
    private static statusHandlers: ((status: string) => void)[] = [];

    static async getConversations(): Promise<ChatConversation[]> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.CHAT_CONVERSATIONS);
        return extractList(payload, mapChatConversation);
    }

    static async getMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
        const payload = await apiGet<unknown>(API_CONFIG.ENDPOINTS.CHAT_MESSAGES.replace(':id', conversationId), {
            params: { limit },
        });
        return extractList(payload, mapChatMessage);
    }

    static async sendMessage(_conversationId: string, _content: string): Promise<ChatMessage> {
        const socketUrl = API_CONFIG.WS_CONFIG.URL;

        return new Promise<ChatMessage>((resolve, reject) => {
            const socket = new WebSocket(socketUrl);

            socket.onopen = () => {
                socket.send(
                    JSON.stringify({
                        destination: API_CONFIG.ENDPOINTS.CHAT_WEBSOCKET_SEND,
                        conversationId: _conversationId,
                        content: _content,
                    })
                );

                socket.close();
                resolve({
                    id: crypto.randomUUID(),
                    conversationId: _conversationId,
                    senderId: '',
                    senderName: 'You',
                    content: _content,
                    createdAt: new Date().toISOString(),
                    isPending: true,
                });
            };

            socket.onerror = () => {
                reject(new Error('Unable to send chat message over the configured websocket connection.'));
            };
        });
    }

    static async createConversation(participantIds: string[], isGroup: boolean = false): Promise<ChatConversation> {
        const payload = await apiPost<Record<string, unknown>>(API_CONFIG.ENDPOINTS.CHAT_CONVERSATIONS, { participantIds, isGroup });
        return mapChatConversation(payload);
    }

    // WebSocket connection setup (using REST for now, can upgrade to real WebSocket)
    static connectWebSocket(
        conversationId: string,
        onMessage: (message: ChatMessage) => void,
        onError?: (error: unknown) => void
    ) {
        this.messageHandlers.push(onMessage);

        // Poll for new messages (can be replaced with real WebSocket)
        const pollInterval = setInterval(async () => {
            try {
                const messages = await this.getMessages(conversationId);
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                    onMessage(lastMessage);
                }
            } catch (error) {
                if (onError) onError(error);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }

    static onMessage(handler: (message: ChatMessage) => void) {
        this.messageHandlers.push(handler);
    }

    static onConnectionStatus(handler: (status: string) => void) {
        this.statusHandlers.push(handler);
    }

    static disconnect() {
        this.messageHandlers = [];
        this.statusHandlers = [];
    }
}
