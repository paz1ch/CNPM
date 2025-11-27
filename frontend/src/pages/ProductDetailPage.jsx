import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data.data || response.data.product);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart({ ...product, quantity });
            // Optional: Show success message or redirect
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <button
                onClick={() => navigate(-1)}
                className="text-primary hover:underline"
            >
                Go Back
            </button>
        </div>
    );
    if (!product) return null;

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-gray-600 hover:text-primary transition-colors"
            >
                ← Back to Menu
            </button>

            <div className="bg-white rounded-3xl shadow-premium overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="h-[400px] md:h-[600px] relative overflow-hidden">
                        <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            src={product.image || product.imageUrl || 'https://via.placeholder.com/600x600'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                {product.category && (
                                    <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                                        {product.category}
                                    </span>
                                )}
                                {product.restaurantId && (
                                    <span className="bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-sm font-semibold">
                                        Restaurant Item
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl font-bold text-secondary mb-4">
                                {product.name}
                            </h1>

                            <p className="text-3xl font-bold text-primary mb-6">
                                ${product.price?.toFixed(2)}
                            </p>

                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                {product.description || 'No description available for this delicious item.'}
                            </p>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-6 mb-8">
                                <span className="font-semibold text-gray-700">Quantity:</span>
                                <div className="flex items-center border border-gray-300 rounded-xl">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 hover:bg-gray-100 transition-colors rounded-l-xl"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 font-semibold text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 hover:bg-gray-100 transition-colors rounded-r-xl"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddToCart}
                                className="w-full bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Add to Cart - ${(product.price * quantity).toFixed(2)}
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
