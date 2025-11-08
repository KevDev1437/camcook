const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const ctrl = require('../controllers/contactmessage.controller');
const { protect, authorize } = require('../middleware/auth');

// Liste des messages (owner/superadmin) - restaurantContext requis pour filtrer par restaurant
router.get('/', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.list);

// Get message by ID (owner/superadmin) - restaurantContext requis
router.get('/:id', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.getById);

// Créer un message (public) - restaurantContext requis pour associer au restaurant
router.post('/', restaurantContext.required, ctrl.create);

// Modifier statut (owner/superadmin) - restaurantContext requis
router.patch('/:id/status', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.updateStatus);

// Supprimer message (owner/superadmin) - restaurantContext requis
router.delete('/:id', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.delete);

module.exports = router;
