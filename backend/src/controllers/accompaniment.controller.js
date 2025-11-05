const { Accompaniment } = require('../models');

/**
 * @desc    Get all accompaniments
 * @route   GET /api/accompaniments
 * @access  Public
 */
exports.getAllAccompaniments = async (req, res) => {
  try {
    const accompaniments = await Accompaniment.findAll({
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
 * @desc    Get single accompaniment by ID
 * @route   GET /api/accompaniments/:id
 * @access  Public
 */
exports.getAccompanimentById = async (req, res) => {
  try {
    const { id } = req.params;
    const accompaniment = await Accompaniment.findByPk(id);

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
 * @desc    Create new accompaniment
 * @route   POST /api/accompaniments
 * @access  Private (Admin)
 */
exports.createAccompaniment = async (req, res) => {
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

    const accompaniment = await Accompaniment.create({
      name: String(name).trim(),
      price: priceNum
    });

    res.status(201).json({
      success: true,
      data: accompaniment
    });
  } catch (error) {
    console.error('Error creating accompaniment:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Un accompagnement avec ce nom existe déjà'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l\'accompagnement'
    });
  }
};

/**
 * @desc    Update accompaniment
 * @route   PUT /api/accompaniments/:id
 * @access  Private (Admin)
 */
exports.updateAccompaniment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const accompaniment = await Accompaniment.findByPk(id);

    if (!accompaniment) {
      return res.status(404).json({
        success: false,
        error: 'Accompagnement non trouvé'
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
        error: 'Un accompagnement avec ce nom existe déjà'
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'accompagnement'
    });
  }
};

/**
 * @desc    Delete accompaniment
 * @route   DELETE /api/accompaniments/:id
 * @access  Private (Admin)
 */
exports.deleteAccompaniment = async (req, res) => {
  try {
    const { id } = req.params;

    const accompaniment = await Accompaniment.findByPk(id);

    if (!accompaniment) {
      return res.status(404).json({
        success: false,
        error: 'Accompagnement non trouvé'
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




