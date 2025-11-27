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
        imageUrl: ''
    });

    // ... (useEffect hooks)

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        address: '',
        imageUrl: ''
    });

    const [restaurantInfo, setRestaurantInfo] = useState(null);

    useEffect(() => {
        const fetchRestaurantId = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'restaurant') {
                if (user.restaurantID) {
                    setRestaurantId(user.restaurantID);
                    // Fetch full info if we only have ID
                    try {
                        const res = await api.get(`/restaurants/${user.restaurantID}`);
                        setRestaurantInfo(res.data.restaurant);
                    } catch (e) {
                        console.error("Failed to fetch restaurant details", e);
                    }
                    setLoading(false);
                } else {
                    try {
                        const userId = user.userId || user._id;
                        if (!userId) {
                            setError('User ID not found');
                            setLoading(false);
                            return;
                        }

                        const response = await api.get(`/restaurants?ownerId=${userId}`);
                        if (response.data.restaurants && response.data.restaurants.length > 0) {
                            const restaurant = response.data.restaurants[0];
                            setRestaurantId(restaurant._id);
                            setRestaurantInfo(restaurant);
                        } else {
                            // No restaurant found, stay in "create" mode
                        }
                    } catch (err) {
                        console.error('Error fetching restaurant ID:', err);
                        setError('Failed to load restaurant profile.');
                    } finally {
                        setLoading(false);
                    }
                }
            } else {
                setLoading(false);
            }
        };
        fetchRestaurantId();
    }, []);

    // ... (other useEffects)

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/restaurants', {
                ...newRestaurant,
                location: { lat: 10.762622, lng: 106.660172 } // Default location (HCMC)
            });
            setRestaurantId(response.data.restaurant._id);
            setRestaurantInfo(response.data.restaurant);
            alert('Restaurant profile created successfully!');
        } catch (err) {
            console.error('Create restaurant error:', err);
            alert('Failed to create restaurant: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchProducts = async () => {
        console.log('Fetching products for Restaurant ID:', restaurantId);
        if (!restaurantId) return;
        try {
            // Use the correct endpoint for fetching products by restaurant
            const res = await api.get(`/products/restaurant/${restaurantId}`);
            console.log('Fetch products response:', res.data);
            // API returns { success: true, data: [...] }
            setProducts(res.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!restaurantId) return;
        try {
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            // Handle potential response structures
            setOrders(res.data.orders || res.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (restaurantId) {
            if (activeTab === 'menu') {
                fetchProducts();
            } else if (activeTab === 'orders') {
                fetchOrders();
            }
        }
    }, [activeTab, restaurantId]);

    const handleAddProduct = async (e) => {
        e.preventDefault();

        console.log('Submitting product with Restaurant ID:', restaurantId, 'Type:', typeof restaurantId);

        if (!restaurantId) {
            alert('Error: Restaurant ID is missing. Please reload the page.');
            return;
        }

        try {
            await api.post('/products', {
                ...newProduct,
                stock: 100, // Default stock
                restaurantId: String(restaurantId) // Ensure it's a string
            });
            setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '' });
            fetchProducts();
        } catch (err) {
            console.error('Add product error:', err);
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
        <div className="max-w-7xl mx-auto pb-20"> {/* Added padding bottom */}
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
                    {/* Create Restaurant Form OR Add Product Form */}
                    {!restaurantId ? (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-premium p-6 mb-8"
                        >
                            <h3 className="text-2xl font-bold text-secondary mb-4">Create Restaurant Profile</h3>
                            <p className="text-gray-600 mb-6">You need to create a restaurant profile before adding menu items.</p>
                            <form onSubmit={handleCreateRestaurant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Restaurant Name"
                                    value={newRestaurant.name}
                                    onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={newRestaurant.address}
                                    onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg md:col-span-2"
                                >
                                    Create Profile
                                </motion.button>
                            </form>
                        </motion.div>
                    ) : (
                        <>
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
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="Main">Main Course</option>
                                        <option value="Appetizer">Appetizer</option>
                                        <option value="Dessert">Dessert</option>
                                        <option value="Drink">Drink</option>
                                        <option value="Side">Side Dish</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Image URL"
                                        value={newProduct.imageUrl}
                                        onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent md:col-span-2"
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
                        </>
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

            {/* Restaurant Info Footer */}
            {restaurantInfo && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-secondary">{restaurantInfo.name}</h3>
                            <p className="text-sm text-gray-500">{restaurantInfo.address}</p>
                        </div>
                        <div className="text-sm text-gray-400">
                            Restaurant ID: {restaurantInfo._id}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantDashboard;
