const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');
const paymentCtrl = require('../controllers/payment.controller');

const router = express.Router();

// Admin guard
router.use(protect, authorize('admin'));

// Orders
router.get('/orders', ctrl.listOrders);
router.patch('/orders/:id/status', ctrl.updateOrderStatus);

// Reviews moderation
router.get('/reviews', ctrl.listReviews);
router.patch('/reviews/:id/status', ctrl.updateReviewStatus);

// Users
router.get('/users', ctrl.listUsers);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

// Payments
router.get('/payments', paymentCtrl.listPayments);

// Stats
router.get('/stats/active-customers', ctrl.getActiveCustomersCount);

// Settings (per-admin preferences)
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;
