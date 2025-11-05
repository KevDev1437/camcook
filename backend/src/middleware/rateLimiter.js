const rateLimit = require('express-rate-limit');

// Configuration selon l'environnement
const isDevelopment = process.env.NODE_ENV !== 'production';

// Rate limiter général pour toutes les routes
// En développement : limites plus élevées pour éviter les blocages lors du développement
// En production : limites normales pour la sécurité
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 en dev, 100 en prod
  message: {
    success: false,
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skip: (req) => {
    // Ignorer le rate limiting pour les health checks
    return req.path === '/api/health';
  }
});

// Rate limiter strict pour les routes d'authentification (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 tentatives de login/register par fenêtre de 15 minutes
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Compter toutes les requêtes (même réussies)
  skipFailedRequests: false, // Compter les requêtes échouées
  handler: (req, res) => {
    // Logger le rate limit déclenché
    const { logRateLimit } = require('./securityLogger');
    logRateLimit(req);
    
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    });
  },
});

// Rate limiter pour les routes de paiement
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Limite chaque IP à 10 paiements par heure
  message: {
    success: false,
    error: 'Trop de tentatives de paiement. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les routes d'upload
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limite chaque IP à 20 uploads par fenêtre de 15 minutes
  message: {
    success: false,
    error: 'Trop d\'uploads. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
};

