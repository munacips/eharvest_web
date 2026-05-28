import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProductService } from '../services';
import type { Produce } from '../types';
import { Filter, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const BuyPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<Produce[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Produce[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                const response = await ProductService.getAllProduce(1, 20);
                setProducts(response.data);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadProducts();
    }, []);

    useEffect(() => {
        const filtered = products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            const matchesPrice = product.unitPrice >= priceRange[0] && product.unitPrice <= priceRange[1];
            return matchesSearch && matchesCategory && matchesPrice;
        });

        setFilteredProducts(filtered);
    }, [searchTerm, selectedCategory, priceRange, products]);

    const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();

    const addToCart = (productId: string) => {
        if (user?.role !== 'buyer') {
            return;
        }

        setCart((prev) => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1,
        }));
    };

    const handleCheckout = () => {
        navigate('/checkout', { state: { cart } });
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-900">Browse Produce</h1>
                    <button
                        onClick={handleCheckout}
                        disabled={Object.keys(cart).length === 0 || user?.role !== 'buyer'}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                        <ShoppingCart size={20} />
                        <span>Checkout ({Object.keys(cart).length})</span>
                    </button>
                </div>

                {user?.role !== 'buyer' && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        Browsing is available for your account, but checkout is reserved for buyers.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Filter size={20} />
                            <span>Filters</span>
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                        className="w-full"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                    setPriceRange([0, 1000]);
                                }}
                                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading products...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No products found matching your filters</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        inCart={cart[product.id] || 0}
                                        canPurchase={user?.role === 'buyer'}
                                        onAddToCart={() => addToCart(product.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const ProductCard: React.FC<{
    product: Produce;
    inCart: number;
    canPurchase: boolean;
    onAddToCart: () => void;
}> = ({ product, inCart, canPurchase, onAddToCart }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">🌾</div>
        <div className="p-4">
            <h3 className="font-bold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.category}</p>
            <p className="text-xs text-gray-500 mt-1">Grade: {product.grade}</p>
            <p className="text-xs text-gray-500">From: {product.farmerName}</p>

            <div className="mt-4 flex justify-between items-center">
                <div>
                    <p className="text-2xl font-bold text-green-600">${product.unitPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                </div>
                <div className="flex flex-col items-end">
                    {inCart > 0 && (
                        <span className="text-sm font-medium text-green-600 mb-2">In cart: {inCart}</span>
                    )}
                    <button
                        onClick={onAddToCart}
                        disabled={!canPurchase}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                    >
                        {canPurchase ? 'Add to Cart' : 'View Only'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);
