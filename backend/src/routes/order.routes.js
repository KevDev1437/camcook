const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const { validate, schemas } = require('../middleware/validation');
const ctrl = require('../controllers/order.controller');

const router = express.Router();

// Customer routes - restaurantContext requis pour créer une commande
router.post('/', restaurantContext.required, protect, validate(schemas.createOrder), ctrl.create);

// Customer routes - restaurantContext requis pour isoler les commandes par restaurant (White Label)
router.get('/my-orders', restaurantContext.required, protect, ctrl.myOrders);
router.get('/:id', restaurantContext.optional, protect, ctrl.getById);

// Restaurant routes - restaurantContext requis pour les actions des owners
router.get('/restaurant', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.getRestaurantOrders);
router.put('/:id/status', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.updateOrderStatus);

// Admin routes - restaurantContext optionnel (superadmin peut voir toutes les commandes)
router.get('/', restaurantContext.optional, protect, authorize('superadmin', 'adminrestaurant'), ctrl.getAllOrders);

module.exports = router;
