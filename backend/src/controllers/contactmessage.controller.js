const { Op } = require('sequelize');
const { ContactMessage } = require('../models');

// GET /api/contact-messages
exports.list = async (req, res) => {
  try {
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

// GET /api/contact-messages/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findByPk(id);
    if (!msg) return res.status(404).json({ success: false, error: 'Message introuvable' });
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// PATCH /api/contact-messages/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['new', 'read', 'archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }
    const msg = await ContactMessage.findByPk(id);
    if (!msg) return res.status(404).json({ success: false, error: 'Message introuvable' });
    await msg.update({ status });
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut' });
  }
};
