const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateRefreshToken } = require('../utils/generateToken');
const { logFailedLogin, logSuccessfulLogin } = require('../middleware/securityLogger');
const { sanitizeEmail, sanitizeName, sanitizePhone } = require('../middleware/sanitizer');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    let { name, email, phone, password, role } = req.body;

    // Sanitizer les entrées
    name = sanitizeName(name);
    email = sanitizeEmail(email);
    phone = sanitizePhone(phone);

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le téléphone est requis'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // MULTI-TENANT : Stocker le restaurantId pour isoler les clients par restaurant (White Label)
    // Si restaurantContext est appliqué et qu'on crée un customer, stocker le restaurantId
    const defaultRestaurantId = (role === 'customer' || !role) && req.restaurantId 
      ? req.restaurantId 
      : null;

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'customer',
      defaultRestaurantId // MULTI-TENANT : Restaurant par défaut pour isolation White Label
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Sanitizer l'email
    email = sanitizeEmail(email);

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!user) {
      // Logger la tentative de login échouée
      logFailedLogin(req, 'Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Logger la tentative de login échouée
      logFailedLogin(req, 'Mot de passe incorrect');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // MULTI-TENANT : Vérifier que l'utilisateur peut se connecter à ce restaurant (White Label isolation)
    // IMPORTANT : Chaque app White Label est isolée - les utilisateurs ne peuvent se connecter que dans leur app
    
    if (req.restaurantId) {
      // Récupérer le restaurantId depuis le header (app White Label)
      const appRestaurantId = req.restaurantId;
      
      if (user.role === 'adminrestaurant') {
        // MULTI-TENANT : Un adminrestaurant ne peut se connecter QUE dans l'app de SON restaurant
        // Trouver le restaurant dont l'utilisateur est le propriétaire
        const { Restaurant } = require('../models');
        const userRestaurant = await Restaurant.findOne({
          where: { ownerId: user.id },
          attributes: ['id', 'name']
        });
        
        if (!userRestaurant) {
          logFailedLogin(req, `AdminRestaurant ${user.email} n'a pas de restaurant associé`);
          return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas de restaurant associé. Contactez l\'administrateur.'
          });
        }
        
        // Vérifier que le restaurant de l'app correspond au restaurant de l'owner
        if (userRestaurant.id !== appRestaurantId) {
          logFailedLogin(req, `AdminRestaurant ${user.email} (restaurant: ${userRestaurant.name}, ID: ${userRestaurant.id}) tente de se connecter à l'app du restaurant ${appRestaurantId} mais n'y a pas accès`);
          return res.status(403).json({
            success: false,
            message: `Vous ne pouvez pas vous connecter à cette application. Cette app est configurée pour un autre restaurant. Veuillez utiliser l'application de votre restaurant (${userRestaurant.name}).`
          });
        }
        
        console.log(`[AUTH] ✅ AdminRestaurant ${user.email} se connecte à son restaurant (${userRestaurant.name}, ID: ${userRestaurant.id})`);
      } else if (user.role === 'customer') {
        // MULTI-TENANT : Un customer ne peut se connecter QUE dans l'app de son restaurant par défaut
        // Vérifier que le client a le droit de se connecter à ce restaurant
        // Soit c'est son restaurant par défaut, soit il a des commandes dans ce restaurant
        const { Order } = require('../models');
        
        // Vérifier si c'est son restaurant par défaut
        const isDefaultRestaurant = user.defaultRestaurantId === appRestaurantId;
        
        // Vérifier s'il a des commandes dans ce restaurant
        const hasOrders = await Order.findOne({ 
          where: { 
            customerId: user.id, 
            restaurantId: appRestaurantId 
          } 
        });

        const canAccess = isDefaultRestaurant || hasOrders !== null;

        if (!canAccess) {
          // Logger la tentative de login échouée
          logFailedLogin(req, `Client ${user.email} tente de se connecter au restaurant ${appRestaurantId} mais n'y a pas accès`);
          return res.status(403).json({
            success: false,
            message: 'Vous ne pouvez pas vous connecter à ce restaurant. Veuillez utiliser l\'application correspondante.'
          });
        }
      }
      // Les superadmin peuvent se connecter depuis n'importe quelle app
    }

    // Logger la connexion réussie
    logSuccessfulLogin(req, user.id);

    // DEBUG : Log du rôle pour diagnostic
    console.log(`[AUTH] ✅ Login réussi pour ${user.email} - Rôle: ${user.role}`);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const responseData = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role // IMPORTANT : Le rôle doit être inclus pour la navigation
        },
        token,
        refreshToken
      }
    };

    // DEBUG : Log de la réponse complète
    console.log(`[AUTH] 📤 Réponse login pour ${user.email}:`, JSON.stringify({
      success: responseData.success,
      user: responseData.data.user,
      hasToken: !!responseData.data.token
    }, null, 2));

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    const { verifyRefreshToken } = require('../utils/generateToken');
    
    try {
      // Vérifier le refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Vérifier que l'utilisateur existe toujours
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Générer un nouveau access token
      const newToken = generateToken(user.id);

      res.status(200).json({
        success: true,
        data: {
          token: newToken
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclure le mot de passe
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // IMPORTANT : Retourner un objet simple avec tous les champs nécessaires, y compris le rôle
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role, // IMPORTANT : Le rôle doit être inclus
      defaultRestaurantId: user.defaultRestaurantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: userData
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
