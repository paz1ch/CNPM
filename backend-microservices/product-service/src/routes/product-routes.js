const express = require('express');
const {createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getProductsByRestaurant, getProductsByCategory, addProductReview, getAllCategories} = require('../controllers/product-controller')
const {authenticateRequest} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateRequest);

router.post('/create-product', createProduct);

module.exports = router;