/**
 * Middleware centralisé de gestion des erreurs
 * 
 * Ne retourne error.message qu'en développement pour éviter les fuites d'informations sensibles.
 * En production, retourne des messages génériques.
 * 
 * @module middleware/errorHandler
 */

const errorHandler = (err, req, res, next) => {
  // Logger l'erreur avec des informations contextuelles (sans données sensibles)
  console.error('[ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    restaurantId: req.restaurantId,
    timestamp: new Date().toISOString()
  });

  // En production, messages génériques pour éviter les fuites d'informations
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Une erreur est survenue';

  // Déterminer le code de statut HTTP
  const statusCode = err.statusCode || err.status || 500;

  // Réponse d'erreur standardisée
  res.status(statusCode).json({
    success: false,
    error: message,
    // En développement, ajouter plus de détails si nécessaire
    ...(process.env.NODE_ENV === 'development' && {
      details: err.details || undefined,
      stack: err.stack || undefined
    })
  });
};

module.exports = errorHandler;


