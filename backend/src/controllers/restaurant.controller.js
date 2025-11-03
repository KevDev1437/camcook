const { Restaurant, MenuItem } = require('../models');
const { augmentOptions } = require('./menu.controller');

// Resolve CamCook restaurant by ENV id or by name fallback
const resolveCamcook = async () => {
  const envId = process.env.CAMCOOK_RESTAURANT_ID && parseInt(process.env.CAMCOOK_RESTAURANT_ID, 10);
  if (envId && !Number.isNaN(envId)) {
    const byId = await Restaurant.findByPk(envId);
    if (byId) return byId;
  }
  // Fallback by name
  const byName = await Restaurant.findOne({ where: { name: 'CamCook' } });
  return byName || null;
};

/**
 * @desc    Get CamCook restaurant info
 * @route   GET /api/restaurants/info
 * @access  Public
 */
exports.getCamCookRestaurant = async (req, res) => {
  try {
    const base = await resolveCamcook();
    const restaurant = base && await Restaurant.findByPk(base.id, {
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
        'phone',
        'email',
        'openingHours',
        'hasPickup',
        'hasDelivery',
        'deliveryFee',
        'minimumOrder',
        'estimatedTime',
        'ratingAverage',
        'ratingCount'
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant CamCook non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching CamCook restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des infos du restaurant'
    });
  }
};

/**
 * @desc    Get CamCook menu (all dishes)
 * @route   GET /api/restaurants/menu
 * @route   GET /api/restaurants/:id/menu (compatibility)
 * @access  Public
 */
exports.getCamCookMenu = async (req, res) => {
  try {
    const base = await resolveCamcook();
    if (!base) {
      return res.status(404).json({ success: false, message: 'Restaurant CamCook non trouvé' });
    }
    let menuItems = await MenuItem.findAll({
      where: {
        restaurantId: base.id,
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

    // Enrichir les options avec les accompagnements et boissons depuis les tables Accompaniment et Drink (toujours à jour)
    menuItems = await Promise.all(menuItems.map(async (it) => {
      const json = it.toJSON ? it.toJSON() : it;
      return await augmentOptions(json);
    }));

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching CamCook menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du menu'
    });
  }
};
