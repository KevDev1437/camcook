/**
 * Restaurant Service - Multi-Tenant
 * 
 * Ce service gère les appels API pour les restaurants.
 * Toutes les requêtes incluent le header X-Restaurant-Id pour identifier le restaurant.
 * 
 * IMPORTANT : Le restaurantId doit être fourni en paramètre ou via restaurant.config.js
 */

import api from '../config/api';
import { getRestaurantId } from '../config/restaurant.config';

const restaurantService = {
  /**
   * Get restaurant info
   * @param {number} restaurantId - Restaurant ID (optionnel, utilise restaurant.config.js si non fourni)
   * @returns {Promise<Object>} Restaurant data
   */
  getRestaurantInfo: async (restaurantId = null) => {
    try {
      const effectiveRestaurantId = restaurantId || getRestaurantId();
      
      const response = await api.get('/restaurants/info', {
        headers: { 
          'X-Restaurant-Id': effectiveRestaurantId.toString()
        }
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get restaurant menu items
   * @param {number} restaurantId - Restaurant ID (optionnel, utilise restaurant.config.js si non fourni)
   * @returns {Promise<Object>} Menu items data
   */
  getMenuItems: async (restaurantId = null) => {
    try {
      const effectiveRestaurantId = restaurantId || getRestaurantId();
      
      const response = await api.get('/restaurants/menu', {
        headers: { 
          'X-Restaurant-Id': effectiveRestaurantId.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get menu item by ID (pour les détails)
   * @param {number} menuItemId - Menu item ID
   * @param {number} restaurantId - Restaurant ID (optionnel, utilise restaurant.config.js si non fourni)
   * @returns {Promise<Object>} Menu item data
   */
  getMenuItemById: async (menuItemId, restaurantId = null) => {
    try {
      const effectiveRestaurantId = restaurantId || getRestaurantId();
      
      const response = await api.get(`/menus/${menuItemId}`, {
        headers: { 
          'X-Restaurant-Id': effectiveRestaurantId.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default restaurantService;
