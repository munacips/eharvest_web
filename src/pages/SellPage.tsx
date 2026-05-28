import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProductService, AIService } from '../services';
import type { Produce } from '../types';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SellForm {
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
    grade: string;
    harvestDate: string;
    availableDate: string;
    description: string;
}

export const SellPage: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Produce[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
    const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm<SellForm>();

    const productName = watch('name');
    const quantity = watch('quantity');

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (productName && quantity) {
            getPricePreduction();
        }
    }, [productName, quantity]);

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            if (user?.id) {
                const farmerProducts = await ProductService.getFarmerProduce(user.id);
                setProducts(farmerProducts);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPricePreduction = async () => {
        try {
            const prediction = await AIService.predictPrice(productName, quantity);
            setPredictedPrice(prediction.predictedPrice);
        } catch (error) {
            console.error('Failed to get price prediction:', error);
        }
    };

    const onSubmit = async (data: SellForm) => {
        try {
            await ProductService.createProduce({
                ...data,
                farmerId: user?.id,
            });
            reset();
            setShowForm(false);
            loadProducts();
        } catch (error) {
            console.error('Failed to create product:', error);
            alert('Failed to create product');
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-900">Manage Listings</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>{showForm ? 'Cancel' : 'New Listing'}</span>
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                                    <input
                                        {...register('name', { required: 'Required' })}
                                        type="text"
                                        placeholder="e.g., Tomatoes"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        {...register('category', { required: 'Required' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Select category</option>
                                        <option value="Vegetables">Vegetables</option>
                                        <option value="Fruits">Fruits</option>
                                        <option value="Grains">Grains</option>
                                        <option value="Dairy">Dairy</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (kg)</label>
                                    <input
                                        {...register('quantity', { required: 'Required', valueAsNumber: true })}
                                        type="number"
                                        placeholder="100"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price ($)</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            {...register('unitPrice', { required: 'Required', valueAsNumber: true })}
                                            type="number"
                                            step="0.01"
                                            placeholder="5.99"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        {predictedPrice && (
                                            <div className="bg-green-50 px-3 py-2 rounded-lg flex items-center space-x-1 text-green-700 text-sm font-medium">
                                                <TrendingUp size={16} />
                                                <span>Suggested: ${predictedPrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                                    <select
                                        {...register('grade', { required: 'Required' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Select grade</option>
                                        <option value="A">Grade A</option>
                                        <option value="B">Grade B</option>
                                        <option value="C">Grade C</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
                                    <input
                                        {...register('harvestDate', { required: 'Required' })}
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Date</label>
                                    <input
                                        {...register('availableDate', { required: 'Required' })}
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    {...register('description')}
                                    placeholder="Add details about your product..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Listing'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Products List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">My Listings</h2>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No listings yet. Create your first one!</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{product.quantity} kg</td>
                                            <td className="px-4 py-3 text-sm font-medium text-green-600">${product.unitPrice.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm">{product.grade}</td>
                                            <td className="px-4 py-3 text-sm flex space-x-2">
                                                <button className="p-2 hover:bg-blue-50 rounded text-blue-600">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
