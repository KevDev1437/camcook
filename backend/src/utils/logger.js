/**
 * Logger sécurisé qui exclut les données sensibles
 * 
 * Empêche l'exposition de mots de passe, tokens, clés API dans les logs.
 * 
 * @module utils/logger
 */

// Champs sensibles à exclure des logs
const sensitiveFields = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'stripeKey',
  'stripeSecret',
  'jwt',
  'authorization',
  'cookie',
  'apiKey',
  'secret'
];

/**
 * Sanitize les données en masquant les champs sensibles
 * @param {any} data - Données à sanitizer
 * @returns {any} - Données sanitizées
 */
const sanitize = (data) => {
  // Types primitifs
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  
  // Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  
  // Objects
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Masquer les champs sensibles
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***';
    }
    // Récursif pour les objets imbriqués
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    }
    // Valeurs normales
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Logger avec différents niveaux de log
 */
const logger = {
  /**
   * Log d'information générale
   * 
   * @param {string} message - Message à logger
   * @param {*} data - Données à logger (seront sanitizées)
   */
  info: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${message}`, sanitize(data));
  },

  /**
   * Log d'erreur
   */
  error: (message, error = {}, context = {}) => {
    const errorData = {
      message: error?.message || message,
      name: error?.name,
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      ...sanitize(context)
    };
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, errorData);
  },

  /**
   * Log de sécurité (accès, tentatives, etc.)
   * 
   * @param {string} message - Message de sécurité
   * @param {*} data - Données à logger (seront sanitizées)
   */
  security: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY] [${timestamp}] ${message}`, sanitize(data));
  },

  /**
   * Log de debug (uniquement en développement)
   * 
   * @param {string} message - Message de debug
   * @param {*} data - Données à logger (seront sanitizées)
   */
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] [${timestamp}] ${message}`, sanitize(data));
    }
  },

  /**
   * Log d'avertissement
   * 
   * @param {string} message - Message d'avertissement
   * @param {*} data - Données à logger (seront sanitizées)
   */
  warn: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${message}`, sanitize(data));
  }
};

module.exports = logger;

