const express = require('express');
const router = express.Router();
const {
  getAllAccompaniments,
  getAccompanimentById,
  createAccompaniment,
  updateAccompaniment,
  deleteAccompaniment
} = require('../controllers/accompaniment.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllAccompaniments);
router.get('/:id', getAccompanimentById);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createAccompaniment);
router.put('/:id', protect, authorize('admin'), updateAccompaniment);
router.delete('/:id', protect, authorize('admin'), deleteAccompaniment);

module.exports = router;


