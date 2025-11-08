import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getRestaurantId } from './restaurant.config';

// API Configuration - Utilise les variables d'environnement
// L'URL de l'API peut être configurée via la variable d'environnement API_URL
const API_URL_FROM_ENV = process.env.API_URL || Constants.expoConfig?.extra?.apiUrl;

// IP WiFi locale pour le développement (optionnel)
const WIFI_IP_FROM_ENV = process.env.WIFI_IP || Constants.expoConfig?.extra?.wifiIp || '192.168.129.10';

const getApiUrl = () => {
  // Si une URL API est fournie via variable d'environnement ET qu'elle n'est pas localhost
  // (localhost ne fonctionne pas sur appareil physique ou émulateur)
  if (API_URL_FROM_ENV && !API_URL_FROM_ENV.includes('localhost')) {
    return API_URL_FROM_ENV;
  }
  
  // Détection automatique de l'environnement
  // Si on utilise Expo Go sur appareil physique
  if (Constants.appOwnership === 'expo') {
    // Utiliser l'IP WiFi si fournie, sinon utiliser la valeur par défaut
    return `http://${WIFI_IP_FROM_ENV}:5000/api`;
  }
  
  // Si émulateur Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api'; // Alias localhost pour Android Emulator
  }
  
  // Si iOS Simulator
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  }
  
  // Par défaut (web, etc.) - utiliser l'IP WiFi si fournie
  if (WIFI_IP_FROM_ENV) {
    return `http://${WIFI_IP_FROM_ENV}:5000/api`;
  }
  
  // Fallback : utiliser l'URL de l'environnement si disponible
  if (API_URL_FROM_ENV) {
    return API_URL_FROM_ENV;
  }
  
  // Dernier fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Augmenter le timeout pour les uploads d'images
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxBodyLength: 10 * 1024 * 1024, // 10MB
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// INTERCEPTEUR DE REQUÊTE
// Ajoute automatiquement restaurantId et token
// IMPORTANT : Cet intercepteur s'exécute AVANT toute requête API
// ============================================
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Ajouter X-Restaurant-Id dans TOUTES les requêtes (MULTI-TENANT)
      // Le restaurantId vient de restaurant.config.js et est toujours disponible
      // Même si RestaurantContext n'est pas encore chargé
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        config.headers['X-Restaurant-Id'] = restaurantId.toString();
      } else {
        console.warn('[API] ⚠️ Restaurant ID non configuré dans restaurant.config.js');
      }

      // 2. Ajouter le token d'authentification si disponible
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log pour debug (en développement uniquement)
      if (__DEV__) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - RestaurantId: ${restaurantId || 'NON CONFIGURÉ'}`);
      }

      return config;
    } catch (error) {
      console.error('[API] ❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTEUR DE RÉPONSE
// Gère les erreurs API et les erreurs multi-tenant
// ============================================
api.interceptors.response.use(
  (response) => {
    // Log de succès en développement
    if (__DEV__) {
      console.log(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const url = error.config?.url;

      // Log détaillé en développement
      if (__DEV__) {
        console.error('[API] ❌ Error Response:', {
          status,
          data,
          url,
        });
      }

      // Gestion spécifique des erreurs multi-tenant
      if (status === 400 && data?.message === 'Restaurant ID required') {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant ID manquant. Vérifiez restaurant.config.js');
      } else if (status === 404 && data?.message === 'Restaurant not found') {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant introuvable. Vérifiez que le restaurantId dans restaurant.config.js existe dans la base de données.');
      } else if (status === 403 && data?.message?.includes('Subscription')) {
        console.error('❌ ERREUR MULTI-TENANT: Abonnement expiré ou inactif. Contactez le support.');
      } else if (status === 403 && data?.message?.includes('inactive')) {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant inactif. Contactez le support.');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('[API] ❌ Network Error:', error.message);
      console.error('⚠️ Vérifiez que le backend est démarré et accessible sur:', API_BASE_URL);
      console.error('💡 Si vous êtes sur un émulateur Android, utilisez: http://10.0.2.2:5000/api');
      console.error('💡 Si vous êtes sur un appareil physique, vérifiez votre IP WiFi dans api.js');
    } else {
      // Error setting up the request
      console.error('[API] ❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
