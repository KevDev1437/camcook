/**
 * Review Controller - Multi-Tenant
 * 
 * Ce controller gère les avis dans un contexte multi-tenant.
 * Toutes les fonctions vérifient que le menuItem appartient au restaurant actuel.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId (optionnel).
 * 
 * SÉCURITÉ :
 * - Vérifie que menuItem.restaurantId === req.restaurantId si req.restaurantId existe
 * - Empêche l'accès aux reviews d'autres restaurants
 */

const { Review, MenuItem, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Créer un nouvel avis pour un plat
 * Multi-Tenant : Vérifie que le menuItem appartient au restaurant actuel
 */
exports.createReview = async (req, res) => {
  try {
    const { menuItemId, rating, text } = req.body;
    const userId = req.user.id;

    // Vérifier que le plat existe et récupérer ses informations
    const menuItem = await MenuItem.findByPk(menuItemId, {
      attributes: ['id', 'name', 'restaurantId']
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem appartient au restaurant actuel
    if (req.restaurantId && menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This menu item belongs to another restaurant.'
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
 * Multi-Tenant : Filtre par restaurantId si disponible
 */
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Vérifier que le plat existe et récupérer ses informations
    const menuItem = await MenuItem.findByPk(menuItemId, {
      attributes: ['id', 'name', 'restaurantId']
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem appartient au restaurant actuel
    if (req.restaurantId && menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This menu item belongs to another restaurant.'
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
 * Multi-Tenant : Vérifie que le review appartient au restaurant actuel
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
          attributes: ['id', 'name', 'restaurantId']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem du review appartient au restaurant actuel
    if (req.restaurantId && review.menuItem && review.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This review belongs to another restaurant.'
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
 * Multi-Tenant : Vérifie que le review appartient au restaurant actuel
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, text } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'restaurantId']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem du review appartient au restaurant actuel
    if (req.restaurantId && review.menuItem && review.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This review belongs to another restaurant.'
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
 * Multi-Tenant : Vérifie que le review appartient au restaurant actuel
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'restaurantId']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem du review appartient au restaurant actuel
    if (req.restaurantId && review.menuItem && review.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This review belongs to another restaurant.'
      });
    }

    // Vérifier que l'utilisateur est l'auteur ou un admin
    if (review.userId !== userId && userRole !== 'admin') {
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
 * Multi-Tenant : Vérifie que le menuItem appartient au restaurant actuel
 */
exports.getReviewStats = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    // Vérifier que le plat existe et récupérer ses informations
    const menuItem = await MenuItem.findByPk(menuItemId, {
      attributes: ['id', 'name', 'restaurantId']
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Plat non trouvé'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem appartient au restaurant actuel
    if (req.restaurantId && menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This menu item belongs to another restaurant.'
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
