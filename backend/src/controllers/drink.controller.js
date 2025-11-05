const { Drink } = require('../models');

/**
 * @desc    Get all drinks
 * @route   GET /api/drinks
 * @access  Public
 */
exports.getAllDrinks = async (req, res) => {
  try {
    const drinks = await Drink.findAll({
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
 * @desc    Get single drink by ID
 * @route   GET /api/drinks/:id
 * @access  Public
 */
exports.getDrinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const drink = await Drink.findByPk(id);

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
 * @desc    Create new drink
 * @route   POST /api/drinks
 * @access  Private (Admin)
 */
exports.createDrink = async (req, res) => {
  try {
    const { name, price } = req.body;

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

    const drink = await Drink.create({
      name: String(name).trim(),
      price: priceNum
    });

    res.status(201).json({
      success: true,
      data: drink
    });
  } catch (error) {
    console.error('Error creating drink:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Une boisson avec ce nom existe déjà'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création de la boisson'
    });
  }
};

/**
 * @desc    Update drink
 * @route   PUT /api/drinks/:id
 * @access  Private (Admin)
 */
exports.updateDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const drink = await Drink.findByPk(id);

    if (!drink) {
      return res.status(404).json({
        success: false,
        error: 'Boisson non trouvée'
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
        error: 'Une boisson avec ce nom existe déjà'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de la boisson'
    });
  }
};

/**
 * @desc    Delete drink
 * @route   DELETE /api/drinks/:id
 * @access  Private (Admin)
 */
exports.deleteDrink = async (req, res) => {
  try {
    const { id } = req.params;

    const drink = await Drink.findByPk(id);

    if (!drink) {
      return res.status(404).json({
        success: false,
        error: 'Boisson non trouvée'
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




