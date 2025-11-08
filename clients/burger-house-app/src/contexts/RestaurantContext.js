/**
 * Restaurant Context - White Label
 * 
 * Gère le restaurant de l'app (chargé automatiquement au démarrage).
 * Dans une app White Label, il n'y a qu'un seul restaurant.
 * 
 * Le restaurant est chargé automatiquement au démarrage de l'app
 * et est disponible via le hook useRestaurant() dans tous les composants.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRestaurantId } from '../config/restaurant.config';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../context/AuthContext';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Charger le restaurant au démarrage
  useEffect(() => {
    loadRestaurant();
  }, []);

  // MULTI-TENANT : Recharger le restaurant de l'owner après la connexion
  // Si l'utilisateur est adminrestaurant, charger automatiquement SON restaurant
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'adminrestaurant') {
      console.log('[RESTAURANT] 🔄 AdminRestaurant détecté - Rechargement du restaurant de l\'owner...');
      loadOwnerRestaurant();
    }
  }, [isAuthenticated, user?.role]);

  /**
   * Charger le restaurant depuis l'API
   * Utilise le restaurantId configuré dans restaurant.config.js
   * Pour les adminrestaurant, le backend trouvera automatiquement leur restaurant
   */
  const loadRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const restaurantId = getRestaurantId();
      
      if (!restaurantId) {
        throw new Error('Restaurant ID not configured. Please set RESTAURANT_ID in restaurant.config.js');
      }
      
      // Charger depuis l'API avec le header X-Restaurant-Id
      // Si l'utilisateur est adminrestaurant, le backend remplacera automatiquement par son restaurant
      const restaurantData = await restaurantService.getRestaurantInfo(restaurantId);
      
      console.log('[RESTAURANT] ✅ Restaurant chargé:', restaurantData?.name, '(ID:', restaurantData?.id, ')');
      
      setRestaurant(restaurantData);
      
      // Sauvegarder dans AsyncStorage pour accès offline
      try {
        await AsyncStorage.setItem('restaurant', JSON.stringify(restaurantData));
      } catch (storageError) {
        console.warn('Error saving restaurant to cache:', storageError);
      }
      
    } catch (err) {
      console.error('[RESTAURANT] ❌ Error loading restaurant:', err);
      setError(err.message || 'Erreur lors du chargement du restaurant');
      
      // Charger depuis le cache si disponible
      try {
        const cached = await AsyncStorage.getItem('restaurant');
        if (cached) {
          const cachedRestaurant = JSON.parse(cached);
          setRestaurant(cachedRestaurant);
          console.log('[RESTAURANT] Restaurant loaded from cache');
        }
      } catch (cacheErr) {
        console.error('Error loading cached restaurant:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger le restaurant de l'owner (pour adminrestaurant)
   * Le backend trouvera automatiquement le restaurant via Restaurant.ownerId
   */
  const loadOwnerRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pour les adminrestaurant, on peut envoyer n'importe quel restaurantId
      // Le backend le remplacera automatiquement par le restaurant de l'owner
      // On utilise le restaurantId configuré comme fallback
      const fallbackRestaurantId = getRestaurantId();
      
      console.log('[RESTAURANT] 🔄 Chargement du restaurant de l\'owner (adminrestaurant)...');
      
      // Charger depuis l'API - le backend trouvera automatiquement le restaurant de l'owner
      const restaurantData = await restaurantService.getRestaurantInfo(fallbackRestaurantId);
      
      console.log('[RESTAURANT] ✅ Restaurant de l\'owner chargé:', restaurantData?.name, '(ID:', restaurantData?.id, ')');
      
      setRestaurant(restaurantData);
      
      // Sauvegarder dans AsyncStorage pour accès offline
      try {
        await AsyncStorage.setItem('restaurant', JSON.stringify(restaurantData));
      } catch (storageError) {
        console.warn('Error saving restaurant to cache:', storageError);
      }
      
    } catch (err) {
      console.error('[RESTAURANT] ❌ Error loading owner restaurant:', err);
      setError(err.message || 'Erreur lors du chargement du restaurant de l\'owner');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recharger le restaurant (utile après une mise à jour)
   */
  const refreshRestaurant = async () => {
    await loadRestaurant();
  };

  const value = {
    restaurant,
    loading,
    error,
    refreshRestaurant,
    restaurantId: restaurant?.id || getRestaurantId(),
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte restaurant
 * 
 * @example
 * const { restaurant, restaurantId, loading } = useRestaurant();
 * 
 * @returns {Object} Contexte restaurant avec :
 * - restaurant: Données complètes du restaurant
 * - restaurantId: ID du restaurant
 * - loading: État de chargement
 * - error: Message d'erreur si erreur
 * - refreshRestaurant: Fonction pour recharger le restaurant
 */
export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

export default RestaurantContext;


