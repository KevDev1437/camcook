const { Review, MenuItem, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Créer un nouvel avis pour un plat
 * Un utilisateur ne peut laisser qu'un seul avis par plat
 */
exports.createReview = async (req, res) => {
  try {
    const { menuItemId, rating, text } = req.body;
    const userId = req.user.id;

    // Vérifier que le plat existe
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Vérifier qu'un avis n'existe pas déjà pour cet utilisateur et ce plat
    const existingReview = await Review.findOne({
      where: {
        menuItemId,
        userId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce plat'
      });
    }

    // Créer l'avis
    const review = await Review.create({
      menuItemId,
      userId,
      rating,
      text,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Avis créé avec succès (en attente de modération)'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis',
      error: error.message
    });
  }
};

/**
 * Récupérer tous les avis pour un plat
 */
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Vérifier que le plat existe
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Récupérer les avis approuvés
    const { count, rows } = await Review.findAndCountAll({
      where: {
        menuItemId,
        status: 'approved'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
};

/**
 * Récupérer un avis spécifique
 */
exports.getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'avis',
      error: error.message
    });
  }
};

/**
 * Mettre à jour un avis (par l'auteur)
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, text } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission de modifier cet avis'
      });
    }

    // Mettre à jour
    review.rating = rating;
    review.text = text;
    review.status = 'pending'; // Retour en attente de modération
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Avis mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'avis',
      error: error.message
    });
  }
};

/**
 * Supprimer un avis
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission de supprimer cet avis'
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis',
      error: error.message
    });
  }
};

/**
 * Obtenir les stats des avis pour un plat
 */
exports.getReviewStats = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    // Vérifier que le plat existe
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Récupérer les stats
    const reviews = await Review.findAll({
      where: {
        menuItemId,
        status: 'approved'
      },
      attributes: ['rating', 'id']
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Répartition des étoiles
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des stats',
      error: error.message
    });
  }
};
