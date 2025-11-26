import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        restaurantID: 'R001', // Default restaurant
        postal_code_of_restaurant: '70000',
        paymentMethod: 'Credit Card',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            // Create order
            const orderData = {
                restaurantID: formData.restaurantID,
                postal_code_of_restaurant: formData.postal_code_of_restaurant,
                items: cartItems.map(item => ({
                    menuItemId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            const orderResponse = await api.post('/orders/create', orderData);
            const order = orderResponse.data.orderDetails;

            // Create payment
            const paymentData = {
                orderId: order.orderID,
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
                                    Restaurant ID
                                </label>
                                <input
                                    type="text"
                                    name="restaurantID"
                                    value={formData.restaurantID}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
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
