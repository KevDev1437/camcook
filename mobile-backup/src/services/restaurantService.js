import api from '../config/api';

export const restaurantService = {
  // Get all restaurants
  getRestaurants: async (filters = {}) => {
    try {
      const response = await api.get('/restaurants', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get restaurant by ID
  getRestaurantById: async (id) => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get menu items for a restaurant
  getMenuItems: async (restaurantId) => {
    try {
      const response = await api.get(`/menus/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
