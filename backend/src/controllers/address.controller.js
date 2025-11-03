const Address = require('../models/Address');
const { Op } = require('sequelize');

// @desc    Get all addresses for current user
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching addresses'
    });
  }
};

// @desc    Get single address by ID
// @route   GET /api/users/addresses/:id
// @access  Private
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching address'
    });
  }
};

// @desc    Create new address
// @route   POST /api/users/addresses
// @access  Private
exports.createAddress = async (req, res) => {
  try {
    const { label, street, city, postalCode, latitude, longitude, isDefault } = req.body;

    // Validation
    if (!street || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Street, city and postal code are required'
      });
    }

    // Si isDefault est true, désactiver les autres adresses par défaut
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const address = await Address.create({
      userId: req.user.id,
      label: label || null,
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isDefault: isDefault || false
    });

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating address'
    });
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, street, city, postalCode, latitude, longitude, isDefault } = req.body;

    const address = await Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Si isDefault est true, désactiver les autres adresses par défaut
    if (isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, id: { [Op.ne]: id } } }
      );
    }

    // Update fields
    const updates = {};
    if (label !== undefined) updates.label = label ? label.trim() : null;
    if (street !== undefined && street.trim()) updates.street = street.trim();
    if (city !== undefined && city.trim()) updates.city = city.trim();
    if (postalCode !== undefined) {
      if (!postalCode || !postalCode.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Postal code is required'
        });
      }
      updates.postalCode = postalCode.trim();
    }
    if (latitude !== undefined) updates.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updates.longitude = longitude ? parseFloat(longitude) : null;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    await address.update(updates);

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating address'
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.destroy();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting address'
    });
  }
};

// @desc    Set address as default
// @route   PATCH /api/users/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Désactiver toutes les autres adresses par défaut
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id, id: { [Op.ne]: id } } }
    );

    // Activer cette adresse comme défaut
    await address.update({ isDefault: true });

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error setting default address'
    });
  }
};

