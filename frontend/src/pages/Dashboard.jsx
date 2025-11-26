import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../config/api';
import DroneCard from '../components/DroneCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('drones');
    const [drones, setDrones] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New drone form
    const [newDrone, setNewDrone] = useState({
        name: '',
        battery: 100,
        location: { lat: 10.762622, lng: 106.660172 }
    });

    useEffect(() => {
        if (activeTab === 'drones') {
            fetchDrones();
        } else if (activeTab === 'orders') {
            fetchOrders();
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
            const response = await api.get('/orders/user');
            setOrders(response.data.orders || []);
            setError('');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
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

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-secondary mb-8">Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                {['drones', 'orders', 'products'].map((tab) => (
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

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-2xl shadow-premium p-8 text-center">
                    <p className="text-xl text-gray-500">Product management coming soon...</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
