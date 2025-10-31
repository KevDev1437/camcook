const { MenuItem } = require('../models');
const { Restaurant } = require('../models');

// Helpers: compléter/contraindre les groupes d'options côté réponse API
const DEFAULT_ACCOMPAGNEMENTS = [
  'Plantain Frit',
  'Baton de manioc',
  'Wete Fufu',
  'Frite de pomme',
];
const DEFAULT_BOISSONS = ['Bissap'];

function getChoiceLabel(choice) {
  if (choice && typeof choice === 'object') {
    return choice.label ?? choice.name ?? String(choice.value ?? choice.id ?? '');
  }
  return String(choice ?? '');
}

function ensureAccompagnements(options) {
  const hasAccomp = options.some((opt) => (opt?.name || '').toLowerCase().includes('accomp'));
  if (!hasAccomp) {
    options.push({
      id: 'accompagnements',
      name: 'Accompagnements',
      type: 'checkbox',
      choices: DEFAULT_ACCOMPAGNEMENTS,
    });
  }
}

function ensureBoissonOnlyBissap(options) {
  const idx = options.findIndex((opt) => (opt?.name || '').toLowerCase().includes('boisson'));
  if (idx === -1) {
    options.push({ id: 'boisson', name: 'Boisson', type: 'checkbox', choices: DEFAULT_BOISSONS });
    return;
  }
  const group = options[idx] || {};
  const rawChoices = Array.isArray(group.choices) ? group.choices : [];
  const filtered = rawChoices.filter(
    (c) => getChoiceLabel(c).toLowerCase() === 'bissap'
  );
  options[idx] = {
    id: group.id ?? 'boisson',
    name: group.name ?? 'Boisson',
    type: group.type ?? 'checkbox',
    choices: filtered.length > 0 ? filtered : DEFAULT_BOISSONS,
  };
}

function augmentOptions(data) {
  try {
    let options = [];
    if (Array.isArray(data.options)) options = data.options;
    else if (typeof data.options === 'string') {
      try {
        const parsed = JSON.parse(data.options);
        if (Array.isArray(parsed)) options = parsed;
      } catch (_) {
        options = [];
      }
    }
    // Compléter/contraindre
    ensureAccompagnements(options);
    ensureBoissonOnlyBissap(options);
    data.options = options;
  } catch (_) {
    // En cas de problème, force au moins les défauts
    data.options = [
      { id: 'accompagnements', name: 'Accompagnements', type: 'checkbox', choices: DEFAULT_ACCOMPAGNEMENTS },
      { id: 'boisson', name: 'Boisson', type: 'checkbox', choices: DEFAULT_BOISSONS },
    ];
  }
  return data;
}

/**
 * @desc    Get menu items for a restaurant
 * @route   GET /api/menus/restaurant/:restaurantId
 * @access  Public
 */
exports.getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    let menuItems = await MenuItem.findAll({
      where: { restaurantId },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'street', 'city', 'postalCode', 'phone']
        }
      ],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // Enrichir options dans la réponse (sans modifier la BDD)
    menuItems = menuItems.map((it) => {
      const json = it.toJSON ? it.toJSON() : it;
      return augmentOptions(json);
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du menu'
    });
  }
};

/**
 * @desc    Get single menu item by ID
 * @route   GET /api/menus/:id
 * @access  Public
 */
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Recherche du plat ID:', id);
    
  // Récupération du plat
  const menuItem = await MenuItem.findByPk(id);

    if (!menuItem) {
      console.log('❌ Plat non trouvé');
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    console.log('✅ Plat trouvé:', menuItem.name);
    const data = augmentOptions(menuItem.toJSON ? menuItem.toJSON() : menuItem);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error fetching menu item:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du plat'
    });
  }
};

/**
 * @desc    Create new menu item
 * @route   POST /api/menus
 * @access  Private (restaurant owner)
 */
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.create({
      ...req.body,
      restaurantId: req.user.restaurantId || req.body.restaurantId
    });

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création du plat'
    });
  }
};

/**
 * @desc    Update menu item
 * @route   PUT /api/menus/:id
 * @access  Private (restaurant owner)
 */
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    await menuItem.update(req.body);

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du plat'
    });
  }
};

/**
 * @desc    Delete menu item
 * @route   DELETE /api/menus/:id
 * @access  Private (restaurant owner)
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    await menuItem.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du plat'
    });
  }
};
