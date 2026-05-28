import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ChatService } from '../services';
import type { ChatConversation, ChatMessage } from '../types';
import { Send, MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                setIsLoading(true);
                const data = await ChatService.getConversations();
                setConversations(data);
            } catch (error) {
                console.error('Failed to load conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadConversations();
    }, []);

    const loadMessages = async (conversationId: string) => {
        try {
            const data = await ChatService.getMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSelectConversation = (conversation: ChatConversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await ChatService.sendMessage(selectedConversation.id, newMessage);
            setNewMessage('');
            loadMessages(selectedConversation.id);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <Layout>
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">Messages</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-96 lg:max-h-96 lg:h-auto">
                    {/* Conversations List */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                        <div className="border-b p-4">
                            <h2 className="font-bold text-gray-900">Conversations</h2>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-500">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">No conversations</div>
                            ) : (
                                <div className="divide-y">
                                    {conversations.map((conversation) => (
                                        <button
                                            key={conversation.id}
                                            onClick={() => handleSelectConversation(conversation)}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                                                }`}
                                        >
                                            <p className="font-medium text-gray-900 text-sm">{conversation.name}</p>
                                            <p className="text-xs text-gray-600 mt-1 truncate">
                                                {conversation.lastMessage?.content}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-3 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Header */}
                                <div className="border-b p-4 bg-gray-50">
                                    <h2 className="font-bold text-gray-900">{selectedConversation.name}</h2>
                                    <p className="text-sm text-gray-600">
                                        {selectedConversation.members.length} members
                                    </p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                                            <MessageCircle size={48} className="text-gray-300 mb-2" />
                                            <p>No messages yet</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className="flex items-start space-x-3"
                                            >
                                                <div className="w-8 h-8 bg-green-600 rounded-full text-white flex items-center justify-center text-sm font-medium">
                                                    {message.senderName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {message.senderName}
                                                    </p>
                                                    <p className="text-gray-700 text-sm bg-gray-100 rounded-lg p-3 mt-1">
                                                        {message.content}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(message.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input */}
                                <div className="border-t p-4 bg-gray-50">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
