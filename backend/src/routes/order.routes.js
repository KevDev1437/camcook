const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/order.controller');

const router = express.Router();

// Customer routes
router.post('/', protect, ctrl.create);
router.get('/my-orders', protect, ctrl.myOrders);
router.get('/:id', protect, ctrl.getById);

// Restaurant routes
// (Optional) Restaurant routes could be added here if needed

module.exports = router;
