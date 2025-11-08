const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
  getAllRestaurants,
  getRestaurantStats,
  getGlobalStats,
  createRestaurant,
  updateRestaurantSubscription,
  toggleRestaurantStatus,
  updateRestaurantLogo,
  updateRestaurantTheme,
  deleteRestaurant,
  getAvailableOwners,
  generateClientApp
} = require('../controllers/superadmin.controller');

/**
 * Routes Super Admin
 * 
 * IMPORTANT : Toutes ces routes nécessitent :
 * - Authentification (protect)
 * - Rôle superadmin (authorize('superadmin'))
 * - Pas de restaurantContext requis (accès global)
 */

// Statistiques globales de la plateforme
router.get('/stats', protect, authorize('superadmin'), getGlobalStats);

// Liste tous les restaurants avec pagination et filtres
router.get('/restaurants', protect, authorize('superadmin'), getAllRestaurants);

// Statistiques d'un restaurant spécifique
router.get('/restaurants/:restaurantId/stats', protect, authorize('superadmin'), getRestaurantStats);

// Créer un nouveau restaurant
router.post('/restaurants', protect, authorize('superadmin'), validate(schemas.createRestaurant), createRestaurant);

// Modifier l'abonnement d'un restaurant
router.put('/restaurants/:restaurantId/subscription', protect, authorize('superadmin'), validate(schemas.updateRestaurantSubscription), updateRestaurantSubscription);

// Activer/désactiver un restaurant
router.put('/restaurants/:restaurantId/toggle-status', protect, authorize('superadmin'), toggleRestaurantStatus);

// Modifier le logo d'un restaurant
router.put('/restaurants/:restaurantId/logo', protect, authorize('superadmin'), updateRestaurantLogo);

// Modifier les couleurs du thème d'un restaurant
router.put('/restaurants/:restaurantId/theme', protect, authorize('superadmin'), updateRestaurantTheme);

// Supprimer un restaurant (soft delete)
router.delete('/restaurants/:restaurantId', protect, authorize('superadmin'), deleteRestaurant);

// Liste les utilisateurs disponibles comme owners (pas superadmin, pas déjà owner)
router.get('/available-owners', protect, authorize('superadmin'), getAvailableOwners);

// Générer une app White Label pour un restaurant
router.post('/generate-app', protect, authorize('superadmin'), generateClientApp);

module.exports = router;


