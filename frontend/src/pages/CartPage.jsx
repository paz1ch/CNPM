import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CartPage = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { loading } = useAuth();
    const token = localStorage.getItem('authToken');

    if (loading) {
        return <div className="text-center py-20">Loading...</div>;
    }

    if (!token) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <h2 className="text-3xl font-bold text-secondary mb-4">Please Login</h2>
                <p className="text-gray-600 mb-8">You need to be logged in to view your cart.</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="bg-gradient-primary text-white px-8 py-3 rounded-full font-semibold shadow-lg"
                >
                    Login Now
                </motion.button>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-8xl mb-6"
                >
                    🛒
                </motion.div>
                <h2 className="text-3xl font-bold text-secondary mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Add some delicious items to get started!</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="bg-gradient-primary text-white px-8 py-3 rounded-full font-semibold shadow-lg"
                >
                    Browse Menu
                </motion.button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold text-secondary mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-2xl shadow-premium p-6 flex gap-4"
                        >
                            <img
                                src={item.image || item.imageUrl || 'https://via.placeholder.com/150'}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-xl"
                            />

                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-secondary mb-1">{item.name}</h3>
                                <p className="text-primary font-bold text-lg mb-3">${item.price.toFixed(2)}</p>

                                <div className="flex items-center space-x-3">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                    >
                                        −
                                    </motion.button>
                                    <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold"
                                    >
                                        +
                                    </motion.button>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-between">
                                <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="text-red-500 hover:text-red-700 text-2xl"
                                >
                                    🗑️
                                </button>
                                <p className="text-xl font-bold text-secondary">
                                    ${(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2"
                    >
                        🗑️ Clear Cart
                    </motion.button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-premium p-6 sticky top-24">
                        <h3 className="text-2xl font-bold text-secondary mb-6">Order Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-green-600">FREE 🚁</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between text-xl font-bold">
                                    <span className="text-secondary">Total</span>
                                    <span className="text-primary">${getCartTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/checkout')}
                            className="w-full bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            Proceed to Checkout
                        </motion.button>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full mt-3 text-gray-600 hover:text-gray-800 font-semibold py-2"
                        >
                            ← Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
