import api from '../config/api';

export const questionService = {
  /**
   * Créer une nouvelle question sur un plat
   */
  createQuestion: async (menuItemId, text) => {
    try {
      const response = await api.post('/questions', {
        menuItemId,
        text
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer toutes les questions pour un plat
   * @param {number} menuItemId - ID du plat
   * @param {object} options - limit, offset, showUnanswered
   */
  getMenuItemQuestions: async (menuItemId, options = {}) => {
    try {
      const response = await api.get(
        `/questions/menu-items/${menuItemId}`,
        { params: options }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer les stats des questions pour un plat
   */
  getQuestionStats: async (menuItemId) => {
    try {
      const response = await api.get(
        `/questions/menu-items/${menuItemId}/stats`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Récupérer une question spécifique
   */
  getQuestion: async (questionId) => {
    try {
      const response = await api.get(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Mettre à jour une question
   */
  updateQuestion: async (questionId, data) => {
    try {
      const response = await api.put(`/questions/${questionId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Supprimer une question
   */
  deleteQuestion: async (questionId) => {
    try {
      const response = await api.delete(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Répondre à une question (Admin/Staff)
   */
  answerQuestion: async (questionId, answer) => {
    try {
      const response = await api.post(
        `/questions/${questionId}/answer`,
        { answer }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
