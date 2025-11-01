const express = require('express');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByRestaurant,
    getProductsByCategory,
    getAllCategories,
} = require('../controllers/product-controller');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);
router.get('/restaurant/:restaurantId', getProductsByRestaurant);
router.get('/category/:categoryName', getProductsByCategory);

// Private routes
router.post('/', protect, checkRole(['admin', 'restaurant']), createProduct);
router.put('/:id', protect, checkRole(['admin', 'restaurant']), updateProduct);
router.delete('/:id', protect, checkRole(['admin', 'restaurant']), deleteProduct);


module.exports = router;
