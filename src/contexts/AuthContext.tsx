import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginRequest, SignupRequest } from '../types';
import { AuthService } from '../services/AuthService';
import { normalizeRole } from '../utils/roles';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    signup: (data: SignupRequest) => Promise<void>;
    logout: () => void;
    register: (userData: SignupRequest) => Promise<void>;
    refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const buildFallbackUser = (
        userId: string,
        username: string,
        role: string
    ): User => ({
        id: userId,
        nationalId: '',
        firstName: username,
        lastName: '',
        username,
        role: normalizeRole(role) || 'buyer',
        email: '',
        phoneNumber: '',
        address: '',
        trustScore: 0,
        usdBalance: 0,
        zigBalance: 0,
        verified: false,
    });

    const normalizeUser = (user: User): User => ({
        ...user,
        role: normalizeRole(user.role) || 'buyer',
    });

    // Initialize auth on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    const parsedUser = normalizeUser(JSON.parse(storedUser));
                    setToken(storedToken);
                    setUser(parsedUser);
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            setIsLoading(true);
            const response = await AuthService.login(credentials);
            setToken(response.token);

            let userDetails: User;
            try {
                userDetails = normalizeUser(await AuthService.getProfile());
            } catch {
                userDetails = buildFallbackUser(response.userId, credentials.username, response.role);
            }

            setUser(userDetails);

            // Store in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userDetails));
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SignupRequest) => {
        try {
            setIsLoading(true);
            const response = await AuthService.register(data);
            setToken(response.token);

            let userDetails: User;
            try {
                userDetails = normalizeUser(await AuthService.getProfile());
            } catch {
                userDetails = buildFallbackUser(response.userId, data.username, response.role);
            }

            setUser(userDetails);

            // Store in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userDetails));
        } finally {
            setIsLoading(false);
        }
    };

    const register = signup;

    const refreshUser = async (): Promise<User | null> => {
        try {
            if (!token) {
                return null;
            }

            const freshUser = normalizeUser(await AuthService.getProfile());
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
            return freshUser;
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            return null;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        AuthService.logout();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token && !!user,
                login,
                signup,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
