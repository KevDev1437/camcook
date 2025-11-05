const { MenuItem, Restaurant, Accompaniment, Drink } = require('../models');

// Helper pour normaliser les accompagnements (supporte ancien format string et nouveau format objet)
function normalizeAccomp(acc) {
  if (typeof acc === 'string') {
    return { name: acc, price: 0 };
  }
  if (typeof acc === 'object' && acc !== null) {
    return {
      name: acc.name || acc.label || String(acc),
      price: typeof acc.price === 'number' ? acc.price : 0
    };
  }
  return { name: String(acc), price: 0 };
}

// Helper pour normaliser les boissons
function normalizeDrink(drink) {
  if (typeof drink === 'string') {
    return { name: drink, price: 0 };
  }
  if (typeof drink === 'object' && drink !== null) {
    return {
      name: drink.name || drink.label || String(drink),
      price: typeof drink.price === 'number' ? drink.price : 0
    };
  }
  return { name: String(drink), price: 0 };
}

/**
 * Récupérer les accompagnements depuis la table Accompaniment
 * Multi-Tenant : Filtre par restaurantId si fourni
 * 
 * @param {number|null} restaurantId - ID du restaurant pour filtrer (optionnel)
 * @returns {Promise<Array>} Liste des accompagnements avec name et price
 */
async function getDefaultAccompaniments(restaurantId = null) {
  try {
    const where = {};
    
    // Filtrer par restaurantId si fourni (multi-tenant)
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    const accompaniments = await Accompaniment.findAll({
      where,
      order: [['name', 'ASC']]
    });
    return accompaniments.map(acc => ({
      name: acc.name,
      price: parseFloat(acc.price) || 0
    }));
  } catch (error) {
    console.error('Error fetching default accompaniments:', error);
  }
  // Fallback vers les valeurs par défaut
  return [
    { name: 'Plantain Frit', price: 0 },
    { name: 'Baton de manioc', price: 0 },
    { name: 'Wete Fufu', price: 0 },
    { name: 'Frite de pomme', price: 0 }
  ];
}

/**
 * Récupérer les boissons depuis la table Drink
 * Multi-Tenant : Filtre par restaurantId si fourni
 * 
 * @param {number|null} restaurantId - ID du restaurant pour filtrer (optionnel)
 * @returns {Promise<Array>} Liste des boissons avec name et price
 */
async function getDefaultDrinks(restaurantId = null) {
  try {
    const where = {};
    
    // Filtrer par restaurantId si fourni (multi-tenant)
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    const drinks = await Drink.findAll({
      where,
      order: [['name', 'ASC']]
    });
    return drinks.map(drink => ({
      name: drink.name,
      price: parseFloat(drink.price) || 0
    }));
  } catch (error) {
    console.error('Error fetching default drinks:', error);
  }
  // Fallback vers les valeurs par défaut
  return [{ name: 'Bissap', price: 0 }];
}

function getChoiceLabel(choice) {
  if (choice && typeof choice === 'object') {
    return choice.label ?? choice.name ?? String(choice.value ?? choice.id ?? '');
  }
  return String(choice ?? '');
}

/**
 * Assurer que les accompagnements sont présents dans les options
 * Multi-Tenant : Filtre par restaurantId si fourni
 * 
 * @param {Array} options - Options du menu item
 * @param {number|null} restaurantId - ID du restaurant pour filtrer (optionnel)
 */
async function ensureAccompagnements(options, restaurantId = null) {
  const hasAccomp = options.some((opt) => (opt?.name || '').toLowerCase().includes('accomp'));
  if (!hasAccomp) {
    const defaultAccomp = await getDefaultAccompaniments(restaurantId);
    // Envoyer les objets avec name et price pour que le frontend puisse utiliser les prix
    const choices = defaultAccomp.map(acc => ({
      name: acc.name || String(acc),
      price: typeof acc.price === 'number' ? acc.price : 0
    }));
    options.push({
      id: 'accompagnements',
      name: 'Accompagnements',
      type: 'checkbox',
      choices: choices,
    });
  } else {
    // Remplacer les choix existants par ceux de la table Accompaniment pour avoir les nouveaux accompagnements
    const accompIndex = options.findIndex((opt) => (opt?.name || '').toLowerCase().includes('accomp'));
    if (accompIndex >= 0) {
      const defaultAccomp = await getDefaultAccompaniments(restaurantId);
      // Remplacer complètement les choix par ceux de la table (inclut les nouveaux accompagnements)
      const updatedChoices = defaultAccomp.map(acc => ({
        name: acc.name || String(acc),
        price: typeof acc.price === 'number' ? acc.price : 0
      }));
      
      options[accompIndex] = {
        ...options[accompIndex],
        choices: updatedChoices,
      };
    }
  }
}

/**
 * Assurer que les boissons sont présentes dans les options
 * Multi-Tenant : Filtre par restaurantId si fourni
 * 
 * @param {Array} options - Options du menu item
 * @param {number|null} restaurantId - ID du restaurant pour filtrer (optionnel)
 */
async function ensureBoissons(options, restaurantId = null) {
  const idx = options.findIndex((opt) => (opt?.name || '').toLowerCase().includes('boisson'));
  const defaultDrinks = await getDefaultDrinks(restaurantId);
  if (idx === -1) {
    // Envoyer les objets avec name et price pour que le frontend puisse utiliser les prix
    const choices = defaultDrinks.map(drink => ({
      name: drink.name || String(drink),
      price: typeof drink.price === 'number' ? drink.price : 0
    }));
    options.push({ id: 'boisson', name: 'Boisson', type: 'checkbox', choices: choices });
    return;
  }
  // Remplacer les choix existants par ceux de la table Drink pour avoir les nouvelles boissons
  const updatedChoices = defaultDrinks.map(drink => ({
    name: drink.name || String(drink),
    price: typeof drink.price === 'number' ? drink.price : 0
  }));
  
  const group = options[idx] || {};
  options[idx] = {
    id: group.id ?? 'boisson',
    name: group.name ?? 'Boisson',
    type: group.type ?? 'checkbox',
    choices: updatedChoices,
  };
}

/**
 * Fonction pour enrichir les options avec les accompagnements et boissons depuis les tables Accompaniment et Drink
 * Multi-Tenant : Filtre par restaurantId si fourni
 * 
 * @param {Object} data - Données du menu item (doit contenir restaurantId ou menuItemId pour récupérer restaurantId)
 * @param {number|null} restaurantId - ID du restaurant pour filtrer (optionnel, peut être extrait de data)
 * @returns {Promise<Object>} Données enrichies avec les options
 */
exports.augmentOptions = async function augmentOptions(data, restaurantId = null) {
  try {
    // Extraire restaurantId depuis data si non fourni
    let effectiveRestaurantId = restaurantId;
    if (!effectiveRestaurantId && data.restaurantId) {
      effectiveRestaurantId = data.restaurantId;
    }
    // Si menuItemId est fourni, on pourrait récupérer le restaurantId depuis la base
    // mais pour l'instant, on utilise celui fourni en paramètre
    
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
    // Compléter/contraindre avec les valeurs depuis les tables Accompaniment et Drink (filtrées par restaurantId)
    await ensureAccompagnements(options, effectiveRestaurantId);
    await ensureBoissons(options, effectiveRestaurantId);
    data.options = options;
  } catch (error) {
    console.error('Error augmenting options:', error);
      // En cas de problème, force au moins les défauts
    try {
      // Extraire restaurantId depuis data si non fourni
      let effectiveRestaurantId = restaurantId;
      if (!effectiveRestaurantId && data.restaurantId) {
        effectiveRestaurantId = data.restaurantId;
      }
      
      const [acc, dr] = await Promise.all([
        getDefaultAccompaniments(effectiveRestaurantId),
        getDefaultDrinks(effectiveRestaurantId)
      ]);
      const accChoices = acc.map(a => ({ name: a.name || String(a), price: a.price || 0 }));
      const drChoices = dr.map(d => ({ name: d.name || String(d), price: d.price || 0 }));
      data.options = [
        { id: 'accompagnements', name: 'Accompagnements', type: 'checkbox', choices: accChoices },
        { id: 'boisson', name: 'Boisson', type: 'checkbox', choices: drChoices },
      ];
    } catch (fallbackError) {
      // Fallback ultime
      data.options = [
        { 
          id: 'accompagnements', 
          name: 'Accompagnements', 
          type: 'checkbox', 
          choices: [
            { name: 'Plantain Frit', price: 0 },
            { name: 'Baton de manioc', price: 0 },
            { name: 'Wete Fufu', price: 0 },
            { name: 'Frite de pomme', price: 0 }
          ]
        },
        { 
          id: 'boisson', 
          name: 'Boisson', 
          type: 'checkbox', 
          choices: [{ name: 'Bissap', price: 0 }]
        },
      ];
    }
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
    // Passer restaurantId pour filtrer les accompagnements et boissons par restaurant
    menuItems = await Promise.all(menuItems.map(async (it) => {
      const json = it.toJSON ? it.toJSON() : it;
      return await exports.augmentOptions(json, restaurantId);
    }));

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
    const json = menuItem.toJSON ? menuItem.toJSON() : menuItem;
    // Passer restaurantId pour filtrer les accompagnements et boissons par restaurant
    const data = await exports.augmentOptions(json, menuItem.restaurantId);
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
    // Utiliser req.restaurantId si disponible (chargé par restaurantContext)
    const restaurantId = req.restaurantId || req.user?.restaurantId || req.body.restaurantId;
    
    const menuItem = await MenuItem.create({
      ...req.body,
      restaurantId: restaurantId
    });

    // Enrichir les options avec les accompagnements et boissons depuis les tables Accompaniment et Drink
    // Passer restaurantId pour filtrer par restaurant
    const json = menuItem.toJSON ? menuItem.toJSON() : menuItem;
    const data = await exports.augmentOptions(json, restaurantId);

    res.status(201).json({
      success: true,
      data
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

    // Recharger le menu pour avoir les dernières données
    await menuItem.reload();

    // Enrichir les options avec les accompagnements et boissons depuis les tables Accompaniment et Drink
    // Passer restaurantId pour filtrer par restaurant
    const json = menuItem.toJSON ? menuItem.toJSON() : menuItem;
    const data = await exports.augmentOptions(json, menuItem.restaurantId);

    res.status(200).json({
      success: true,
      data
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
