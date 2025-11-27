import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyA81ehjfUrZJ65iNbBgjWAmSBumY8g-oks"
    });

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

    const [formData, setFormData] = useState({
        restaurantID: '',
        postal_code_of_restaurant: '70000',
        deliveryAddress: '',
        restaurantAddress: '',
        paymentMethod: 'Credit Card',
    });

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await api.get('/restaurants');
            const restaurantList = response.data.restaurants || [];
            setRestaurants(restaurantList);

            if (restaurantList.length > 0) {
                const first = restaurantList[0];
                setSelectedRestaurant(first);
                setFormData(prev => ({
                    ...prev,
                    restaurantID: first._id,
                    restaurantAddress: first.address
                }));
            }
        } catch (err) {
            console.error('Error fetching restaurants:', err);
        }
    };

    const handleRestaurantChange = (e) => {
        const restaurantId = e.target.value;
        const restaurant = restaurants.find(r => r._id === restaurantId);
        if (restaurant) {
            setSelectedRestaurant(restaurant);
            setFormData(prev => ({
                ...prev,
                restaurantID: restaurant._id,
                restaurantAddress: restaurant.address
            }));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!user) {
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) {
            setError('Your cart is empty');
            setLoading(false);
            return;
        }

        try {
            // Geocode addresses
            let restaurantLocation = null;
            let customerLocation = null;

            try {
                // Use selected restaurant's location if available, otherwise geocode
                if (selectedRestaurant && selectedRestaurant.location) {
                    restaurantLocation = selectedRestaurant.location;
                } else {
                    restaurantLocation = await geocodeAddress(formData.restaurantAddress);
                }

                customerLocation = await geocodeAddress(formData.deliveryAddress);
            } catch (geoError) {
                console.error('Geocoding error:', geoError);
                // Fallback or alert user - for now we proceed but log error
                // You might want to stop submission here if location is critical
            }

            // Create order
            const orderData = {
                restaurantID: formData.restaurantID,
                postal_code_of_restaurant: formData.postal_code_of_restaurant,
                restaurantLocation,
                customerLocation,
                items: cartItems.map(item => ({
                    menuItemId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            const orderResponse = await api.post('/orders/create', orderData);
            const order = orderResponse.data.orderDetails;

            // Create payment - use the MongoDB _id (ObjectId) for payments
            const paymentData = {
                orderId: order._id,
                paymentMethod: formData.paymentMethod,
                amount: getCartTotal(),
            };

            await api.post('/payment', paymentData);

            // Clear cart and redirect to tracking
            clearCart();
            navigate(`/tracking/${order.orderID}`);
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.message || 'Failed to complete checkout');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="text-center py-20">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Please login to continue</h2>
                <button
                    onClick={() => navigate('/login')}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-semibold"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-premium p-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Select Restaurant
                                </label>
                                <select
                                    name="restaurantID"
                                    value={formData.restaurantID}
                                    onChange={handleRestaurantChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a restaurant</option>
                                    {restaurants.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Restaurant Address
                                </label>
                                <input
                                    type="text"
                                    name="restaurantAddress"
                                    value={formData.restaurantAddress}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Delivery Address
                                </label>
                                <input
                                    type="text"
                                    name="deliveryAddress"
                                    value={formData.deliveryAddress}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                    placeholder="Enter your delivery address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Postal Code
                                </label>
                                <input
                                    type="text"
                                    name="postal_code_of_restaurant"
                                    value={formData.postal_code_of_restaurant}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option>Credit Card</option>
                                    <option>Debit Card</option>
                                    <option>Cash/COD</option>
                                    <option>Momo</option>
                                    <option>ZaloPay</option>
                                    <option>VNPay</option>
                                </select>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </motion.button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-premium p-6 sticky top-8">
                        <h3 className="text-xl font-bold text-secondary mb-4">Order Summary</h3>

                        <div className="space-y-3 mb-6">
                            {cartItems.map((item) => (
                                <div key={item._id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.name} x {item.quantity}
                                    </span>
                                    <span className="font-semibold text-secondary">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-secondary">Total</span>
                                <span className="text-primary">${getCartTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
