import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';
import { normalizeRole } from '../utils/roles';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const role = normalizeRole(user?.role);

    const getNavItems = () => {
        const baseItems = [
            { label: 'Home', path: '/dashboard' },
            { label: 'Logistics', path: '/logistics' },
            { label: 'Chat', path: '/chat' },
            { label: 'Account', path: '/account' },
        ];

        if (role === 'farmer') {
            return [
                ...baseItems.slice(0, 1),
                { label: 'Sell', path: '/sell' },
                { label: 'My Orders', path: '/orders' },
                { label: 'Analytics', path: '/analytics' },
                ...baseItems.slice(1),
            ];
        }

        if (role === 'buyer') {
            return [
                ...baseItems.slice(0, 1),
                { label: 'Buy', path: '/buy' },
                { label: 'Subscriptions', path: '/subscriptions' },
                { label: 'My Orders', path: '/orders' },
                { label: 'Analytics', path: '/analytics' },
                ...baseItems.slice(1),
            ];
        }

        if (role === 'logistics') {
            return [
                ...baseItems.slice(0, 1),
                { label: 'Requests', path: '/logistics' },
                { label: 'Supply Map', path: '/supply-map' },
                { label: 'Analytics', path: '/analytics' },
                ...baseItems.slice(2),
            ];
        }

        return [...baseItems.slice(0, 1), { label: 'Analytics', path: '/analytics' }, ...baseItems.slice(1)];
    };

    const getExploreItems = () => {
        const items = [
            { label: 'Forecasts', path: '/analytics' },
            { label: 'Bulk Pricing', path: '/bulk-pricing' },
            { label: 'Demand & Supply', path: '/demand-supply' },
            { label: 'Recommendations', path: '/season-recommendations' },
            { label: 'Market Insights', path: '/market-insights' },
            { label: 'Supply Heatmap', path: '/supply-map' },
            { label: 'Subscriptions', path: '/subscriptions' },
        ];

        if (role === 'buyer') {
            return items;
        }

        if (role === 'farmer') {
            return items.filter((item) => item.path !== '/buy');
        }

        return items.filter((item) => item.path !== '/subscriptions');
    };

    const navItems = getNavItems();
    const exploreItems = getExploreItems();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 hover:bg-gray-100 rounded-md"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            <h1
                                onClick={() => navigate('/dashboard')}
                                className="ml-2 text-2xl font-bold text-green-600 cursor-pointer hover:text-green-700"
                            >
                                eHarvest
                            </h1>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            {navItems.map((item) => (
                                <button
                                    key={`${item.path}-${item.label}`}
                                    onClick={() => navigate(item.path)}
                                    className={`transition-colors ${location.pathname === item.path
                                        ? 'text-green-600 font-semibold'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 hover:bg-gray-100 rounded-full relative">
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="hidden sm:flex items-center space-x-2">
                                <User size={20} />
                                <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div className="mt-4 md:hidden space-y-4">
                            <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={`${item.path}-${item.label}`}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`block w-full text-left px-4 py-2 rounded-md transition-colors ${location.pathname === item.path
                                            ? 'bg-green-50 text-green-600 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                            <div>
                                <p className="px-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Explore
                                </p>
                                <div className="mt-2 space-y-2">
                                    {exploreItems.map((item) => (
                                        <button
                                            key={item.path}
                                            onClick={() => {
                                                navigate(item.path);
                                                setIsMenuOpen(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 rounded-md transition-colors ${location.pathname === item.path
                                                ? 'bg-green-50 text-green-600 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="border-b bg-white/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex gap-2 overflow-x-auto">
                        {exploreItems.map((item) => {
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={`${item.path}-${item.label}`}
                                    onClick={() => navigate(item.path)}
                                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-green-600 text-white'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">eHarvest</h3>
                            <p className="text-gray-400 text-sm">
                                Connecting farmers, buyers, and logistics providers
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <div className="space-y-2 text-sm text-gray-400">
                                {navItems.slice(0, 5).map((item) => (
                                    <button
                                        key={`${item.path}-${item.label}`}
                                        onClick={() => navigate(item.path)}
                                        className="block hover:text-white"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Insights</h4>
                            <div className="space-y-2 text-sm text-gray-400">
                                {exploreItems.slice(0, 4).map((item) => (
                                    <button
                                        key={`${item.path}-${item.label}`}
                                        onClick={() => navigate(item.path)}
                                        className="block hover:text-white"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">More</h4>
                            <div className="space-y-2 text-sm text-gray-400">
                                {exploreItems.slice(4).map((item) => (
                                    <button
                                        key={`${item.path}-${item.label}`}
                                        onClick={() => navigate(item.path)}
                                        className="block hover:text-white"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                        <p>&copy; 2024 eHarvest. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
