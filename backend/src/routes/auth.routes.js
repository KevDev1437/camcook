const express = require('express');
const { register, login, getMe, refreshToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiting strict pour les routes d'authentification
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken); // Route pour rafraîchir le token
router.get('/me', protect, getMe);

module.exports = router;
