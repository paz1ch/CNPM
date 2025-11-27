import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import api from '../config/api';
import DroneCard from '../components/DroneCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ProductCard from '../components/ProductCard';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('drones');
    const [drones, setDrones] = useState([]);
    const [orders, setOrders] = useState([]);
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

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        address: '',
        imageUrl: ''
    });

    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        restaurantId: '',
        image: ''
    });

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyA81ehjfUrZJ65iNbBgjWAmSBumY8g-oks"
    });

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
        } else if (activeTab === 'restaurants') {
            fetchRestaurants();
        } else if (activeTab === 'products') {
            fetchProducts();
            fetchRestaurants(); // Need restaurants for dropdown
        }
    }, [activeTab]);

    const fetchDrones = async () => {
        try {
            setLoading(true);
            const response = await api.get('/drones');
            setDrones(response.data.drones || []);
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
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const endpoint = user.role === 'admin' ? '/orders/all' : '/orders/user';

            const response = await api.get(endpoint);
            setOrders(response.data.orders || []);
            setError('');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
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

    const geocodeAddress = async (address) => {
        if (!isLoaded || !window.google) return null;

        const geocoder = new window.google.maps.Geocoder();

        return new Promise((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    reject(new Error(`Geocoding failed for ${address}: ${status}`));
                }
            });
        });
    };

    const handleAddRestaurant = async (e) => {
        e.preventDefault();
        try {
            const location = await geocodeAddress(newRestaurant.address);
            if (!location) {
                alert('Could not geocode address');
                return;
            }

            await api.post('/restaurants', {
                ...newRestaurant,
                location
            });
            setNewRestaurant({ name: '', address: '', imageUrl: '' });
            fetchRestaurants();
        } catch (err) {
            alert('Failed to add restaurant: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', newProduct);
            setNewProduct({ name: '', price: '', description: '', category: '', restaurantId: '', image: '' });
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

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-secondary mb-8">Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
                {['drones', 'orders', 'restaurants', 'products'].map((tab) => (
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
                        <form onSubmit={handleAddDrone} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder="Drone Name (e.g., Drone-001)"
                                value={newDrone.name}
                                onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Battery %"
                                min="0"
                                max="100"
                                value={newDrone.battery}
                                onChange={(e) => setNewDrone({ ...newDrone, battery: parseInt(e.target.value) })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Latitude"
                                value={newDrone.location.lat}
                                onChange={(e) => setNewDrone({ ...newDrone, location: { ...newDrone.location, lat: parseFloat(e.target.value) } })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg"
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
                                        <DroneCard drone={drone} />
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

            {/* Restaurants Tab */}
            {activeTab === 'restaurants' && (
                <div>
                    {/* Add Restaurant Form */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-premium p-6 mb-8"
                    >
                        <h3 className="text-2xl font-bold text-secondary mb-4">Add New Restaurant</h3>
                        <form onSubmit={handleAddRestaurant} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                placeholder="Address (e.g., 123 Street, City)"
                                value={newRestaurant.address}
                                onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-lg"
                            >
                                Add Restaurant
                            </motion.button>
                        </form>
                    </motion.div>

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
                                        className="bg-white rounded-2xl shadow-premium p-6"
                                    >
                                        <h3 className="text-xl font-bold text-secondary mb-2">{restaurant.name}</h3>
                                        <p className="text-gray-600 mb-2">{restaurant.address}</p>
                                        <p className="text-xs text-gray-400">ID: {restaurant._id}</p>
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
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Product Name"
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
                                value={newProduct.restaurantId}
                                onChange={(e) => setNewProduct({ ...newProduct, restaurantId: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >
                                <option value="">Select Restaurant</option>
                                {restaurants.map(r => (
                                    <option key={r._id} value={r._id}>{r.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Category"
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

export default Dashboard;
