const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const { protect, authorize } = require('../middleware/auth');
const { validateImageUpload, uploadLimiter } = require('../middleware/uploadValidator');
const {
  getMenuByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menu.controller');

// Routes publiques (lecture) - restaurantContext requis pour filtrer par restaurant
router.get('/restaurant/:restaurantId', restaurantContext.required, getMenuByRestaurant);
router.get('/:id', restaurantContext.required, getMenuItemById);

// Routes protégées (restaurant owner) - restaurantContext requis + auth + validation uploads
router.post('/', 
  restaurantContext.required, 
  protect, 
  authorize('adminrestaurant', 'superadmin'), 
  uploadLimiter, 
  validateImageUpload, 
  createMenuItem
);

router.put('/:id', 
  restaurantContext.required, 
  protect, 
  authorize('adminrestaurant', 'superadmin'), 
  uploadLimiter, 
  validateImageUpload, 
  updateMenuItem
);

router.delete('/:id', 
  restaurantContext.required, 
  protect, 
  authorize('adminrestaurant', 'superadmin'), 
  deleteMenuItem
);

module.exports = router;
