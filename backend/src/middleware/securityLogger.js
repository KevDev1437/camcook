/**
 * Middleware de logging de sécurité
 * Log toutes les tentatives d'authentification, accès suspects, etc.
 * Système de logging structuré avec niveaux
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier de log
const LOG_FILE = path.join(__dirname, '../../logs/security.log');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Niveaux de log
 */
const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  ALERT: 'ALERT',
  CRITICAL: 'CRITICAL',
};

/**
 * Formater un message de log structuré
 */
const formatLog = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    service: 'CamCook-API',
    environment: process.env.NODE_ENV || 'development',
    ...data,
  };
  return JSON.stringify(logEntry) + '\n';
};

/**
 * Logger un événement de sécurité
 */
const logSecurityEvent = (level, message, data = {}) => {
  const logMessage = formatLog(level, message, data);
  
  // Écrire dans le fichier de log
  fs.appendFile(LOG_FILE, logMessage, (err) => {
    if (err) {
      console.error('Erreur lors de l\'écriture du log de sécurité:', err);
    }
  });
  
  // Aussi logger dans la console en développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${level}]`, message, data);
  }
};

/**
 * Logger une tentative de login échouée
 */
const logFailedLogin = (req, reason) => {
  logSecurityEvent('WARNING', 'Tentative de connexion échouée', {
    ip: req.ip || req.connection.remoteAddress,
    email: req.body?.email || 'unknown',
    userAgent: req.get('user-agent'),
    reason,
  });
};

/**
 * Logger une tentative de login réussie
 */
const logSuccessfulLogin = (req, userId) => {
  logSecurityEvent('INFO', 'Connexion réussie', {
    ip: req.ip || req.connection.remoteAddress,
    userId,
    userAgent: req.get('user-agent'),
  });
};

/**
 * Logger un accès suspect
 */
const logSuspiciousAccess = (req, reason) => {
  logSecurityEvent('ALERT', 'Accès suspect détecté', {
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    reason,
  });
};

/**
 * Logger un rate limit déclenché
 */
const logRateLimit = (req) => {
  logSecurityEvent('WARNING', 'Rate limit déclenché', {
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
  });
};

/**
 * Logger une erreur de sécurité
 */
const logSecurityError = (req, error) => {
  logSecurityEvent('ERROR', 'Erreur de sécurité', {
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });
};

/**
 * Middleware pour logger les requêtes suspectes
 */
const securityLogger = (req, res, next) => {
  // Logger les requêtes vers des routes sensibles
  const sensitiveRoutes = ['/api/auth', '/api/admin', '/api/payments'];
  const isSensitive = sensitiveRoutes.some(route => req.path.startsWith(route));
  
  if (isSensitive) {
    logSecurityEvent('INFO', 'Accès à une route sensible', {
      ip: req.ip || req.connection.remoteAddress,
      path: req.path,
      method: req.method,
      userId: req.user?.id || 'anonymous',
    });
  }
  
  next();
};

/**
 * Nettoyer les anciens logs (garder seulement les 30 derniers jours)
 */
const cleanupOldLogs = () => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }
    
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const recentLines = lines.filter(line => {
      try {
        const logEntry = JSON.parse(line);
        const logDate = new Date(logEntry.timestamp).getTime();
        return logDate > thirtyDaysAgo;
      } catch (e) {
        return true; // Garder les lignes non parsables
      }
    });
    
    fs.writeFileSync(LOG_FILE, recentLines.join('\n') + '\n');
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
  }
};

// Nettoyer les logs au démarrage et toutes les 24 heures
cleanupOldLogs();
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
  logSecurityEvent,
  logFailedLogin,
  logSuccessfulLogin,
  logSuspiciousAccess,
  logRateLimit,
  logSecurityError,
  securityLogger,
};

