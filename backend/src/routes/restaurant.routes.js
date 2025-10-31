const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getCamCookRestaurant,
  getCamCookMenu
} = require('../controllers/restaurant.controller');

const router = express.Router();

// Public routes - CamCook only
router.get('/info', getCamCookRestaurant);
router.get('/menu', getCamCookMenu);
router.get('/:id/menu', getCamCookMenu); // Alternative pour compatibilité

module.exports = router;
