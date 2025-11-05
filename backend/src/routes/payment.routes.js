const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const restaurantContext = require('../middleware/restaurantContext');
const {
  createPaymentIntent,
  confirmPayment,
  createMobilePayIntent,
  refundPayment,
} = require('../controllers/payment.controller');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Créer un Payment Intent pour carte bancaire (restaurantContext requis)
router.post('/create-intent', restaurantContext.required, paymentLimiter, createPaymentIntent);

// Créer un Payment Intent pour Apple Pay / Google Pay (restaurantContext requis)
router.post('/create-mobile-pay-intent', restaurantContext.required, paymentLimiter, createMobilePayIntent);

// Confirmer un paiement (restaurantContext optionnel car restaurantId vient des metadata Stripe)
router.post('/confirm', restaurantContext.optional, paymentLimiter, confirmPayment);

// Rembourser un paiement (admin seulement, restaurantContext optionnel)
router.post('/refund', restaurantContext.optional, refundPayment);

module.exports = router;


