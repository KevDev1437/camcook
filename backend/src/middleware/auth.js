const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Debug : log l'ID décodé
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] protect - Token décodé, user ID: ${decoded.id}`);
    }
    
    // Chercher l'utilisateur (inclure les soft-deleted pour debug)
    req.user = await User.findByPk(decoded.id, {
      paranoid: false // Inclure les utilisateurs soft-deleted pour debug
    });

    if (!req.user) {
      console.error(`[AUTH] protect - Utilisateur non trouvé avec ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Vérifier si l'utilisateur a été soft-deleted
    if (req.user.deletedAt) {
      console.error(`[AUTH] protect - Utilisateur soft-deleted avec ID: ${decoded.id}, deletedAt: ${req.user.deletedAt}`);
      return res.status(401).json({
        success: false,
        message: 'User account has been deleted'
      });
    }
    
    // Debug : log l'utilisateur trouvé
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] protect - Utilisateur trouvé: ${req.user.email} (ID: ${req.user.id}, Role: ${req.user.role})`);
    }

    next();
  } catch (error) {
    console.error(`[AUTH] protect - Erreur de vérification du token:`, error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Protect routes optionally - verify JWT token if present, but don't fail if missing
exports.protectOptional = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Si pas de token, continuer sans req.user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);

    // Si l'utilisateur n'existe pas, continuer sans req.user (pas d'erreur)
    if (!req.user) {
      return next();
    }

    next();
  } catch (error) {
    // Si erreur de token, continuer sans req.user (pas d'erreur)
    return next();
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
