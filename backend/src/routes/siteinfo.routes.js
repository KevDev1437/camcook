const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const { getSiteInfo, upsertSiteInfo, sendContactMessage } = require('../controllers/siteinfo.controller');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques - restaurantContext optionnel (peut être utilisé pour personnaliser le site info)
router.get('/', restaurantContext.optional, getSiteInfo);

// Contact form endpoint (public) - restaurantContext optionnel (ajoute restaurantId si disponible)
router.post('/contact', restaurantContext.optional, sendContactMessage);

// Routes protégées (superadmin) - restaurantContext optionnel
router.put('/', restaurantContext.optional, protect, authorize('superadmin'), upsertSiteInfo);

module.exports = router;
