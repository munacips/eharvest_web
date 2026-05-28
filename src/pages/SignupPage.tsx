import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { AlertCircle, ChevronRight } from 'lucide-react';
import type { UserRole } from '../types';

interface SignupForm {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    address: string;
    farmName?: string;
    companyName?: string;
}

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { register: signUp } = useAuth();
    const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<SignupForm>();
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    const onSubmit = async (data: SignupForm) => {
        if (!selectedRole) {
            setError('Please select a role');
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setError('');
            await signUp({
                ...data,
                role: selectedRole,
            });
            navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    if (!selectedRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-green-600 mb-2">🌾 eHarvest</h1>
                        <p className="text-gray-600 mb-2">Join our marketplace</p>
                        <p className="text-gray-500 text-sm">Select your role to continue</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                role: 'farmer' as UserRole,
                                title: 'Farmer',
                                description: 'Grow and sell your produce',
                                icon: '👨‍🌾',
                            },
                            {
                                role: 'buyer' as UserRole,
                                title: 'Buyer',
                                description: 'Purchase fresh produce',
                                icon: '🛒',
                            },
                            {
                                role: 'logistics' as UserRole,
                                title: 'Logistics Provider',
                                description: 'Manage deliveries',
                                icon: '🚚',
                            },
                        ].map((option) => (
                            <button
                                key={option.role}
                                onClick={() => setSelectedRole(option.role)}
                                className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group"
                            >
                                <div className="text-4xl mb-3">{option.icon}</div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                                <div className="flex items-center justify-center text-green-600 group-hover:translate-x-1 transition-transform">
                                    <span className="text-sm font-medium">Get Started</span>
                                    <ChevronRight size={18} className="ml-2" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <button
                        onClick={() => setSelectedRole(null)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium mb-4"
                    >
                        ← Back to role selection
                    </button>
                    <h1 className="text-3xl font-bold text-green-600 mb-2">
                        Join as{' '}
                        {selectedRole === 'farmer' ? 'Farmer' : selectedRole === 'buyer' ? 'Buyer' : 'Logistics Provider'}
                    </h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                {...register('firstName', { required: 'Required' })}
                                type="text"
                                placeholder="First name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                            {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                {...register('lastName', { required: 'Required' })}
                                type="text"
                                placeholder="Last name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                            {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            {...register('username', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' } })}
                            type="text"
                            placeholder="Username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.username && <p className="text-red-600 text-xs mt-1">{errors.username.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            {...register('email', {
                                required: 'Required',
                                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                            })}
                            type="email"
                            placeholder="Email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            {...register('phoneNumber', { required: 'Required' })}
                            type="tel"
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                            {...register('address', { required: 'Required' })}
                            type="text"
                            placeholder="Address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>}
                    </div>

                    {selectedRole === 'farmer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                            <input
                                {...register('farmName')}
                                type="text"
                                placeholder="Farm name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                        </div>
                    )}

                    {(selectedRole === 'buyer' || selectedRole === 'logistics') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input
                                {...register('companyName')}
                                type="text"
                                placeholder="Company name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
                            type="password"
                            placeholder="Password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            {...register('confirmPassword', {
                                required: 'Required',
                                validate: (value) => value === getValues('password') || 'Passwords do not match',
                            })}
                            type="password"
                            placeholder="Confirm password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors mt-6"
                    >
                        {isSubmitting ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
