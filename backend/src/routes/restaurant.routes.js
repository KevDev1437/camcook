const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const {
  getRestaurantInfo,
  getRestaurantMenu,
  updateRestaurant,
  listRestaurants,
  getRestaurantBySlug
} = require('../controllers/restaurant.controller');

const router = express.Router();

// Public routes - avec restaurantContext requis
router.get('/info', restaurantContext.required, getRestaurantInfo);
router.get('/menu', restaurantContext.required, getRestaurantMenu);
router.get('/:id/menu', restaurantContext.required, getRestaurantMenu); // Alternative pour compatibilité

// Route publique pour obtenir un restaurant par son slug
router.get('/slug/:slug', getRestaurantBySlug);

// Route publique pour lister tous les restaurants (pour le futur marketplace)
router.get('/list', restaurantContext.optional, listRestaurants);

// Route protégée pour mettre à jour le restaurant (propriétaire ou admin)
router.put('/', 
  restaurantContext.required,
  protect,
  authorize('restaurant', 'admin'),
  updateRestaurant
);

module.exports = router;
