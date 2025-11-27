import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent navigation when clicking add to cart
        addToCart(product);
    };

    const handleCardClick = () => {
        navigate(`/product/${product._id || product.id}`);
    };

    return (
        <motion.div
            whileHover={{ y: -10, boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)' }}
            transition={{ duration: 0.3 }}
            onClick={handleCardClick}
            className="bg-white rounded-2xl shadow-premium overflow-hidden cursor-pointer"
        >
            <div className="relative overflow-hidden h-48">
                <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    src={product.image || product.imageUrl || 'https://via.placeholder.com/400x300'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
                {product.category && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-secondary">
                        {product.category}
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-secondary line-clamp-1">
                        {product.name}
                    </h3>
                    <span className="text-xl font-bold text-primary whitespace-nowrap ml-2">
                        ${product.price?.toFixed(2) || '0.00'}
                    </span>
                </div>

                {product.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {product.description}
                    </p>
                )}

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow"
                >
                    Add to Cart
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
