const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactmessage.controller');
const { protect, authorize } = require('../middleware/auth');

// Admin protected routes for managing contact messages
router.use(protect, authorize('admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
