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
    uploadImage,
} = require('../controllers/product-controller');
const { protect, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

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
router.post('/upload', protect, checkRole(['admin', 'restaurant']), upload.single('image'), uploadImage);


module.exports = router;
