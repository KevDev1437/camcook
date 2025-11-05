const express = require('express');
const restaurantContext = require('../middleware/restaurantContext');
const reviewController = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes pour les avis sur les plats - Multi-Tenant
 * 
 * restaurantContext.optional : Le restaurantId est optionnel mais utilisé pour filtrer
 * si disponible. Cela permet de sécuriser l'accès aux reviews d'autres restaurants.
 */

// POST /api/reviews - Créer un nouvel avis (authentifié)
// restaurantContext.optional : vérifie que le menuItem appartient au restaurant
router.post('/', restaurantContext.optional, protect, reviewController.createReview);

// GET /api/menu-items/:menuItemId/reviews - Récupérer tous les avis d'un plat (public)
// restaurantContext.optional : filtre par restaurant si disponible
router.get('/menu-items/:menuItemId', restaurantContext.optional, reviewController.getMenuItemReviews);

// GET /api/menu-items/:menuItemId/reviews/stats - Obtenir les stats des avis (public)
// restaurantContext.optional : filtre par restaurant si disponible
router.get('/menu-items/:menuItemId/stats', restaurantContext.optional, reviewController.getReviewStats);

// GET /api/reviews/:reviewId - Récupérer un avis spécifique (public)
// restaurantContext.optional : vérifie que le review appartient au restaurant
router.get('/:reviewId', restaurantContext.optional, reviewController.getReview);

// PUT /api/reviews/:reviewId - Mettre à jour un avis (authentifié)
// restaurantContext.optional : vérifie que le review appartient au restaurant
router.put('/:reviewId', restaurantContext.optional, protect, reviewController.updateReview);

// DELETE /api/reviews/:reviewId - Supprimer un avis (authentifié ou admin)
// restaurantContext.optional : vérifie que le review appartient au restaurant
router.delete('/:reviewId', restaurantContext.optional, protect, reviewController.deleteReview);

module.exports = router;
