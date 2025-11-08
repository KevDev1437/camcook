const express = require('express');
const { register, login, getMe, refreshToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const restaurantContext = require('../middleware/restaurantContext');

const router = express.Router();

// Rate limiting strict pour les routes d'authentification
// restaurantContext.optional pour récupérer le restaurantId (White Label isolation)
router.post('/register', authLimiter, restaurantContext.optional, register);
router.post('/login', authLimiter, restaurantContext.optional, login);
router.post('/refresh', authLimiter, refreshToken); // Route pour rafraîchir le token
router.get('/me', protect, getMe);

module.exports = router;
