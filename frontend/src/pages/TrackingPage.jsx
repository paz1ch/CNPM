import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrackingMap from '../components/TrackingMap';
import OrderStatusBadge from '../components/OrderStatusBadge';
import api from '../config/api';

const TrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [orderStatus, setOrderStatus] = useState('Pending');
    const [droneData, setDroneData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(15);

    // Fetch user's orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders/user');
                if (response.data && response.data.orders) {
                    setOrders(response.data.orders);
                    // If no orderId is selected but we have orders, select the first one
                    if (!orderId && response.data.orders.length > 0) {
                        navigate(`/tracking/${response.data.orders[0].orderID}`);
                    }
                }
            } catch (err) {
                console.error('Error fetching orders:', err);
            }
        };
        fetchOrders();
    }, [navigate, orderId]);

    // Poll for updates for the specific order
    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // The drone service exposes mission status at /api/v1/missions/order/:orderId
                // Gateway maps /v1 -> /api/v1 so call /missions/order/:orderId
                const response = await api.get(`/missions/order/${orderId}`);

                if (response.data && response.data.success) {
                    const mission = response.data.data || response.data.delivery || null;

                    if (mission) {
                        // mission.drone is populated with Drone model which contains currentLocation
                        const drone = mission.drone || {};
                        const location = (drone.currentLocation && { lat: drone.currentLocation.lat, lng: drone.currentLocation.lng })
                            || mission.deliveryLocation
                            || mission.pickupLocation
                            || { lat: 10, lng: 10 };

                        setDroneData({
                            droneName: drone.name || 'Drone',
                            battery: drone.batteryLevel ?? drone.battery ?? 100,
                            location,
                            status: mission.status || drone.status || 'PENDING',
                            restaurantLocation: mission.pickupLocation,
                            customerLocation: mission.deliveryLocation
                        });

                        // Normalize status for UI
                        const normalizedStatus = (mission.status === 'IN_PROGRESS' || mission.status === 'DELIVERING' || mission.status === 'PENDING')
                            ? (mission.status === 'IN_PROGRESS' ? 'DELIVERING' : mission.status)
                            : mission.status;

                        setOrderStatus(normalizedStatus || 'Pending');
                        setEstimatedTime(mission.estimatedTravelTime || mission.estimatedTime || 0);
                        setError('');
                    } else {
                        // If no mission found, try to get order status from order service
                        try {
                            const orderRes = await api.get(`/orders/${orderId}`);
                            if (orderRes.data && orderRes.data.order) {
                                setOrderStatus(orderRes.data.order.status);
                                // Also set locations if available in order
                                if (orderRes.data.order.restaurantLocation && orderRes.data.order.customerLocation) {
                                    setDroneData(prev => ({
                                        ...prev,
                                        restaurantLocation: orderRes.data.order.restaurantLocation,
                                        customerLocation: orderRes.data.order.customerLocation,
                                        // Default drone location to restaurant if not started
                                        location: orderRes.data.order.restaurantLocation
                                    }));
                                }
                            }
                        } catch (e) {
                            console.error("Could not fetch order details", e);
                        }
                        setError('No drone assigned yet. Please wait...');
                    }
                } else {
                    // Fallback to check order status directly if mission not found
                    try {
                        const orderRes = await api.get(`/orders/${orderId}`);
                        if (orderRes.data && orderRes.data.order) {
                            setOrderStatus(orderRes.data.order.status);
                            if (orderRes.data.order.restaurantLocation && orderRes.data.order.customerLocation) {
                                setDroneData(prev => ({
                                    ...prev,
                                    restaurantLocation: orderRes.data.order.restaurantLocation,
                                    customerLocation: orderRes.data.order.customerLocation,
                                    location: orderRes.data.order.restaurantLocation
                                }));
                            }
                        }
                    } catch (e) {
                        console.error("Could not fetch order details", e);
                    }
                    setError(response.data?.message || 'No drone assigned yet. Please wait...');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load order details');
                setLoading(false);
            }
        };

        // Initial fetch
        fetchData();

        // Poll every 5 seconds
        const interval = setInterval(fetchData, 5000);

        return () => clearInterval(interval);
    }, [orderId]);

    const droneLocation = droneData?.location || { lat: 10.762622, lng: 106.660172 };
    const selectedOrder = orders.find(o => o.orderID === orderId);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-secondary mb-8"
            >
                Track Your Order 📦
            </motion.h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Order List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Orders</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {orders.map((order) => (
                            <div
                                key={order.orderID}
                                onClick={() => navigate(`/tracking/${order.orderID}`)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${orderId === order.orderID
                                    ? 'border-primary bg-orange-50 shadow-md'
                                    : 'border-transparent bg-white hover:bg-gray-50 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono font-bold text-sm text-gray-600">#{order.orderID.slice(-6)}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p className="font-semibold text-gray-800 mt-1">${order.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No orders found.</p>
                        )}
                    </div>
                </div>

                {/* Main Tracking Area */}
                <div className="lg:col-span-3">
                    {orderId ? (
                        <>
                            <div className="mb-6">
                                <p className="text-gray-600">
                                    Viewing Order: <span className="font-mono font-semibold text-primary">{orderId}</span>
                                </p>
                            </div>


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
                                    </motion.div>

                                    {droneData && estimatedTime > 0 && orderStatus !== 'Delivered' && (
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

                                    {droneData && orderStatus !== 'Delivered' && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-blue-50 p-5 rounded-2xl border border-blue-100"
                                        >
                                            <div className="flex items-center space-x-4 mb-4">
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
                                                            {droneData.battery.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confirm Delivery Button */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await api.put(`/orders/${orderId}/status`, { status: 'Delivered' });
                                                        if (res.data) {
                                                            setOrderStatus('Delivered');
                                                            // Optionally refresh page or state
                                                        }
                                                    } catch (err) {
                                                        console.error("Failed to confirm delivery", err);
                                                        alert("Failed to confirm delivery");
                                                    }
                                                }}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                                            >
                                                <span>🎁</span>
                                                <span>Confirm Delivery Received</span>
                                            </button>
                                        </motion.div>
                                    )}

                                    {orderStatus === 'Delivered' && (
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

                                    {/* Order Items List */}
                                    {selectedOrder && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.25 }}
                                            className="bg-white p-6 rounded-2xl shadow-premium"
                                        >
                                            <h3 className="text-gray-500 text-sm uppercase font-bold mb-4">Order Details</h3>
                                            <div className="space-y-3">
                                                {selectedOrder.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className="text-gray-700 font-medium">
                                                                {item.name || `Item ${item.menuItemId.slice(-4)}`}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-600">${item.price}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold text-gray-800">
                                                    <span>Total</span>
                                                    <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
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
                                            restaurantLocation={droneData?.restaurantLocation}
                                            customerLocation={droneData?.customerLocation}
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-3xl shadow-premium">
                            <div className="text-6xl mb-4">👈</div>
                            <h2 className="text-2xl font-bold text-gray-700">Select an order to track</h2>
                            <p className="text-gray-500 mt-2">Choose an order from the list on the left to see details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;
