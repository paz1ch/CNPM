import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrackingMap from '../components/TrackingMap';
import OrderStatusBadge from '../components/OrderStatusBadge';
import api from '../config/api';

const TrackingPage = () => {
    const { orderId } = useParams();
    const [orderStatus, setOrderStatus] = useState('Pending');
    const [droneData, setDroneData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(15);

    // Poll for drone location updates every 2 seconds
    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchDeliveryStatus = async () => {
            try {
                const response = await api.get(`/drones/delivery/${orderId}`);

                if (response.data.success) {
                    const delivery = response.data.delivery;
                    setDroneData(delivery);
                    setOrderStatus(delivery.status === 'BUSY' ? 'DELIVERING' : delivery.status);
                    setEstimatedTime(delivery.estimatedTime || 0);
                    setError('');
                } else {
                    setError(response.data.message);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching delivery status:', err);
                setError('No drone assigned yet. Please wait...');
                setLoading(false);
            }
        };

        // Initial fetch
        fetchDeliveryStatus();

        // Poll every 2 seconds
        const interval = setInterval(fetchDeliveryStatus, 2000);

        return () => clearInterval(interval);
    }, [orderId]);

    const droneLocation = droneData?.location || { lat: 10, lng: 10 };
    const customerLocation = { lat: 80, lng: 80 }; // Should come from order data

    return (
        <div className="max-w-6xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-secondary mb-8"
            >
                Track Your Order 📦
            </motion.h1>

            {orderId && (
                <div className="mb-6">
                    <p className="text-gray-600">
                        Order ID: <span className="font-mono font-semibold text-primary">{orderId}</span>
                    </p>
                </div>
            )}

            {error && !droneData && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-2xl mb-8">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">⏳</span>
                        <div>
                            <p className="font-semibold">{error}</p>
                            <p className="text-sm mt-1">Your order is being prepared. A drone will be assigned soon!</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Status Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white p-6 rounded-2xl shadow-premium"
                    >
                        <h3 className="text-gray-500 text-sm uppercase font-bold mb-3">Status</h3>
                        <OrderStatusBadge status={orderStatus} />
                        {orderId && (
                            <p className="text-gray-400 text-sm mt-3">Order #{orderId}</p>
                        )}
                    </motion.div>

                    {droneData && estimatedTime > 0 && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-primary p-6 rounded-2xl shadow-premium text-white"
                        >
                            <h3 className="text-white/80 text-sm uppercase font-bold mb-2">Estimated Arrival</h3>
                            <div className="text-5xl font-bold mb-1">{estimatedTime} min</div>
                            <p className="text-white/90 text-sm">Drone is on the way 🚁</p>
                        </motion.div>
                    )}

                    {droneData && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-50 p-5 rounded-2xl border border-blue-100"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                                    🚁
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-blue-900 text-lg">{droneData.droneName}</p>
                                    <div className="flex items-center mt-1">
                                        <span className="text-xs text-blue-700 font-semibold mr-2">Battery:</span>
                                        <div className="flex-1 bg-blue-200 rounded-full h-2 max-w-[100px]">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${droneData.battery}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-blue-700 font-semibold ml-2">
                                            {droneData.battery}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {orderStatus === 'DELIVERED' && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-50 p-6 rounded-2xl border-2 border-green-200 text-center"
                        >
                            <div className="text-6xl mb-3">✅</div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">Delivered!</h3>
                            <p className="text-green-700">Enjoy your meal!</p>
                        </motion.div>
                    )}
                </div>

                {/* Map Panel */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <TrackingMap
                            droneLocation={droneLocation}
                            customerLocation={customerLocation}
                        />
                    </motion.div>

                    {!loading && !droneData && !orderId && (
                        <div className="mt-8 text-center py-12 bg-white rounded-2xl shadow-premium">
                            <p className="text-gray-500 text-lg mb-4">No active delivery to track</p>
                            <p className="text-gray-400">Place an order to see real-time tracking</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;
