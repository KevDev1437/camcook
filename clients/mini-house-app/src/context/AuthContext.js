import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import api from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token au démarrage
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // DEBUG : Vérifier le rôle stocké
        console.log('[AUTH] 🔍 Chargement depuis AsyncStorage - Rôle:', parsedUser?.role);
        
        setToken(storedToken);
        setUser(parsedUser);
        
        // Récupérer les données fraîches depuis l'API pour avoir les images et le rôle à jour
        // Utiliser setTimeout pour ne pas bloquer le chargement initial
        setTimeout(async () => {
          try {
            const response = await api.get('/auth/me');
            if (response.data?.success && response.data.data) {
              const freshUserData = response.data.data;
              
              // DEBUG : Vérifier le rôle frais
              console.log('[AUTH] 🔍 Profil frais depuis API - Rôle:', freshUserData?.role);
              
              // Toujours mettre à jour pour avoir les données les plus récentes (y compris le rôle)
              await AsyncStorage.setItem('user', JSON.stringify(freshUserData));
              setUser(freshUserData);
              
              // DEBUG : Vérifier le rôle après rechargement
              console.log('[AUTH] ✅ Profil rechargé - Rôle:', freshUserData?.role);
            }
          } catch (profileError) {
            // Si erreur (token expiré par exemple), continuer avec les données stockées
            console.warn('[AUTH] ⚠️ Impossible de charger le profil frais:', profileError.message || profileError);
          }
        }, 100);
      }
    } catch (error) {
      console.error('[AUTH] ❌ Erreur chargement auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      // DEBUG : Voir la structure complète de la réponse
      console.log('[AUTH] 🔍 Réponse complète de login:', JSON.stringify(response, null, 2));

      if (response.success) {
        // La réponse a la structure : { success: true, data: { user, token, refreshToken } }
        const { user: userData, token: userToken } = response.data || {};

        // DEBUG : Vérifier que userData est bien défini
        if (!userData) {
          console.error('[AUTH] ❌ ERREUR: userData est undefined !');
          console.error('[AUTH] response.data:', response.data);
          return { success: false, message: 'Erreur: données utilisateur manquantes' };
        }

        // DEBUG : Vérifier que le rôle est bien présent (toujours afficher pour diagnostic)
        console.log('[AUTH] ✅ Login réussi');
        console.log('[AUTH] User data:', JSON.stringify(userData, null, 2));
        console.log('[AUTH] Rôle:', userData?.role);
        console.log('[AUTH] isAdmin:', userData?.role === 'superadmin' || userData?.role === 'adminrestaurant');

        // Vérifier que le rôle est présent
        if (!userData?.role) {
          console.warn('[AUTH] ⚠️ Rôle manquant dans la réponse de l\'API');
          console.warn('[AUTH] userData complet:', userData);
        } else {
          console.log('[AUTH] ✅ Rôle présent:', userData.role);
        }

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('token', userToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        // DEBUG : Vérifier que le rôle est bien sauvegardé
        console.log('[AUTH] 💾 Sauvegarde dans AsyncStorage - Rôle:', userData?.role);

        // Mettre à jour l'état IMMÉDIATEMENT pour que la navigation fonctionne
        setToken(userToken);
        setUser(userData);
        
        // DEBUG : Vérifier que le state est bien mis à jour
        console.log('[AUTH] ✅ State mis à jour - Rôle:', userData?.role);
        console.log('[AUTH] ✅ isAdmin:', userData?.role === 'superadmin' || userData?.role === 'adminrestaurant');

        // Recharger le profil depuis l'API pour s'assurer que le rôle est à jour
        // (en arrière-plan, ne bloque pas la navigation)
        setTimeout(async () => {
          try {
            const meResponse = await api.get('/auth/me');
            
            // DEBUG : Voir la structure complète de la réponse
            console.log('[AUTH] 🔄 Réponse /auth/me:', JSON.stringify(meResponse.data, null, 2));
            
            if (meResponse.data?.success && meResponse.data.data) {
              const freshUserData = meResponse.data.data;
              
              // DEBUG : Vérifier le rôle frais
              console.log('[AUTH] 🔄 Profil frais depuis API - Rôle:', freshUserData?.role);
              console.log('[AUTH] 🔄 Profil frais complet:', JSON.stringify(freshUserData, null, 2));
              
              // Vérifier que le rôle est présent
              if (!freshUserData?.role) {
                console.error('[AUTH] ❌ ERREUR: Rôle manquant dans /auth/me !');
                console.error('[AUTH] freshUserData:', freshUserData);
              } else {
                console.log('[AUTH] ✅ Rôle présent dans /auth/me:', freshUserData.role);
              }
              
              await AsyncStorage.setItem('user', JSON.stringify(freshUserData));
              setUser(freshUserData);
              
              console.log('[AUTH] ✅ Profil rechargé après login - Rôle:', freshUserData?.role);
              console.log('[AUTH] ✅ isAdmin après rechargement:', freshUserData?.role === 'superadmin' || freshUserData?.role === 'adminrestaurant');
            } else {
              console.warn('[AUTH] ⚠️ Réponse /auth/me invalide:', meResponse.data);
            }
          } catch (e) {
            console.warn('[AUTH] ⚠️ Erreur rechargement profil après login:', e);
            console.warn('[AUTH] ⚠️ Détails de l\'erreur:', e.response?.data || e.message);
          }
        }, 200);

        return { success: true };
      }

      return { success: false, message: response.message || 'Erreur de connexion' };
    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        message: error.message || 'Erreur de connexion au serveur'
      };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await authService.register(name, email, phone, password);

      if (response.success) {
        const { user: userData, token: userToken } = response.data;

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('token', userToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        // Mettre à jour l'état
        setToken(userToken);
        setUser(userData);

        return { success: true };
      }

      return { success: false, message: response.message || 'Erreur d\'inscription' };
    } catch (error) {
      console.error('Erreur register:', error);
      return {
        success: false,
        message: error.message || 'Erreur de connexion au serveur'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      // Mettre à jour l'état
      setUser(userData);
    } catch (error) {
      console.error('Erreur updateUser:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Export AuthContext pour utilisation directe
export { AuthContext };

