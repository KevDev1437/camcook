const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMenuByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menu.controller');

const router = express.Router();

// Public routes
router.get('/restaurant/:restaurantId', getMenuByRestaurant);
router.get('/:id', getMenuItemById);

// Protected routes (restaurant owner)
router.post('/', protect, authorize('restaurant', 'admin'), createMenuItem);
router.put('/:id', protect, authorize('restaurant', 'admin'), updateMenuItem);
router.delete('/:id', protect, authorize('restaurant', 'admin'), deleteMenuItem);

module.exports = router;
