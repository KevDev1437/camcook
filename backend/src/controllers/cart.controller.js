const { MenuItem, Accompaniment, Drink } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Helper pour récupérer les prix depuis la table Accompaniment
async function getAccompPrice(accompName) {
  try {
    const nameToSearch = String(accompName);
    
    // MySQL n supporte pas ILIKE, utiliser LOWER() pour comparaison insensible à la casse
    const accompaniment = await Accompaniment.findOne({
      where: {
        name: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          '=',
          nameToSearch.toLowerCase()
        )
      }
    });
    
    if (accompaniment) {
      return parseFloat(accompaniment.price) || 0;
    }
  } catch (error) {
    console.error('Error fetching accompaniment price:', error);
  }
  return 0; // Prix par défaut si non trouvé
}

// Helper pour récupérer les prix depuis la table Drink
async function getDrinkPrice(drinkName) {
  try {
    const nameToSearch = String(drinkName);
    
    // MySQL ne supporte pas ILIKE, utiliser LOWER() pour comparaison insensible à la casse
    const drink = await Drink.findOne({
      where: {
        name: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          '=',
          nameToSearch.toLowerCase()
        )
      }
    });
    
    if (drink) {
      return parseFloat(drink.price) || 0;
    }
  } catch (error) {
    console.error('Error fetching drink price:', error);
  }
  return 0; // Prix par défaut si non trouvé
}

function normalizeOptions(options) {
  const out = { accompagnements: [], boissons: [] };
  try {
    if (!options || typeof options !== 'object') return out;
    // Accompagnements: tableau de strings/ids
    const acc = options.accompagnements || options.accompaniments || options['accompagnements'] || [];
    // Aucune limite de quantité côté serveur
    out.accompagnements = Array.isArray(acc) ? acc : [];
    // Boissons: true/"Bissap"/array - garder toutes les boissons sélectionnées
    const boisson = options.boisson ?? options.drink ?? null;
    if (Array.isArray(boisson)) {
      // Garder toutes les boissons du tableau
      out.boissons = boisson.filter(b => b != null && b !== '');
    } else if (boisson === true || (typeof boisson === 'string' && boisson.toLowerCase() === 'bissap')) {
      out.boissons = ['Bissap'];
    } else if (typeof boisson === 'string' && boisson) {
      out.boissons = [boisson];
    } else {
      out.boissons = [];
    }
    // Compatibilité: garder aussi boisson (singular) pour les anciens codes
    out.boisson = out.boissons.length > 0 ? out.boissons[0] : null;
  } catch (_) {}
  return out;
}

exports.priceCartItem = async (req, res) => {
  try {
    const { menuItemId, quantity: rawQty, options } = req.body || {};
    const quantity = Math.max(1, parseInt(rawQty || 1, 10));
    if (!menuItemId) {
      return res.status(400).json({ success: false, error: 'menuItemId requis' });
    }

    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, error: 'Plat non trouvé' });
    }

    const basePrice = parseFloat(menuItem.price) || 0;
    const normalized = normalizeOptions(options || {});
    
    // Calculer le prix total des accompagnements en utilisant les prix depuis SiteInfo
    let accompTotal = 0;
    if (Array.isArray(normalized.accompagnements) && normalized.accompagnements.length > 0) {
      const accompPrices = await Promise.all(
        normalized.accompagnements.map(acc => getAccompPrice(acc))
      );
      accompTotal = accompPrices.reduce((sum, price) => sum + price, 0);
    }
    
    // Calculer le prix total des boissons en utilisant les prix depuis SiteInfo
    let drinkPrice = 0;
    const drinks = normalized.boissons || (normalized.boisson ? [normalized.boisson] : []);
    if (drinks.length > 0) {
      const drinkPrices = await Promise.all(
        drinks.map(drink => getDrinkPrice(drink))
      );
      drinkPrice = drinkPrices.reduce((sum, price) => sum + price, 0);
    }

    const extras = accompTotal + drinkPrice;
    const unitPrice = +(basePrice + extras).toFixed(2);
    const lineTotal = +(unitPrice * quantity).toFixed(2);

    return res.status(200).json({
      success: true,
      data: {
        menuItemId: menuItem.id,
        name: menuItem.name,
        image: menuItem.images, // passthrough, le mobile choisira la 1ère si tableau
        unitPrice,
        quantity,
        lineTotal,
        options: normalized,
        pricing: {
          basePrice,
          accompCount: Array.isArray(normalized.accompagnements) ? normalized.accompagnements.length : 0,
          accompTotal,
          drinks: normalized.boissons || (normalized.boisson ? [normalized.boisson] : []),
          drink: normalized.boisson, // Compatibilité: garder la première boisson
          drinkPrice,
          extras,
        },
      },
    });
  } catch (error) {
    console.error('Erreur pricing cart item:', error);
    return res.status(500).json({ success: false, error: 'Erreur de calcul du prix' });
  }
};
