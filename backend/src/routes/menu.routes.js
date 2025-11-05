const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validateImageUpload, uploadLimiter } = require('../middleware/uploadValidator');
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

// Protected routes (restaurant owner) avec validation des uploads
router.post('/', protect, authorize('restaurant', 'admin'), uploadLimiter, validateImageUpload, createMenuItem);
router.put('/:id', protect, authorize('restaurant', 'admin'), uploadLimiter, validateImageUpload, updateMenuItem);
router.delete('/:id', protect, authorize('restaurant', 'admin'), deleteMenuItem);

module.exports = router;
