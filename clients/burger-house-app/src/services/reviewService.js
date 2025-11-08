import api from '../config/api';

export const reviewService = {
  /**
   * Créer un nouvel avis pour un plat
   */
  createReview: async (menuItemId, data) => {
    try {
      const response = await api.post('/reviews', {
        menuItemId,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer tous les avis pour un plat
   * @param {number} menuItemId - ID du plat
   * @param {object} options - limit, offset
   */
  getMenuItemReviews: async (menuItemId, options = {}) => {
    try {
      const response = await api.get(
        `/reviews/menu-items/${menuItemId}`,
        { params: options }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer les stats des avis pour un plat
   */
  getReviewStats: async (menuItemId) => {
    try {
      const response = await api.get(
        `/reviews/menu-items/${menuItemId}/stats`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer un avis spécifique
   */
  getReview: async (reviewId) => {
    try {
      const response = await api.get(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Mettre à jour un avis
   */
  updateReview: async (reviewId, data) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Supprimer un avis
   */
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
