/**
 * Restaurant Controller - Multi-Tenant
 * 
 * Ce controller gère les restaurants dans un contexte multi-tenant.
 * Toutes les fonctions utilisent req.restaurant et req.restaurantId
 * qui sont chargés automatiquement par le middleware restaurantContext.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurant et req.restaurantId.
 */

const { Restaurant, MenuItem } = require('../models');
const { augmentOptions } = require('./menu.controller');

/**
 * @desc    Get restaurant info (utilise req.restaurant chargé par le middleware)
 * @route   GET /api/restaurants/info
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getRestaurantInfo = async (req, res) => {
  try {
    // req.restaurant est déjà chargé par le middleware restaurantContext
    if (!req.restaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    // Retourner les informations du restaurant (sans données sensibles)
    const restaurantData = {
      id: req.restaurant.id,
      name: req.restaurant.name,
      description: req.restaurant.description,
      logo: req.restaurant.logo,
      coverImage: req.restaurant.coverImage,
      cuisine: req.restaurant.cuisine,
      street: req.restaurant.street,
      city: req.restaurant.city,
      postalCode: req.restaurant.postalCode,
      latitude: req.restaurant.latitude,
      longitude: req.restaurant.longitude,
      phone: req.restaurant.phone,
      email: req.restaurant.email,
      openingHours: req.restaurant.openingHours,
      hasPickup: req.restaurant.hasPickup,
      hasDelivery: req.restaurant.hasDelivery,
      deliveryFee: req.restaurant.deliveryFee,
      minimumOrder: req.restaurant.minimumOrder,
      estimatedTime: req.restaurant.estimatedTime,
      ratingAverage: req.restaurant.ratingAverage,
      ratingCount: req.restaurant.ratingCount,
      isVerified: req.restaurant.isVerified,
      slug: req.restaurant.slug,
      subdomain: req.restaurant.subdomain,
      settings: req.restaurant.settings
    };

    res.status(200).json({
      success: true,
      data: restaurantData
    });
  } catch (error) {
    console.error('Error fetching restaurant info:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des infos du restaurant'
    });
  }
};

/**
 * @desc    Get restaurant menu (utilise req.restaurantId chargé par le middleware)
 * @route   GET /api/restaurants/menu
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getRestaurantMenu = async (req, res) => {
  try {
    // req.restaurantId est déjà chargé par le middleware restaurantContext
    if (!req.restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    // Récupérer le menu du restaurant
    const menuItems = await MenuItem.findAll({
      where: {
        restaurantId: req.restaurantId,
        isAvailable: true
      },
      attributes: [
        'id',
        'name',
        'description',
        'category',
        'price',
        'images',
        'options',
        'preparationTime',
        'isPopular',
        'allergens',
        'calories',
        'protein',
        'carbs',
        'fat'
      ],
      order: [['isPopular', 'DESC'], ['name', 'ASC']]
    });

    // Enrichir les options avec les accompagnements et boissons depuis les tables Accompaniment et Drink
    // Les accompagnements et boissons sont maintenant filtrés par restaurantId grâce à la migration
    const enrichedMenuItems = await Promise.all(menuItems.map(async (item) => {
      const json = item.toJSON ? item.toJSON() : item;
      return await augmentOptions(json);
    }));

    res.status(200).json({
      success: true,
      count: enrichedMenuItems.length,
      data: enrichedMenuItems,
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du menu'
    });
  }
};

/**
 * @desc    Update restaurant (vérifie que l'utilisateur est le propriétaire)
 * @route   PUT /api/restaurants
 * @access  Protected (restaurant owner or admin)
 */
exports.updateRestaurant = async (req, res) => {
  try {
    // req.restaurant est déjà chargé par le middleware restaurantContext
    if (!req.restaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du restaurant ou un admin
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Seul le propriétaire ou un admin peut modifier le restaurant
    if (req.restaurant.ownerId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être le propriétaire du restaurant pour le modifier.'
      });
    }

    // Champs autorisés à être modifiés
    const allowedFields = [
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
      'slug',
      'subdomain',
      'settings'
    ];

    // Filtrer les champs à mettre à jour
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Si aucun champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    // Vérifier l'unicité du slug si fourni
    if (updateData.slug) {
      const existingRestaurant = await Restaurant.findOne({
        where: {
          slug: updateData.slug,
          id: { [require('sequelize').Op.ne]: req.restaurantId }
        }
      });

      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          message: 'Ce slug est déjà utilisé par un autre restaurant'
        });
      }
    }

    // Vérifier l'unicité du subdomain si fourni
    if (updateData.subdomain) {
      const existingRestaurant = await Restaurant.findOne({
        where: {
          subdomain: updateData.subdomain,
          id: { [require('sequelize').Op.ne]: req.restaurantId }
        }
      });

      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          message: 'Ce sous-domaine est déjà utilisé par un autre restaurant'
        });
      }
    }

    // Mettre à jour le restaurant
    await Restaurant.update(updateData, {
      where: { id: req.restaurantId }
    });

    // Récupérer le restaurant mis à jour
    const updatedRestaurant = await Restaurant.findByPk(req.restaurantId, {
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

    res.status(200).json({
      success: true,
      message: 'Restaurant mis à jour avec succès',
      data: updatedRestaurant
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du restaurant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    List all restaurants (route publique pour le futur marketplace)
 * @route   GET /api/restaurants/list
 * @access  Public (restaurantContext.optional pour permettre l'accès sans restaurantId)
 */
exports.listRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 20, city, isActive = true } = req.query;

    // Construire les conditions de recherche
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (city) {
      where.city = city;
    }

    // Pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    // Récupérer les restaurants
    const { rows, count } = await Restaurant.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'description',
        'logo',
        'coverImage',
        'cuisine',
        'city',
        'postalCode',
        'latitude',
        'longitude',
        'phone',
        'email',
        'hasPickup',
        'hasDelivery',
        'deliveryFee',
        'minimumOrder',
        'estimatedTime',
        'ratingAverage',
        'ratingCount',
        'isVerified',
        'slug',
        'subdomain'
      ],
      order: [['ratingAverage', 'DESC'], ['ratingCount', 'DESC'], ['name', 'ASC']],
      limit: pageSize,
      offset
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Error listing restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la liste des restaurants'
    });
  }
};

/**
 * @desc    Get restaurant by slug (pour les URLs personnalisées)
 * @route   GET /api/restaurants/slug/:slug
 * @access  Public
 */
exports.getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug requis'
      });
    }

    const restaurant = await Restaurant.findOne({
      where: {
        slug,
        isActive: true
      },
      attributes: [
        'id',
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
        'isVerified',
        'slug',
        'subdomain',
        'settings'
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    // Vérifier que l'abonnement est valide
    const validStatuses = ['active', 'trial'];
    if (!validStatuses.includes(restaurant.subscriptionStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Restaurant non disponible'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du restaurant'
    });
  }
};
