/**
 * Middleware Multi-Tenant - Restaurant Context
 * 
 * Identifie automatiquement le restaurant dans chaque requête pour le support SaaS White Label.
 * 
 * Chaque app White Label aura un restaurantId configuré en dur (via variable d'environnement).
 * Le middleware charge les données du restaurant et les ajoute à req.restaurant.
 * 
 * @module middleware/restaurantContext
 */

const { Restaurant } = require('../models');

/**
 * Identifier le restaurantId depuis différentes sources (dans l'ordre de priorité)
 * 
 * @param {Object} req - Express request object
 * @returns {number|null} - Restaurant ID ou null si non trouvé
 */
function identifyRestaurantId(req) {
  // 1. Header X-Restaurant-Id (priorité la plus haute pour API)
  if (req.headers['x-restaurant-id']) {
    const id = parseInt(req.headers['x-restaurant-id'], 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  // 2. Query parameter ?restaurantId=X
  if (req.query && req.query.restaurantId) {
    const id = parseInt(req.query.restaurantId, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  // 3. Variable d'environnement RESTAURANT_ID (pour White Label)
  if (process.env.RESTAURANT_ID) {
    const id = parseInt(process.env.RESTAURANT_ID, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  // 4. Paramètre URL /:restaurantId/ (pour les routes avec paramètre)
  if (req.params && req.params.restaurantId) {
    const id = parseInt(req.params.restaurantId, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  return null;
}

/**
 * Vérifier si l'abonnement est valide
 * 
 * @param {Object} restaurant - Restaurant object
 * @returns {Object} - { valid: boolean, reason: string }
 */
function validateSubscription(restaurant) {
  // Vérifier le statut de l'abonnement
  const validStatuses = ['active', 'trial'];
  if (!validStatuses.includes(restaurant.subscriptionStatus)) {
    return {
      valid: false,
      reason: `Subscription status is '${restaurant.subscriptionStatus}'. Must be 'active' or 'trial'.`
    };
  }

  // Vérifier si l'abonnement n'est pas expiré (si subscriptionEndDate existe)
  if (restaurant.subscriptionEndDate) {
    const endDate = new Date(restaurant.subscriptionEndDate);
    const now = new Date();
    
    if (endDate < now) {
      return {
        valid: false,
        reason: `Subscription expired on ${endDate.toISOString()}`
      };
    }
  }

  return { valid: true };
}

/**
 * Middleware restaurantContext
 * 
 * Identifie le restaurant et charge ses données dans req.restaurant
 * 
 * @param {Object} options - Options de configuration
 * @param {boolean} options.required - Si true, le restaurantId est obligatoire (défaut: true)
 * @returns {Function} Express middleware function
 */
const restaurantContext = (options = {}) => {
  const { required = true } = options;

  return async (req, res, next) => {
    try {
      // Identifier le restaurantId
      const restaurantId = identifyRestaurantId(req);

      // Si restaurantId est requis mais non trouvé
      if (required && !restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant ID required',
          details: 'Provide restaurantId via: X-Restaurant-Id header, ?restaurantId query param, RESTAURANT_ID env variable, or /:restaurantId URL param'
        });
      }

      // Si restaurantId n'est pas requis et non trouvé, passer au suivant
      if (!required && !restaurantId) {
        // Logger pour debug
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RESTAURANT_CONTEXT] Route publique - restaurantId non requis pour ${req.method} ${req.path}`);
        }
        return next();
      }

      // Logger pour debug
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RESTAURANT_CONTEXT] Identification du restaurant ID: ${restaurantId} pour ${req.method} ${req.path}`);
      }

      // Charger les données du restaurant depuis la base de données
      const restaurant = await Restaurant.findByPk(restaurantId, {
        attributes: [
          'id',
          'ownerId',
          'name',
          'description',
          'logo',
          'coverImage',
          'cuisine',
          'street',
          'city',
          'postalCode',
          'latitude',
          'longitude',
          'phone',
          'email',
          'openingHours',
          'hasPickup',
          'hasDelivery',
          'deliveryFee',
          'minimumOrder',
          'estimatedTime',
          'ratingAverage',
          'ratingCount',
          'isActive',
          'isVerified',
          'slug',
          'subdomain',
          'settings',
          'subscriptionPlan',
          'subscriptionStatus',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'createdAt',
          'updatedAt'
        ]
      });

      // Vérifier que le restaurant existe
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found',
          details: `Restaurant with ID ${restaurantId} does not exist`
        });
      }

      // Vérifier que le restaurant est actif
      if (!restaurant.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Restaurant is inactive',
          details: `Restaurant "${restaurant.name}" (ID: ${restaurant.id}) is currently inactive`
        });
      }

      // Vérifier que l'abonnement est valide
      const subscriptionCheck = validateSubscription(restaurant);
      if (!subscriptionCheck.valid) {
        return res.status(403).json({
          success: false,
          message: 'Subscription expired or invalid',
          details: subscriptionCheck.reason,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name
        });
      }

      // Ajouter les données du restaurant à la requête
      req.restaurant = restaurant.toJSON();
      req.restaurantId = restaurant.id; // Raccourci pratique

      // Logger pour debug (avec les infos du restaurant)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RESTAURANT_CONTEXT] Restaurant chargé: ${restaurant.name} (ID: ${restaurant.id}, Slug: ${restaurant.slug || 'N/A'}, Status: ${restaurant.subscriptionStatus})`);
      }

      next();
    } catch (error) {
      console.error('[RESTAURANT_CONTEXT] Erreur lors du chargement du restaurant:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error loading restaurant context',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
};

/**
 * Middleware restaurantContext requis (alias pour restaurantContext({ required: true }))
 * 
 * Le restaurantId est obligatoire. Si non trouvé, retourne une erreur 400.
 */
restaurantContext.required = restaurantContext({ required: true });

/**
 * Middleware restaurantContext optionnel (alias pour restaurantContext({ required: false }))
 * 
 * Le restaurantId est optionnel. Si non trouvé, la requête continue sans restaurant.
 * Utile pour les routes publiques (liste des restaurants, authentification, etc.)
 */
restaurantContext.optional = restaurantContext({ required: false });

module.exports = restaurantContext;

