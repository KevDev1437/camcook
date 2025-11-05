const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const {
  createPaymentIntent,
  confirmPayment,
  createMobilePayIntent,
  refundPayment,
} = require('../controllers/payment.controller');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Créer un Payment Intent pour carte bancaire
router.post('/create-intent', paymentLimiter, createPaymentIntent);

// Créer un Payment Intent pour Apple Pay / Google Pay
router.post('/create-mobile-pay-intent', paymentLimiter, createMobilePayIntent);

// Confirmer un paiement
router.post('/confirm', paymentLimiter, confirmPayment);

// Rembourser un paiement (admin seulement)
router.post('/refund', refundPayment);

module.exports = router;


