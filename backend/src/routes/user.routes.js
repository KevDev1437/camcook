const express = require('express');
const { protect } = require('../middleware/auth');
const { validateImageUpload, uploadLimiter } = require('../middleware/uploadValidator');
const userController = require('../controllers/user.controller');
const addressController = require('../controllers/address.controller');

const router = express.Router();

// User profile routes avec validation des uploads
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, uploadLimiter, validateImageUpload, userController.updateProfile);

// Address routes
router.get('/addresses', protect, addressController.getAddresses);
router.get('/addresses/:id', protect, addressController.getAddressById);
router.post('/addresses', protect, addressController.createAddress);
router.put('/addresses/:id', protect, addressController.updateAddress);
router.delete('/addresses/:id', protect, addressController.deleteAddress);
router.patch('/addresses/:id/default', protect, addressController.setDefaultAddress);

module.exports = router;
