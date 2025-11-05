/**
 * Drink Controller - Multi-Tenant
 * 
 * Ce controller gère les boissons dans un contexte multi-tenant.
 * Toutes les fonctions filtrent par restaurantId pour isoler les données.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId.
 * 
 * SÉCURITÉ :
 * - Les owners ne peuvent voir/modifier QUE les boissons de LEUR restaurant
 * - Les admins peuvent tout voir (pas de filtre si userRole === 'admin')
 */

const { Drink } = require('../models');

/**
 * @desc    Get all drinks (filtrés par restaurantId si owner)
 * @route   GET /api/drinks
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getAllDrinks = async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    // Construire les conditions de recherche
    const where = {};
    
    // MULTI-TENANT : Toujours filtrer par restaurantId si disponible
    // Exception : Les admins peuvent voir toutes les boissons (pas de filtre)
    if (req.restaurantId) {
      // Si c'est un admin, ne pas filtrer (voir tous les restaurants)
      if (userRole !== 'admin') {
        where.restaurantId = req.restaurantId;
      }
      // Si admin, where reste vide (pas de filtre)
    }
    // Si pas de restaurantId, where reste vide (retourne toutes les boissons)

    const drinks = await Drink.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: drinks.length,
      data: drinks
    });
  } catch (error) {
    console.error('Error fetching drinks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des boissons'
    });
  }
};

/**
 * @desc    Get single drink by ID (vérifie que la boisson appartient au restaurant)
 * @route   GET /api/drinks/:id
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getDrinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    
    // Construire les conditions de recherche
    const where = { id };
    
    // Si c'est un restaurant owner, filtrer par restaurantId
    // Les admins peuvent voir toutes les boissons
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, filtrer par restaurantId
      where.restaurantId = req.restaurantId;
    }
    
    const drink = await Drink.findOne({ where });

    if (!drink) {
      return res.status(404).json({
        success: false,
        error: 'Boisson non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: drink
    });
  } catch (error) {
    console.error('Error fetching drink:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la boisson'
    });
  }
};

/**
 * @desc    Create new drink (ajoute automatiquement restaurantId)
 * @route   POST /api/drinks
 * @access  Private (Admin ou Restaurant owner)
 */
exports.createDrink = async (req, res) => {
  try {
    const { name, price } = req.body;
    const userRole = req.user?.role;

    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le nom est requis'
      });
    }

    const priceNum = parseFloat(price || 0);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Le prix doit être un nombre valide et positif'
      });
    }

    // Si restaurantContext est appliqué, utiliser req.restaurantId
    // Sinon, permettre aux admins de créer sans restaurantId (pour compatibilité)
    const createData = {
      name: String(name).trim(),
      price: priceNum
    };

    // Ajouter restaurantId si disponible (restaurantContext appliqué)
    if (req.restaurantId) {
      createData.restaurantId = req.restaurantId;
    } else if (userRole === 'restaurant') {
      // Si owner sans restaurantContext, erreur
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    const drink = await Drink.create(createData);

    res.status(201).json({
      success: true,
      data: drink
    });
  } catch (error) {
    console.error('Error creating drink:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Une boisson avec ce nom existe déjà pour ce restaurant'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création de la boisson'
    });
  }
};

/**
 * @desc    Update drink (vérifie que la boisson appartient au restaurant)
 * @route   PUT /api/drinks/:id
 * @access  Private (Admin ou Restaurant owner)
 */
exports.updateDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const userRole = req.user?.role;

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que la boisson appartient à son restaurant
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent modifier toutes les boissons

    const drink = await Drink.findOne({ where });

    if (!drink) {
      return res.status(404).json({
        success: false,
        error: 'Boisson non trouvée ou accès refusé'
      });
    }

    const updateData = {};
    if (name !== undefined) {
      if (String(name).trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Le nom ne peut pas être vide'
        });
      }
      updateData.name = String(name).trim();
    }
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Le prix doit être un nombre valide et positif'
        });
      }
      updateData.price = priceNum;
    }

    await drink.update(updateData);

    res.status(200).json({
      success: true,
      data: drink
    });
  } catch (error) {
    console.error('Error updating drink:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Une boisson avec ce nom existe déjà pour ce restaurant'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de la boisson'
    });
  }
};

/**
 * @desc    Delete drink (vérifie que la boisson appartient au restaurant)
 * @route   DELETE /api/drinks/:id
 * @access  Private (Admin ou Restaurant owner)
 */
exports.deleteDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que la boisson appartient à son restaurant
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent supprimer toutes les boissons

    const drink = await Drink.findOne({ where });

    if (!drink) {
      return res.status(404).json({
        success: false,
        error: 'Boisson non trouvée ou accès refusé'
      });
    }

    await drink.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting drink:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la boisson'
    });
  }
};
