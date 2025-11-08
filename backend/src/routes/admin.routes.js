const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const ctrl = require('../controllers/admin.controller');
const paymentCtrl = require('../controllers/payment.controller');

const router = express.Router();

// Admin guard : superadmin et adminrestaurant peuvent accéder
// Les adminrestaurant verront uniquement les données de leur restaurant
router.use(protect, authorize('superadmin', 'adminrestaurant'));

// Orders - restaurantContext optionnel (superadmin peut voir toutes les commandes)
router.get('/orders', restaurantContext.optional, ctrl.listOrders);
router.patch('/orders/:id/status', restaurantContext.optional, ctrl.updateOrderStatus);

// Reviews moderation - restaurantContext optionnel (superadmin peut voir toutes les reviews)
router.get('/reviews', restaurantContext.optional, ctrl.listReviews);
router.patch('/reviews/:id/status', restaurantContext.optional, ctrl.updateReviewStatus);

// Users - restaurantContext optionnel (superadmin peut voir tous les utilisateurs)
// Les adminrestaurant ne peuvent voir que les clients de leur restaurant
router.get('/users', restaurantContext.optional, ctrl.listUsers);
router.patch('/users/:id', restaurantContext.optional, ctrl.updateUser);
router.delete('/users/:id', restaurantContext.optional, ctrl.deleteUser);

// Payments - restaurantContext optionnel (superadmin peut voir tous les paiements)
router.get('/payments', restaurantContext.optional, paymentCtrl.listPayments);

// Stats
router.get('/stats/active-customers', ctrl.getActiveCustomersCount);

// Settings (per-admin preferences)
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;
