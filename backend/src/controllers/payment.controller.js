const stripe = require('../config/stripe');
const { Order } = require('../models/index');

/**
 * Créer un Payment Intent pour une commande
 * POST /api/payments/create-intent
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: 'Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans .env',
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    const { amount, currency = 'eur', orderId, orderGroupId, paymentMethodType = 'card' } = req.body;
    // orderId peut être un orderGroupId (commence par GRP) ou un ID de commande

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide' });
    }

    // Convertir le montant en centimes (Stripe utilise les plus petites unités)
    const amountInCents = Math.round(amount * 100);

    // Créer le Payment Intent
    // Utilisation de automatic_payment_methods pour permettre Apple Pay / Google Pay automatiquement
    // On ne peut pas utiliser payment_method_types et automatic_payment_methods en même temps
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: userId.toString(),
        orderId: orderId ? orderId.toString() : null,
        orderGroupId: orderGroupId ? orderGroupId.toString() : null,
      },
      description: `Commande CamCook - ${orderGroupId || orderId || 'Nouvelle commande'}`,
    });

    // Si orderGroupId est fourni, mettre à jour toutes les commandes du groupe
    if (orderGroupId) {
      await Order.update(
        {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe_card',
        },
        { where: { orderGroupId, customerId: userId } }
      );
    } else if (orderId) {
      // Sinon, mettre à jour une seule commande (compatibilité)
      await Order.update(
        {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe_card',
        },
        { where: { id: orderId, customerId: userId } }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error('Erreur création Payment Intent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du paiement',
    });
  }
};

/**
 * Confirmer un paiement après que le client a complété le paiement
 * POST /api/payments/confirm
 */
exports.confirmPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'Payment Intent ID requis' });
    }

    // Récupérer le Payment Intent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Vérifier que le paiement appartient à l'utilisateur
    if (paymentIntent.metadata.userId !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Paiement non autorisé' });
    }

    // Vérifier le statut du paiement
    if (paymentIntent.status === 'succeeded') {
      // Mettre à jour toutes les commandes du groupe si orderGroupId est fourni
      if (orderGroupId) {
        await Order.update(
          {
            paymentStatus: 'paid',
            stripePaymentIntentId: paymentIntentId,
          },
          { where: { orderGroupId, customerId: userId } }
        );
      } else if (orderId) {
        // Sinon, mettre à jour une seule commande (compatibilité)
        await Order.update(
          {
            paymentStatus: 'paid',
            stripePaymentIntentId: paymentIntentId,
          },
          { where: { id: orderId, customerId: userId } }
        );
      }

      return res.status(200).json({
        success: true,
        data: {
          paymentStatus: 'succeeded',
          paymentIntentId: paymentIntent.id,
          orderId: orderId || null,
          orderGroupId: orderGroupId || null,
        },
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      return res.status(400).json({
        success: false,
        error: 'Le paiement nécessite une méthode de paiement',
      });
    } else if (paymentIntent.status === 'canceled') {
      return res.status(400).json({
        success: false,
        error: 'Le paiement a été annulé',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Statut de paiement: ${paymentIntent.status}`,
      });
    }
  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la confirmation du paiement',
    });
  }
};

/**
 * Créer un Payment Intent pour Apple Pay / Google Pay
 * POST /api/payments/create-mobile-pay-intent
 */
exports.createMobilePayIntent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    const { amount, currency = 'eur', orderId, orderGroupId, paymentMethodType = 'apple_pay' } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide' });
    }

    // Convertir le montant en centimes
    const amountInCents = Math.round(amount * 100);

    // Méthodes de paiement supportées pour mobile
    const allowedTypes = ['apple_pay', 'google_pay'];
    const paymentType = allowedTypes.includes(paymentMethodType) ? paymentMethodType : 'apple_pay';

    // Créer le Payment Intent avec les méthodes mobiles
    // Utilisation de automatic_payment_methods pour permettre Apple Pay / Google Pay automatiquement
    // On ne peut pas utiliser payment_method_types et automatic_payment_methods en même temps
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: userId.toString(),
        orderId: orderId ? orderId.toString() : null,
        orderGroupId: orderGroupId ? orderGroupId.toString() : null,
        mobilePayType: paymentType,
      },
      description: `Commande CamCook - ${orderGroupId || orderId || 'Nouvelle commande'} (${paymentType})`,
    });

    // Si orderGroupId est fourni, mettre à jour toutes les commandes du groupe
    const paymentMethod = paymentType === 'apple_pay' ? 'stripe_apple_pay' : 'stripe_google_pay';
    if (orderGroupId) {
      await Order.update(
        {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethod: paymentMethod,
        },
        { where: { orderGroupId, customerId: userId } }
      );
    } else if (orderId) {
      // Sinon, mettre à jour une seule commande (compatibilité)
      await Order.update(
        {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethod: paymentMethod,
        },
        { where: { id: orderId, customerId: userId } }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentMethodType: paymentType,
      },
    });
  } catch (error) {
    console.error('Erreur création Mobile Pay Intent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du paiement mobile',
    });
  }
};

/**
 * Lister tous les paiements (admin seulement)
 * GET /api/admin/payments
 */
exports.listPayments = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: 'Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans .env',
      });
    }

    const { status, paymentMethod, page = 1, limit = 20, startDate, endDate } = req.query;

    // Construire les paramètres de recherche Stripe
    const listParams = {
      limit: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
    };

    // Filtrer par statut
    if (status && ['succeeded', 'pending', 'failed', 'canceled', 'requires_action'].includes(status)) {
      // Note: Stripe ne supporte pas directement le filtrage par statut dans list()
      // On devra filtrer après la récupération
    }

    // Filtrer par date
    if (startDate || endDate) {
      listParams.created = {};
      if (startDate) {
        listParams.created.gte = Math.floor(new Date(startDate).getTime() / 1000);
      }
      if (endDate) {
        listParams.created.lte = Math.floor(new Date(endDate).getTime() / 1000);
      }
    }

    // Récupérer les Payment Intents depuis Stripe
    const paymentIntents = await stripe.paymentIntents.list(listParams);

    // Filtrer par statut si nécessaire
    let filteredPayments = paymentIntents.data;
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    // Récupérer les commandes correspondantes depuis la base de données
    const paymentIntentIds = filteredPayments.map(p => p.id);
    const { Op } = require('sequelize');
    const { Order, User } = require('../models');
    
    const orders = await Order.findAll({
      where: {
        stripePaymentIntentId: { [Op.in]: paymentIntentIds },
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    // Créer un map pour accéder rapidement aux commandes
    const orderMap = {};
    orders.forEach(order => {
      if (order.stripePaymentIntentId) {
        orderMap[order.stripePaymentIntentId] = order;
      }
    });

    // Combiner les données Stripe avec les données de la base de données
    const payments = filteredPayments.map(paymentIntent => {
      const order = orderMap[paymentIntent.id] || null;
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convertir de centimes en euros
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method_types[0] || 'card',
        createdAt: new Date(paymentIntent.created * 1000),
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
        order: order ? {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          customer: order.customer,
        } : null,
      };
    });

    // Pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const total = payments.length;
    const start = (pageNum - 1) * parseInt(limit, 10);
    const end = start + parseInt(limit, 10);
    const paginatedPayments = payments.slice(start, end);

    return res.status(200).json({
      success: true,
      data: paginatedPayments,
      meta: {
        total,
        page: pageNum,
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Erreur récupération paiements:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des paiements',
    });
  }
};

/**
 * Rembourser un paiement
 * POST /api/payments/refund
 */
exports.refundPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!userId || !isAdmin) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    const { paymentIntentId, orderId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'Payment Intent ID requis' });
    }

    // Récupérer le Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Créer le remboursement
    const refundOptions = {
      payment_intent: paymentIntentId,
    };

    // Si un montant partiel est spécifié
    if (amount && amount > 0) {
      refundOptions.amount = Math.round(amount * 100); // Convertir en centimes
    }

    const refund = await stripe.refunds.create(refundOptions);

    // Mettre à jour la commande si orderId est fourni
    if (orderId) {
      await Order.update(
        {
          paymentStatus: 'refunded',
        },
        { where: { id: orderId } }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount / 100, // Convertir en euros
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Erreur remboursement:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du remboursement',
    });
  }
};

