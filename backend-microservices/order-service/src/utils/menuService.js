import axios from 'axios';
import { restaurantServiceUrl } from './axiosInstances.js';
import logger from './logger.js';

// Get menu item details from restaurant service
export const getMenuItemsDetails = async (menuItemId) => {
    try {
        const response = await restaurantServiceUrl.get(`menu/menu-items/$menuItemId`,);
        return response.data;
    } catch (error) {
        console.error('Error fetching menu item ${menuItemId}:', error.message);
        throw new Error('Failed to fetch menu item details');
    }
};

//get restaurant details from restaurant service
export const getRestaurantDetails = async (restaurantId) => {
    try {
        const response = await restaurantServiceUrl.get(`/restaurants/${restaurantId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching restaurant ${restaurantId}:', error.message);
        throw new Error('Failed to fetch restaurant details');
    }
};