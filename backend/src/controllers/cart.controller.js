const { MenuItem } = require('../models');

// Tarifs fixes pour ce scénario (pourraient venir d'une table de config plus tard)
const PRICES = {
  ACCOMPAGNEMENT: 3.0, // € par accompagnement
  BISSAP: 2.0,         // € pour la boisson Bissap
};

function normalizeOptions(options) {
  const out = { accompagnements: [], boisson: null };
  try {
    if (!options || typeof options !== 'object') return out;
    // Accompagnements: tableau de strings/ids
    const acc = options.accompagnements || options.accompaniments || options['accompagnements'] || [];
    // Aucune limite de quantité côté serveur
    out.accompagnements = Array.isArray(acc) ? acc : [];
    // Boisson: true/"Bissap"/array
    const boisson = options.boisson ?? options.drink ?? null;
    if (Array.isArray(boisson)) {
      out.boisson = boisson.includes('Bissap') ? 'Bissap' : boisson[0] || null;
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
    const accompCount = Array.isArray(normalized.accompagnements) ? normalized.accompagnements.length : 0;
    const drinkPrice = normalized.boisson === 'Bissap' ? PRICES.BISSAP : 0;

    const extras = accompCount * PRICES.ACCOMPAGNEMENT + drinkPrice;
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
          accompCount,
          accompUnit: PRICES.ACCOMPAGNEMENT,
          drink: normalized.boisson,
          drinkUnit: PRICES.BISSAP,
          extras,
        },
      },
    });
  } catch (error) {
    console.error('Erreur pricing cart item:', error);
    return res.status(500).json({ success: false, error: 'Erreur de calcul du prix' });
  }
};
