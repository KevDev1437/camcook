const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const { priceCartItem } = require('../controllers/cart.controller');

// Calcul du prix d'une ligne de panier côté backend
// restaurantContext requis pour filtrer les accompagnements et boissons par restaurant
router.post('/price-item', restaurantContext.required, priceCartItem);

module.exports = router;
