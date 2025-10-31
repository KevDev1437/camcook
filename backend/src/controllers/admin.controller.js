const { Op } = require('sequelize');
const { Order, Review, User, MenuItem } = require('../models');

// Map front statuses to internal order statuses
const mapOrderStatus = (status) => {
  // recu, en_cours, livrer, annuler
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'recu':
      return ['pending', 'confirmed'];
    case 'en_cours':
      return ['preparing', 'ready', 'on_delivery'];
    case 'livrer':
      return ['completed'];
    case 'annuler':
    case 'annulé':
    case 'annule':
      return ['cancelled'];
    default:
      return null; // no filter
  }
};

exports.listOrders = async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const where = {};
    const mapped = mapOrderStatus(status);
    if (mapped) where.status = { [Op.in]: mapped };
    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      where[Op.or] = [
        { orderNumber: { [Op.like]: like } },
        { notes: { [Op.like]: like } },
      ];
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: { total: count, page: pageNum, limit: pageSize, pages: Math.ceil(count / pageSize) },
    });
  } catch (error) {
    console.error('Admin listOrders error:', error);
    res.status(500).json({ success: false, error: 'Erreur lors du listing des commandes' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['pending', 'confirmed', 'preparing', 'ready', 'on_delivery', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande introuvable' });
    await order.update({ status });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Admin updateOrderStatus error:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour statut commande' });
  }
};

exports.listReviews = async (req, res) => {
  try {
    const { status = 'pending', q, page = 1, limit = 20 } = req.query;
    const where = {};
    if (['pending', 'approved', 'rejected'].includes(status)) where.status = status;
    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      where.text = { [Op.like]: like };
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;
    const { rows, count } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: MenuItem, as: 'menuItem', attributes: ['id', 'name', 'price'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });
    res.status(200).json({ success: true, data: rows, meta: { total: count, page: pageNum, limit: pageSize, pages: Math.ceil(count / pageSize) } });
  } catch (error) {
    console.error('Admin listReviews error:', error);
    res.status(500).json({ success: false, error: 'Erreur listing avis' });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, error: 'Statut invalide' });
    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, error: 'Avis introuvable' });
    await review.update({ status });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Admin updateReviewStatus error:', error);
    res.status(500).json({ success: false, error: 'Erreur maj statut avis' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, q, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role && ['customer', 'restaurant', 'admin'].includes(role)) where.role = role;
    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: like } },
        { email: { [Op.like]: like } },
        { phone: { [Op.like]: like } },
      ];
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;
    const { rows, count } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
      attributes: { exclude: ['password'] },
    });
    res.status(200).json({ success: true, data: rows, meta: { total: count, page: pageNum, limit: pageSize, pages: Math.ceil(count / pageSize) } });
  } catch (error) {
    console.error('Admin listUsers error:', error);
    res.status(500).json({ success: false, error: 'Erreur listing utilisateurs' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body || {};
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    const updates = {};
    if (role && ['customer', 'restaurant', 'admin'].includes(role)) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    await user.update(updates);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Admin updateUser error:', error);
    res.status(500).json({ success: false, error: 'Erreur maj utilisateur' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Empêcher de se supprimer soi-même
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    await user.destroy(); // Soft delete grâce à paranoid: true
    res.status(200).json({ success: true, data: { id: user.id, deletedAt: user.deletedAt || new Date() } });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression utilisateur' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const prefs = req.user.preferences || { theme: 'light', notifications: true };
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur récupération paramètres' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { theme, notifications } = req.body || {};
    const prefs = {
      ...(req.user.preferences || {}),
      ...(theme ? { theme } : {}),
      ...(typeof notifications === 'boolean' ? { notifications } : {}),
    };
    await req.user.update({ preferences: prefs });
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur mise à jour paramètres' });
  }
};
