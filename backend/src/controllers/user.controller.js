const User = require('../models/User');

// @desc    Get current logged in user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update current logged in user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, password, currentPassword, avatar, backgroundImage } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = {};

    // Update name
    if (name !== undefined && name.trim()) {
      updates.name = name.trim();
    }

    // Update email (check if already exists)
    if (email !== undefined && email.trim()) {
      const emailExists = await User.findOne({
        where: { email: email.trim() }
      });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      updates.email = email.trim();
    }

    // Update phone
    if (phone !== undefined && phone.trim()) {
      updates.phone = phone.trim();
    }

    // Update avatar (URL string)
    if (avatar !== undefined) {
      updates.avatar = avatar || null;
    }

    // Update backgroundImage (URL string)
    if (backgroundImage !== undefined) {
      updates.backgroundImage = backgroundImage || null;
    }

    // Update password (requires current password)
    if (password !== undefined && password.trim()) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      // Verify current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      updates.password = password;
    }

    // Apply updates
    await user.update(updates);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};


