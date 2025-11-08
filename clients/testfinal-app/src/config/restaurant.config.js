/**
 * Configuration White Label - Restaurant
 * 
 * Cette configuration identifie le restaurant de cette app.
 * Cette app est configurée pour: TestFinal
 * 
 * IMPORTANT : Ne pas modifier cette configuration sans autorisation !
 */

// Restaurant ID de cette app (configuré pour TestFinal)
// Peut être surchargé par variable d'environnement
export const RESTAURANT_ID = process.env.RESTAURANT_ID 
  ? parseInt(process.env.RESTAURANT_ID, 10) 
  : 5;

// Configuration optionnelle (peut être surchargée par les données API)
export const RESTAURANT_CONFIG = {
  // ID du restaurant (OBLIGATOIRE)
  id: RESTAURANT_ID,
  
  // Nom de l'app (optionnel, sera remplacé par les données API)
  appName: process.env.RESTAURANT_NAME || 'TestFinal',
  
  // Couleurs du thème (optionnel, sera remplacé par restaurant.settings)
  theme: {
    primary: process.env.PRIMARY_COLOR || '#2e9483',
    secondary: process.env.SECONDARY_COLOR || '#16a413',
  },
  
  // Bundle ID (pour identifier l'app)
  bundleId: process.env.BUNDLE_ID || 'com.camcook.testfinal',
};

/**
 * Fonction helper pour récupérer le restaurantId
 * @returns {number} Restaurant ID
 */
export const getRestaurantId = () => RESTAURANT_ID;

/**
 * Fonction helper pour récupérer la config complète
 * @returns {Object} Configuration complète du restaurant
 */
export const getRestaurantConfig = () => RESTAURANT_CONFIG;
