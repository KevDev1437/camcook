import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { RestaurantProvider } from './src/contexts/RestaurantContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import { STRIPE_PUBLISHABLE_KEY } from './src/config/stripe';

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();

  // DEBUG : Log pour voir l'état de navigation
  console.log('[APP] 🔄 AppContent render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user ? { id: user.id, email: user.email, role: user.role } : null);

  if (loading) {
    console.log('[APP] ⏳ En cours de chargement...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
      </View>
    );
  }

  // MULTI-TENANT : Les owners de restaurants (rôle 'adminrestaurant') et superadmins peuvent accéder au dashboard admin
  // IMPORTANT : Utiliser les nouveaux rôles (adminrestaurant, superadmin) au lieu de 'admin'
  const isAdmin = isAuthenticated && user && (user.role === 'superadmin' || user.role === 'adminrestaurant');

  // DEBUG : Log pour comprendre la navigation
  console.log('[APP] ============================================');
  console.log('[APP] AppContent - loading:', loading);
  console.log('[APP] AppContent - isAuthenticated:', isAuthenticated);
  console.log('[APP] AppContent - user:', user ? { id: user.id, email: user.email, role: user.role } : null);
  console.log('[APP] AppContent - user?.role:', user?.role);
  console.log('[APP] AppContent - user?.role === "adminrestaurant":', user?.role === 'adminrestaurant');
  console.log('[APP] AppContent - user?.role === "superadmin":', user?.role === 'superadmin');
  console.log('[APP] AppContent - isAdmin:', isAdmin);
  console.log('[APP] AppContent - Navigation vers:', isAuthenticated ? (isAdmin ? 'AdminNavigator' : 'MainNavigator') : 'AuthNavigator');
  console.log('[APP] ============================================');

  return (
    <NavigationContainer>
      {isAuthenticated ? (isAdmin ? <AdminNavigator /> : <MainNavigator />) : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <RestaurantProvider>
          <CartProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </CartProvider>
        </RestaurantProvider>
      </AuthProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
