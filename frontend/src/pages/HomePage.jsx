import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../config/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const categories = ['All', 'Burger', 'Pizza', 'Sushi', 'Drinks', 'Dessert'];

// Mock fallback data
const MOCK_PRODUCTS = [
    { _id: '1', name: 'Premium Burger', price: 12.99, image: 'https://via.placeholder.com/400x300?text=Premium+Burger', category: 'Burger', description: 'Delicious burger with premium ingredients' },
    { _id: '2', name: 'Spicy Pizza', price: 15.99, image: 'https://via.placeholder.com/400x300?text=Spicy+Pizza', category: 'Pizza', description: 'Hot and spicy pizza with fresh toppings' },
    { _id: '3', name: 'Sushi Set', price: 22.99, image: 'https://via.placeholder.com/400x300?text=Sushi+Set', category: 'Sushi', description: 'Fresh sushi set with variety of rolls' },
    { _id: '4', name: 'Cold Brew', price: 5.99, image: 'https://via.placeholder.com/400x300?text=Cold+Brew', category: 'Drinks', description: 'Refreshing cold brew coffee' },
    { _id: '5', name: 'Chocolate Cake', price: 7.99, image: 'https://via.placeholder.com/400x300?text=Chocolate+Cake', category: 'Dessert', description: 'Rich chocolate cake' },
    { _id: '6', name: 'Cheese Burger', price: 10.99, image: 'https://via.placeholder.com/400x300?text=Cheese+Burger', category: 'Burger', description: 'Classic cheeseburger' },
];

const HomePage = () => {
    const [products, setProducts] = useState(MOCK_PRODUCTS); // Initialize with mock data
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            // Check for nested data structure from backend (response.data.data.products)
            const fetchedProducts = response.data?.data?.products || response.data?.products || [];

            // Ensure we have an array
            if (Array.isArray(fetchedProducts) && fetchedProducts.length > 0) {
                setProducts(fetchedProducts);
                setError('');
            } else {
                // Keep mock data if API returns empty
                setError('Using sample data - API returned empty');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products from server - Using sample data');
            // Keep the mock data (already initialized)
        } finally {
            setLoading(false);
        }
    };

    // Ensure filteredProducts is always an array
    const filteredProducts = selectedCategory === 'All'
        ? (Array.isArray(products) ? products : [])
        : (Array.isArray(products) ? products.filter(p => p.category === selectedCategory) : []);


    return (
        <div>
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-[500px] rounded-3xl overflow-hidden mb-12 shadow-premium-lg"
            >
                <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600"
                    alt="Hero"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl md:text-6xl font-bold mb-4"
                        >
                            Taste the Future 🚁
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl md:text-2xl mb-8"
                        >
                            Drone delivery in under 30 minutes
                        </motion.p>
                        <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-gradient-primary px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-primary/50 transition-all"
                        >
                            Order Now
                        </motion.button>
                    </div>
                </div>
            </motion.section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {[
                    { icon: '🚁', title: 'Fast Delivery', desc: 'Under 30 minutes' },
                    { icon: '🔥', title: 'Fresh Food', desc: 'Prepared with love' },
                    { icon: '💯', title: 'Quality', desc: 'Premium ingredients' },
                ].map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-premium p-6 text-center hover:shadow-premium-lg transition-shadow"
                    >
                        <div className="text-5xl mb-3">{feature.icon}</div>
                        <h3 className="text-xl font-bold text-secondary mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.desc}</p>
                    </motion.div>
                ))}
            </section>

            {/* Menu Section */}
            <section id="menu">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-4xl font-bold text-secondary">Our Menu</h2>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {categories.map(cat => (
                            <motion.button
                                key={cat}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2 rounded-full font-semibold transition-all ${selectedCategory === cat
                                    ? 'bg-gradient-primary text-white shadow-lg'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Error message hidden - using mock data during development */}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {!loading && filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-500">No products found in this category</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;
