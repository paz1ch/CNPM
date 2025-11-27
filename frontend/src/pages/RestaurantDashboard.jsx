import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ProductCard from '../components/ProductCard';

const RestaurantDashboard = () => {
    const [activeTab, setActiveTab] = useState('menu');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restaurantId, setRestaurantId] = useState(null);

    // New product form
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        image: ''
    });

    useEffect(() => {
        const fetchRestaurantId = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'restaurant') {
                if (user.restaurantID) {
                    setRestaurantId(user.restaurantID);
                } else {
                    try {
                        // Fetch restaurant by ownerId (which is the user's ID)
                        const userId = user.userId || user._id;
                        if (!userId) return;

                        const response = await api.get(`/restaurants?ownerId=${userId}`);
                        if (response.data.restaurants && response.data.restaurants.length > 0) {
                            setRestaurantId(response.data.restaurants[0]._id);
                        } else {
                            setError('No restaurant found for this user. Please contact admin.');
                        }
                    } catch (err) {
                        console.error('Error fetching restaurant ID:', err);
                        setError('Failed to load restaurant profile.');
                    } finally {
                        // If we still don't have an ID, stop loading so error shows
                        if (!user.restaurantID) setLoading(false);
                    }
                }
            } else {
                setLoading(false);
            }
        };
        fetchRestaurantId();
    }, []);

    useEffect(() => {
        if (!restaurantId) return;

        if (activeTab === 'menu') {
            fetchProducts();
        } else if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab, restaurantId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            // Use the endpoint to get products by restaurant
            const response = await api.get(`/products/restaurant/${restaurantId}`);
            setProducts(response.data.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // Use the endpoint to get orders by restaurant
            // Note: The backend controller `getOrdersByRestaurant` uses req.user.restaurantID if param is not provided
            // But here we might need to pass it or rely on token. 
            // Let's try calling with param if we have it, or just /orders/restaurant/my (if endpoint existed)
            // The controller `getOrdersByRestaurant` is mapped to `GET /restaurant/:restaurantId` or similar?
            // Let's check routes. Assuming `GET /orders/restaurant/:restaurantId`
            const response = await api.get(`/orders/restaurant/${restaurantId}`);
            setOrders(response.data.orders || []);
            setError('');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', {
                ...newProduct,
                restaurantId: restaurantId
            });
            setNewProduct({ name: '', price: '', description: '', category: '', image: '' });
            fetchProducts();
        } catch (err) {
            alert('Failed to add product: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-secondary mb-8">Restaurant Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                {['menu', 'orders'].map((tab) => (
                    <motion.button
                        key={tab}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-semibold capitalize transition-all ${activeTab === tab
                            ? 'border-b-4 border-primary text-primary'
                            : 'text-gray-600 hover:text-primary'
                            }`}
                    >
                        {tab === 'menu' ? 'My Menu' : 'Incoming Orders'}
                    </motion.button>
                ))}
            </div>

            {/* Menu Tab */}
            {activeTab === 'menu' && (
                <div>
                    {/* Add Product Form */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-premium p-6 mb-8"
                    >
                        <h3 className="text-2xl font-bold text-secondary mb-4">Add New Item</h3>
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Dish Name"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Category (e.g., Main, Drink)"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={newProduct.image}
                                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg md:col-span-3"
                            >
                                Add to Menu
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Products List */}
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.length > 0 ? (
                                products.map((product, index) => (
                                    <motion.div
                                        key={product._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative"
                                    >
                                        <ProductCard product={product} />
                                        <button
                                            onClick={() => handleDeleteProduct(product._id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-xl text-gray-500">No items in menu</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div>
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <motion.div
                                        key={order.orderID}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white rounded-2xl shadow-premium p-6"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-secondary mb-2">
                                                    Order #{order.orderID}
                                                </h3>
                                                <p className="text-gray-600 mb-3">
                                                    {order.items.length} items • ${order.totalAmount.toFixed(2)}
                                                </p>
                                                <OrderStatusBadge status={order.status} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">User: {order.userID}</p>
                                            </div>
                                        </div>

                                        {/* Order Actions for Restaurant */}
                                        <div className="mt-4 flex gap-2">
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleUpdateOrderStatus(order.orderID, 'Preparing')}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                                                >
                                                    Accept & Prepare
                                                </button>
                                            )}
                                            {order.status === 'Preparing' && (
                                                <button
                                                    onClick={() => handleUpdateOrderStatus(order.orderID, 'Ready')}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-xl text-gray-500">No incoming orders</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RestaurantDashboard;
