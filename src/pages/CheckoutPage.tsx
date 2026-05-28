import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, AlertCircle } from 'lucide-react';
import { OrderService, PaymentService, ProductService } from '../services';
import type { Produce } from '../types';

export const CheckoutPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'USD' | 'ZIG'>('USD');
    const [productMap, setProductMap] = useState<Record<string, Produce>>({});
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const cart = location.state?.cart || {};
    const cartItems = Object.entries(cart) as Array<[string, number]>;

    useEffect(() => {
        const loadProducts = async () => {
            if (cartItems.length === 0) {
                setProductMap({});
                return;
            }

            try {
                setIsLoadingProducts(true);
                const products = await Promise.all(
                    cartItems.map(async ([productId]) => ProductService.getProduceById(productId))
                );

                setProductMap(
                    products.reduce<Record<string, Produce>>((acc, product) => {
                        acc[product.id] = product;
                        return acc;
                    }, {})
                );
            } catch (err) {
                console.error('Failed to load checkout products:', err);
                setError('Could not load the latest product details for checkout.');
            } finally {
                setIsLoadingProducts(false);
            }
        };

        void loadProducts();
    }, [location.key]);

    const totals = useMemo(() => {
        const subtotal = cartItems.reduce((sum, [productId, quantity]) => {
            const product = productMap[productId];
            return sum + (product ? product.unitPrice * quantity : 0);
        }, 0);

        const shipping = subtotal > 0 ? Math.min(Math.max(subtotal * 0.05, 3), 25) : 0;
        const tax = subtotal * 0.03;

        return {
            subtotal,
            shipping,
            tax,
            total: subtotal + shipping + tax,
        };
    }, [cartItems, productMap]);

    const handlePlaceOrder = async () => {
        if (!shippingAddress) {
            setError('Please enter a shipping address');
            return;
        }

        try {
            setIsProcessing(true);
            setError('');

            const order = await OrderService.createOrder({
                items: cartItems.map(([id, qty]) => ({ produceId: id, quantity: qty })),
                shippingAddress,
            });

            try {
                const payment = await PaymentService.initiatePayment(order.id, totals.total, paymentMethod);
                const reference = payment.paymentId || order.id;

                if (payment.redirectUrl) {
                    window.location.href = payment.redirectUrl;
                    return;
                }

                navigate(`/payment-return?reference=${encodeURIComponent(reference)}`);
            } catch {
                navigate(`/payment-return?reference=${encodeURIComponent(order.id)}`);
            }
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                            <textarea
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                placeholder="Enter your delivery address..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <ShoppingCart size={24} />
                                <span>Order Items</span>
                            </h2>

                            {isLoadingProducts ? (
                                <div className="text-center py-8 text-gray-500">Loading cart items...</div>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Your cart is empty</p>
                                    <button
                                        onClick={() => navigate('/buy')}
                                        className="mt-4 text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cartItems.map(([productId, quantity]) => (
                                        <div key={productId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {productMap[productId]?.name ?? `Product ${productId}`}
                                                </p>
                                                <p className="text-sm text-gray-600">Qty: {quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-green-700">
                                                    $
                                                    {(
                                                        (productMap[productId]?.unitPrice ?? 0) * quantity
                                                    ).toFixed(2)}
                                                </span>
                                                <button className="p-2 hover:bg-red-50 rounded text-red-600">
                                                <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
                            <div className="space-y-3">
                                <label className="flex items-center p-4 border-2 border-green-500 bg-green-50 rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        value="USD"
                                        checked={paymentMethod === 'USD'}
                                        onChange={(e) => setPaymentMethod(e.target.value as 'USD' | 'ZIG')}
                                        className="mr-3"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">USD Wallet</p>
                                        <p className="text-sm text-gray-600">Pay with USD currency</p>
                                    </div>
                                </label>
                                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50">
                                    <input
                                        type="radio"
                                        value="ZIG"
                                        checked={paymentMethod === 'ZIG'}
                                        onChange={(e) => setPaymentMethod(e.target.value as 'USD' | 'ZIG')}
                                        className="mr-3"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">ZIG Wallet</p>
                                        <p className="text-sm text-gray-600">Pay with ZIG currency</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-3 pb-4 border-b">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">${totals.shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium">${totals.tax.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 mb-6">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={isProcessing || cartItems.length === 0}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-bold"
                        >
                            {isProcessing ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
