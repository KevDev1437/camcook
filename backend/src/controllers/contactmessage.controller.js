/**
 * Contact Message Controller - Multi-Tenant
 * 
 * Ce controller gère les messages de contact dans un contexte multi-tenant.
 * Toutes les fonctions filtrent par restaurantId pour isoler les données.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId.
 * 
 * SÉCURITÉ :
 * - Les owners ne peuvent voir/modifier QUE les messages de LEUR restaurant
 * - Les admins peuvent tout voir (pas de filtre si userRole === 'admin')
 */

const { Op } = require('sequelize');
const { ContactMessage } = require('../models');

/**
 * @desc    List contact messages (filtrés par restaurantId si owner)
 * @route   GET /api/contact-messages
 * @access  Protected (Admin ou Restaurant owner)
 */
exports.list = async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    const {
      status, // new | read | archived
      type,   // restaurant | problem
      q,      // free-text search in name/email/message
      page = 1,
      limit = 20,
      sort = 'createdAt',
      direction = 'DESC'
    } = req.query;

    const where = {};
    
    // Filtrer par restaurantId si l'utilisateur est un restaurant owner
    if (userRole === 'restaurant' && req.restaurantId) {
      // Un owner ne peut voir QUE les messages de SON restaurant
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué et l'utilisateur n'est pas admin, filtrer par restaurantId
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent voir tous les messages (pas de filtre)

    if (status) where.status = status;
    if (type) where.type = type;
    if (q && String(q).trim()) {
      const query = `%${String(q).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: query } },
        { email: { [Op.like]: query } },
        { message: { [Op.like]: query } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const orderField = ['createdAt', 'status', 'type', 'name', 'email'].includes(sort) ? sort : 'createdAt';
    const orderDir = String(direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows, count } = await ContactMessage.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [[orderField, orderDir]],
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    console.error('Error listing contact messages:', error);
    res.status(500).json({ success: false, error: 'Erreur lors du listing' });
  }
};

/**
 * @desc    Get contact message by ID (vérifie que le message appartient au restaurant)
 * @route   GET /api/contact-messages/:id
 * @access  Protected (Admin ou Restaurant owner)
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    
    // Construire les conditions de recherche
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que le message appartient à son restaurant
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent voir tous les messages

    const msg = await ContactMessage.findOne({ where });
    
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message introuvable ou accès refusé' });
    }
    
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

/**
 * @desc    Create contact message (ajoute automatiquement restaurantId)
 * @route   POST /api/contact-messages
 * @access  Public (mais restaurantContext.required doit être appliqué)
 */
exports.create = async (req, res) => {
  try {
    const { name, email, type = 'restaurant', message } = req.body || {};
    const errors = [];
    
    if (!name || String(name).trim().length === 0) {
      errors.push('Nom requis');
    }
    if (!email || String(email).trim().length === 0) {
      errors.push('Email requis');
    }
    const emailTrimmed = (email || '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (email && !emailOk) {
      errors.push('Email invalide');
    }
    if (!message || String(message).trim().length === 0) {
      errors.push('Message requis');
    }
    const allowedTypes = ['restaurant', 'problem'];
    if (type && !allowedTypes.includes(type)) {
      errors.push('Type invalide');
    }
    
    if (errors.length) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    // req.restaurantId est requis (chargé par restaurantContext)
    if (!req.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    const created = await ContactMessage.create({
      name: String(name).trim(),
      email: emailTrimmed,
      type: allowedTypes.includes(type) ? type : 'restaurant',
      message: String(message).trim(),
      restaurantId: req.restaurantId // Ajouter restaurantId automatiquement
    });

    return res.status(201).json({ success: true, data: { id: created.id } });
  } catch (error) {
    console.error('Error handling contact message:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi' });
  }
};

/**
 * @desc    Update contact message status (vérifie que le message appartient au restaurant)
 * @route   PATCH /api/contact-messages/:id/status
 * @access  Protected (Admin ou Restaurant owner)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const userRole = req.user?.role;
    const allowed = ['new', 'read', 'archived'];
    
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que le message appartient à son restaurant
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent modifier tous les messages

    const msg = await ContactMessage.findOne({ where });
    
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message introuvable ou accès refusé' });
    }
    
    await msg.update({ status });
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut' });
  }
};

/**
 * @desc    Delete contact message (vérifie que le message appartient au restaurant)
 * @route   DELETE /api/contact-messages/:id
 * @access  Protected (Admin ou Restaurant owner)
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Construire les conditions de recherche pour vérifier l'appartenance
    const where = { id };
    
    // Si c'est un restaurant owner, vérifier que le message appartient à son restaurant
    if (userRole === 'restaurant' && req.restaurantId) {
      where.restaurantId = req.restaurantId;
    } else if (userRole !== 'admin' && req.restaurantId) {
      // Si restaurantContext est appliqué, vérifier l'appartenance
      where.restaurantId = req.restaurantId;
    }
    // Les admins peuvent supprimer tous les messages

    const msg = await ContactMessage.findOne({ where });
    
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message introuvable ou accès refusé' });
    }
    
    await msg.destroy();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
};
