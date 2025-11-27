import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { getCartCount } = useCart();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const cartCount = getCartCount();

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate('/login');
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md shadow-premium sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <motion.div
                            whileHover={{ rotate: 20, scale: 1.1 }}
                            className="text-3xl"
                        >
                            🚁
                        </motion.div>
                        <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            DroneFood
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/tracking">Track Order</NavLink>
                        {user?.role === 'admin' && <NavLink to="/admin">Admin Dashboard</NavLink>}
                        {user?.role === 'restaurant' && <NavLink to="/restaurant">Restaurant Dashboard</NavLink>}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-2xl relative"
                            >
                                🛒
                                {cartCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </motion.button>
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 bg-gradient-primary text-white px-4 py-2 rounded-full font-semibold shadow-md"
                                >
                                    <span>👤</span>
                                    <span className="hidden sm:inline">{user.name || user.email}</span>
                                </motion.button>

                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-premium-lg border border-gray-100 py-2"
                                    >
                                        {user?.role === 'user' && (
                                            <Link
                                                to="/tracking"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                                            >
                                                My Orders
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                                        >
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-primary text-white px-6 py-2 rounded-full font-semibold shadow-md"
                                >
                                    Login
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, children }) => (
    <Link to={to}>
        <motion.span
            whileHover={{ y: -2 }}
            className="text-gray-700 font-semibold hover:text-primary transition-colors relative group"
        >
            {children}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
        </motion.span>
    </Link>
);

export default Navbar;
