/**
 * Question Controller - Multi-Tenant
 * 
 * Ce controller gère les questions dans un contexte multi-tenant.
 * Toutes les fonctions vérifient que le menuItem appartient au restaurant actuel.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId (optionnel).
 * 
 * SÉCURITÉ :
 * - Vérifie que menuItem.restaurantId === req.restaurantId si req.restaurantId existe
 * - Empêche l'accès aux questions d'autres restaurants
 */

const { Question, MenuItem, User } = require('../models');

/**
 * Créer une nouvelle question sur un plat
 * Multi-Tenant : Vérifie que le menuItem appartient au restaurant actuel
 */
exports.createQuestion = async (req, res) => {
  try {
    const { menuItemId, text } = req.body;
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

    // Vérifier qu'une question n'existe pas déjà pour cet utilisateur et ce plat
    const existingQuestion = await Question.findOne({
      where: {
        menuItemId,
        userId
      }
    });

    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà posé une question sur ce plat'
      });
    }

    // Créer la question
    const question = await Question.create({
      menuItemId,
      userId,
      text,
      status: 'unanswered'
    });

    res.status(201).json({
      success: true,
      data: question,
      message: 'Question envoyée avec succès'
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la question',
      error: error.message
    });
  }
};

/**
 * Récupérer toutes les questions pour un plat
 * Multi-Tenant : Vérifie que le menuItem appartient au restaurant actuel
 */
exports.getMenuItemQuestions = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { limit = 10, offset = 0, showUnanswered = false } = req.query;

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

    // Filtrer les questions
    const where = { menuItemId };
    if (showUnanswered === 'true') {
      where.status = 'unanswered';
    }

    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'answerer',
          attributes: ['id', 'name'],
          required: false
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
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des questions',
      error: error.message
    });
  }
};

/**
 * Récupérer une question spécifique
 * Multi-Tenant : Vérifie que la question appartient au restaurant actuel
 */
exports.getQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'answerer',
          attributes: ['id', 'name']
        },
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'restaurantId']
        }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem de la question appartient au restaurant actuel
    if (req.restaurantId && question.menuItem && question.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This question belongs to another restaurant.'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la question',
      error: error.message
    });
  }
};

/**
 * Mettre à jour une question (par l'auteur)
 * Multi-Tenant : Vérifie que la question appartient au restaurant actuel
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'restaurantId']
        }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem de la question appartient au restaurant actuel
    if (req.restaurantId && question.menuItem && question.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This question belongs to another restaurant.'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (question.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission de modifier cette question'
      });
    }

    // Mettre à jour
    question.text = text;
    await question.save();

    res.json({
      success: true,
      data: question,
      message: 'Question mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la question',
      error: error.message
    });
  }
};

/**
 * Supprimer une question
 * Multi-Tenant : Vérifie que la question appartient au restaurant actuel
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'restaurantId']
        }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem de la question appartient au restaurant actuel
    if (req.restaurantId && question.menuItem && question.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This question belongs to another restaurant.'
      });
    }

    // Vérifier que l'utilisateur est l'auteur ou un admin
    if (question.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission de supprimer cette question'
      });
    }

    await question.destroy();

    res.json({
      success: true,
      message: 'Question supprimée avec succès'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la question',
      error: error.message
    });
  }
};

/**
 * Répondre à une question (Admin/Staff uniquement)
 * Multi-Tenant : Vérifie que la question appartient au restaurant actuel
 */
exports.answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const staffId = req.user.id;
    const userRole = req.user.role;

    // Vérifier que l'utilisateur est staff/admin ou restaurant owner
    if (userRole !== 'admin' && userRole !== 'staff' && userRole !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'Seul le personnel peut répondre aux questions'
      });
    }

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'restaurantId']
        }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }

    // Vérification multi-tenant : vérifier que le menuItem de la question appartient au restaurant actuel
    // Un restaurant owner ne peut répondre qu'aux questions de SON restaurant
    if (userRole === 'adminrestaurant' && req.restaurantId && question.menuItem && question.menuItem.restaurantId !== req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This question belongs to another restaurant.'
      });
    }

    // Ajouter la réponse
    question.answer = answer;
    question.answeredBy = staffId;
    question.answeredAt = new Date();
    question.status = 'answered';
    await question.save();

    res.json({
      success: true,
      data: question,
      message: 'Réponse ajoutée avec succès'
    });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse',
      error: error.message
    });
  }
};

/**
 * Obtenir les stats des questions pour un plat
 * Multi-Tenant : Vérifie que le menuItem appartient au restaurant actuel
 */
exports.getQuestionStats = async (req, res) => {
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
    const questions = await Question.findAll({
      where: { menuItemId },
      attributes: ['status', 'id']
    });

    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => q.status === 'answered').length;
    const unansweredQuestions = questions.filter(q => q.status === 'unanswered').length;

    res.json({
      success: true,
      data: {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        answerRate: totalQuestions > 0
          ? ((answeredQuestions / totalQuestions) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des stats',
      error: error.message
    });
  }
};
