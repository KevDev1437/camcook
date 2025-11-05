const express = require('express');
const restaurantContext = require('../middleware/restaurantContext');
const questionController = require('../controllers/question.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes pour les questions sur les plats - Multi-Tenant
 * 
 * restaurantContext.optional : Le restaurantId est optionnel mais utilisé pour filtrer
 * si disponible. Cela permet de sécuriser l'accès aux questions d'autres restaurants.
 */

// POST /api/questions - Créer une nouvelle question (authentifié)
// restaurantContext.optional : vérifie que le menuItem appartient au restaurant
router.post('/', restaurantContext.optional, protect, questionController.createQuestion);

// GET /api/menu-items/:menuItemId/questions - Récupérer toutes les questions d'un plat (public)
// restaurantContext.optional : filtre par restaurant si disponible
router.get('/menu-items/:menuItemId', restaurantContext.optional, questionController.getMenuItemQuestions);

// GET /api/menu-items/:menuItemId/questions/stats - Obtenir les stats des questions (public)
// restaurantContext.optional : filtre par restaurant si disponible
router.get('/menu-items/:menuItemId/stats', restaurantContext.optional, questionController.getQuestionStats);

// GET /api/questions/:questionId - Récupérer une question spécifique (public)
// restaurantContext.optional : vérifie que la question appartient au restaurant
router.get('/:questionId', restaurantContext.optional, questionController.getQuestion);

// PUT /api/questions/:questionId - Mettre à jour une question (authentifié)
// restaurantContext.optional : vérifie que la question appartient au restaurant
router.put('/:questionId', restaurantContext.optional, protect, questionController.updateQuestion);

// DELETE /api/questions/:questionId - Supprimer une question (authentifié ou admin)
// restaurantContext.optional : vérifie que la question appartient au restaurant
router.delete('/:questionId', restaurantContext.optional, protect, questionController.deleteQuestion);

// POST /api/questions/:questionId/answer - Répondre à une question (Admin/Staff)
// restaurantContext.optional : vérifie que la question appartient au restaurant
router.post('/:questionId/answer', restaurantContext.optional, protect, questionController.answerQuestion);

module.exports = router;
