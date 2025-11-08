/**
 * Theme Configuration - White Label
 * 
 * Ce fichier centralise les couleurs du thème pour l'app.
 * Les couleurs peuvent venir de :
 * 1. restaurant.config.js (couleurs configurées lors de la génération de l'app)
 * 2. restaurant.settings (couleurs stockées dans la base de données)
 * 3. Valeurs par défaut si aucune couleur n'est configurée
 */

import { getRestaurantConfig } from './restaurant.config';

/**
 * Récupère les couleurs du thème
 * Priorité : restaurant.settings > restaurant.config.js > valeurs par défaut
 * 
 * @param {Object} restaurant - Objet restaurant depuis RestaurantContext (optionnel)
 * @returns {Object} - { primary, secondary }
 */
export const getThemeColors = (restaurant = null) => {
  // 1. Priorité : couleurs depuis restaurant.settings (si restaurant est chargé depuis l'API)
  if (restaurant?.settings?.theme) {
    return {
      primary: restaurant.settings.theme.primary || '#FF6B6B',
      secondary: restaurant.settings.theme.secondary || '#4ECDC4',
    };
  }

  // 2. Fallback : couleurs depuis restaurant.config.js
  const config = getRestaurantConfig();
  if (config?.theme) {
    return {
      primary: config.theme.primary || '#FF6B6B',
      secondary: config.theme.secondary || '#4ECDC4',
    };
  }

  // 3. Valeurs par défaut
  return {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
  };
};

/**
 * Hook pour utiliser les couleurs du thème dans les composants
 * 
 * @example
 * import { useTheme } from '../config/theme';
 * const { primary, secondary } = useTheme();
 * 
 * @param {Object} restaurant - Objet restaurant depuis RestaurantContext (optionnel)
 * @returns {Object} - { primary, secondary }
 */
export const useTheme = (restaurant = null) => {
  return getThemeColors(restaurant);
};

/**
 * Couleurs par défaut (pour compatibilité)
 */
export const DEFAULT_THEME = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
};

