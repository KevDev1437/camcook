const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const {
  getAllAccompaniments,
  getAccompanimentById,
  createAccompaniment,
  updateAccompaniment,
  deleteAccompaniment
} = require('../controllers/accompaniment.controller');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques (lecture) - restaurantContext requis pour filtrer par restaurant
router.get('/', restaurantContext.required, getAllAccompaniments);
router.get('/:id', restaurantContext.required, getAccompanimentById);

// Routes protégées (admin/owner) - restaurantContext requis + auth
router.post('/', restaurantContext.required, protect, authorize('restaurant', 'admin'), createAccompaniment);
router.put('/:id', restaurantContext.required, protect, authorize('restaurant', 'admin'), updateAccompaniment);
router.delete('/:id', restaurantContext.required, protect, authorize('restaurant', 'admin'), deleteAccompaniment);

module.exports = router;
