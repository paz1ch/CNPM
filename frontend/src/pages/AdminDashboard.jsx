import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import api from '../config/api';
import DroneCard from '../components/DroneCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ProductCard from '../components/ProductCard';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('drones');
    const [drones, setDrones] = useState([]);
    const [orders, setOrders] = useState([]);
    const [missions, setMissions] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // New drone form
    const [newDrone, setNewDrone] = useState({
        name: '',
        battery: 100,
        location: { lat: 10.762622, lng: 106.660172 }
    });

    // New product form
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        imageUrl: '',
        stock: 10,
        restaurantId: ''
    });

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setNewDrone(prev => ({
                        ...prev,
                        location: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    }));
                },
                (error) => {
                    alert('Error getting location: ' + error.message);
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    useEffect(() => {
        // Get user role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || 'user');
    }, []);

    useEffect(() => {
        if (activeTab === 'drones') {
            fetchDrones();
        } else if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'missions') {
            fetchMissions();
        } else if (activeTab === 'restaurants') {
            fetchRestaurants();
        } else if (activeTab === 'products') {
            fetchProducts();
            fetchRestaurants(); // Fetch restaurants for the dropdown
        }
    }, [activeTab]);

    const fetchDrones = async () => {
        try {
            setLoading(true);
            const response = await api.get('/drones');
            setDrones(response.data.data || response.data.drones || []);
            setError('');
        } catch (err) {
            console.error('Error fetching drones:', err);
            setError('Failed to load drones');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // Admin users should fetch all orders; regular users fetch their own
            const savedUser = localStorage.getItem('user');
            let response;
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    if (parsed.role === 'admin') {
                        response = await api.get('/orders/all');
                    } else {
                        response = await api.get('/orders/user');
                    }
                } catch (e) {
                    response = await api.get('/orders/user');
                }
            } else {
                response = await api.get('/orders/user');
            }

            setOrders(response.data.orders || []);
            setError('');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };
    const fetchMissions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/missions');
            setMissions(res.data.data || res.data.missions || []);
            setError('');
        } catch (err) {
            console.error('Error fetching missions:', err);
            setError('Failed to load missions');
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const response = await api.get('/restaurants');
            setRestaurants(response.data.restaurants || []);
            setError('');
        } catch (err) {
            console.error('Error fetching restaurants:', err);
            setError('Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            setProducts(response.data.data.products || []);
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDrone = async (e) => {
        e.preventDefault();
        try {
            await api.post('/drones', newDrone);
            setNewDrone({ name: '', battery: 100, location: { lat: 10.762622, lng: 106.660172 } });
            fetchDrones();
        } catch (err) {
            alert('Failed to add drone: ' + (err.response?.data?.message || err.message));
        }
    };
    const handleEditDrone = async (drone) => {
        const name = window.prompt('Drone name:', drone.name);
        if (name === null) return;
        const batteryStr = window.prompt('Battery % (0-100):', drone.battery);
        if (batteryStr === null) return;
        const battery = parseInt(batteryStr);

        try {
            await api.put(`/drones/${drone._id}`, { name, battery });
            fetchDrones();
        } catch (err) {
            alert('Failed to edit drone: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteDrone = async (drone) => {
        if (!window.confirm(`Delete drone ${drone.name}? This is irreversible.`)) return;
        try {
            await api.delete(`/drones/${drone._id}`);
            fetchDrones();
        } catch (err) {
            alert('Failed to delete drone: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSetDroneStatus = async (drone, status) => {
        try {
            await api.patch(`/drones/${drone._id}/status`, { status });
            fetchDrones();
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAssignMission = async (order) => {
        const pickupLat = window.prompt('Pickup latitude (restaurant):', '10.762622');
        if (pickupLat === null) return;
        const pickupLng = window.prompt('Pickup longitude (restaurant):', '106.660172');
        if (pickupLng === null) return;
        const deliveryLat = window.prompt('Delivery latitude (customer):', '10.780000');
        if (deliveryLat === null) return;
        const deliveryLng = window.prompt('Delivery longitude (customer):', '106.690000');
        if (deliveryLng === null) return;

        const body = {
            orderId: order.orderID,
            pickupLocation: { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
            deliveryLocation: { lat: parseFloat(deliveryLat), lng: parseFloat(deliveryLng) }
        };

        try {
            const res = await api.post('/missions', body);
            alert('Mission assigned: ' + (res.data?.data?.message || 'OK'));
            fetchMissions();
        } catch (err) {
            alert('Failed to assign mission: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleToggleProductStatus = async (product) => {
        const newStatus = !product.isAvailable;
        const action = newStatus ? 'Show' : 'Hide';
        if (!window.confirm(`Are you sure you want to ${action} this product?`)) return;

        try {
            await api.put(`/products/${product._id}`, { isAvailable: newStatus });
            fetchProducts();
        } catch (err) {
            alert(`Failed to ${action} product: ` + (err.response?.data?.message || err.message));
        }
    };

    const handleEditRestaurant = async (restaurant) => {
        const name = window.prompt('Restaurant Name:', restaurant.name);
        if (name === null) return;
        const address = window.prompt('Restaurant Address:', restaurant.address);
        if (address === null) return;

        try {
            await api.put(`/restaurants/${restaurant._id}`, { name, address });
            fetchRestaurants();
        } catch (err) {
            alert('Failed to edit restaurant: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteRestaurant = async (restaurant) => {
        if (!window.confirm(`Delete restaurant ${restaurant.name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/restaurants/${restaurant._id}`);
            fetchRestaurants();
        } catch (err) {
            alert('Failed to delete restaurant: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', newProduct);
            setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 10, restaurantId: '' });
            fetchProducts();
        } catch (err) {
            alert('Failed to add product: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditProduct = async (product) => {
        const name = window.prompt('Product Name:', product.name);
        if (name === null) return;
        const priceStr = window.prompt('Price:', product.price);
        if (priceStr === null) return;
        const price = parseFloat(priceStr);
        if (isNaN(price)) { alert('Invalid price'); return; }

        const description = window.prompt('Description:', product.description);
        if (description === null) return;
        const category = window.prompt('Category:', product.category);
        if (category === null) return;
        const image = window.prompt('Image URL:', product.image);
        if (image === null) return;

        try {
            await api.put(`/products/${product._id}`, { name, price, description, category, image });
            fetchProducts();
        } catch (err) {
            alert('Failed to edit product: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`Delete product ${product.name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/products/${product._id}`);
            fetchProducts();
        } catch (err) {
            alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-secondary mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
                {['drones', 'orders', 'missions', 'restaurants', 'products'].map((tab) => (
                    <motion.button
                        key={tab}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-semibold capitalize transition-all whitespace-nowrap ${activeTab === tab
                            ? 'border-b-4 border-primary text-primary'
                            : 'text-gray-600 hover:text-primary'
                            }`}
                    >
                        {tab}
                    </motion.button>
                ))}
            </div>

            {/* Drones Tab */}
            {activeTab === 'drones' && (
                <div>
                    {/* Add Drone Form */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-premium p-6 mb-8"
                    >
                        <h3 className="text-2xl font-bold text-secondary mb-4">Add New Drone</h3>
                        <form onSubmit={handleAddDrone} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Drone Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Drone-Alpha-01"
                                    value={newDrone.name}
                                    onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-gray-700">Initial Location</label>
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                                    >
                                        📍 Get Current Location
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Latitude</span>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Latitude"
                                            value={newDrone.location.lat}
                                            onChange={(e) => setNewDrone({ ...newDrone, location: { ...newDrone.location, lat: parseFloat(e.target.value) } })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Longitude</span>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Longitude"
                                            value={newDrone.location.lng}
                                            onChange={(e) => setNewDrone({ ...newDrone, location: { ...newDrone.location, lng: parseFloat(e.target.value) } })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="md:col-span-2 bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg"
                            >
                                Add Drone
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Drones List */}
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {drones.length > 0 ? (
                                drones.map((drone, index) => (
                                    <motion.div
                                        key={drone._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <DroneCard
                                            drone={drone}
                                            onEdit={handleEditDrone}
                                            onDelete={handleDeleteDrone}
                                            onSetStatus={handleSetDroneStatus}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-xl text-gray-500">No drones available</p>
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
                                                {userRole === 'admin' && (
                                                    <p className="text-xs text-gray-400 mt-1">User: {order.userID}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => handleAssignMission(order)}
                                                className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-semibold"
                                            >
                                                Assign Drone / Create Mission
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-xl text-gray-500">No orders yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Missions Tab */}
            {activeTab === 'missions' && (
                <div>
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">{error}</div>
                    ) : (
                        <div className="space-y-4">
                            {missions.length > 0 ? (
                                missions.map((m) => (
                                    <div key={m._id} className="bg-white rounded-2xl shadow-premium p-6">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold">Mission for Order {m.orderId}</h3>
                                                <p className="text-sm text-gray-500">Status: {m.status}</p>
                                                <p className="text-sm text-gray-500">Drone: {m.drone?.name || m.drone}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={async () => {
                                                    try {
                                                        await api.patch(`/missions/${m._id}/status`, { status: 'IN_PROGRESS' });
                                                        fetchMissions();
                                                    } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
                                                }} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg">Start</button>
                                                <button onClick={async () => {
                                                    if (!window.confirm('Cancel mission?')) return;
                                                    try {
                                                        await api.delete(`/missions/${m._id}`);
                                                        fetchMissions();
                                                    } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
                                                }} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-xl text-gray-500">No missions found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Restaurants Tab */}
            {activeTab === 'restaurants' && (
                <div>
                    {/* Add Restaurant Form */}


                    {/* Restaurants List */}
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {restaurants.length > 0 ? (
                                restaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-2xl shadow-premium p-6 relative"
                                    >
                                        <h3 className="text-xl font-bold text-secondary mb-2">{restaurant.name}</h3>
                                        <p className="text-gray-600 mb-2">{restaurant.address}</p>
                                        <p className="text-xs text-gray-400">ID: {restaurant._id}</p>

                                        <div className="mt-4 flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEditRestaurant(restaurant)}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRestaurant(restaurant)}
                                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-xl text-gray-500">No restaurants available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div>
                    {/* Add Product Form */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-premium p-6 mb-8"
                    >
                        <h3 className="text-2xl font-bold text-secondary mb-4">Add New Product</h3>
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Spicy Chicken Burger"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 9.99"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    placeholder="Product description..."
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Burgers"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    value={newProduct.imageUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 50"
                                    value={newProduct.stock}
                                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                                <select
                                    value={newProduct.restaurantId}
                                    onChange={(e) => setNewProduct({ ...newProduct, restaurantId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a Restaurant</option>
                                    {restaurants.map((r) => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="md:col-span-2 bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg"
                            >
                                Add Product
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
                                        className={`relative ${!product.isAvailable ? 'opacity-60' : ''}`}
                                    >
                                        <ProductCard product={product} showAddToCart={false} />
                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                            <button
                                                onClick={() => handleToggleProductStatus(product)}
                                                className={`p-2 rounded-full shadow-lg transition-colors ${product.isAvailable
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    }`}
                                                title={product.isAvailable ? "Hide Product" : "Show Product"}
                                            >
                                                {product.isAvailable ? '🚫' : '✅'}
                                            </button>
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="p-2 rounded-full shadow-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                title="Edit Product"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product)}
                                                className="p-2 rounded-full shadow-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                title="Delete Product"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-xl text-gray-500">No products available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;