// Configuration Stripe
// IMPORTANT: Utilisez votre clé publique Stripe (publishable key)
// Vous pouvez la trouver dans votre dashboard Stripe : https://dashboard.stripe.com/apikeys
// Utilisez la clé de test (pk_test_...) pour le développement
// Utilisez la clé de production (pk_live_...) pour la production

// La clé Stripe peut être configurée via la variable d'environnement STRIPE_PUBLISHABLE_KEY
const STRIPE_KEY_FROM_ENV = process.env.STRIPE_PUBLISHABLE_KEY || 
  (typeof __DEV__ !== 'undefined' && __DEV__ 
    ? 'pk_test_51SPUUy3EXjOp1iU8XUZ4HWJKV96T3WoocdZG1iGZL3OkHRNNeRN0uei0oRn3ERdHz5NSpn7Y2OnBvTcSOFjwtJbb005gIoWzRV' 
    : 'pk_test_51SPUUy3EXjOp1iU8XUZ4HWJKV96T3WoocdZG1iGZL3OkHRNNeRN0uei0oRn3ERdHz5NSpn7Y2OnBvTcSOFjwtJbb005gIoWzRV');

export const STRIPE_PUBLISHABLE_KEY = STRIPE_KEY_FROM_ENV || 
  (__DEV__ 
    ? 'pk_test_your_key_here' // Remplacez par votre clé publique de test Stripe
    : 'pk_live_your_key_here'); // Remplacez par votre clé publique de production Stripe
