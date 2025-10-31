const express = require('express');
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes pour les avis sur les plats
 */

// POST /api/reviews - Créer un nouvel avis
router.post('/', protect, reviewController.createReview);

// GET /api/menu-items/:menuItemId/reviews - Récupérer tous les avis d'un plat
router.get('/menu-items/:menuItemId', reviewController.getMenuItemReviews);

// GET /api/menu-items/:menuItemId/reviews/stats - Obtenir les stats des avis
router.get('/menu-items/:menuItemId/stats', reviewController.getReviewStats);

// GET /api/reviews/:reviewId - Récupérer un avis spécifique
router.get('/:reviewId', reviewController.getReview);

// PUT /api/reviews/:reviewId - Mettre à jour un avis (authentifié)
router.put('/:reviewId', protect, reviewController.updateReview);

// DELETE /api/reviews/:reviewId - Supprimer un avis (authentifié)
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;
