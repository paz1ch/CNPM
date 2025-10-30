const Joi = require('joi');

const addOnSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
});

const productSchema = Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    imageUrl: Joi.string().required(),
    category: Joi.string().trim().required(),
    restaurantId: Joi.string().required(),
    isAvailable: Joi.boolean().default(true),
    addOns: Joi.array().items(addOnSchema),
    isVegetarian: Joi.boolean().default(false),
    isHalal: Joi.boolean().default(false),
    stock: Joi.number().min(0).required(),
});

const validateCreateProduct = (data) => {
    return productSchema.validate(data);
};

module.exports = { validateCreateProduct };
