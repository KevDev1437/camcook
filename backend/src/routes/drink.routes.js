const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const {
  getAllDrinks,
  getDrinkById,
  createDrink,
  updateDrink,
  deleteDrink
} = require('../controllers/drink.controller');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques (lecture) - restaurantContext requis pour filtrer par restaurant
router.get('/', restaurantContext.required, getAllDrinks);
router.get('/:id', restaurantContext.required, getDrinkById);

// Routes protégées (adminrestaurant/superadmin) - restaurantContext requis + auth
router.post('/', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), createDrink);
router.put('/:id', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), updateDrink);
router.delete('/:id', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), deleteDrink);

module.exports = router;
