const { restaurantService } = require('./axiosInstances');
const logger = require('./logger');

// Get menu item details from restaurant service
const getMenuItemsDetails = async (menuItemId) => {
    try {
        const response = await restaurantService.get(`/menu/menu-items/${menuItemId}`);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching menu item ${menuItemId}: ${error.message}`);
        throw new Error(`Failed to fetch menu item details: ${error.message}`);
    }
};

//get restaurant details from restaurant service
const getRestaurantDetails = async (restaurantId) => {
    try {
        const response = await restaurantService.get(`/restaurants/${restaurantId}`);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching restaurant ${restaurantId}: ${error.message}`);
        throw new Error(`Failed to fetch restaurant details: ${error.message}`);
    }
};

module.exports = {
    getMenuItemsDetails,
    getRestaurantDetails
};