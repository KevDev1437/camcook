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
 * @returns {Object} - { primary, secondary, error, success, warning, text, background }
 */
export const getThemeColors = (restaurant = null) => {
  // Valeurs par défaut complètes
  const defaultTheme = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    text: {
      primary: '#333',
      secondary: '#666',
      tertiary: '#999',
    },
    background: {
      light: '#f5f5f5',
      lighter: '#fafafa',
      border: '#eee',
      white: '#fff',
    },
  };

  // 1. Priorité : couleurs depuis restaurant.settings (si restaurant est chargé depuis l'API)
  if (restaurant?.settings?.theme) {
    const theme = restaurant.settings.theme;
    return {
      primary: theme.primary || defaultTheme.primary,
      secondary: theme.secondary || defaultTheme.secondary,
      error: theme.error || defaultTheme.error,
      success: theme.success || defaultTheme.success,
      warning: theme.warning || defaultTheme.warning,
      text: {
        primary: (theme.text?.primary && typeof theme.text.primary === 'string') ? theme.text.primary : defaultTheme.text.primary,
        secondary: (theme.text?.secondary && typeof theme.text.secondary === 'string') ? theme.text.secondary : defaultTheme.text.secondary,
        tertiary: (theme.text?.tertiary && typeof theme.text.tertiary === 'string') ? theme.text.tertiary : defaultTheme.text.tertiary,
      },
      background: {
        light: (theme.background?.light && typeof theme.background.light === 'string') ? theme.background.light : defaultTheme.background.light,
        lighter: (theme.background?.lighter && typeof theme.background.lighter === 'string') ? theme.background.lighter : defaultTheme.background.lighter,
        border: (theme.background?.border && typeof theme.background.border === 'string') ? theme.background.border : defaultTheme.background.border,
        white: (theme.background?.white && typeof theme.background.white === 'string') ? theme.background.white : defaultTheme.background.white,
      },
    };
  }

  // 2. Fallback : couleurs depuis restaurant.config.js
  const config = getRestaurantConfig();
  if (config?.theme) {
    const theme = config.theme;
    return {
      primary: theme.primary || defaultTheme.primary,
      secondary: theme.secondary || defaultTheme.secondary,
      error: theme.error || defaultTheme.error,
      success: theme.success || defaultTheme.success,
      warning: theme.warning || defaultTheme.warning,
      text: {
        primary: (theme.text?.primary && typeof theme.text.primary === 'string') ? theme.text.primary : defaultTheme.text.primary,
        secondary: (theme.text?.secondary && typeof theme.text.secondary === 'string') ? theme.text.secondary : defaultTheme.text.secondary,
        tertiary: (theme.text?.tertiary && typeof theme.text.tertiary === 'string') ? theme.text.tertiary : defaultTheme.text.tertiary,
      },
      background: {
        light: (theme.background?.light && typeof theme.background.light === 'string') ? theme.background.light : defaultTheme.background.light,
        lighter: (theme.background?.lighter && typeof theme.background.lighter === 'string') ? theme.background.lighter : defaultTheme.background.lighter,
        border: (theme.background?.border && typeof theme.background.border === 'string') ? theme.background.border : defaultTheme.background.border,
        white: (theme.background?.white && typeof theme.background.white === 'string') ? theme.background.white : defaultTheme.background.white,
      },
    };
  }

  // 3. Valeurs par défaut
  return defaultTheme;
};

/**
 * Hook pour utiliser les couleurs du thème dans les composants
 * 
 * @example
 * import { useTheme } from '../config/theme';
 * const { primary, secondary, error, success, warning, text, background } = useTheme();
 * 
 * @param {Object} restaurant - Objet restaurant depuis RestaurantContext (optionnel)
 * @returns {Object} - { primary, secondary, error, success, warning, text, background }
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
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  text: {
    primary: '#333',
    secondary: '#666',
    tertiary: '#999',
  },
  background: {
    light: '#f5f5f5',
    lighter: '#fafafa',
    border: '#eee',
    white: '#fff',
  },
};

