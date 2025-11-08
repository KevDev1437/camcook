/**
 * Super Admin Controller
 * 
 * Ce controller gère toutes les opérations Super Admin pour la plateforme SaaS.
 * Permet de gérer tous les restaurants, leurs abonnements, statistiques, etc.
 * 
 * IMPORTANT : Ces routes doivent être protégées et uniquement accessibles aux super admins.
 * 
 * SÉCURITÉ :
 * - Toutes les routes nécessitent l'authentification (protect)
 * - Toutes les routes nécessitent le rôle 'superadmin' (authorize('superadmin'))
 * - Pas de restaurantContext requis (accès global à tous les restaurants)
 */

const { Restaurant, Order, MenuItem, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { literal } = require('sequelize');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Liste TOUS les restaurants avec pagination et filtres
 * @route   GET /api/superadmin/restaurants
 * @access  Private (Super Admin uniquement)
 */
exports.getAllRestaurants = async (req, res) => {
  try {
    console.log('[SUPERADMIN] getAllRestaurants - Requête reçue');
    
    // Paramètres de pagination et filtres
    const { 
      page = 1, 
      limit = 20, 
      isActive, 
      subscriptionStatus, 
      subscriptionPlan, 
      search 
    } = req.query;

    // Validation et normalisation des paramètres
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    // Construire les conditions de recherche
    const where = {};

    // Filtre isActive (boolean)
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Filtre subscriptionStatus
    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    // Filtre subscriptionPlan
    if (subscriptionPlan) {
      where.subscriptionPlan = subscriptionPlan;
    }

    // Recherche textuelle (nom, email, slug)
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    // Requête avec pagination
    const { rows, count } = await Restaurant.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    // Calculer le nombre de pages
    const pages = Math.ceil(count / pageSize);

    // Vérifier quelles apps ont déjà été générées
    const clientsDir = path.join(__dirname, '../../../clients');
    const restaurantsWithAppInfo = rows.map(restaurant => {
      // Générer le slug pour ce restaurant
      const slug = restaurant.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/(^-|-$)/g, ''); // Supprimer les tirets en début/fin
      
      const appPath = path.join(clientsDir, `${slug}-app`);
      const hasApp = fs.existsSync(appPath);
      
      return {
        ...restaurant.toJSON(),
        hasAppGenerated: hasApp,
        appPath: hasApp ? appPath.replace(/\\/g, '/') : null
      };
    });

    console.log(`[SUPERADMIN] getAllRestaurants - ${count} restaurants trouvés, page ${pageNum}/${pages}`);

    res.status(200).json({
      success: true,
      data: restaurantsWithAppInfo,
      meta: {
        total: count,
        page: pageNum,
        limit: pageSize,
        pages
      }
    });
  } catch (error) {
    console.error('[SUPERADMIN] getAllRestaurants - Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des restaurants'
    });
  }
};

/**
 * @desc    Statistiques d'un restaurant spécifique
 * @route   GET /api/superadmin/restaurants/:restaurantId/stats
 * @access  Private (Super Admin uniquement)
 */
exports.getRestaurantStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    console.log(`[SUPERADMIN] getRestaurantStats - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Dates pour les calculs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche de cette semaine
    startOfWeek.setHours(0, 0, 0, 0);

    // Total de commandes
    const totalOrders = await Order.count({
      where: { restaurantId: restaurantIdNum }
    });

    // Commandes ce mois
    const ordersThisMonth = await Order.count({
      where: {
        restaurantId: restaurantIdNum,
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Commandes cette semaine
    const ordersThisWeek = await Order.count({
      where: {
        restaurantId: restaurantIdNum,
        createdAt: { [Op.gte]: startOfWeek }
      }
    });

    // Revenu total (somme des totaux des commandes payées)
    const totalRevenueResult = await Order.sum('total', {
      where: {
        restaurantId: restaurantIdNum,
        paymentStatus: 'paid'
      }
    });
    const totalRevenue = parseFloat(totalRevenueResult) || 0;

    // Revenu ce mois
    const revenueThisMonthResult = await Order.sum('total', {
      where: {
        restaurantId: restaurantIdNum,
        paymentStatus: 'paid',
        createdAt: { [Op.gte]: startOfMonth }
      }
    });
    const revenueThisMonth = parseFloat(revenueThisMonthResult) || 0;

    // Nombre de plats
    const menuItemsCount = await MenuItem.count({
      where: { restaurantId: restaurantIdNum }
    });

    // Nombre de clients distincts (requête SQL sécurisée pour compter les DISTINCT)
    const customersCountResult = await sequelize.query(
      `SELECT COUNT(DISTINCT customerId) as count FROM orders WHERE restaurantId = :restaurantId`,
      {
        replacements: { restaurantId: restaurantIdNum },
        type: sequelize.QueryTypes.SELECT
      }
    );
    const customersCount = parseInt(customersCountResult[0]?.count || 0, 10);

    // Note moyenne (depuis le restaurant)
    const averageRating = parseFloat(restaurant.ratingAverage) || 0;

    console.log(`[SUPERADMIN] getRestaurantStats - Stats calculées pour restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: {
        restaurantId: restaurantIdNum,
        restaurantName: restaurant.name,
        totalOrders,
        ordersThisMonth,
        ordersThisWeek,
        totalRevenue: totalRevenue.toFixed(2),
        revenueThisMonth: revenueThisMonth.toFixed(2),
        menuItemsCount,
        customersCount,
        averageRating: averageRating.toFixed(2)
      }
    });
  } catch (error) {
    console.error('[SUPERADMIN] getRestaurantStats - Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques du restaurant'
    });
  }
};

/**
 * @desc    Statistiques globales de la plateforme
 * @route   GET /api/superadmin/stats
 * @access  Private (Super Admin uniquement)
 */
exports.getGlobalStats = async (req, res) => {
  try {
    console.log('[SUPERADMIN] getGlobalStats - Calcul des statistiques globales');

    // Dates pour les calculs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total de restaurants
    const totalRestaurants = await Restaurant.count();

    // Restaurants actifs/inactifs
    const activeRestaurants = await Restaurant.count({
      where: { isActive: true }
    });
    const inactiveRestaurants = await Restaurant.count({
      where: { isActive: false }
    });

    // Restaurants en trial
    const trialRestaurants = await Restaurant.count({
      where: { subscriptionStatus: 'trial' }
    });

    // Restaurants par plan
    const restaurantsByPlan = {
      free: await Restaurant.count({ where: { subscriptionPlan: 'free' } }),
      starter: await Restaurant.count({ where: { subscriptionPlan: 'starter' } }),
      pro: await Restaurant.count({ where: { subscriptionPlan: 'pro' } }),
      enterprise: await Restaurant.count({ where: { subscriptionPlan: 'enterprise' } })
    };

    // Total de commandes
    const totalOrders = await Order.count();

    // Revenu total (somme des totaux des commandes payées)
    const totalRevenueResult = await Order.sum('total', {
      where: { paymentStatus: 'paid' }
    });
    const totalRevenue = parseFloat(totalRevenueResult) || 0;

    // Commandes ce mois
    const ordersThisMonth = await Order.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Revenu ce mois
    const revenueThisMonthResult = await Order.sum('total', {
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.gte]: startOfMonth }
      }
    });
    const revenueThisMonth = parseFloat(revenueThisMonthResult) || 0;

    // Nouveaux restaurants ce mois
    const newRestaurantsThisMonth = await Restaurant.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Revenu du mois dernier (pour calculer la croissance)
    const revenueLastMonthResult = await Order.sum('total', {
      where: {
        paymentStatus: 'paid',
        createdAt: {
          [Op.gte]: lastMonth,
          [Op.lte]: endOfLastMonth
        }
      }
    });
    const revenueLastMonth = parseFloat(revenueLastMonthResult) || 0;

    // Calcul de la croissance (%)
    let growth = 0;
    if (revenueLastMonth > 0) {
      growth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    } else if (revenueThisMonth > 0) {
      growth = 100; // Croissance infinie (pas de revenu le mois dernier)
    }

    console.log('[SUPERADMIN] getGlobalStats - Statistiques calculées');

    res.status(200).json({
      success: true,
      data: {
        totalRestaurants,
        activeRestaurants,
        inactiveRestaurants,
        trialRestaurants,
        restaurantsByPlan,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth.toFixed(2),
        newRestaurantsThisMonth,
        growth: growth.toFixed(2)
      }
    });
  } catch (error) {
    console.error('[SUPERADMIN] getGlobalStats - Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques globales'
    });
  }
};

/**
 * @desc    Créer un nouveau restaurant
 * @route   POST /api/superadmin/restaurants
 * @access  Private (Super Admin uniquement)
 */
exports.createRestaurant = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      street, 
      city, 
      postalCode, 
      subscriptionPlan = 'free', 
      ownerId,
      description = 'Description à compléter',
      logo = null
    } = req.body;

    console.log('[SUPERADMIN] createRestaurant - Création d\'un nouveau restaurant:', name);

    // Validation des paramètres obligatoires
    if (!name || !email || !phone || !street || !city || !ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Les champs suivants sont obligatoires: name, email, phone, street, city, ownerId'
      });
    }

    // Vérifier que l'owner existe
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner non trouvé'
      });
    }

    // IMPORTANT : Mettre à jour automatiquement le rôle de l'owner en 'adminrestaurant'
    // pour qu'il puisse accéder au dashboard admin du restaurant
    if (owner.role !== 'adminrestaurant' && owner.role !== 'superadmin') {
      console.log(`[SUPERADMIN] createRestaurant - Mise à jour du rôle de l'owner ${ownerId} de '${owner.role}' à 'adminrestaurant'`);
      await owner.update({ role: 'adminrestaurant' });
      console.log(`[SUPERADMIN] createRestaurant - Rôle de l'owner mis à jour avec succès`);
    } else if (owner.role === 'superadmin') {
      console.log(`[SUPERADMIN] createRestaurant - L'owner ${ownerId} est déjà superadmin, pas de changement de rôle`);
    }

    // Générer le slug à partir du nom
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/(^-|-$)/g, ''); // Supprimer les tirets en début/fin

    // Vérifier l'unicité du slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await Restaurant.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Créer le restaurant
    const restaurant = await Restaurant.create({
      ownerId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode?.trim() || null,
      description: description.trim(),
      logo: logo?.trim() || null,
      subscriptionPlan,
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      slug: uniqueSlug,
      isActive: true
    });

    // Charger le restaurant avec l'owner
    const restaurantWithOwner = await Restaurant.findByPk(restaurant.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log(`[SUPERADMIN] createRestaurant - Restaurant créé avec succès (ID: ${restaurant.id}, Slug: ${uniqueSlug})`);

    res.status(201).json({
      success: true,
      data: restaurantWithOwner
    });
  } catch (error) {
    console.error('[SUPERADMIN] createRestaurant - Erreur:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Un restaurant avec ce nom, email ou slug existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du restaurant'
    });
  }
};

/**
 * @desc    Modifier l'abonnement d'un restaurant
 * @route   PUT /api/superadmin/restaurants/:restaurantId/subscription
 * @access  Private (Super Admin uniquement)
 */
exports.updateRestaurantSubscription = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { 
      subscriptionPlan, 
      subscriptionStatus, 
      subscriptionStartDate, 
      subscriptionEndDate 
    } = req.body;

    console.log(`[SUPERADMIN] updateRestaurantSubscription - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Construire les données de mise à jour
    const updateData = {};

    if (subscriptionPlan) {
      const validPlans = ['free', 'starter', 'pro', 'enterprise'];
      if (!validPlans.includes(subscriptionPlan)) {
        return res.status(400).json({
          success: false,
          error: `Plan invalide. Valeurs autorisées: ${validPlans.join(', ')}`
        });
      }
      updateData.subscriptionPlan = subscriptionPlan;
    }

    if (subscriptionStatus) {
      const validStatuses = ['active', 'inactive', 'trial', 'cancelled'];
      if (!validStatuses.includes(subscriptionStatus)) {
        return res.status(400).json({
          success: false,
          error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`
        });
      }
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (subscriptionStartDate !== undefined) {
      updateData.subscriptionStartDate = subscriptionStartDate ? new Date(subscriptionStartDate) : null;
    }

    if (subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    }

    // Mettre à jour le restaurant
    await restaurant.update(updateData);

    // Recharger le restaurant avec l'owner
    const updatedRestaurant = await Restaurant.findByPk(restaurantIdNum, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log(`[SUPERADMIN] updateRestaurantSubscription - Abonnement mis à jour pour restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: updatedRestaurant
    });
  } catch (error) {
    console.error('[SUPERADMIN] updateRestaurantSubscription - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'abonnement'
    });
  }
};

/**
 * @desc    Activer/désactiver un restaurant
 * @route   PUT /api/superadmin/restaurants/:restaurantId/toggle-status
 * @access  Private (Super Admin uniquement)
 */
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    console.log(`[SUPERADMIN] toggleRestaurantStatus - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Inverser le statut
    const newStatus = !restaurant.isActive;
    await restaurant.update({ isActive: newStatus });

    // Recharger le restaurant avec l'owner
    const updatedRestaurant = await Restaurant.findByPk(restaurantIdNum, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log(`[SUPERADMIN] toggleRestaurantStatus - Statut ${newStatus ? 'activé' : 'désactivé'} pour restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: updatedRestaurant,
      message: `Restaurant ${newStatus ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('[SUPERADMIN] toggleRestaurantStatus - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la modification du statut du restaurant'
    });
  }
};

/**
 * @desc    Modifier le logo d'un restaurant
 * @route   PUT /api/superadmin/restaurants/:restaurantId/logo
 * @access  Private (Super Admin uniquement)
 */
exports.updateRestaurantLogo = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { logo } = req.body;

    console.log(`[SUPERADMIN] updateRestaurantLogo - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Mettre à jour le logo
    await restaurant.update({
      logo: logo?.trim() || null
    });

    // Recharger le restaurant avec l'owner
    const updatedRestaurant = await Restaurant.findByPk(restaurantIdNum, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log(`[SUPERADMIN] updateRestaurantLogo - Logo mis à jour pour restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: updatedRestaurant,
      message: 'Logo mis à jour avec succès'
    });
  } catch (error) {
    console.error('[SUPERADMIN] updateRestaurantLogo - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du logo'
    });
  }
};

/**
 * @desc    Modifier les couleurs du thème d'un restaurant
 * @route   PUT /api/superadmin/restaurants/:restaurantId/theme
 * @access  Private (Super Admin uniquement)
 */
exports.updateRestaurantTheme = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { 
      primaryColor, 
      secondaryColor, 
      errorColor,
      successColor,
      warningColor,
      textPrimaryColor,
      textSecondaryColor,
      textTertiaryColor,
      backgroundLightColor,
      backgroundLighterColor,
      backgroundBorderColor,
      backgroundWhiteColor
    } = req.body;

    console.log(`[SUPERADMIN] updateRestaurantTheme - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Validation des couleurs (format hexadécimal)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colorsToValidate = {
      primaryColor,
      secondaryColor,
      errorColor,
      successColor,
      warningColor,
      textPrimaryColor,
      textSecondaryColor,
      textTertiaryColor,
      backgroundLightColor,
      backgroundLighterColor,
      backgroundBorderColor,
      backgroundWhiteColor,
    };

    for (const [key, value] of Object.entries(colorsToValidate)) {
      if (value && !hexColorRegex.test(value)) {
        return res.status(400).json({
          success: false,
          error: `${key} invalide. Format attendu: #RRGGBB (ex: #FF6B6B)`
        });
      }
    }

    // Récupérer les settings actuels
    const currentSettings = restaurant.settings || {};
    const currentTheme = currentSettings.theme || {};
    
    // Construire le thème mis à jour
    const updatedTheme = {
      ...currentTheme,
      ...(primaryColor && { primary: primaryColor.toUpperCase() }),
      ...(secondaryColor && { secondary: secondaryColor.toUpperCase() }),
      ...(errorColor && { error: errorColor.toUpperCase() }),
      ...(successColor && { success: successColor.toUpperCase() }),
      ...(warningColor && { warning: warningColor.toUpperCase() }),
      text: {
        ...(currentTheme.text || {}),
        ...(textPrimaryColor && { primary: textPrimaryColor.toUpperCase() }),
        ...(textSecondaryColor && { secondary: textSecondaryColor.toUpperCase() }),
        ...(textTertiaryColor && { tertiary: textTertiaryColor.toUpperCase() }),
      },
      background: {
        ...(currentTheme.background || {}),
        ...(backgroundLightColor && { light: backgroundLightColor.toUpperCase() }),
        ...(backgroundLighterColor && { lighter: backgroundLighterColor.toUpperCase() }),
        ...(backgroundBorderColor && { border: backgroundBorderColor.toUpperCase() }),
        ...(backgroundWhiteColor && { white: backgroundWhiteColor.toUpperCase() }),
      },
    };

    const updatedSettings = {
      ...currentSettings,
      theme: updatedTheme,
    };

    // Mettre à jour les couleurs dans restaurant.settings
    await restaurant.update({ settings: updatedSettings });

    // Recharger le restaurant avec l'owner
    const updatedRestaurant = await Restaurant.findByPk(restaurantIdNum, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log(`[SUPERADMIN] updateRestaurantTheme - Couleurs mises à jour pour restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: updatedRestaurant,
      message: 'Couleurs du thème mises à jour avec succès'
    });
  } catch (error) {
    console.error('[SUPERADMIN] updateRestaurantTheme - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour des couleurs du thème'
    });
  }
};

/**
 * @desc    Supprimer un restaurant (soft delete)
 * @route   DELETE /api/superadmin/restaurants/:restaurantId
 * @access  Private (Super Admin uniquement)
 */
exports.deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    console.log(`[SUPERADMIN] deleteRestaurant - Restaurant ID: ${restaurantId}`);

    if (!restaurantId || isNaN(parseInt(restaurantId))) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID invalide'
      });
    }

    const restaurantIdNum = parseInt(restaurantId, 10);

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantIdNum);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Soft delete : désactiver et annuler l'abonnement
    await restaurant.update({
      isActive: false,
      subscriptionStatus: 'cancelled'
    });

    console.log(`[SUPERADMIN] deleteRestaurant - Restaurant ${restaurantId} supprimé (soft delete)`);

    res.status(200).json({
      success: true,
      message: 'Restaurant supprimé avec succès'
    });
  } catch (error) {
    console.error('[SUPERADMIN] deleteRestaurant - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du restaurant'
    });
  }
};

/**
 * @desc    Liste les utilisateurs disponibles comme owners (pas superadmin, pas déjà owner)
 * @route   GET /api/superadmin/available-owners
 * @access  Private (Super Admin uniquement)
 */
exports.getAvailableOwners = async (req, res) => {
  try {
    console.log('[SUPERADMIN] getAvailableOwners - Requête reçue');

    // Récupérer tous les ownerId existants dans la table restaurants
    const existingOwners = await Restaurant.findAll({
      attributes: ['ownerId'],
      where: {
        ownerId: { [Op.ne]: null }
      }
    });
    const existingOwnerIds = existingOwners.map(r => r.ownerId);

    // Filtrer les utilisateurs :
    // 1. Exclure les superadmin
    // 2. Exclure les customer (seuls les adminrestaurant peuvent être owners)
    // 3. Exclure les utilisateurs qui ont déjà un restaurant
    const userWhere = {
      role: 'adminrestaurant', // Seulement les adminrestaurant (pas de customer, pas de superadmin)
      id: { [Op.notIn]: existingOwnerIds.length > 0 ? existingOwnerIds : [0] } // Si aucun owner, utiliser [0] pour éviter une erreur SQL
    };

    // Recherche optionnelle par texte
    if (req.query.q && String(req.query.q).trim()) {
      const searchTerm = `%${String(req.query.q).trim()}%`;
      userWhere[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } }
      ];
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: 100 // Limite raisonnable pour la sélection
    });

    console.log(`[SUPERADMIN] getAvailableOwners - ${users.length} utilisateurs disponibles trouvés`);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('[SUPERADMIN] getAvailableOwners - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des utilisateurs disponibles'
    });
  }
};

/**
 * @desc    Générer une app White Label pour un restaurant
 * @route   POST /api/superadmin/generate-app
 * @access  Private (Super Admin uniquement)
 */
exports.generateClientApp = async (req, res) => {
  try {
    const { 
      restaurantName, 
      restaurantId, 
      email, 
      primaryColor = '#FF6B6B', 
      secondaryColor = '#4ECDC4',
      apiUrl = 'http://localhost:5000/api',
      stripePublishableKey = '',
      wifiIp = '',
      autoInstall = false // Option pour installer automatiquement les dépendances
    } = req.body;

    console.log('[SUPERADMIN] generateClientApp - Génération d\'app pour:', restaurantName);

    // Validation des paramètres obligatoires
    if (!restaurantName || !restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Les champs suivants sont obligatoires: restaurantName, restaurantId'
      });
    }

    // Vérifier que le restaurant existe
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Stocker les couleurs dans restaurant.settings pour qu'elles soient disponibles via l'API
    const currentSettings = restaurant.settings || {};
    const updatedSettings = {
      ...currentSettings,
      theme: {
        primary: primaryColor,
        secondary: secondaryColor,
      }
    };
    
    // Mettre à jour le restaurant avec les couleurs dans settings
    await restaurant.update({ settings: updatedSettings });
    console.log(`[SUPERADMIN] generateClientApp - Couleurs stockées dans restaurant.settings: primary=${primaryColor}, secondary=${secondaryColor}`);

    // Générer le slug pour vérifier si l'app existe déjà
    const slug = restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/(^-|-$)/g, ''); // Supprimer les tirets en début/fin

    const clientsDir = path.join(__dirname, '../../../clients');
    const appPath = path.join(clientsDir, `${slug}-app`);
    const appExists = fs.existsSync(appPath);

    // Chemin du script
    const scriptPath = path.join(__dirname, '../../scripts/create-client-app.sh');
    
    // Vérifier que le script existe
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({
        success: false,
        error: 'Script de génération d\'app introuvable'
      });
    }

    // Construire la commande
    // Échapper les guillemets dans le nom du restaurant
    const escapedName = restaurantName.replace(/"/g, '\\"');
    const escapedEmail = email ? email.replace(/"/g, '\\"') : '';
    
    // Construire les arguments
    const escapedApiUrl = apiUrl.replace(/"/g, '\\"');
    const escapedStripeKey = stripePublishableKey ? stripePublishableKey.replace(/"/g, '\\"') : '';
    const escapedWifiIp = wifiIp ? wifiIp.replace(/"/g, '\\"') : '';
    
    const args = [
      `"${escapedName}"`,
      restaurantId.toString(),
      escapedEmail ? `"${escapedEmail}"` : '""',
      `"${primaryColor}"`,
      `"${secondaryColor}"`,
      `"${escapedApiUrl}"`,
      escapedStripeKey ? `"${escapedStripeKey}"` : '""',
      escapedWifiIp ? `"${escapedWifiIp}"` : '""'
    ].join(' ');

    // Commande complète (Windows/Linux compatible)
    const isWindows = process.platform === 'win32';
    console.log('[SUPERADMIN] generateClientApp - Platform:', process.platform);
    console.log('[SUPERADMIN] generateClientApp - isWindows:', isWindows);
    let command;
    
    if (isWindows) {
      console.log('[SUPERADMIN] generateClientApp - Mode Windows détecté');
      // Windows : convertir le chemin Windows en chemin Unix pour Git Bash
      // Remplacer les backslashes par des slashes et convertir le drive letter en minuscule
      const unixPath = scriptPath
        .replace(/\\/g, '/')
        .replace(/^([A-Z]):/, (match, drive) => `/${drive.toLowerCase()}`); // Convertir C:\ en /c/
      
      // Chercher Git Bash dans les emplacements communs
      // Le fichier s'appelle git-bash.exe (pas bash.exe)
      const possibleBashPaths = [
        'C:/Program Files/Git/git-bash.exe',
        'C:/Program Files/Git/bin/bash.exe',
        'C:/Program Files/Git/usr/bin/bash.exe',
        'C:/Program Files/Git/bash.exe',
        'C:/Program Files (x86)/Git/git-bash.exe',
        'C:/Program Files (x86)/Git/bin/bash.exe',
        process.env.GIT_BASH_PATH || null
      ].filter(Boolean);
      
      // Essayer de trouver git-bash.exe ou bash.exe
      let bashPath = null;
      for (const bashCandidate of possibleBashPaths) {
        if (fs.existsSync(bashCandidate)) {
          bashPath = bashCandidate;
          console.log('[SUPERADMIN] generateClientApp - Git Bash trouvé:', bashPath);
          break;
        }
      }
      
      // Si bash n'est pas trouvé, essayer git-bash.exe ou bash.exe dans le PATH
      if (!bashPath) {
        // Essayer git-bash.exe d'abord, puis bash.exe
        bashPath = 'git-bash.exe';
        console.log('[SUPERADMIN] generateClientApp - Utilisation de git-bash.exe depuis PATH');
      }
      
      // Utiliser Git Bash avec le chemin Unix
      // Le chemin Unix doit être entre guillemets pour gérer les espaces
      // IMPORTANT : git-bash.exe est un launcher, pas un exécutable bash
      // Il faut utiliser bash.exe qui se trouve dans bin/ ou usr/bin/
      // Si on a trouvé git-bash.exe, chercher bash.exe dans le même dossier
      if (bashPath.includes('git-bash.exe')) {
        // git-bash.exe est dans C:/Program Files/Git/
        // bash.exe est dans C:/Program Files/Git/bin/bash.exe ou usr/bin/bash.exe
        const gitDir = bashPath.replace(/git-bash\.exe$/, '');
        const bashExePath = fs.existsSync(`${gitDir}bin/bash.exe`) 
          ? `${gitDir}bin/bash.exe`
          : `${gitDir}usr/bin/bash.exe`;
        
        if (fs.existsSync(bashExePath)) {
          bashPath = bashExePath;
          console.log('[SUPERADMIN] generateClientApp - Utilisation de bash.exe:', bashPath);
        } else {
          // Fallback : utiliser bash.exe depuis PATH
          bashPath = 'bash.exe';
          console.log('[SUPERADMIN] generateClientApp - Utilisation de bash.exe depuis PATH');
        }
      }
      
      // Utiliser bash.exe avec le chemin Unix
      command = `"${bashPath}" "${unixPath}" ${args}`;
      
      console.log('[SUPERADMIN] generateClientApp - Bash path:', bashPath);
      console.log('[SUPERADMIN] generateClientApp - Unix path:', unixPath);
    } else {
      console.log('[SUPERADMIN] generateClientApp - Mode Linux/Mac détecté');
      // Linux/Mac : utiliser bash directement avec le chemin normal
      command = `bash "${scriptPath}" ${args}`;
    }

    console.log('[SUPERADMIN] generateClientApp - Exécution de la commande:', command);
    console.log('[SUPERADMIN] generateClientApp - Script path:', scriptPath);
    console.log('[SUPERADMIN] generateClientApp - Script exists:', fs.existsSync(scriptPath));

    // Vérifier que le script existe avant d'essayer de l'exécuter
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({
        success: false,
        error: 'Script de génération d\'app introuvable',
        details: `Le script n'existe pas à l'emplacement: ${scriptPath}`
      });
    }

    // Exécuter le script
    // Sur Windows, utiliser shell: true pour que cmd.exe gère les chemins
    const execOptions = {
      cwd: path.join(__dirname, '../../'),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      shell: isWindows ? true : false, // Sur Windows, utiliser shell pour gérer les chemins
      timeout: 300000 // 5 minutes timeout pour éviter les blocages
    };

    console.log('[SUPERADMIN] generateClientApp - Démarrage de l\'exécution du script...');
    console.log('[SUPERADMIN] generateClientApp - Timeout: 5 minutes');

    exec(command, execOptions, async (error, stdout, stderr) => {
      if (error) {
        console.error('[SUPERADMIN] generateClientApp - Erreur:', error);
        console.error('[SUPERADMIN] generateClientApp - stderr:', stderr);
        
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la génération de l\'app',
          details: error.message,
          stderr: stderr || ''
        });
      }

      console.log('[SUPERADMIN] generateClientApp - Succès');
      console.log('[SUPERADMIN] generateClientApp - stdout:', stdout);

      // Optionnel : Installer automatiquement les dépendances npm
      let installOutput = null;
      let installSuccess = false;
      
      if (autoInstall) {
        try {
          console.log('[SUPERADMIN] generateClientApp - Installation automatique des dépendances npm...');
          
          // Utiliser une Promise pour attendre la fin de l'installation
          await new Promise((resolve, reject) => {
            const installCommand = `npm install`;
            
            exec(installCommand, { 
              cwd: appPath,
              maxBuffer: 10 * 1024 * 1024,
              shell: isWindows ? true : false
            }, (installError, installStdout, installStderr) => {
              if (installError) {
                console.warn('[SUPERADMIN] generateClientApp - Erreur lors de l\'installation npm:', installError.message);
                installOutput = `⚠️ Installation npm échouée: ${installError.message}\n${installStderr || ''}`;
                installSuccess = false;
              } else {
                console.log('[SUPERADMIN] generateClientApp - Installation npm réussie');
                installOutput = installStdout || '✅ Dépendances npm installées avec succès';
                installSuccess = true;
              }
              resolve();
            });
          });
        } catch (installErr) {
          console.warn('[SUPERADMIN] generateClientApp - Erreur lors de l\'installation npm:', installErr);
          installOutput = `⚠️ Erreur lors de l'installation npm: ${installErr.message}`;
          installSuccess = false;
        }
      }

      const message = appExists 
        ? `App régénérée avec succès pour ${restaurantName}${autoInstall && installSuccess ? ' (dépendances npm installées)' : ''}`
        : `App générée avec succès pour ${restaurantName}${autoInstall && installSuccess ? ' (dépendances npm installées)' : ''}`;

      res.status(200).json({
        success: true,
        message: message,
        data: {
          restaurantName,
          restaurantId,
          slug,
          appPath: appPath.replace(/\\/g, '/'), // Normaliser les slashes pour l'affichage
          output: stdout,
          wasRegenerated: appExists,
          npmInstalled: autoInstall,
          npmInstallSuccess: installSuccess,
          installOutput: installOutput
        }
      });
    });

  } catch (error) {
    console.error('[SUPERADMIN] generateClientApp - Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de l\'app'
    });
  }
};

