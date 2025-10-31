const express = require('express');
const router = express.Router();
const { getSiteInfo, upsertSiteInfo, sendContactMessage } = require('../controllers/siteinfo.controller');
const { protect, authorize } = require('../middleware/auth');

// Public get
router.get('/', getSiteInfo);

// Protected upsert - admin only
router.put('/', protect, authorize('admin'), upsertSiteInfo);

// Contact form endpoint (public)
router.post('/contact', sendContactMessage);

module.exports = router;
