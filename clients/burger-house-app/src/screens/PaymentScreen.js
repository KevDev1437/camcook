import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import * as paymentService from '../services/paymentService';
import { orderService } from '../services/orderService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNotifications } from '../context/NotificationContext';

const PaymentScreen = ({ navigation, route }) => {
  const { initPaymentSheet, presentPaymentSheet, isPlatformPaySupported } = useStripe();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const { restaurant } = useRestaurant();
  const { notifications, notificationCount } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'apple_pay', 'google_pay'
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [orderGroupId, setOrderGroupId] = useState(null);
  const [orderIds, setOrderIds] = useState([]); // Tableau des IDs de commandes créées

  // Options de paiement depuis la route (si disponibles)
  const orderData = route?.params?.orderData || null;

  // Vérifier le support Apple Pay / Google Pay
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  useEffect(() => {
    // Vérifier le support des paiements mobiles avec la nouvelle API
    const checkPlatformPaySupport = async () => {
      try {
        // Vérifier si la fonction existe
        if (!isPlatformPaySupported || typeof isPlatformPaySupported !== 'function') {
          // Si la fonction n'existe pas, désactiver les paiements mobiles
          setApplePayAvailable(false);
          setGooglePayAvailable(false);
          return;
        }

        if (Platform.OS === 'ios') {
          const supported = await isPlatformPaySupported({
            applePay: true,
          });
          setApplePayAvailable(supported || false);
        } else if (Platform.OS === 'android') {
          const supported = await isPlatformPaySupported({
            googlePay: {
              testEnv: __DEV__,
              existingPaymentMethodRequired: false,
            },
          });
          setGooglePayAvailable(supported || false);
        }
      } catch (error) {
        // Si la fonction n'est pas disponible ou si une erreur survient, désactiver les paiements mobiles
        setApplePayAvailable(false);
        setGooglePayAvailable(false);
      }
    };

    checkPlatformPaySupport();
  }, []);

  // Créer la commande et préparer le paiement
  const preparePayment = async (selectedMethod) => {
    try {
      setLoading(true);

      // Créer la commande d'abord
      const orderPayload = orderData || {
        items: items.map(it => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          price: Number(it.price) || 0,
          options: it.options || {},
        })),
        subtotal: Number(total) || 0,
        deliveryFee: 0,
        tax: 0,
        total: Number(total) || 0,
        orderType: 'pickup',
        address: {},
        notes: null,
      };

      const orderRes = await orderService.createOrder(orderPayload);
      
      // Le backend retourne maintenant un groupe de commandes
      const orderGroupId = orderRes?.orderGroupId;
      const createdOrders = orderRes?.orders || [];
      const orderIds = createdOrders.map(o => o.id);

      setOrderGroupId(orderGroupId);
      setOrderIds(orderIds);

      // Créer UN SEUL Payment Intent pour le montant total
      // Le paymentIntentId sera associé à toutes les commandes du groupe
      let paymentIntent;
      if (selectedMethod === 'apple_pay') {
        paymentIntent = await paymentService.createApplePayIntent(total, null, orderGroupId);
      } else if (selectedMethod === 'google_pay') {
        paymentIntent = await paymentService.createGooglePayIntent(total, null, orderGroupId);
      } else {
        paymentIntent = await paymentService.createPaymentIntent(total, null, orderGroupId);
      }

      setClientSecret(paymentIntent.data.clientSecret);
      setPaymentIntentId(paymentIntent.data.paymentIntentId);

      return paymentIntent.data;
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de préparer le paiement');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Paiement avec carte bancaire
  const handleCardPayment = async () => {
    try {
      setLoading(true);
      setPaymentMethod('card');

      const paymentData = await preparePayment('card');

      // Initialiser le Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: restaurant?.name || 'Restaurant',
        paymentIntentClientSecret: paymentData.clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: `${restaurant?.slug || 'camcook'}://payment-return`,
        applePay: Platform.OS === 'ios' && applePayAvailable ? {
          merchantCountryCode: 'FR',
        } : undefined,
        googlePay: Platform.OS === 'android' && googlePayAvailable ? {
          merchantCountryCode: 'FR',
          testEnv: __DEV__,
        } : undefined,
      });

      if (initError) {
        Alert.alert('Erreur', initError.message || 'Impossible d\'initialiser le paiement');
        return;
      }

      // Afficher le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur', presentError.message || 'Le paiement a échoué');
        }
        return;
      }

      // Paiement réussi
      await handlePaymentSuccess();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Paiement avec Apple Pay
  const handleApplePay = async () => {
    try {
      setLoading(true);
      setPaymentMethod('apple_pay');

      if (!applePayAvailable) {
        Alert.alert('Apple Pay non disponible', 'Apple Pay n\'est pas disponible sur cet appareil');
        return;
      }

      const paymentData = await preparePayment('apple_pay');

      // Initialiser le Payment Sheet avec Apple Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: restaurant?.name || 'Restaurant',
        paymentIntentClientSecret: paymentData.clientSecret,
        applePay: {
          merchantCountryCode: 'FR',
        },
        allowsDelayedPaymentMethods: true,
        returnURL: `${restaurant?.slug || 'camcook'}://payment-return`,
        googlePay: undefined, // Désactiver Google Pay pour Apple Pay
      });

      if (initError) {
        Alert.alert('Erreur', initError.message || 'Impossible d\'initialiser Apple Pay');
        return;
      }

      // Afficher le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur', presentError.message || 'Le paiement Apple Pay a échoué');
        }
        return;
      }

      // Paiement réussi
      await handlePaymentSuccess();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors du paiement Apple Pay');
    } finally {
      setLoading(false);
    }
  };

  // Paiement avec Google Pay
  const handleGooglePay = async () => {
    try {
      setLoading(true);
      setPaymentMethod('google_pay');

      if (!googlePayAvailable) {
        Alert.alert('Google Pay non disponible', 'Google Pay n\'est pas disponible sur cet appareil');
        return;
      }

      const paymentData = await preparePayment('google_pay');

      // Initialiser le Payment Sheet avec Google Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: restaurant?.name || 'Restaurant',
        paymentIntentClientSecret: paymentData.clientSecret,
        googlePay: {
          merchantCountryCode: 'FR',
          testEnv: __DEV__, // Mode test en développement
        },
        allowsDelayedPaymentMethods: true,
        returnURL: `${restaurant?.slug || 'camcook'}://payment-return`,
        applePay: undefined, // Désactiver Apple Pay pour Google Pay
      });

      if (initError) {
        Alert.alert('Erreur', initError.message || 'Impossible d\'initialiser Google Pay');
        return;
      }

      // Afficher le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur', presentError.message || 'Le paiement Google Pay a échoué');
        }
        return;
      }

      // Paiement réussi
      await handlePaymentSuccess();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors du paiement Google Pay');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le succès du paiement
  const handlePaymentSuccess = async () => {
    try {
      // Confirmer le paiement pour toutes les commandes du groupe
      if (paymentIntentId && orderGroupId) {
        await paymentService.confirmPayment(paymentIntentId, null, orderGroupId);
      }

      // Vider le panier
      clear();

      const orderCount = orderIds.length;
      Alert.alert(
        'Paiement réussi',
        orderCount > 1
          ? `${orderCount} commandes ont été créées et payées avec succès.`
          : 'Votre commande a été confirmée et payée avec succès.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Avertissement', 'Le paiement a été effectué mais la confirmation a échoué. Contactez le support si nécessaire.');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => navigation.navigate('Cart')}
        cartCount={0}
        notifications={notifications}
        notificationCount={notificationCount}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Paiement</Text>
          <Text style={styles.subtitle}>Montant total: {total.toFixed(2)} €</Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Choisissez votre mode de paiement</Text>

          {/* Carte bancaire */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
            onPress={handleCardPayment}
            disabled={loading}
          >
            <MaterialIcons name="credit-card" size={32} color="#22c55e" />
            <View style={styles.paymentOptionText}>
              <Text style={styles.paymentOptionTitle}>Carte bancaire</Text>
              <Text style={styles.paymentOptionSubtitle}>Visa, Mastercard, American Express</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Apple Pay (iOS uniquement) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'apple_pay' && styles.paymentOptionSelected,
                !applePayAvailable && styles.paymentOptionDisabled,
              ]}
              onPress={handleApplePay}
              disabled={loading || !applePayAvailable}
            >
              <MaterialIcons name="apple" size={32} color="#000" />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Apple Pay</Text>
                <Text style={styles.paymentOptionSubtitle}>
                  {applePayAvailable ? 'Paiement rapide et sécurisé' : 'Non disponible sur cet appareil'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          )}

          {/* Google Pay (Android uniquement) */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'google_pay' && styles.paymentOptionSelected,
                !googlePayAvailable && styles.paymentOptionDisabled,
              ]}
              onPress={handleGooglePay}
              disabled={loading || !googlePayAvailable}
            >
              <MaterialIcons name="account-balance-wallet" size={32} color="#4285F4" />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Google Pay</Text>
                <Text style={styles.paymentOptionSubtitle}>
                  {googlePayAvailable ? 'Paiement rapide et sécurisé' : 'Non disponible sur cet appareil'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Traitement du paiement...</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#666" />
          <Text style={styles.infoText}>
            Votre paiement est sécurisé et crypté. Aucune information bancaire n'est stockée sur nos serveurs.
          </Text>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default PaymentScreen;

