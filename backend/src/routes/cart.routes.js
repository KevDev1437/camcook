const express = require('express');
const router = express.Router();
const { priceCartItem } = require('../controllers/cart.controller');

// Calcul du prix d'une ligne de panier côté backend
router.post('/price-item', priceCartItem);

module.exports = router;
