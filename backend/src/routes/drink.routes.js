const express = require('express');
const router = express.Router();
const {
  getAllDrinks,
  getDrinkById,
  createDrink,
  updateDrink,
  deleteDrink
} = require('../controllers/drink.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllDrinks);
router.get('/:id', getDrinkById);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createDrink);
router.put('/:id', protect, authorize('admin'), updateDrink);
router.delete('/:id', protect, authorize('admin'), deleteDrink);

module.exports = router;






