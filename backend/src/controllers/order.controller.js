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

function normalizeOptions(options) {
  const out = { accompagnements: [], boisson: null };
  try {
    if (!options || typeof options !== 'object') return out;
    const acc = options.accompagnements || options.accompaniments || options['accompagnements'] || [];
    out.accompagnements = Array.isArray(acc) ? acc.map((v) => String(v)) : [];
    const boisson = options.boisson ?? options.drink ?? null;
    if (Array.isArray(boisson)) {
      out.boisson = boisson.includes('Bissap') ? 'Bissap' : (boisson[0] ? String(boisson[0]) : null);
    } else if (boisson === true || (typeof boisson === 'string' && boisson.toLowerCase() === 'bissap')) {
      out.boisson = 'Bissap';
    } else if (typeof boisson === 'string') {
      out.boisson = boisson;
    } else {
      out.boisson = null;
    }
  } catch (_) {}
  return out;
}

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

    // Générer un orderGroupId pour grouper les commandes du même panier
    const orderGroupId = `GRP${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Normaliser et sécuriser les items
    const safeItems = items.map((it, idx) => {
      const quantity = Math.max(1, parseInt(it.quantity || 1, 10));
      const unitPrice = Number(it.price || it.unitPrice || 0);
      const name = String(it.name || it.title || `Article ${idx + 1}`);
      const id = it.id || it.menuItemId || null;
      return {
        id,
        name,
        quantity,
        price: +unitPrice.toFixed(2),
        options: normalizeOptions(it.options || {}),
      };
    });

    // Créer une commande séparée pour chaque article
    const createdOrders = [];
    const deliveryFeePerOrder = safeItems.length > 0 ? Number(deliveryFee || 0) / safeItems.length : 0;
    const taxPerOrder = safeItems.length > 0 ? Number(tax || 0) / safeItems.length : 0;

    for (const item of safeItems) {
      // Calculer le total pour cet article (prix × quantité)
      const itemSubtotal = item.price * item.quantity;
      const itemTotal = itemSubtotal + deliveryFeePerOrder + taxPerOrder;

      const payload = {
        customerId,
        restaurantId,
        orderGroupId, // Même orderGroupId pour toutes les commandes du panier
        items: [item], // Un seul article par commande
        subtotal: +itemSubtotal.toFixed(2),
        deliveryFee: +deliveryFeePerOrder.toFixed(2),
        tax: +taxPerOrder.toFixed(2),
        total: +itemTotal.toFixed(2),
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
      createdOrders.push({
        id: created.id,
        orderNumber: created.orderNumber,
        itemName: item.name,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        orderGroupId,
        orders: createdOrders,
        totalOrders: createdOrders.length,
      },
    });
  } catch (error) {
    console.error('Create order error:', error?.message || error);
    const msg = error?.errors?.[0]?.message || error?.message || 'Erreur création commande';
    const status = (error?.name || '').includes('Validation') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
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
