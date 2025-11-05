/**
 * Order Controller - Multi-Tenant
 * 
 * Ce controller gère les commandes dans un contexte multi-tenant.
 * Toutes les fonctions utilisent req.restaurantId qui est chargé
 * automatiquement par le middleware restaurantContext.
 * 
 * IMPORTANT : Le middleware restaurantContext doit être appliqué avant
 * d'appeler ces fonctions pour charger req.restaurantId.
 * 
 * SÉCURITÉ :
 * - Un restaurant owner ne peut voir QUE les commandes de SON restaurant
 * - Avant toute opération sur une commande, vérifier que order.restaurantId === req.restaurantId
 * - Les admins peuvent tout voir (userRole === 'admin')
 */

const { Op } = require('sequelize');
const { Order, Restaurant } = require('../models');

/**
 * Normaliser les options d'une commande (accompagnements et boissons)
 */
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

/**
 * @desc    Create new order (utilise req.restaurantId chargé par le middleware)
 * @route   POST /api/orders
 * @access  Protected (customer)
 */
exports.create = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    // req.restaurantId est chargé par le middleware restaurantContext
    if (!req.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

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

    // Utiliser req.restaurantId au lieu de resolveRestaurantId()
    const restaurantId = req.restaurantId;

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
        restaurantId, // Utiliser req.restaurantId
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

/**
 * @desc    Get customer orders (filtrées par restaurantId si owner)
 * @route   GET /api/orders/my-orders
 * @access  Protected (customer ou restaurant owner)
 */
exports.myOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    const { status, page = 1, limit = 50 } = req.query;
    
    // Construire les conditions de recherche
    const where = {};
    
    // Si c'est un restaurant owner, filtrer par restaurantId
    if (userRole === 'restaurant' && req.restaurantId) {
      // Un owner ne peut voir QUE les commandes de SON restaurant
      where.restaurantId = req.restaurantId;
    } else if (userRole === 'customer') {
      // Un customer voit ses propres commandes
      where.customerId = userId;
    } else if (userRole === 'admin') {
      // Un admin voit toutes les commandes (pas de filtre)
    } else {
      // Par défaut, si restaurantId est disponible, filtrer par restaurant
      if (req.restaurantId) {
        where.restaurantId = req.restaurantId;
      } else {
        // Sinon, filtrer par customerId
        where.customerId = userId;
      }
    }

    if (status) {
      where.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
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
      meta: {
        total: count,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('My orders error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commandes' });
  }
};

/**
 * @desc    Get restaurant orders (pour les owners)
 * @route   GET /api/orders/restaurant
 * @access  Protected (restaurant owner ou admin)
 */
exports.getRestaurantOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    // req.restaurantId est requis pour cette route
    if (!req.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du restaurant ou un admin
    if (userRole === 'restaurant') {
      // Vérifier que l'utilisateur est le propriétaire de ce restaurant
      const restaurant = await Restaurant.findByPk(req.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Vous devez être le propriétaire de ce restaurant.'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Seuls les propriétaires de restaurant et les admins peuvent accéder à cette route.'
      });
    }

    const { status, page = 1, limit = 50 } = req.query;
    
    // Filtrer par restaurantId (un owner ne peut voir QUE les commandes de SON restaurant)
    const where = {
      restaurantId: req.restaurantId
    };

    if (status) {
      where.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
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
      meta: {
        total: count,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commandes du restaurant' });
  }
};

/**
 * @desc    Get order by ID (vérifie que order.restaurantId === req.restaurantId pour les owners)
 * @route   GET /api/orders/:id
 * @access  Protected (customer, restaurant owner ou admin)
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    // Vérifications de sécurité multi-tenant
    if (userRole === 'customer') {
      // Un customer ne peut voir que SES commandes
      if (String(order.customerId) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Accès refusé' });
      }
    } else if (userRole === 'restaurant') {
      // Un restaurant owner ne peut voir que les commandes de SON restaurant
      if (req.restaurantId && String(order.restaurantId) !== String(req.restaurantId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Cette commande n\'appartient pas à votre restaurant.'
        });
      }
      // Vérifier aussi que l'owner est bien le propriétaire du restaurant
      if (req.restaurantId) {
        const restaurant = await Restaurant.findByPk(req.restaurantId);
        if (!restaurant || restaurant.ownerId !== userId) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé. Vous devez être le propriétaire de ce restaurant.'
          });
        }
      }
    } else if (userRole !== 'admin') {
      // Les admins peuvent tout voir, mais les autres rôles non reconnus sont refusés
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commande' });
  }
};

/**
 * @desc    Update order status (vérifie que order.restaurantId === req.restaurantId)
 * @route   PUT /api/orders/:id/status
 * @access  Protected (restaurant owner ou admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    // req.restaurantId est requis pour cette route
    if (!req.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant context not loaded. Ensure restaurantContext middleware is applied.'
      });
    }

    if (!status) {
      return res.status(400).json({ success: false, error: 'Statut requis' });
    }

    // Statuts valides
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    // Vérification de sécurité : vérifier que order.restaurantId === req.restaurantId
    if (String(order.restaurantId) !== String(req.restaurantId)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Cette commande n\'appartient pas à votre restaurant.'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du restaurant ou un admin
    if (userRole === 'restaurant') {
      const restaurant = await Restaurant.findByPk(req.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Vous devez être le propriétaire de ce restaurant.'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Seuls les propriétaires de restaurant et les admins peuvent modifier le statut d\'une commande.'
      });
    }

    // Mettre à jour le statut
    await order.update({ status });

    res.status(200).json({
      success: true,
      message: 'Statut de la commande mis à jour',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut' });
  }
};

/**
 * @desc    Get all orders (admin only, ou filtrées par restaurantId si owner)
 * @route   GET /api/orders
 * @access  Protected (admin ou restaurant owner)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    // Si c'est un restaurant owner, filtrer par restaurantId
    if (userRole === 'restaurant' && req.restaurantId) {
      // Un owner ne peut voir QUE les commandes de SON restaurant
      const where = { restaurantId: req.restaurantId };
      
      const { status, page = 1, limit = 50 } = req.query;
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

      return res.status(200).json({
        success: true,
        data: rows,
        meta: {
          total: count,
          page: pageNum,
          limit: pageSize,
          pages: Math.ceil(count / pageSize)
        }
      });
    } else if (userRole === 'admin') {
      // Un admin peut voir toutes les commandes
      const { status, restaurantId, page = 1, limit = 50 } = req.query;
      const where = {};
      
      if (status) where.status = status;
      if (restaurantId) where.restaurantId = restaurantId;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
      const offset = (pageNum - 1) * pageSize;

      const { rows, count } = await Order.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset,
      });

      return res.status(200).json({
        success: true,
        data: rows,
        meta: {
          total: count,
          page: pageNum,
          limit: pageSize,
          pages: Math.ceil(count / pageSize)
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Seuls les admins et les propriétaires de restaurant peuvent accéder à cette route.'
      });
    }
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, error: 'Erreur récupération commandes' });
  }
};
