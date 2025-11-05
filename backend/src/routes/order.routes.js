const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const ctrl = require('../controllers/order.controller');

const router = express.Router();

// Customer routes - restaurantContext requis pour créer une commande
router.post('/', restaurantContext.required, protect, ctrl.create);

// Customer routes - restaurantContext optionnel pour voir ses commandes
router.get('/my-orders', restaurantContext.optional, protect, ctrl.myOrders);
router.get('/:id', restaurantContext.optional, protect, ctrl.getById);

// Restaurant routes - restaurantContext requis pour les actions des owners
router.get('/restaurant', restaurantContext.required, protect, authorize('restaurant', 'admin'), ctrl.getRestaurantOrders);
router.put('/:id/status', restaurantContext.required, protect, authorize('restaurant', 'admin'), ctrl.updateOrderStatus);

// Admin routes - restaurantContext optionnel (admin peut voir toutes les commandes)
router.get('/', restaurantContext.optional, protect, authorize('admin', 'restaurant'), ctrl.getAllOrders);

module.exports = router;
