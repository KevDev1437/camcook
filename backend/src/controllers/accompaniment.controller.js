/**
 * Accompaniment Controller - Multi-Tenant
 * 
 * Ce controller gère les accompagnements dans un contexte multi-tenant.
 * Toutes les fonctions filtrent par restaurantId pour isoler les données.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId.
 * 
 * SÉCURITÉ :
 * - Les owners ne peuvent voir/modifier QUE les accompagnements de LEUR restaurant
 * - Les superadmins peuvent tout voir (pas de filtre si userRole === 'superadmin')
 */

const { Accompaniment } = require('../models');

/**
 * @desc    Get all accompaniments (filtrés par restaurantId si owner)
 * @route   GET /api/accompaniments
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getAllAccompaniments = async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    // Construire les conditions de recherche
    const where = {};
    
    // MULTI-TENANT : Toujours filtrer par restaurantId si disponible
    // Exception : Les admins peuvent voir tous les accompagnements (pas de filtre)
    if (req.restaurantId) {
      // Si c'est un admin, ne pas filtrer (voir tous les restaurants)
      if (userRole !== 'admin') {
        where.restaurantId = req.restaurantId;
      }
      // Si admin, where reste vide (pas de filtre)
    }
    // Si pas de restaurantId, where reste vide (retourne tous les accompagnements)

    const accompaniments = await Accompaniment.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: accompaniments.length,
      data: accompaniments
    });
  } catch (error) {
    console.error('Error fetching accompaniments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des accompagnements'
    });
  }
};

/**
 * @desc    Get single accompaniment by ID (vérifie que l'accompaniment appartient au restaurant)
 * @route   GET /api/accompaniments/:id
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.getAccompanimentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    
    // Construire les conditions de recherche
    const where = { id };
    
    // Si c'est un restaurant owner, filtrer par restaurantId
    // Les admins peuvent voir tous les accompagnements
    if (userRole === 'adminrestaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, filtrer par restaurantId
      where.restaurantId = req.restaurantId;
    }
    
    const accompaniment = await Accompaniment.findOne({ where });

    if (!accompaniment) {
      return res.status(404).json({
        success: false,
        error: 'Accompagnement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: accompaniment
    });
  } catch (error) {
    console.error('Error fetching accompaniment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'accompagnement'
    });
  }
};

/**
 * @desc    Create new accompaniment (ajoute automatiquement restaurantId)
 * @route   POST /api/accompaniments
 * @access  Private (Admin ou Restaurant owner)
 */
exports.createAccompaniment = async (req, res) => {
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
    } else if (userRole === 'adminrestaurant') {
      // Si owner sans restaurantContext, erreur
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    const accompaniment = await Accompaniment.create(createData);

    res.status(201).json({
      success: true,
      data: accompaniment
    });
  } catch (error) {
    console.error('Error creating accompaniment:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Un accompagnement avec ce nom existe déjà pour ce restaurant'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l\'accompagnement'
    });
  }
};

/**
 * @desc    Update accompaniment (vérifie que l'accompaniment appartient au restaurant)
 * @route   PUT /api/accompaniments/:id
 * @access  Private (Admin ou Restaurant owner)
 */
exports.updateAccompaniment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const userRole = req.user?.role;

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que l'accompaniment appartient à son restaurant
    if (userRole === 'adminrestaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent modifier tous les accompagnements

    const accompaniment = await Accompaniment.findOne({ where });

    if (!accompaniment) {
      return res.status(404).json({
        success: false,
        error: 'Accompagnement non trouvé ou accès refusé'
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

    await accompaniment.update(updateData);

    res.status(200).json({
      success: true,
      data: accompaniment
    });
  } catch (error) {
    console.error('Error updating accompaniment:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Un accompagnement avec ce nom existe déjà pour ce restaurant'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'accompagnement'
    });
  }
};

/**
 * @desc    Delete accompaniment (vérifie que l'accompaniment appartient au restaurant)
 * @route   DELETE /api/accompaniments/:id
 * @access  Private (Admin ou Restaurant owner)
 */
exports.deleteAccompaniment = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que l'accompaniment appartient à son restaurant
    if (userRole === 'adminrestaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent supprimer tous les accompagnements

    const accompaniment = await Accompaniment.findOne({ where });

    if (!accompaniment) {
      return res.status(404).json({
        success: false,
        error: 'Accompagnement non trouvé ou accès refusé'
      });
    }

    await accompaniment.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting accompaniment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'accompagnement'
    });
  }
};
