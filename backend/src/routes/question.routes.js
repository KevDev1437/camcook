const express = require('express');
const questionController = require('../controllers/question.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes pour les questions sur les plats
 */

// POST /api/questions - Créer une nouvelle question
router.post('/', protect, questionController.createQuestion);

// GET /api/menu-items/:menuItemId/questions - Récupérer toutes les questions d'un plat
router.get('/menu-items/:menuItemId', questionController.getMenuItemQuestions);

// GET /api/menu-items/:menuItemId/questions/stats - Obtenir les stats des questions
router.get('/menu-items/:menuItemId/stats', questionController.getQuestionStats);

// GET /api/questions/:questionId - Récupérer une question spécifique
router.get('/:questionId', questionController.getQuestion);

// PUT /api/questions/:questionId - Mettre à jour une question (authentifié)
router.put('/:questionId', protect, questionController.updateQuestion);

// DELETE /api/questions/:questionId - Supprimer une question (authentifié)
router.delete('/:questionId', protect, questionController.deleteQuestion);

// POST /api/questions/:questionId/answer - Répondre à une question (Admin/Staff)
router.post('/:questionId/answer', protect, questionController.answerQuestion);

module.exports = router;
