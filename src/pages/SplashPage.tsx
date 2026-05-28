import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const SplashPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/login', { replace: true });
            }
        }
    }, [isLoading, isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-bounce mb-8">
                    <h1 className="text-6xl font-bold text-white">🌾</h1>
                </div>
                <h1 className="text-5xl font-bold text-white mb-2">eHarvest</h1>
                <p className="text-xl text-green-100 mb-8">Farm to Market Marketplace</p>
                <div className="flex justify-center items-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </div>
    );
};
