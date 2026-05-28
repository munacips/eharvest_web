import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginForm {
    username: string;
    password: string;
    rememberMe: boolean;
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>();
    const [error, setError] = useState('');

    useEffect(() => {
        const rememberPassword = localStorage.getItem('rememberPassword') === 'true';
        if (!rememberPassword) {
            return;
        }

        setValue('rememberMe', true);
        setValue('username', localStorage.getItem('rememberedUsername') || '');
        setValue('password', localStorage.getItem('rememberedPassword') || '');
    }, [setValue]);

    const onSubmit = async (data: LoginForm) => {
        try {
            setError('');
            await login({ username: data.username, password: data.password });

            if (data.rememberMe) {
                localStorage.setItem('rememberPassword', 'true');
                localStorage.setItem('rememberedUsername', data.username);
                localStorage.setItem('rememberedPassword', data.password);
            } else {
                localStorage.removeItem('rememberPassword');
                localStorage.removeItem('rememberedUsername');
                localStorage.removeItem('rememberedPassword');
            }

            navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-600 mb-2">🌾 eHarvest</h1>
                    <p className="text-gray-600">Farm to Market Marketplace</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-800 font-medium">Login failed</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                                })}
                                type="text"
                                placeholder="Enter your username"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        {errors.username && (
                            <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                                })}
                                type="password"
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        {errors.password && (
                            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <label className="flex items-center space-x-2">
                        <input
                            {...register('rememberMe')}
                            type="checkbox"
                            className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Remember password</span>
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-green-600 hover:text-green-700 font-semibold">
                            Sign up here
                        </Link>
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">Use your registered account credentials to sign in.</p>
                </div>
            </div>
        </div>
    );
};
