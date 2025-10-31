import api from '../config/api';

export const authService = {
  // Register new user
  register: async (name, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
