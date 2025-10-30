const Product = require('../models/Product');
const logger = require('../utils/logger');
const { validateCreateProduct, validateUpdateProduct, validateCreateReview } = require('../utils/validation');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    logger.info('Create product endpoint hit');
    try {
        const { error } = validateCreateProduct(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const product = new Product({
            ...req.body,
        });

        await product.save();

        logger.info("Product created successfully", product);
        res.status(201).json({
            success: true,
            message: "Product created successfully",
        });
    } catch (error) {
        logger.error("Error creating product", error);
        res.status(500).json({
            success: false,
            message: "Error creating product",
        });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
    try {
        const pageSize = 10;
        const page = Number(req.query.pageNumber) || 1;

        const keyword = req.query.keyword
            ? {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i',
                },
            }
            : {};

        const count = await Product.countDocuments({ ...keyword });
        const products = await Product.find({ ...keyword })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: { products, page, pages: Math.ceil(count / pageSize) }
        });
    } catch (error) {
        logger.error('Error fetching all products', error);
        res.status(500).json({
            success: false,
            message: "Error fetching all products",
        });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: product
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
    } catch (error) {
        logger.error('Error fetching product by ID', error);
        res.status(500).json({
            success: false,
            message: "Error fetching product by ID",
        });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { error } = validateUpdateProduct(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const product = await Product.findById(req.params.id);

        if (product) {
            Object.assign(product, req.body);

            const updatedProduct = await product.save();
            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                data: updatedProduct
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
    } catch (error) {
        logger.error('Error updating product', error);
        res.status(500).json({
            success: false,
            message: "Error updating product",
        });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.remove();
            res.status(200).json({
                success: true,
                message: "Product removed successfully",
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
    } catch (error) {
        logger.error('Error deleting product', error);
        res.status(500).json({
            success: false,
            message: "Error deleting product",
        });
    }
};

// @desc    Get products by restaurant
// @route   GET /api/products/restaurant/:restaurantId
// @access  Public
const getProductsByRestaurant = async (req, res) => {
    try {
        const products = await Product.find({ restaurantId: req.params.restaurantId });
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        logger.error('Error fetching products by restaurant', error);
        res.status(500).json({
            success: false,
            message: "Error fetching products by restaurant",
        });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryName
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.categoryName });
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        logger.error('Error fetching products by category', error);
        res.status(500).json({
            success: false,
            message: "Error fetching products by category",
        });
    }
};


// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = async (req, res) => {
    try {
        const { error } = validateCreateReview(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const review = {
                userId: req.user._id, // Assuming req.user is available after auth middleware
                rating: Number(rating),
                comment,
            };

            product.reviews.push(review);

            product.ratings.count = product.reviews.length;
            product.ratings.average = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({
                success: true,
                message: "Review added successfully",
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
    } catch (error) {
        logger.error('Error adding product review', error);
        res.status(500).json({
            success: false,
            message: "Error adding product review",
        });
    }
};

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Public
const getAllCategories = async (req, res) => {
    try {
        const categories = await Product.find().distinct('category');
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        logger.error('Error fetching categories', error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
        });
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByRestaurant,
    getProductsByCategory,
    addProductReview,
    getAllCategories,
};