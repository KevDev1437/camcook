const { Op } = require('sequelize');
const { Order, Restaurant } = require('../models');

// Resolve CamCook restaurant id
const resolveRestaurantId = async () => {
  const envId = process.env.CAMCOOK_RESTAURANT_ID && parseInt(process.env.CAMCOOK_RESTAURANT_ID, 10);
  if (envId && !Number.isNaN(envId)) {
    const byId = await Restaurant.findByPk(envId);
    if (byId) return byId.id;
  }
  const byName = await Restaurant.findOne({ where: { name: 'CamCook' } });
  return byName ? byName.id : null;
};

// POST /api/orders
exports.create = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ success: false, error: 'Non autorisé' });

    const {
      items = [], // [{ id, name, quantity, price, options }]
      subtotal,
      deliveryFee = 0,
      tax = 0,
      total,
      orderType = 'pickup', // 'pickup' | 'delivery'
      address = {}, // { street, city, postalCode, latitude, longitude, instructions }
      notes = '',
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun article' });
    }

    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'Restaurant indisponible' });
    }

    // Sécurisation minimale: forcer paiement en cash et statut initial
    const payload = {
      customerId,
      restaurantId,
      items,
      subtotal: Number(subtotal || 0),
      deliveryFee: Number(deliveryFee || 0),
      tax: Number(tax || 0),
      total: Number(total || 0),
      orderType: orderType === 'delivery' ? 'delivery' : 'pickup',
      deliveryStreet: address.street || null,
      deliveryCity: address.city || null,
      deliveryPostalCode: address.postalCode || null,
      deliveryLatitude: address.latitude || null,
      deliveryLongitude: address.longitude || null,
      deliveryInstructions: address.instructions || null,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      notes: notes || null,
    };

    const created = await Order.create(payload);
    return res.status(201).json({ success: true, data: { id: created.id, orderNumber: created.orderNumber } });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Erreur création commande' });
  }
};

// GET /api/orders/my-orders
exports.myOrders = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ success: false, error: 'Non autorisé' });

    const { status, page = 1, limit = 50 } = req.query;
    const where = { customerId };
    if (status) where.status = status;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.status(200).json({ success: true, data: rows, meta: { total: count, page: pageNum, limit: pageSize, pages: Math.ceil(count / pageSize) } });
  } catch (error) {
    console.error('My orders error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commandes' });
  }
};

// GET /api/orders/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande introuvable' });
    // Autoriser si propriétaire
    if (String(order.customerId) !== String(req.user?.id)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commande' });
  }
};
