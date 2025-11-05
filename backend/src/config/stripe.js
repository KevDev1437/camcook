const Stripe = require('stripe');

// Initialiser Stripe avec la clé secrète
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY n\'est pas configurée dans .env');
  console.warn('⚠️ Les paiements Stripe ne fonctionneront pas sans cette clé');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

module.exports = stripe;

